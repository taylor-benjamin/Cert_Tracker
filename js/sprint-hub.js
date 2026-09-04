// Sprint Hub: Sprint 1 Kanban, Interactive SVG Burndown Chart, Planning Poker Notes & Retrospective
import { store } from './state.js';

export class SprintHubManager {
  constructor(containerId) {
    this.containerId = containerId;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const stories = store.state.sprintStories || [];
    const burndownDays = store.state.burndownDays || [];
    const retro = store.state.retrospective || { wentWell: [], harderThanExpected: [], changesForNextCycle: [] };

    // Point calculations
    const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);
    const donePoints = stories.filter(s => s.status === 'done').reduce((sum, s) => sum + s.points, 0);
    const inProgressPoints = stories.filter(s => s.status === 'in_progress').reduce((sum, s) => sum + s.points, 0);
    const todoPoints = stories.filter(s => s.status === 'todo').reduce((sum, s) => sum + s.points, 0);

    const completionRate = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

    container.innerHTML = `
      <div class="sprint-header-card">
        <div class="sprint-header-top">
          <div>
            <div class="badge badge-primary mb-1">Agile Sprint 1 (Active)</div>
            <h2 class="sprint-title">CertTrack — Sprint 1 Execution & Burndown</h2>
            <p class="sprint-subtitle">Committed scope: 8 User Stories • 34 Story Points • 10-Workday Sprint Target</p>
          </div>
          <div class="sprint-stats-group">
            <div class="sprint-stat-box">
              <span class="stat-label">Committed</span>
              <span class="stat-value">${totalPoints} pts</span>
            </div>
            <div class="sprint-stat-box">
              <span class="stat-label">Completed</span>
              <span class="stat-value text-success">${donePoints} pts</span>
            </div>
            <div class="sprint-stat-box">
              <span class="stat-label">Velocity</span>
              <span class="stat-value text-accent">${completionRate}%</span>
            </div>
          </div>
        </div>

        <div class="sprint-nav-tabs">
          <button class="sprint-subtab active" data-subtab="board">Sprint 1 Board</button>
          <button class="sprint-subtab" data-subtab="burndown">Burndown Chart</button>
          <button class="sprint-subtab" data-subtab="poker">Planning Poker Notes</button>
          <button class="sprint-subtab" data-subtab="retro">Sprint Retrospective</button>
        </div>
      </div>

      <!-- TAB 1: KANBAN BOARD -->
      <div class="sprint-view-section active" id="sprint-view-board">
        <div class="kanban-grid">
          <!-- TO DO -->
          <div class="kanban-column" id="col-todo">
            <div class="kanban-col-header">
              <span class="col-title">To Do</span>
              <span class="col-count">${stories.filter(s => s.status === 'todo').length} stories (${todoPoints} pts)</span>
            </div>
            <div class="kanban-col-body">
              ${this.renderStoryCards(stories.filter(s => s.status === 'todo'))}
            </div>
          </div>

          <!-- IN PROGRESS -->
          <div class="kanban-column" id="col-in_progress">
            <div class="kanban-col-header">
              <span class="col-title">In Progress</span>
              <span class="col-count">${stories.filter(s => s.status === 'in_progress').length} stories (${inProgressPoints} pts)</span>
            </div>
            <div class="kanban-col-body">
              ${this.renderStoryCards(stories.filter(s => s.status === 'in_progress'))}
            </div>
          </div>

          <!-- DONE -->
          <div class="kanban-column" id="col-done">
            <div class="kanban-col-header">
              <span class="col-title">Done & Verified</span>
              <span class="col-count">${stories.filter(s => s.status === 'done').length} stories (${donePoints} pts)</span>
            </div>
            <div class="kanban-col-body">
              ${this.renderStoryCards(stories.filter(s => s.status === 'done'))}
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: BURNDOWN CHART -->
      <div class="sprint-view-section" id="sprint-view-burndown" style="display: none;">
        <div class="burndown-wrapper card">
          <div class="burndown-header">
            <div>
              <h3>Sprint 1 Burndown Chart (10 Workdays)</h3>
              <p class="text-muted">Ideal uniform burn of 3.4 pts/day vs. recorded team progress</p>
            </div>
            <div class="burndown-legend">
              <span class="legend-item"><span class="legend-dot ideal-line"></span> Ideal Line (-3.4 pts/day)</span>
              <span class="legend-item"><span class="legend-dot actual-line"></span> Actual Remaining</span>
            </div>
          </div>

          <div class="svg-chart-container">
            ${this.renderSvgBurndown(burndownDays)}
          </div>

          <div class="burndown-data-table-container mt-3">
            <h4>Daily Burndown Tracker</h4>
            <div class="table-responsive">
              <table class="burndown-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    ${burndownDays.map(d => `<th>Day ${d.day}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-bold">Ideal Points</td>
                    ${burndownDays.map(d => `<td>${d.ideal.toFixed(1)}</td>`).join('')}
                  </tr>
                  <tr>
                    <td class="font-bold">Actual Points</td>
                    ${burndownDays.map((d, idx) => `
                      <td>
                        <input type="number" min="0" max="34" step="1" 
                          class="burndown-input" 
                          data-day-idx="${idx}" 
                          value="${d.actual !== null ? d.actual : ''}" />
                      </td>
                    `).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: PLANNING POKER NOTES -->
      <div class="sprint-view-section" id="sprint-view-poker" style="display: none;">
        <div class="card poker-notes-card">
          <div class="poker-badge">Sprint Zero Planning Poker Summary</div>
          <h3>Story Point Sizing Rationale</h3>
          <p class="mb-3 text-muted">Documented estimation consensus from the sprint planning session:</p>

          <div class="poker-items-list">
            <div class="poker-item">
              <div class="poker-story-header">
                <span class="poker-id">US-2</span>
                <span class="poker-points">2 Story Points</span>
                <span class="poker-title">Log In & Log Out</span>
              </div>
              <p class="poker-desc">
                <strong>Team Baseline:</strong> Treated as the team's "2" baseline pattern since authentication session handling is standard and well-understood.
              </p>
            </div>

            <div class="poker-item">
              <div class="poker-story-header">
                <span class="poker-id">US-1 & US-3</span>
                <span class="poker-points">3 Story Points each</span>
                <span class="poker-title">Sign Up & Password Reset</span>
              </div>
              <p class="poker-desc">
                Estimated at 3 points due to additional edge cases: form validation, unique constraints, token expiration, and email reset flow handling.
              </p>
            </div>

            <div class="poker-item">
              <div class="poker-story-header">
                <span class="poker-id">US-4 & US-5</span>
                <span class="poker-points">5 Story Points each</span>
                <span class="poker-title">Create Goal & Log Study Session</span>
              </div>
              <p class="poker-desc">
                Estimated at 5 points because both require defining core persistent data schemas, multi-field interactive modal forms, domain mappings, and input sanitization.
              </p>
            </div>

            <div class="poker-item highlight-item">
              <div class="poker-story-header">
                <span class="poker-id">US-7</span>
                <span class="poker-points">8 Story Points</span>
                <span class="poker-title">Progress Bar & Hours Tracker</span>
              </div>
              <p class="poker-desc">
                <strong>Most Debated Story:</strong> Some team members argued for 5 while others estimated 8. Settled at 8 due to strong dependency risk on US-4 and US-5 data structures being completed first, plus dynamic multi-cert calculation logic and edge cases in hours math.
              </p>
            </div>

            <div class="poker-item">
              <div class="poker-story-header">
                <span class="poker-id">US-8</span>
                <span class="poker-points">5 Story Points</span>
                <span class="poker-title">Dashboard Summary for Active Goals</span>
              </div>
              <p class="poker-desc">
                Estimated at 5 points since it aggregates existing state into high-level KPI cards, countdown chips, and active progress gauges.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: RETROSPECTIVE BOARD -->
      <div class="sprint-view-section" id="sprint-view-retro" style="display: none;">
        <div class="retro-board-container">
          <div class="retro-column retro-went-well">
            <div class="retro-col-header">
              <span>🎉 What Went Well</span>
            </div>
            <div class="retro-items" id="retro-list-wentWell">
              ${(retro.wentWell || []).map(item => `<div class="retro-card">${item}</div>`).join('')}
            </div>
            <div class="retro-add-box">
              <input type="text" placeholder="Add observation..." id="retro-input-wentWell" class="form-input form-input-sm" />
              <button class="btn btn-secondary btn-sm mt-1 btn-add-retro" data-category="wentWell">+ Add</button>
            </div>
          </div>

          <div class="retro-column retro-harder">
            <div class="retro-col-header">
              <span>🧗 What Was Harder Than Expected</span>
            </div>
            <div class="retro-items" id="retro-list-harderThanExpected">
              ${(retro.harderThanExpected || []).map(item => `<div class="retro-card">${item}</div>`).join('')}
            </div>
            <div class="retro-add-box">
              <input type="text" placeholder="Add challenge..." id="retro-input-harderThanExpected" class="form-input form-input-sm" />
              <button class="btn btn-secondary btn-sm mt-1 btn-add-retro" data-category="harderThanExpected">+ Add</button>
            </div>
          </div>

          <div class="retro-column retro-changes">
            <div class="retro-col-header">
              <span>💡 What We'll Change Next Cycle</span>
            </div>
            <div class="retro-items" id="retro-list-changesForNextCycle">
              ${(retro.changesForNextCycle || []).map(item => `<div class="retro-card">${item}</div>`).join('')}
            </div>
            <div class="retro-add-box">
              <input type="text" placeholder="Add improvement..." id="retro-input-changesForNextCycle" class="form-input form-input-sm" />
              <button class="btn btn-secondary btn-sm mt-1 btn-add-retro" data-category="changesForNextCycle">+ Add</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  }

  renderStoryCards(stories) {
    if (!stories || stories.length === 0) {
      return `<div class="kanban-empty">No stories in this column</div>`;
    }

    return stories.map(story => `
      <div class="kanban-card" data-story-id="${story.id}">
        <div class="story-meta">
          <span class="story-id">${story.id}</span>
          <span class="story-badge badge-points">${story.points} pts</span>
        </div>
        <div class="story-title">${story.title}</div>
        <p class="story-desc">${story.description}</p>
        <div class="story-actions">
          ${story.status !== 'todo' ? `<button class="btn-story-move" data-move="todo" title="Move to To Do">&larr; To Do</button>` : ''}
          ${story.status !== 'in_progress' ? `<button class="btn-story-move" data-move="in_progress" title="Move to In Progress">&#x21c4; In Progress</button>` : ''}
          ${story.status !== 'done' ? `<button class="btn-story-move" data-move="done" title="Mark Done">&rarr; Done</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  renderSvgBurndown(burndownDays) {
    const width = 760;
    const height = 300;
    const padX = 50;
    const padY = 30;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const maxPoints = 35;
    const daysCount = 10;

    const getX = (day) => padX + (day / daysCount) * chartW;
    const getY = (pts) => padY + chartH - (pts / maxPoints) * chartH;

    // Build Ideal Line
    const idealPointsStr = burndownDays
      .map(d => `${getX(d.day)},${getY(d.ideal)}`)
      .join(' ');

    // Build Actual Line
    const actualPointsStr = burndownDays
      .filter(d => d.actual !== null && d.actual !== undefined)
      .map(d => `${getX(d.day)},${getY(d.actual)}`)
      .join(' ');

    // Grid lines for Y axis (0, 10, 20, 30)
    const yTicks = [0, 10, 20, 30, 34];
    const gridLines = yTicks.map(pts => {
      const y = getY(pts);
      return `
        <line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3,3" />
        <text x="${padX - 10}" y="${y + 4}" fill="rgba(255,255,255,0.4)" font-size="11" text-anchor="end">${pts}</text>
      `;
    }).join('');

    // X axis labels
    const xLabels = burndownDays.map(d => {
      const x = getX(d.day);
      return `
        <text x="${x}" y="${height - 8}" fill="rgba(255,255,255,0.5)" font-size="11" text-anchor="middle">D${d.day}</text>
      `;
    }).join('');

    // Actual dots
    const actualDots = burndownDays
      .filter(d => d.actual !== null && d.actual !== undefined)
      .map(d => {
        const cx = getX(d.day);
        const cy = getY(d.actual);
        return `
          <circle cx="${cx}" cy="${cy}" r="4.5" fill="#06b6d4" stroke="#ffffff" stroke-width="2">
            <title>Day ${d.day}: ${d.actual} pts remaining</title>
          </circle>
        `;
      }).join('');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="burndown-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Grid Lines & Axes -->
        ${gridLines}
        ${xLabels}

        <!-- Ideal Burndown Line (Dotted Gray/Indigo) -->
        <polyline points="${idealPointsStr}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-dasharray="6,4" />

        <!-- Actual Burndown Line (Solid Cyan) -->
        <polyline points="${actualPointsStr}" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" />

        <!-- Actual Data Points -->
        ${actualDots}
      </svg>
    `;
  }

  attachEvents(container) {
    // Subtabs switcher
    container.querySelectorAll('.sprint-subtab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.sprint-subtab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-subtab');

        container.querySelectorAll('.sprint-view-section').forEach(sec => sec.style.display = 'none');
        const activeSec = container.querySelector(`#sprint-view-${target}`);
        if (activeSec) activeSec.style.display = 'block';
      });
    });

    // Story Move Buttons
    container.querySelectorAll('.btn-story-move').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = btn.closest('.kanban-card');
        const storyId = card.getAttribute('data-story-id');
        const nextStatus = btn.getAttribute('data-move');
        store.updateSprintStoryStatus(storyId, nextStatus);
        this.render();
      });
    });

    // Burndown Input updates
    container.querySelectorAll('.burndown-input').forEach(input => {
      input.addEventListener('change', () => {
        const idx = Number(input.getAttribute('data-day-idx'));
        const val = input.value !== '' ? Number(input.value) : 0;
        store.updateBurndownDay(idx, val);
        this.render();
      });
    });

    // Add Retrospective Item
    container.querySelectorAll('.btn-add-retro').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        const input = container.querySelector(`#retro-input-${cat}`);
        if (input && input.value.trim()) {
          store.addRetrospectiveItem(cat, input.value.trim());
          input.value = '';
          this.render();
        }
      });
    });
  }
}
