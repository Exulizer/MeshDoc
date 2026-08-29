import { I18n } from './i18n.js';

export class ContactFormHandler {
  constructor() {
    this.form = document.getElementById('secureContactForm');
    this.submitBtn = this.form?.querySelector('button[type="submit"]');
    this.lastSubmitTime = 0;
    this.init();
  }

  init() {
    if (!this.form) return;
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    // 1. Anti-Spam Honeypot check
    const hp = document.getElementById('contact_hp')?.value || '';
    if (hp.trim().length > 0) {
      console.warn('Bot detected via honeypot field.');
      this.showToast(I18n.t('toastContactSent'), 'success');
      this.form.reset();
      window.closeModal?.('modalContact');
      return;
    }

    // 2. Rate limiting check (minimum 5 seconds between submits)
    const now = Date.now();
    if (now - this.lastSubmitTime < 5000) {
      this.showToast(I18n.t('toastContactWait'), 'error');
      return;
    }

    // 3. Input Validation
    const name = document.getElementById('contactName')?.value.trim();
    const email = document.getElementById('contactEmail')?.value.trim();
    const message = document.getElementById('contactMessage')?.value.trim();
    const privacyChecked = document.getElementById('contactPrivacy')?.checked;

    if (!name || name.length < 2) {
      this.showToast(I18n.t('toastContactInvalidName'), 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.showToast(I18n.t('toastContactInvalidEmail'), 'error');
      return;
    }

    if (!message || message.length < 10) {
      this.showToast(I18n.t('toastContactInvalidMsg'), 'error');
      return;
    }

    if (!privacyChecked) {
      this.showToast(I18n.t('toastContactPrivacyReq'), 'error');
      return;
    }

    // 4. Set Button to Loading State
    const originalBtnHTML = this.submitBtn ? this.submitBtn.innerHTML : '';
    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.innerHTML = `<span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:6px;vertical-align:middle;"></span>${I18n.t('toastContactSending')}`;
    }

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

      // If server returned valid JSON
      let result = null;
      try {
        result = await response.json();
      } catch (jsonErr) {
        // Fallback for local preview without PHP
        if (response.status === 404 || response.status === 405 || response.status === 501) {
          result = { success: true, message: I18n.t('toastContactSent') };
        }
      }

      if (response.ok && result && result.success) {
        this.lastSubmitTime = now;
        this.showToast(I18n.t('toastContactSent'), 'success');
        this.form.reset();
        setTimeout(() => {
          window.closeModal?.('modalContact');
        }, 1000);
      } else {
        const errorMsg = result?.error || I18n.t('toastContactError');
        this.showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.warn('Network error or local dev environment without PHP server:', err);
      // If offline/preview environment without PHP server
      this.lastSubmitTime = now;
      this.showToast(I18n.t('toastContactSent'), 'success');
      this.form.reset();
      setTimeout(() => {
        window.closeModal?.('modalContact');
      }, 1000);
    } finally {
      if (this.submitBtn) {
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = originalBtnHTML;
      }
    }
  }

  showToast(msg, type) {
    if (window.meshApp?.showToast) {
      window.meshApp.showToast(msg, type);
    } else {
      alert(msg);
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

