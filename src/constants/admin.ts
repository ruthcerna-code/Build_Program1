/** Solo para ocultar botones en la interfaz. El servidor valida con ADMIN_EMAIL. */
export const PRINCIPAL_ADMIN_EMAIL = 'ruth.cerna@gmail.com';
export const CONTACT_INBOX_EMAIL = 'nydo.mallas@gmail.com';

export function isPrincipalAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === PRINCIPAL_ADMIN_EMAIL;
}
