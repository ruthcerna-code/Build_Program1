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

function publicFetchError(err: unknown, fallback = 'No pudimos completar la acción.') {
  const message = String((err as { message?: string })?.message || err || '');
  if (/typeerror|fetch failed|failed to fetch|networkerror|load failed/i.test(message)) {
    return 'No pudimos conectar con el servidor. Espera un momento e intenta de nuevo, o escríbenos por WhatsApp.';
  }
  return message || fallback;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getSessionToken();
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    const response = await fetch(path, { ...init, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(publicFetchError(data.error, 'No pudimos completar la acción.'));
    }
    return data;
  } catch (err: any) {
    throw new Error(publicFetchError(err));
  }
}

export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ user: UserAccount; token: string }> {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setSessionToken(data.token);
  return data;
}
