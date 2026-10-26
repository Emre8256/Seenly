import { migrateStorage } from '../utils/storageMigration';

/**
 * Resolves the API base URL prefix.
 * In development and test environments, an empty prefix is expected to leverage Vite's dev proxy.
 * In production builds, warns clearly if VITE_API_URL is missing to avoid silent routing to Netlify SPA fallback.
 */
export function getApiBaseUrl() {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD && !envUrl) {
    console.error(
      '[10Signal Configuration Warning] VITE_API_URL is not set in production build. ' +
      'Requests may resolve to local SPA HTML fallback instead of the backend API (https://api.10signal.me).'
    );
  }
  return envUrl;
}

const BASE_URL = `${getApiBaseUrl()}/api/v1/tensignal`;

/**
 * Submits the owner's name, email and answers to create a 10Signal profile.
 * Returns { ownerToken, publicSlug, resultSnapshot }.
 */
export async function createTenSignal(displayName, email, selfAnswers, registrationGrant, locale = null) {
  const payload = { displayName, email, selfAnswers, registrationGrant };
  if (locale) {
    payload.locale = locale;
  }
  const response = await fetch(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMsg = 'Error creating 10Signal profile';
    let errData = null;
    try {
      errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = errData;
    throw err;
  }
  return response.json();
}

/**
 * Updates the owner's display name.
 * PUT /api/v1/tensignal/owner/display-name
 */
export async function updateDisplayName(ownerToken, newDisplayName) {
  const response = await fetch(`${BASE_URL}/owner/display-name`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-Owner-Token': ownerToken 
    },
    body: JSON.stringify({ displayName: newDisplayName })
  });

  if (!response.ok) {
    let errorMsg = 'Error updating display name';
    let errData = null;
    try {
      errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = errData;
    throw err;
  }

  return response.json();
}

/**
 * Updates the owner's email address.
 * PUT /api/v1/tensignal/owner/email
 */
export async function updateEmail(ownerToken, newEmail, verificationGrant) {
  const response = await fetch(`${BASE_URL}/owner/email`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-Owner-Token': ownerToken 
    },
    body: JSON.stringify({ email: newEmail, verificationGrant })
  });

  if (!response.ok) {
    let errorMsg = 'Error updating email';
    let errData = null;
    try {
      errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = errData;
    throw err;
  }

  return response.json();
}

/**
 * Updates the owner's chosen avatar.
 * PUT /api/v1/tensignal/owner/avatar
 */
export async function updateAvatar(ownerToken, avatar) {
  const response = await fetch(`${BASE_URL}/owner/avatar`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-Owner-Token': ownerToken 
    },
    body: JSON.stringify({ avatar })
  });

  if (!response.ok) {
    let errorMsg = 'Error updating avatar';
    let errData = null;
    try {
      errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = errData;
    throw err;
  }

  return response.json();
}

/**
 * Updates the owner's preferred language.
 * PUT /api/v1/tensignal/owner/locale
 */
export async function updateOwnerLocale(ownerToken, locale) {
  const response = await fetch(`${BASE_URL}/owner/locale`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Owner-Token': ownerToken
    },
    body: JSON.stringify({ locale })
  });

  if (!response.ok) {
    let errorMsg = 'Error updating locale';
    let errData = null;
    try {
      errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = errData;
    throw err;
  }

  return response.json();
}

/**
 * Requests a verification code to be sent to the user's email.
 */
export async function sendVerificationCode(email, purpose, ownerToken = null, locale = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (ownerToken) headers['X-Owner-Token'] = ownerToken;
  const payload = { email, purpose };
  if (locale) {
    payload.locale = locale;
  }
  const response = await fetch(`${BASE_URL}/auth/send-code`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMsg = 'Error sending verification code';
    let errData = null;
    try {
      errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = errData;
    throw err;
  }

  // Sending an OTP is a command: callers only need to know that the server
  // accepted it. Some deployments/proxies legitimately return an empty 2xx
  // response, so JSON parsing must not turn a successful send into a client
  // error and prevent the UI from advancing to the code-entry step.
  const responseText = await response.text();
  if (!responseText) return { status: 'success' };

  try {
    return JSON.parse(responseText);
  } catch {
    return { status: 'success' };
  }
}

/**
 * Verifies the 6-digit verification code entered by the user.
 */
export async function verifyCode(email, code, purpose, ownerToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (ownerToken) headers['X-Owner-Token'] = ownerToken;
  const response = await fetch(`${BASE_URL}/auth/verify-code`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, code, purpose })
  });

  if (!response.ok) {
    let errorMsg = 'Error verifying code';
    let errData = null;
    try {
      errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = errData;
    throw err;
  }

  return response.json();
}

/**
 * Checks the delivery status of an OTP email (PENDING, DELIVERED, FAILED).
 */
export async function getOtpDeliveryStatus(email, purpose, ownerToken = null) {
  try {
    const headers = {};
    if (ownerToken) headers['X-Owner-Token'] = ownerToken;
    const params = new URLSearchParams({ email, purpose });
    const response = await fetch(`${BASE_URL}/auth/otp-delivery-status?${params}`, {
      headers
    });
    if (!response.ok) {
      return { deliveryStatus: 'UNKNOWN' };
    }
    return response.json();
  } catch {
    return { deliveryStatus: 'UNKNOWN' };
  }
}

/**
 * Retrieves the owner's quiz result snapshot using their private token.
 * Returns the authenticated owner dashboard DTO.
 */
export async function getOwnerDashboard(ownerToken) {
  const response = await fetch(`${BASE_URL}/owner`, {
    headers: { 'X-Owner-Token': ownerToken }
  });

  if (!response.ok) {
    let errorMsg = 'Error fetching owner dashboard';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getOwnerResponseHistory(ownerToken, cursor = null, limit = 5) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(`${BASE_URL}/owner/responses?${params}`, {
    headers: { 'X-Owner-Token': ownerToken }
  });
  if (!response.ok) {
    let message = 'Unable to load response history';
    try { message = (await response.json()).message || message; } catch { /* non-JSON response */ }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/**
 * Retrieves the public quiz result snapshot using the public slug.
 * Passes X-Participant-Signal and X-Owner-Token for server-side outside perception access control.
 * Returns the privacy-safe public profile DTO.
 */
export async function getPublicDashboard(publicSlug) {
  const headers = {};
  const participantSignal = getBrowserFingerprint();
  if (participantSignal) {
    headers['X-Participant-Signal'] = participantSignal;
  }
  const ownerToken = localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token');
  if (ownerToken) {
    headers['X-Owner-Token'] = ownerToken;
  }

  const response = await fetch(`${BASE_URL}/public/${publicSlug}`, {
    headers
  });

  if (!response.ok) {
    let errorMsg = 'Error fetching public dashboard';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Returns a random, site-scoped pseudonymous participation signal. This avoids
 * collecting extra browser/hardware entropy; the backend treats it only as a
 * weak abuse signal and applies independent transactional/rate-limit controls.
 */
export function getBrowserFingerprint() {
  const newKey = 'tensignal_participant_signal';
  const oldKey = 'seenly_participant_signal';
  let signal = localStorage.getItem(newKey) || localStorage.getItem(oldKey);
  if (!signal) {
    if (globalThis.crypto?.randomUUID) {
      signal = globalThis.crypto.randomUUID();
    } else {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      signal = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    localStorage.setItem(newKey, signal);
  } else if (!localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, signal);
  }
  return signal;
}

/**
 * Checks if a user is eligible to evaluate a profile (Spam and Self-Evaluation checks).
 * POST /api/v1/tensignal/friend/{publicSlug}/check-eligibility
 */
export async function checkEligibility(publicSlug, fingerprintHash) {
  const headers = { 'Content-Type': 'application/json' };
  const ownerToken = localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token');
  if (ownerToken) {
    headers['X-Owner-Token'] = ownerToken;
  }

  const response = await fetch(`${BASE_URL}/friend/${publicSlug}/check-eligibility`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ fingerprintHash })
  });

  if (!response.ok) {
    // 403 or 409 means not eligible, backend returns a message.
    try {
      const err = await response.json();
      return { eligible: false, message: err.message };
    } catch(e) {
      return { eligible: false, message: 'You cannot evaluate this person at this time.' };
    }
  }

  return response.json();
}

/**
 * Submits friend's response session to the backend tensignal API.
 * POST /api/v1/tensignal/friend/{publicSlug}/respond
 */
export async function submitFriendResponse(publicSlug, nickname, fingerprintHash, friendResponses, friendTimeAnalytics) {
  const headers = { 'Content-Type': 'application/json' };
  const ownerToken = localStorage.getItem('tensignal_owner_token') || localStorage.getItem('seenly_owner_token');
  if (ownerToken) {
    headers['X-Owner-Token'] = ownerToken;
  }

  const response = await fetch(`${BASE_URL}/friend/${publicSlug}/respond`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      nickname: nickname || null,
      fingerprintHash,
      friendResponses,
      friendTimeAnalytics
    })
  });

  if (!response.ok) {
    let errorMsg = 'Error submitting response';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Logins a user using their email and the verification code.
 * Returns { ownerToken, publicSlug }.
 */
export async function loginWithEmail(email, code) {
  const response = await fetch(`${BASE_URL}/auth/login-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });

  if (!response.ok) {
    let errorMsg = 'Error logging in';
    let errData = null;
    try {
      errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = errData;
    throw err;
  }

  return response.json();
}

export async function logoutOwner(ownerToken) {
  const response = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'X-Owner-Token': ownerToken }
  });
  if (!response.ok && response.status !== 401) {
    throw new Error('Error logging out');
  }
}

/**
 * Silently increments the click/visit count for the public profile link.
 * POST /api/v1/tensignal/profile/{publicSlug}/increment-click
 */
export async function incrementProfileClick(publicSlug) {
  try {
    await fetch(`${BASE_URL}/profile/${publicSlug}/increment-click`, {
      method: 'POST'
    });
  } catch (e) {
    // Silently ignore API errors
  }
}

export const PAYMENT_PRODUCT_CODES = Object.freeze({
  TEN_SIGNAL_PLUS: 'seenly_plus_v1',
  SEENLY_PLUS: 'seenly_plus_v1',
  CAPACITY_50: 'response_capacity_50_v2',
  CAPACITY_150: 'response_capacity_150_v2',
  CAPACITY_300: 'response_capacity_300_v2',
  // Backward compatibility aliases for historical transactions
  CAPACITY_100: 'response_capacity_100_v1',
  CAPACITY_250: 'response_capacity_250_v1',
  CAPACITY_500: 'response_capacity_500_v1'
});

/** Fetches available payment products with regionally resolved currency & formatted prices */
export async function getPaymentProducts(currency) {
  const apiPrefix = getApiBaseUrl();
  const headers = {};
  if (currency) {
    headers['X-Currency'] = currency;
  }
  const response = await fetch(`${apiPrefix}/api/billing/products`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch payment products');
  }
  return response.json();
}

/** Creates checkout for a server-owned product. Entitlement is granted only
 * after a verified provider webhook. */
export async function createPaymentCheckout(ownerToken, productCode) {
  const apiPrefix = getApiBaseUrl();
  const response = await fetch(`${apiPrefix}/api/billing/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Owner-Token': ownerToken
    },
    body: JSON.stringify({ productCode })
  });

  if (!response.ok) {
    let errorMsg = 'Error creating payment checkout';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function getPaymentTransaction(ownerToken, transactionId) {
  const apiPrefix = getApiBaseUrl();
  const response = await fetch(`${apiPrefix}/api/billing/transactions/${encodeURIComponent(transactionId)}`, {
    headers: {
      'X-Owner-Token': ownerToken
    }
  });

  if (!response.ok) {
    let errorMsg = 'Error fetching payment status';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Fetches dynamic rarity data for a specific card from the backend.
 * GET /api/v1/rarity/card/{cardId}
 */
export async function fetchCardRarity(cardId, lang = 'tr') {
  const apiPrefix = getApiBaseUrl();
  try {
    const response = await fetch(`${apiPrefix}/api/v1/rarity/card/${cardId}?lang=${lang}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

/**
 * Fetches all card dynamic rarities from backend.
 * GET /api/v1/rarity/all
 */
export async function fetchAllCardRarities(lang = 'tr') {
  const apiPrefix = getApiBaseUrl();
  try {
    const response = await fetch(`${apiPrefix}/api/v1/rarity/all?lang=${lang}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}

/**
 * Fetches the owner's email notification preferences from backend.
 * GET /api/v1/tensignal/owner/notification-preferences
 */
export async function getNotificationPreferences(ownerToken) {
  const response = await fetch(`${BASE_URL}/owner/notification-preferences`, {
    headers: {
      'X-Owner-Token': ownerToken,
    },
  });

  if (!response.ok) {
    let errorMsg = 'Error fetching notification preferences';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * Updates the owner's email notification preferences in backend.
 * PUT /api/v1/tensignal/owner/notification-preferences
 */
export async function updateNotificationPreferences(ownerToken, preferences) {
  const response = await fetch(`${BASE_URL}/owner/notification-preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Owner-Token': ownerToken,
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    let errorMsg = 'Error updating notification preferences';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

/**
 * Permanently deletes the owner account and all associated signals.
 * DELETE /api/billing/delete-account
 */
export async function deleteAccount(ownerToken) {
  const apiPrefix = getApiBaseUrl();
  const response = await fetch(`${apiPrefix}/api/billing/delete-account`, {
    method: 'DELETE',
    headers: {
      'X-Owner-Token': ownerToken
    }
  });

  if (!response.ok) {
    let errorMsg = 'Error deleting account';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch {
      // JSON parsing failed
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  return true;
}
