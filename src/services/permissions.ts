import { UserAccount } from '../types';
import { isPrincipalAdminEmail } from '../constants/admin';
import { isUserAdmin } from './authStorage';

export function canViewQuotes(user: UserAccount | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user) || user.role === 'cliente' || user.role === 'tecnico') return true;
  return !!user.permissions?.viewQuotes;
}

export function canEditQuotes(user: UserAccount | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.permissions?.editQuotes;
}

export function canDeleteQuotes(user: UserAccount | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.permissions?.deleteQuotes;
}

export function canViewSales(user: UserAccount | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return !!user.permissions?.viewSales;
}

export function canManageUsers(user: UserAccount | null): boolean {
  return isPrincipalAdminEmail(user?.email);
}

export function canSyncData(user: UserAccount | null): boolean {
  return isPrincipalAdminEmail(user?.email);
}

export function canViewHistory(user: UserAccount | null): boolean {
  return (
    canEditQuotes(user) ||
    (canViewQuotes(user) && (isUserAdmin(user) || user?.role === 'interno' || user?.role === 'tecnico'))
  );
}
