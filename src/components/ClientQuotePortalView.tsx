import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Printer,
  Calendar,
  Layers,
  Building,
  Check,
  Award,
  Clock,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Share2
} from 'lucide-react';
import { QuoteRequest } from '../types';
import { formatCurrency } from '../services/quoteStorage';

interface ClientQuotePortalViewProps {
  quote?: QuoteRequest | null;
  allQuotes?: QuoteRequest[];
  onSelectQuote?: (quote: QuoteRequest) => void;
  onBackToAdmin?: () => void;
  onGoToRequestQuote?: () => void;
  onChangeValue?: (quote: QuoteRequest) => void;
  onAcceptQuote?: (quoteId: string) => void;
  isAdminViewing?: boolean;
}

export const ClientQuotePortalView: React.FC<ClientQuotePortalViewProps> = ({
  quote,
  allQuotes = [],
  onSelectQuote,
  onBackToAdmin,
  onGoToRequestQuote,
  onChangeValue,
  onAcceptQuote,
  isAdminViewing = true,
}) => {
  if (!quote) {
    return (
      <div id="view-client-quote-empty" className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto border border-sky-200">
          <ShieldCheck className="w-9 h-9 stroke-[2]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">
            Pantalla que Recibe el Usuario
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Aún no has seleccionado o creado ninguna cotización para visualizar. Solicita una cotización o revísala desde la recepción del administrador.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onGoToRequestQuote && (
            <button
              type="button"
              onClick={onGoToRequestQuote}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-xs"
            >
              1. Ir a Pedir Cotización (Cliente)
            </button>
          )}

          {onBackToAdmin && (
            <button
              type="button"
              onClick={onBackToAdmin}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              2. Ir a Recepción de Cotizaciones (Admin)
            </button>
          )}
        </div>
      </div>
    );
  }

  const adminQuote = quote.adminQuote;
  const isAccepted = quote.status === 'aceptada';
  const [acceptedState, setAcceptedState] = useState(isAccepted);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleAccept = () => {
    setAcceptedState(true);
    setShowCelebration(true);
    if (onAcceptQuote) {
      onAcceptQuote(quote.id);
    }
  };

  const formattedDate = new Date(quote.createdAt).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sentDate = adminQuote?.sentAt
    ? new Date(adminQuote.sentAt).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : formattedDate;

  // WhatsApp response link
  const whatsappUrl = `https://wa.me/56980002400?text=${encodeURIComponent(
    `Hola MallasSeguras, soy ${quote.clientName}. Recibí la cotización ${quote.folio} por ${
      adminQuote ? formatCurrency(adminQuote.total) : 'el presupuesto'
    } y deseo coordinar la instalación.`
  )}`;

  return (
    <div id="view-client-quote-portal" className="space-y-6 pb-16">
      {/* Top Bar for admin view controls and quote selector */}
      <div
        id="banner-admin-preview-mode"
        className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4 shadow-md border border-slate-800"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sky-400 uppercase tracking-wide">
              Pantalla que recibe el Usuario:
            </span>
          </div>

          {/* Quote selector if multiple exist */}
          {allQuotes.length > 1 && onSelectQuote && (
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
              <span className="text-slate-400 font-medium">Ver cotización:</span>
              <select
                value={quote.id}
                onChange={(e) => {
                  const target = allQuotes.find((q) => q.id === e.target.value);
                  if (target) onSelectQuote(target);
                }}
                className="bg-slate-900 text-white text-xs font-bold rounded-md px-2 py-0.5 border border-slate-600 outline-none"
              >
                {allQuotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.folio} &bull; {q.clientName} (
                    {q.adminQuote ? formatCurrency(q.adminQuote.total) : 'Pendiente'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {onChangeValue && (
            <button
              id="btn-portal-change-value"
              type="button"
              onClick={() => onChangeValue(quote)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs"
              title="Cambiar el valor de la cotización y re-enviar"
            >
              <span>✏️ Cambiar Valor</span>
            </button>
          )}

          {onBackToAdmin && (
            <button
              id="btn-return-admin-from-client-view"
              type="button"
              onClick={onBackToAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Recepción (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Quotation Document Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Header of the quote */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Mallas<span className="text-sky-600">Seguras</span>
                </span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  Presupuesto Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Solución certificada para ventanas, balcones y terrazas
              </p>
            </div>
          </div>

          <div className="text-left md:text-right space-y-1">
            <div className="inline-block font-mono text-sm font-black bg-sky-50 text-sky-800 px-3.5 py-1 rounded-xl border border-sky-200">
              {quote.folio}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Emitida el: <strong className="text-slate-800">{sentDate}</strong>
            </p>
          </div>
        </div>

        {/* Accepted celebration message if approved */}
        {acceptedState && (
          <div
            id="banner-quote-accepted-status"
            className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-emerald-900">
                  ¡Cotización Aceptada por el Cliente!
                </h4>
                <p className="text-xs text-emerald-800">
                  Nuestro equipo técnico ha agendado la solicitud y se comunicará contigo para confirmar el horario de instalación.
                </p>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Coordinar día por WhatsApp</span>
            </a>
          </div>
        )}

        {/* Client & Installation Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">
              Cliente Titular
            </span>
            <span className="font-bold text-slate-900 text-sm">{quote.clientName}</span>
            <span className="text-slate-500 block capitalize">{quote.propertyType}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">
              Correo de Notificación
            </span>
            <span className="font-bold text-sky-700 text-sm break-all">{quote.clientEmail}</span>
            <span className="text-slate-500 block">Tel: {quote.clientPhone}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">
              Lugar de Instalación
            </span>
            <span className="font-semibold text-slate-900 text-sm">{quote.clientCity}</span>
            <span className="text-slate-500 block">{quote.clientAddress}</span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">
              Estado del Presupuesto
            </span>
            <span
              className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-xs mt-0.5 ${
                acceptedState
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              {acceptedState ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Presupuesto Aceptado
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  Listo para tu Confirmación
                </>
              )}
            </span>
          </div>
        </div>

        {/* DETALLE DE VENTANAS A INSTALAR */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              Detalle de las Ventanas Cotizadas ({quote.windows.length} unidades &bull; {quote.totalAreaM2} m²)
            </h3>
            <span className="text-xs text-slate-500">Mallas de nylon 180 kg/m²</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Ubicación / Ventana</th>
                  <th className="py-3 px-4">Dimensiones (Alto &times; Ancho)</th>
                  <th className="py-3 px-4">Superficie</th>
                  <th className="py-3 px-4">Tipo de Red</th>
                  <th className="py-3 px-4">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {quote.windows.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{w.name}</td>
                    <td className="py-3 px-4 font-mono font-semibold">
                      {w.height}m &times; {w.width}m
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-700">{w.area} m²</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold capitalize">{w.meshType}</span>
                      <span className="text-[11px] text-slate-500 block">
                        {w.meshType === 'monofilamento'
                          ? '0.70mm Invisible'
                          : '0.80mm Reforzado'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {w.notes || 'Instalación estándar perimetral'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VALOR DE LA COTIZACIÓN & CONDICIONES */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Warranty & Installation terms */}
          <div className="md:col-span-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-700">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Garantía y Condiciones del Servicio
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Garantía Oficial por Escrito:</strong> {adminQuote?.warrantyYears || 2} años contra rotura, defectos de fabricación o pérdida de tensión.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tiempo estimado de faena:</strong> {adminQuote?.estimatedTime || '2 a 3 horas'} en la fecha que tú elijas.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Materiales certificados:</strong> Resistencia de 180 kg/m², nudos termosellados antideshilache y perfiles de aluminio anticorrosión.
                </span>
              </div>
            </div>

            {adminQuote?.adminNotes && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-slate-600 italic">
                &ldquo;{adminQuote.adminNotes}&rdquo;
              </div>
            )}
          </div>

          {/* Value Box */}
          <div className="md:col-span-6 bg-sky-50/70 p-6 rounded-2xl border border-sky-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2 text-xs text-slate-700">
              <span className="text-xs font-bold text-sky-900 uppercase tracking-wider block">
                Resumen Económico
              </span>

              {adminQuote && (
                <>
                  <div className="flex justify-between pb-1 border-b border-sky-100">
                    <span>Malla de seguridad ({quote.totalAreaM2} m²):</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(adminQuote.meshTotalCost)}
                    </span>
                  </div>

                  {adminQuote.profilesAndFixingsCost > 0 && (
                    <div className="flex justify-between pb-1 border-b border-sky-100">
                      <span>Perfiles de aluminio y anclajes:</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(adminQuote.profilesAndFixingsCost)}
                      </span>
                    </div>
                  )}

                  {adminQuote.laborAndInstallCost > 0 && (
                    <div className="flex justify-between pb-1 border-b border-sky-100">
                      <span>Instalación técnica en terreno:</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(adminQuote.laborAndInstallCost)}
                      </span>
                    </div>
                  )}

                  {adminQuote.discountAmount > 0 && (
                    <div className="flex justify-between pb-1 border-b border-sky-100 text-emerald-700 font-semibold">
                      <span>Descuento aplicado ({adminQuote.discountPercentage}%):</span>
                      <span>-{formatCurrency(adminQuote.discountAmount)}</span>
                    </div>
                  )}

                  {adminQuote.includeTax && (
                    <div className="flex justify-between pb-1 border-b border-sky-100 text-slate-500">
                      <span>IVA incluido (19%):</span>
                      <span>{formatCurrency(adminQuote.taxAmount)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Total Highlight */}
            <div className="pt-3 border-t border-sky-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block uppercase">
                  VALOR TOTAL A PAGAR:
                </span>
                <span className="text-2xl sm:text-3xl font-black text-sky-700">
                  {adminQuote ? formatCurrency(adminQuote.total) : 'En revisión'}
                </span>
              </div>

              {!acceptedState ? (
                <button
                  id="btn-client-accept-quote"
                  type="button"
                  onClick={handleAccept}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                >
                  Aceptar Cotización
                </button>
              ) : (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300">
                  Aceptada &bull; En Coordinación
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action bar for user */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              id="btn-print-client-quote"
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>

            <a
              id="btn-whatsapp-chat-client"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Preguntar por WhatsApp</span>
            </a>
          </div>

          <div className="text-xs text-slate-400">
            Folio de seguimiento: <strong className="text-slate-600">{quote.folio}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
