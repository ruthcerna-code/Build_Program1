import React from 'react';
import { CheckCircle2, ArrowRight, Mail, Inbox, ShieldCheck, X, ExternalLink, Building } from 'lucide-react';
import { QuoteRequest } from '../types';

interface QuoteSuccessModalProps {
  quote: QuoteRequest;
  onClose: () => void;
  onGoToAdmin: () => void;
  onOpenGmailPreview?: () => void;
  onViewClientScreen?: () => void;
}

export const QuoteSuccessModal: React.FC<QuoteSuccessModalProps> = ({
  quote,
  onClose,
  onGoToAdmin,
  onOpenGmailPreview,
  onViewClientScreen,
}) => {
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    quote.clientEmail
  )}&su=${encodeURIComponent(
    `Confirmación de Cotización de Mallas #${quote.folio}`
  )}&body=${encodeURIComponent(
    `Hola ${quote.clientName},\n\nHemos recibido correctamente tu solicitud de cotización para ${quote.windows.length} ventana(s) (${quote.totalAreaM2} m²).\n\nEn breve recibirás el presupuesto oficial de MallasSeguras.`
  )}`;

  return (
    <div
      id="modal-quote-success-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        id="modal-quote-success-content"
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5"
      >
        <button
          id="btn-close-success-modal"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            SOLICITUD ENVIADA CON ÉXITO
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">
            ¡Cotización Registrada!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
            Hemos recibido los datos de tus <strong className="text-slate-800">{quote.windows.length} ventana(s)</strong> ({quote.totalAreaM2} m²).
          </p>
        </div>

        {/* Gmail notification banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">
                Notificación enviada a tu cuenta Gmail:
              </p>
              <p className="text-sky-800 font-semibold break-all">
                {quote.clientEmail}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            {onOpenGmailPreview && (
              <button
                type="button"
                onClick={onOpenGmailPreview}
                className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition-colors"
              >
                Ver correo recibido
              </button>
            )}
            <a
              href={gmailComposeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800 underline text-center"
            >
              <span>Abrir Gmail</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Folio info */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
          <span className="text-slate-500 font-medium">Folio único asignado:</span>
          <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
            {quote.folio}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            id="btn-go-to-admin-reception"
            type="button"
            onClick={onGoToAdmin}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01]"
          >
            <Inbox className="w-4 h-4" />
            <span>Ir a Pantalla 2 (Admin: Cambiar Valor y Enviar)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onViewClientScreen && (
            <button
              id="btn-view-client-screen"
              type="button"
              onClick={onViewClientScreen}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all"
            >
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span>Visualizar Pantalla que va a recibir el Usuario</span>
            </button>
          )}

          <button
            id="btn-close-modal-stay"
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            Permanecer en Inicio
          </button>
        </div>
      </div>
    </div>
  );
};
