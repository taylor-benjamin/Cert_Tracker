// Calendar Engine: Monthly Grid, Session Markers & Exam Date Milestones
import { store } from './state.js';

export class CalendarManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.currentDate = new Date();
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  }

  today() {
    this.currentDate = new Date();
    this.render();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    // Map sessions by date: YYYY-MM-DD
    const sessionsByDate = {};
    store.state.sessions.forEach(s => {
      if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
      sessionsByDate[s.date].push(s);
    });

    // Map exam goals by date: YYYY-MM-DD
    const examsByDate = {};
    store.state.goals.forEach(g => {
      if (g.targetDate) {
        if (!examsByDate[g.targetDate]) examsByDate[g.targetDate] = [];
        examsByDate[g.targetDate].push(g);
      }
    });

    let cellsHtml = '';

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      cellsHtml += `<div class="cal-cell cal-cell-muted"><span class="cal-day-num">${dayNum}</span></div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      const isToday = isCurrentMonth && d === todayDate;
      const daySessions = sessionsByDate[dateKey] || [];
      const dayExams = examsByDate[dateKey] || [];

      let sessionMarkers = '';
      if (daySessions.length > 0) {
        const totalMinutes = daySessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
        const hours = (totalMinutes / 60).toFixed(1);
        sessionMarkers += `
          <div class="cal-badge-session" title="${daySessions.length} session(s): ${hours} hrs">
            ⚡ ${hours}h
          </div>
        `;
      }

      let examMarkers = '';
      if (dayExams.length > 0) {
        dayExams.forEach(ex => {
          examMarkers += `
            <div class="cal-badge-exam" title="Target Exam Date: ${ex.certName}">
              🎯 ${ex.certCode || 'Exam'}
            </div>
          `;
        });
      }

      cellsHtml += `
        <div class="cal-cell ${isToday ? 'cal-cell-today' : ''} ${daySessions.length > 0 ? 'cal-cell-active' : ''}" data-date="${dateKey}">
          <div class="cal-cell-header">
            <span class="cal-day-num ${isToday ? 'today-pill' : ''}">${d}</span>
          </div>
          <div class="cal-cell-content">
            ${examMarkers}
            ${sessionMarkers}
          </div>
        </div>
      `;
    }

    // Remaining cells to fill grid (up to 35 or 42)
    const totalCellsSoFar = firstDayIndex + daysInMonth;
    const remaining = totalCellsSoFar % 7 === 0 ? 0 : 7 - (totalCellsSoFar % 7);
    for (let j = 1; j <= remaining; j++) {
      cellsHtml += `<div class="cal-cell cal-cell-muted"><span class="cal-day-num">${j}</span></div>`;
    }

    container.innerHTML = `
      <div class="calendar-header-bar">
        <div class="cal-nav-group">
          <button class="btn btn-secondary btn-sm" id="cal-prev-btn">&larr; Prev</button>
          <button class="btn btn-secondary btn-sm" id="cal-today-btn">Today</button>
          <button class="btn btn-secondary btn-sm" id="cal-next-btn">Next &rarr;</button>
        </div>
        <h3 class="cal-month-title">${monthNames[month]} ${year}</h3>
        <button class="btn btn-primary btn-sm" id="cal-log-session-btn">+ Log Session</button>
      </div>
      <div class="cal-weekdays">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <div class="cal-grid">
        ${cellsHtml}
      </div>
    `;

    // Attach calendar navigation handlers
    document.getElementById('cal-prev-btn')?.addEventListener('click', () => this.prevMonth());
    document.getElementById('cal-today-btn')?.addEventListener('click', () => this.today());
    document.getElementById('cal-next-btn')?.addEventListener('click', () => this.nextMonth());
    document.getElementById('cal-log-session-btn')?.addEventListener('click', () => {
      window.certTrackerApp?.openLogSessionModal();
    });

    // Attach click listener to cells for quick inspection
    container.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.getAttribute('data-date');
        window.certTrackerApp?.filterSessionsByDate(date);
      });
    });
  }
}
