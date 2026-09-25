import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  User,
  ArrowLeft,
  Sparkles,
  Lock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Info
} from 'lucide-react';
import { QuoteRequest, UserAccount } from '../types';
import { QuoteRequestForm } from './QuoteRequestForm';
import { GmailConfirmationModal } from './GmailConfirmationModal';

interface QuoteMeshViewProps {
  onQuoteCreated: (quote: QuoteRequest) => void;
  currentUser: UserAccount | null;
  onBackToHome: () => void;
  onGoToAdmin?: () => void;
  onChangeGmailAccount: () => void;
}

export const QuoteMeshView: React.FC<QuoteMeshViewProps> = ({
  onQuoteCreated,
  currentUser,
  onBackToHome,
  onGoToAdmin,
  onChangeGmailAccount,
}) => {
  const [submittedQuote, setSubmittedQuote] = useState<QuoteRequest | null>(null);

  const handleFormSubmit = (newQuote: QuoteRequest) => {
    // If quote clientEmail wasn't set or differs, ensure authenticated user's email is linked
    const quoteWithAuth: QuoteRequest = {
      ...newQuote,
      clientEmail: currentUser?.email || newQuote.clientEmail,
      clientName: currentUser?.fullName || newQuote.clientName,
    };
    onQuoteCreated(quoteWithAuth);
    setSubmittedQuote(quoteWithAuth);
  };

  return (
    <div id="view-quote-mesh-screen" className="space-y-8 pb-16">
      {/* Top Navigation & Breadcrumbs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-sky-700 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver a la Página de Inicio</span>
        </button>

        {/* Verified Gmail Authentication Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
            {/* Google G icon */}
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
            <span>
              Conectado con Gmail:{' '}
              <strong className="font-bold text-red-950">
                {currentUser?.email || 'ruth.cerna@gmail.com'}
              </strong>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </div>

          <button
            type="button"
            onClick={onChangeGmailAccount}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Cambiar a otra cuenta de Gmail"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Cambiar Gmail</span>
          </button>
        </div>
      </div>

      {/* Screen Title & Info Header */}
      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 border border-sky-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>PANTALLA DE COTIZACIÓN &bull; MALLASSEGURAS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Cotizar Malla de Seguridad para Ventanas
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Ingresa las medidas de tus ventanas y tus fechas tentativas de instalación.
            Al presionar <strong>Ejecutar Enviar</strong>, se despachará la solicitud a la empresa (<span className="text-white font-semibold underline">rcv.informacion@gmail.com</span>) y se le avisará al cliente a su correo (<span className="text-white font-semibold underline">{currentUser?.email || 'ruth.cerna@gmail.com'}</span>) que está cotizando, sin colocar precio anticipado hasta la evaluación técnica.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-sky-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resistencia 180 kg/m²</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Filtro Solar 100% UV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>15% de Descuento desde 3 ventanas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Quote Request Form (preserves all data, windows, calculations, and dates) */}
      <div id="quote-mesh-form-container">
        <QuoteRequestForm
          onSubmitQuote={handleFormSubmit}
          currentUser={currentUser}
        />
      </div>

      {/* Confirmation & Notification Modal after submitting quote */}
      {submittedQuote && (
        <GmailConfirmationModal
          quote={submittedQuote}
          onClose={() => setSubmittedQuote(null)}
          onGoToAdmin={() => {
            setSubmittedQuote(null);
            if (onGoToAdmin) onGoToAdmin();
          }}
          onViewClientScreen={() => setSubmittedQuote(null)}
        />
      )}
    </div>
  );
};
