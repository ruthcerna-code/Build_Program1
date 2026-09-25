import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Send,
  Sparkles,
  Calculator,
  Building,
  Mail,
  User,
  Phone,
  MapPin,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { WindowItem, PropertyType, MeshType, QuoteRequest, UserAccount } from '../types';
import { generateQuoteFolio } from '../services/quoteStorage';

interface QuoteRequestFormProps {
  onSubmitQuote: (quote: QuoteRequest) => void;
  currentUser?: UserAccount | null;
}

interface WindowDraft {
  id: string;
  name: string;
  height: string; // raw input
  width: string;  // raw input
  unit: 'm' | 'cm';
  meshType: MeshType;
  notes: string;
}

// Generate default upcoming dates
const getDefaultFutureDate = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export const QuoteRequestForm: React.FC<QuoteRequestFormProps> = ({ onSubmitQuote, currentUser }) => {
  // Client Info State (prefilled with logged in user or defaults)
  const [clientName, setClientName] = useState(currentUser?.fullName || 'Ruth Cerna');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || 'ruth.cerna@gmail.com');
  const [clientPhone, setClientPhone] = useState('+56 9 9123 4567');
  const [clientAddress, setClientAddress] = useState('Av. Apoquindo 4500, Depto 1102');
  const [clientCity, setClientCity] = useState('Las Condes, Santiago');
  const [propertyType, setPropertyType] = useState<PropertyType>('departamento');
  const [clientComments, setClientComments] = useState('Malla de seguridad para niños y mascotas.');

  // Update fields when currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setClientName(currentUser.fullName);
      if (currentUser.email) setClientEmail(currentUser.email);
    }
  }, [currentUser]);

  // Two tentative installation dates and times
  const [tentativeDate1, setTentativeDate1] = useState(getDefaultFutureDate(3));
  const [tentativeTime1, setTentativeTime1] = useState('10:00');
  const [tentativeDate2, setTentativeDate2] = useState(getDefaultFutureDate(5));
  const [tentativeTime2, setTentativeTime2] = useState('15:30');

  // Windows State (starts with 1 window)
  const [windows, setWindows] = useState<WindowDraft[]>([
    {
      id: 'win-' + Date.now(),
      name: 'Ventana 1 (Dormitorio / Living)',
      height: '1.40',
      width: '2.00',
      unit: 'm',
      meshType: 'monofilamento',
      notes: ''
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper to convert inputs to meters and calculate area
  const getWindowArea = (w: WindowDraft): number => {
    const h = parseFloat(w.height.replace(',', '.'));
    const width = parseFloat(w.width.replace(',', '.'));
    if (isNaN(h) || isNaN(width) || h <= 0 || width <= 0) return 0;
    const hM = w.unit === 'cm' ? h / 100 : h;
    const wM = w.unit === 'cm' ? width / 100 : width;
    return Number((hM * wM).toFixed(2));
  };

  const totalAreaM2 = windows.reduce((sum, w) => sum + getWindowArea(w), 0);

  const handleAddWindow = () => {
    const nextNum = windows.length + 1;
    setWindows((prev) => [
      ...prev,
      {
        id: 'win-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        name: `Ventana ${nextNum} (Ej: Habitación ${nextNum})`,
        height: '1.40',
        width: '1.80',
        unit: 'm',
        meshType: 'monofilamento',
        notes: ''
      }
    ]);
  };

  const handleRemoveWindow = (id: string) => {
    if (windows.length <= 1) return;
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const handleWindowChange = (id: string, field: keyof WindowDraft, value: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!clientName.trim()) {
      setFormError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@') || !clientEmail.includes('.')) {
      setFormError('Por favor ingresa un correo electrónico válido para enviarte la cotización.');
      return;
    }
    if (!clientPhone.trim()) {
      setFormError('Por favor ingresa un número de teléfono o WhatsApp de contacto.');
      return;
    }

    // Check tentative dates
    if (!tentativeDate1 || !tentativeTime1) {
      setFormError('Por favor selecciona la primera fecha y hora tentativa para la instalación.');
      return;
    }
    if (!tentativeDate2 || !tentativeTime2) {
      setFormError('Por favor selecciona la segunda fecha y hora tentativa para la instalación.');
      return;
    }

    // Check windows dimensions
    const processedWindows: WindowItem[] = [];
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const h = parseFloat(w.height.replace(',', '.'));
      const width = parseFloat(w.width.replace(',', '.'));

      if (isNaN(h) || h <= 0 || isNaN(width) || width <= 0) {
        setFormError(`Por favor verifica el alto y ancho de la ${w.name || `Ventana #${i + 1}`}.`);
        return;
      }

      const hM = w.unit === 'cm' ? h / 100 : h;
      const wM = w.unit === 'cm' ? width / 100 : width;
      const area = Number((hM * wM).toFixed(2));

      processedWindows.push({
        id: w.id,
        name: w.name.trim() || `Ventana #${i + 1}`,
        height: Number(hM.toFixed(2)),
        width: Number(wM.toFixed(2)),
        unit: w.unit,
        meshType: w.meshType,
        area,
        notes: w.notes.trim()
      });
    }

    setIsSubmitting(true);

    const newQuote: QuoteRequest = {
      id: 'quote-' + Date.now(),
      folio: generateQuoteFolio(),
      createdAt: new Date().toISOString(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim() || 'Dirección por confirmar',
      clientCity: clientCity.trim() || 'Santiago',
      propertyType,
      windows: processedWindows,
      totalAreaM2: Number(totalAreaM2.toFixed(2)),
      clientComments: clientComments.trim(),
      tentativeDate1,
      tentativeTime1,
      tentativeDate2,
      tentativeTime2,
      status: 'pendiente'
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitQuote(newQuote);
    }, 450);
  };

  return (
    <div
      id="container-quote-request-form"
      className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 mb-2">
            <Calculator className="w-3.5 h-3.5 text-sky-600" />
            COTIZADOR EN LÍNEA
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pide tu Cotización de Mallas de Seguridad
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Ingresa las medidas de tus ventanas. Al presionar <strong>Ejecutar Enviar</strong>, te enviaremos un aviso oficial a tu correo confirmando que estás cotizando (sin precio anticipado) y derivaremos los datos a la central técnica.
          </p>
        </div>

        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-base shadow-sm">
            {windows.length}
          </div>
          <div>
            <span className="text-xs text-slate-500 block font-medium">Ventanas a cotizar</span>
            <span className="text-sm font-bold text-slate-800">
              Total aprox: {totalAreaM2.toFixed(2)} m²
            </span>
          </div>
        </div>
      </div>

      <form id="form-quote-request" onSubmit={handleSubmit} className="space-y-8">
        {formError && (
          <div
            id="form-error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-fade-in"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Faltan datos requeridos:</p>
              <p>{formError}</p>
            </div>
          </div>
        )}

        {/* SECTION 1: DATOS DEL CLIENTE */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            1. Datos de Contacto y Envío de la Cotización
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="input-client-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nombre Completo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-client-name"
                  type="text"
                  required
                  placeholder="Ej: Ruth Cerna"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-client-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Correo Electrónico <span className="text-rose-500">*</span>
                <span className="text-[10px] text-sky-600 font-normal ml-1">(Aquí recibirás el aviso de cotización)</span>
              </label>
              <div className="relative">
                <input
                  id="input-client-email"
                  type="email"
                  required
                  placeholder="ruth.cerna@gmail.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-client-phone"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Teléfono / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-client-phone"
                  type="tel"
                  required
                  placeholder="+56 9 9123 4567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="input-client-address"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Dirección / Calle y Número
              </label>
              <input
                id="input-client-address"
                type="text"
                placeholder="Ej: Av. Apoquindo 4500, Depto 1102"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="input-client-city"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Comuna / Ciudad
              </label>
              <input
                id="input-client-city"
                type="text"
                placeholder="Ej: Las Condes, Santiago"
                value={clientCity}
                onChange={(e) => setClientCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="select-property-type"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Tipo de Inmueble
              </label>
              <select
                id="select-property-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-800 outline-none transition-all bg-white"
              >
                <option value="departamento">Departamento en edificio</option>
                <option value="casa">Casa de 2 o más pisos</option>
                <option value="oficina">Oficina / Comercial</option>
                <option value="otro">Otro tipo de espacio</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: INGRESO DE 1 O VARIAS VENTANAS */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-sky-600" />
                2. Medidas de las Ventanas (Ingresa 1 o varias)
              </h3>
              <p className="text-xs text-slate-500">
                Indica el alto y ancho aproximado de cada ventana a proteger. No te preocupes si no es exacto al milímetro; nuestro técnico verificará en terreno.
              </p>
            </div>

            <button
              id="btn-add-window-top"
              type="button"
              onClick={handleAddWindow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Agregar otra ventana</span>
            </button>
          </div>

          <div className="space-y-4">
            {windows.map((w, index) => {
              const area = getWindowArea(w);
              return (
                <div
                  key={w.id}
                  id={`card-window-draft-${index + 1}`}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <input
                        id={`input-window-name-${index + 1}`}
                        type="text"
                        value={w.name}
                        onChange={(e) => handleWindowChange(w.id, 'name', e.target.value)}
                        placeholder={`Ventana ${index + 1} (Ej: Dormitorio, Balcón...)`}
                        className="font-bold text-slate-800 text-sm bg-transparent border-b border-dashed border-slate-300 hover:border-sky-500 focus:border-sky-500 focus:outline-hidden px-1 py-0.5"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        Área: <span className="text-sky-600 font-bold">{area.toFixed(2)} m²</span>
                      </div>

                      {windows.length > 1 && (
                        <button
                          id={`btn-remove-window-${index + 1}`}
                          type="button"
                          onClick={() => handleRemoveWindow(w.id)}
                          title="Eliminar esta ventana"
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Alto */}
                    <div>
                      <label
                        htmlFor={`input-window-height-${index + 1}`}
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Alto ({w.unit}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center">
                        <input
                          id={`input-window-height-${index + 1}`}
                          type="text"
                          required
                          value={w.height}
                          onChange={(e) => handleWindowChange(w.id, 'height', e.target.value)}
                          placeholder={w.unit === 'm' ? '1.40' : '140'}
                          className="w-full px-3 py-2 rounded-l-xl border border-r-0 border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-sm text-slate-800 outline-none"
                        />
                        <span className="px-3 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-r-xl border border-slate-300">
                          {w.unit}
                        </span>
                      </div>
                    </div>

                    {/* Ancho */}
                    <div>
                      <label
                        htmlFor={`input-window-width-${index + 1}`}
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Ancho ({w.unit}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center">
                        <input
                          id={`input-window-width-${index + 1}`}
                          type="text"
                          required
                          value={w.width}
                          onChange={(e) => handleWindowChange(w.id, 'width', e.target.value)}
                          placeholder={w.unit === 'm' ? '2.00' : '200'}
                          className="w-full px-3 py-2 rounded-l-xl border border-r-0 border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-sm text-slate-800 outline-none"
                        />
                        <span className="px-3 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-r-xl border border-slate-300">
                          {w.unit}
                        </span>
                      </div>
                    </div>

                    {/* Unidad de medida */}
                    <div>
                      <label
                        htmlFor={`select-window-unit-${index + 1}`}
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Unidad de medida
                      </label>
                      <select
                        id={`select-window-unit-${index + 1}`}
                        value={w.unit}
                        onChange={(e) =>
                          handleWindowChange(w.id, 'unit', e.target.value as 'm' | 'cm')
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-sm text-slate-800 outline-none bg-white"
                      >
                        <option value="m">Metros (m)</option>
                        <option value="cm">Centímetros (cm)</option>
                      </select>
                    </div>

                    {/* Tipo de Malla */}
                    <div>
                      <label
                        htmlFor={`select-window-mesh-${index + 1}`}
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Tipo de Malla
                      </label>
                      <select
                        id={`select-window-mesh-${index + 1}`}
                        value={w.meshType}
                        onChange={(e) =>
                          handleWindowChange(w.id, 'meshType', e.target.value as MeshType)
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-sm text-slate-800 outline-none bg-white"
                      >
                        <option value="monofilamento">Monofilamento 0.7mm (Invisible)</option>
                        <option value="multifilamento">Multifilamento 0.8mm (Trenzado)</option>
                      </select>
                    </div>
                  </div>

                  {/* Notas o características específicas de la ventana */}
                  <div>
                    <input
                      id={`input-window-notes-${index + 1}`}
                      type="text"
                      value={w.notes}
                      onChange={(e) => handleWindowChange(w.id, 'notes', e.target.value)}
                      placeholder="Detalles opcionales (ej: ventana de corredera, incluye baranda de balcón, etc.)"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 bg-white/70 focus:bg-white focus:border-sky-400 outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add more windows button */}
          <div className="flex justify-center pt-2">
            <button
              id="btn-add-window-bottom"
              type="button"
              onClick={handleAddWindow}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-sky-300 text-sky-700 hover:bg-sky-50/60 font-bold text-xs sm:text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Agregar otra ventana o balcón</span>
            </button>
          </div>
        </div>

        {/* SECTION 3: FECHAS Y HORAS TENTATIVAS PARA INSTALACIÓN */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              3. Fechas y Horas Tentativas para Instalar la Malla
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Propón dos opciones de fecha y hora que te acomoden para realizar la instalación. En la pantalla de recepción, el administrador podrá aceptar una de ellas o proponerte un horario exacto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opción 1 */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-sky-950 text-sm">Opción Tentativa 1 (Preferente)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="input-tentative-date-1"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Fecha de instalación
                  </label>
                  <input
                    id="input-tentative-date-1"
                    type="date"
                    value={tentativeDate1}
                    onChange={(e) => setTentativeDate1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-sm text-slate-800 outline-none bg-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-tentative-time-1"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Hora propuesta
                  </label>
                  <input
                    id="input-tentative-time-1"
                    type="time"
                    value={tentativeTime1}
                    onChange={(e) => setTentativeTime1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-sm text-slate-800 outline-none bg-white font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Opción 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-slate-900 text-sm">Opción Tentativa 2 (Alternativa)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="input-tentative-date-2"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Segunda fecha alternativa
                  </label>
                  <input
                    id="input-tentative-date-2"
                    type="date"
                    value={tentativeDate2}
                    onChange={(e) => setTentativeDate2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-sm text-slate-800 outline-none bg-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="input-tentative-time-2"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Hora propuesta alternativa
                  </label>
                  <input
                    id="input-tentative-time-2"
                    type="time"
                    value={tentativeTime2}
                    onChange={(e) => setTentativeTime2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 text-sm text-slate-800 outline-none bg-white font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: COMENTARIOS Y ENVIAR */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <label
              htmlFor="textarea-client-comments"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Observaciones o preguntas adicionales (Opcional)
            </label>
            <textarea
              id="textarea-client-comments"
              rows={2}
              value={clientComments}
              onChange={(e) => setClientComments(e.target.value)}
              placeholder="Ej: Tengo 1 gato y un niño de 2 años. Necesito instalación preferentemente un día sábado."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Informative banner: No price upfront, only quotation notice */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-sky-950">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-sky-900">
                Aviso al Cliente: Solicitud de Cotización sin Precio Anticipado
              </p>
              <p className="text-sky-800 leading-relaxed">
                Al ejecutar la actividad <strong>Enviar</strong>, no se colocará un precio inmediato. Te notificaremos a tu correo que tu cotización ha sido ingresada para que nuestro equipo técnico evalúe los detalles y te entregue la propuesta formal definitiva.
              </p>
            </div>
          </div>

          {/* Summary Banner before sending */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Resumen de tu solicitud
              </span>
              <div className="flex items-center gap-4 text-sm text-slate-800">
                <span className="font-semibold">
                  <strong className="text-sky-600">{windows.length}</strong> ventana(s)
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="font-semibold">
                  Aprox. <strong className="text-sky-600">{totalAreaM2.toFixed(2)} m²</strong> de malla
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-2 py-0.5 rounded-md">
                  Garantía 2-3 años
                </span>
              </div>
            </div>

            {/* Submit button */}
            <button
              id="btn-submit-quote-request"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/30 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ejecutando envío...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Ejecutar Actividad Enviar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
