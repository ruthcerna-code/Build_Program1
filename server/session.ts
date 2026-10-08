import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import {
  ADMIN_EMAIL,
  GOOGLE_CLIENT_ID,
  SESSION_SECRET,
  isPrincipalAdmin,
} from './config';
import { getAdminClient } from './supabaseAdmin';
import type { InternalPermissions, UserAccount, UserRole } from '../src/types';

export interface SessionUser {
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  permissions: InternalPermissions;
  active: boolean;
  emailVerified: boolean;
}

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const EMPTY_PERMS: InternalPermissions = {
  viewQuotes: false,
  editQuotes: false,
  deleteQuotes: false,
  viewSales: false,
};

const ADMIN_PERMS: InternalPermissions = {
  viewQuotes: true,
  editQuotes: true,
  deleteQuotes: true,
  viewSales: true,
};

function sign(payload: string): string {
  if (!SESSION_SECRET) return '';
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

export function createSessionToken(user: SessionUser): string {
  const body = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + 12 * 60 * 60 * 1000 })
  ).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token?: string | null): SessionUser | null {
  if (!token || !SESSION_SECRET) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig || sign(body) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data?.email || !data.exp || data.exp < Date.now()) return null;
    return data as SessionUser;
  } catch {
    return null;
  }
}

export function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export async function resolveRole(email: string, name: string): Promise<SessionUser> {
  const normalized = email.trim().toLowerCase();
  if (isPrincipalAdmin(normalized)) {
    return {
      email: normalized,
      name: name || 'Administradora',
      role: 'admin',
      permissions: ADMIN_PERMS,
      active: true,
      emailVerified: true,
    };
  }

  const admin = getAdminClient();
  if (admin) {
    const { data } = await admin
      .from('internal_users')
      .select('*')
      .eq('email', normalized)
      .maybeSingle();

    if (data) {
      return {
        email: normalized,
        name: data.full_name || name,
        role: 'interno',
        permissions: {
          viewQuotes: !!data.can_view_quotes,
          editQuotes: !!data.can_edit_quotes,
          deleteQuotes: !!data.can_delete_quotes,
          viewSales: !!data.can_view_sales,
        },
        active: data.active !== false,
        emailVerified: true,
      };
    }
  }

  return {
    email: normalized,
    name: name || normalized.split('@')[0],
    role: 'cliente',
    permissions: EMPTY_PERMS,
    active: true,
    emailVerified: true,
  };
}

export async function verifyGoogleIdToken(idToken: string): Promise<SessionUser> {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID no está configurado en el servidor.');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const email = payload?.email?.toLowerCase();
  if (!email || !payload?.email_verified) {
    throw new Error('La cuenta de Google no tiene un correo verificado.');
  }

  return resolveRole(email, payload.name || email.split('@')[0]);
}

export function requireSession(req: Request, res: Response, next: NextFunction) {
  const user = readSessionToken(getBearerToken(req));
  if (!user) {
    return res.status(401).json({
      error: 'Debes iniciar sesión para continuar.',
    });
  }
  if (user.active === false) {
    return res.status(403).json({
      error: 'Tu acceso está desactivado. Pide ayuda a la administradora.',
    });
  }
  (req as Request & { sessionUser: SessionUser }).sessionUser = user;
  next();
}

export function getSessionUser(req: Request): SessionUser | null {
  return (req as Request & { sessionUser?: SessionUser }).sessionUser || readSessionToken(getBearerToken(req));
}

export function requirePrincipalAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user || !isPrincipalAdmin(user.email)) {
    return res.status(403).json({
      error: 'Solo la administradora principal puede hacer esta acción.',
    });
  }
  next();
}

export function sessionToAccount(user: SessionUser): UserAccount {
  return {
    id: `google-${user.email}`,
    email: user.email,
    passwordHash: '',
    fullName: user.name,
    role: user.role,
    createdAt: new Date().toISOString(),
    active: user.active,
    permissions: user.permissions,
    authProvider: 'google',
  };
}

export { ADMIN_EMAIL, EMPTY_PERMS, ADMIN_PERMS };
