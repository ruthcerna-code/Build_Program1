import { QuoteRequest, AdminQuoteDetails, InstallerAssignment, TechnicianExecution } from '../types';
import { createQuoteEmailDispatch } from './emailFormatter';
import { INITIAL_QUOTES } from '../data/initialQuotes';
import { matchesRut, cleanRut } from '../utils/rutUtils';
import {
  isSupabaseConfigured,
  upsertQuoteToSupabase,
  deleteQuoteFromSupabase,
  fetchQuotesFromSupabase,
} from './supabaseClient';
import {
  isFirebaseConfigured,
  saveQuoteToFirestore,
  deleteQuoteFromFirestore,
  fetchQuotesFromFirestore,
  syncAllLocalQuotesToFirestore,
} from './firebaseClient';

const STORAGE_KEY = 'mallas_seguridad_quotes_v2';
const EVENT_KEY = 'mallas_quotes_updated';

// Helper to sync to available cloud providers
const syncQuoteToClouds = (quote: QuoteRequest) => {
  if (isFirebaseConfigured()) {
    saveQuoteToFirestore(quote).catch((err) => console.warn('Firebase sync notice:', err));
  }
  if (isSupabaseConfigured()) {
    upsertQuoteToSupabase(quote).catch((err) => console.warn('Supabase sync notice:', err));
  }
};

const deleteQuoteFromClouds = (quoteId: string) => {
  if (isFirebaseConfigured()) {
    deleteQuoteFromFirestore(quoteId).catch((err) => console.warn('Firebase delete notice:', err));
  }
  if (isSupabaseConfigured()) {
    deleteQuoteFromSupabase(quoteId).catch((err) => console.warn('Supabase delete notice:', err));
  }
};

export const getStoredQuotes = (): QuoteRequest[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check if previous version exists and merge
      const prevRaw = localStorage.getItem('mallas_seguridad_quotes_v1');
      if (prevRaw) {
        try {
          const prevQuotes: QuoteRequest[] = JSON.parse(prevRaw);
          // Keep existing user-added quotes and ensure seeds (like Ruth Cerna) are present
          const existingIds = new Set(prevQuotes.map((q) => q.id));
          const merged = [...prevQuotes];
          for (const seed of INITIAL_QUOTES) {
            if (!existingIds.has(seed.id)) {
              merged.push(seed);
            }
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        } catch {
          // fallback to INITIAL_QUOTES
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUOTES));
      return INITIAL_QUOTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Ensure seed quotes have their clientRut populated if previously saved without it
      const updated = parsed.map((q) => {
        if (!q.clientRut) {
          const match = INITIAL_QUOTES.find((s) => s.id === q.id || s.clientEmail === q.clientEmail);
          if (match?.clientRut) {
            return { ...q, clientRut: match.clientRut };
          }
        }
        return q;
      });
      return updated;
    }
    return INITIAL_QUOTES;
  } catch (error) {
    console.error('Error reading quotes from storage:', error);
    return INITIAL_QUOTES;
  }
};

/**
 * Filter quotes strictly by the user's RUT.
 */
export const getQuotesByRut = (rut: string): QuoteRequest[] => {
  const cleaned = cleanRut(rut);
  if (!cleaned) return [];
  const allQuotes = getStoredQuotes();
  return allQuotes.filter((q) => matchesRut(q.clientRut, cleaned));
};

export const saveQuotesToStorage = (quotes: QuoteRequest[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: quotes }));
  } catch (error) {
    console.error('Error saving quotes to storage:', error);
  }
};

export const addQuoteRequest = (newQuote: QuoteRequest): QuoteRequest[] => {
  const quoteWithDispatch: QuoteRequest = {
    ...newQuote,
    emailDispatch: newQuote.emailDispatch || createQuoteEmailDispatch(newQuote),
  };
  const current = getStoredQuotes();
  const updated = [quoteWithDispatch, ...current];
  saveQuotesToStorage(updated);
  syncQuoteToClouds(quoteWithDispatch);
  return updated;
};

export const updateQuoteWithAdminDetails = (
  quoteId: string,
  adminDetails: AdminQuoteDetails
): QuoteRequest[] => {
  const current = getStoredQuotes();
  let modifiedQuote: QuoteRequest | null = null;
  const updated = current.map((q) => {
    if (q.id === quoteId) {
      modifiedQuote = {
        ...q,
        status: 'cotizada' as const,
        adminQuote: adminDetails,
      };
      return modifiedQuote;
    }
    return q;
  });
  saveQuotesToStorage(updated);
  if (modifiedQuote) {
    syncQuoteToClouds(modifiedQuote);
  }
  return updated;
};

export const updateQuoteStatus = (
  quoteId: string,
  status: 'pendiente' | 'cotizada' | 'aceptada' | 'rechazada'
): QuoteRequest[] => {
  const current = getStoredQuotes();
  let modifiedQuote: QuoteRequest | null = null;
  const updated = current.map((q) => {
    if (q.id === quoteId) {
      modifiedQuote = {
        ...q,
        status,
        acceptedAt: status === 'aceptada' ? q.acceptedAt || new Date().toISOString() : q.acceptedAt,
      };
      return modifiedQuote;
    }
    return q;
  });
  saveQuotesToStorage(updated);
  if (modifiedQuote) {
    syncQuoteToClouds(modifiedQuote);
  }
  return updated;
};

export const assignInstallerToQuote = (
  quoteId: string,
  assignment: InstallerAssignment
): QuoteRequest[] => {
  const current = getStoredQuotes();
  let modifiedQuote: QuoteRequest | null = null;
  const updated = current.map((q) => {
    if (q.id === quoteId) {
      const meshTotal = Math.round(q.totalAreaM2 * 28500);
      const profilesCost = 15000;
      const laborCost = 25000;
      const subtotal = meshTotal + profilesCost + laborCost;
      const total = subtotal;

      const defaultAdminQuote: AdminQuoteDetails = q.adminQuote || {
        pricePerM2: 28500,
        meshTotalCost: meshTotal,
        profilesAndFixingsCost: profilesCost,
        laborAndInstallCost: laborCost,
        discountPercentage: 0,
        discountAmount: 0,
        subtotal: subtotal,
        includeTax: false,
        taxAmount: 0,
        total: total,
        warrantyYears: 3,
        estimatedTime: '3 horas',
        adminNotes: 'Presupuesto base generado al asignar técnico',
        sentAt: new Date().toISOString(),
        sentToEmail: q.clientEmail,
        confirmedInstallationDate: q.tentativeDate1 || new Date().toISOString().split('T')[0],
        confirmedInstallationTime: q.tentativeTime1 || '10:00',
        selectedScheduleOption: 'opcion_1',
      };

      modifiedQuote = {
        ...q,
        status: 'aceptada' as const,
        adminQuote: defaultAdminQuote,
        installerAssignment: assignment,
        technicianExecution: q.technicianExecution || {
          status: 'pendiente_aceptar',
          notes: '',
        },
      };
      return modifiedQuote;
    }
    return q;
  });
  saveQuotesToStorage(updated);
  if (modifiedQuote) {
    syncQuoteToClouds(modifiedQuote);
  }
  return updated;
};

export const unassignInstallerFromQuote = (quoteId: string): QuoteRequest[] => {
  const current = getStoredQuotes();
  let modifiedQuote: QuoteRequest | null = null;
  const updated = current.map((q) => {
    if (q.id === quoteId) {
      const copy = { ...q };
      delete copy.installerAssignment;
      delete copy.technicianExecution;
      modifiedQuote = {
        ...copy,
        status: copy.adminQuote ? ('cotizada' as const) : ('pendiente' as const),
      };
      return modifiedQuote;
    }
    return q;
  });
  saveQuotesToStorage(updated);
  if (modifiedQuote) {
    syncQuoteToClouds(modifiedQuote);
  }
  return updated;
};

export const updateTechnicianExecution = (
  quoteId: string,
  execution: Partial<TechnicianExecution>
): QuoteRequest[] => {
  const current = getStoredQuotes();
  let modifiedQuote: QuoteRequest | null = null;
  const updated = current.map((q) => {
    if (q.id === quoteId) {
      const existing: TechnicianExecution = q.technicianExecution || {
        status: 'pendiente_aceptar',
        notes: '',
      };
      const merged: TechnicianExecution = {
        ...existing,
        ...execution,
      };

      // Keep installerAssignment in sync if present
      let updatedAssignment = q.installerAssignment;
      if (updatedAssignment) {
        if (merged.status === 'trabajo_realizado') {
          updatedAssignment = { ...updatedAssignment, installationStatus: 'instalado' };
        } else if (merged.status === 'solicitud_aceptada') {
          updatedAssignment = { ...updatedAssignment, installationStatus: 'en_camino' };
        }
      }

      modifiedQuote = {
        ...q,
        technicianExecution: merged,
        installerAssignment: updatedAssignment,
      };
      return modifiedQuote;
    }
    return q;
  });
  saveQuotesToStorage(updated);
  if (modifiedQuote) {
    syncQuoteToClouds(modifiedQuote);
  }
  return updated;
};

export const updateQuoteTotalDirectly = (
  quoteId: string,
  newTotal: number,
  notes?: string
): QuoteRequest[] => {
  const current = getStoredQuotes();
  let modifiedQuote: QuoteRequest | null = null;
  const updated = current.map((q) => {
    if (q.id === quoteId) {
      const existing = q.adminQuote;
      const adminQuote: AdminQuoteDetails = existing
        ? {
            ...existing,
            total: newTotal,
            subtotal: newTotal,
            adminNotes: notes !== undefined ? notes : existing.adminNotes,
          }
        : {
            pricePerM2: Math.round(newTotal / (q.totalAreaM2 || 1)),
            meshTotalCost: newTotal,
            profilesAndFixingsCost: 0,
            laborAndInstallCost: 0,
            discountPercentage: 0,
            discountAmount: 0,
            subtotal: newTotal,
            includeTax: false,
            taxAmount: 0,
            total: newTotal,
            warrantyYears: 2,
            estimatedTime: '2 a 3 horas',
            adminNotes: notes || 'Valor cotizado fijado directamente por administración.',
            sentAt: new Date().toISOString(),
            sentToEmail: q.clientEmail,
          };
      modifiedQuote = {
        ...q,
        status: 'cotizada' as const,
        adminQuote,
      };
      return modifiedQuote;
    }
    return q;
  });
  saveQuotesToStorage(updated);
  if (modifiedQuote) {
    syncQuoteToClouds(modifiedQuote);
  }
  return updated;
};

export const deleteQuoteRequest = (quoteId: string): QuoteRequest[] => {
  const current = getStoredQuotes();
  const updated = current.filter((q) => q.id !== quoteId);
  saveQuotesToStorage(updated);
  deleteQuoteFromClouds(quoteId);
  return updated;
};

/**
 * Register customer acceptance with timestamp and status 'aceptada'
 */
export const registerQuoteAcceptance = (
  quoteId: string,
  acceptedAt?: string
): QuoteRequest[] => {
  const current = getStoredQuotes();
  let modifiedQuote: QuoteRequest | null = null;
  const updated = current.map((q) => {
    if (q.id === quoteId) {
      modifiedQuote = {
        ...q,
        status: 'aceptada' as const,
        acceptedAt: acceptedAt || new Date().toISOString(),
      };
      return modifiedQuote;
    }
    return q;
  });
  saveQuotesToStorage(updated);
  if (modifiedQuote) {
    syncQuoteToClouds(modifiedQuote);
  }
  return updated;
};

/**
 * Register payment or advance on a quote for financial tracking
 */
export const updateQuotePayment = (
  quoteId: string,
  paidAmount: number,
  paymentStatus?: 'pendiente' | 'abono_parcial' | 'pagado_total',
  paymentMethod?: string,
  paymentNotes?: string
): QuoteRequest[] => {
  const current = getStoredQuotes();
  let modifiedQuote: QuoteRequest | null = null;
  const updated = current.map((q) => {
    if (q.id === quoteId) {
      const quoteTotal = q.adminQuote?.total || 0;
      const status: 'pendiente' | 'abono_parcial' | 'pagado_total' =
        paymentStatus ||
        (paidAmount <= 0
          ? 'pendiente'
          : paidAmount >= quoteTotal && quoteTotal > 0
          ? 'pagado_total'
          : 'abono_parcial');

      modifiedQuote = {
        ...q,
        paidAmount,
        paymentStatus: status,
        paymentMethod: paymentMethod || q.paymentMethod || 'Transferencia',
        paymentNotes: paymentNotes !== undefined ? paymentNotes : q.paymentNotes,
      };
      return modifiedQuote;
    }
    return q;
  });
  saveQuotesToStorage(updated);
  if (modifiedQuote) {
    syncQuoteToClouds(modifiedQuote);
  }
  return updated;
};

/**
 * Synchronizes quotes with the Firebase Firestore database.
 */
export const syncWithFirestoreDatabase = async (
  clientEmail?: string
): Promise<{ success: boolean; count: number; quotes: QuoteRequest[]; message: string }> => {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      count: 0,
      quotes: getStoredQuotes(),
      message: 'Firebase no está configurado.',
    };
  }

  try {
    const remoteQuotes = await fetchQuotesFromFirestore(clientEmail);
    if (!remoteQuotes) {
      return {
        success: false,
        count: 0,
        quotes: getStoredQuotes(),
        message: 'No se pudieron descargar los datos de Firebase Firestore.',
      };
    }

    const local = getStoredQuotes();
    // If Firestore is empty initially, seed with existing local data
    if (remoteQuotes.length === 0 && local.length > 0 && !clientEmail) {
      await syncAllLocalQuotesToFirestore(local);
      return {
        success: true,
        count: local.length,
        quotes: local,
        message: `Se inicializaron ${local.length} registros en Firebase Firestore.`,
      };
    }

    const map = new Map<string, QuoteRequest>();

    // Start with local quotes
    local.forEach((q) => map.set(q.id, q));
    // Merge remote quotes
    remoteQuotes.forEach((q) => map.set(q.id, q));

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: merged }));

    return {
      success: true,
      count: remoteQuotes.length,
      quotes: merged,
      message: `Sincronizados ${remoteQuotes.length} registros desde Firebase Firestore.`,
    };
  } catch (err: any) {
    console.error('Error in syncWithFirestoreDatabase:', err);
    return {
      success: false,
      count: 0,
      quotes: getStoredQuotes(),
      message: err?.message || 'Error al sincronizar con Firebase',
    };
  }
};

/**
 * Unified helper: Synchronizes quotes from the most active cloud provider (Firebase or Supabase).
 */
export const syncWithCloudDatabases = async (
  clientEmail?: string
): Promise<{ success: boolean; provider: 'firebase' | 'supabase' | 'none'; count: number; quotes: QuoteRequest[]; message: string }> => {
  if (isFirebaseConfigured()) {
    const res = await syncWithFirestoreDatabase(clientEmail);
    return {
      success: res.success,
      provider: 'firebase',
      count: res.count,
      quotes: res.quotes,
      message: res.message,
    };
  }

  if (isSupabaseConfigured()) {
    const res = await syncWithSupabaseDatabase(clientEmail);
    return {
      success: res.success,
      provider: 'supabase',
      count: res.count,
      quotes: res.quotes,
      message: res.message,
    };
  }

  return {
    success: false,
    provider: 'none',
    count: 0,
    quotes: getStoredQuotes(),
    message: 'Sin base de datos configurada en la nube.',
  };
};

/**
 * Synchronizes quotes with the Supabase database.
 * If user is client, can optionally filter or sync everything.
 */
export const syncWithSupabaseDatabase = async (
  clientEmail?: string
): Promise<{ success: boolean; count: number; quotes: QuoteRequest[]; message: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      count: 0,
      quotes: getStoredQuotes(),
      message: 'Supabase no está configurado aún.',
    };
  }

  try {
    const remoteQuotes = await fetchQuotesFromSupabase(clientEmail);
    if (!remoteQuotes) {
      return {
        success: false,
        count: 0,
        quotes: getStoredQuotes(),
        message: 'No se pudieron descargar los datos de Supabase.',
      };
    }

    const local = getStoredQuotes();
    const map = new Map<string, QuoteRequest>();

    // Start with local quotes
    local.forEach((q) => map.set(q.id, q));
    // Overwrite/add with remote quotes
    remoteQuotes.forEach((q) => map.set(q.id, q));

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: merged }));

    return {
      success: true,
      count: remoteQuotes.length,
      quotes: merged,
      message: `Sincronizados ${remoteQuotes.length} registros desde Supabase.`,
    };
  } catch (err: any) {
    console.error('Error in syncWithSupabaseDatabase:', err);
    return {
      success: false,
      count: 0,
      quotes: getStoredQuotes(),
      message: err?.message || 'Error al sincronizar con Supabase',
    };
  }
};

export const generateQuoteFolio = (): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `COT-${year}-${randomNum}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
};
