import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'ruth.cerna@gmail.com').trim().toLowerCase();
export const CONTACT_TO_EMAIL = (process.env.CONTACT_TO_EMAIL || 'nydo.mallas@gmail.com').trim().toLowerCase();
export const SESSION_SECRET = process.env.SESSION_SECRET || '';
export const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
export const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
export const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
export const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
export const MAIL_FROM = (process.env.MAIL_FROM || 'MallasSeguras <onboarding@resend.dev>').trim();

export function isPrincipalAdmin(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === ADMIN_EMAIL;
}

export function missingServerConfig(): string[] {
  const missing: string[] = [];
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) missing.push('SESSION_SECRET');
  if (!GOOGLE_CLIENT_ID) missing.push('GOOGLE_CLIENT_ID');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL o VITE_SUPABASE_URL');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return missing;
}
