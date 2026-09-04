// Community, Study Groups & Progress Sharing Card Generator
import { store } from './state.js';
import { calculateStudyHours } from './analytics.js';

export function renderCommunityView(containerId) {
  const container = document.getElementById(this?.containerId || containerId);
  if (!container) return;

  const groups = store.state.studyGroups || [];
  const streak = store.calculateStreak();
  const { totalHours } = calculateStudyHours(store.state.sessions);
  const user = store.state.user;

  container.innerHTML = `
    <div class="community-grid">
      <!-- Left Column: Study Groups & Live Peer Hub -->
      <div class="community-main">
        <div class="card mb-3">
          <div class="card-header-flex">
            <div>
              <h3>👥 Certification Study Groups</h3>
              <p class="text-muted text-sm">Join peers studying for the exact same target certification</p>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-share-progress">✨ Share My Progress Card</button>
          </div>

          <div class="study-groups-list mt-3">
            ${groups.map(grp => `
              <div class="study-group-card">
                <div class="group-info">
                  <div class="group-title-row">
                    <h4 class="group-name">${grp.name}</h4>
                    <span class="badge badge-success">🟢 ${grp.activeNow} active now</span>
                  </div>
                  <p class="group-desc">${grp.description}</p>
                  <div class="group-meta">
                    <span>👥 ${grp.membersCount} members</span>
                    <span class="mx-2">•</span>
                    <span>💬 Active study room</span>
                  </div>
                </div>
                <div class="group-action">
                  <button class="btn btn-primary btn-sm btn-join-group" data-group-id="${grp.id}">Enter Study Room</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Live Peer Activity Feed -->
        <div class="card">
          <div class="card-header-flex">
            <div>
              <h4>🔥 Live Peer Activity Feed</h4>
              <p class="text-muted text-sm">Real-time study milestones from candidates worldwide</p>
            </div>
            <span class="live-dot-pulse">● Live</span>
          </div>

          <div class="peer-feed-list mt-3">
            <div class="peer-feed-item">
              <div class="peer-avatar">👩‍🔬</div>
              <div class="peer-details">
                <div class="peer-text"><strong>Elena Rostova</strong> logged 2.5 hours on <em>AWS SAA-C03: Decoupled Microservices with SQS & SNS</em></div>
                <div class="peer-time">12 minutes ago</div>
              </div>
            </div>

            <div class="peer-feed-item">
              <div class="peer-avatar">👨‍💼</div>
              <div class="peer-details">
                <div class="peer-text"><strong>Marcus Vance</strong> scored <strong>92%</strong> on <em>PMP Agile Practice Exam</em> 🎉</div>
                <div class="peer-time">34 minutes ago</div>
              </div>
            </div>

            <div class="peer-feed-item">
              <div class="peer-avatar">👩‍💻</div>
              <div class="peer-details">
                <div class="peer-text"><strong>Samantha Wu</strong> unlocked <strong>Century Club (100h)</strong> badge on <em>CompTIA Security+</em>!</div>
                <div class="peer-time">1 hour ago</div>
              </div>
            </div>

            <div class="peer-feed-item">
              <div class="peer-avatar">🧑‍💻</div>
              <div class="peer-details">
                <div class="peer-text"><strong>Devon Reed</strong> marked <strong>AWS Solutions Architect – Associate</strong> as <strong>PASSED 🏆</strong></div>
                <div class="peer-time">2 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Focus Study Room & Timer -->
      <div class="community-sidebar">
        <div class="card focus-room-card mb-3">
          <div class="focus-room-header">
            <h4>⏱️ Pomodoro Focus Timer</h4>
            <span class="badge badge-accent">Silent Co-Working</span>
          </div>
          <p class="text-muted text-sm mt-1">Study alongside 39 other candidates currently in focus mode.</p>

          <div class="timer-display-box mt-3">
            <div class="timer-clock" id="pomodoro-clock">25:00</div>
            <div class="timer-controls mt-2">
              <button class="btn btn-primary btn-sm" id="btn-timer-start">Start 25m Focus</button>
              <button class="btn btn-secondary btn-sm" id="btn-timer-reset">Reset</button>
            </div>
          </div>
        </div>

        <!-- Milestones & Badges Summary -->
        <div class="card">
          <h4>🏆 My Milestone Badges</h4>
          <p class="text-muted text-sm mb-3">Earned through consistent study and quiz mastery</p>
          <div class="badges-grid-compact">
            ${store.state.badges.map(b => `
              <div class="badge-item ${b.unlockedAt ? 'badge-unlocked' : 'badge-locked'}" title="${b.description}">
                <div class="badge-icon-lg">${b.icon}</div>
                <div class="badge-name">${b.name}</div>
                <div class="badge-status">${b.unlockedAt ? `Unlocked ${b.unlockedAt}` : 'Locked'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach group entry
  container.querySelectorAll('.btn-join-group').forEach(btn => {
    btn.addEventListener('click', () => {
      window.certTrackerApp?.showToast('Joined active study room. Focus mode activated! 🎧', 'success');
    });
  });

  // Attach share progress
  container.querySelector('#btn-share-progress')?.addEventListener('click', () => {
    openShareModal(user, totalHours, streak);
  });

  // Pomodoro timer logic
  setupPomodoroTimer(container);
}

function setupPomodoroTimer(container) {
  const clock = container.querySelector('#pomodoro-clock');
  const startBtn = container.querySelector('#btn-timer-start');
  const resetBtn = container.querySelector('#btn-timer-reset');

  let timerInterval = null;
  let secondsLeft = 25 * 60;

  const updateDisplay = () => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    if (clock) clock.textContent = `${m}:${s}`;
  };

  startBtn?.addEventListener('click', () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      startBtn.textContent = 'Resume';
    } else {
      timerInterval = setInterval(() => {
        if (secondsLeft > 0) {
          secondsLeft--;
          updateDisplay();
        } else {
          clearInterval(timerInterval);
          timerInterval = null;
          alert('🎉 25-minute Pomodoro session completed! Take a 5-minute break.');
          secondsLeft = 25 * 60;
          updateDisplay();
          startBtn.textContent = 'Start 25m Focus';
        }
      }, 1000);
      startBtn.textContent = 'Pause';
    }
  });

  resetBtn?.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    secondsLeft = 25 * 60;
    updateDisplay();
    if (startBtn) startBtn.textContent = 'Start 25m Focus';
  });
}

export function openShareModal(user, totalHours, streak) {
  const activeGoals = store.state.goals.filter(g => g.status !== 'passed');
  const primaryCert = activeGoals[0]?.certName || 'Professional Certification';
  const unlockedBadges = store.state.badges.filter(b => b.unlockedAt).length;

  const modalHtml = `
    <div class="modal-overlay show" id="share-modal">
      <div class="modal-content modal-md">
        <div class="modal-header">
          <h3>✨ Share Your Progress</h3>
          <button class="btn-close" id="btn-close-share">&times;</button>
        </div>
        <div class="modal-body">
          <div class="share-card-preview" id="share-card-target">
            <div class="share-card-brand">
              <span class="share-brand-logo">⚡ CertTracker</span>
              <span class="share-badge-pill">Study Certified</span>
            </div>
            <div class="share-user-row">
              <span class="share-avatar">${user.avatar || '👨‍💻'}</span>
              <div>
                <h3 class="share-user-name">${user.name}</h3>
                <span class="share-target-cert">Targeting: ${primaryCert}</span>
              </div>
            </div>
            <div class="share-stats-grid">
              <div class="share-stat-col">
                <span class="share-stat-num">${totalHours}h</span>
                <span class="share-stat-lbl">Studied</span>
              </div>
              <div class="share-stat-col">
                <span class="share-stat-num">🔥 ${streak}</span>
                <span class="share-stat-lbl">Day Streak</span>
              </div>
              <div class="share-stat-col">
                <span class="share-stat-num">🏆 ${unlockedBadges}</span>
                <span class="share-stat-lbl">Badges</span>
              </div>
            </div>
            <div class="share-footer-text">
              Track your exam progress at certtracker.app
            </div>
          </div>

          <div class="mt-3 text-center">
            <button class="btn btn-primary" id="btn-copy-share-text">📋 Copy Shareable Text</button>
            <button class="btn btn-secondary ml-2" id="btn-share-toast">Share to Study Group</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const div = document.createElement('div');
  div.innerHTML = modalHtml;
  document.body.appendChild(div.firstElementChild);

  const modal = document.getElementById('share-modal');
  modal.querySelector('#btn-close-share').addEventListener('click', () => modal.remove());

  modal.querySelector('#btn-copy-share-text').addEventListener('click', () => {
    const text = `🎯 I've logged ${totalHours} hours and have a ${streak}-day study streak on CertTracker for ${primaryCert}! Consistent daily progress. #CertTracker #StudyStreak`;
    navigator.clipboard?.writeText(text).then(() => {
      window.certTrackerApp?.showToast('Copied progress summary to clipboard!', 'success');
    }).catch(() => {
      window.certTrackerApp?.showToast('Progress text ready: ' + text, 'info');
    });
  });

  modal.querySelector('#btn-share-toast').addEventListener('click', () => {
    modal.remove();
    window.certTrackerApp?.showToast('Progress posted to your study group feed! 🎉', 'success');
  });
}
