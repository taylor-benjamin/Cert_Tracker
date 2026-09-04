// Admin Catalog: Supported Certifications, Default Hours & Exam Domains Management
import { store } from './state.js';

export class AdminManager {
  constructor(containerId) {
    this.containerId = containerId;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const certs = store.state.certifications || [];

    container.innerHTML = `
      <div class="admin-catalog-card card mb-3">
        <div class="card-header-flex">
          <div>
            <h3>🛠️ Manage Supported Certifications (Admin)</h3>
            <p class="text-muted text-sm">Configure certification templates, benchmark study hours, and official exam domains</p>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-add-cert">+ Add New Certification</button>
        </div>

        <div class="admin-cert-grid mt-3">
          ${certs.map(cert => `
            <div class="cert-admin-box card" data-cert-id="${cert.id}">
              <div class="cert-admin-top">
                <div class="cert-admin-identity">
                  <span class="cert-icon-lg">${cert.icon || '🎓'}</span>
                  <div>
                    <h4 class="cert-admin-name">${cert.name}</h4>
                    <span class="badge badge-secondary">${cert.code}</span>
                    <span class="text-muted text-xs mx-1">•</span>
                    <span class="text-muted text-xs">${cert.category || 'Professional'}</span>
                  </div>
                </div>
                <div class="cert-admin-actions">
                  <button class="btn-icon btn-sm" data-action="edit-cert" data-cert-id="${cert.id}" title="Edit Certification">✏️</button>
                  <button class="btn-icon btn-sm text-danger" data-action="delete-cert" data-cert-id="${cert.id}" title="Delete Certification">🗑️</button>
                </div>
              </div>

              <div class="cert-admin-body mt-2">
                <div class="cert-stat-line">
                  <span class="text-muted text-sm">Target Study Hours:</span>
                  <strong class="text-accent">${cert.defaultTargetHours || 80} hrs</strong>
                </div>
                <div class="cert-stat-line">
                  <span class="text-muted text-sm">Avg Velocity:</span>
                  <span>${cert.avgWeeksToCertify || 10} weeks (~${cert.avgHoursPerWeek || 9}h/wk)</span>
                </div>

                <div class="cert-domains-summary mt-2">
                  <span class="text-muted text-xs font-bold uppercase">Official Exam Domains (${cert.domains?.length || 0}):</span>
                  <ul class="domain-mini-list mt-1">
                    ${(cert.domains || []).map(d => `
                      <li><span class="domain-weight-badge">${d.weight ? d.weight + '%' : ''}</span> ${d.name}</li>
                    `).join('')}
                  </ul>
                </div>

                <div class="cert-resources-summary mt-2">
                  <span class="text-muted text-xs font-bold uppercase">Suggested Resources (${cert.suggestedResources?.length || 0}):</span>
                  <div class="resource-pill-group mt-1">
                    ${(cert.suggestedResources || []).map(r => `
                      <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-chip" title="${r.title}">
                        🔗 ${r.title}
                      </a>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.attachEvents(container);
  }

  attachEvents(container) {
    container.querySelector('#btn-add-cert')?.addEventListener('click', () => {
      this.openAddCertModal();
    });

    container.querySelectorAll('[data-action="edit-cert"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const certId = btn.getAttribute('data-cert-id');
        this.openEditCertModal(certId);
      });
    });

    container.querySelectorAll('[data-action="delete-cert"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const certId = btn.getAttribute('data-cert-id');
        if (confirm('Are you sure you want to remove this certification from the catalog?')) {
          store.deleteSupportedCert(certId);
          window.certTrackerApp?.showToast('Certification removed from catalog', 'info');
          this.render();
          window.certTrackerApp?.renderAll();
        }
      });
    });
  }

  openAddCertModal() {
    this.openCertModal('Add New Certification', null);
  }

  openEditCertModal(certId) {
    const cert = store.state.certifications.find(c => c.id === certId);
    if (cert) {
      this.openCertModal('Edit Supported Certification', cert);
    }
  }

  openCertModal(title, cert = null) {
    const existingDomainsStr = cert?.domains?.map(d => `${d.name} (${d.weight || 25}%)`).join('\n') || '';

    const modalHtml = `
      <div class="modal-overlay show" id="cert-admin-modal">
        <div class="modal-content modal-md">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="btn-close" id="btn-close-cert-modal">&times;</button>
          </div>
          <form id="cert-admin-form">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Certification Name *</label>
                  <input type="text" class="form-input" id="admin-cert-name" required value="${cert?.name || ''}" placeholder="e.g. Certified Information Systems Security Professional">
                </div>
                <div class="form-group w-30">
                  <label class="form-label">Exam Code *</label>
                  <input type="text" class="form-input" id="admin-cert-code" required value="${cert?.code || ''}" placeholder="e.g. CISSP">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Provider / Organization</label>
                  <input type="text" class="form-input" id="admin-cert-provider" value="${cert?.provider || ''}" placeholder="e.g. (ISC)²">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Category</label>
                  <input type="text" class="form-input" id="admin-cert-category" value="${cert?.category || ''}" placeholder="e.g. Cybersecurity">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Default Target Hours</label>
                  <input type="number" class="form-input" id="admin-cert-hours" min="10" max="1000" value="${cert?.defaultTargetHours || 90}">
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Avg Weeks to Certify</label>
                  <input type="number" class="form-input" id="admin-cert-weeks" min="1" max="52" value="${cert?.avgWeeksToCertify || 10}">
                </div>
                <div class="form-group w-20">
                  <label class="form-label">Icon Emoji</label>
                  <input type="text" class="form-input" id="admin-cert-icon" value="${cert?.icon || '🎓'}" maxlength="2">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Exam Domains / Topics (One per line, optional weight in parenthesis)</label>
                <textarea class="form-textarea" id="admin-cert-domains" rows="4" placeholder="Security and Risk Management (15%)\nAsset Security (10%)\nSecurity Architecture (13%)">${existingDomainsStr}</textarea>
                <span class="text-muted text-xs">Example: Security Operations (13%)</span>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-cert-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Certification</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    const modal = document.getElementById('cert-admin-modal');
    const close = () => modal.remove();
    modal.querySelector('#btn-close-cert-modal').addEventListener('click', close);
    modal.querySelector('#btn-cancel-cert-modal').addEventListener('click', close);

    modal.querySelector('#cert-admin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('admin-cert-name').value.trim();
      const code = document.getElementById('admin-cert-code').value.trim();
      const provider = document.getElementById('admin-cert-provider').value.trim();
      const category = document.getElementById('admin-cert-category').value.trim();
      const hours = Number(document.getElementById('admin-cert-hours').value) || 80;
      const weeks = Number(document.getElementById('admin-cert-weeks').value) || 10;
      const icon = document.getElementById('admin-cert-icon').value.trim() || '🎓';

      const domainsRaw = document.getElementById('admin-cert-domains').value.split('\n');
      const domains = domainsRaw
        .map(line => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
          const matchWeight = line.match(/\((\d+)%\)/);
          const cleanName = line.replace(/\(\d+%\)/, '').trim();
          return {
            id: 'd_' + idx,
            name: cleanName,
            weight: matchWeight ? Number(matchWeight[1]) : 20
          };
        });

      if (cert) {
        store.updateSupportedCert(cert.id, {
          name, code, provider, category,
          defaultTargetHours: hours,
          avgWeeksToCertify: weeks,
          icon,
          domains
        });
        window.certTrackerApp?.showToast('Certification updated successfully!', 'success');
      } else {
        store.addSupportedCert({
          code, name, provider, category,
          defaultTargetHours: hours,
          avgWeeksToCertify: weeks,
          icon,
          domains
        });
        window.certTrackerApp?.showToast('New certification added to catalog!', 'success');
      }

      close();
      this.render();
      window.certTrackerApp?.renderAll();
    });
  }
}
