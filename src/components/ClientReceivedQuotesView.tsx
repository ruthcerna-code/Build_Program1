import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Printer,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Check,
  Award,
  Sparkles,
  Info,
  Eye,
  ArrowRight
} from 'lucide-react';
import { QuoteRequest, UserAccount } from '../types';
import { formatCurrency } from '../services/quoteStorage';

interface ClientReceivedQuotesViewProps {
  quotes: QuoteRequest[];
  onAcceptQuote: (quoteId: string) => void;
  onNavigateToApproved?: () => void;
  currentUser?: UserAccount | null;
  onOpenLogin?: () => void;
}

export const ClientReceivedQuotesView: React.FC<ClientReceivedQuotesViewProps> = ({
  quotes,
  onAcceptQuote,
  onNavigateToApproved,
  currentUser,
  onOpenLogin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(() => {
    if (currentUser && currentUser.role === 'cliente' && currentUser.email) {
      return currentUser.email;
    }
    return 'all';
  });
  const [activeConsultationQuote, setActiveConsultationQuote] = useState<QuoteRequest | null>(null);
  const [acceptedSuccessMessage, setAcceptedSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role === 'cliente' && currentUser.email) {
      setSelectedClientFilter(currentUser.email);
    }
  }, [currentUser]);

  // Filter quotes that have been processed/sent (have adminQuote or status !== 'pendiente')
  const receivedQuotes = quotes.filter(
    (q) => q.adminQuote !== undefined || q.status === 'cotizada' || q.status === 'aceptada'
  );

  // Distinct clients list for filtering
  const clientEmails = Array.from(new Set(receivedQuotes.map((q) => q.clientEmail)));

  const filteredQuotes = receivedQuotes.filter((q) => {
    const matchesSearch =
      q.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientCity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient =
      selectedClientFilter === 'all' || q.clientEmail === selectedClientFilter;

    return matchesSearch && matchesClient;
  });

  const handleOpenConsultation = (quote: QuoteRequest) => {
    setActiveConsultationQuote(quote);
    setAcceptedSuccessMessage(null);
  };

  const handleApprove = (quoteId: string) => {
    onAcceptQuote(quoteId);
    setAcceptedSuccessMessage('¡Has aprobado esta cotización con éxito! Tu solicitud ha sido derivada a la pantalla de Cotizaciones Aprobadas para la asignación del instalador.');
    // Update active quote in local state
    if (activeConsultationQuote && activeConsultationQuote.id === quoteId) {
      setActiveConsultationQuote({
        ...activeConsultationQuote,
        status: 'aceptada',
      });
    }
  };

  return (
    <div id="view-client-received-quotes" className="space-y-8 pb-16 animate-fade-in">
      {/* Top Banner Notice: Vista de Consulta no modificable */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>VISTA DE CONSULTA (SOLO LECTURA)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cotizaciones Recibidas por el Cliente
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Registro histórico de presupuestos enviados formalmente a los clientes. Esta es una vista de consulta informativa protegida contra modificaciones directas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 text-right">
              <span className="text-xs text-slate-500 block font-medium">Cotizaciones Recibidas</span>
              <span className="text-xl font-black text-sky-700">{receivedQuotes.length}</span>
            </div>
          </div>
        </div>

        {/* Read-only reminder alert */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Vista de Consulta No Modificable:</strong> Los valores, medidas y fechas mostrados representan el presupuesto formal enviado al cliente. Para alterar precios o márgenes, el administrador debe hacerlo desde la pantalla de Recepción.
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-received-quotes"
              type="text"
              placeholder="Buscar por folio, cliente, correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 bg-white text-slate-800 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Client Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Filtrar cliente:</span>
            <button
              type="button"
              onClick={() => setSelectedClientFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedClientFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({receivedQuotes.length})
            </button>
            {clientEmails.map((email) => (
              <button
                key={email}
                type="button"
                onClick={() => setSelectedClientFilter(email)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedClientFilter === email
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                }`}
              >
                {email}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIST OF RECEIVED QUOTES */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              No hay cotizaciones enviadas aún
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cuando envíes una cotización al cliente desde la pantalla de Recepción (Admin), aparecerá automáticamente listada en esta vista de consulta.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuotes.map((quote) => {
            const adminQuote = quote.adminQuote;
            const isAccepted = quote.status === 'aceptada';
            const confirmedDate =
              adminQuote?.confirmedInstallationDate || quote.tentativeDate1;
            const confirmedTime =
              adminQuote?.confirmedInstallationTime || quote.tentativeTime1;

            return (
              <div
                key={quote.id}
                id={`received-quote-card-${quote.id}`}
                className={`bg-white rounded-3xl p-6 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-5 ${
                  isAccepted
                    ? 'border-emerald-200 ring-1 ring-emerald-300/40'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="space-y-4">
                  {/* Top line with Folio and Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                      {quote.folio}
                    </span>

                    {isAccepted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Aprobada por Cliente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                        <Mail className="w-3 h-3 text-sky-600" />
                        Cotización Recibida
                      </span>
                    )}
                  </div>

                  {/* Client Info */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {quote.clientName}
                    </h3>
                    <p className="text-xs text-slate-500">{quote.clientEmail}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{quote.clientAddress}, {quote.clientCity}</span>
                    </p>
                  </div>

                  {/* Windows and Area info */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Ventanas</span>
                      <strong className="text-slate-800">{quote.windows.length} unidad(es)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Superficie Total</span>
                      <strong className="text-slate-800">{quote.totalAreaM2} m² de malla</strong>
                    </div>
                  </div>

                  {/* Confirmed / Proposed Schedule */}
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>Instalación Programada:</span>
                    </div>
                    <div className="text-slate-800 font-semibold">
                      📅 {confirmedDate || 'Por coordinar'} &bull; ⏰ {confirmedTime || '10:00'} hrs
                    </div>
                  </div>

                  {/* Financial Total */}
                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-500">Total Cotizado:</span>
                    <span className="text-xl font-black text-slate-900">
                      {adminQuote ? formatCurrency(adminQuote.total) : 'En revisión'}
                    </span>
                  </div>
                </div>

                {/* Consultation button */}
                <button
                  id={`btn-consult-quote-${quote.id}`}
                  type="button"
                  onClick={() => handleOpenConsultation(quote)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>Consultar Presupuesto Formal</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* READ-ONLY CONSULTATION MODAL */}
      {activeConsultationQuote && (
        <div
          id="modal-consultation-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in"
        >
          <div
            id="modal-consultation-container"
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    Consulta de Cotización Oficial #{activeConsultationQuote.folio}
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                      SOLO CONSULTA
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Documento formal emitido para {activeConsultationQuote.clientName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveConsultationQuote(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Success toast if accepted */}
            {acceptedSuccessMessage && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-xs text-emerald-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{acceptedSuccessMessage}</span>
                </div>
                {onNavigateToApproved && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConsultationQuote(null);
                      onNavigateToApproved();
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-500 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>Ir a Aprobadas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Modal Body - Consultation Read Only */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Client & Installation summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cliente / Receptor
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {activeConsultationQuote.clientName}
                  </p>
                  <p className="text-slate-600">{activeConsultationQuote.clientEmail}</p>
                  <p className="text-slate-600">{activeConsultationQuote.clientPhone}</p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Lugar de Instalación
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {activeConsultationQuote.clientAddress}
                  </p>
                  <p className="text-slate-600">{activeConsultationQuote.clientCity}</p>
                  <p className="text-slate-500 capitalize">Inmueble: {activeConsultationQuote.propertyType}</p>
                </div>
              </div>

              {/* Proposed & Confirmed Schedule */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>Coordinación de Fecha y Hora para Instalación</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <span className="text-[11px] text-slate-500 block">Horario Acordado / Propuesto:</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      📅 {activeConsultationQuote.adminQuote?.confirmedInstallationDate || activeConsultationQuote.tentativeDate1 || 'A coordinar'}
                    </p>
                    <p className="text-slate-700 font-semibold">
                      ⏰ {activeConsultationQuote.adminQuote?.confirmedInstallationTime || activeConsultationQuote.tentativeTime1 || '10:00'} hrs
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <span className="text-[11px] text-slate-500 block">Fechas Tentativas Solicitadas:</span>
                    <p className="text-slate-700 mt-0.5">
                      1. {activeConsultationQuote.tentativeDate1 || 'Sin fecha'} a las {activeConsultationQuote.tentativeTime1 || '10:00'}
                    </p>
                    <p className="text-slate-700">
                      2. {activeConsultationQuote.tentativeDate2 || 'Sin fecha'} a las {activeConsultationQuote.tentativeTime2 || '15:00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Windows list */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Detalle de Ventanas y Malla ({activeConsultationQuote.windows.length} unidades &bull; {activeConsultationQuote.totalAreaM2} m²)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Ubicación</th>
                        <th className="py-2.5 px-3">Dimensiones</th>
                        <th className="py-2.5 px-3">Superficie</th>
                        <th className="py-2.5 px-3">Tipo de Malla</th>
                        <th className="py-2.5 px-3">Notas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeConsultationQuote.windows.map((w, idx) => (
                        <tr key={w.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{w.name}</td>
                          <td className="py-2.5 px-3 font-mono">{w.height}m &times; {w.width}m</td>
                          <td className="py-2.5 px-3 font-bold text-sky-700">{w.area} m²</td>
                          <td className="py-2.5 px-3 capitalize">{w.meshType}</td>
                          <td className="py-2.5 px-3 text-slate-500">{w.notes || 'Estándar'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial breakdown */}
              {activeConsultationQuote.adminQuote && (
                <div className="bg-sky-50/70 p-5 rounded-2xl border border-sky-200 space-y-2">
                  <div className="flex justify-between pb-1 border-b border-sky-100">
                    <span>Malla de seguridad ({activeConsultationQuote.totalAreaM2} m²):</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(activeConsultationQuote.adminQuote.meshTotalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-sky-100">
                    <span>Perfiles de aluminio y fijaciones:</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(activeConsultationQuote.adminQuote.profilesAndFixingsCost)}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-sky-100">
                    <span>Mano de obra e instalación:</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(activeConsultationQuote.adminQuote.laborAndInstallCost)}
                    </span>
                  </div>
                  {activeConsultationQuote.adminQuote.discountAmount > 0 && (
                    <div className="flex justify-between pb-1 border-b border-sky-100 text-emerald-700 font-semibold">
                      <span>Descuento aplicado:</span>
                      <span>-{formatCurrency(activeConsultationQuote.adminQuote.discountAmount)}</span>
                    </div>
                  )}
                  {activeConsultationQuote.adminQuote.includeTax && (
                    <div className="flex justify-between pb-1 border-b border-sky-100 text-slate-500">
                      <span>IVA (19%):</span>
                      <span>{formatCurrency(activeConsultationQuote.adminQuote.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 text-base font-black text-slate-900">
                    <span>VALOR TOTAL PRESUPUESTADO:</span>
                    <span className="text-xl text-sky-800">
                      {formatCurrency(activeConsultationQuote.adminQuote.total)}
                    </span>
                  </div>
                </div>
              )}

              {/* Warranty and Conditions */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Garantía por Escrito: {activeConsultationQuote.adminQuote?.warrantyYears || 2} Años
                </p>
                <p>
                  <strong>Tiempo estimado de faena:</strong> {activeConsultationQuote.adminQuote?.estimatedTime || '2 a 3 horas'}
                </p>
                {activeConsultationQuote.adminQuote?.adminNotes && (
                  <p className="italic text-slate-700 mt-1">
                    &ldquo;{activeConsultationQuote.adminQuote.adminNotes}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-white border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Documento consultado en modo solo lectura</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {activeConsultationQuote.status !== 'aceptada' && (
                  <button
                    id="btn-approve-quote-from-consultation"
                    type="button"
                    onClick={() => handleApprove(activeConsultationQuote.id)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Aprobar Cotización</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveConsultationQuote(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
