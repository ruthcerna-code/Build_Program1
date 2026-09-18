import React, { useState } from 'react';
import {
  CheckCircle2,
  UserCheck,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  Wrench,
  AlertCircle,
  Truck,
  Check,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  ArrowRight
} from 'lucide-react';
import { QuoteRequest, InstallerAssignment } from '../types';
import { formatCurrency } from '../services/quoteStorage';

interface ApprovedQuotesViewProps {
  quotes: QuoteRequest[];
  onAssignInstaller: (quoteId: string, assignment: InstallerAssignment) => void;
  onNavigateToQuotes?: () => void;
  onNavigateToTechnicianOrders?: () => void;
}

// Pre-defined suggestions of installers
const PRESET_TECHNICIANS = [
  { name: 'Claudio Soto', phone: '+56 9 7123 4567', role: 'Técnico Especialista en Altura' },
  { name: 'Rodrigo Espinoza', phone: '+56 9 8234 5678', role: 'Instalador Certificado Senior' },
  { name: 'Matías Valenzuela', phone: '+56 9 9345 6789', role: 'Técnico de Redes y Fijaciones' },
  { name: 'Equipo Cuadrilla Móvil #1', phone: '+56 9 6456 7890', role: 'Instalaciones Urgentes' },
];

export const ApprovedQuotesView: React.FC<ApprovedQuotesViewProps> = ({
  quotes,
  onAssignInstaller,
  onNavigateToQuotes,
  onNavigateToTechnicianOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sin_asignar' | 'asignado' | 'instalado'>('all');
  const [selectedQuoteForAssign, setSelectedQuoteForAssign] = useState<QuoteRequest | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  // Form state for assignment modal
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techRole, setTechRole] = useState('Instalador Certificado');
  const [installStatus, setInstallStatus] = useState<'por_instalar' | 'en_camino' | 'instalado'>('por_instalar');
  const [notes, setNotes] = useState('');

  // Quotes approved by client
  const approvedQuotes = quotes.filter((q) => q.status === 'aceptada');

  const filteredQuotes = approvedQuotes.filter((q) => {
    const matchesSearch =
      q.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.installerAssignment?.technicianName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const hasAssignment = !!q.installerAssignment;
    const isInstalado = q.installerAssignment?.installationStatus === 'instalado';

    let matchesFilter = true;
    if (statusFilter === 'sin_asignar') matchesFilter = !hasAssignment;
    if (statusFilter === 'asignado') matchesFilter = hasAssignment && !isInstalado;
    if (statusFilter === 'instalado') matchesFilter = isInstalado;

    return matchesSearch && matchesFilter;
  });

  // KPIs
  const totalApproved = approvedQuotes.length;
  const assignedCount = approvedQuotes.filter((q) => !!q.installerAssignment).length;
  const pendingAssignCount = approvedQuotes.filter((q) => !q.installerAssignment).length;
  const totalM2ToInstall = approvedQuotes.reduce((sum, q) => sum + q.totalAreaM2, 0);

  const handleOpenAssignModal = (quote: QuoteRequest) => {
    setSelectedQuoteForAssign(quote);
    if (quote.installerAssignment) {
      setTechName(quote.installerAssignment.technicianName);
      setTechPhone(quote.installerAssignment.technicianPhone);
      setTechRole(quote.installerAssignment.technicianRole || 'Instalador Certificado');
      setInstallStatus(quote.installerAssignment.installationStatus);
      setNotes(quote.installerAssignment.assignmentNotes || '');
    } else {
      setTechName(PRESET_TECHNICIANS[0].name);
      setTechPhone(PRESET_TECHNICIANS[0].phone);
      setTechRole(PRESET_TECHNICIANS[0].role);
      setInstallStatus('por_instalar');
      setNotes('Llevar arnés certificado para trabajo en altura y tarugos expansivos.');
    }
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteForAssign) return;

    const assignment: InstallerAssignment = {
      technicianName: techName.trim() || 'Técnico Asignado',
      technicianPhone: techPhone.trim() || '+56 9 8000 2400',
      technicianRole: techRole.trim(),
      assignedAt: new Date().toISOString(),
      installationStatus: installStatus,
      assignmentNotes: notes.trim(),
    };

    onAssignInstaller(selectedQuoteForAssign.id, assignment);
    setSelectedQuoteForAssign(null);
  };

  const toggleExpandDetails = (id: string) => {
    setExpandedDetailsId((prev) => (prev === id ? null : id));
  };

  return (
    <div id="view-approved-quotes" className="space-y-8 pb-16 animate-fade-in">
      {/* Header and Statistics */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>GESTIÓN DE INSTALACIONES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cotizaciones Aprobadas & Asignación
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Aquí puedes revisar detalladamente qué aceptó el cliente (medidas, ventanas, valores y fecha acordada) y asignar una persona para realizar la instalación.
            </p>
            {onNavigateToTechnicianOrders && (
              <div className="pt-2">
                <button
                  id="btn-go-to-technicians-from-approved"
                  type="button"
                  onClick={onNavigateToTechnicianOrders}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200 transition-colors"
                >
                  <span>Ir a Recepción de Técnicos (Pantalla 5)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center min-w-28">
              <span className="text-xs text-slate-500 block font-medium">Aprobadas</span>
              <span className="text-2xl font-black text-emerald-700">{totalApproved}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center min-w-28">
              <span className="text-xs text-slate-500 block font-medium">Por Asignar</span>
              <span className="text-2xl font-black text-amber-700">{pendingAssignCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-center min-w-28">
              <span className="text-xs text-slate-500 block font-medium">Total Malla</span>
              <span className="text-xl font-black text-sky-700">{totalM2ToInstall.toFixed(1)} m²</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-approved-quotes"
              type="text"
              placeholder="Buscar por cliente, folio, instalador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 bg-white text-slate-800 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas ({approvedQuotes.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('sin_asignar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === 'sin_asignar'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Por Asignar ({pendingAssignCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('asignado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === 'asignado'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
              }`}
            >
              Asignadas ({assignedCount})
            </button>
          </div>
        </div>
      </div>

      {/* APPROVED QUOTES LIST */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              No hay cotizaciones aprobadas con este filtro
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Las cotizaciones enviadas al cliente pueden ser aprobadas desde la vista de consulta o marcadas como aceptadas.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuotes.map((quote) => {
            const adminQuote = quote.adminQuote;
            const assignment = quote.installerAssignment;
            const isExpanded = expandedDetailsId === quote.id;

            const confirmedDate =
              adminQuote?.confirmedInstallationDate || quote.tentativeDate1;
            const confirmedTime =
              adminQuote?.confirmedInstallationTime || quote.tentativeTime1;

            return (
              <div
                key={quote.id}
                id={`approved-card-${quote.id}`}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all space-y-6"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      {quote.folio}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Aprobada por el Cliente
                    </span>
                    {quote.acceptedAt && (
                      <span className="text-xs text-slate-400">
                        Aprobada el:{' '}
                        {new Date(quote.acceptedAt).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {/* Status of installation badge */}
                  <div>
                    {assignment ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          assignment.installationStatus === 'instalado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : assignment.installationStatus === 'en_camino'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {assignment.installationStatus === 'instalado' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        {assignment.installationStatus === 'en_camino' && <Truck className="w-3.5 h-3.5 text-sky-600" />}
                        {assignment.installationStatus === 'por_instalar' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        <span>
                          {assignment.installationStatus === 'instalado'
                            ? 'Instalado con Éxito'
                            : assignment.installationStatus === 'en_camino'
                            ? 'En Camino / En Ruta'
                            : 'Asignado (Por Instalar)'}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Sin Técnico Asignado
                      </span>
                    )}
                  </div>
                </div>

                {/* Main 2-Column Grid: Left = Qué Aceptó el Cliente, Right = Asignación de Instalador */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT: QUÉ ACEPTÓ EL CLIENTE (7 cols) */}
                  <div className="lg:col-span-7 bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs text-slate-700">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-sky-600" />
                        Qué aceptó el cliente
                      </h3>
                      <span className="font-mono text-xs font-bold text-sky-700">
                        {quote.windows.length} ventana(s) &bull; {quote.totalAreaM2} m²
                      </span>
                    </div>

                    {/* Client data */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Cliente</span>
                        <strong className="text-slate-900">{quote.clientName}</strong>
                        <p className="text-slate-500">{quote.clientEmail}</p>
                        <p className="text-slate-500 font-semibold">{quote.clientPhone}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Dirección de Instalación</span>
                        <strong className="text-slate-900">{quote.clientAddress}</strong>
                        <p className="text-slate-500">{quote.clientCity} ({quote.propertyType})</p>
                      </div>
                    </div>

                    {/* Schedule accepted */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                        <div>
                          <span className="text-[11px] text-amber-800 font-medium block">
                            Fecha y Hora Acordada para Instalar:
                          </span>
                          <strong className="text-slate-900 text-xs">
                            📅 {confirmedDate || 'A convenir'} &bull; ⏰ {confirmedTime || '10:00'} hrs
                          </strong>
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                        Confirmado
                      </span>
                    </div>

                    {/* Financial total */}
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-600">Valor Final Acordado:</span>
                      <span className="text-lg font-black text-slate-900">
                        {adminQuote ? formatCurrency(adminQuote.total) : 'A convenir'}
                      </span>
                    </div>

                    {/* Collapsible Windows Details */}
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExpandDetails(quote.id)}
                        className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Ocultar desglose de ventanas' : 'Ver desglose de ventanas'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                              <tr>
                                <th className="py-2 px-3">Ubicación</th>
                                <th className="py-2 px-3">Medidas</th>
                                <th className="py-2 px-3">M²</th>
                                <th className="py-2 px-3">Malla</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {quote.windows.map((w) => (
                                <tr key={w.id}>
                                  <td className="py-2 px-3 font-semibold text-slate-800">{w.name}</td>
                                  <td className="py-2 px-3 font-mono">{w.height}m &times; {w.width}m</td>
                                  <td className="py-2 px-3 font-bold text-sky-700">{w.area} m²</td>
                                  <td className="py-2 px-3 capitalize">{w.meshType}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: ASIGNACIÓN DE INSTALADOR (5 cols) */}
                  <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench className="w-4 h-4 text-emerald-600" />
                        Técnico / Instalador Asignado
                      </h3>
                      {assignment && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(quote)}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-800"
                        >
                          Modificar
                        </button>
                      )}
                    </div>

                    {assignment ? (
                      <div className="space-y-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[11px] text-slate-400 block font-medium">Instalador Responsable</span>
                              <strong className="text-sm text-slate-900">{assignment.technicianName}</strong>
                              <p className="text-slate-500 font-medium text-[11px]">{assignment.technicianRole}</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                              <UserCheck className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex items-center gap-2 text-slate-700 font-semibold">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{assignment.technicianPhone}</span>
                          </div>
                        </div>

                        {/* Notes for installation */}
                        {assignment.assignmentNotes && (
                          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-slate-700 text-xs">
                            <span className="text-[11px] font-bold text-sky-900 block mb-0.5">
                              Instrucciones de Instalación:
                            </span>
                            <p className="italic">&ldquo;{assignment.assignmentNotes}&rdquo;</p>
                          </div>
                        )}

                        {/* Quick Update Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(quote)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Actualizar Estado o Cambiar Técnico</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                          <Wrench className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">
                            Pendiente de Asignar Personal
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                            Asigna un instalador certificado para coordinar los materiales y la visita técnica.
                          </p>
                        </div>
                        <button
                          id={`btn-assign-installer-${quote.id}`}
                          type="button"
                          onClick={() => handleOpenAssignModal(quote)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Asignar Instalador Ahora</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ASIGNAR O ACTUALIZAR INSTALADOR */}
      {selectedQuoteForAssign && (
        <div
          id="modal-assign-installer-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in"
        >
          <div
            id="modal-assign-installer-container"
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Asignar Instalador &bull; {selectedQuoteForAssign.folio}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cliente: {selectedQuoteForAssign.clientName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuoteForAssign(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4 text-xs">
              {/* Quick Select Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Técnicos Disponibles en Cuadrilla (Sugerencias):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_TECHNICIANS.map((tech) => (
                    <button
                      key={tech.name}
                      type="button"
                      onClick={() => {
                        setTechName(tech.name);
                        setTechPhone(tech.phone);
                        setTechRole(tech.role);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        techName === tech.name
                          ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-bold text-xs">{tech.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{tech.role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Technician Name Input */}
              <div>
                <label htmlFor="input-tech-name" className="block font-semibold text-slate-700 mb-1">
                  Nombre del Instalador / Responsable
                </label>
                <input
                  id="input-tech-name"
                  type="text"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="Ej: Claudio Soto"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Technician Phone Input */}
              <div>
                <label htmlFor="input-tech-phone" className="block font-semibold text-slate-700 mb-1">
                  Teléfono / WhatsApp del Técnico
                </label>
                <input
                  id="input-tech-phone"
                  type="text"
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                  placeholder="Ej: +56 9 7123 4567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Installation Status */}
              <div>
                <label htmlFor="select-install-status" className="block font-semibold text-slate-700 mb-1">
                  Estado de la Instalación
                </label>
                <select
                  id="select-install-status"
                  value={installStatus}
                  onChange={(e) => setInstallStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:border-emerald-500 outline-none"
                >
                  <option value="por_instalar">Por Instalar (Asignado a Cuadrilla)</option>
                  <option value="en_camino">En Camino / En Ruta al Domicilio</option>
                  <option value="instalado">Instalado con Éxito (Completado)</option>
                </select>
              </div>

              {/* Notes for installer */}
              <div>
                <label htmlFor="textarea-assign-notes" className="block font-semibold text-slate-700 mb-1">
                  Instrucciones o Herramientas Específicas
                </label>
                <textarea
                  id="textarea-assign-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Llevar escalera telescópica y fijaciones para cielo de balcón."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuoteForAssign(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-assignment-submit"
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
                >
                  Guardar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
