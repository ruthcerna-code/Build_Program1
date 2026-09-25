import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  RotateCcw,
  Inbox,
  Clock,
  ExternalLink
} from 'lucide-react';
import { UserAccount, PasswordRecoveryMail } from '../types';
import {
  loginOrRegisterUser,
  loginWithGmailAccount,
  requestPasswordRecovery,
  setNewPasswordWithProvisional,
} from '../services/authStorage';

export type AuthMode = 'login' | 'recover' | 'mail_sent' | 'reset_password';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount, message: string) => void;
  initialMode?: AuthMode;
  prefilledEmail?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  prefilledEmail = '',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Recovery & reset state
  const [provisionalPassword, setProvisionalPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [lastRecoveryMail, setLastRecoveryMail] = useState<PasswordRecoveryMail | null>(null);

  // Status & notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync initial state on open
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      if (prefilledEmail) {
        setEmail(prefilledEmail);
      }
    }
  }, [isOpen, initialMode, prefilledEmail]);

  if (!isOpen) return null;

  // HANDLE LOGIN OR IMMEDIATE USER CREATION
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    setTimeout(() => {
      const result = loginOrRegisterUser(email, password, fullName);
      setLoading(false);

      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'Error al iniciar sesión.');
        return;
      }

      if (result.mustChangePassword) {
        // User logged in using a provisional password, must set new password
        setProvisionalPassword(password);
        setMode('reset_password');
        setErrorMessage(
          'Has ingresado con una contraseña provisionaria. Por favor ingresa tu nueva contraseña definitiva.'
        );
        return;
      }

      const welcomeMsg = result.isNewUser
        ? `¡Cuenta creada con éxito! Bienvenido(a) ${result.user.fullName || result.user.email}`
        : `¡Bienvenido(a) de nuevo, ${result.user.fullName || result.user.email}!`;

      onSuccess(result.user, welcomeMsg);
      onClose();
    }, 350);
  };

  // HANDLE PASSWORD RECOVERY REQUEST
  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Ingresa el correo electrónico asociado a tu cuenta.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = requestPasswordRecovery(email);
      setLoading(false);

      if (!result.success || !result.provisionalPassword) {
        setErrorMessage(result.error || 'Error al procesar la recuperación de contraseña.');
        return;
      }

      setProvisionalPassword(result.provisionalPassword);
      if (result.recoveryMail) {
        setLastRecoveryMail(result.recoveryMail);
      }
      setMode('mail_sent');
    }, 450);
  };

  // HANDLE SETTING NEW DEFINITIVE PASSWORD
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage('La nueva contraseña debe contener al menos 4 caracteres.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const result = setNewPasswordWithProvisional(email, provisionalPassword, newPassword);
      setLoading(false);

      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'No se pudo actualizar la contraseña.');
        return;
      }

      onSuccess(
        result.user,
        `¡Tu contraseña ha sido actualizada con éxito! Bienvenido(a), ${result.user.fullName || result.user.email}.`
      );
      onClose();
    }, 400);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleQuickFill = (demoEmail: string, demoPass: string, demoName: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFullName(demoName);
    setErrorMessage(null);
  };

  return (
    <div
      id="login-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="login-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scale-up"
      >
        {/* HEADER MODAL */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 p-6 text-white relative">
          <button
            id="btn-close-login-modal"
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-200">
              {mode === 'login' && <User className="w-6 h-6 text-amber-300" />}
              {mode === 'recover' && <KeyRound className="w-6 h-6 text-amber-300" />}
              {mode === 'mail_sent' && <Mail className="w-6 h-6 text-emerald-300" />}
              {mode === 'reset_password' && <Lock className="w-6 h-6 text-sky-300" />}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 text-[11px] font-bold border border-sky-400/30">
                <ShieldCheck className="w-3 h-3 text-sky-300" />
                <span>ACCESO SEGURO A MALLASSEGURAS</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">
                {mode === 'login' && 'Iniciar Sesión / Crear Cuenta'}
                {mode === 'recover' && 'Recuperar Contraseña'}
                {mode === 'mail_sent' && 'Contraseña Provisionaria Enviada'}
                {mode === 'reset_password' && 'Definir Nueva Contraseña'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-sky-100/80 mt-2">
            {mode === 'login' &&
              'Si es tu primera vez, tu cuenta se creará de forma inmediata con tu correo y contraseña.'}
            {mode === 'recover' &&
              'Te enviaremos un correo con una contraseña provisionaria para acceder y luego definir una nueva.'}
            {mode === 'mail_sent' &&
              'Hemos enviado una clave provisionaria al correo ingresado. Revísala a continuación.'}
            {mode === 'reset_password' &&
              'Ingresa tu clave provisionaria y especifica la nueva contraseña definitiva para tu cuenta.'}
          </p>
        </div>

        {/* ERROR MESSAGE BAR */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* BODY BY MODE */}
        <div className="p-6">
          {/* =========================================================================
              MODO 1: LOGIN O CREACIÓN INMEDIATA
             ========================================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Google / Gmail Quick Connect Button */}
              <button
                type="button"
                onClick={() => {
                  const targetEmail = email.trim() || 'ruth.cerna@gmail.com';
                  const res = loginWithGmailAccount(targetEmail, fullName);
                  if (res.success && res.user) {
                    onSuccess(res.user, `¡Conectado exitosamente con cuenta Gmail: ${res.user.email}!`);
                    onClose();
                  } else {
                    setErrorMessage(res.error || 'Error al conectar con Gmail.');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold shadow-2xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Conectar con Google / Gmail</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-4 text-slate-400 text-[11px] font-semibold">o ingresa con tu contraseña</span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              {/* Notice of immediate creation */}
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-xs text-sky-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Creación Inmediata de Usuario:</strong>
                  Si el correo no existe en el sistema, la cuenta se creará de forma automática al presionar <em>Ingresar / Crear Cuenta</em>.
                </div>
              </div>

              {/* Email / Username field */}
              <div>
                <label
                  htmlFor="input-login-email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Correo Electrónico (Nombre de usuario) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    placeholder="ejemplo: ruth.cerna@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="input-login-password"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Contraseña (Password) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recover');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-sky-700 hover:text-sky-800 hover:underline font-bold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" /> Verificando...
                  </span>
                ) : (
                  <>
                    <span>Ingresar / Crear Cuenta Inmediata</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Demo quick-fill accounts */}
              <div className="pt-4 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                  Cuentas de Acceso Rápido
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill('ruth.cerna@gmail.com', 'admin123', 'Ruth Cerna')
                    }
                    className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition-colors"
                  >
                    <span className="block text-[11px] font-bold text-sky-800">Admin Ruth</span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      ruth.cerna@gmail.com
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill('cliente@demo.cl', 'cliente123', 'Alejandra Morales')
                    }
                    className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition-colors"
                  >
                    <span className="block text-[11px] font-bold text-emerald-800">Cliente Demo</span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      cliente@demo.cl
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickFill('tecnico@demo.cl', 'tecnico123', 'Claudio Soto')
                    }
                    className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition-colors"
                  >
                    <span className="block text-[11px] font-bold text-slate-800">Técnico Demo</span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      tecnico@demo.cl
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* =========================================================================
              MODO 2: RECUPERAR CONTRASEÑA (ENVIAR CORREO CON CLAVE PROVISIONARIA)
             ========================================================================= */}
          {mode === 'recover' && (
            <form onSubmit={handleRecoverSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  Ingresa tu correo registrado. Te enviaremos de forma automática una <strong>contraseña provisionaria</strong> para que puedas acceder y posteriormente definir tu <strong>nueva contraseña</strong>.
                </p>
              </div>

              <div>
                <label
                  htmlFor="input-recover-email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Tu Correo Electrónico Registrado *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-recover-email"
                    type="email"
                    required
                    placeholder="ejemplo: ruth.cerna@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <button
                id="btn-submit-recover"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" /> Enviando correo con clave provisionaria...
                  </span>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Enviar Contraseña Provisionaria al Correo</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Volver a Iniciar Sesión</span>
                </button>
              </div>
            </form>
          )}

          {/* =========================================================================
              MODO 3: NOTIFICACIÓN Y SIMULACIÓN DEL CORREO RECIBIDO CON CLAVE PROVISIONARIA
             ========================================================================= */}
          {mode === 'mail_sent' && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  ¡Correo enviado a {email}!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revisa a continuación el correo que ha llegado con tu contraseña provisionaria:
                </p>
              </div>

              {/* Simulated Email Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Inbox className="w-3.5 h-3.5 text-sky-600" />
                    <span>De: <strong>seguridad@mallas-seguras.cl</strong></span>
                  </div>
                  <span>Ahora mismo</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Asunto: Recuperación de Acceso - Tu Contraseña Provisionaria
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Estimado(a) usuario(a) de <strong>{email}</strong>, has solicitado restablecer tu acceso en MallasSeguras.
                  </p>
                </div>

                {/* Provisionary password badge with copy button */}
                <div className="bg-white border-2 border-dashed border-sky-300 rounded-xl p-3 text-center space-y-1.5 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tu Contraseña Provisionaria:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xl font-black text-sky-800 tracking-wider bg-sky-50 px-3 py-1 rounded-lg border border-sky-200">
                      {provisionalPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(provisionalPassword)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 transition-colors"
                      title="Copiar contraseña provisionaria"
                    >
                      {copiedCode ? (
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {copiedCode && (
                    <span className="text-[10px] text-emerald-700 font-bold block animate-fade-in">
                      ✓ Contraseña copiada al portapapeles
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 text-center">
                  Al continuar, ingresaremos esta clave provisionaria para que puedas entregar tu <strong>nueva contraseña definitiva</strong>.
                </p>
              </div>

              {/* Action button to continue to set new password */}
              <button
                id="btn-go-to-set-new-password"
                type="button"
                onClick={() => {
                  setMode('reset_password');
                  setErrorMessage(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuar y Entregar Nueva Contraseña</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODO 4: ENTREGAR NUEVA CONTRASEÑA DEFINITIVA
             ========================================================================= */}
          {mode === 'reset_password' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-xs text-sky-900 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p>
                  Por favor valida tu <strong>clave provisionaria</strong> y entrega la <strong>nueva contraseña</strong> que usarás para tus próximos ingresos.
                </p>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="input-reset-email"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 bg-slate-50 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Provisional Password */}
              <div>
                <label
                  htmlFor="input-reset-provisional"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Contraseña Provisionaria (recibida en el correo) *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-reset-provisional"
                    type="text"
                    required
                    placeholder="Ej: MALLA-4819"
                    value={provisionalPassword}
                    onChange={(e) => setProvisionalPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm text-sky-900 font-bold focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="input-new-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Nueva Contraseña Definitiva *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="input-confirm-password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <Check className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="input-confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-new-password"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" /> Guardando nueva contraseña...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Guardar Nueva Contraseña e Iniciar Sesión</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancelar y volver
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
