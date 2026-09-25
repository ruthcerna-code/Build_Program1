import { UserAccessLog, UserAccount, AccessActionType } from '../types';
import { saveAccessLogInFirestore, fetchAccessLogsFromFirestore, isFirebaseConfigured } from './firebaseClient';
import { getStoredQuotes } from './quoteStorage';

const ACCESS_STORAGE_KEY = 'mallas_user_access_logs_v1';

const INITIAL_LOGS: UserAccessLog[] = [
  {
    id: 'log-seed-1',
    userId: 'user-admin-1',
    userEmail: 'rcv.informacion@gmail.com',
    userName: 'Administrador Central RCV',
    role: 'admin',
    connectedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    connectivityTimestamp: Date.now() - 1000 * 60 * 15,
    action: 'login',
    actionDescription: 'Inicio de sesión en Dashboard de Recepción de Cotizaciones',
    quotesCount: 4,
    quoteFolios: ['COT-2026-1048', 'COT-2026-1042'],
    deviceInfo: 'Chrome / macOS (Escritorio)',
  },
  {
    id: 'log-seed-2',
    userId: 'user-ruth-cerna',
    userEmail: 'ruth.cerna@gmail.com',
    userName: 'Ruth Cerna',
    role: 'cliente',
    connectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    connectivityTimestamp: Date.now() - 1000 * 60 * 45,
    action: 'quote_created',
    actionDescription: 'Cotización solicitada para balcón y dormitorio (7.2 m²)',
    quotesCount: 1,
    quoteFolios: ['COT-2026-1048'],
    deviceInfo: 'Google Chrome / Windows 11',
  },
  {
    id: 'log-seed-3',
    userId: 'user-tech-claudio',
    userEmail: 'claudio.soto@mallas-seguras.cl',
    userName: 'Claudio Soto',
    role: 'tecnico',
    connectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    connectivityTimestamp: Date.now() - 1000 * 60 * 120,
    action: 'connectivity_ping',
    actionDescription: 'Recepción y aceptación de orden técnica en terreno',
    quotesCount: 0,
    quoteFolios: ['COT-2026-1035', 'COT-2026-1048'],
    deviceInfo: 'Android / Móvil Cuadrilla',
  },
  {
    id: 'log-seed-4',
    userId: 'user-camila-morales',
    userEmail: 'camila.morales@example.com',
    userName: 'Camila Morales Vega',
    role: 'cliente',
    connectedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    connectivityTimestamp: Date.now() - 1000 * 60 * 360,
    action: 'quote_created',
    actionDescription: 'Ingreso de medidas para 2 ventanas (5.6 m²)',
    quotesCount: 1,
    quoteFolios: ['COT-2026-1042'],
    deviceInfo: 'Safari / iPhone 15',
  }
];

export const getStoredAccessLogs = (): UserAccessLog[] => {
  try {
    const raw = localStorage.getItem(ACCESS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LOGS;
  } catch (err) {
    console.error('Error reading access logs:', err);
    return INITIAL_LOGS;
  }
};

export const saveAccessLogsToStorage = (logs: UserAccessLog[]) => {
  try {
    localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving access logs:', err);
  }
};

/**
 * Records a user access event, connectivity timestamp, and associated quotes
 */
export const recordUserAccessLog = (
  user: UserAccount | null,
  action: AccessActionType,
  description?: string,
  quoteFolio?: string
): UserAccessLog => {
  const allQuotes = getStoredQuotes();
  const userEmail = user?.email || 'ruth.cerna@gmail.com';
  const userName = user?.fullName || (userEmail.includes('admin') ? 'Administrador' : 'Ruth Cerna');
  const role = user?.role || (userEmail.includes('admin') ? 'admin' : 'cliente');

  const userQuotes = allQuotes.filter(
    (q) => q.clientEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()
  );

  const folios = quoteFolio
    ? Array.from(new Set([quoteFolio, ...userQuotes.map((q) => q.folio)]))
    : userQuotes.map((q) => q.folio);

  const defaultDescriptions: Record<AccessActionType, string> = {
    login: 'Inicio de sesión / Autenticación exitosa',
    connectivity_ping: 'Conexión activa a la plataforma',
    quote_created: `Solicitud de cotización realizada (${quoteFolio || 'Nueva solicitud'})`,
    logout: 'Cierre de sesión de usuario',
  };

  const newLog: UserAccessLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user?.id || userEmail,
    userEmail,
    userName,
    role,
    connectedAt: new Date().toISOString(),
    connectivityTimestamp: Date.now(),
    action,
    actionDescription: description || defaultDescriptions[action],
    quotesCount: folios.length,
    quoteFolios: folios,
    deviceInfo: navigator.userAgent.includes('Mobile')
      ? 'Dispositivo Móvil'
      : navigator.userAgent.includes('Mac')
      ? 'Mac / Escritorio'
      : navigator.userAgent.includes('Windows')
      ? 'Windows / Escritorio'
      : 'Navegador Web',
  };

  const current = getStoredAccessLogs();
  const updated = [newLog, ...current].slice(0, 100);
  saveAccessLogsToStorage(updated);

  // Sync to Firebase Firestore asynchronously
  if (isFirebaseConfigured()) {
    saveAccessLogInFirestore(newLog).catch((err) =>
      console.warn('Firebase access log sync notice:', err)
    );
  }

  return newLog;
};

/**
 * Synchronizes access logs with Firestore
 */
export const syncAccessLogsWithFirestore = async (): Promise<UserAccessLog[]> => {
  if (!isFirebaseConfigured()) {
    return getStoredAccessLogs();
  }

  try {
    const remoteLogs = await fetchAccessLogsFromFirestore();
    if (remoteLogs && remoteLogs.length > 0) {
      const local = getStoredAccessLogs();
      const existingIds = new Set(remoteLogs.map((l) => l.id));
      const merged = [...remoteLogs];
      for (const loc of local) {
        if (!existingIds.has(loc.id)) {
          merged.push(loc);
        }
      }
      merged.sort(
        (a, b) =>
          new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime()
      );
      saveAccessLogsToStorage(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Error fetching remote access logs:', err);
  }

  return getStoredAccessLogs();
};
