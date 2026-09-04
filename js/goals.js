// Goals Management: CRUD, Progress Bars, Resource Attachments & Status Toggles
import { store } from './state.js';
import { calculateStudyHours, calculateExamReadiness } from './analytics.js';

export function renderGoalCards(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const goals = store.state.goals;
  const sessions = store.state.sessions;
  const quizHistory = store.state.quizHistory;
  const certifications = store.state.certifications;

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state card">
        <div class="empty-icon">🎯</div>
        <h3>No Certification Goals Yet</h3>
        <p class="text-muted">Set up your first certification target and start tracking study hours and readiness!</p>
        <button class="btn btn-primary mt-3" id="btn-empty-add-goal">+ Create Certification Goal</button>
      </div>
    `;
    document.getElementById('btn-empty-add-goal')?.addEventListener('click', () => {
      window.certTrackerApp?.openCreateGoalModal();
    });
    return;
  }

  container.innerHTML = goals.map(goal => {
    const cert = certifications.find(c => c.id === goal.certId) || {
      name: goal.certName,
      code: goal.certCode,
      color: '#6366f1',
      icon: '📜'
    };

    const { totalHours } = calculateStudyHours(sessions, goal.id);
    const targetHours = Number(goal.targetHours) || 80;
    const progressPercent = Math.min(100, Math.round((totalHours / targetHours) * 100));
    const readiness = calculateExamReadiness(goal, sessions, quizHistory, cert);

    // Days calculation
    let daysBadge = '';
    if (goal.targetDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const examDate = new Date(goal.targetDate + 'T00:00:00');
      const diffDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        daysBadge = `<span class="badge ${diffDays <= 14 ? 'badge-danger' : 'badge-info'}">⏳ ${diffDays} days left</span>`;
      } else if (diffDays === 0) {
        daysBadge = `<span class="badge badge-warning">🎯 Exam is Today!</span>`;
      } else {
        daysBadge = `<span class="badge badge-secondary">Past Exam Date</span>`;
      }
    }

    const isPassed = goal.status === 'passed';

    return `
      <div class="goal-card card ${isPassed ? 'goal-card-passed' : ''}" data-goal-id="${goal.id}">
        <div class="goal-card-header">
          <div class="goal-cert-badge">
            <span class="cert-icon">${cert.icon || '🎓'}</span>
            <div>
              <h3 class="goal-title">${goal.certName || cert.name}</h3>
              <span class="cert-code">${goal.certCode || cert.code}</span>
            </div>
          </div>
          <div class="goal-badges-group">
            ${isPassed ? `<span class="badge badge-success">🏆 PASSED</span>` : daysBadge}
            <div class="dropdown">
              <button class="btn-icon" title="Goal Options" data-action="goal-menu">&#8942;</button>
              <div class="dropdown-menu">
                <button class="dropdown-item" data-action="edit-goal" data-goal-id="${goal.id}">✏️ Edit Goal</button>
                <button class="dropdown-item" data-action="manage-resources" data-goal-id="${goal.id}">📎 Manage Resources (${goal.resources?.length || 0})</button>
                ${!isPassed 
                  ? `<button class="dropdown-item text-success" data-action="mark-passed" data-goal-id="${goal.id}">🏆 Mark as Passed</button>`
                  : `<button class="dropdown-item" data-action="mark-in-progress" data-goal-id="${goal.id}">🔄 Resume In Progress</button>`
                }
                <button class="dropdown-item text-danger" data-action="delete-goal" data-goal-id="${goal.id}">🗑️ Delete Goal</button>
              </div>
            </div>
          </div>
        </div>

        <div class="goal-progress-section">
          <div class="progress-labels">
            <span class="progress-text">${totalHours}h studied of ${targetHours}h goal</span>
            <span class="progress-percentage font-bold">${progressPercent}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progressPercent}%; background: linear-gradient(90deg, ${cert.color || '#6366f1'}, #06b6d4);"></div>
          </div>
        </div>

        <div class="goal-metrics-grid">
          <div class="metric-mini-box">
            <span class="metric-label">Exam Readiness</span>
            <span class="metric-val" style="color: ${readiness.badgeColor};">${readiness.score}%</span>
            <span class="metric-sub">${readiness.status}</span>
          </div>

          <div class="metric-mini-box">
            <span class="metric-label">Weekly Target</span>
            <span class="metric-val text-accent">${goal.weeklyHourTarget || 8}h</span>
            <span class="metric-sub">target / week</span>
          </div>

          <div class="metric-mini-box">
            <span class="metric-label">Target Exam</span>
            <span class="metric-val">${goal.targetDate || 'Not set'}</span>
            <span class="metric-sub">${goal.targetDate ? 'Scheduled' : 'Flexible'}</span>
          </div>
        </div>

        ${goal.notes ? `<p class="goal-notes-preview"><strong>Notes:</strong> ${goal.notes}</p>` : ''}

        <div class="goal-card-footer">
          <div class="goal-resources-summary">
            <span>📎 ${goal.resources?.length || 0} attached resource(s)</span>
          </div>
          <div class="goal-actions-btns">
            <button class="btn btn-secondary btn-sm" data-action="quick-log-session" data-goal-id="${goal.id}">+ Log Hours</button>
            <button class="btn btn-primary btn-sm" data-action="take-quiz" data-cert-id="${goal.certId}">Practice Quiz</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachGoalCardListeners(container);
}

function attachGoalCardListeners(container) {
  // Dropdown toggle
  container.querySelectorAll('[data-action="goal-menu"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      document.querySelectorAll('.dropdown-menu.show').forEach(m => {
        if (m !== menu) m.classList.remove('show');
      });
      menu.classList.toggle('show');
    });
  });

  // Edit Goal
  container.querySelectorAll('[data-action="edit-goal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.getAttribute('data-goal-id');
      window.certTrackerApp?.openEditGoalModal(goalId);
    });
  });

  // Manage Resources
  container.querySelectorAll('[data-action="manage-resources"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.getAttribute('data-goal-id');
      window.certTrackerApp?.openResourcesModal(goalId);
    });
  });

  // Mark Passed
  container.querySelectorAll('[data-action="mark-passed"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.getAttribute('data-goal-id');
      store.markGoalStatus(goalId, 'passed');
      window.certTrackerApp?.showToast('🎉 Congratulations on passing your certification!', 'success');
      window.certTrackerApp?.renderAll();
    });
  });

  // Mark In Progress
  container.querySelectorAll('[data-action="mark-in-progress"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.getAttribute('data-goal-id');
      store.markGoalStatus(goalId, 'in_progress');
      window.certTrackerApp?.renderAll();
    });
  });

  // Delete Goal
  container.querySelectorAll('[data-action="delete-goal"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.getAttribute('data-goal-id');
      if (confirm('Are you sure you want to delete this certification goal?')) {
        store.deleteGoal(goalId);
        window.certTrackerApp?.showToast('Certification goal deleted', 'info');
        window.certTrackerApp?.renderAll();
      }
    });
  });

  // Quick Log Session
  container.querySelectorAll('[data-action="quick-log-session"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goalId = btn.getAttribute('data-goal-id');
      window.certTrackerApp?.openLogSessionModal(goalId);
    });
  });

  // Take Quiz
  container.querySelectorAll('[data-action="take-quiz"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const certId = btn.getAttribute('data-cert-id');
      window.certTrackerApp?.switchTab('quiz', certId);
    });
  });
}
