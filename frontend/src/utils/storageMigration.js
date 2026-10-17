/**
 * Storage migration utility for Seenly -> 10Signal rebranding.
 * Idempotently migrates seenly_* keys to tensignal_* keys while preserving user data.
 */

export const STORAGE_KEY_MAP = {
  seenly_owner_token: 'tensignal_owner_token',
  seenly_owner_slug: 'tensignal_owner_slug',
  seenly_display_name: 'tensignal_display_name',
  seenly_avatar: 'tensignal_avatar',
  seenly_is_premium: 'tensignal_is_premium',
  seenly_test_limit: 'tensignal_test_limit',
  seenly_locale: 'tensignal_locale',
  seenly_participant_signal: 'tensignal_participant_signal',
};

export const SESSION_STORAGE_KEY_MAP = {
  seenly_answers: 'tensignal_answers',
  seenly_displayName: 'tensignal_displayName',
  seenly_email: 'tensignal_email',
  seenly_registration_grant: 'tensignal_registration_grant',
  seenly_currentIndex: 'tensignal_currentIndex',
  seenly_isQuickLogin: 'tensignal_isQuickLogin',
  seenly_avatar: 'tensignal_avatar',
  seenly_quickLoginVerified: 'tensignal_quickLoginVerified',
  seenly_pending_login: 'tensignal_pending_login',
};

export function migrateStorage() {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage) {
      for (const [oldKey, newKey] of Object.entries(STORAGE_KEY_MAP)) {
        const newVal = window.localStorage.getItem(newKey);
        const oldVal = window.localStorage.getItem(oldKey);
        if ((newVal === null || newVal === undefined) && (oldVal !== null && oldVal !== undefined)) {
          window.localStorage.setItem(newKey, oldVal);
        }
      }
    }
    if (window.sessionStorage) {
      for (const [oldKey, newKey] of Object.entries(SESSION_STORAGE_KEY_MAP)) {
        const newVal = window.sessionStorage.getItem(newKey);
        const oldVal = window.sessionStorage.getItem(oldKey);
        if ((newVal === null || newVal === undefined) && (oldVal !== null && oldVal !== undefined)) {
          window.sessionStorage.setItem(newKey, oldVal);
        }
      }
    }
  } catch (e) {
    // Ignore restricted storage contexts
  }
}

// Auto-run once on module evaluation
migrateStorage();

export function getOwnerToken() {
  try {
    return localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token');
  } catch (e) {
    return null;
  }
}
