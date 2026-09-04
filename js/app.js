// Master CertTracker Application Orchestrator
import { store } from './state.js';
import { authManager } from './auth.js';
import { renderGoalCards } from './goals.js';
import { SessionsManager } from './sessions.js';
import { quizManager } from './quiz.js';
import { CalendarManager } from './calendar.js';
import { SprintHubManager } from './sprint-hub.js';
import { renderCommunityView } from './community.js';
import { AdminManager } from './admin.js';
import {
  calculateStudyHours,
  calculateWeeklyHours,
  calculateExamReadiness,
  getSmartReminders,
  getBenchmarkComparison
} from './analytics.js';

class CertTrackerApp {
  constructor() {
    this.currentTab = 'dashboard';
    this.sessionsManager = new SessionsManager('sessions-container');
    this.calendarManager = new CalendarManager('calendar-container');
    this.sprintHubManager = new SprintHubManager('sprint-hub-container');
    this.adminManager = new AdminManager('admin-container');
  }

  init() {
    // Apply saved theme
    this.applyTheme(store.state.theme);

    // Subscribe to state updates
    store.subscribe(() => {
      this.updateHeaderStats();
    });

    // Setup global listeners
    this.setupNavigation();
    this.setupHeaderControls();
    this.renderAll();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
  }

  setupHeaderControls() {
    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      const newTheme = store.toggleTheme();
      this.applyTheme(newTheme);
      this.showToast(`Switched to ${newTheme} mode`, 'info');
    });

    // Auth button / User profile
    document.getElementById('auth-action-btn')?.addEventListener('click', () => {
      if (store.state.isLoggedIn) {
        this.openUserMenuModal();
      } else {
        authManager.openAuthModal('login');
      }
    });

    // Data Sync & Export button
    document.getElementById('btn-data-sync')?.addEventListener('click', () => {
      this.openDataSyncModal();
    });

    // Global Log Session Quick Button
    document.getElementById('btn-global-log-session')?.addEventListener('click', () => {
      this.openLogSessionModal();
    });

    // Global Create Goal Button
    document.getElementById('btn-global-create-goal')?.addEventListener('click', () => {
      this.openCreateGoalModal();
    });
  }

  setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const target = tab.getAttribute('data-tab');
        this.switchTab(target);
      });
    });
  }

  switchTab(tabName, param = null) {
    this.currentTab = tabName;

    // Update active nav button
    document.querySelectorAll('.nav-tab').forEach(t => {
      if (t.getAttribute('data-tab') === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    // Show corresponding tab view
    document.querySelectorAll('.tab-view').forEach(view => {
      view.style.display = view.id === `view-${tabName}` ? 'block' : 'none';
    });

    // Tab-specific initializations
    if (tabName === 'dashboard') {
      this.renderDashboard();
    } else if (tabName === 'goals') {
      renderGoalCards('goals-list-container');
    } else if (tabName === 'sessions') {
      this.sessionsManager.render();
    } else if (tabName === 'quiz') {
      this.renderQuizView(param);
    } else if (tabName === 'calendar') {
      this.calendarManager.render();
    } else if (tabName === 'sprint-hub') {
      this.sprintHubManager.render();
    } else if (tabName === 'community') {
      renderCommunityView('community-container');
    } else if (tabName === 'admin') {
      this.adminManager.render();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderAll() {
    this.updateHeaderStats();
    this.switchTab(this.currentTab);
  }

  updateHeaderStats() {
    const streak = store.calculateStreak();
    const streakEl = document.getElementById('header-streak-pill');
    if (streakEl) {
      streakEl.innerHTML = `🔥 ${streak} Day Streak`;
      streakEl.className = `streak-pill ${streak >= 3 ? 'streak-fire' : ''}`;
    }

    const userBtn = document.getElementById('auth-action-btn');
    if (userBtn) {
      if (store.state.isLoggedIn) {
        userBtn.innerHTML = `
          <span class="user-avatar">${store.state.user?.avatar || '👨‍💻'}</span>
          <span class="user-name-text">${store.state.user?.name || 'Account'}</span>
        `;
      } else {
        userBtn.innerHTML = `<span>🔑 Log In</span>`;
      }
    }
  }

  // ================= DASHBOARD VIEW (US-8 & KPI METRICS) =================
  renderDashboard() {
    const goals = store.state.goals;
    const sessions = store.state.sessions;
    const quizHistory = store.state.quizHistory;
    const certs = store.state.certifications;

    // 1. Smart Reminders
    const reminders = getSmartReminders(goals, sessions);
    const reminderContainer = document.getElementById('dashboard-reminders');
    if (reminderContainer) {
      if (reminders.length === 0) {
        reminderContainer.innerHTML = '';
      } else {
        reminderContainer.innerHTML = reminders.map(r => `
          <div class="reminder-banner reminder-${r.type}">
            <span class="reminder-icon">${r.icon}</span>
            <div class="reminder-body">
              <strong>${r.title}</strong>
              <p>${r.message}</p>
            </div>
            <button class="btn btn-sm btn-outline-light" onclick="window.certTrackerApp.openLogSessionModal('${r.goalId}')">Log Now</button>
          </div>
        `).join('');
      }
    }

    // 2. High Level Metrics
    const { totalHours } = calculateStudyHours(sessions);
    const activeGoals = goals.filter(g => g.status !== 'passed');
    const passedGoals = goals.filter(g => g.status === 'passed');
    const streak = store.calculateStreak();

    // Overall Readiness: Average of active goals' readiness
    let avgReadiness = 0;
    if (activeGoals.length > 0) {
      const sumReadiness = activeGoals.reduce((sum, g) => {
        const cert = certs.find(c => c.id === g.certId);
        return sum + calculateExamReadiness(g, sessions, quizHistory, cert).score;
      }, 0);
      avgReadiness = Math.round(sumReadiness / activeGoals.length);
    }

    const metricsContainer = document.getElementById('dashboard-kpis');
    if (metricsContainer) {
      metricsContainer.innerHTML = `
        <div class="kpi-card card">
          <div class="kpi-icon-wrap bg-primary-soft">⏱️</div>
          <div class="kpi-info">
            <span class="kpi-label">Total Study Hours</span>
            <h3 class="kpi-value">${totalHours}h</h3>
            <span class="kpi-subtext text-muted">${sessions.length} logged sessions</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-wrap bg-accent-soft">🎯</div>
          <div class="kpi-info">
            <span class="kpi-label">Active Cert Goals</span>
            <h3 class="kpi-value">${activeGoals.length}</h3>
            <span class="kpi-subtext text-success">${passedGoals.length} certified passed</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-wrap bg-warning-soft">🔥</div>
          <div class="kpi-info">
            <span class="kpi-label">Current Streak</span>
            <h3 class="kpi-value">${streak} Days</h3>
            <span class="kpi-subtext text-muted">${streak >= 7 ? '⚡ Unstoppable flame!' : 'Study daily to boost'}</span>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-wrap bg-success-soft">🚀</div>
          <div class="kpi-info">
            <span class="kpi-label">Overall Readiness</span>
            <h3 class="kpi-value">${avgReadiness}%</h3>
            <span class="kpi-subtext font-bold" style="color: ${avgReadiness >= 75 ? 'var(--color-success)' : 'var(--color-primary)'}">
              ${avgReadiness >= 80 ? 'Exam Ready' : avgReadiness >= 50 ? 'Strong Progress' : 'Foundation'}
            </span>
          </div>
        </div>
      `;
    }

    // 3. Render Active Goal Summary Cards (US-8)
    renderGoalCards('dashboard-goals-container');

    // 4. Industry Benchmark Comparison (Feature 29)
    const benchmarkContainer = document.getElementById('dashboard-benchmark');
    if (benchmarkContainer && activeGoals.length > 0) {
      const primaryGoal = activeGoals[0];
      const primaryCert = certs.find(c => c.id === primaryGoal.certId);
      const benchmark = getBenchmarkComparison(primaryGoal, sessions, primaryCert);

      if (benchmark) {
        benchmarkContainer.innerHTML = `
          <div class="card benchmark-card">
            <div class="card-header-flex">
              <div>
                <h4>📊 Certification Pace vs. Industry Benchmark</h4>
                <p class="text-muted text-sm">${benchmark.certName}</p>
              </div>
              <span class="badge ${benchmark.badgeClass}">${benchmark.assessment}</span>
            </div>

            <div class="benchmark-grid mt-3">
              <div class="benchmark-col">
                <span class="text-muted text-xs uppercase font-bold">Your Current Weekly Pace</span>
                <div class="benchmark-stat text-accent">${benchmark.userWeeklyPace} hrs/week</div>
                <span class="text-muted text-xs">Estimated ~${benchmark.projectedWeeksRemaining} weeks remaining</span>
              </div>
              <div class="benchmark-divider">vs</div>
              <div class="benchmark-col">
                <span class="text-muted text-xs uppercase font-bold">Average Candidate Pace</span>
                <div class="benchmark-stat">${benchmark.avgWeekly} hrs/week</div>
                <span class="text-muted text-xs">Typical timeline: ${benchmark.avgWeeks} weeks (~${benchmark.avgTotal} total hrs)</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    // 5. Suggested Resources Box (Feature 32)
    const suggestedContainer = document.getElementById('dashboard-suggested-resources');
    if (suggestedContainer && activeGoals.length > 0) {
      const firstCert = certs.find(c => c.id === activeGoals[0].certId);
      if (firstCert && firstCert.suggestedResources) {
        suggestedContainer.innerHTML = `
          <div class="card suggested-card">
            <div class="card-header-flex">
              <div>
                <h4>💡 Curated Study Resources for ${firstCert.name}</h4>
                <p class="text-muted text-sm">Recommended materials to accelerate your test readiness</p>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="window.certTrackerApp.openSuggestedResourcesModal('${firstCert.id}')">View All Resources</button>
            </div>
            <div class="suggested-resources-grid mt-3">
              ${firstCert.suggestedResources.slice(0, 3).map(r => `
                <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="suggested-item-link">
                  <div class="suggested-item-type badge badge-secondary">${r.type}</div>
                  <div class="suggested-item-title">${r.title}</div>
                  <div class="suggested-item-url text-muted text-xs">Explore External Resource &rarr;</div>
                </a>
              `).join('')}
            </div>
          </div>
        `;
      }
    }
  }

  // ================= PRACTICE QUIZ VIEW (Features 17, 18) =================
  renderQuizView(preferredCertId = null) {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const availableCerts = quizManager.getAvailableCertifications();
    const quizHistory = store.state.quizHistory || [];
    const activeCertId = preferredCertId || store.state.goals[0]?.certId || availableCerts[0]?.id || 'aws-saa';

    // If quiz in progress
    if (quizManager.currentQuiz && !quizManager.submitted) {
      this.renderActiveQuizQuestion(container);
      return;
    }

    container.innerHTML = `
      <div class="quiz-launcher-grid">
        <!-- Start Quiz Card -->
        <div class="card quiz-start-card">
          <div class="quiz-badge-icon">🧠</div>
          <h3>Interactive Practice Quiz</h3>
          <p class="text-muted mb-3">Test your knowledge with real certification exam scenario questions and receive immediate rationales.</p>

          <div class="form-group">
            <label class="form-label">Select Target Certification</label>
            <select class="form-select" id="quiz-select-cert">
              ${availableCerts.map(c => `
                <option value="${c.id}" ${c.id === activeCertId ? 'selected' : ''}>
                  ${c.code} – ${c.name} (${c.questionCount} questions available)
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Exam Domain / Category</label>
            <select class="form-select" id="quiz-select-domain">
              <option value="all">All Exam Domains (Comprehensive Mix)</option>
            </select>
          </div>

          <button class="btn btn-primary w-100 mt-3" id="btn-start-quiz-now">🚀 Begin 5-Question Quiz</button>
        </div>

        <!-- Quiz History & Score Progression (Feature 18) -->
        <div class="card quiz-history-card">
          <div class="card-header-flex">
            <h4>📈 Quiz Score History</h4>
            <span class="badge badge-secondary">${quizHistory.length} attempts recorded</span>
          </div>
          <p class="text-muted text-sm">Track your score trajectory over time</p>

          <div class="quiz-history-list mt-3">
            ${quizHistory.length === 0 ? `
              <div class="text-muted text-sm p-3 text-center">No quiz attempts yet. Take your first quiz today!</div>
            ` : quizHistory.map(qh => `
              <div class="quiz-history-row">
                <div class="qh-cert">
                  <strong>${qh.certName}</strong>
                  <span class="text-muted text-xs d-block">${qh.date}</span>
                </div>
                <div class="qh-score-wrap">
                  <span class="qh-score font-bold ${qh.score >= 80 ? 'text-success' : qh.score >= 60 ? 'text-warning' : 'text-danger'}">
                    ${qh.score}%
                  </span>
                  <span class="text-muted text-xs">(${qh.correct}/${qh.total})</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Populate domains for selected cert
    const updateDomainsDropdown = () => {
      const selCert = document.getElementById('quiz-select-cert').value;
      const certObj = store.state.certifications.find(c => c.id === selCert);
      const domainSelect = document.getElementById('quiz-select-domain');
      if (domainSelect) {
        let opts = '<option value="all">All Exam Domains (Comprehensive Mix)</option>';
        if (certObj && certObj.domains) {
          certObj.domains.forEach(d => {
            opts += `<option value="${d.name}">${d.name}</option>`;
          });
        }
        domainSelect.innerHTML = opts;
      }
    };

    document.getElementById('quiz-select-cert')?.addEventListener('change', updateDomainsDropdown);
    updateDomainsDropdown();

    document.getElementById('btn-start-quiz-now')?.addEventListener('click', () => {
      const certId = document.getElementById('quiz-select-cert').value;
      const domain = document.getElementById('quiz-select-domain').value;
      quizManager.startQuiz(certId, domain);
      this.renderActiveQuizQuestion(container);
    });
  }

  renderActiveQuizQuestion(container) {
    const current = quizManager.getCurrentQuestion();
    if (!current) {
      this.renderQuizView();
      return;
    }

    const progressPct = Math.round(((current.index + 1) / current.total) * 100);

    container.innerHTML = `
      <div class="card quiz-question-card">
        <div class="quiz-top-bar">
          <div>
            <span class="badge badge-primary">${current.certName}</span>
            <span class="domain-pill ml-2">${current.domain}</span>
          </div>
          <span class="font-bold text-accent">Question ${current.index + 1} of ${current.total}</span>
        </div>

        <div class="progress-bar-bg mt-2 mb-3">
          <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
        </div>

        <h3 class="quiz-question-text mb-4">${current.question}</h3>

        <div class="quiz-options-list">
          ${current.options.map((opt, idx) => `
            <div class="quiz-option-item ${current.selectedAnswer === idx ? 'selected' : ''}" data-option-idx="${idx}">
              <span class="option-radio-marker">${String.fromCharCode(65 + idx)}</span>
              <span class="option-text">${opt}</span>
            </div>
          `).join('')}
        </div>

        <div class="quiz-footer-nav mt-4">
          <button class="btn btn-secondary" id="btn-quiz-prev" ${current.isFirst ? 'disabled' : ''}>&larr; Previous</button>
          <div class="btn-group">
            ${current.isLast ? `
              <button class="btn btn-success" id="btn-quiz-submit">Submit Quiz & View Results</button>
            ` : `
              <button class="btn btn-primary" id="btn-quiz-next">Next Question &rarr;</button>
            `}
          </div>
        </div>
      </div>
    `;

    // Select option
    container.querySelectorAll('.quiz-option-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = Number(item.getAttribute('data-option-idx'));
        quizManager.selectAnswer(idx);
        this.renderActiveQuizQuestion(container);
      });
    });

    // Next
    container.querySelector('#btn-quiz-next')?.addEventListener('click', () => {
      quizManager.nextQuestion();
      this.renderActiveQuizQuestion(container);
    });

    // Prev
    container.querySelector('#btn-quiz-prev')?.addEventListener('click', () => {
      quizManager.prevQuestion();
      this.renderActiveQuizQuestion(container);
    });

    // Submit
    container.querySelector('#btn-quiz-submit')?.addEventListener('click', () => {
      const results = quizManager.submitQuiz();
      this.renderQuizResults(container, results);
    });
  }

  renderQuizResults(container, results) {
    if (!results) return;

    container.innerHTML = `
      <div class="card quiz-results-card">
        <div class="results-header-box text-center">
          <div class="results-emoji">${results.passed ? '🎉' : '📚'}</div>
          <h2>Quiz Completed!</h2>
          <p class="text-muted">${results.certName}</p>

          <div class="score-circle-badge mt-3 ${results.passed ? 'score-pass' : 'score-fail'}">
            <span class="score-num">${results.score}%</span>
            <span class="score-sub">${results.correctCount} / ${results.totalCount} Correct</span>
          </div>

          <div class="results-message mt-2">
            ${results.passed 
              ? '<span class="text-success font-bold">Great work! You demonstrated strong mastery of this domain.</span>'
              : '<span class="text-warning font-bold">Good effort! Review the detailed rationales below to target weak spots.</span>'
            }
          </div>

          <div class="mt-3">
            <button class="btn btn-primary" id="btn-retake-quiz">Retake Another Quiz</button>
            <button class="btn btn-secondary ml-2" id="btn-back-to-dashboard">Back to Dashboard</button>
          </div>
        </div>

        <div class="quiz-review-section mt-4">
          <h3>Question-by-Question Review</h3>
          <div class="review-items-list mt-3">
            ${results.review.map((item, idx) => `
              <div class="review-item card ${item.isCorrect ? 'review-correct' : 'review-incorrect'}">
                <div class="review-status-row">
                  <span class="badge ${item.isCorrect ? 'badge-success' : 'badge-danger'}">
                    ${item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                  <span class="text-muted text-xs">${item.domain}</span>
                </div>
                <p class="review-question font-bold mt-2">Q${idx + 1}: ${item.question}</p>
                <div class="review-answers-box mt-2">
                  <div class="text-sm">
                    <strong>Your Answer:</strong> ${item.selected !== null ? item.options[item.selected] : 'None selected'}
                  </div>
                  ${!item.isCorrect ? `
                    <div class="text-sm text-success mt-1">
                      <strong>Correct Answer:</strong> ${item.options[item.correctIndex]}
                    </div>
                  ` : ''}
                </div>
                <div class="review-explanation-box mt-2">
                  <strong>Explanation:</strong> ${item.explanation}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-retake-quiz')?.addEventListener('click', () => {
      quizManager.currentQuiz = null;
      this.renderQuizView();
    });

    container.querySelector('#btn-back-to-dashboard')?.addEventListener('click', () => {
      this.switchTab('dashboard');
    });
  }

  // ================= MODALS MANAGEMENT =================

  openCreateGoalModal() {
    this.openGoalModal('Create Certification Goal', null);
  }

  openEditGoalModal(goalId) {
    const goal = store.state.goals.find(g => g.id === goalId);
    if (goal) {
      this.openGoalModal('Edit Certification Goal', goal);
    }
  }

  openGoalModal(title, existingGoal = null) {
    const certs = store.state.certifications;
    const isEdit = !!existingGoal;

    const modalHtml = `
      <div class="modal-overlay show" id="goal-form-modal">
        <div class="modal-content modal-md">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="btn-close" id="btn-close-goal-modal">&times;</button>
          </div>
          <form id="goal-edit-form">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Target Certification *</label>
                <select class="form-select" id="goal-cert-id" ${isEdit ? 'disabled' : 'required'}>
                  ${certs.map(c => `
                    <option value="${c.id}" ${existingGoal?.certId === c.id ? 'selected' : ''}>
                      ${c.code} – ${c.name} (${c.defaultTargetHours}h standard)
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Target Exam Date *</label>
                  <input type="date" class="form-input" id="goal-target-date" required value="${existingGoal?.targetDate || ''}">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Total Study Hour Goal *</label>
                  <input type="number" class="form-input" id="goal-target-hours" min="10" max="500" required value="${existingGoal?.targetHours || 80}">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Weekly Hour Target *</label>
                  <input type="number" class="form-input" id="goal-weekly-target" min="1" max="60" required value="${existingGoal?.weeklyHourTarget || 8}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Personal Study Strategy / Notes</label>
                <textarea class="form-textarea" id="goal-notes" rows="3" placeholder="e.g. Prioritize practice tests on weekends, review flashcards during commute...">${existingGoal?.notes || ''}</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-goal-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Goal'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    const modal = document.getElementById('goal-form-modal');
    const close = () => modal.remove();
    modal.querySelector('#btn-close-goal-modal').addEventListener('click', close);
    modal.querySelector('#btn-cancel-goal-modal').addEventListener('click', close);

    modal.querySelector('#goal-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const certId = document.getElementById('goal-cert-id').value;
      const certObj = certs.find(c => c.id === certId);
      const targetDate = document.getElementById('goal-target-date').value;
      const targetHours = Number(document.getElementById('goal-target-hours').value) || 80;
      const weeklyHourTarget = Number(document.getElementById('goal-weekly-target').value) || 8;
      const notes = document.getElementById('goal-notes').value.trim();

      if (isEdit) {
        store.updateGoal(existingGoal.id, {
          targetDate,
          targetHours,
          weeklyHourTarget,
          notes
        });
        this.showToast('Certification goal updated!', 'success');
      } else {
        store.addGoal({
          certId,
          certName: certObj.name,
          certCode: certObj.code,
          targetDate,
          targetHours,
          weeklyHourTarget,
          notes
        });
        this.showToast(`New goal created for ${certObj.code}!`, 'success');
      }

      close();
      this.renderAll();
    });
  }

  openLogSessionModal(presetGoalId = null) {
    this.openSessionModal('Log Study Session', null, presetGoalId);
  }

  openEditSessionModal(sessionId) {
    const session = store.state.sessions.find(s => s.id === sessionId);
    if (session) {
      this.openSessionModal('Edit Study Session', session, session.goalId);
    }
  }

  openSessionModal(title, existingSession = null, presetGoalId = null) {
    const goals = store.state.goals;
    const certs = store.state.certifications;
    const isEdit = !!existingSession;

    const defaultGoalId = existingSession?.goalId || presetGoalId || goals[0]?.id || '';
    const todayStr = new Date().toISOString().split('T')[0];

    const modalHtml = `
      <div class="modal-overlay show" id="session-form-modal">
        <div class="modal-content modal-md">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="btn-close" id="btn-close-session-modal">&times;</button>
          </div>
          <form id="session-edit-form">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Certification Goal *</label>
                  <select class="form-select" id="sess-goal-id" required>
                    ${goals.map(g => `
                      <option value="${g.id}" ${g.id === defaultGoalId ? 'selected' : ''}>
                        ${g.certCode} – ${g.certName}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Date Studied *</label>
                  <input type="date" class="form-input" id="sess-date" required value="${existingSession?.date || todayStr}">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Exam Domain / Category</label>
                  <select class="form-select" id="sess-domain">
                    <option value="">General / Multiple Domains</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Duration (Minutes) *</label>
                  <input type="number" class="form-input" id="sess-duration" min="5" max="720" step="5" required value="${existingSession?.durationMinutes || 60}">
                  <span class="text-muted text-xs" id="sess-duration-helper">1.0 hours</span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Topic / Specific Focus *</label>
                  <input type="text" class="form-input" id="sess-topic" required placeholder="e.g. S3 Glacier retention, VPC peering..." value="${existingSession?.topic || ''}">
                </div>
                <div class="form-group w-30">
                  <label class="form-label">Study Method</label>
                  <select class="form-select" id="sess-method">
                    <option value="Video Course" ${existingSession?.method === 'Video Course' ? 'selected' : ''}>Video Course</option>
                    <option value="Hands-on Lab" ${existingSession?.method === 'Hands-on Lab' ? 'selected' : ''}>Hands-on Lab</option>
                    <option value="Reading / Docs" ${existingSession?.method === 'Reading / Docs' ? 'selected' : ''}>Reading / Docs</option>
                    <option value="Practice Questions" ${existingSession?.method === 'Practice Questions' ? 'selected' : ''}>Practice Questions</option>
                    <option value="Flashcards" ${existingSession?.method === 'Flashcards' ? 'selected' : ''}>Flashcards</option>
                    <option value="Review Notes" ${existingSession?.method === 'Review Notes' ? 'selected' : ''}>Review Notes</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Session Notes & Takeaways</label>
                <textarea class="form-textarea" id="sess-notes" rows="3" placeholder="Key concepts mastered, formulas, acronyms, or topics needing revision...">${existingSession?.notes || ''}</textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-session-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">${isEdit ? 'Update Session' : 'Log Session'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    const modal = document.getElementById('session-form-modal');
    const close = () => modal.remove();
    modal.querySelector('#btn-close-session-modal').addEventListener('click', close);
    modal.querySelector('#btn-cancel-session-modal').addEventListener('click', close);

    // Duration helper
    const durationInput = modal.querySelector('#sess-duration');
    const durationHelper = modal.querySelector('#sess-duration-helper');
    durationInput?.addEventListener('input', () => {
      const mins = Number(durationInput.value) || 0;
      durationHelper.textContent = `${(mins / 60).toFixed(1)} hours`;
    });

    // Populate domains based on selected goal
    const updateDomainList = () => {
      const selectedGoalId = modal.querySelector('#sess-goal-id').value;
      const goalObj = goals.find(g => g.id === selectedGoalId);
      const certObj = certs.find(c => c.id === goalObj?.certId);
      const domainSelect = modal.querySelector('#sess-domain');

      let options = '<option value="">General / Multiple Domains</option>';
      if (certObj && certObj.domains) {
        certObj.domains.forEach(d => {
          const selected = existingSession?.domain === d.name ? 'selected' : '';
          options += `<option value="${d.name}" ${selected}>${d.name}</option>`;
        });
      }
      domainSelect.innerHTML = options;
    };

    modal.querySelector('#sess-goal-id')?.addEventListener('change', updateDomainList);
    updateDomainList();

    // Submit handler
    modal.querySelector('#session-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const goalId = document.getElementById('sess-goal-id').value;
      const goalObj = goals.find(g => g.id === goalId);
      const date = document.getElementById('sess-date').value;
      const durationMinutes = Number(document.getElementById('sess-duration').value) || 60;
      const domain = document.getElementById('sess-domain').value;
      const topic = document.getElementById('sess-topic').value.trim();
      const method = document.getElementById('sess-method').value;
      const notes = document.getElementById('sess-notes').value.trim();

      if (isEdit) {
        store.updateSession(existingSession.id, {
          goalId,
          certId: goalObj?.certId,
          certName: goalObj?.certName,
          date,
          durationMinutes,
          domain,
          topic,
          method,
          notes
        });
        this.showToast('Study session updated!', 'success');
      } else {
        store.addSession({
          goalId,
          certId: goalObj?.certId,
          certName: goalObj?.certName,
          date,
          durationMinutes,
          domain,
          topic,
          method,
          notes
        });
        this.showToast(`Logged ${(durationMinutes / 60).toFixed(1)}h for ${goalObj?.certCode}! 🔥`, 'success');
      }

      close();
      this.renderAll();
    });
  }

  openResourcesModal(goalId) {
    const goal = store.state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const modalHtml = `
      <div class="modal-overlay show" id="resources-modal">
        <div class="modal-content modal-md">
          <div class="modal-header">
            <div>
              <h3>📎 Attached Study Resources</h3>
              <p class="text-muted text-xs">${goal.certName}</p>
            </div>
            <button class="btn-close" id="btn-close-res-modal">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Add New Resource Form -->
            <form id="add-resource-form" class="card card-nested p-3 mb-3">
              <h4 class="text-sm font-bold mb-2">+ Add Resource (Link, PDF, Notes)</h4>
              <div class="form-row">
                <div class="form-group flex-1">
                  <input type="text" class="form-input" id="res-title" required placeholder="Resource Title (e.g. VPC Cheat Sheet)">
                </div>
                <div class="form-group w-30">
                  <select class="form-select" id="res-type">
                    <option value="Link">Web Link</option>
                    <option value="PDF">PDF Guide</option>
                    <option value="Notes">Study Notes</option>
                    <option value="Cheat Sheet">Cheat Sheet</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <input type="url" class="form-input" id="res-url" required placeholder="https://example.com/guide.pdf">
              </div>
              <button type="submit" class="btn btn-primary btn-sm">Attach Resource</button>
            </form>

            <!-- Resources List -->
            <div class="resources-attached-list">
              ${(!goal.resources || goal.resources.length === 0) ? `
                <div class="text-muted text-center p-3">No custom resources attached to this goal yet.</div>
              ` : goal.resources.map(r => `
                <div class="resource-attached-row">
                  <div class="res-info">
                    <span class="badge badge-secondary">${r.type || 'Link'}</span>
                    <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="res-title-link font-bold">${r.title}</a>
                  </div>
                  <button class="btn-icon btn-sm text-danger" data-action="delete-resource" data-res-id="${r.id}" title="Remove">🗑️</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    const modal = document.getElementById('resources-modal');
    const close = () => modal.remove();
    modal.querySelector('#btn-close-res-modal').addEventListener('click', close);

    // Add resource
    modal.querySelector('#add-resource-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('res-title').value.trim();
      const type = document.getElementById('res-type').value;
      const url = document.getElementById('res-url').value.trim();

      store.addGoalResource(goalId, { title, type, url });
      this.showToast('Resource attached to goal!', 'success');
      close();
      this.openResourcesModal(goalId);
    });

    // Delete resource
    modal.querySelectorAll('[data-action="delete-resource"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const resId = btn.getAttribute('data-res-id');
        store.deleteGoalResource(goalId, resId);
        close();
        this.openResourcesModal(goalId);
      });
    });
  }

  openSuggestedResourcesModal(certId) {
    const cert = store.state.certifications.find(c => c.id === certId);
    if (!cert) return;

    const modalHtml = `
      <div class="modal-overlay show" id="suggested-res-modal">
        <div class="modal-content modal-md">
          <div class="modal-header">
            <div>
              <h3>💡 Curated Resources: ${cert.name}</h3>
              <p class="text-muted text-xs">${cert.provider} • Target: ${cert.defaultTargetHours} study hours</p>
            </div>
            <button class="btn-close" id="btn-close-sugg-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="suggested-modal-list">
              ${(cert.suggestedResources || []).map(r => `
                <div class="suggested-full-card card card-nested mb-2 p-3">
                  <div class="card-header-flex">
                    <span class="badge badge-primary">${r.type}</span>
                    <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Open Link &rarr;</a>
                  </div>
                  <h4 class="mt-2">${r.title}</h4>
                  <span class="text-muted text-xs">${r.url}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);
    const modal = document.getElementById('suggested-res-modal');
    modal.querySelector('#btn-close-sugg-modal').addEventListener('click', () => modal.remove());
  }

  openDataSyncModal() {
    const modalHtml = `
      <div class="modal-overlay show" id="data-sync-modal">
        <div class="modal-content modal-md">
          <div class="modal-header">
            <h3>💾 Cloud Sync & Data Management</h3>
            <button class="btn-close" id="btn-close-sync-modal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="sync-info-box card card-nested p-3 mb-3">
              <div class="card-header-flex">
                <span class="font-bold">Device & Browser Sync Status</span>
                <span class="badge badge-success">🟢 Active LocalStorage</span>
              </div>
              <p class="text-muted text-sm mt-1">All goals, study sessions, streak counters, and quiz scores are automatically saved to your local browser storage.</p>
            </div>

            <div class="sync-actions-grid">
              <div class="card card-nested p-3">
                <h4>📥 Export Backup (JSON)</h4>
                <p class="text-muted text-xs mb-2">Download a complete JSON snapshot of all your progress and certification data.</p>
                <button class="btn btn-secondary btn-sm w-100" id="btn-do-export-json">Download JSON File</button>
              </div>

              <div class="card card-nested p-3">
                <h4>📤 Restore / Import Backup</h4>
                <p class="text-muted text-xs mb-2">Restore data from a previously saved CertTracker JSON backup file.</p>
                <input type="file" id="input-import-json" accept=".json" style="display: none;">
                <button class="btn btn-secondary btn-sm w-100" id="btn-trigger-import">Select JSON File</button>
              </div>
            </div>

            <div class="danger-zone-box mt-3 p-3 card card-nested border-danger">
              <h4 class="text-danger text-sm">⚠️ Reset to Demo Initial State</h4>
              <p class="text-muted text-xs mb-2">Reset the application back to the standard sample goals (AWS & PMP) and study sessions.</p>
              <button class="btn btn-outline-danger btn-sm" id="btn-do-reset-data">Reset to Sample Data</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    const modal = document.getElementById('data-sync-modal');
    const close = () => modal.remove();
    modal.querySelector('#btn-close-sync-modal').addEventListener('click', close);

    // Export JSON
    modal.querySelector('#btn-do-export-json').addEventListener('click', () => {
      const json = store.exportDataJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CertTracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      this.showToast('Backup JSON downloaded successfully!', 'success');
    });

    // Import JSON
    const fileInput = modal.querySelector('#input-import-json');
    modal.querySelector('#btn-trigger-import').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = store.importDataJson(evt.target.result);
        if (res.success) {
          this.showToast('Data imported successfully!', 'success');
          close();
          this.renderAll();
        } else {
          alert('Error importing data: ' + res.error);
        }
      };
      reader.readAsText(file);
    });

    // Reset data
    modal.querySelector('#btn-do-reset-data').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data back to demo defaults?')) {
        store.resetToDefaults();
        this.showToast('Reset to initial sample data', 'info');
        close();
        this.renderAll();
      }
    });
  }

  openUserMenuModal() {
    const user = store.state.user;
    const modalHtml = `
      <div class="modal-overlay show" id="user-menu-modal">
        <div class="modal-content modal-sm">
          <div class="modal-header">
            <h3>User Account</h3>
            <button class="btn-close" id="btn-close-user-menu">&times;</button>
          </div>
          <div class="modal-body text-center">
            <div class="user-big-avatar">${user.avatar || '👨‍💻'}</div>
            <h3 class="mt-2">${user.name}</h3>
            <p class="text-muted text-sm">${user.email}</p>
            <div class="badge badge-primary mt-1">Role: ${user.role || 'Member'}</div>

            <div class="user-menu-actions mt-4">
              <button class="btn btn-secondary w-100 mb-2" id="btn-switch-account">Switch Account / Sign In</button>
              <button class="btn btn-outline-danger w-100" id="btn-do-logout">Log Out</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    const modal = document.getElementById('user-menu-modal');
    const close = () => modal.remove();
    modal.querySelector('#btn-close-user-menu').addEventListener('click', close);

    modal.querySelector('#btn-switch-account').addEventListener('click', () => {
      close();
      authManager.openAuthModal('login');
    });

    modal.querySelector('#btn-do-logout').addEventListener('click', () => {
      close();
      authManager.logout();
    });
  }

  filterSessionsByDate(dateStr) {
    this.switchTab('sessions');
    this.sessionsManager.setFilters({
      dateFrom: dateStr,
      dateTo: dateStr
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon} ${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Global App Instance
window.certTrackerApp = new CertTrackerApp();
window.addEventListener('DOMContentLoaded', () => {
  window.certTrackerApp.init();
});
