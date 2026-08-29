/**
 * cookie-consent.js - 100% DSGVO/GDPR Compliant Local Cookie & Privacy Banner
 * Pure Vanilla JS, zero external tracking, persists choice in localStorage.
 */

import { I18n } from './i18n.js';

const STORAGE_KEY = 'mesh3d_cookie_consent_v1';

export function showCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.classList.add('show');
    banner.style.setProperty('display', 'block', 'important');
  }
}

export function hideCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.classList.remove('show');
    banner.style.setProperty('display', 'none', 'important');
  }
}

export function acceptAllCookies() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, analytics: false, date: new Date().toISOString() }));
  } catch (e) {
    console.warn(e);
  }
  hideCookieBanner();
  if (window.meshApp?.showToast) {
    window.meshApp.showToast(I18n.t('toastCookieSaved'), 'info');
  }
}

export function acceptEssentialCookies() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, analytics: false, date: new Date().toISOString() }));
  } catch (e) {
    console.warn(e);
  }
  hideCookieBanner();
  if (window.meshApp?.showToast) {
    window.meshApp.showToast(I18n.t('toastCookieSaved'), 'info');
  }
}

// Global functions for direct inline onclick
window.openCookieBanner = (e) => {
  if (e && e.preventDefault) e.preventDefault();
  showCookieBanner();
};
window.closeCookieBanner = hideCookieBanner;
window.acceptCookies = acceptAllCookies;
window.essentialCookies = acceptEssentialCookies;

// Synchronous check on load
function init() {
  let consent = null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    consent = stored ? JSON.parse(stored) : null;
  } catch (e) {
    consent = null;
  }

  if (!consent) {
    showCookieBanner();
  } else {
    hideCookieBanner();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
