import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QuoteRequest } from '../types';

const STORAGE_OVERRIDE_URL = 'mallas_supabase_url';
const STORAGE_OVERRIDE_KEY = 'mallas_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'none';
}

/**
 * Retrieves the current Supabase configuration from Vite environment variables or local override.
 */
export const getSupabaseConfig = (): SupabaseConfig => {
  // Check local override first
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_OVERRIDE_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_OVERRIDE_KEY) : null;

  if (customUrl && customKey) {
    return {
      url: customUrl.trim(),
      anonKey: customKey.trim(),
      isConfigured: true,
      source: 'custom',
    };
  }

  // Check Vite environment variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project') && !envKey.includes('your-anon-key')) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env',
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
    windows: quote.windows || [],
    admin_quote: quote.adminQuote || null,
    installer_assignment: quote.installerAssignment || null,
    technician_execution: quote.technicianExecution || null,
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
    windows: Array.isArray(row.windows) ? row.windows : [],
    adminQuote: row.admin_quote || undefined,
    installerAssignment: row.installer_assignment || undefined,
    technicianExecution: row.technician_execution || undefined,
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
