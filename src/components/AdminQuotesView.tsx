import React, { useState } from 'react';
import {
  Inbox,
  Search,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  ArrowRight,
  FileEdit,
  Trash2,
  Check,
  Send,
  UserCheck,
  Wrench,
  Sparkles,
  Calendar,
  X,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  MapPin,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  RefreshCw,
  Shield,
  Laptop,
  LogIn,
  LogOut,
  Activity,
} from 'lucide-react';
import {
  QuoteRequest,
  AdminQuoteDetails,
  InstallerAssignment,
  UserAccessLog,
} from '../types';
import { formatCurrency } from '../services/quoteStorage';
import { getStoredAccessLogs, syncAccessLogsWithFirestore } from '../services/accessLogService';
import { AdminQuoteEditorModal } from './AdminQuoteEditorModal';
import { EmailPreviewModal } from './EmailPreviewModal';

// 4 technicians available for assignment
export const FOUR_TECHNICIANS = [
  {
    name: 'Claudio Soto',
    phone: '+56 9 7123 4567',
    role: 'Técnico Especialista en Altura',
  },
  {
    name: 'Rodrigo Espinoza',
    phone: '+56 9 8234 5678',
    role: 'Instalador Certificado Senior',
  },
  {
    name: 'Matías Valenzuela',
    phone: '+56 9 9345 6789',
    role: 'Técnico Redes y Fijaciones',
  },
  {
    name: 'Carlos Morales',
    phone: '+56 9 6456 7890',
    role: 'Instalador Cuadrilla Móvil',
  },
];

export type DashboardFilter =
  | 'all'
  | 'solicitadas'
  | 'respondidas'
  | 'aceptadas'
  | 'pagadas'
  | 'pendientes_pago';

interface AdminQuotesViewProps {
  quotes: QuoteRequest[];
  onSaveAdminQuote: (quoteId: string, details: AdminQuoteDetails) => void;
  onDeleteQuote: (quoteId: string) => void;
  onAssignInstaller?: (quoteId: string, assignment: InstallerAssignment) => void;
  onUnassignInstaller?: (quoteId: string) => void;
  onAcceptQuote?: (quoteId: string) => void;
  onUpdatePayment?: (
    quoteId: string,
    paidAmount: number,
    paymentStatus?: 'pendiente' | 'abono_parcial' | 'pagado_total',
    paymentMethod?: string,
    paymentNotes?: string
  ) => void;
  onNavigateToClient: () => void;
  onNavigateToClientQuoteScreen?: (quote: QuoteRequest) => void;
  onNavigateToTechnicianOrders?: () => void;
}

export const AdminQuotesView: React.FC<AdminQuotesViewProps> = ({
  quotes,
  onSaveAdminQuote,
  onDeleteQuote,
  onAssignInstaller,
  onUnassignInstaller,
  onAcceptQuote,
  onUpdatePayment,
  onNavigateToClient,
  onNavigateToClientQuoteScreen,
  onNavigateToTechnicianOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMainTab, setActiveMainTab] = useState<'quotes' | 'access_logs'>('quotes');
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>('solicitadas');
  const [accessLogs, setAccessLogs] = useState<UserAccessLog[]>(() => getStoredAccessLogs());
  const [isSyncingLogs, setIsSyncingLogs] = useState(false);
  const [selectedQuoteForEdit, setSelectedQuoteForEdit] = useState<QuoteRequest | null>(null);
  const [selectedQuoteForEmail, setSelectedQuoteForEmail] = useState<QuoteRequest | null>(null);
  const [quoteForPayment, setQuoteForPayment] = useState<QuoteRequest | null>(null);
  const [quoteToDeleteId, setQuoteToDeleteId] = useState<string | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRefreshAccessLogs = async () => {
    setIsSyncingLogs(true);
    try {
      const synced = await syncAccessLogsWithFirestore();
      setAccessLogs(synced);
      setToastMessage('✓ Registros de acceso sincronizados con Firestore');
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage('Registros cargados desde almacenamiento local.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSyncingLogs(false);
    }
  };

  // Payment modal state
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethodInput, setPaymentMethodInput] = useState<string>('Transferencia Bancaria');
  const [paymentNotesInput, setPaymentNotesInput] = useState<string>('');

  // 1. KPI Calculations for Dashboard
  // Cotizaciones Solicitadas (Pendientes de respuesta)
  const solicitadasQuotes = quotes.filter((q) => q.status === 'pendiente');
  const solicitadasCount = solicitadasQuotes.length;

  // Cotizaciones Respondidas (Presupuesto enviado al cliente)
  const respondidasQuotes = quotes.filter(
    (q) => q.status === 'cotizada' || q.status === 'aceptada' || !!q.adminQuote
  );
  const respondidasCount = respondidasQuotes.length;

  // Cotizaciones Aceptadas (Aprobadas por el cliente)
  const aceptadasQuotes = quotes.filter((q) => q.status === 'aceptada');
  const aceptadasCount = aceptadasQuotes.length;

  // Total Pagado y Total Pendiente
  let totalPagado = 0;
  let totalPresupuestado = 0;

  quotes.forEach((q) => {
    const quoteTotal = q.adminQuote?.total || 0;
    if (quoteTotal > 0) {
      totalPresupuestado += quoteTotal;
      // Use explicit paidAmount if registered, or default based on paymentStatus
      const paid =
        typeof q.paidAmount === 'number'
          ? q.paidAmount
          : q.paymentStatus === 'pagado_total'
          ? quoteTotal
          : q.paymentStatus === 'abono_parcial'
          ? Math.round(quoteTotal * 0.5)
          : 0;
      totalPagado += paid;
    }
  });

  const totalPendiente = Math.max(0, totalPresupuestado - totalPagado);

  // Filtered quotes based on active filter and search term
  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.installerAssignment?.technicianName || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'solicitadas') {
      return q.status === 'pendiente';
    }
    if (activeFilter === 'respondidas') {
      return q.status === 'cotizada' || q.status === 'aceptada' || !!q.adminQuote;
    }
    if (activeFilter === 'aceptadas') {
      return q.status === 'aceptada';
    }
    if (activeFilter === 'pagadas') {
      const paid = typeof q.paidAmount === 'number' ? q.paidAmount : 0;
      return paid > 0 || q.paymentStatus === 'pagado_total' || q.paymentStatus === 'abono_parcial';
    }
    if (activeFilter === 'pendientes_pago') {
      const quoteTotal = q.adminQuote?.total || 0;
      const paid = typeof q.paidAmount === 'number' ? q.paidAmount : 0;
      return quoteTotal > 0 && paid < quoteTotal;
    }

    return true; // 'all'
  });

  // Access Logs State & KPIs for Tab 2
  const [accessLogFilter, setAccessLogFilter] = useState<'all' | 'admin' | 'tecnico' | 'cliente' | 'quote_created'>('all');
  const [accessLogSearch, setAccessLogSearch] = useState('');

  const totalConnections = accessLogs.length;
  const uniqueUsersCount = new Set(accessLogs.map((l) => l.userEmail.toLowerCase())).size;
  const quotesDoneInLogs = accessLogs.reduce((acc, l) => acc + (l.quotesCount || (l.quoteFolios?.length || 0)), 0);
  const latestLog = accessLogs[0] || null;

  const filteredAccessLogs = accessLogs.filter((log) => {
    const term = accessLogSearch.toLowerCase().trim();
    const matchesSearch =
      !term ||
      log.userEmail.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      log.actionDescription.toLowerCase().includes(term) ||
      (log.quoteFolios || []).some((f) => f.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (accessLogFilter === 'admin') return log.role === 'admin';
    if (accessLogFilter === 'tecnico') return log.role === 'tecnico';
    if (accessLogFilter === 'cliente') return log.role === 'cliente';
    if (accessLogFilter === 'quote_created') {
      return log.action === 'quote_created' || (log.quoteFolios && log.quoteFolios.length > 0);
    }

    return true;
  });

  // Handlers
  const handleOpenRespondModal = (quote: QuoteRequest) => {
    setSelectedQuoteForEdit(quote);
  };

  const handleOpenEmailPreview = (quote: QuoteRequest) => {
    if (quote.adminQuote) {
      setSelectedQuoteForEmail(quote);
    } else {
      setSelectedQuoteForEdit(quote);
    }
  };

  const handleRegisterAcceptance = (quote: QuoteRequest) => {
    if (onAcceptQuote) {
      onAcceptQuote(quote.id);
      setToastMessage(`✓ Cotización ${quote.folio} marcada como Aceptada por el cliente.`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleOpenPaymentModal = (quote: QuoteRequest) => {
    setQuoteForPayment(quote);
    const existingPaid = typeof quote.paidAmount === 'number' ? quote.paidAmount : 0;
    const total = quote.adminQuote?.total || 0;
    setPaymentAmountInput(existingPaid > 0 ? String(existingPaid) : String(Math.round(total * 0.5)));
    setPaymentMethodInput(quote.paymentMethod || 'Transferencia Bancaria');
    setPaymentNotesInput(quote.paymentNotes || '');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForPayment || !onUpdatePayment) return;

    const amount = parseFloat(paymentAmountInput.replace(/\D/g, '')) || 0;
    const total = quoteForPayment.adminQuote?.total || 0;
    const status: 'pendiente' | 'abono_parcial' | 'pagado_total' =
      amount <= 0
        ? 'pendiente'
        : amount >= total && total > 0
        ? 'pagado_total'
        : 'abono_parcial';

    onUpdatePayment(
      quoteForPayment.id,
      amount,
      status,
      paymentMethodInput,
      paymentNotesInput.trim()
    );

    setToastMessage(`✓ Pago de ${formatCurrency(amount)} registrado para ${quoteForPayment.folio}`);
    setTimeout(() => setToastMessage(null), 3500);
    setQuoteForPayment(null);
  };

  const handleAssignTechnician = (quote: QuoteRequest, techName: string) => {
    if (!techName) {
      if (onUnassignInstaller) {
        onUnassignInstaller(quote.id);
        setToastMessage(`Asignación retirada del folio ${quote.folio}`);
        setTimeout(() => setToastMessage(null), 3000);
      }
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
        assignmentNotes: 'Asignado desde Dashboard Recepción',
      });
      setToastMessage(`✓ ${quote.folio} asignado a ${tech.name}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleConfirmDelete = (quoteId: string, folio: string) => {
    onDeleteQuote(quoteId);
    setQuoteToDeleteId(null);
    setToastMessage(`Cotización ${folio} eliminada.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAndSendQuote = (
    quoteId: string,
    details: AdminQuoteDetails,
    nextAction?: 'client_screen' | 'email'
  ) => {
    onSaveAdminQuote(quoteId, details);
    setSelectedQuoteForEdit(null);

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

    setToastMessage(`¡Presupuesto ${cloneWithAdmin.folio} respondido y enviado a ${details.sentToEmail}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div id="view-admin-dashboard" className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="admin-toast-notification"
          className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-fade-in"
        >
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DASHBOARD TOP HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-3 py-0.5 rounded-full">
              PANTALLA DE CONTROL &bull; RECEPCIÓN ADMIN
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Central: <strong className="text-slate-800">rcv.informacion@gmail.com</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard de Recepción de Cotizaciones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Supervisa cotizaciones solicitadas, responde formalmente al correo del cliente, registra cuándo fueron aceptadas y controla el estado de pagos y recaudación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onNavigateToTechnicianOrders && (
            <button
              type="button"
              onClick={onNavigateToTechnicianOrders}
              className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Wrench className="w-4 h-4 text-sky-600" />
              <span>Pedidos Técnicos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToClient}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>Ir al Inicio</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveMainTab('quotes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === 'quotes'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Inbox className="w-4 h-4 text-sky-600" />
          <span>1. Cotizaciones & Presupuestos</span>
          {solicitadasCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
              {solicitadasCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('access_logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeMainTab === 'access_logs'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>2. Registro de Accesos y Conectividad en BD</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Firestore ({accessLogs.length})
          </span>
        </button>
      </div>

      {activeMainTab === 'quotes' && (
        <div className="space-y-6">
          {/* DASHBOARD 5 KPI METRICS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* CARD 1: COTIZACIONES SOLICITADAS */}
        <button
          type="button"
          onClick={() => setActiveFilter('solicitadas')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeFilter === 'solicitadas'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider block">
                1. Solicitadas
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {solicitadasCount}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-200/60 text-[11px] text-amber-900">
            <span className="font-bold block">Por responder al correo</span>
            <span className="text-slate-500 text-[10px]">Clic para ver lista</span>
          </div>
        </button>

        {/* CARD 2: COTIZACIONES RESPONDIDAS */}
        <button
          type="button"
          onClick={() => setActiveFilter('respondidas')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeFilter === 'respondidas'
              ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50/30 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-sky-800 uppercase tracking-wider block">
                2. Respondidas
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {respondidasCount}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-sky-200/60 text-[11px] text-sky-900">
            <span className="font-bold block">Presupuesto enviado</span>
            <span className="text-slate-500 text-[10px]">Registra cuándo fue aceptado</span>
          </div>
        </button>

        {/* CARD 3: COTIZACIONES ACEPTADAS */}
        <button
          type="button"
          onClick={() => setActiveFilter('aceptadas')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeFilter === 'aceptadas'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider block">
                3. Aceptadas
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {aceptadasCount}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900">
            <span className="font-bold block">Aprobadas por cliente</span>
            <span className="text-slate-500 text-[10px]">Con fecha y técnico</span>
          </div>
        </button>

        {/* CARD 4: TOTAL PAGADO */}
        <button
          type="button"
          onClick={() => setActiveFilter('pagadas')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeFilter === 'pagadas'
              ? 'bg-blue-500/10 border-blue-600 ring-2 ring-blue-500/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-blue-800 uppercase tracking-wider block">
                4. Total Pagado
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight truncate">
              {formatCurrency(totalPagado)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-blue-200/60 text-[11px] text-blue-900">
            <span className="font-bold block">Recaudado / Abonado</span>
            <span className="text-slate-500 text-[10px]">Abonos y pagos totales</span>
          </div>
        </button>

        {/* CARD 5: TOTAL PENDIENTE */}
        <button
          type="button"
          onClick={() => setActiveFilter('pendientes_pago')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeFilter === 'pendientes_pago'
              ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-rose-800 uppercase tracking-wider block">
                5. Total Pendiente
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight truncate">
              {formatCurrency(totalPendiente)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-rose-200/60 text-[11px] text-rose-900">
            <span className="font-bold block">Saldo por Cobrar</span>
            <span className="text-slate-500 text-[10px]">Pendiente de pago</span>
          </div>
        </button>
      </div>

      {/* FILTER & SEARCH BAR WITH SEGMENTED TABS */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3.5">
        {/* Search input */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, folio, correo o comuna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Segmented Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveFilter('solicitadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'solicitadas'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Solicitadas ({solicitadasCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('respondidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'respondidas'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Respondidas ({respondidasCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('aceptadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'aceptadas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aceptadas ({aceptadasCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pagadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'pagadas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pagadas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Todas ({quotes.length})</span>
          </button>
        </div>
      </div>

      {/* FILTER HIGHLIGHT BANNER: EXPLICIT INSTRUCTION FOR 'SOLICITADAS' */}
      {activeFilter === 'solicitadas' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Send className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Lista de Cotizaciones Solicitadas por Responder ({solicitadasCount})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
                El cliente completó sus medidas sin precio. Tu labor como administrador es evaluar las ventanas, fijar el valor definitivo y presionar <strong>«Responder y Enviar al Correo»</strong> para despachar la propuesta formal a su cuenta de Gmail.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-xl self-start sm:self-auto shrink-0">
            {solicitadasCount} pendientes de respuesta
          </span>
        </div>
      )}

      {/* MAIN LISTINGS TABLE / DRILLDOWN */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              No hay cotizaciones en esta categoría
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeFilter === 'solicitadas'
                ? '¡Excelente! Todas las solicitudes han sido respondidas.'
                : 'No se encontraron cotizaciones con los filtros o término de búsqueda seleccionado.'}
            </p>
            {activeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="mt-2 text-xs font-bold text-sky-700 hover:underline cursor-pointer"
              >
                Ver todas las cotizaciones
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQuotes.map((quote) => {
              const isPending = quote.status === 'pendiente';
              const isQuoted = quote.status === 'cotizada';
              const isAccepted = quote.status === 'aceptada';
              const adminQuote = quote.adminQuote;
              const isExpanded = expandedQuoteId === quote.id;
              const isConfirmingDelete = quoteToDeleteId === quote.id;

              const totalAmount = adminQuote?.total || 0;
              const paid =
                typeof quote.paidAmount === 'number'
                  ? quote.paidAmount
                  : quote.paymentStatus === 'pagado_total'
                  ? totalAmount
                  : quote.paymentStatus === 'abono_parcial'
                  ? Math.round(totalAmount * 0.5)
                  : 0;
              const pendingBalance = Math.max(0, totalAmount - paid);

              return (
                <div
                  key={quote.id}
                  id={`card-quote-item-${quote.id}`}
                  className={`p-5 sm:p-6 transition-colors ${
                    isPending ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* LEFT COLUMN: FOLIO, STATUS, CLIENT INFO */}
                    <div className="space-y-3 flex-1 min-w-0">
                      {/* Top metadata strip without pill clutter */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-sky-900 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                          {quote.folio}
                        </span>

                        <span className="text-slate-300">&bull;</span>

                        {isPending && (
                          <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Solicitada (Sin responder)
                          </span>
                        )}

                        {isQuoted && (
                          <span className="font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Respondida (Esperando confirmación)
                          </span>
                        )}

                        {isAccepted && (
                          <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Aceptada por Cliente
                          </span>
                        )}

                        <span className="text-slate-300">&bull;</span>

                        <span className="text-slate-500 text-[11px]">
                          Ingresada el{' '}
                          {new Date(quote.createdAt).toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Client main details */}
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {quote.clientName}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                          <a
                            href={`mailto:${quote.clientEmail}`}
                            className="flex items-center gap-1 text-sky-700 hover:underline font-semibold"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{quote.clientEmail}</span>
                          </a>

                          <a
                            href={`tel:${quote.clientPhone}`}
                            className="flex items-center gap-1 text-slate-700 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{quote.clientPhone}</span>
                          </a>

                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {quote.clientCity} &bull; {quote.clientAddress}
                            </span>
                          </span>

                          <span className="flex items-center gap-1 text-slate-500">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="capitalize">{quote.propertyType}</span>
                          </span>
                        </div>
                      </div>

                      {/* Windows summary and requested dates */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold text-slate-800">
                            <strong>{quote.windows.length}</strong> ventana(s) &bull;{' '}
                            <strong>{quote.totalAreaM2.toFixed(2)} m²</strong> de malla
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                            className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                          >
                            <span>{isExpanded ? 'Ocultar medidas' : 'Ver detalle de ventanas'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Expandable windows table */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-200 space-y-1.5 animate-fade-in">
                            {quote.windows.map((win, i) => (
                              <div
                                key={win.id || i}
                                className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-[11px]"
                              >
                                <span className="font-semibold text-slate-800">
                                  #{i + 1} {win.name}
                                </span>
                                <span className="text-slate-600">
                                  {win.height}m alto &times; {win.width}m ancho ({win.area} m²)
                                </span>
                                <span className="text-slate-500 capitalize">{win.meshType}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tentative dates requested by client */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-slate-500">Fecha tentativa 1:</span>{' '}
                            <strong className="text-slate-800">
                              {quote.tentativeDate1 || 'A coordinar'}
                            </strong>{' '}
                            a las {quote.tentativeTime1 || '10:00'} hrs
                          </div>
                          <div>
                            <span className="text-slate-500">Fecha tentativa 2:</span>{' '}
                            <strong className="text-slate-800">
                              {quote.tentativeDate2 || 'A coordinar'}
                            </strong>{' '}
                            a las {quote.tentativeTime2 || '15:30'} hrs
                          </div>
                        </div>

                        {quote.clientComments && (
                          <div className="text-[11px] text-slate-600 italic pt-1">
                            &ldquo;{quote.clientComments}&rdquo;
                          </div>
                        )}
                      </div>

                      {/* REGISTRO DE CUÁNDO FUE RESPONDIDO Y CUÁNDO FUE ACEPTADO */}
                      <div className="space-y-1.5 text-xs">
                        {adminQuote?.sentAt ? (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-sky-600" />
                            <span>
                              <strong>Respondido al correo:</strong>{' '}
                              {new Date(adminQuote.sentAt).toLocaleString('es-CL', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}{' '}
                              a <span className="underline">{adminQuote.sentToEmail || quote.clientEmail}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Aún no se ha respondido formalmente al cliente.</span>
                          </div>
                        )}

                        {/* CUÁNDO FUE ACEPTADO */}
                        {quote.acceptedAt ? (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>
                                Aceptada formalmente por el cliente el{' '}
                                {new Date(quote.acceptedAt).toLocaleString('es-CL', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </span>
                          </div>
                        ) : isQuoted ? (
                          <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-[11px]">
                            <span className="text-slate-600">
                              ¿El cliente ya confirmó y aceptó esta cotización?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRegisterAcceptance(quote)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Registrar Aceptación</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: FINANCIAL / TECHNICIAN / PRIMARY ACTIONS */}
                    <div className="w-full lg:w-72 shrink-0 space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                      {/* Financial info */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          Presupuesto y Cobranza
                        </span>

                        {adminQuote ? (
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-xs text-slate-500">Valor Cotizado:</span>
                              <span className="text-lg font-black text-slate-900">
                                {formatCurrency(totalAmount)}
                              </span>
                            </div>

                            {/* Payment breakdown */}
                            <div className="pt-2 border-t border-slate-200/80 space-y-1 text-xs">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Total Pagado:</span>
                                <span className="font-bold text-emerald-700">
                                  {formatCurrency(paid)}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500">Saldo Pendiente:</span>
                                <span className="font-bold text-rose-700">
                                  {formatCurrency(pendingBalance)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenPaymentModal(quote)}
                                className="w-full mt-1.5 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-sky-600" />
                                <span>
                                  {paid > 0 ? 'Actualizar Pago' : 'Registrar Pago / Abono'}
                                </span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2">
                            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg block text-center">
                              Sin precio (Cliente cotizando)
                            </span>
                            <p className="text-[10px] text-slate-500 text-center mt-1">
                              Debes fijar el valor al responder.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Technician assignment for quoted or accepted orders */}
                      {(isQuoted || isAccepted) && (
                        <div className="pt-2 border-t border-slate-200 space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            Técnico Asignado
                          </label>
                          <select
                            value={quote.installerAssignment?.technicianName || ''}
                            onChange={(e) => handleAssignTechnician(quote, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-sky-500"
                          >
                            <option value="">(Sin asignar)</option>
                            {FOUR_TECHNICIANS.map((tech) => (
                              <option key={tech.name} value={tech.name}>
                                {tech.name} ({tech.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* PRIMARY ACTION BUTTONS */}
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        {isPending ? (
                          /* BOTÓN PRIORITARIO: RESPONDER Y ENVIAR AL CORREO */
                          <button
                            type="button"
                            onClick={() => handleOpenRespondModal(quote)}
                            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer duration-150 hover:scale-[1.01]"
                          >
                            <Send className="w-4 h-4 stroke-[2.5]" />
                            <span>Responder y Enviar al Correo</span>
                          </button>
                        ) : (
                          /* ACCIONES PARA COTIZACIONES YA RESPONDIDAS */
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEmailPreview(quote)}
                              className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Ver / Reenviar al Correo</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenRespondModal(quote)}
                              className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                              <span>Modificar Presupuesto</span>
                            </button>
                          </div>
                        )}

                        {/* DELETE BUTTON */}
                        <div className="flex justify-end pt-1">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1 text-[11px] animate-fade-in">
                              <span className="text-rose-600 font-bold">¿Eliminar?</span>
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(quote.id, quote.folio)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuoteToDeleteId(null)}
                                className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setQuoteToDeleteId(quote.id)}
                              className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar registro</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
      )}

      {/* TAB 2: REGISTRO DE ACCESOS Y CONECTIVIDAD EN BD (FIRESTORE) */}
      {activeMainTab === 'access_logs' && (
        <div className="space-y-6 animate-fade-in">
          {/* BANNER WITH FIRESTORE STATUS & REFRESH ACTION */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                <Database className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Registro de Accesos y Conectividad en Base de Datos
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Firebase Firestore Activo
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                  Historial en tiempo real de cada acceso de usuarios, hora de conectividad y cotizaciones realizadas. Almacenado permanentemente en la colección <code className="text-sky-900 font-mono font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">access_logs</code> de Firebase Firestore.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleRefreshAccessLogs}
                disabled={isSyncingLogs}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLogs ? 'animate-spin' : ''}`} />
                <span>{isSyncingLogs ? 'Sincronizando con BD...' : 'Sincronizar con Firestore'}</span>
              </button>
            </div>
          </div>

          {/* 4 SUMMARY METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  1. Total Accesos Registrados
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{totalConnections}</div>
              <p className="text-[11px] text-slate-400 mt-1">Conexiones guardadas en BD</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  2. Usuarios Únicos
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{uniqueUsersCount}</div>
              <p className="text-[11px] text-slate-400 mt-1">Correos distintos con sesiones</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  3. Cotizaciones Realizadas
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Inbox className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-700">{quotesDoneInLogs}</div>
              <p className="text-[11px] text-slate-400 mt-1">Cotizaciones registradas en accesos</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  4. Última Conexión
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {latestLog
                  ? new Date(latestLog.connectedAt).toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'Sin registros'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {latestLog
                  ? new Date(latestLog.connectedAt).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3.5">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por usuario, correo, folio o acción..."
                value={accessLogSearch}
                onChange={(e) => setAccessLogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setAccessLogFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  accessLogFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({accessLogs.length})
              </button>

              <button
                type="button"
                onClick={() => setAccessLogFilter('quote_created')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  accessLogFilter === 'quote_created'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Cotizaciones Realizadas</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessLogFilter('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  accessLogFilter === 'admin'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Administradores</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessLogFilter('tecnico')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  accessLogFilter === 'tecnico'
                    ? 'bg-sky-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Técnicos</span>
              </button>

              <button
                type="button"
                onClick={() => setAccessLogFilter('cliente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  accessLogFilter === 'cliente'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Clientes</span>
              </button>
            </div>
          </div>

          {/* TABLE OF ACCESS LOGS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredAccessLogs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Database className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  No se encontraron registros de conectividad
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No hay eventos registrados que coincidan con el filtro seleccionado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Hora de Conectividad</th>
                      <th className="py-3.5 px-4">Usuario & Rol</th>
                      <th className="py-3.5 px-4">Actividad Registrada</th>
                      <th className="py-3.5 px-4">Cotizaciones Realizadas</th>
                      <th className="py-3.5 px-4">Dispositivo</th>
                      <th className="py-3.5 px-4 text-right">Base de Datos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccessLogs.map((log) => {
                      const dateObj = new Date(log.connectedAt);
                      const formattedDate = dateObj.toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const formattedTime = dateObj.toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });

                      const minutesAgo = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60));
                      let relativeText = 'Hace un momento';
                      if (minutesAgo >= 60 * 24) {
                        relativeText = `Hace ${Math.floor(minutesAgo / (60 * 24))} días`;
                      } else if (minutesAgo >= 60) {
                        relativeText = `Hace ${Math.floor(minutesAgo / 60)}h`;
                      } else if (minutesAgo > 1) {
                        relativeText = `Hace ${minutesAgo} min`;
                      }

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* 1. HORA DE CONECTIVIDAD */}
                          <td className="py-4 px-4 align-top whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900">{formattedTime}</div>
                            <div className="text-[11px] text-slate-500">{formattedDate}</div>
                            <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {relativeText}
                            </span>
                          </td>

                          {/* 2. USUARIO & CORREO & ROL */}
                          <td className="py-4 px-4 align-top">
                            <div className="font-bold text-slate-900">{log.userName}</div>
                            <div className="text-[11px] text-slate-500">{log.userEmail}</div>
                            <div className="mt-1">
                              {log.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-sky-100 text-sky-800">
                                  <Shield className="w-3 h-3 text-sky-600" /> Administrador
                                </span>
                              ) : log.role === 'tecnico' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                                  <Wrench className="w-3 h-3 text-indigo-600" /> Técnico
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                                  <UserCheck className="w-3 h-3 text-slate-500" /> Cliente
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. ACTIVIDAD REGISTRADA */}
                          <td className="py-4 px-4 align-top max-w-xs">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-0.5">
                              {log.action === 'login' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <LogIn className="w-3.5 h-3.5" /> Inicio de Sesión
                                </span>
                              ) : log.action === 'quote_created' ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                                  <Inbox className="w-3.5 h-3.5" /> Cotización Realizada
                                </span>
                              ) : log.action === 'logout' ? (
                                <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                                  <LogOut className="w-3.5 h-3.5" /> Cierre de Sesión
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-sky-700 font-bold">
                                  <Activity className="w-3.5 h-3.5" /> Conexión Activa
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {log.actionDescription}
                            </p>
                          </td>

                          {/* 4. COTIZACIONES REALIZADAS */}
                          <td className="py-4 px-4 align-top">
                            {log.quoteFolios && log.quoteFolios.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold text-amber-800">
                                  {log.quoteFolios.length} {log.quoteFolios.length === 1 ? 'cotización' : 'cotizaciones'}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {log.quoteFolios.map((folio) => (
                                    <span
                                      key={folio}
                                      className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md"
                                    >
                                      {folio}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                Sin cotizaciones en este acceso
                              </span>
                            )}
                          </td>

                          {/* 5. DISPOSITIVO */}
                          <td className="py-4 px-4 align-top whitespace-nowrap text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Laptop className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.deviceInfo || 'Navegador Web'}</span>
                            </div>
                          </td>

                          {/* 6. BASE DE DATOS FIRESTORE */}
                          <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Database className="w-3 h-3 text-emerald-600" />
                              Firestore ✓
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK PAYMENT REGISTRATION MODAL */}
      {quoteForPayment && (
        <div
          id="modal-payment-record-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in"
          onClick={() => setQuoteForPayment(null)}
        >
          <div
            id="modal-payment-record-container"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto p-6 space-y-5 animate-scale-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Registrar / Actualizar Pago</h3>
                  <p className="text-xs text-slate-500">Folio: {quoteForPayment.folio} &bull; {quoteForPayment.clientName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuoteForPayment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Presupuesto total formal:</span>
                <span className="text-base font-black text-slate-900">
                  {formatCurrency(quoteForPayment.adminQuote?.total || 0)}
                </span>
              </div>

              {/* Quick amount shortcuts */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Monto Recaudado / Pagado ($ CLP)
                </label>
                <input
                  type="text"
                  required
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  placeholder="Ej: 125000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-hidden focus:border-sky-500"
                />

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const total = quoteForPayment.adminQuote?.total || 0;
                      setPaymentAmountInput(String(Math.round(total * 0.5)));
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-[11px] border border-sky-200 transition-colors"
                  >
                    Abono 50% ({formatCurrency(Math.round((quoteForPayment.adminQuote?.total || 0) * 0.5))})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const total = quoteForPayment.adminQuote?.total || 0;
                      setPaymentAmountInput(String(total));
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors"
                  >
                    Total 100% ({formatCurrency(quoteForPayment.adminQuote?.total || 0)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Medio de Pago Utilizado
                </label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-sky-500 bg-white"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="WebPay Débito">WebPay Débito</option>
                  <option value="WebPay Crédito">WebPay Crédito</option>
                  <option value="Efectivo en Terreno">Efectivo en Terreno</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notas de Pago (Opcional)
                </label>
                <input
                  type="text"
                  value={paymentNotesInput}
                  onChange={(e) => setPaymentNotesInput(e.target.value)}
                  placeholder="Ej: Comprobante 49281 transferido al Banco Estado"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuoteForPayment(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-xs cursor-pointer"
                >
                  Guardar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT & RESPOND TO QUOTE MODAL */}
      {selectedQuoteForEdit && (
        <AdminQuoteEditorModal
          quote={selectedQuoteForEdit}
          onClose={() => setSelectedQuoteForEdit(null)}
          onSaveAndSend={handleSaveAndSendQuote}
        />
      )}

      {/* EMAIL PREVIEW AND GMAIL DIRECT OPEN MODAL */}
      {selectedQuoteForEmail && (
        <EmailPreviewModal
          quote={selectedQuoteForEmail}
          onClose={() => setSelectedQuoteForEmail(null)}
          onViewClientScreen={() => {
            setSelectedQuoteForEmail(null);
            if (onNavigateToClientQuoteScreen) {
              onNavigateToClientQuoteScreen(selectedQuoteForEmail);
            }
          }}
          onViewReceivedList={() => setSelectedQuoteForEmail(null)}
        />
      )}
    </div>
  );
};
