import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { QuoteRequest, UserAccount } from '../types';
import { QuoteRequestForm } from './QuoteRequestForm';
import { WHATSAPP_QUOTE_URL, CONTACT_PHONE_DISPLAY } from '../constants/contact';

interface QuoteMeshViewProps {
  onQuoteCreated: (quote: QuoteRequest) => void;
  currentUser: UserAccount | null;
  onBackToHome: () => void;
}

export const QuoteMeshView: React.FC<QuoteMeshViewProps> = ({
  onQuoteCreated,
  currentUser,
  onBackToHome,
}) => {
  const [submittedQuote, setSubmittedQuote] = useState<QuoteRequest | null>(null);

  const handleFormSubmit = (newQuote: QuoteRequest) => {
    const quoteWithAuth: QuoteRequest = {
      ...newQuote,
      clientEmail: newQuote.clientEmail || currentUser?.email || newQuote.clientEmail,
      clientName: newQuote.clientName || currentUser?.fullName || newQuote.clientName,
    };
    onQuoteCreated(quoteWithAuth);
    setSubmittedQuote(quoteWithAuth);
  };

  return (
    <div id="view-quote-mesh-screen" className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-sky-700 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al inicio</span>
        </button>

        <a
          href={WHATSAPP_QUOTE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp {CONTACT_PHONE_DISPLAY}</span>
        </a>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 border border-sky-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold">
            <span>Cotización sin costo</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Pedir cotización de malla de seguridad
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Nombre, teléfono, comuna y, si puedes, una foto o las medidas aproximadas.
            El correo es opcional: te contactamos por WhatsApp.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-sky-200">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sin crear cuenta</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No tapa la vista</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Visita según evaluación</span>
            </div>
          </div>
        </div>
      </div>

      <div id="quote-mesh-form-container">
        <QuoteRequestForm onSubmitQuote={handleFormSubmit} currentUser={currentUser} />
      </div>

      {submittedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-4">
            <button
              type="button"
              onClick={() => {
                setSubmittedQuote(null);
                onBackToHome();
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">Solicitud enviada</h3>
              <p className="text-sm text-slate-600">
                Folio <strong>{submittedQuote.folio}</strong>. Te contactamos por WhatsApp o teléfono para coordinar el presupuesto.
              </p>
            </div>
            <a
              href={WHATSAPP_QUOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Escribir por WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setSubmittedQuote(null);
                onBackToHome();
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
