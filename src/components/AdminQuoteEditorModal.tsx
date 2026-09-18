import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Calculator,
  Mail,
  User,
  Phone,
  MapPin,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  DollarSign,
  Calendar
} from 'lucide-react';
import { QuoteRequest, AdminQuoteDetails, ScheduleOption } from '../types';
import { formatCurrency } from '../services/quoteStorage';

interface AdminQuoteEditorModalProps {
  quote: QuoteRequest;
  onClose: () => void;
  onSaveAndSend: (
    quoteId: string,
    details: AdminQuoteDetails,
    nextAction?: 'client_screen' | 'email'
  ) => void;
}

export const AdminQuoteEditorModal: React.FC<AdminQuoteEditorModalProps> = ({
  quote,
  onClose,
  onSaveAndSend,
}) => {
  // Existing values if previously quoted, else sensible industry defaults
  const existing = quote.adminQuote;

  const [isManualTotalMode, setIsManualTotalMode] = useState<boolean>(
    existing ? true : false
  );
  const [manualTotal, setManualTotal] = useState<number>(
    existing
      ? existing.total
      : Math.round(quote.totalAreaM2 * 22000 + 45000)
  );

  const [pricePerM2, setPricePerM2] = useState<number>(existing ? existing.pricePerM2 : 18500);
  const [profilesAndFixingsCost, setProfilesAndFixingsCost] = useState<number>(
    existing ? existing.profilesAndFixingsCost : Math.max(20000, Math.round(quote.windows.length * 9000))
  );
  const [laborAndInstallCost, setLaborAndInstallCost] = useState<number>(
    existing ? existing.laborAndInstallCost : Math.max(30000, Math.round(quote.totalAreaM2 * 5000))
  );
  const [discountPercentage, setDiscountPercentage] = useState<number>(
    existing ? existing.discountPercentage : quote.windows.length >= 3 ? 10 : 0
  );
  const [includeTax, setIncludeTax] = useState<boolean>(existing ? existing.includeTax : true);
  const [warrantyYears, setWarrantyYears] = useState<number>(existing ? existing.warrantyYears : 2);
  const [estimatedTime, setEstimatedTime] = useState<string>(
    existing ? existing.estimatedTime : '2 a 3 horas de trabajo'
  );
  const [adminNotes, setAdminNotes] = useState<string>(
    existing
      ? existing.adminNotes
      : 'Incluye perfiles de aluminio blanco anodizado, pernos y tarugos Fischer de alta tenacidad, limpieza posterior y prueba de tensión.'
  );

  // Schedule acceptance and modifiable date/time state
  const defaultScheduleOption: ScheduleOption =
    existing?.selectedScheduleOption || 'opcion_1';
  const defaultDate =
    existing?.confirmedInstallationDate ||
    quote.tentativeDate1 ||
    new Date().toISOString().split('T')[0];
  const defaultTime =
    existing?.confirmedInstallationTime ||
    quote.tentativeTime1 ||
    '10:00';

  const [selectedScheduleOption, setSelectedScheduleOption] =
    useState<ScheduleOption>(defaultScheduleOption);
  const [confirmedDate, setConfirmedDate] = useState<string>(defaultDate);
  const [confirmedTime, setConfirmedTime] = useState<string>(defaultTime);

  const [isSending, setIsSending] = useState(false);

  // Calculations from breakdown
  const meshTotalCost = Math.round(quote.totalAreaM2 * pricePerM2);
  const grossSum = meshTotalCost + profilesAndFixingsCost + laborAndInstallCost;
  const discountAmount = Math.round((grossSum * discountPercentage) / 100);
  const netSubtotal = grossSum - discountAmount;
  const taxAmount = includeTax ? Math.round(netSubtotal * 0.19) : 0;
  const calculatedTotal = netSubtotal + taxAmount;

  // Final total depending on mode
  const effectiveTotal = isManualTotalMode ? manualTotal : calculatedTotal;

  const handleSend = (nextAction: 'client_screen' | 'email') => {
    setIsSending(true);

    const details: AdminQuoteDetails = {
      pricePerM2,
      meshTotalCost: isManualTotalMode ? Math.round(manualTotal * 0.6) : meshTotalCost,
      profilesAndFixingsCost: isManualTotalMode ? Math.round(manualTotal * 0.15) : profilesAndFixingsCost,
      laborAndInstallCost: isManualTotalMode ? Math.round(manualTotal * 0.25) : laborAndInstallCost,
      discountPercentage: isManualTotalMode ? 0 : discountPercentage,
      discountAmount: isManualTotalMode ? 0 : discountAmount,
      subtotal: effectiveTotal,
      includeTax,
      taxAmount: includeTax ? Math.round(effectiveTotal * 0.19) : 0,
      total: effectiveTotal,
      warrantyYears,
      estimatedTime,
      adminNotes: adminNotes.trim(),
      sentAt: new Date().toISOString(),
      sentToEmail: quote.clientEmail,
      selectedScheduleOption,
      confirmedInstallationDate: confirmedDate,
      confirmedInstallationTime: confirmedTime,
    };

    setTimeout(() => {
      setIsSending(false);
      onSaveAndSend(quote.id, details, nextAction);
    }, 400);
  };

  return (
    <div
      id="modal-admin-quote-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      <div
        id="modal-admin-quote-container"
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Entregar Cotización &bull; Folio {quote.folio}
                </h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  {quote.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Completa el valor oficial para despacharlo directamente al correo del usuario
              </p>
            </div>
          </div>

          <button
            id="btn-close-admin-editor"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* CLIENT SUMMARY BAR */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Cliente
              </span>
              <span className="font-bold text-slate-900 text-sm">{quote.clientName}</span>
              <span className="text-slate-500 block capitalize">{quote.propertyType}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Correo Registrado (Envío)
              </span>
              <span className="font-bold text-sky-700 text-sm break-all">{quote.clientEmail}</span>
              <span className="text-slate-500 block">Tel: {quote.clientPhone}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Ubicación
              </span>
              <span className="font-semibold text-slate-800 text-sm">{quote.clientCity}</span>
              <span className="text-slate-500 block">{quote.clientAddress}</span>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Total Ventanas y Superficie
              </span>
              <span className="font-black text-sky-600 text-sm">
                {quote.windows.length} ventana(s) &bull; {quote.totalAreaM2} m²
              </span>
              <span className="text-slate-500 block text-[11px]">
                Recibida el {new Date(quote.createdAt).toLocaleDateString('es-CL')}
              </span>
            </div>
          </div>

          {quote.clientComments && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <span className="font-bold">Comentario del cliente:</span>
              <span>{quote.clientComments}</span>
            </div>
          )}

          {/* REQUESTED WINDOWS DETAILS TABLE */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ventanas ingresadas por el cliente:
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Ubicación / Ventana</th>
                    <th className="py-2.5 px-3">Medidas (Alto &times; Ancho)</th>
                    <th className="py-2.5 px-3">Superficie</th>
                    <th className="py-2.5 px-3">Tipo de Malla</th>
                    <th className="py-2.5 px-3">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quote.windows.map((w, index) => (
                    <tr key={w.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{w.name}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {w.height}m &times; {w.width}m
                      </td>
                      <td className="py-2.5 px-3 font-bold text-sky-600">{w.area} m²</td>
                      <td className="py-2.5 px-3 capitalize text-slate-700">{w.meshType}</td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{w.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ADMIN QUOTATION COMPLETION FORM */}
          <div className="bg-sky-50/40 rounded-2xl p-5 border border-sky-200/80 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Cambiar y Fijar el Valor de la Cotización
                </h4>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-600">
                  Modo de edición:
                </span>
                <button
                  type="button"
                  onClick={() => setIsManualTotalMode(!isManualTotalMode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    isManualTotalMode
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isManualTotalMode ? '✏️ Valor Total Directo' : '📐 Desglose Detallado'}
                </button>
              </div>
            </div>

            {/* DIRECT TOTAL VALUE INPUT SECTION */}
            {isManualTotalMode ? (
              <div className="bg-white rounded-2xl p-5 border-2 border-sky-500 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Valor Total de la Cotización ($ CLP)
                    </label>
                    <p className="text-xs text-slate-500">
                      Puedes escribir directamente el monto total que deseas cobrar al cliente:
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400">$</span>
                    <input
                      id="input-manual-total-quote"
                      type="number"
                      min="10000"
                      step="5000"
                      value={manualTotal}
                      onChange={(e) => setManualTotal(Math.max(0, Number(e.target.value)))}
                      className="w-48 px-3.5 py-2 rounded-xl border-2 border-sky-500 text-xl font-black text-sky-700 bg-sky-50/50 outline-none focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                </div>

                {/* Quick adjustment buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-400">Ajuste rápido:</span>
                  <button
                    type="button"
                    onClick={() => setManualTotal((prev) => Math.max(0, prev - 10000))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    - $10.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualTotal((prev) => Math.max(0, prev - 5000))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    - $5.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualTotal((prev) => prev + 5000)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    + $5.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualTotal((prev) => prev + 10000)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    + $10.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualTotal((prev) => prev + 25000)}
                    className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold transition-colors"
                  >
                    + $25.000
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Precio por m2 */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Precio Malla por m² ($ CLP)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={pricePerM2}
                    onChange={(e) => setPricePerM2(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 text-sm font-bold text-slate-800 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Subtotal Malla: {formatCurrency(meshTotalCost)}
                  </span>
                </div>
              </div>

              {/* Perfiles de Aluminio y fijaciones */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Perfiles Aluminio & Fijaciones ($ CLP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={profilesAndFixingsCost}
                  onChange={(e) => setProfilesAndFixingsCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 text-sm font-bold text-slate-800 bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Perfiles electrostáticos + anclajes
                </span>
              </div>

              {/* Mano de obra e instalacion */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mano de Obra & Instalación ($ CLP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={laborAndInstallCost}
                  onChange={(e) => setLaborAndInstallCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 text-sm font-bold text-slate-800 bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Técnicos certificados en terreno
                </span>
              </div>

              {/* Descuento */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descuento Comercial (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 text-sm font-bold text-slate-800 bg-white"
                  />
                  <span className="text-xs font-semibold text-emerald-700 shrink-0">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              </div>

              {/* Tiempo estimado */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tiempo Estimado de Instalación
                </label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="Ej: 2 a 3 horas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 text-xs text-slate-800 bg-white"
                />
              </div>

              {/* Años de garantia */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Garantía por Escrito
                </label>
                <select
                  value={warrantyYears}
                  onChange={(e) => setWarrantyYears(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 text-xs text-slate-800 bg-white"
                >
                  <option value={1}>1 Año de garantía</option>
                  <option value={2}>2 Años de garantía certificada</option>
                  <option value={3}>3 Años de garantía premium</option>
                  <option value={5}>5 Años de garantía extendida</option>
                </select>
              </div>
            </div>

            {/* SELECCIÓN Y CONFIRMACIÓN DE FECHA Y HORA DE INSTALACIÓN */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-slate-900 text-sm">
                    Aceptar o Proponer Fecha y Hora de Instalación
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  Fechas solicitadas por el cliente
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Selecciona una de las dos fechas tentativas que el cliente solicitó, o ingresa/modifica la fecha y hora convenida para la visita:
              </p>

              {/* Botones de selección de opción */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Opción 1 */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedScheduleOption('opcion_1');
                    if (quote.tentativeDate1) setConfirmedDate(quote.tentativeDate1);
                    if (quote.tentativeTime1) setConfirmedTime(quote.tentativeTime1);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedScheduleOption === 'opcion_1'
                      ? 'bg-amber-100 border-amber-500 font-bold text-slate-900 ring-2 ring-amber-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span className="font-bold">Aceptar Opción 1</span>
                  </div>
                  <div className="text-slate-800 text-xs">
                    📅 {quote.tentativeDate1 || '2026-09-15'}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    ⏰ {quote.tentativeTime1 || '10:00'} hrs
                  </div>
                </button>

                {/* Opción 2 */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedScheduleOption('opcion_2');
                    if (quote.tentativeDate2) setConfirmedDate(quote.tentativeDate2);
                    if (quote.tentativeTime2) setConfirmedTime(quote.tentativeTime2);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedScheduleOption === 'opcion_2'
                      ? 'bg-amber-100 border-amber-500 font-bold text-slate-900 ring-2 ring-amber-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-white text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <span className="font-bold">Aceptar Opción 2</span>
                  </div>
                  <div className="text-slate-800 text-xs">
                    📅 {quote.tentativeDate2 || '2026-09-17'}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    ⏰ {quote.tentativeTime2 || '15:30'} hrs
                  </div>
                </button>

                {/* Opción Personalizada */}
                <button
                  type="button"
                  onClick={() => setSelectedScheduleOption('personalizada')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedScheduleOption === 'personalizada'
                      ? 'bg-amber-100 border-amber-500 font-bold text-slate-900 ring-2 ring-amber-400/40'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                      ✎
                    </span>
                    <span className="font-bold">Proponer Otro Horario</span>
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Modifica la fecha u hora en los campos de abajo
                  </div>
                </button>
              </div>

              {/* Campos modificables de fecha y hora */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="input-admin-confirmed-date"
                    className="block text-xs font-semibold text-slate-800 mb-1"
                  >
                    Fecha de instalación fijada por Admin (Modificable)
                  </label>
                  <input
                    id="input-admin-confirmed-date"
                    type="date"
                    value={confirmedDate}
                    onChange={(e) => {
                      setConfirmedDate(e.target.value);
                      setSelectedScheduleOption('personalizada');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-admin-confirmed-time"
                    className="block text-xs font-semibold text-slate-800 mb-1"
                  >
                    Hora propuesta por Admin (Modificable)
                  </label>
                  <input
                    id="input-admin-confirmed-time"
                    type="time"
                    value={confirmedTime}
                    onChange={(e) => {
                      setConfirmedTime(e.target.value);
                      setSelectedScheduleOption('personalizada');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-300 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* IVA checkbox & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">
                  Observaciones Técnicas o Condiciones para el Cliente
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Detalles sobre materiales, disponibilidad de horario o condiciones."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 text-xs text-slate-800 bg-white outline-none"
                />
              </div>

              <div className="flex flex-col justify-between p-3.5 rounded-2xl bg-white border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={includeTax}
                    onChange={(e) => setIncludeTax(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500"
                  />
                  <span>Aplicar IVA (19% Legal)</span>
                </label>
                <div className="text-right pt-2 border-t border-slate-100 mt-2">
                  <span className="text-[11px] text-slate-500 block uppercase font-medium">
                    VALOR QUE RECIBIRÁ EL CLIENTE:
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-700">
                    {formatCurrency(effectiveTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Send to User Email and View Client Screen buttons */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Destinatario:{' '}
              <strong className="text-slate-900">{quote.clientEmail}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 w-full lg:w-auto">
            <button
              id="btn-cancel-admin-quote"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/80 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>

            {/* View email option */}
            <button
              id="btn-send-and-view-email"
              type="button"
              onClick={() => handleSend('email')}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Enviar y Ver Correo</span>
            </button>

            {/* Primary: View client quotation screen */}
            <button
              id="btn-send-and-view-client-screen"
              type="button"
              onClick={() => handleSend('client_screen')}
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Despachando...</span>
                </>
              ) : (
                <>
                  <Building className="w-4 h-4 text-white" />
                  <span>Enviar y Visualizar Pantalla del Usuario</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
