// CertTracker Global State Manager with LocalStorage Persistence
import {
  DEFAULT_CERTIFICATIONS,
  DEFAULT_BADGES,
  INITIAL_USER,
  getInitialGoals,
  getInitialSessions,
  SPRINT_1_STORIES,
  INITIAL_BURNDOWN_DAYS,
  INITIAL_RETROSPECTIVE
} from './data/seedData.js';

const STORAGE_KEY = 'certtracker_app_state_v1';

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
  }

  loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Guarantee backwards compatibility / schema integrity
        return {
          user: parsed.user || INITIAL_USER,
          isLoggedIn: parsed.isLoggedIn !== undefined ? parsed.isLoggedIn : true,
          theme: parsed.theme || 'dark',
          certifications: parsed.certifications || DEFAULT_CERTIFICATIONS,
          goals: parsed.goals || getInitialGoals(),
          sessions: parsed.sessions || getInitialSessions(),
          badges: parsed.badges || DEFAULT_BADGES,
          quizHistory: parsed.quizHistory || [
            {
              id: 'qh_1',
              certId: 'aws-saa',
              certName: 'AWS Certified Solutions Architect',
              score: 80,
              correct: 4,
              total: 5,
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          ],
          sprintStories: parsed.sprintStories || SPRINT_1_STORIES,
          burndownDays: parsed.burndownDays || INITIAL_BURNDOWN_DAYS,
          retrospective: parsed.retrospective || INITIAL_RETROSPECTIVE,
          studyGroups: parsed.studyGroups || [
            {
              id: 'grp_aws',
              certId: 'aws-saa',
              name: 'AWS Cloud Architects Hub',
              membersCount: 142,
              activeNow: 18,
              description: 'Solutions architect candidates preparing for SAA-C03. Weekly practice review and lab discussions.'
            },
            {
              id: 'grp_pmp',
              certId: 'pmp',
              name: 'PMP Agile & Predictive Squad',
              membersCount: 98,
              activeNow: 11,
              description: 'Targeting 2026 PMP certifications. EVM formulas, servant leadership drills, and mock reviews.'
            },
            {
              id: 'grp_sec',
              certId: 'comptia-sec',
              name: 'Security+ Cyber Defense Circle',
              membersCount: 84,
              activeNow: 9,
              description: 'SY0-701 acronym flashcards, performance-based questions (PBQs), and attack vector defense.'
            }
          ]
        };
      }
    } catch (e) {
      console.warn('Could not read localStorage state, initializing fresh state:', e);
    }

    return {
      user: INITIAL_USER,
      isLoggedIn: true,
      theme: 'dark',
      certifications: DEFAULT_CERTIFICATIONS,
      goals: getInitialGoals(),
      sessions: getInitialSessions(),
      badges: DEFAULT_BADGES,
      quizHistory: [
        {
          id: 'qh_1',
          certId: 'aws-saa',
          certName: 'AWS Certified Solutions Architect',
          score: 80,
          correct: 4,
          total: 5,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      sprintStories: SPRINT_1_STORIES,
      burndownDays: INITIAL_BURNDOWN_DAYS,
      retrospective: INITIAL_RETROSPECTIVE,
      studyGroups: [
        {
          id: 'grp_aws',
          certId: 'aws-saa',
          name: 'AWS Cloud Architects Hub',
          membersCount: 142,
          activeNow: 18,
          description: 'Solutions architect candidates preparing for SAA-C03. Weekly practice review and lab discussions.'
        },
        {
          id: 'grp_pmp',
          certId: 'pmp',
          name: 'PMP Agile & Predictive Squad',
          membersCount: 98,
          activeNow: 11,
          description: 'Targeting 2026 PMP certifications. EVM formulas, servant leadership drills, and mock reviews.'
        },
        {
          id: 'grp_sec',
          certId: 'comptia-sec',
          name: 'Security+ Cyber Defense Circle',
          membersCount: 84,
          activeNow: 9,
          description: 'SY0-701 acronym flashcards, performance-based questions (PBQs), and attack vector defense.'
        }
      ]
    };
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error in state subscriber:', err);
      }
    }
  }

  // --- Theme Management ---
  setTheme(theme) {
    this.state.theme = theme;
    this.saveState();
  }

  toggleTheme() {
    const next = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  // --- Auth & User ---
  setUser(user) {
    this.state.user = user;
    this.state.isLoggedIn = true;
    this.saveState();
  }

  logout() {
    this.state.isLoggedIn = false;
    this.saveState();
  }

  login(email, name = 'Study Pro') {
    this.state.isLoggedIn = true;
    this.state.user = {
      ...this.state.user,
      email,
      name: name || email.split('@')[0]
    };
    this.saveState();
  }

  // --- Goals Management ---
  addGoal(goalData) {
    const newGoal = {
      id: 'goal_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      resources: [],
      ...goalData
    };
    this.state.goals.unshift(newGoal);
    this.checkBadges();
    this.saveState();
    return newGoal;
  }

  updateGoal(id, updates) {
    const idx = this.state.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.state.goals[idx] = { ...this.state.goals[idx], ...updates };
      this.checkBadges();
      this.saveState();
      return this.state.goals[idx];
    }
    return null;
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    // Optionally delete associated sessions or keep them
    this.saveState();
  }

  markGoalStatus(id, status) {
    const goal = this.state.goals.find(g => g.id === id);
    if (goal) {
      goal.status = status;
      if (status === 'passed') {
        this.unlockBadge('first_pass');
      }
      this.saveState();
    }
  }

  addGoalResource(goalId, resource) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal) {
      if (!goal.resources) goal.resources = [];
      const newRes = {
        id: 'res_' + Date.now(),
        ...resource
      };
      goal.resources.push(newRes);
      this.saveState();
      return newRes;
    }
    return null;
  }

  deleteGoalResource(goalId, resourceId) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (goal && goal.resources) {
      goal.resources = goal.resources.filter(r => r.id !== resourceId);
      this.saveState();
    }
  }

  // --- Study Sessions Management ---
  addSession(sessionData) {
    const newSession = {
      id: 'sess_' + Date.now(),
      ...sessionData
    };
    this.state.sessions.unshift(newSession);
    this.checkBadges();
    this.saveState();
    return newSession;
  }

  updateSession(id, updates) {
    const idx = this.state.sessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.state.sessions[idx] = { ...this.state.sessions[idx], ...updates };
      this.checkBadges();
      this.saveState();
      return this.state.sessions[idx];
    }
    return null;
  }

  deleteSession(id) {
    this.state.sessions = this.state.sessions.filter(s => s.id !== id);
    this.checkBadges();
    this.saveState();
  }

  // --- Quiz History ---
  addQuizAttempt(attempt) {
    const newAttempt = {
      id: 'qa_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...attempt
    };
    this.state.quizHistory.unshift(newAttempt);
    if (newAttempt.score >= 90) {
      this.unlockBadge('quiz_ace');
    }
    this.checkBadges();
    this.saveState();
    return newAttempt;
  }

  // --- Badges Engine ---
  unlockBadge(badgeId) {
    const badge = this.state.badges.find(b => b.id === badgeId);
    if (badge && !badge.unlockedAt) {
      badge.unlockedAt = new Date().toISOString().split('T')[0];
      return badge;
    }
    return null;
  }

  checkBadges() {
    const sessions = this.state.sessions;
    const totalMinutes = sessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
    const totalHours = totalMinutes / 60;

    // First session badge
    if (sessions.length > 0) {
      this.unlockBadge('first_session');
    }

    // Hours badges
    if (totalHours >= 10) this.unlockBadge('hours_10');
    if (totalHours >= 50) this.unlockBadge('hours_50');
    if (totalHours >= 100) this.unlockBadge('hours_100');

    // Calculate streak
    const streak = this.calculateStreak();
    if (streak >= 3) this.unlockBadge('streak_3');
    if (streak >= 7) this.unlockBadge('streak_7');
  }

  calculateStreak() {
    const sessionDates = new Set(this.state.sessions.map(s => s.date));
    if (sessionDates.size === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fmtDate = (d) => d.toISOString().split('T')[0];
    const todayStr = fmtDate(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = fmtDate(yesterday);

    // Current streak is active if user studied today OR yesterday
    let checkDate = new Date(today);
    if (!sessionDates.has(todayStr)) {
      if (sessionDates.has(yesterdayStr)) {
        checkDate = new Date(yesterday);
      } else {
        return 0; // Streak broken
      }
    }

    let streak = 0;
    while (sessionDates.has(fmtDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }

  // --- Sprint Hub & Agile Backlog Management ---
  updateSprintStoryStatus(storyId, status) {
    const story = this.state.sprintStories.find(s => s.id === storyId);
    if (story) {
      story.status = status;
      this.saveState();
    }
  }

  updateBurndownDay(dayIndex, actualPoints) {
    if (this.state.burndownDays[dayIndex]) {
      this.state.burndownDays[dayIndex].actual = Number(actualPoints);
      this.saveState();
    }
  }

  addRetrospectiveItem(category, text) {
    if (this.state.retrospective[category]) {
      this.state.retrospective[category].push(text);
      this.saveState();
    }
  }

  // --- Admin: Manage Supported Certifications ---
  addSupportedCert(cert) {
    const newCert = {
      id: 'cert_' + Date.now(),
      domains: [],
      suggestedResources: [],
      ...cert
    };
    this.state.certifications.push(newCert);
    this.saveState();
    return newCert;
  }

  updateSupportedCert(id, updates) {
    const idx = this.state.certifications.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.state.certifications[idx] = { ...this.state.certifications[idx], ...updates };
      this.saveState();
      return this.state.certifications[idx];
    }
    return null;
  }

  deleteSupportedCert(id) {
    this.state.certifications = this.state.certifications.filter(c => c.id !== id);
    this.saveState();
  }

  // --- Reset & Import/Export ---
  resetToDefaults() {
    this.state = {
      user: INITIAL_USER,
      isLoggedIn: true,
      theme: 'dark',
      certifications: DEFAULT_CERTIFICATIONS,
      goals: getInitialGoals(),
      sessions: getInitialSessions(),
      badges: DEFAULT_BADGES,
      quizHistory: [
        {
          id: 'qh_1',
          certId: 'aws-saa',
          certName: 'AWS Certified Solutions Architect',
          score: 80,
          correct: 4,
          total: 5,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ],
      sprintStories: SPRINT_1_STORIES,
      burndownDays: INITIAL_BURNDOWN_DAYS,
      retrospective: INITIAL_RETROSPECTIVE,
      studyGroups: [
        {
          id: 'grp_aws',
          certId: 'aws-saa',
          name: 'AWS Cloud Architects Hub',
          membersCount: 142,
          activeNow: 18,
          description: 'Solutions architect candidates preparing for SAA-C03.'
        },
        {
          id: 'grp_pmp',
          certId: 'pmp',
          name: 'PMP Agile & Predictive Squad',
          membersCount: 98,
          activeNow: 11,
          description: 'Targeting 2026 PMP certifications.'
        }
      ]
    };
    this.saveState();
  }

  exportDataJson() {
    return JSON.stringify(this.state, null, 2);
  }

  importDataJson(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.goals) && Array.isArray(data.sessions)) {
        this.state = { ...this.state, ...data };
        this.saveState();
        return { success: true };
      }
      return { success: false, error: 'Invalid data format. Missing goals or sessions.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const store = new StateStore();
