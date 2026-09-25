import { UserAccount, PasswordRecoveryMail, UserRole } from '../types';

const USERS_STORAGE_KEY = 'mallas_users_v1';
const CURRENT_USER_KEY = 'mallas_current_user_v1';
const RECOVERY_MAILS_KEY = 'mallas_recovery_mails_v1';

// Pre-seeded users for ease of testing
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin-1',
    email: 'ruth.cerna@gmail.com',
    passwordHash: 'admin123',
    fullName: 'Ruth Cerna',
    role: 'admin',
    createdAt: '2026-01-10T10:00:00.000Z',
    mustChangePassword: false,
  },
  {
    id: 'user-client-1',
    email: 'cliente@demo.cl',
    passwordHash: 'cliente123',
    fullName: 'Alejandra Morales',
    role: 'cliente',
    createdAt: '2026-02-15T14:30:00.000Z',
    mustChangePassword: false,
  },
  {
    id: 'user-tech-1',
    email: 'tecnico@demo.cl',
    passwordHash: 'tecnico123',
    fullName: 'Claudio Soto',
    role: 'tecnico',
    createdAt: '2026-02-20T09:00:00.000Z',
    mustChangePassword: false,
  },
];

/**
 * Get all registered users from storage
 */
export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

/**
 * Save users list to storage
 */
function saveStoredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users', err);
  }
}

/**
 * Get currently logged-in user
 */
export function getCurrentUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save currently logged-in user
 */
export function setCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('mallas_auth_updated', { detail: user }));
  } catch (err) {
    console.error('Failed to set current user', err);
  }
}

/**
 * Check if the user is currently connected with a Gmail account
 */
export function isUserGmailConnected(user: UserAccount | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase().endsWith('@gmail.com');
}

/**
 * Check if the user is an administrator
 */
export function isUserAdmin(user: UserAccount | null): boolean {
  if (!user || !user.email) return false;
  return (
    user.role === 'admin' ||
    user.email.toLowerCase().includes('admin') ||
    user.email.toLowerCase() === 'ruth.cerna@gmail.com' ||
    user.email.toLowerCase() === 'rcv.informacion@gmail.com'
  );
}

/**
 * Connect or register immediately via Gmail account
 */
export function loginWithGmailAccount(
  email: string,
  fullName?: string
): {
  success: boolean;
  user?: UserAccount;
  isNewUser?: boolean;
  error?: string;
} {
  let cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) {
    return {
      success: false,
      error: 'Por favor ingresa tu cuenta de Gmail.',
    };
  }

  // Auto-append @gmail.com if only username was entered
  if (!cleanEmail.includes('@')) {
    cleanEmail = `${cleanEmail}@gmail.com`;
  }

  if (!cleanEmail.endsWith('@gmail.com')) {
    return {
      success: false,
      error: 'El correo debe ser una cuenta válida de Gmail (@gmail.com).',
    };
  }

  const users = getStoredUsers();
  const existingUserIndex = users.findIndex(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  if (existingUserIndex !== -1) {
    const existing = users[existingUserIndex];
    setCurrentUser(existing);
    return {
      success: true,
      user: existing,
      isNewUser: false,
    };
  }

  // Create new user immediately with role 'cliente' (or 'admin' if ruth)
  const role: UserRole =
    cleanEmail === 'ruth.cerna@gmail.com' ? 'admin' : 'cliente';

  const defaultName =
    fullName?.trim() ||
    cleanEmail
      .split('@')[0]
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const newUser: UserAccount = {
    id: `user-gmail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    passwordHash: 'google-auth-connected',
    fullName: defaultName,
    role: role,
    createdAt: new Date().toISOString(),
    mustChangePassword: false,
  };

  const updatedUsers = [newUser, ...users];
  saveStoredUsers(updatedUsers);
  setCurrentUser(newUser);

  return {
    success: true,
    user: newUser,
    isNewUser: true,
  };
}

/**
 * Login or immediately create account if user does not exist
 * "generar un login de usuario el cual sea creado de forma inmediata cuando se tenga nombre de usuario, que será el correo y password"
 */
export function loginOrRegisterUser(
  email: string,
  password: string,
  fullName?: string
): {
  success: boolean;
  user?: UserAccount;
  isNewUser?: boolean;
  mustChangePassword?: boolean;
  error?: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanEmail || !cleanPass) {
    return {
      success: false,
      error: 'Por favor ingresa tu correo (nombre de usuario) y tu contraseña.',
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      success: false,
      error: 'Por favor ingresa un correo electrónico válido.',
    };
  }

  const users = getStoredUsers();
  const existingUserIndex = users.findIndex(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  // CASE 1: User does not exist -> CREATE IMMEDIATELY!
  if (existingUserIndex === -1) {
    // Determine default role
    let role: UserRole = 'cliente';
    if (
      cleanEmail === 'ruth.cerna@gmail.com' ||
      cleanEmail.includes('admin')
    ) {
      role = 'admin';
    } else if (cleanEmail.includes('tecnico') || cleanEmail.includes('instalador')) {
      role = 'tecnico';
    }

    const displayName =
      fullName?.trim() ||
      (cleanEmail.split('@')[0]
        ? cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1)
        : 'Usuario');

    const newUser: UserAccount = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      passwordHash: cleanPass,
      fullName: displayName,
      role: role,
      createdAt: new Date().toISOString(),
      mustChangePassword: false,
    };

    const updatedUsers = [newUser, ...users];
    saveStoredUsers(updatedUsers);
    setCurrentUser(newUser);

    return {
      success: true,
      user: newUser,
      isNewUser: true,
      mustChangePassword: false,
    };
  }

  // CASE 2: User exists -> Verify password or provisional password
  const user = users[existingUserIndex];

  // Check provisional password first
  if (user.provisionalPassword && cleanPass === user.provisionalPassword) {
    const updatedUser: UserAccount = {
      ...user,
      mustChangePassword: true,
    };
    users[existingUserIndex] = updatedUser;
    saveStoredUsers(users);
    setCurrentUser(updatedUser);

    return {
      success: true,
      user: updatedUser,
      isNewUser: false,
      mustChangePassword: true,
    };
  }

  // Check permanent password
  if (user.passwordHash === cleanPass) {
    setCurrentUser(user);
    return {
      success: true,
      user: user,
      isNewUser: false,
      mustChangePassword: !!user.mustChangePassword,
    };
  }

  return {
    success: false,
    error: 'La contraseña ingresada no es correcta. Si la olvidaste, selecciona "Recuperar contraseña".',
  };
}

/**
 * Request password recovery: generates provisional password and creates simulated mail
 * "en caso de seleccionar la opcion, se enviará un correo al usuario, entregandole una password provisionaria"
 */
export function requestPasswordRecovery(email: string): {
  success: boolean;
  provisionalPassword?: string;
  recoveryMail?: PasswordRecoveryMail;
  error?: string;
} {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      success: false,
      error: 'Por favor ingresa el correo al cual enviar la contraseña provisionaria.',
    };
  }

  const users = getStoredUsers();
  const existingUserIndex = users.findIndex(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  // Generate random readable provisional password: e.g., MALLA-7492
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const provisionalPassword = `MALLA-${randomNum}`;
  const nowIso = new Date().toISOString();

  let targetUser: UserAccount;

  if (existingUserIndex === -1) {
    // If user didn't exist yet, create account automatically with this provisional password
    const role: UserRole =
      cleanEmail === 'ruth.cerna@gmail.com' || cleanEmail.includes('admin')
        ? 'admin'
        : 'cliente';

    targetUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      passwordHash: provisionalPassword,
      fullName: cleanEmail.split('@')[0],
      role: role,
      createdAt: nowIso,
      provisionalPassword: provisionalPassword,
      provisionalPasswordCreatedAt: nowIso,
      mustChangePassword: true,
    };

    saveStoredUsers([targetUser, ...users]);
  } else {
    // Update existing user with the provisional password
    targetUser = {
      ...users[existingUserIndex],
      provisionalPassword: provisionalPassword,
      provisionalPasswordCreatedAt: nowIso,
      mustChangePassword: true,
    };
    users[existingUserIndex] = targetUser;
    saveStoredUsers(users);
  }

  // Create simulated mail record
  const recoveryMail: PasswordRecoveryMail = {
    id: `mail-rec-${Date.now()}`,
    toEmail: cleanEmail,
    provisionalPassword: provisionalPassword,
    sentAt: nowIso,
    expiresInMinutes: 30,
  };

  try {
    const existingMails: PasswordRecoveryMail[] = JSON.parse(
      localStorage.getItem(RECOVERY_MAILS_KEY) || '[]'
    );
    localStorage.setItem(
      RECOVERY_MAILS_KEY,
      JSON.stringify([recoveryMail, ...existingMails])
    );
  } catch (e) {
    console.error('Failed to log recovery mail', e);
  }

  return {
    success: true,
    provisionalPassword,
    recoveryMail,
  };
}

/**
 * Set a new definitive password using the provisional password
 * "para luego, entregar al usuario la opcion de entregar una nueva password"
 */
export function setNewPasswordWithProvisional(
  email: string,
  provisionalPassword: string,
  newPassword: string
): {
  success: boolean;
  user?: UserAccount;
  error?: string;
} {
  const cleanEmail = email.trim().toLowerCase();
  const cleanProvisional = provisionalPassword.trim();
  const cleanNewPass = newPassword.trim();

  if (!cleanEmail || !cleanProvisional || !cleanNewPass) {
    return {
      success: false,
      error: 'Todos los campos son requeridos para definir tu nueva contraseña.',
    };
  }

  if (cleanNewPass.length < 4) {
    return {
      success: false,
      error: 'La nueva contraseña debe tener al menos 4 caracteres.',
    };
  }

  const users = getStoredUsers();
  const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  if (userIndex === -1) {
    return {
      success: false,
      error: 'No se encontró un usuario con el correo especificado.',
    };
  }

  const user = users[userIndex];

  // Verify provisional password OR existing password
  const matchesProvisional =
    user.provisionalPassword && user.provisionalPassword === cleanProvisional;
  const matchesCurrent = user.passwordHash === cleanProvisional;

  if (!matchesProvisional && !matchesCurrent) {
    return {
      success: false,
      error:
        'La contraseña provisionaria no coincide con la enviada a tu correo. Por favor revísala e intenta nuevamente.',
    };
  }

  // Update password and clear provisional state
  const updatedUser: UserAccount = {
    ...user,
    passwordHash: cleanNewPass,
    provisionalPassword: undefined,
    provisionalPasswordCreatedAt: undefined,
    mustChangePassword: false,
  };

  users[userIndex] = updatedUser;
  saveStoredUsers(users);
  setCurrentUser(updatedUser);

  return {
    success: true,
    user: updatedUser,
  };
}

/**
 * Logout current user
 */
export function logoutUser(): void {
  setCurrentUser(null);
}
