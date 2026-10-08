import { UserAccount } from '../types';

const TOKEN_KEY = 'mallas_session_token_v1';

export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getSessionToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'No pudimos completar la acción.');
  }
  return data;
}

export async function loginWithGoogleToken(idToken: string): Promise<{ user: UserAccount; token: string }> {
  const data = await apiFetch('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  setSessionToken(data.token);
  return data;
}

export async function fetchAuthConfig(): Promise<{ googleClientId: string | null; googleReady: boolean }> {
  const res = await fetch('/api/auth/config');
  return res.json();
}
