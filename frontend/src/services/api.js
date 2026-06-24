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
 * Submits friend's response session to the backend seenly API.
 * POST /api/v1/seenly/friend/{publicSlug}/respond
 */
export async function submitFriendResponse(publicSlug, nickname, fingerprintHash, friendResponses, friendTimeAnalytics) {
  const response = await fetch(`${BASE_URL}/friend/${publicSlug}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

