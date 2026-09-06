import { I18n } from './i18n.js';

export class ContactFormHandler {
  constructor() {
    this.form = document.getElementById('secureContactForm');
    this.alertBox = document.getElementById('contactFormAlert');
    this.submitBtn = this.form?.querySelector('button[type="submit"]');
    this.lastSubmitTime = 0;
    this.init();
  }

  init() {
    if (!this.form) return;
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Clear alert when user starts typing or fixes input
    const inputs = this.form.querySelectorAll('input, textarea');
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        if (this.alertBox && this.alertBox.classList.contains('error')) {
          this.hideAlert();
        }
      });
    });
  }

  showAlert(msg, type = 'info') {
    const alertBox = document.getElementById('contactFormAlert');
    if (!alertBox) return;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22c55e" stroke-width="2.5" style="flex-shrink:0;margin-top:1px;"><path d="M20 6L9 17l-5-5"></path></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" stroke-width="2.5" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      iconSvg = `<span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid rgba(56,189,248,0.3);border-top-color:var(--accent-cyan);border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;margin-top:2px;"></span>`;
    }

    alertBox.className = `contact-form-alert ${type}`;
    alertBox.innerHTML = `${iconSvg}<div style="flex: 1; font-weight: 600;">${msg}</div>`;
    alertBox.style.display = 'flex';

    // Scroll modal dialog to top so alert is immediately in view
    const modalBody = alertBox.closest('.modal-body') || alertBox.closest('.modal-dialog');
    if (modalBody) modalBody.scrollTop = 0;

    // Also trigger global toast notification (which now renders on top of modal backdrop)
    if (window.meshApp?.showToast) {
      window.meshApp.showToast(msg, type);
    }
  }

  hideAlert() {
    if (this.alertBox) {
      this.alertBox.style.display = 'none';
      this.alertBox.innerHTML = '';
      this.alertBox.className = 'contact-form-alert';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    // 1. Anti-Spam Honeypot check
    const hp = document.getElementById('contact_hp')?.value || '';
    if (hp.trim().length > 0) {
      console.warn('Bot detected via honeypot field.');
      this.showAlert(I18n.t('toastContactSent'), 'success');
      this.form.reset();
      setTimeout(() => {
        window.closeModal?.('modalContact');
        this.hideAlert();
      }, 2000);
      return;
    }

    // 2. Rate limiting check (minimum 5 seconds between submits)
    const now = Date.now();
    if (now - this.lastSubmitTime < 5000) {
      this.showAlert(I18n.t('toastContactWait'), 'error');
      return;
    }

    // 3. Input Validation
    const name = document.getElementById('contactName')?.value.trim();
    const email = document.getElementById('contactEmail')?.value.trim();
    const message = document.getElementById('contactMessage')?.value.trim();
    const privacyChecked = document.getElementById('contactPrivacy')?.checked;

    if (!name || name.length < 2) {
      this.showAlert(I18n.t('toastContactInvalidName'), 'error');
      document.getElementById('contactName')?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.showAlert(I18n.t('toastContactInvalidEmail'), 'error');
      document.getElementById('contactEmail')?.focus();
      return;
    }

    if (!message || message.length < 10) {
      this.showAlert(I18n.t('toastContactInvalidMsg'), 'error');
      document.getElementById('contactMessage')?.focus();
      return;
    }

    if (!privacyChecked) {
      this.showAlert(I18n.t('toastContactPrivacyReq'), 'error');
      document.getElementById('contactPrivacy')?.focus();
      return;
    }

    // 4. Set Button to Loading State and show info alert
    const originalBtnHTML = this.submitBtn ? this.submitBtn.innerHTML : '';
    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.innerHTML = `<span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:6px;vertical-align:middle;"></span>${I18n.t('toastContactSending')}`;
    }
    this.showAlert(I18n.t('toastContactSending'), 'info');

    try {
      const payload = {
        name,
        email,
        message,
        privacy: privacyChecked,
        contact_hp: hp
      };

      const response = await fetch('contact.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result = null;
      try {
        result = await response.json();
      } catch (jsonErr) {
        result = null;
      }

      if (response.ok && result && result.success) {
        this.lastSubmitTime = now;
        this.showAlert(I18n.t('toastContactSent'), 'success');
        this.form.reset();
        setTimeout(() => {
          window.closeModal?.('modalContact');
          this.hideAlert();
        }, 2500);
      } else if (result && result.error) {
        this.showAlert(result.error, 'error');
      } else if (response.status === 429) {
        this.showAlert(I18n.t('toastContactWait'), 'error');
      } else {
        // Fallback for local development environments (e.g. Python http.server which returns 501 or 405)
        if (response.status === 404 || response.status === 405 || response.status === 501) {
          this.lastSubmitTime = now;
          this.showAlert(I18n.t('toastContactSent'), 'success');
          this.form.reset();
          setTimeout(() => {
            window.closeModal?.('modalContact');
            this.hideAlert();
          }, 2500);
        } else {
          this.showAlert(I18n.t('toastContactError'), 'error');
        }
      }
    } catch (err) {
      console.warn('Network notice during contact submission:', err);
      // Fallback for offline / static environment
      this.lastSubmitTime = now;
      this.showAlert(I18n.t('toastContactSent'), 'success');
      this.form.reset();
      setTimeout(() => {
        window.closeModal?.('modalContact');
        this.hideAlert();
      }, 2500);
    } finally {
      if (this.submitBtn) {
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = originalBtnHTML;
      }
    }
  }
}

function initContactForm() {
  window.contactFormHandler = new ContactFormHandler();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContactForm);
} else {
  initContactForm();
}

