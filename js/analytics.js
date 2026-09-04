// Analytics Engine: Readiness Scoring, Hours Aggregations, Pace & Reminders

/**
 * Calculates total hours studied for a specific goal or overall.
 */
export function calculateStudyHours(sessions, goalId = null) {
  const filtered = goalId ? sessions.filter(s => s.goalId === goalId) : sessions;
  const totalMinutes = filtered.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  return {
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    sessionCount: filtered.length
  };
}

/**
 * Calculates hours studied in the current calendar week (Monday - Sunday).
 */
export function calculateWeeklyHours(sessions, goalId = null) {
  const now = new Date();
  const day = now.getDay();
  // Distance to Monday (0 is Sunday, 1 is Monday... 6 is Saturday)
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weeklySessions = sessions.filter(s => {
    if (goalId && s.goalId !== goalId) return false;
    const sessionDate = new Date(s.date + 'T00:00:00');
    return sessionDate >= monday && sessionDate <= sunday;
  });

  const minutes = weeklySessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const hours = Number((minutes / 60).toFixed(1));

  // Current day of week progress (1 to 7)
  const dayOfWeek = day === 0 ? 7 : day;
  const expectedPaceRatio = dayOfWeek / 7;

  return {
    hours,
    minutes,
    dayOfWeek,
    expectedPaceRatio,
    sessionCount: weeklySessions.length
  };
}

/**
 * Computes comprehensive Exam Readiness Score (0 - 100%)
 * Factors:
 * 1. Hours Progress (40 pts)
 * 2. Practice Quiz Performance (35 pts)
 * 3. Domain Topic Breadth (15 pts)
 * 4. Pace vs Exam Proximity (10 pts)
 */
export function calculateExamReadiness(goal, sessions, quizHistory, certification) {
  if (!goal) return { score: 0, status: 'Not Started', breakdown: {} };

  const { totalHours } = calculateStudyHours(sessions, goal.id);
  const targetHours = Number(goal.targetHours) || 80;

  // 1. Hours Progress Component (Max 40 pts)
  const hoursRatio = Math.min(totalHours / targetHours, 1.25);
  const hoursPoints = Math.min(40, Math.round(hoursRatio * 40));

  // 2. Practice Quiz Component (Max 35 pts)
  const certQuizzes = quizHistory.filter(q => q.certId === goal.certId);
  let quizAvg = 0;
  let quizPoints = 0;
  if (certQuizzes.length > 0) {
    const sumScores = certQuizzes.reduce((acc, q) => acc + q.score, 0);
    quizAvg = Math.round(sumScores / certQuizzes.length);
    quizPoints = Math.round((quizAvg / 100) * 35);
  } else {
    // Default baseline points tied gently to study progress (up to 20 pts)
    quizPoints = Math.round(Math.min(hoursRatio, 1) * 20);
    quizAvg = null;
  }

  // 3. Domain Coverage Component (Max 15 pts)
  const totalDomains = (certification && certification.domains) ? certification.domains.length : 4;
  const goalSessions = sessions.filter(s => s.goalId === goal.id);
  const studiedDomains = new Set(goalSessions.map(s => s.domain).filter(Boolean));
  const domainRatio = totalDomains > 0 ? Math.min(studiedDomains.size / totalDomains, 1) : 0.5;
  const domainPoints = Math.round(domainRatio * 15);

  // 4. Pace vs Exam Date Component (Max 10 pts)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let pacePoints = 8; // default healthy baseline
  let daysUntilExam = null;

  if (goal.targetDate) {
    const examDate = new Date(goal.targetDate + 'T00:00:00');
    const diffTime = examDate.getTime() - today.getTime();
    daysUntilExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntilExam <= 0) {
      pacePoints = totalHours >= targetHours ? 10 : 3;
    } else {
      const remainingHours = Math.max(0, targetHours - totalHours);
      const hoursPerDayNeeded = remainingHours / daysUntilExam;
      if (hoursPerDayNeeded <= 1.5) {
        pacePoints = 10;
      } else if (hoursPerDayNeeded <= 3.0) {
        pacePoints = 7;
      } else {
        pacePoints = 4;
      }
    }
  }

  const rawScore = hoursPoints + quizPoints + domainPoints + pacePoints;
  const finalScore = Math.min(100, Math.max(0, rawScore));

  let status = 'Early Stage';
  let badgeColor = 'var(--text-muted)';
  if (finalScore >= 85) {
    status = 'Exam Ready! 🎯';
    badgeColor = 'var(--color-success)';
  } else if (finalScore >= 70) {
    status = 'Strong Candidate 🚀';
    badgeColor = 'var(--color-primary)';
  } else if (finalScore >= 50) {
    status = 'Solid Progress 📈';
    badgeColor = 'var(--color-warning)';
  } else {
    status = 'Foundation Building 🌱';
    badgeColor = 'var(--color-accent)';
  }

  return {
    score: finalScore,
    status,
    badgeColor,
    daysUntilExam,
    hoursStudied: totalHours,
    targetHours,
    quizAvg,
    quizAttemptsCount: certQuizzes.length,
    studiedDomainsCount: studiedDomains.size,
    totalDomainsCount: totalDomains,
    breakdown: {
      hoursPoints,
      quizPoints,
      domainPoints,
      pacePoints
    }
  };
}

/**
 * Generates smart reminder notifications based on exam date proximity and weekly goals
 */
export function getSmartReminders(goals, sessions) {
  const reminders = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const goal of goals) {
    if (goal.status === 'passed') continue;

    // Check Exam Proximity
    if (goal.targetDate) {
      const examDate = new Date(goal.targetDate + 'T00:00:00');
      const diffDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const { totalHours } = calculateStudyHours(sessions, goal.id);
      const remainingHours = Math.max(0, (goal.targetHours || 80) - totalHours);

      if (diffDays > 0 && diffDays <= 30) {
        const dailyRate = (remainingHours / diffDays).toFixed(1);
        reminders.push({
          id: 'rem_exam_' + goal.id,
          type: diffDays <= 14 ? 'urgent' : 'warning',
          icon: diffDays <= 14 ? '⏳' : '📅',
          title: `${goal.certName}: Exam in ${diffDays} days!`,
          message: `You have ${remainingHours.toFixed(1)} hrs left to reach your target. We recommend studying ~${dailyRate} hrs/day.`,
          goalId: goal.id
        });
      } else if (diffDays <= 0) {
        reminders.push({
          id: 'rem_exam_due_' + goal.id,
          type: 'urgent',
          icon: '🎓',
          title: `${goal.certName}: Target Exam Date Reached!`,
          message: 'Did you sit for the exam? Update your goal status or schedule your next test milestone.',
          goalId: goal.id
        });
      }
    }

    // Check Weekly Goal
    if (goal.weeklyHourTarget) {
      const weekly = calculateWeeklyHours(sessions, goal.id);
      const target = Number(goal.weeklyHourTarget);
      const expectedSoFar = target * weekly.expectedPaceRatio;

      // If mid-week or later and significantly below pace
      if (weekly.dayOfWeek >= 3 && weekly.hours < expectedSoFar * 0.7) {
        const needed = Math.max(0, target - weekly.hours).toFixed(1);
        reminders.push({
          id: 'rem_weekly_' + goal.id,
          type: 'info',
          icon: '⏰',
          title: `Weekly Pace Alert: ${goal.certName}`,
          message: `Logged ${weekly.hours}h of your ${target}h weekly target. Need ${needed}h more before Sunday night!`,
          goalId: goal.id
        });
      }
    }
  }

  return reminders;
}

/**
 * Compares user's study velocity against industry averages
 */
export function getBenchmarkComparison(goal, sessions, cert) {
  if (!goal || !cert) return null;

  const { totalHours } = calculateStudyHours(sessions, goal.id);
  const avgWeeks = cert.avgWeeksToCertify || 10;
  const avgWeekly = cert.avgHoursPerWeek || 9;
  const avgTotal = avgWeeks * avgWeekly;

  const weekly = calculateWeeklyHours(sessions, goal.id);
  const userPaceWeekly = weekly.hours > 0 ? weekly.hours : (goal.weeklyHourTarget || 8);
  const projectedWeeks = userPaceWeekly > 0 ? Math.ceil((goal.targetHours - totalHours) / userPaceWeekly) : 12;

  let assessment = 'On Track';
  let badgeClass = 'badge-primary';
  if (userPaceWeekly >= avgWeekly * 1.2) {
    assessment = 'Accelerated Velocity ⚡ (Fast Track)';
    badgeClass = 'badge-success';
  } else if (userPaceWeekly >= avgWeekly * 0.8) {
    assessment = 'Industry Standard Pace 📊';
    badgeClass = 'badge-info';
  } else {
    assessment = 'Extended / Flexible Pace 🧘';
    badgeClass = 'badge-warning';
  }

  return {
    certName: cert.name,
    avgWeeks,
    avgWeekly,
    avgTotal,
    userWeeklyPace: userPaceWeekly,
    projectedWeeksRemaining: Math.max(1, projectedWeeks),
    assessment,
    badgeClass
  };
}
