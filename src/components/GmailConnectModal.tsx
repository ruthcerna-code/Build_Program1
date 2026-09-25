import React, { useState } from 'react';
import {
  X,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { UserAccount } from '../types';
import { loginWithGmailAccount } from '../services/authStorage';

interface GmailConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (user: UserAccount) => void;
  defaultEmail?: string;
}

export const GmailConnectModal: React.FC<GmailConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  defaultEmail = '',
}) => {
  const [gmailAddress, setGmailAddress] = useState(defaultEmail || '');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConnect = (emailToUse: string, nameToUse?: string) => {
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = loginWithGmailAccount(emailToUse, nameToUse || fullName);
      setIsLoading(false);

      if (!res.success || !res.user) {
        setErrorMessage(res.error || 'Error al conectar la cuenta de Gmail.');
        return;
      }

      onConnected(res.user);
      onClose();
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleConnect(gmailAddress, fullName);
  };

  return (
    <div
      id="gmail-connect-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        id="gmail-connect-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-scale-up"
      >
        {/* Top Header with Google / Gmail styling */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-lg">
              {/* Google multi-color SVG icon */}
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold border border-white/30">
                <ShieldCheck className="w-3 h-3" />
                <span>COTIZACIÓN SEGURA &bull; GOOGLE GMAIL</span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5 tracking-tight">
                Conectar con Cuenta Gmail
              </h2>
            </div>
          </div>
          <p className="text-xs text-rose-100 mt-2 leading-relaxed">
            Para comenzar a ingresar las medidas de tus ventanas y enviarte tu cotización formal respaldada por escrito, conéctate con tu correo Gmail.
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Quick-select detected accounts */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Acceso Rápido con 1 Clic
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleConnect('ruth.cerna@gmail.com', 'Ruth Cerna')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-red-400 bg-slate-50 hover:bg-red-50/50 text-left transition-all flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform text-xs">
                  RC
                </div>
                <div className="truncate flex-1">
                  <span className="text-xs font-bold text-slate-800 block truncate">Ruth Cerna</span>
                  <span className="text-[11px] text-slate-500 block truncate">ruth.cerna@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleConnect('cliente.mallas@gmail.com', 'Cliente Mallas')}
                className="p-3 rounded-2xl border border-slate-200 hover:border-sky-400 bg-slate-50 hover:bg-sky-50/50 text-left transition-all flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-black group-hover:scale-105 transition-transform text-xs">
                  CM
                </div>
                <div className="truncate flex-1">
                  <span className="text-xs font-bold text-slate-800 block truncate">Cliente Mallas</span>
                  <span className="text-[11px] text-slate-500 block truncate">cliente.mallas@gmail.com</span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-slate-400 text-xs font-semibold">o escribe tu Gmail</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Form to enter any Gmail address */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="input-gmail-address"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Tu Correo Gmail (@gmail.com) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-gmail-address"
                  type="email"
                  required
                  placeholder="ejemplo: tu.nombre@gmail.com"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-gmail-fullname"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Nombre del Titular (Opcional)
              </label>
              <input
                id="input-gmail-fullname"
                type="text"
                placeholder="Nombre y Apellido"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>

            <button
              id="btn-submit-gmail-connect"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Conectando con Gmail...</span>
              ) : (
                <>
                  <span>Conectar e Ir a Cotizar Malla</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & Guarantee notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-500 flex items-start gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Tus datos están protegidos bajo estricta confidencialidad. Tu correo Gmail se utilizará exclusivamente para enviarte tu presupuesto formal, la fecha acordada de instalación y la garantía del servicio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
