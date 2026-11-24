import { MAKE_WEBHOOK_URL } from './config';

const MAKE_TIMEOUT_MS = 5000;

/**
 * Envía un aviso a Make (JSON plano). Es un complemento: nunca lanza error
 * y no se reintenta. Si MAKE_WEBHOOK_URL no está definida, se omite.
 */
export async function notifyMake(payload: Record<string, string | number | boolean | null>): Promise<boolean> {
  if (!MAKE_WEBHOOK_URL) {
    console.warn('[make] MAKE_WEBHOOK_URL no está definida. Se omite el aviso a Make.');
    return false;
  }
  try {
    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(MAKE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[make] El webhook respondió ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[make] No se pudo llamar al webhook:', err?.name === 'TimeoutError' ? 'tiempo agotado (5 s)' : err?.message);
    return false;
  }
}
