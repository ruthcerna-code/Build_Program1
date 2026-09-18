import React, { useState } from 'react';
import {
  Inbox,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Mail,
  User,
  Phone,
  Building,
  ArrowRight,
  Eye,
  FileEdit,
  Trash2,
  Sparkles,
  Calendar,
  Layers,
  Check,
  Send,
  UserCheck,
  Wrench,
  AlertTriangle,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { QuoteRequest, AdminQuoteDetails, InstallerAssignment } from '../types';
import { formatCurrency } from '../services/quoteStorage';
import { AdminQuoteEditorModal } from './AdminQuoteEditorModal';
import { EmailPreviewModal } from './EmailPreviewModal';

// 4 technicians available for assignment in the same row
export const FOUR_TECHNICIANS = [
  {
    name: 'Claudio Soto',
    phone: '+56 9 7123 4567',
    role: 'Técnico Especialista en Altura',
    badge: 'Esp. Altura',
  },
  {
    name: 'Rodrigo Espinoza',
    phone: '+56 9 8234 5678',
    role: 'Instalador Certificado Senior',
    badge: 'Senior',
  },
  {
    name: 'Matías Valenzuela',
    phone: '+56 9 9345 6789',
    role: 'Técnico Redes y Fijaciones',
    badge: 'Fijaciones',
  },
  {
    name: 'Carlos Morales',
    phone: '+56 9 6456 7890',
    role: 'Instalador Cuadrilla Móvil',
    badge: 'Cuadrilla',
  },
];

interface AdminQuotesViewProps {
  quotes: QuoteRequest[];
  onSaveAdminQuote: (quoteId: string, details: AdminQuoteDetails) => void;
  onDeleteQuote: (quoteId: string) => void;
  onAssignInstaller?: (quoteId: string, assignment: InstallerAssignment) => void;
  onUnassignInstaller?: (quoteId: string) => void;
  onNavigateToClient: () => void;
  onNavigateToClientQuoteScreen?: (quote: QuoteRequest) => void;
  onNavigateToReceivedQuotes?: () => void;
  onNavigateToApprovedQuotes?: () => void;
  onNavigateToTechnicianOrders?: () => void;
}

export const AdminQuotesView: React.FC<AdminQuotesViewProps> = ({
  quotes,
  onSaveAdminQuote,
  onDeleteQuote,
  onAssignInstaller,
  onUnassignInstaller,
  onNavigateToClient,
  onNavigateToClientQuoteScreen,
  onNavigateToReceivedQuotes,
  onNavigateToApprovedQuotes,
  onNavigateToTechnicianOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'cotizada' | 'asignada'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedQuoteForEdit, setSelectedQuoteForEdit] = useState<QuoteRequest | null>(null);
  const [selectedQuoteForEmail, setSelectedQuoteForEmail] = useState<QuoteRequest | null>(null);
  const [quoteToDeleteId, setQuoteToDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter quotes
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.installerAssignment?.technicianName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pendiente'
        ? q.status === 'pendiente'
        : filterStatus === 'cotizada'
        ? q.status === 'cotizada' || (!!q.adminQuote && !q.installerAssignment)
        : filterStatus === 'asignada'
        ? !!q.installerAssignment
        : true;

    return matchesSearch && matchesStatus;
  });

  // KPI Metrics
  const totalCount = quotes.length;
  const pendingCount = quotes.filter((q) => q.status === 'pendiente').length;
  const quotedCount = quotes.filter((q) => q.status === 'cotizada' || !!q.adminQuote).length;
  const assignedCount = quotes.filter((q) => !!q.installerAssignment).length;
  const totalAreaM2 = quotes.reduce((sum, q) => sum + q.totalAreaM2, 0);

  const handleOpenEditor = (quote: QuoteRequest) => {
    setSelectedQuoteForEdit(quote);
  };

  const handleOpenEmailPreview = (quote: QuoteRequest) => {
    setSelectedQuoteForEmail(quote);
  };

  // Direct Send button action in the same row
  const handleDirectSend = (quote: QuoteRequest) => {
    if (quote.adminQuote) {
      // Already has calculated quote: trigger preview and show sent toast
      setSelectedQuoteForEmail(quote);
      setToastMessage(`✓ Presupuesto ${quote.folio} enviado por correo a ${quote.clientEmail}`);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      // Not yet priced: open modal to quickly confirm and send
      setSelectedQuoteForEdit(quote);
    }
  };

  // Assign technician in the same row
  const handleAssignTechnician = (quote: QuoteRequest, techName: string) => {
    if (!techName) {
      handleUnassignTechnician(quote.id, quote.folio);
      return;
    }
    const tech = FOUR_TECHNICIANS.find((t) => t.name === techName);
    if (!tech) return;

    if (onAssignInstaller) {
      onAssignInstaller(quote.id, {
        technicianName: tech.name,
        technicianPhone: tech.phone,
        technicianRole: tech.role,
        assignedAt: new Date().toISOString(),
        installationStatus: 'por_instalar',
        assignmentNotes: 'Asignado directamente en la misma fila de recepción de cotizaciones',
      });
      setToastMessage(`✓ Presupuesto ${quote.folio} asignado a ${tech.name}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Unassign technician
  const handleUnassignTechnician = (quoteId: string, folio: string) => {
    if (onUnassignInstaller) {
      onUnassignInstaller(quoteId);
      setToastMessage(`Asignación retirada del presupuesto ${folio}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Delete quote
  const handleConfirmDelete = (quoteId: string, folio: string) => {
    onDeleteQuote(quoteId);
    setQuoteToDeleteId(null);
    setToastMessage(`Presupuesto ${folio} eliminado correctamente.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAndSend = (
    quoteId: string,
    details: AdminQuoteDetails,
    nextAction?: 'client_screen' | 'email'
  ) => {
    onSaveAdminQuote(quoteId, details);
    setSelectedQuoteForEdit(null);

    // Find updated quote to show immediate preview
    const updated = quotes.find((q) => q.id === quoteId);
    const cloneWithAdmin: QuoteRequest = updated
      ? {
          ...updated,
          status: 'cotizada',
          adminQuote: details,
        }
      : {
          ...quotes[0],
          adminQuote: details,
        };

    if (nextAction === 'client_screen' && onNavigateToClientQuoteScreen) {
      onNavigateToClientQuoteScreen(cloneWithAdmin);
    } else {
      setSelectedQuoteForEmail(cloneWithAdmin);
    }

    setToastMessage(`¡Cotización despachada a ${details.sentToEmail}!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div id="view-admin-quotes" className="space-y-8 pb-16">
      {/* Toast notification banner */}
      {toastMessage && (
        <div
          id="admin-toast-notification"
          className="fixed top-20 right-4 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 flex items-center gap-3 animate-fade-in text-sm font-medium"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>{toastMessage}</div>
        </div>
      )}

      {/* Header View Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200 mb-3">
            <Inbox className="w-3.5 h-3.5 text-sky-600" />
            <span>PANTALLA 2 &bull; RECEPCIÓN DE COTIZACIONES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Recepción y Gestión de Presupuestos
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            En esta pantalla puedes gestionar cada cotización en su misma fila: <strong>enviar presupuesto</strong> al cliente, <strong>eliminar presupuesto</strong> o <strong>asignar a uno de los 4 técnicos</strong> para la instalación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToApprovedQuotes && (
            <button
              id="btn-go-to-approved-from-admin"
              type="button"
              onClick={onNavigateToApprovedQuotes}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>Ver Aprobadas (Pantalla 4)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onNavigateToTechnicianOrders && (
            <button
              id="btn-go-to-techs-from-admin"
              type="button"
              onClick={onNavigateToTechnicianOrders}
              className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5 text-sky-600" />
              <span>Recepción Técnicos (Pantalla 5)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            id="btn-admin-new-quote"
            type="button"
            onClick={onNavigateToClient}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Nueva Solicitud Cliente</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Solicitudes</span>
            <Inbox className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalCount}</div>
          <div className="text-xs text-slate-500 mt-1">Recibidas en el sistema</div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase">Por Cotizar</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">{pendingCount}</div>
          <div className="text-xs text-amber-800/80 mt-1">Pendientes de fijar valor</div>
        </div>

        {/* Quoted and Sent */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase">Cotizadas / Enviadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">{quotedCount}</div>
          <div className="text-xs text-emerald-800/80 mt-1">Despachadas al cliente</div>
        </div>

        {/* Assigned to Technicians */}
        <div className="bg-white p-5 rounded-2xl border border-sky-200 shadow-xs bg-gradient-to-br from-white to-sky-50/30">
          <div className="flex items-center justify-between text-sky-600 mb-2">
            <span className="text-xs font-semibold uppercase">Técnicos Asignados</span>
            <UserCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700">{assignedCount}</div>
          <div className="text-xs text-sky-800 mt-1">Con instalador en curso</div>
        </div>
      </div>

      {/* FILTER, SEARCH CONTROLS & VIEW TOGGLE */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-admin-search"
            type="text"
            placeholder="Buscar por cliente, correo, folio o técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
          />
        </div>

        {/* Filter buttons & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pendiente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'pendiente'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('cotizada')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'cotizada'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Cotizadas ({quotedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('asignada')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterStatus === 'asignada'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              Asignadas ({assignedCount})
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de filas en tabla compacta"
            >
              <List className="w-3.5 h-3.5" />
              <span>Filas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista de fichas completas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Fichas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-3.5 text-xs text-sky-900 flex items-start gap-2.5">
        <UserCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <p>
          <strong>Acciones en la misma fila:</strong> Cada cotización cuenta con su botón para <strong>Enviar Presupuesto</strong> (con vista del correo), <strong>Eliminar Presupuesto</strong> y <strong>Asignar Técnico</strong> seleccionando entre los 4 técnicos disponibles: <em>Claudio Soto, Rodrigo Espinoza, Matías Valenzuela y Carlos Morales</em>.
        </p>
      </div>

      {/* QUOTES LIST: TABLE VIEW OR CARDS VIEW */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No se encontraron cotizaciones
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No hay solicitudes que coincidan con tu búsqueda o filtro seleccionado.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* VISTA FILAS / TABLA COMPACTA CON ACCIONES EN LA MISMA FILA */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Folio / Estado</th>
                  <th className="py-3 px-4">Cliente & Contacto</th>
                  <th className="py-3 px-4">Ventanas / M²</th>
                  <th className="py-3 px-4">Fechas Tentativas</th>
                  <th className="py-3 px-4">Presupuesto</th>
                  <th className="py-3 px-4 min-w-[340px] bg-sky-50/50 text-sky-900">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-sky-700" />
                      <span>Asignar Presupuesto (4 Técnicos)</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[220px] text-right">
                    <span>Acciones en Fila</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((quote) => {
                  const isPending = quote.status === 'pendiente';
                  const adminQuote = quote.adminQuote;
                  const assignedTech = quote.installerAssignment?.technicianName;
                  const isConfirmingDelete = quoteToDeleteId === quote.id;

                  return (
                    <tr
                      key={quote.id}
                      id={`quote-row-${quote.id}`}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Folio & Status */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block mb-1">
                          {quote.folio}
                        </div>
                        <div>
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <Clock className="w-2.5 h-2.5" /> Pendiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Cotizada
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(quote.createdAt).toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900 text-xs">{quote.clientName}</div>
                        <div className="text-slate-600 text-[11px] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-sky-600" /> {quote.clientEmail}
                        </div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {quote.clientPhone}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {quote.clientCity} &bull; {quote.clientAddress}
                        </div>
                      </td>

                      {/* Windows & m2 */}
                      <td className="py-3.5 px-4 align-top">
                        <span className="font-bold text-slate-800 text-xs block">
                          {quote.totalAreaM2.toFixed(1)} m²
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {quote.windows.length} {quote.windows.length === 1 ? 'ventana' : 'ventanas'}
                        </span>
                      </td>

                      {/* Tentative Dates */}
                      <td className="py-3.5 px-4 align-top text-[11px] text-slate-600">
                        <div>
                          <span className="font-medium text-slate-400">1:</span>{' '}
                          <strong>{quote.tentativeDate1 || '—'}</strong> ⏰ {quote.tentativeTime1 || '10:00'}
                        </div>
                        <div>
                          <span className="font-medium text-slate-400">2:</span>{' '}
                          <strong>{quote.tentativeDate2 || '—'}</strong> ⏰ {quote.tentativeTime2 || '15:00'}
                        </div>
                        {adminQuote?.confirmedInstallationDate && (
                          <div className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                            Acordada: {adminQuote.confirmedInstallationDate}
                          </div>
                        )}
                      </td>

                      {/* Total Value */}
                      <td className="py-3.5 px-4 align-top">
                        {adminQuote ? (
                          <div>
                            <span className="font-black text-sky-700 text-sm block">
                              {formatCurrency(adminQuote.total)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditor(quote)}
                              className="text-[10px] text-amber-700 hover:underline font-semibold"
                            >
                              Modificar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Por calcular
                          </span>
                        )}
                      </td>

                      {/* ASIGNAR PRESUPUESTO EN LA MISMA FILA CON 4 NOMBRES */}
                      <td className="py-3 px-4 align-middle bg-sky-50/30 border-l border-r border-sky-100/80">
                        <div className="space-y-1.5">
                          {/* Dropdown in the same row */}
                          <div className="flex items-center gap-1.5">
                            <label htmlFor={`select-tech-${quote.id}`} className="sr-only">
                              Asignar Técnico
                            </label>
                            <select
                              id={`select-tech-${quote.id}`}
                              value={assignedTech || ''}
                              onChange={(e) => handleAssignTechnician(quote, e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 shadow-2xs"
                            >
                              <option value="">— Seleccionar técnico (4 nombres) —</option>
                              {FOUR_TECHNICIANS.map((tech, idx) => (
                                <option key={tech.name} value={tech.name}>
                                  {idx + 1}. {tech.name} ({tech.badge} - {tech.phone})
                                </option>
                              ))}
                            </select>
                            {assignedTech && (
                              <button
                                type="button"
                                onClick={() => handleUnassignTechnician(quote.id, quote.folio)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Desasignar técnico"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* 4 Name Buttons in the same row */}
                          <div className="flex flex-wrap items-center gap-1">
                            {FOUR_TECHNICIANS.map((tech) => {
                              const isSelected = assignedTech === tech.name;
                              return (
                                <button
                                  key={tech.name}
                                  type="button"
                                  id={`btn-assign-${tech.name.toLowerCase().replace(/\s+/g, '-')}-${quote.id}`}
                                  onClick={() => handleAssignTechnician(quote, tech.name)}
                                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white hover:bg-sky-50 text-slate-700 border border-slate-200 hover:border-sky-300'
                                  }`}
                                  title={`${tech.name} • ${tech.role} (${tech.phone})`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  <span>{tech.name}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Assigned status info */}
                          {assignedTech ? (
                            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <span>✓ Asignado: {assignedTech}</span>
                              {onNavigateToTechnicianOrders && (
                                <button
                                  type="button"
                                  onClick={onNavigateToTechnicianOrders}
                                  className="text-emerald-700 hover:underline inline-flex items-center gap-0.5 text-[10px]"
                                >
                                  <span>Ver en P5</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic block">
                              Sin técnico asignado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ENVIAR PRESUPUESTO & ELIMINAR PRESUPUESTO EN LA MISMA FILA */}
                      <td className="py-3 px-4 align-middle text-right">
                        {isConfirmingDelete ? (
                          <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl text-left space-y-1.5 animate-fade-in">
                            <span className="text-[11px] font-bold text-rose-900 block">
                              ¿Eliminar cotización?
                            </span>
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => setQuoteToDeleteId(null)}
                                className="px-2 py-1 rounded bg-white text-slate-700 text-[10px] font-bold border border-slate-200 hover:bg-slate-100"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(quote.id, quote.folio)}
                                className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-500 shadow-2xs"
                              >
                                Sí, eliminar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-1.5">
                            {/* BOTÓN ENVIAR PRESUPUESTO */}
                            <button
                              id={`btn-enviar-presupuesto-table-${quote.id}`}
                              type="button"
                              onClick={() => handleDirectSend(quote)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
                              title="Enviar presupuesto formal por correo al cliente"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Enviar Presupuesto</span>
                            </button>

                            {/* Acciones complementarias: ver correo y eliminar */}
                            <div className="flex items-center gap-1">
                              {adminQuote && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEmailPreview(quote)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[11px] flex items-center gap-1"
                                  title="Ver correo informativo"
                                >
                                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                                  <span className="hidden sm:inline text-[10px]">Correo</span>
                                </button>
                              )}

                              {/* BOTÓN ELIMINAR PRESUPUESTO */}
                              <button
                                id={`btn-eliminar-presupuesto-table-${quote.id}`}
                                type="button"
                                onClick={() => setQuoteToDeleteId(quote.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-bold transition-colors"
                                title="Eliminar este presupuesto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA FICHAS / TARJETAS CON BARRA DE ACCIONES EN LA MISMA FILA */
        <div className="space-y-4">
          {filteredQuotes.map((quote) => {
            const isPending = quote.status === 'pendiente';
            const adminQuote = quote.adminQuote;
            const assignedTech = quote.installerAssignment?.technicianName;
            const isConfirmingDelete = quoteToDeleteId === quote.id;

            return (
              <div
                key={quote.id}
                id={`quote-card-${quote.id}`}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-xs hover:shadow-md ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-200/50'
                    : 'border-slate-200'
                }`}
              >
                {/* Upper summary */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  {/* Folio & Client Main Details */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm ${
                        isPending
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isPending ? (
                        <Clock className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                          {quote.folio}
                        </span>

                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Pendiente de cotizar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Cotizada y Enviada al Correo
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400">
                          Recibida:{' '}
                          {new Date(quote.createdAt).toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {quote.clientName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                        <span className="flex items-center gap-1 text-sky-700 font-semibold">
                          <Mail className="w-3.5 h-3.5 text-sky-600" /> {quote.clientEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {quote.clientPhone}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building className="w-3.5 h-3.5 text-slate-400" /> {quote.clientCity} &bull; {quote.clientAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Value Box */}
                  <div className="text-left sm:text-right">
                    {adminQuote ? (
                      <>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Valor total cotizado:
                        </span>
                        <span className="text-xl font-black text-sky-700">
                          {formatCurrency(adminQuote.total)}
                        </span>
                      </>
                    ) : (
                      <div className="text-amber-700 text-xs font-bold bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                        Esperando cotización del admin
                      </div>
                    )}
                  </div>
                </div>

                {/* Tentative Dates & Installation Coordination Strip */}
                <div className="py-3 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Proposed by client */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      Fechas tentativas propuestas por el usuario:
                    </span>
                    <div className="text-slate-700 space-y-0.5">
                      <p>
                        <strong>Opción 1:</strong> {quote.tentativeDate1 || 'Sin fecha'} &bull; ⏰ {quote.tentativeTime1 || '10:00'} hrs
                      </p>
                      <p>
                        <strong>Opción 2:</strong> {quote.tentativeDate2 || 'Sin fecha'} &bull; ⏰ {quote.tentativeTime2 || '15:00'} hrs
                      </p>
                    </div>
                  </div>

                  {/* Confirmed / Accepted by admin */}
                  <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-900 block mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                      Fecha de instalación acordada/propuesta:
                    </span>
                    {adminQuote?.confirmedInstallationDate ? (
                      <div>
                        <p className="text-slate-900 font-bold">
                          📅 {adminQuote.confirmedInstallationDate} &bull; ⏰ {adminQuote.confirmedInstallationTime || '10:00'} hrs
                        </p>
                        <span className="text-[10px] text-amber-800">
                          {adminQuote.selectedScheduleOption === 'opcion_1'
                            ? 'Aceptada Opción 1 del cliente'
                            : adminQuote.selectedScheduleOption === 'opcion_2'
                            ? 'Aceptada Opción 2 del cliente'
                            : 'Horario fijado por administración'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">
                        El administrador puede acordar fecha al presionar &ldquo;Enviar Presupuesto&rdquo; o &ldquo;Fijar Valor&rdquo;.
                      </p>
                    )}
                  </div>
                </div>

                {/* Windows item pills & tags */}
                <div className="py-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase mr-1">
                    Ventanas ({quote.windows.length}):
                  </span>

                  {quote.windows.map((w) => (
                    <div
                      key={w.id}
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200"
                    >
                      <span className="font-semibold text-slate-900">{w.name}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="font-mono text-slate-600">
                        {w.height}m &times; {w.width}m
                      </span>
                      <span className="font-bold text-sky-700">({w.area} m²)</span>
                    </div>
                  ))}

                  <span className="text-xs font-black text-slate-700 ml-auto">
                    Total: {quote.totalAreaM2} m²
                  </span>
                </div>

                {/* ════════════════════════════════════════════════════════════════════
                    BARRA EN LA MISMA FILA: ASIGNAR (4 TÉCNICOS), ENVIAR Y ELIMINAR
                   ════════════════════════════════════════════════════════════════════ */}
                <div className="mt-3 pt-3.5 border-t border-slate-200/90 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-3xl">
                  {/* ASIGNAR TÉCNICO EN LA MISMA FILA CON 4 NOMBRES */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
                    <div className="flex items-center gap-1.5 shrink-0 text-slate-800">
                      <UserCheck className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-bold">Asignar Técnico:</span>
                    </div>

                    {/* Dropdown selector */}
                    <div className="w-full sm:w-60">
                      <select
                        id={`card-select-tech-${quote.id}`}
                        value={assignedTech || ''}
                        onChange={(e) => handleAssignTechnician(quote, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:border-sky-500 shadow-2xs"
                      >
                        <option value="">— Elegir técnico (4 nombres) —</option>
                        {FOUR_TECHNICIANS.map((tech, idx) => (
                          <option key={tech.name} value={tech.name}>
                            {idx + 1}. {tech.name} ({tech.badge})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 4 Clickable Technician Name Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {FOUR_TECHNICIANS.map((tech) => {
                        const isSelected = assignedTech === tech.name;
                        return (
                          <button
                            key={tech.name}
                            type="button"
                            id={`btn-card-assign-${tech.name.toLowerCase().replace(/\s+/g, '-')}-${quote.id}`}
                            onClick={() => handleAssignTechnician(quote, tech.name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white hover:bg-sky-50 text-slate-700 border border-slate-300 hover:border-sky-300'
                            }`}
                            title={`${tech.name} • ${tech.role} • ${tech.phone}`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            <span>{tech.name}</span>
                          </button>
                        );
                      })}

                      {assignedTech && (
                        <button
                          type="button"
                          onClick={() => handleUnassignTechnician(quote.id, quote.folio)}
                          className="px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                          title="Desasignar"
                        >
                          <X className="w-3 h-3 inline mr-0.5" />
                          <span>Desasignar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ENVIAR PRESUPUESTO & ELIMINAR PRESUPUESTO EN LA MISMA FILA */}
                  <div className="flex items-center justify-end gap-2 shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-200">
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                        <span className="text-xs font-bold text-rose-900">¿Eliminar {quote.folio}?</span>
                        <button
                          type="button"
                          onClick={() => setQuoteToDeleteId(null)}
                          className="px-2.5 py-1 rounded-lg bg-white text-slate-700 text-xs font-bold border border-slate-200 hover:bg-slate-100"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(quote.id, quote.folio)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
                        >
                          Sí, eliminar
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* BOTÓN ENVIAR PRESUPUESTO */}
                        <button
                          id={`btn-enviar-presupuesto-card-${quote.id}`}
                          type="button"
                          onClick={() => handleDirectSend(quote)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition-colors"
                          title="Enviar presupuesto por correo al cliente"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Presupuesto</span>
                        </button>

                        {/* Cambiar valor */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditor(quote)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors"
                          title="Modificar valores y detalles"
                        >
                          <FileEdit className="w-3.5 h-3.5 text-amber-700" />
                          <span className="hidden sm:inline">Modificar</span>
                        </button>

                        {/* Ver correo */}
                        {adminQuote && (
                          <button
                            type="button"
                            onClick={() => handleOpenEmailPreview(quote)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                            title="Ver cómo le llega el correo al cliente"
                          >
                            <Mail className="w-3.5 h-3.5 text-sky-400" />
                            <span className="hidden sm:inline">Correo</span>
                          </button>
                        )}

                        {/* BOTÓN ELIMINAR PRESUPUESTO */}
                        <button
                          id={`btn-eliminar-presupuesto-card-${quote.id}`}
                          type="button"
                          onClick={() => setQuoteToDeleteId(quote.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold transition-colors"
                          title="Eliminar este presupuesto"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal for completing values */}
      {selectedQuoteForEdit && (
        <AdminQuoteEditorModal
          quote={selectedQuoteForEdit}
          onClose={() => setSelectedQuoteForEdit(null)}
          onSaveAndSend={handleSaveAndSend}
        />
      )}

      {/* Email View Modal (Informative for admin) */}
      {selectedQuoteForEmail && (
        <EmailPreviewModal
          quote={selectedQuoteForEmail}
          onClose={() => setSelectedQuoteForEmail(null)}
          onViewClientScreen={
            onNavigateToClientQuoteScreen
              ? () => {
                  if (selectedQuoteForEmail) {
                    onNavigateToClientQuoteScreen(selectedQuoteForEmail);
                  }
                }
              : undefined
          }
          onViewReceivedList={
            onNavigateToReceivedQuotes
              ? () => {
                  onNavigateToReceivedQuotes();
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
