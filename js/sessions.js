// Study Sessions Management: Filtering, Search, Modals & CSV/Print Exports
import { store } from './state.js';

export class SessionsManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.filters = {
      search: '',
      certId: 'all',
      domain: 'all',
      dateFrom: '',
      dateTo: ''
    };
  }

  setFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.render();
  }

  getFilteredSessions() {
    return store.state.sessions.filter(sess => {
      // Search
      if (this.filters.search) {
        const query = this.filters.search.toLowerCase();
        const matchTopic = (sess.topic || '').toLowerCase().includes(query);
        const matchNotes = (sess.notes || '').toLowerCase().includes(query);
        const matchCert = (sess.certName || '').toLowerCase().includes(query);
        if (!matchTopic && !matchNotes && !matchCert) return false;
      }

      // Cert filter
      if (this.filters.certId && this.filters.certId !== 'all') {
        if (sess.certId !== this.filters.certId) return false;
      }

      // Domain filter
      if (this.filters.domain && this.filters.domain !== 'all') {
        if (sess.domain !== this.filters.domain) return false;
      }

      // Date range filter
      if (this.filters.dateFrom) {
        if (sess.date < this.filters.dateFrom) return false;
      }
      if (this.filters.dateTo) {
        if (sess.date > this.filters.dateTo) return false;
      }

      return true;
    });
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const filtered = this.getFilteredSessions();
    const certifications = store.state.certifications;

    // Build unique domain options based on selected cert or all certs
    let domainOptions = '<option value="all">All Domains</option>';
    const availableDomains = new Set();
    certifications.forEach(c => {
      if (this.filters.certId === 'all' || c.id === this.filters.certId) {
        c.domains?.forEach(d => availableDomains.add(d.name));
      }
    });
    availableDomains.forEach(d => {
      domainOptions += `<option value="${d}" ${this.filters.domain === d ? 'selected' : ''}>${d}</option>`;
    });

    const totalMinutes = filtered.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    container.innerHTML = `
      <div class="sessions-header-controls card mb-3">
        <div class="filter-row">
          <div class="filter-group flex-1">
            <label class="filter-label">Search Topics & Notes</label>
            <input type="text" class="form-input" id="session-search-input" placeholder="e.g. VPC, conflict resolution..." value="${this.filters.search}">
          </div>

          <div class="filter-group">
            <label class="filter-label">Certification</label>
            <select class="form-select" id="session-cert-filter">
              <option value="all">All Certifications</option>
              ${certifications.map(c => `
                <option value="${c.id}" ${this.filters.certId === c.id ? 'selected' : ''}>${c.code} – ${c.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Domain / Topic Category</label>
            <select class="form-select" id="session-domain-filter">
              ${domainOptions}
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">From Date</label>
            <input type="date" class="form-input" id="session-date-from" value="${this.filters.dateFrom}">
          </div>

          <div class="filter-group">
            <label class="filter-label">To Date</label>
            <input type="date" class="form-input" id="session-date-to" value="${this.filters.dateTo}">
          </div>
        </div>

        <div class="filter-actions-bar mt-2">
          <div class="summary-stats">
            <span>Showing <strong>${filtered.length}</strong> session(s)</span>
            <span class="mx-2">•</span>
            <span>Total: <strong>${totalHours} hours</strong></span>
          </div>

          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Reset Filters</button>
            <button class="btn btn-secondary btn-sm" id="btn-export-csv">📥 Export CSV</button>
            <button class="btn btn-secondary btn-sm" id="btn-print-report">🖨️ Print Report</button>
            <button class="btn btn-primary btn-sm" id="btn-log-session">+ Log Study Session</button>
          </div>
        </div>
      </div>

      <div class="sessions-table-card card">
        ${filtered.length === 0 ? `
          <div class="empty-state p-4">
            <div class="empty-icon">📝</div>
            <h4>No Study Sessions Found</h4>
            <p class="text-muted">Try adjusting your search criteria or log your latest study session.</p>
          </div>
        ` : `
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Certification</th>
                  <th>Domain / Category</th>
                  <th>Topic & Notes</th>
                  <th>Duration</th>
                  <th>Method</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(sess => {
                  const hours = (Number(sess.durationMinutes) / 60).toFixed(1);
                  return `
                    <tr data-session-id="${sess.id}">
                      <td class="font-bold text-nowrap">${sess.date}</td>
                      <td>
                        <span class="badge badge-secondary">${sess.certName || 'Cert'}</span>
                      </td>
                      <td>
                        <span class="domain-pill" title="${sess.domain}">${sess.domain || 'General'}</span>
                      </td>
                      <td>
                        <div class="topic-title font-bold">${sess.topic}</div>
                        ${sess.notes ? `<div class="topic-notes text-muted text-sm">${sess.notes}</div>` : ''}
                      </td>
                      <td class="font-bold text-accent text-nowrap">
                        ${hours}h <span class="text-muted text-xs">(${sess.durationMinutes}m)</span>
                      </td>
                      <td>
                        <span class="method-tag">${sess.method || 'Self-Study'}</span>
                      </td>
                      <td style="text-align: right;" class="text-nowrap">
                        <button class="btn-icon btn-sm" title="Edit Session" data-action="edit-session" data-session-id="${sess.id}">✏️</button>
                        <button class="btn-icon btn-sm text-danger" title="Delete Session" data-action="delete-session" data-session-id="${sess.id}">🗑️</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    this.attachEvents(container);
  }

  attachEvents(container) {
    // Search input
    container.querySelector('#session-search-input')?.addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.render();
    });

    // Cert filter
    container.querySelector('#session-cert-filter')?.addEventListener('change', (e) => {
      this.filters.certId = e.target.value;
      this.filters.domain = 'all'; // reset domain when cert changes
      this.render();
    });

    // Domain filter
    container.querySelector('#session-domain-filter')?.addEventListener('change', (e) => {
      this.filters.domain = e.target.value;
      this.render();
    });

    // Dates
    container.querySelector('#session-date-from')?.addEventListener('change', (e) => {
      this.filters.dateFrom = e.target.value;
      this.render();
    });
    container.querySelector('#session-date-to')?.addEventListener('change', (e) => {
      this.filters.dateTo = e.target.value;
      this.render();
    });

    // Reset
    container.querySelector('#btn-reset-filters')?.addEventListener('click', () => {
      this.filters = { search: '', certId: 'all', domain: 'all', dateFrom: '', dateTo: '' };
      this.render();
    });

    // Log Session
    container.querySelector('#btn-log-session')?.addEventListener('click', () => {
      window.certTrackerApp?.openLogSessionModal();
    });

    // Export CSV
    container.querySelector('#btn-export-csv')?.addEventListener('click', () => {
      this.exportToCsv();
    });

    // Print Report
    container.querySelector('#btn-print-report')?.addEventListener('click', () => {
      window.print();
    });

    // Edit Session
    container.querySelectorAll('[data-action="edit-session"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-session-id');
        window.certTrackerApp?.openEditSessionModal(id);
      });
    });

    // Delete Session
    container.querySelectorAll('[data-action="delete-session"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-session-id');
        if (confirm('Delete this study session record?')) {
          store.deleteSession(id);
          window.certTrackerApp?.showToast('Study session deleted', 'info');
          this.render();
          window.certTrackerApp?.renderAll();
        }
      });
    });
  }

  exportToCsv() {
    const sessions = this.getFilteredSessions();
    if (sessions.length === 0) {
      alert('No sessions to export based on current filters.');
      return;
    }

    const headers = ['Date', 'Certification', 'Domain', 'Topic', 'DurationMinutes', 'DurationHours', 'Method', 'Notes'];
    const rows = sessions.map(s => [
      `"${s.date}"`,
      `"${(s.certName || '').replace(/"/g, '""')}"`,
      `"${(s.domain || '').replace(/"/g, '""')}"`,
      `"${(s.topic || '').replace(/"/g, '""')}"`,
      s.durationMinutes,
      (Number(s.durationMinutes) / 60).toFixed(2),
      `"${(s.method || '').replace(/"/g, '""')}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CertTracker_Study_Sessions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
