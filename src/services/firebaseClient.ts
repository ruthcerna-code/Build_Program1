import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { QuoteRequest } from '../types';
import firebaseConfigRaw from '../../firebase-applet-config.json';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (firebaseApp) return firebaseApp;

  try {
    if (!firebaseConfigRaw || !firebaseConfigRaw.apiKey || !firebaseConfigRaw.projectId) {
      return null;
    }

    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp({
        apiKey: firebaseConfigRaw.apiKey,
        authDomain: firebaseConfigRaw.authDomain,
        projectId: firebaseConfigRaw.projectId,
        storageBucket: firebaseConfigRaw.storageBucket,
        messagingSenderId: firebaseConfigRaw.messagingSenderId,
        appId: firebaseConfigRaw.appId,
      });
    }
    return firebaseApp;
  } catch (err) {
    console.error('Error initializing Firebase app:', err);
    return null;
  }
};

export const getFirestoreDb = (): Firestore | null => {
  if (firestoreDb) return firestoreDb;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    const databaseId = firebaseConfigRaw.firestoreDatabaseId;
    // If specific databaseId is defined in config, pass it to getFirestore
    if (databaseId && databaseId !== '(default)') {
      firestoreDb = getFirestore(app, databaseId);
    } else {
      firestoreDb = getFirestore(app);
    }
    return firestoreDb;
  } catch (err) {
    console.error('Error initializing Firestore:', err);
    return null;
  }
};

export const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfigRaw && firebaseConfigRaw.projectId && firebaseConfigRaw.apiKey);
};

export const getFirebaseProjectInfo = () => {
  return {
    projectId: firebaseConfigRaw.projectId || '',
    databaseId: firebaseConfigRaw.firestoreDatabaseId || '(default)',
    authDomain: firebaseConfigRaw.authDomain || '',
  };
};

/**
 * Saves or updates a quote in Firestore.
 */
export const saveQuoteToFirestore = async (quote: QuoteRequest): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const quoteRef = doc(db, 'quotes', quote.id);
    // Sanitize undefined fields for Firestore
    const cleanQuote = JSON.parse(JSON.stringify(quote));
    await setDoc(quoteRef, cleanQuote, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving quote to Firestore:', err);
    return false;
  }
};

/**
 * Deletes a quote from Firestore.
 */
export const deleteQuoteFromFirestore = async (quoteId: string): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const quoteRef = doc(db, 'quotes', quoteId);
    await deleteDoc(quoteRef);
    return true;
  } catch (err) {
    console.error('Error deleting quote from Firestore:', err);
    return false;
  }
};

/**
 * Fetches all quotes from Firestore, optionally filtered by client email.
 */
export const fetchQuotesFromFirestore = async (clientEmail?: string): Promise<QuoteRequest[] | null> => {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const quotesCol = collection(db, 'quotes');
    let q = query(quotesCol, orderBy('createdAt', 'desc'));

    if (clientEmail) {
      q = query(quotesCol, where('clientEmail', '==', clientEmail.toLowerCase().trim()), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const quotes: QuoteRequest[] = [];
    snapshot.forEach((docSnap) => {
      quotes.push(docSnap.data() as QuoteRequest);
    });

    return quotes;
  } catch (err) {
    console.warn('Error fetching quotes from Firestore:', err);
    // Fallback without ordering if composite index is pending
    try {
      const quotesCol = collection(db, 'quotes');
      const snapshot = await getDocs(quotesCol);
      const quotes: QuoteRequest[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as QuoteRequest;
        if (!clientEmail || item.clientEmail?.toLowerCase().trim() === clientEmail.toLowerCase().trim()) {
          quotes.push(item);
        }
      });
      quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return quotes;
    } catch (fallbackErr) {
      console.error('Failed to fetch quotes fallback from Firestore:', fallbackErr);
      return null;
    }
  }
};

/**
 * Bulk uploads local quotes to Firestore.
 */
export const syncAllLocalQuotesToFirestore = async (
  quotes: QuoteRequest[]
): Promise<{ success: boolean; synced: number; error?: string }> => {
  const db = getFirestoreDb();
  if (!db) {
    return { success: false, synced: 0, error: 'Firestore no está inicializado' };
  }

  try {
    let synced = 0;
    for (const quote of quotes) {
      const quoteRef = doc(db, 'quotes', quote.id);
      const cleanQuote = JSON.parse(JSON.stringify(quote));
      await setDoc(quoteRef, cleanQuote, { merge: true });
      synced++;
    }
    return { success: true, synced };
  } catch (err: any) {
    return { success: false, synced: 0, error: err?.message || 'Error de sincronización' };
  }
};

/**
 * Saves a user connectivity and access log record to Firestore.
 */
export const saveAccessLogInFirestore = async (log: any): Promise<boolean> => {
  const db = getFirestoreDb();
  if (!db) return false;

  try {
    const logRef = doc(db, 'access_logs', log.id);
    const cleanLog = JSON.parse(JSON.stringify(log));
    await setDoc(logRef, cleanLog, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving access log to Firestore:', err);
    return false;
  }
};

/**
 * Fetches all user connectivity and access logs from Firestore.
 */
export const fetchAccessLogsFromFirestore = async (): Promise<any[] | null> => {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const logsCol = collection(db, 'access_logs');
    const q = query(logsCol, orderBy('connectedAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    const logs: any[] = [];
    snapshot.forEach((docSnap) => {
      logs.push(docSnap.data());
    });
    return logs;
  } catch (err) {
    console.warn('Error fetching access logs ordered from Firestore:', err);
    try {
      const logsCol = collection(db, 'access_logs');
      const snapshot = await getDocs(logsCol);
      const logs: any[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data());
      });
      logs.sort(
        (a, b) =>
          new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime()
      );
      return logs;
    } catch (fallbackErr) {
      console.error('Failed to fetch access logs fallback:', fallbackErr);
      return null;
    }
  }
};

/**
 * Tests live connection to Firestore.
 */
export const testFirestoreConnection = async (): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> => {
  const db = getFirestoreDb();
  if (!db) {
    return {
      success: false,
      message: 'No se pudo inicializar la conexión con Firestore.',
    };
  }

  try {
    const quotesCol = collection(db, 'quotes');
    const q = query(quotesCol, limit(10));
    const snapshot = await getDocs(q);

    return {
      success: true,
      message: `¡Conexión exitosa con Firebase Firestore! Proyecto: ${firebaseConfigRaw.projectId}. Documentos encontrados: ${snapshot.size}`,
      count: snapshot.size,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al conectar con Firestore: ${err?.message || err}`,
    };
  }
};
