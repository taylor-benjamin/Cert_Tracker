// Authentication Management: Sign Up (US-1), Log In / Log Out (US-2), Password Reset (US-3)
import { store } from './state.js';

export class AuthManager {
  constructor() {
    this.modalId = 'auth-modal';
  }

  openAuthModal(initialView = 'login') {
    document.getElementById(this.modalId)?.remove();

    const isLogin = initialView === 'login';
    const isSignup = initialView === 'signup';
    const isReset = initialView === 'reset';

    const modalHtml = `
      <div class="modal-overlay show" id="${this.modalId}">
        <div class="modal-content modal-sm">
          <div class="modal-header">
            <h3 id="auth-modal-title">
              ${isLogin ? 'Welcome Back' : isSignup ? 'Create Your Account' : 'Reset Password'}
            </h3>
            <button class="btn-close" id="btn-close-auth">&times;</button>
          </div>

          <div class="modal-body">
            <!-- LOGIN FORM -->
            <form id="auth-login-form" style="display: ${isLogin ? 'block' : 'none'};">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" id="login-email" required placeholder="alex@example.com" value="${store.state.user?.email || 'alex.rivera@example.com'}">
              </div>
              <div class="form-group">
                <div class="label-row-flex">
                  <label class="form-label">Password</label>
                  <a href="#" class="auth-link text-xs" id="link-to-reset">Forgot password?</a>
                </div>
                <input type="password" class="form-input" id="login-password" required placeholder="••••••••" value="password123">
              </div>

              <button type="submit" class="btn btn-primary w-100 mt-2">Log In to CertTracker</button>

              <div class="auth-switch-text mt-3 text-center text-sm">
                Don't have an account yet? <a href="#" class="auth-link font-bold" id="link-to-signup">Sign Up</a>
              </div>
            </form>

            <!-- SIGN UP FORM (US-1) -->
            <form id="auth-signup-form" style="display: ${isSignup ? 'block' : 'none'};">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-input" id="signup-name" required placeholder="e.g. Jordan Lee">
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" id="signup-email" required placeholder="jordan@example.com">
              </div>
              <div class="form-group">
                <label class="form-label">Choose Password</label>
                <input type="password" class="form-input" id="signup-password" minlength="6" required placeholder="At least 6 characters">
              </div>

              <button type="submit" class="btn btn-primary w-100 mt-2">Create Free Account</button>

              <div class="auth-switch-text mt-3 text-center text-sm">
                Already have an account? <a href="#" class="auth-link font-bold" id="link-to-login">Log In</a>
              </div>
            </form>

            <!-- PASSWORD RESET FORM (US-3) -->
            <form id="auth-reset-form" style="display: ${isReset ? 'block' : 'none'};">
              <p class="text-sm text-muted mb-3">
                Enter your registered email address and we'll send you instructions and a secure link to reset your password.
              </p>
              <div class="form-group">
                <label class="form-label">Registered Email</label>
                <input type="email" class="form-input" id="reset-email" required placeholder="alex@example.com" value="${store.state.user?.email || ''}">
              </div>

              <button type="submit" class="btn btn-primary w-100 mt-2">Send Reset Link</button>

              <div class="auth-switch-text mt-3 text-center text-sm">
                Remember your password? <a href="#" class="auth-link font-bold" id="link-back-to-login">Back to Log In</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    const modal = document.getElementById(this.modalId);
    const close = () => modal.remove();
    modal.querySelector('#btn-close-auth').addEventListener('click', close);

    // Switch view triggers
    const showView = (view) => {
      modal.querySelector('#auth-login-form').style.display = view === 'login' ? 'block' : 'none';
      modal.querySelector('#auth-signup-form').style.display = view === 'signup' ? 'block' : 'none';
      modal.querySelector('#auth-reset-form').style.display = view === 'reset' ? 'block' : 'none';
      modal.querySelector('#auth-modal-title').textContent =
        view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create Your Account' : 'Reset Password';
    };

    modal.querySelector('#link-to-signup')?.addEventListener('click', (e) => { e.preventDefault(); showView('signup'); });
    modal.querySelector('#link-to-reset')?.addEventListener('click', (e) => { e.preventDefault(); showView('reset'); });
    modal.querySelector('#link-to-login')?.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });
    modal.querySelector('#link-back-to-login')?.addEventListener('click', (e) => { e.preventDefault(); showView('login'); });

    // Handle Login
    modal.querySelector('#auth-login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      store.login(email);
      window.certTrackerApp?.showToast(`Logged in successfully as ${email}`, 'success');
      close();
      window.certTrackerApp?.renderAll();
    });

    // Handle Sign Up (US-1)
    modal.querySelector('#auth-signup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      store.setUser({
        id: 'usr_' + Date.now(),
        name,
        email,
        avatar: '👩‍🎓',
        role: 'member',
        joinedDate: new Date().toISOString().split('T')[0]
      });
      window.certTrackerApp?.showToast(`Welcome to CertTracker, ${name}! Account created.`, 'success');
      close();
      window.certTrackerApp?.renderAll();
    });

    // Handle Password Reset (US-3)
    modal.querySelector('#auth-reset-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value.trim();
      alert(`🔐 Password Reset Simulated:\nA password reset link has been dispatched to ${email}.\n(In production, an automated token email with a 60-minute expiration is sent via transactional mailer.)`);
      window.certTrackerApp?.showToast(`Reset instructions sent to ${email}`, 'info');
      showView('login');
    });
  }

  logout() {
    store.logout();
    window.certTrackerApp?.showToast('You have been logged out.', 'info');
    window.certTrackerApp?.renderAll();
  }
}

export const authManager = new AuthManager();
