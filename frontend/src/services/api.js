// BASE_URL matches the backend Spring Boot REST context.
// Fallback allows customization via environment variables (e.g. for production or staging build)
const API_PREFIX = (import.meta.env && import.meta.env.VITE_API_URL) || '';
const BASE_URL = `${API_PREFIX}/api/v1/seenly`;

/**
 * Submits the owner's name, email and answers to create a Seenly profile.
 * Returns { ownerToken, publicSlug, resultSnapshot }.
 */
export async function createSeenly(displayName, email, selfAnswers) {
  const response = await fetch(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, selfAnswers })
  });

  if (!response.ok) {
    let errorMsg = 'Error creating Seenly profile';
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
 * PUT /api/v1/seenly/owner/display-name
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
 * PUT /api/v1/seenly/owner/email
 */
export async function updateEmail(ownerToken, newEmail) {
  const response = await fetch(`${BASE_URL}/owner/email`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'X-Owner-Token': ownerToken 
    },
    body: JSON.stringify({ email: newEmail })
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
 * PUT /api/v1/seenly/owner/avatar
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
 * Requests a verification code to be sent to the user's email.
 */
export async function sendVerificationCode(email, isLogin = false) {
  const response = await fetch(`${BASE_URL}/auth/send-code?isLogin=${isLogin}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
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

  return response.json();
}

/**
 * Verifies the 6-digit verification code entered by the user.
 */
export async function verifyCode(email, code) {
  const response = await fetch(`${BASE_URL}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
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
 * Retrieves the owner's quiz result snapshot using their private token.
 * Returns ResultSnapshotDto.
 */
export async function getOwnerDashboard(ownerToken) {
  const response = await fetch(`${BASE_URL}/owner/${ownerToken}`);

  if (!response.ok) {
    let errorMsg = 'Error fetching owner dashboard';
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
 * Retrieves the public quiz result snapshot using the public slug.
 * Returns ResultSnapshotDto.
 */
export async function getPublicDashboard(publicSlug) {
  const response = await fetch(`${BASE_URL}/public/${publicSlug}`);

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
 * Generates a minimalist unique fingerprint hash from browser properties.
 * Uses userAgent, language, and screen.width.
 */
export function getBrowserFingerprint() {
  const userAgent = navigator.userAgent || '';
  const language = navigator.language || '';
  const screenWidth = screen.width || '';
  const raw = `${userAgent}_${language}_${screenWidth}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Checks if a user is eligible to evaluate a profile (Spam and Self-Evaluation checks).
 * POST /api/v1/seenly/friend/{publicSlug}/check-eligibility
 */
export async function checkEligibility(publicSlug, fingerprintHash) {
  const headers = { 'Content-Type': 'application/json' };
  const ownerToken = localStorage.getItem('seenly_owner_token');
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
 * Submits friend's response session to the backend seenly API.
 * POST /api/v1/seenly/friend/{publicSlug}/respond
 */
export async function submitFriendResponse(publicSlug, nickname, fingerprintHash, friendResponses, friendTimeAnalytics) {
  const headers = { 'Content-Type': 'application/json' };
  const ownerToken = localStorage.getItem('seenly_owner_token');
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

/**
 * Silently increments the click/visit count for the public profile link.
 * POST /api/v1/seenly/profile/{publicSlug}/increment-click
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

/**
 * Subscribes user to Seenly Plus.
 * POST /api/billing/subscribe-plus
 */
export async function subscribePlus(ownerToken) {
  const apiPrefix = (import.meta.env && import.meta.env.VITE_API_URL) || '';
  const response = await fetch(`${apiPrefix}/api/billing/subscribe-plus`, {
    method: 'POST',
    headers: {
      'X-Owner-Token': ownerToken
    }
  });

  if (!response.ok) {
    let errorMsg = 'Error subscribing to Plus';
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
 * Purchases extra capacity pack.
 * POST /api/billing/buy-pack?amount=...
 */
export async function buyCapacityPack(ownerToken, amount) {
  const apiPrefix = (import.meta.env && import.meta.env.VITE_API_URL) || '';
  const response = await fetch(`${apiPrefix}/api/billing/buy-pack?amount=${amount}`, {
    method: 'POST',
    headers: {
      'X-Owner-Token': ownerToken
    }
  });

  if (!response.ok) {
    let errorMsg = 'Error purchasing capacity pack';
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
  const apiPrefix = (import.meta.env && import.meta.env.VITE_API_URL) || '';
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
  const apiPrefix = (import.meta.env && import.meta.env.VITE_API_URL) || '';
  try {
    const response = await fetch(`${apiPrefix}/api/v1/rarity/all?lang=${lang}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    return null;
  }
}



