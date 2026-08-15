// Central place for auth persistence. The app historically read/wrote these
// keys straight from localStorage, so reads still go through localStorage
// (plus a mirror for correctness). Remember-me controls token lifetime via a
// boot-time check: when the last login chose "don't remember me", the marker
// lives in sessionStorage and is wiped on browser close, which makes the
// session end exactly when the browser closes.
export const TOKEN_KEY = 'homechef_token';
export const USER_KEY = 'homechef_user';
export const REMEMBER_KEY = 'homechef_remember';
export const SESSION_MARKER_KEY = 'homechef_session_marker';

// Save a session after login. Always stores credentials in localStorage so the
// rest of the app keeps working, and records the remember-me decision.
export const saveAuth = (token, user, rememberMe) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (rememberMe) {
    localStorage.setItem(REMEMBER_KEY, 'true');
    sessionStorage.removeItem(SESSION_MARKER_KEY);
  } else {
    localStorage.setItem(REMEMBER_KEY, 'false');
    sessionStorage.setItem(SESSION_MARKER_KEY, 'false');
  }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(SESSION_MARKER_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const isLoggedIn = () => Boolean(getToken());

// Call once at app boot. If the previous login chose "don't remember me" and
// this is a brand-new browser session (sessionStorage was wiped on close),
// drop the stored credentials so the user is logged out.
export const enforceSessionLifetime = () => {
  const remember = localStorage.getItem(REMEMBER_KEY);
  if (remember !== 'false') return;
  const marker = sessionStorage.getItem(SESSION_MARKER_KEY);
  if (marker !== 'false') clearAuth();
};
