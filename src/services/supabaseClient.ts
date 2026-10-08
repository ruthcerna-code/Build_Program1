import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QuoteRequest, UserAccount, UserAccessLog } from '../types';

const STORAGE_OVERRIDE_URL = 'mallas_supabase_url';
const STORAGE_OVERRIDE_KEY = 'mallas_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'none';
}

const isUsableSupabaseEnv = (url?: string, key?: string): boolean => {
  if (!url || !key) return false;
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();
  if (!trimmedUrl || !trimmedKey) return false;
  if (trimmedUrl.includes('your-project') || trimmedKey.includes('your-anon-key')) return false;
  if (trimmedUrl.includes('127.0.0.1') || trimmedUrl.includes('localhost')) return false;
  return true;
};

/**
 * Reads cloud credentials from Vite env (.env.local) first, then localStorage override.
 */
export const getSupabaseConfig = (): SupabaseConfig => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (isUsableSupabaseEnv(envUrl, envKey)) {
    return {
      url: envUrl!.trim(),
      anonKey: envKey!.trim(),
      isConfigured: true,
      source: 'env',
    };
  }

  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_OVERRIDE_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_OVERRIDE_KEY) : null;

  if (isUsableSupabaseEnv(customUrl || undefined, customKey || undefined)) {
    return {
      url: customUrl!.trim(),
      anonKey: customKey!.trim(),
      isConfigured: true,
      source: 'custom',
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
};

export const saveSupabaseCustomConfig = (url: string, anonKey: string): void => {
  if (!url || !anonKey) {
    localStorage.removeItem(STORAGE_OVERRIDE_URL);
    localStorage.removeItem(STORAGE_OVERRIDE_KEY);
  } else {
    localStorage.setItem(STORAGE_OVERRIDE_URL, url.trim());
    localStorage.setItem(STORAGE_OVERRIDE_KEY, anonKey.trim());
  }
  supabaseInstance = null; // reset cached instance
  window.dispatchEvent(new CustomEvent('supabase_config_updated'));
};

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns a cached or new Supabase client instance.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

/**
 * Map QuoteRequest to Supabase `quotes` row format
 */
export const mapQuoteToDbRow = (quote: QuoteRequest) => {
  return {
    id: quote.id,
    folio: quote.folio,
    created_at: quote.createdAt,
    client_name: quote.clientName,
    client_rut: quote.clientRut || '',
    client_email: quote.clientEmail.toLowerCase().trim(),
    client_phone: quote.clientPhone || '',
    client_address: quote.clientAddress || '',
    client_city: quote.clientCity || '',
    property_type: quote.propertyType,
    client_comments: quote.clientComments || '',
    tentative_date1: quote.tentativeDate1 || '',
    tentative_time1: quote.tentativeTime1 || '',
    tentative_date2: quote.tentativeDate2 || '',
    tentative_time2: quote.tentativeTime2 || '',
    total_area_m2: quote.totalAreaM2,
    status: quote.status,
    accepted_at: quote.acceptedAt || null,
    paid_amount: quote.paidAmount ?? null,
    payment_status: quote.paymentStatus || null,
    payment_method: quote.paymentMethod || null,
    payment_notes: quote.paymentNotes || null,
    windows: quote.windows || [],
    admin_quote: quote.adminQuote || null,
    installer_assignment: quote.installerAssignment || null,
    technician_execution: quote.technicianExecution || null,
    email_dispatch: quote.emailDispatch || null,
    deleted_at: quote.deletedAt || null,
    owner_email: (quote.ownerEmail || quote.clientEmail || '').toLowerCase(),
    change_history: quote.changeHistory || [],
    payments: quote.payments || [],
    quote_source: quote.quoteSource || 'guided',
    guided_quote: quote.guidedQuote || null,
  };
};

/**
 * Map Supabase `quotes` row format to QuoteRequest
 */
export const mapDbRowToQuote = (row: any): QuoteRequest => {
  return {
    id: row.id,
    folio: row.folio,
    createdAt: row.created_at,
    clientName: row.client_name,
    clientRut: row.client_rut || undefined,
    clientEmail: row.client_email,
    clientPhone: row.client_phone || '',
    clientAddress: row.client_address || '',
    clientCity: row.client_city || '',
    propertyType: row.property_type || 'departamento',
    clientComments: row.client_comments || '',
    tentativeDate1: row.tentative_date1 || '',
    tentativeTime1: row.tentative_time1 || '',
    tentativeDate2: row.tentative_date2 || '',
    tentativeTime2: row.tentative_time2 || '',
    totalAreaM2: Number(row.total_area_m2) || 0,
    status: row.status || 'pendiente',
    acceptedAt: row.accepted_at || undefined,
    paidAmount: row.paid_amount != null ? Number(row.paid_amount) : undefined,
    paymentStatus: row.payment_status || undefined,
    paymentMethod: row.payment_method || undefined,
    paymentNotes: row.payment_notes || undefined,
    windows: Array.isArray(row.windows) ? row.windows : [],
    adminQuote: row.admin_quote || undefined,
    installerAssignment: row.installer_assignment || undefined,
    technicianExecution: row.technician_execution || undefined,
    emailDispatch: row.email_dispatch || undefined,
    deletedAt: row.deleted_at || undefined,
    ownerEmail: row.owner_email || row.client_email,
    changeHistory: Array.isArray(row.change_history) ? row.change_history : [],
    payments: Array.isArray(row.payments) ? row.payments : [],
    quoteSource: row.quote_source || undefined,
    guidedQuote: row.guided_quote || undefined,
  };
};

/**
 * Tests connection to Supabase database.
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase no está configurado aún (falta URL o Anon Key).',
    };
  }

  try {
    const { data, error, count } = await client
      .from('quotes')
      .select('id', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      const denied =
        error.code === '42501' ||
        error.message?.toLowerCase().includes('permission') ||
        error.message?.toLowerCase().includes('row-level security') ||
        error.message?.toLowerCase().includes('rls');
      if (denied) {
        return {
          success: true,
          message:
            'Conectado a Supabase. RLS activo: el visitante no puede leer cotizaciones (solo crear).',
          count: 0,
        };
      }
      return {
        success: false,
        message: `Error al consultar Supabase: ${error.message} (Código: ${error.code})`,
      };
    }

    return {
      success: true,
      message: `¡Conexión exitosa con Supabase! Tabla "quotes" conectada. Registros actuales: ${count ?? data?.length ?? 0}`,
      count: count ?? data?.length ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Excepción de red al conectar con Supabase: ${err?.message || err}`,
    };
  }
};

/**
 * Fetches quotes from Supabase. Optionally filters by clientEmail.
 */
export const fetchQuotesFromSupabase = async (clientEmail?: string): Promise<QuoteRequest[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('quotes').select('*').order('created_at', { ascending: false });

    if (clientEmail) {
      query = query.ilike('client_email', clientEmail.toLowerCase().trim());
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching quotes from Supabase:', error.message);
      return null;
    }

    return (data || []).map(mapDbRowToQuote);
  } catch (err) {
    console.warn('Network error fetching quotes from Supabase:', err);
    return null;
  }
};

/**
 * Upserts a quote into Supabase.
 */
export const upsertQuoteToSupabase = async (quote: QuoteRequest): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapQuoteToDbRow(quote);
    const { error } = await client.from('quotes').upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting quote to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error saving quote to Supabase:', err);
    return false;
  }
};

/**
 * Deletes a quote from Supabase by ID.
 */
export const deleteQuoteFromSupabase = async (quoteId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('quotes').delete().eq('id', quoteId);
    if (error) {
      console.error('Error deleting quote from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error deleting quote from Supabase:', err);
    return false;
  }
};

/**
 * Seeds Supabase with the current list of local quotes if remote is empty.
 */
export const syncAllLocalQuotesToSupabase = async (
  quotes: QuoteRequest[]
): Promise<{ success: boolean; synced: number; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, synced: 0, error: 'Supabase no configurado' };
  }

  try {
    const rows = quotes.map(mapQuoteToDbRow);
    const { error } = await client.from('quotes').upsert(rows, { onConflict: 'id' });

    if (error) {
      return { success: false, synced: 0, error: error.message };
    }

    return { success: true, synced: rows.length };
  } catch (err: any) {
    return { success: false, synced: 0, error: err?.message || 'Error de red' };
  }
};

export const mapUserToDbRow = (user: UserAccount) => ({
  id: user.id,
  email: user.email.toLowerCase().trim(),
  password_hash: user.passwordHash,
  full_name: user.fullName,
  role: user.role,
  rut: user.rut || null,
  created_at: user.createdAt,
  provisional_password: user.provisionalPassword || null,
  provisional_password_created_at: user.provisionalPasswordCreatedAt || null,
  must_change_password: !!user.mustChangePassword,
});

export const mapDbRowToUser = (row: any): UserAccount => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  fullName: row.full_name,
  role: row.role || 'cliente',
  rut: row.rut || undefined,
  createdAt: row.created_at,
  provisionalPassword: row.provisional_password || undefined,
  provisionalPasswordCreatedAt: row.provisional_password_created_at || undefined,
  mustChangePassword: !!row.must_change_password,
});

export const fetchUsersFromSupabase = async (): Promise<UserAccount[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('app_users').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching users from Supabase:', error.message);
      return null;
    }
    return (data || []).map(mapDbRowToUser);
  } catch (err) {
    console.warn('Network error fetching users from Supabase:', err);
    return null;
  }
};

export const upsertUsersToSupabase = async (
  users: UserAccount[]
): Promise<{ success: boolean; synced: number; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, synced: 0, error: 'Supabase no configurado' };
  }

  try {
    const rows = users.map(mapUserToDbRow);
    const { error } = await client.from('app_users').upsert(rows, { onConflict: 'id' });
    if (error) {
      return { success: false, synced: 0, error: error.message };
    }
    return { success: true, synced: rows.length };
  } catch (err: any) {
    return { success: false, synced: 0, error: err?.message || 'Error de red' };
  }
};

export const mapAccessLogToDbRow = (log: UserAccessLog) => ({
  id: log.id,
  user_id: log.userId,
  user_email: log.userEmail.toLowerCase().trim(),
  user_name: log.userName,
  role: log.role,
  connected_at: log.connectedAt,
  connectivity_timestamp: log.connectivityTimestamp,
  action: log.action,
  action_description: log.actionDescription,
  quotes_count: log.quotesCount,
  quote_folios: log.quoteFolios || [],
  device_info: log.deviceInfo || null,
  ip_address: log.ipAddress || null,
});

export const mapDbRowToAccessLog = (row: any): UserAccessLog => ({
  id: row.id,
  userId: row.user_id,
  userEmail: row.user_email,
  userName: row.user_name,
  role: row.role || 'cliente',
  connectedAt: row.connected_at,
  connectivityTimestamp: Number(row.connectivity_timestamp) || 0,
  action: row.action,
  actionDescription: row.action_description || '',
  quotesCount: Number(row.quotes_count) || 0,
  quoteFolios: Array.isArray(row.quote_folios) ? row.quote_folios : [],
  deviceInfo: row.device_info || undefined,
  ipAddress: row.ip_address || undefined,
});

export const fetchAccessLogsFromSupabase = async (): Promise<UserAccessLog[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('access_logs')
      .select('*')
      .order('connected_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Error fetching access logs from Supabase:', error.message);
      return null;
    }
    return (data || []).map(mapDbRowToAccessLog);
  } catch (err) {
    console.warn('Network error fetching access logs from Supabase:', err);
    return null;
  }
};

export const upsertAccessLogToSupabase = async (log: UserAccessLog): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('access_logs').upsert(mapAccessLogToDbRow(log), { onConflict: 'id' });
    if (error) {
      console.error('Error upserting access log to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error saving access log to Supabase:', err);
    return false;
  }
};

export const upsertAccessLogsToSupabase = async (
  logs: UserAccessLog[]
): Promise<{ success: boolean; synced: number; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, synced: 0, error: 'Supabase no configurado' };
  }

  try {
    const rows = logs.map(mapAccessLogToDbRow);
    const { error } = await client.from('access_logs').upsert(rows, { onConflict: 'id' });
    if (error) {
      return { success: false, synced: 0, error: error.message };
    }
    return { success: true, synced: rows.length };
  } catch (err: any) {
    return { success: false, synced: 0, error: err?.message || 'Error de red' };
  }
};
