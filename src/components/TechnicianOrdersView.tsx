import React, { useState } from 'react';
import { QuoteRequest, TechnicianExecution, TechnicianWorkStatus, UserAccount } from '../types';
import { formatCurrency } from '../services/quoteStorage';
import {
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Layers,
  FileText,
  Search,
  Check,
  Building,
  Save,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ArrowRight,
  User,
  Filter,
  Eye
} from 'lucide-react';

interface TechnicianOrdersViewProps {
  quotes: QuoteRequest[];
  onUpdateTechnicianExecution: (
    quoteId: string,
    execution: Partial<TechnicianExecution>
  ) => void;
  onNavigateToApprovedAdmin?: () => void;
  currentUser?: UserAccount | null;
  onOpenLogin?: () => void;
}

export const TechnicianOrdersView: React.FC<TechnicianOrdersViewProps> = ({
  quotes,
  onUpdateTechnicianExecution,
  onNavigateToApprovedAdmin,
  currentUser,
  onOpenLogin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TechnicianWorkStatus>('all');
  const [technicianNotesDraft, setTechnicianNotesDraft] = useState<Record<string, string>>({});
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);
  // Optional admin toggle to view all orders or test specific client email view
  const [adminViewEmailFilter, setAdminViewEmailFilter] = useState<'all' | string>('all');

  const isAdmin = currentUser?.role === 'admin';
  const isClient = currentUser?.role === 'cliente';
  const isTechnician = currentUser?.role === 'tecnico';
  const loggedEmail = currentUser?.email?.toLowerCase().trim();

  // Screen 5 only receives accepted quotes (pedidos aceptados por el cliente)
  // When a client is logged in, ONLY show work orders generated with their email address
  const acceptedQuotes = quotes.filter((q) => {
    if (q.status !== 'aceptada') return false;

    // Strict user email filtering if logged in as client:
    if (currentUser && !isAdmin && !isTechnician) {
      return q.clientEmail.toLowerCase().trim() === loggedEmail;
    }

    // If admin has set a specific email filter in view:
    if (isAdmin && adminViewEmailFilter !== 'all') {
      return q.clientEmail.toLowerCase().trim() === adminViewEmailFilter.toLowerCase().trim();
    }

    return true;
  });

  // Distinct client emails for admin filter dropdown
  const allClientEmails = Array.from(
    new Set(quotes.filter((q) => q.status === 'aceptada').map((q) => q.clientEmail))
  );

  // Filter based on search & status
  const filteredQuotes = acceptedQuotes.filter((q) => {
    const execStatus: TechnicianWorkStatus =
      q.technicianExecution?.status || 'pendiente_aceptar';

    if (statusFilter !== 'all' && execStatus !== statusFilter) {
      return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const techName = q.installerAssignment?.technicianName?.toLowerCase() || '';

    return (
      q.folio.toLowerCase().includes(term) ||
      q.clientName.toLowerCase().includes(term) ||
      q.clientEmail.toLowerCase().includes(term) ||
      q.clientAddress.toLowerCase().includes(term) ||
      q.clientCity.toLowerCase().includes(term) ||
      q.clientPhone.includes(term) ||
      techName.includes(term)
    );
  });

  // Metrics
  const totalAccepted = acceptedQuotes.length;
  const pendingAcceptanceCount = acceptedQuotes.filter(
    (q) => !q.technicianExecution || q.technicianExecution.status === 'pendiente_aceptar'
  ).length;
  const inProgressCount = acceptedQuotes.filter(
    (q) => q.technicianExecution?.status === 'solicitud_aceptada'
  ).length;
  const completedCount = acceptedQuotes.filter(
    (q) => q.technicianExecution?.status === 'trabajo_realizado'
  ).length;

  // Handle saving notes
  const handleSaveNotes = (quote: QuoteRequest) => {
    const draft = technicianNotesDraft[quote.id];
    const currentNotes = quote.technicianExecution?.notes || '';
    const noteToSave = draft !== undefined ? draft : currentNotes;

    onUpdateTechnicianExecution(quote.id, {
      notes: noteToSave,
    });

    setSavedFeedbackId(quote.id);
    setTimeout(() => setSavedFeedbackId(null), 2500);
  };

  // Handle accepting request
  const handleAcceptRequest = (quote: QuoteRequest) => {
    const draftNotes = technicianNotesDraft[quote.id] || quote.technicianExecution?.notes || '';
    const techName = quote.installerAssignment?.technicianName || 'Técnico Instalador';

    onUpdateTechnicianExecution(quote.id, {
      status: 'solicitud_aceptada',
      notes: draftNotes,
      acceptedAt: new Date().toISOString(),
      technicianName: techName,
    });

    setSavedFeedbackId(quote.id);
    setTimeout(() => setSavedFeedbackId(null), 2500);
  };

  // Handle marking work as completed
  const handleMarkAsCompleted = (quote: QuoteRequest) => {
    const draftNotes = technicianNotesDraft[quote.id] || quote.technicianExecution?.notes || '';
    const techName = quote.installerAssignment?.technicianName || 'Técnico Instalador';

    onUpdateTechnicianExecution(quote.id, {
      status: 'trabajo_realizado',
      notes: draftNotes,
      completedAt: new Date().toISOString(),
      technicianName: techName,
    });

    setSavedFeedbackId(quote.id);
    setTimeout(() => setSavedFeedbackId(null), 2500);
  };

  return (
    <div id="technician-orders-screen" className="space-y-6 pb-16">
      {/* Top Banner & Screen Identity */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/15 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-500/30">
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>Pantalla 5 de 5 &bull; Portal del Técnico Instalador</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Recepción de Pedidos por Técnicos
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Bandeja operativa donde el equipo técnico recibe los <strong>presupuestos aceptados</strong> por los clientes. 
              Aquí puedes revisar medidas de ventanas, dirección de visita, <strong>escribir notas técnicas de terreno</strong>, 
              <strong>aceptar la solicitud</strong> o <strong>indicar que el trabajo fue realizado</strong> con éxito.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onNavigateToApprovedAdmin && (
              <button
                id="btn-nav-to-approved-from-tech"
                type="button"
                onClick={onNavigateToApprovedAdmin}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Ver Pantalla 4 (Admin Asignaciones)</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-center sm:text-left">
          <div className="bg-slate-800/60 backdrop-blur-xs p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Pedidos Aceptados</span>
            <span className="text-2xl font-black text-white">{totalAccepted}</span>
          </div>

          <div className="bg-amber-950/40 p-3.5 rounded-xl border border-amber-800/40">
            <span className="text-xs text-amber-300 block font-medium">Pendientes de Aceptar</span>
            <span className="text-2xl font-black text-amber-400">{pendingAcceptanceCount}</span>
          </div>

          <div className="bg-sky-950/40 p-3.5 rounded-xl border border-sky-800/40">
            <span className="text-xs text-sky-300 block font-medium">En Preparación / Ruta</span>
            <span className="text-2xl font-black text-sky-400">{inProgressCount}</span>
          </div>

          <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/40">
            <span className="text-xs text-emerald-300 block font-medium">Trabajos Realizados</span>
            <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        {/* User Account Context Banner */}
        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-slate-500 font-medium">Sesión activa como: </span>
                <span className="font-bold text-slate-900">{currentUser.fullName || currentUser.email}</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                  {currentUser.role}
                </span>
                <span className="block sm:inline sm:ml-2 text-slate-600 font-mono text-[11px]">
                  ({currentUser.email})
                </span>
              </div>
            </div>

            {/* If Client: Explain filtering */}
            {isClient && (
              <div className="inline-flex items-center gap-1.5 text-xs text-sky-800 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Mostrando exclusivamente las órdenes de trabajo de tu correo</span>
              </div>
            )}

            {/* If Admin: Quick filter selector by client email */}
            {isAdmin && allClientEmails.length > 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium text-[11px]">Ver por cliente:</span>
                <select
                  id="admin-filter-client-email"
                  value={adminViewEmailFilter}
                  onChange={(e) => setAdminViewEmailFilter(e.target.value)}
                  aria-label="Filtrar pedidos por correo de cliente"
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">Todos los clientes ({quotes.filter((q) => q.status === 'aceptada').length})</option>
                  {allClientEmails.map((email) => (
                    <option key={email} value={email}>
                      Solo {email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-amber-900 font-medium">
                No has iniciado sesión. Ingresa con tu cuenta de correo para ver tus órdenes de trabajo personalizadas.
              </span>
            </div>
            {onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors shadow-2xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ingresar con mi correo</span>
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="input-search-technician-orders"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, folio, dirección o técnico..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50 transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({totalAccepted})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pendiente_aceptar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'pendiente_aceptar'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Por Aceptar ({pendingAcceptanceCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('solicitud_aceptada')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'solicitud_aceptada'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>Aceptados / En Curso ({inProgressCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('trabajo_realizado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'trabajo_realizado'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Realizados ({completedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Wrench className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            No se encontraron pedidos de instalación
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isClient && currentUser ? (
              <span>
                No se encontraron órdenes de trabajo aceptadas para el correo{' '}
                <strong className="text-slate-800 font-semibold">{currentUser.email}</strong>. Cuando apruebes una cotización, la orden de trabajo se reflejará de inmediato aquí.
              </span>
            ) : totalAccepted === 0 ? (
              'Aún no hay cotizaciones aceptadas por los clientes. Cuando un cliente apruebe una cotización en Pantalla 3 o el admin la valide, aparecerá automáticamente aquí para el equipo técnico.'
            ) : (
              'No hay pedidos que coincidan con el filtro o correo seleccionado.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuotes.map((quote) => {
            const execStatus: TechnicianWorkStatus =
              quote.technicianExecution?.status || 'pendiente_aceptar';
            const isCompleted = execStatus === 'trabajo_realizado';
            const isAccepted = execStatus === 'solicitud_aceptada';
            const isPending = execStatus === 'pendiente_aceptar';

            const currentNotes =
              technicianNotesDraft[quote.id] !== undefined
                ? technicianNotesDraft[quote.id]
                : quote.technicianExecution?.notes || '';

            const assignedTech = quote.installerAssignment?.technicianName || 'Técnico General Mallas';
            const assignedTechPhone = quote.installerAssignment?.technicianPhone || '+56 9 8000 2400';
            const mapQuery = encodeURIComponent(`${quote.clientAddress}, ${quote.clientCity}, Chile`);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
            const cleanPhone = quote.clientPhone.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Hola ${quote.clientName}, nos comunicamos de MallasSeguras respecto a la instalación de mallas de seguridad (Folio ${quote.folio}).`
            )}`;

            return (
              <div
                key={quote.id}
                id={`tech-order-card-${quote.id}`}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                  isCompleted
                    ? 'border-emerald-300 ring-1 ring-emerald-200'
                    : isAccepted
                    ? 'border-sky-300 ring-1 ring-sky-200'
                    : 'border-amber-300 ring-1 ring-amber-200'
                }`}
              >
                {/* Header status strip */}
                <div
                  className={`px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                      : isAccepted
                      ? 'bg-sky-50 text-sky-900 border-b border-sky-200'
                      : 'bg-amber-50 text-amber-900 border-b border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-slate-900 shadow-2xs">
                      {quote.folio}
                    </span>

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        TRABAJO REALIZADO &bull; INSTALACIÓN COMPLETADA
                      </span>
                    )}

                    {isAccepted && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-[11px] shadow-2xs">
                        <Wrench className="w-3.5 h-3.5" />
                        SOLICITUD ACEPTADA &bull; EN PREPARACIÓN / RUTA
                      </span>
                    )}

                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] shadow-2xs animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        PENDIENTE DE ACEPTAR POR EL TÉCNICO
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 font-normal">
                    {quote.technicianExecution?.acceptedAt && (
                      <span className="text-[11px]">
                        Aceptado:{' '}
                        {new Date(quote.technicianExecution.acceptedAt).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {quote.technicianExecution?.completedAt && (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Completado:{' '}
                        {new Date(quote.technicianExecution.completedAt).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    <span className="text-[11px] bg-white/70 px-2 py-0.5 rounded-md border border-slate-200">
                      Técnico asignado: <strong>{assignedTech}</strong>
                    </span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6 space-y-6">
                  {/* Top Grid: Client & Installation Date Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Client & Address Info */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                            Cliente y Ubicación
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">
                            {quote.clientName}
                          </h3>
                        </div>
                        <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {quote.propertyType.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className="font-semibold">{quote.clientAddress}, {quote.clientCity}</span>
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-800 font-bold ml-1 underline"
                          >
                            <span>Ver Mapa</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{quote.clientPhone}</span>
                          </div>

                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-2xs transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Contactar por WhatsApp</span>
                          </a>
                        </div>

                        {quote.clientComments && (
                          <div className="mt-2 p-2.5 rounded-lg bg-amber-50 text-amber-900 text-[11px] border border-amber-200">
                            <strong>Comentario del cliente:</strong> &ldquo;{quote.clientComments}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirmed Schedule & Price Box */}
                    <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[11px] text-sky-800 font-bold uppercase tracking-wider block">
                          Fecha y Hora Acordada
                        </span>
                        <div className="mt-1 flex items-center gap-2 text-slate-900 font-black text-base">
                          <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>
                            {quote.adminQuote?.confirmedInstallationDate || quote.tentativeDate1 || 'A coordinar'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-sky-700 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            Hora: {quote.adminQuote?.confirmedInstallationTime || quote.tentativeTime1 || '10:00'} hrs
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-sky-200/80">
                        <span className="text-[11px] text-slate-500 block">Total Aceptado:</span>
                        <span className="text-lg font-black text-slate-900">
                          {quote.adminQuote ? formatCurrency(quote.adminQuote.total) : 'En revisión'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Garantía: {quote.adminQuote?.warrantyYears || 2} años
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Windows Technical List for the Installer */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-sky-600" />
                        Ventanas y Medidas a Instalar ({quote.windows.length} items &bull; {quote.totalAreaM2} m² total)
                      </span>
                      <span className="text-xs text-slate-500">
                        Verifica las medidas en terreno antes de fijar los perfiles
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {quote.windows.map((win, idx) => (
                        <div
                          key={win.id}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span className="truncate">{idx + 1}. {win.name}</span>
                            <span className="text-sky-700 shrink-0 font-mono">{win.area} m²</span>
                          </div>
                          <div className="text-slate-600 flex items-center gap-2">
                            <span>Alto: <strong>{win.height}m</strong></span>
                            <span>&bull;</span>
                            <span>Ancho: <strong>{win.width}m</strong></span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500">
                            <span className="capitalize">{win.meshType}</span>
                            {win.notes && <span className="italic truncate">{win.notes}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Field for Technician Notes (Requested specifically) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor={`tech-notes-${quote.id}`}
                        className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span>Notas y Observaciones del Técnico</span>
                        <span className="text-[10px] font-normal text-slate-500">
                          (Observaciones de terreno, tipo de fijación usada, estado de baranda, materiales adicionales)
                        </span>
                      </label>

                      {savedFeedbackId === quote.id && (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                          <Check className="w-3.5 h-3.5" />
                          ¡Cambios guardados!
                        </span>
                      )}
                    </div>

                    <textarea
                      id={`tech-notes-${quote.id}`}
                      rows={3}
                      value={currentNotes}
                      onChange={(e) =>
                        setTechnicianNotesDraft((prev) => ({
                          ...prev,
                          [quote.id]: e.target.value,
                        }))
                      }
                      placeholder="Ej: Se instalaron tarugos Fischer de 8mm en muro de hormigón. Baranda presentaba pequeña holgura, se reforzó con perno pasante. Malla tensada al 100%..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white leading-relaxed"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        {currentNotes ? `${currentNotes.length} caracteres guardados` : 'Sin notas registradas aún'}
                      </span>
                      <button
                        id={`btn-save-notes-${quote.id}`}
                        type="button"
                        onClick={() => handleSaveNotes(quote)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Notas</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar for the Technician */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Instalación certificada y terminada
                        </span>
                      ) : isAccepted ? (
                        <span className="inline-flex items-center gap-1.5 text-sky-700 font-bold">
                          <Wrench className="w-4 h-4 text-sky-600" />
                          Solicitud aceptada por el técnico en terreno
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          Presione &ldquo;Aceptar Solicitud&rdquo; para confirmar su recepción
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                      {/* Action 1: Aceptar Solicitud */}
                      {!isAccepted && !isCompleted && (
                        <button
                          id={`btn-tech-accept-request-${quote.id}`}
                          type="button"
                          onClick={() => handleAcceptRequest(quote)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Aceptar Solicitud</span>
                        </button>
                      )}

                      {/* Action 2: Indicar que el Trabajo fue Realizado */}
                      {!isCompleted && (
                        <button
                          id={`btn-tech-mark-completed-${quote.id}`}
                          type="button"
                          onClick={() => handleMarkAsCompleted(quote)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Indicar que el Trabajo fue Realizado</span>
                        </button>
                      )}

                      {/* If already completed, option to re-open if needed */}
                      {isCompleted && (
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-2 rounded-xl">
                            <ShieldCheck className="w-4 h-4" />
                            Trabajo Realizado con Éxito
                          </span>
                          <button
                            id={`btn-reopen-order-${quote.id}`}
                            type="button"
                            onClick={() => handleAcceptRequest(quote)}
                            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                          >
                            Modificar estado
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
