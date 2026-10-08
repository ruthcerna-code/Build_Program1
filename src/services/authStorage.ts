import { UserAccount } from '../types';
import { PRINCIPAL_ADMIN_EMAIL } from '../constants/admin';

const USERS_STORAGE_KEY = 'mallas_users_v1';
const CURRENT_USER_KEY = 'mallas_current_user_v1';

const ADMIN_USER: UserAccount = {
  id: 'user-admin-1',
  email: PRINCIPAL_ADMIN_EMAIL,
  passwordHash: '123456',
  fullName: 'Ruth Cerna',
  role: 'admin',
  createdAt: '2026-01-10T10:00:00.000Z',
  mustChangePassword: false,
  authProvider: 'password',
};

function isStaffAccount(user: UserAccount): boolean {
  return user.role === 'admin' || user.role === 'interno' || user.role === 'tecnico';
}

export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const parsed: UserAccount[] = raw ? JSON.parse(raw) : [];
    const staff = parsed.filter(isStaffAccount).map((user) =>
      user.email.toLowerCase() === PRINCIPAL_ADMIN_EMAIL
        ? { ...user, passwordHash: '123456', role: 'admin' as const, fullName: user.fullName || 'Ruth Cerna' }
        : user
    );
    if (!staff.some((user) => user.email.toLowerCase() === PRINCIPAL_ADMIN_EMAIL)) {
      staff.unshift(ADMIN_USER);
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(staff));
    return staff;
  } catch {
    return [ADMIN_USER];
  }
}

function saveStoredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users.filter(isStaffAccount)));
  } catch (err) {
    console.error('Failed to save users', err);
  }
}

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as UserAccount;
    if (!isStaffAccount(user)) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    window.dispatchEvent(new CustomEvent('mallas_auth_updated', { detail: user }));
  } catch (err) {
    console.error('Failed to set current user', err);
  }
}

export function isUserAdmin(user: UserAccount | null): boolean {
  if (!user || !user.email) return false;
  return user.role === 'admin' || user.email.toLowerCase() === PRINCIPAL_ADMIN_EMAIL;
}

export function isUserTechnician(user: UserAccount | null): boolean {
  return user?.role === 'tecnico';
}

export function isInternalUser(user: UserAccount | null): boolean {
  return isUserAdmin(user) || isUserTechnician(user) || user?.role === 'interno';
}

export function loginExistingUser(
  email: string,
  password: string
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();
  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'Ingresa tu correo y tu contraseña.' };
  }

  const users = getStoredUsers();
  const user = users.find((item) => item.email.toLowerCase() === cleanEmail);
  if (!user || !isStaffAccount(user)) {
    return {
      success: false,
      error: 'No hay una cuenta creada para ese correo. Pide a la administradora que te registre.',
    };
  }
  if (user.active === false) {
    return { success: false, error: 'Tu acceso está desactivado.' };
  }
  if (user.passwordHash !== cleanPass) {
    return { success: false, error: 'Correo o contraseña incorrectos.' };
  }
  setCurrentUser(user);
  return { success: true, user };
}

export function upsertLocalStaffUser(account: UserAccount): void {
  const users = getStoredUsers();
  const next = users.filter((item) => item.email.toLowerCase() !== account.email.toLowerCase());
  saveStoredUsers([account, ...next]);
}

export function logoutUser(): void {
  setCurrentUser(null);
  import('./sessionApi').then(({ setSessionToken }) => setSessionToken(null)).catch(() => undefined);
}

export async function syncUsersWithSupabase(): Promise<UserAccount[]> {
  return getStoredUsers();
}
