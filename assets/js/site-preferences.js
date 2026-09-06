/**
 * site-preferences.js - 100% DSGVO/GDPR Compliant Local Privacy & Preference Manager
 * Pure Vanilla JS, zero external tracking, persists choice in localStorage.
 * Resilient against client-side ad-blockers and privacy extensions.
 */

import { I18n } from './i18n.js';

const PRIMARY_STORAGE_KEY = 'mesh3d_preferences_v1';
const LEGACY_STORAGE_KEY = 'mesh3d_cookie_consent_v1';

function getBanner() {
  return document.getElementById('siteNoticeBanner') || document.getElementById('cookieBanner');
}

export function showPreferences() {
  const banner = getBanner();
  if (banner) {
    banner.style.removeProperty('display');
    banner.classList.add('show');
    banner.style.display = 'block';
  }
}

export function hidePreferences() {
  const banner = getBanner();
  if (banner) {
    banner.classList.remove('show');
    banner.style.display = 'none';
  }
}

function persistConsent(choice) {
  const data = JSON.stringify({
    essential: true,
    analytics: false,
    date: new Date().toISOString(),
    choice: choice
  });
  try {
    localStorage.setItem(PRIMARY_STORAGE_KEY, data);
    localStorage.setItem(LEGACY_STORAGE_KEY, data);
  } catch (e) {
    console.warn('LocalStorage unavailable:', e);
  }
}

export function acceptAllPreferences() {
  persistConsent('all');
  hidePreferences();
  if (window.meshApp?.showToast) {
    window.meshApp.showToast(I18n.t('toastCookieSaved'), 'info');
  }
}

export function acceptEssentialPreferences() {
  persistConsent('essential');
  hidePreferences();
  if (window.meshApp?.showToast) {
    window.meshApp.showToast(I18n.t('toastCookieSaved'), 'info');
  }
}

// Global functions for direct inline onclick and backwards compatibility
window.openPreferences = (e) => {
  if (e && e.preventDefault) e.preventDefault();
  showPreferences();
};
window.closePreferences = hidePreferences;
window.acceptPreferences = acceptAllPreferences;
window.essentialPreferences = acceptEssentialPreferences;

// Backwards compatibility aliases
window.openCookieBanner = window.openPreferences;
window.closeCookieBanner = window.closePreferences;
window.acceptCookies = window.acceptPreferences;
window.essentialCookies = window.essentialPreferences;

function init() {
  // Bind Accept All button (new and legacy IDs)
  const btnAcceptAll = document.getElementById('btnNoticeAcceptAll') || document.getElementById('btnCookieAcceptAll');
  if (btnAcceptAll) {
    btnAcceptAll.addEventListener('click', (e) => {
      e.preventDefault();
      acceptAllPreferences();
    });
  }

  // Bind Essential Only button (new and legacy IDs)
  const btnEssential = document.getElementById('btnNoticeEssentialOnly') || document.getElementById('btnCookieEssentialOnly');
  if (btnEssential) {
    btnEssential.addEventListener('click', (e) => {
      e.preventDefault();
      acceptEssentialPreferences();
    });
  }

  // Bind Footer Open Settings button (new and legacy IDs)
  const btnOpenSettings = document.getElementById('btnOpenPrivacySettings') || document.getElementById('btnOpenCookieSettings');
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', (e) => {
      e.preventDefault();
      showPreferences();
    });
  }

  // Bind Close (x) button (new and legacy IDs)
  const btnClose = document.getElementById('btnNoticeClose') || document.getElementById('btnCookieClose');
  if (btnClose) {
    btnClose.addEventListener('click', (e) => {
      e.preventDefault();
      hidePreferences();
    });
  }

  // Check stored consent from either storage key
  let consent = null;
  try {
    const stored = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    consent = stored ? JSON.parse(stored) : null;
  } catch (e) {
    consent = null;
  }

  if (!consent) {
    showPreferences();
  } else {
    hidePreferences();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
