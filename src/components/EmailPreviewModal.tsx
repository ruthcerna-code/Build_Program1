import React from 'react';
import {
  X,
  Mail,
  Printer,
  ExternalLink,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Building,
  Phone,
  Send
} from 'lucide-react';
import { QuoteRequest } from '../types';
import { formatCurrency } from '../services/quoteStorage';

interface EmailPreviewModalProps {
  quote: QuoteRequest;
  onClose: () => void;
  onViewClientScreen?: () => void;
  onViewReceivedList?: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  quote,
  onClose,
  onViewClientScreen,
  onViewReceivedList,
}) => {
  const adminQuote = quote.adminQuote;
  if (!adminQuote) return null;

  const sentDate = adminQuote.sentAt
    ? new Date(adminQuote.sentAt).toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('es-CL');

  // Prepare mailto link
  const emailSubject = encodeURIComponent(
    `Cotización Oficial de Mallas de Seguridad ${quote.folio} - MallasSeguras`
  );
  const emailBodyText = encodeURIComponent(
`Estimado/a ${quote.clientName},

Adjuntamos el presupuesto formal para la instalación de mallas de seguridad en su propiedad ubicada en ${quote.clientAddress}, ${quote.clientCity}.

DETALLE DE VENTANAS (${quote.windows.length} unidades, total ${quote.totalAreaM2} m²):
${quote.windows
  .map(
    (w, i) =>
      `- Ventana #${i + 1} (${w.name}): ${w.height}m alto x ${w.width}m ancho (${w.area} m²) - Tipo: ${w.meshType}`
  )
  .join('\n')}

RESUMEN DE VALORES:
- Malla y anclajes: ${formatCurrency(adminQuote.meshTotalCost)}
- Perfiles de aluminio y fijaciones: ${formatCurrency(adminQuote.profilesAndFixingsCost)}
- Mano de obra e instalación: ${formatCurrency(adminQuote.laborAndInstallCost)}
${adminQuote.discountAmount > 0 ? `- Descuento (${adminQuote.discountPercentage}%): -${formatCurrency(adminQuote.discountAmount)}\n` : ''}
VALOR TOTAL DE LA COTIZACIÓN: ${formatCurrency(adminQuote.total)}

CONDICIONES:
- Garantía por escrito: ${adminQuote.warrantyYears} años.
- Tiempo estimado de instalación: ${adminQuote.estimatedTime}.
- Observaciones: ${adminQuote.adminNotes || 'Instalación limpia en seco sin dañar marcos existentes.'}

Para agendar la visita o confirmar este presupuesto, responda a este correo o escríbanos al WhatsApp +56 9 8000 2400.

Atentamente,
Equipo Técnico MallasSeguras
www.mallas-seguras.cl`
  );

  const mailtoUrl = `mailto:${quote.clientEmail}?cc=rcv.informacion@gmail.com&subject=${emailSubject}&body=${emailBodyText}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(quote.clientEmail)}&cc=rcv.informacion@gmail.com&su=${emailSubject}&body=${emailBodyText}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="modal-email-preview-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div
        id="modal-email-preview-container"
        className="bg-slate-100 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden my-auto"
      >
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Vista Informativa para el Administrador &bull; Correo Enviado al Cliente
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.2 rounded-full">
                  ENVIADO
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Así visualiza el cliente ({quote.clientEmail}) el presupuesto formal en su bandeja de entrada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-quote-email"
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center gap-1.5"
              title="Imprimir o exportar PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              id="btn-close-email-preview"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative notice for administrator */}
        <div className="bg-sky-50 border-b border-sky-200 px-6 py-2.5 flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Vista Informativa:</strong> Como administrador, aquí revisas la cotización oficial despachada a <strong>{quote.clientEmail}</strong> con las condiciones técnicas pactadas.
            </span>
          </div>
        </div>

        {/* Email Header Simulation */}
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 space-y-1.5 text-xs text-slate-600 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">De:</span>{' '}
              <strong className="text-slate-800">
                MallasSeguras &lt;cotizaciones@mallas-seguras.cl&gt;
              </strong>
            </div>
            <span className="text-slate-400">{sentDate}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Para:</span>{' '}
            <strong className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              {quote.clientName} &lt;{quote.clientEmail}&gt;
            </strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Copia (CC Central):</span>{' '}
            <strong className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
              rcv.informacion@gmail.com
            </strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Asunto:</span>{' '}
            <span className="font-bold text-slate-900">
              Cotización Formal Mallas de Seguridad #{quote.folio} - MallasSeguras
            </span>
          </div>
        </div>

        {/* Email Body Canvas */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-slate-50 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            {/* Corporate Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Mallas<span className="text-sky-600">Seguras</span>
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Presupuesto Oficial de Instalación
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs">
                <span className="inline-block px-3 py-1 rounded-md bg-sky-100 text-sky-800 font-mono font-bold text-sm">
                  {quote.folio}
                </span>
                <p className="text-slate-500 mt-1 font-medium">Fecha: {sentDate}</p>
              </div>
            </div>

            {/* Greeting */}
            <div className="space-y-2 text-slate-700 text-sm leading-relaxed">
              <p className="font-semibold text-slate-900">
                Estimado/a {quote.clientName},
              </p>
              <p>
                Agradecemos tu solicitud de presupuesto. Hemos evaluado las medidas y especificaciones 
                de tus ventanas para tu propiedad en{' '}
                <strong className="text-slate-800">{quote.clientAddress}, {quote.clientCity}</strong>.
              </p>
              <p>
                A continuación detallamos el presupuesto oficial, los materiales de alta resistencia a utilizar y las condiciones de garantía:
              </p>
            </div>

            {/* Itemized Windows Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detalle de Ventanas Cotizadas ({quote.windows.length} unidades &bull; Total {quote.totalAreaM2} m²)
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Ubicación / Nombre</th>
                      <th className="py-2.5 px-3">Alto x Ancho</th>
                      <th className="py-2.5 px-3">Superficie</th>
                      <th className="py-2.5 px-3">Tipo de Red</th>
                      <th className="py-2.5 px-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quote.windows.map((w, idx) => (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{w.name}</td>
                        <td className="py-2.5 px-3 font-mono">
                          {w.height}m &times; {w.width}m
                        </td>
                        <td className="py-2.5 px-3 font-bold text-sky-700">{w.area} m²</td>
                        <td className="py-2.5 px-3">
                          <span className="capitalize text-slate-800 font-medium">
                            {w.meshType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {w.notes || 'Estándar'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
                <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Condiciones Técnicas y Garantía
                </p>
                <p>
                  <strong>Garantía Oficial:</strong> {adminQuote.warrantyYears} años por escrito contra cortes, fallas de fábrica y tensión.
                </p>
                <p>
                  <strong>Tiempo estimado de faena:</strong> {adminQuote.estimatedTime}.
                </p>
                <p>
                  <strong>Resistencia:</strong> 180 kg/m² con filtro UV y nudos termosellados antideshilache.
                </p>
                {adminQuote.adminNotes && (
                  <div className="pt-2 mt-2 border-t border-slate-200 text-slate-700 italic">
                    &ldquo;{adminQuote.adminNotes}&rdquo;
                  </div>
                )}
              </div>

              {/* Price Calculation Box */}
              <div className="bg-sky-50/70 p-5 rounded-xl border border-sky-200 space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between pb-1 border-b border-sky-100">
                  <span>Malla de seguridad ({quote.totalAreaM2} m²):</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(adminQuote.meshTotalCost)}
                  </span>
                </div>
                <div className="flex justify-between pb-1 border-b border-sky-100">
                  <span>Perfiles de aluminio y fijaciones:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(adminQuote.profilesAndFixingsCost)}
                  </span>
                </div>
                <div className="flex justify-between pb-1 border-b border-sky-100">
                  <span>Mano de obra e instalación:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(adminQuote.laborAndInstallCost)}
                  </span>
                </div>

                {adminQuote.discountAmount > 0 && (
                  <div className="flex justify-between pb-1 border-b border-sky-100 text-emerald-700 font-medium">
                    <span>Descuento aplicado ({adminQuote.discountPercentage}%):</span>
                    <span>-{formatCurrency(adminQuote.discountAmount)}</span>
                  </div>
                )}

                {adminQuote.includeTax && (
                  <div className="flex justify-between pb-1 border-b border-sky-100 text-slate-500">
                    <span>IVA (19%):</span>
                    <span>{formatCurrency(adminQuote.taxAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-base font-extrabold text-slate-900">
                  <span>VALOR TOTAL:</span>
                  <span className="text-xl text-sky-700 font-black">
                    {formatCurrency(adminQuote.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions simulated in email */}
            <div className="p-4 rounded-xl bg-slate-900 text-white text-center space-y-2">
              <p className="font-bold text-sm">
                ¿Deseas confirmar la fecha de instalación?
              </p>
              <p className="text-xs text-slate-300">
                Escríbenos directamente o responde a este correo para coordinar día y horario:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-slate-950 px-4 py-2 rounded-lg font-bold text-xs">
                  <Phone className="w-3.5 h-3.5" /> WhatsApp Directo: +56 9 8000 2400
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-200 px-4 py-2 rounded-lg font-medium text-xs border border-slate-700">
                  <Mail className="w-3.5 h-3.5 text-sky-400" /> cotizaciones@mallas-seguras.cl
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Notificación registrada para {quote.clientEmail}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onViewReceivedList && (
              <button
                id="btn-view-received-list-from-email"
                type="button"
                onClick={() => {
                  onClose();
                  onViewReceivedList();
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ver en Cotizaciones Recibidas (Consulta)</span>
              </button>
            )}

            {onViewClientScreen && !onViewReceivedList && (
              <button
                id="btn-view-client-screen-from-email"
                type="button"
                onClick={() => {
                  onClose();
                  onViewClientScreen();
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Visualizar Pantalla del Usuario</span>
              </button>
            )}

            <a
              id="link-open-mailto"
              href={gmailUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en Gmail Web (con CC rcv.informacion@gmail.com)</span>
            </a>

            <button
              id="btn-close-email-modal-footer"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
