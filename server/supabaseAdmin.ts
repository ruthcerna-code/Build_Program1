import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './config';

let admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!admin) {
    admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export function requireAdminClient() {
  const client = getAdminClient();
  if (!client) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Sin esa clave no se pueden consultar ni guardar registros en la nube.'
    );
  }
  return client;
}
