import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, Eye, EyeOff, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { UserAccount } from '../types';
import { loginExistingUser, setCurrentUser } from '../services/authStorage';
import { loginWithPassword } from '../services/sessionApi';

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
  prefilledEmail = '',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setPassword('');
      if (prefilledEmail) setEmail(prefilledEmail);
    }
  }, [isOpen, prefilledEmail]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      const data = await loginWithPassword(email, password);
      setCurrentUser(data.user);
      onSuccess(data.user, `Bienvenida/o, ${data.user.fullName || data.user.email}.`);
      onClose();
    } catch (err: any) {
      const fallback = loginExistingUser(email, password);
      if (fallback.success && fallback.user) {
        onSuccess(fallback.user, `Bienvenida/o, ${fallback.user.fullName || fallback.user.email}.`);
        onClose();
        return;
      }
      setErrorMessage(err?.message || fallback.error || 'No pudimos iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
      >
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-200 text-[11px] font-bold border border-sky-400/30">
                <ShieldCheck className="w-3 h-3 text-sky-300" />
                <span>ACCESO DEL EQUIPO</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-0.5">Iniciar sesión</h2>
            </div>
          </div>
          <p className="text-xs text-sky-100/80 mt-2">
            Solo ingresan cuentas creadas en Administración de usuarios, con su correo y contraseña.
          </p>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Correo
            <span className="relative mt-1 block">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800"
              />
            </span>
          </label>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Contraseña
            <span className="relative mt-1 block">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                Verificando…
              </span>
            ) : (
              <>
                <span>Ingresar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
