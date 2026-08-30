/**
 * cookie-consent.js - 100% DSGVO/GDPR Compliant Local Cookie & Privacy Banner
 * Pure Vanilla JS, zero external tracking, persists choice in localStorage.
 */

import { I18n } from './i18n.js';

const STORAGE_KEY = 'mesh3d_cookie_consent_v1';

export function showCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.style.removeProperty('display');
    banner.classList.add('show');
    banner.style.display = 'block';
  }
}

export function hideCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.classList.remove('show');
    banner.style.display = 'none';
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

// Global functions for direct inline onclick and window calls
window.openCookieBanner = (e) => {
  if (e && e.preventDefault) e.preventDefault();
  showCookieBanner();
};
window.closeCookieBanner = hideCookieBanner;
window.acceptCookies = acceptAllCookies;
window.essentialCookies = acceptEssentialCookies;

function init() {
  // Bind buttons
  const btnAcceptAll = document.getElementById('btnCookieAcceptAll');
  if (btnAcceptAll) {
    btnAcceptAll.addEventListener('click', (e) => {
      e.preventDefault();
      acceptAllCookies();
    });
  }

  const btnEssential = document.getElementById('btnCookieEssentialOnly');
  if (btnEssential) {
    btnEssential.addEventListener('click', (e) => {
      e.preventDefault();
      acceptEssentialCookies();
    });
  }

  const btnOpenSettings = document.getElementById('btnOpenCookieSettings');
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', (e) => {
      e.preventDefault();
      showCookieBanner();
    });
  }

  const btnClose = document.getElementById('btnCookieClose');
  if (btnClose) {
    btnClose.addEventListener('click', (e) => {
      e.preventDefault();
      hideCookieBanner();
    });
  }

  // Check stored consent
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

