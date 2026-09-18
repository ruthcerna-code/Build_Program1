import React from 'react';
import {
  X,
  Mail,
  ExternalLink,
  CheckCircle2,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Building,
  Sparkles
} from 'lucide-react';
import { QuoteRequest } from '../types';

interface GmailConfirmationModalProps {
  quote: QuoteRequest;
  onClose: () => void;
  onGoToAdmin: () => void;
  onViewClientScreen: () => void;
}

export const GmailConfirmationModal: React.FC<GmailConfirmationModalProps> = ({
  quote,
  onClose,
  onGoToAdmin,
  onViewClientScreen,
}) => {
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    quote.clientEmail
  )}&su=${encodeURIComponent(
    `Confirmación de Cotización Mallas de Seguridad ${quote.folio}`
  )}&body=${encodeURIComponent(
    `Hola ${quote.clientName},\n\nHemos recibido correctamente tu solicitud de cotización para ${quote.windows.length} ventana(s) con una superficie estimada de ${quote.totalAreaM2} m² en tu domicilio (${quote.clientAddress}, ${quote.clientCity}).\n\nEl equipo técnico de administración está revisando tus medidas y te enviará el presupuesto oficial a esta misma cuenta (${quote.clientEmail}).\n\nAtentamente,\nMallasSeguras Chile`
  )}`;

  return (
    <div
      id="modal-gmail-confirmation-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div
        id="modal-gmail-confirmation-container"
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col"
      >
        {/* Gmail Style Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Notificación Enviada a tu Cuenta Gmail</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.2 rounded-full">
                  CORREO ENVIADO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Bandeja de entrada: <strong className="text-white">{quote.clientEmail}</strong>
              </p>
            </div>
          </div>

          <button
            id="btn-close-gmail-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated Incoming Gmail Message Card */}
        <div className="p-6 sm:p-8 space-y-5 bg-slate-50">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            {/* Email Metadata */}
            <div className="border-b border-slate-100 pb-3 space-y-1 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  MallasSeguras &lt;cotizaciones@mallas-seguras.cl&gt;
                </span>
                <span className="text-slate-400 text-[11px]">Recién recibido</span>
              </div>
              <div>
                <span className="text-slate-400">Para:</span>{' '}
                <strong className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  {quote.clientName} &lt;{quote.clientEmail}&gt;
                </strong>
              </div>
              <div className="pt-1">
                <span className="text-slate-400">Asunto:</span>{' '}
                <span className="font-bold text-slate-900">
                  Confirmación de Recepción: Cotización de Mallas #{quote.folio}
                </span>
              </div>
            </div>

            {/* Email Content */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p className="font-bold text-slate-900">
                ¡Hola {quote.clientName}!
              </p>
              <p>
                Hemos recibido con éxito tu solicitud de presupuesto para la instalación de mallas de seguridad en{' '}
                <strong>{quote.clientAddress}, {quote.clientCity}</strong>.
              </p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1 text-xs">
                <p className="font-bold text-slate-800">Resumen de lo recibido:</p>
                <p className="text-slate-600">
                  &bull; <strong>Ventanas ingresadas:</strong> {quote.windows.length} ventana(s)
                </p>
                <p className="text-slate-600">
                  &bull; <strong>Superficie calculada:</strong> {quote.totalAreaM2} m² aproximados
                </p>
                <p className="text-slate-600">
                  &bull; <strong>Número de Folio:</strong>{' '}
                  <span className="font-mono font-bold text-sky-700">{quote.folio}</span>
                </p>
              </div>

              <p className="text-xs text-slate-600">
                La solicitud ya fue recibida por nuestro administrador técnico en la <strong>Pantalla de Recepción</strong>, 
                quien fijará el valor de la instalación y te enviará la cotización formal a esta cuenta Gmail.
              </p>
            </div>

            {/* Direct Gmail action */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                id="link-open-gmail-web"
                href={gmailComposeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en Gmail Web ({quote.clientEmail})</span>
              </a>

              <span className="text-xs text-slate-400">
                Notificación despachada
              </span>
            </div>
          </div>

          {/* Quick Navigators to see what happens next */}
          <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 space-y-2.5">
            <h4 className="text-xs font-extrabold text-sky-950 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Siguientes pasos en el flujo de la aplicación:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                id="btn-go-admin-from-gmail-modal"
                type="button"
                onClick={onGoToAdmin}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all text-left"
              >
                <Inbox className="w-4 h-4 shrink-0" />
                <span>1. Ir a Pantalla 2 (Admin: Cambiar Valor y Enviar)</span>
              </button>

              <button
                id="btn-view-client-screen-from-gmail-modal"
                type="button"
                onClick={onViewClientScreen}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all text-left"
              >
                <Building className="w-4 h-4 shrink-0 text-sky-400" />
                <span>2. Ver Pantalla que recibe el Usuario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
