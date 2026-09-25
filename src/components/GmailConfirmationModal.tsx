import React, { useState } from 'react';
import {
  X,
  Mail,
  ExternalLink,
  CheckCircle2,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Building,
  Sparkles,
  Copy,
  Check,
  FileText,
  Send,
  Eye
} from 'lucide-react';
import { QuoteRequest } from '../types';
import {
  COMPANY_NOTIFICATION_EMAIL,
  generateFormattedQuoteEmailText,
  generateFormattedQuoteSubject,
  buildGmailComposeUrl
} from '../services/emailFormatter';

interface GmailConfirmationModalProps {
  quote: QuoteRequest;
  onClose: () => void;
  onGoToAdmin?: () => void;
  onViewClientScreen?: () => void;
}

export const GmailConfirmationModal: React.FC<GmailConfirmationModalProps> = ({
  quote,
  onClose,
  onGoToAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'destinations' | 'formatted_preview'>('destinations');
  const [previewRecipient, setPreviewRecipient] = useState<'client' | 'company'>('client');
  const [copiedText, setCopiedText] = useState(false);

  // Subject and formatted body
  const companySubject = generateFormattedQuoteSubject(quote, 'company');
  const companyBody = generateFormattedQuoteEmailText(quote, 'company');

  const clientSubject = generateFormattedQuoteSubject(quote, 'client');
  const clientBody = generateFormattedQuoteEmailText(quote, 'client');

  const displayedPreviewText = previewRecipient === 'client' ? clientBody : companyBody;

  // Direct Gmail web links
  const companyGmailUrl = buildGmailComposeUrl(
    COMPANY_NOTIFICATION_EMAIL,
    companySubject,
    companyBody
  );

  const clientGmailUrl = buildGmailComposeUrl(
    quote.clientEmail,
    clientSubject,
    clientBody
  );

  const dualGmailUrl = buildGmailComposeUrl(
    COMPANY_NOTIFICATION_EMAIL,
    companySubject,
    companyBody,
    quote.clientEmail
  );

  const handleCopyFormattedText = () => {
    navigator.clipboard.writeText(displayedPreviewText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div
      id="modal-gmail-confirmation-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="modal-gmail-confirmation-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col animate-scale-up"
      >
        {/* Gmail Style Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 text-white px-6 py-5 flex items-center justify-between border-b border-sky-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-sky-500/20">
              <Send className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white tracking-tight">
                  Actividad Enviar Ejecutada &bull; Aviso al Cliente
                </span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                  CLIENTE AVISADO (SIN PRECIO)
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Folio <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-sm">{quote.folio}</span> &bull; Solicitud enviada a <strong className="text-white">rcv.informacion@gmail.com</strong> y aviso de cotización a <strong className="text-white">{quote.clientEmail}</strong>
              </p>
            </div>
          </div>

          <button
            id="btn-close-gmail-modal"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-slate-100 px-6 pt-3 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('destinations')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-t-2 cursor-pointer ${
                activeTab === 'destinations'
                  ? 'bg-white text-slate-900 border-sky-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 border-transparent'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span>1. Registro de Despacho (2 Destinatarios)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('formatted_preview')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-t-2 cursor-pointer ${
                activeTab === 'formatted_preview'
                  ? 'bg-white text-slate-900 border-sky-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 border-transparent'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>2. Vista Previa del Aviso (Sin Precio)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyFormattedText}
            className="text-xs font-bold text-slate-600 hover:text-sky-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer mb-2"
            title="Copiar contenido formateado"
          >
            {copiedText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 bg-slate-50 max-h-[72vh] overflow-y-auto">
          {activeTab === 'destinations' && (
            <div className="space-y-4">
              {/* Delivery notification banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-emerald-900">
                    ¡Actividad "Enviar" Ejecutada con Éxito!
                  </p>
                  <p className="text-emerald-800 leading-relaxed">
                    Se avisó formalmente al cliente a su correo que <strong>está cotizando</strong> sin incluir precio (pendiente de evaluación técnica), y se remitió la solicitud con todas las medidas al correo central de la empresa.
                  </p>
                </div>
              </div>

              {/* DUAL DESTINATION CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Destinatario Empresa */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-red-200 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                    CENTRAL EMPRESA
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Recepción Central Empresa
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {COMPANY_NOTIFICATION_EMAIL}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                    <p className="text-slate-500">
                      <strong>Asunto:</strong>
                    </p>
                    <p className="font-semibold text-slate-800 text-[11px] truncate">
                      {companySubject}
                    </p>
                    <p className="text-slate-500 text-[11px] pt-1">
                      <strong>Estado:</strong> Sin precio asignado. Requiere que Administración ingrese a Recepción (Admin) para fijar el presupuesto.
                    </p>
                  </div>

                  <a
                    href={companyGmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir en Gmail ({COMPANY_NOTIFICATION_EMAIL})</span>
                  </a>
                </div>

                {/* 2. Destinatario Cliente */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-sky-200 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-sky-700 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                    AVISO AL CLIENTE
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                        Aviso: Cliente está Cotizando
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {quote.clientEmail}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1 text-xs">
                    <p className="text-slate-500">
                      <strong>Asunto:</strong>
                    </p>
                    <p className="font-semibold text-slate-800 text-[11px] truncate">
                      {clientSubject}
                    </p>
                    <p className="text-slate-500 text-[11px] pt-1">
                      <strong>Aviso:</strong> Se notifica al cliente que está cotizando formalmente. <em>No se incluye precio previo.</em>
                    </p>
                  </div>

                  <a
                    href={clientGmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir en Gmail ({quote.clientEmail})</span>
                  </a>
                </div>
              </div>

              {/* Combined Fast Action */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Envío Directo desde Gmail Web
                  </h5>
                  <p className="text-slate-500 mt-0.5">
                    Abre el correo pre-cargado con <strong>Para: rcv.informacion@gmail.com</strong> y <strong>CC: {quote.clientEmail}</strong> sin precio.
                  </p>
                </div>

                <a
                  href={dualGmailUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 whitespace-nowrap shadow-xs cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Abrir Ambos en Gmail Web</span>
                </a>
              </div>

              {/* Summary metadata strip */}
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Ventanas</span>
                  <span className="font-bold text-slate-800">{quote.windows.length} unidad(es)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Superficie Total</span>
                  <span className="font-bold text-slate-800">{quote.totalAreaM2.toFixed(2)} m²</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Precio Cliente</span>
                  <span className="font-bold text-amber-700">Sin Precio (Cotizando)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Garantía</span>
                  <span className="font-bold text-sky-800">2 a 3 Años</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'formatted_preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Estructura Formateada Oficial
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Observa el texto exacto generado. Al cliente solo se le avisa que está cotizando, sin incluir precios.
                  </p>
                </div>

                {/* Sub-selector for Client vs Company preview */}
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewRecipient('client')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewRecipient === 'client'
                        ? 'bg-white text-sky-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Aviso al Cliente (Sin Precio)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewRecipient('company')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewRecipient === 'company'
                        ? 'bg-white text-red-800 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Central Empresa (rcv.informacion@gmail.com)
                  </button>
                </div>
              </div>

              {/* Formatted Text Box */}
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 font-mono text-[11px] sm:text-xs leading-relaxed border border-slate-800 shadow-inner overflow-x-auto whitespace-pre selection:bg-sky-500 selection:text-white">
                {displayedPreviewText}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Respaldado y sincronizado con base de datos en tiempo real.</span>
          </div>

          <div className="flex items-center gap-2.5">
            {onGoToAdmin && (
              <button
                type="button"
                onClick={onGoToAdmin}
                className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Inbox className="w-3.5 h-3.5 text-sky-600" />
                <span>Ver en Pantalla 3 (Admin)</span>
              </button>
            )}

            <button
              id="btn-close-gmail-confirmation"
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
