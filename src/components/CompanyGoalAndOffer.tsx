import React, { useState } from 'react';
import {
  ShieldAlert,
  Eye,
  CheckCircle2,
  Award,
  Hammer,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Layers,
  X,
  Shield,
  Baby,
  PawPrint,
  MessageCircle,
} from 'lucide-react';
import { CONTACT_PHONE_DISPLAY, WHATSAPP_QUOTE_URL } from '../constants/contact';

interface CompanyGoalAndOfferProps {
  onGoToQuoteMesh?: () => void;
  onOpenAssistant?: () => void;
}

type SimulationArea = 'balcon' | 'ventana' | 'terraza';
type ProfileColor = 'blanco' | 'titanio' | 'negro';

const AREA_PHOTOS: Record<SimulationArea, string> = {
  balcon:
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
  ventana:
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80',
  terraza:
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
};

export const CompanyGoalAndOffer: React.FC<CompanyGoalAndOfferProps> = ({
  onGoToQuoteMesh,
  onOpenAssistant,
}) => {
  const [activeArea, setActiveArea] = useState<SimulationArea>('balcon');
  const [hasMesh, setHasMesh] = useState<boolean>(true);
  const [profileColor, setProfileColor] = useState<ProfileColor>('blanco');

  const areaDetails: Record<SimulationArea, { title: string; subtitle: string }> = {
    balcon: {
      title: 'Balcón en altura',
      subtitle: 'Protección para niños y mascotas sin tapar la vista',
    },
    ventana: {
      title: 'Ventana de dormitorio',
      subtitle: 'Ventilación continua con seguridad',
    },
    terraza: {
      title: 'Terraza',
      subtitle: 'Perímetro seguro para departamentos y casas',
    },
  };

  return (
    <section id="section-company-presentation" className="space-y-8 pb-12">
      <div
        id="hero-offer-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-sky-800/40"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
              <span>Evaluación y cotización sin costo</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Mallas de seguridad:{' '}
              <span className="text-sky-400">protección para tu familia</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Protegemos ventanas, balcones y terrazas. La malla no tapa la vista y se cotiza
              según una visita o las medidas que nos envíes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <Baby className="w-5 h-5 text-sky-300 mb-1.5" />
                <div className="text-sm font-black text-white">Niños y mascotas</div>
                <div className="text-[11px] text-slate-300 font-medium">Barrera de seguridad en altura</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <Eye className="w-5 h-5 text-amber-300 mb-1.5" />
                <div className="text-sm font-black text-white">No tapa la vista</div>
                <div className="text-[11px] text-slate-300 font-medium">Luz y paisaje siguen visibles</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 mb-1.5" />
                <div className="text-sm font-black text-white">Evaluación sin costo</div>
                <div className="text-[11px] text-slate-300 font-medium">Te llamamos o escribimos</div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {onGoToQuoteMesh && (
                <button
                  type="button"
                  onClick={onGoToQuoteMesh}
                  className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <span>Pedir cotización</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <a
                href={WHATSAPP_QUOTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 border border-emerald-400/40"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp {CONTACT_PHONE_DISPLAY}</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-sky-500/30 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
              <span className="flex items-center gap-2 text-xs font-bold text-white">
                <Award className="w-4 h-4 text-amber-400" />
                Qué incluye
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                Cotización sin costo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                <Baby className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Protección para niños</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Seguridad para mascotas</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Vista despejada</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Apto para condominios</span>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Visita según evaluación</span>
              </div>
              <span className="text-emerald-400 font-bold">Sin compromiso</span>
            </div>
          </div>
        </div>
      </div>

      <div
        id="section-interactive-simulation"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wide">
              <Eye className="w-3.5 h-3.5 text-sky-600" />
              <span>Simulador visual</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Así se ve tu hogar con y sin malla
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
            {(['balcon', 'ventana', 'terraza'] as SimulationArea[]).map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setActiveArea(area)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeArea === area
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {area === 'balcon' ? 'Balcón' : area === 'ventana' ? 'Ventana' : 'Terraza'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 shadow-inner h-72 sm:h-88 flex flex-col justify-between p-4 sm:p-5">
          <img
            src={AREA_PHOTOS[activeArea]}
            alt={areaDetails[activeArea].title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/10" />

          <div
            className="absolute inset-3 sm:inset-5 rounded-xl border-8 sm:border-10 transition-colors duration-300 shadow-2xl pointer-events-none z-10"
            style={{
              borderColor:
                profileColor === 'blanco'
                  ? '#ffffff'
                  : profileColor === 'negro'
                  ? '#1e293b'
                  : '#64748b',
            }}
          >
            <div
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2 sm:w-2.5 shadow-md"
              style={{
                backgroundColor:
                  profileColor === 'blanco'
                    ? '#e2e8f0'
                    : profileColor === 'negro'
                    ? '#0f172a'
                    : '#475569',
              }}
            />
          </div>

          {hasMesh && (
            <div
              className="absolute inset-5 sm:inset-6 transition-opacity duration-300 z-15 pointer-events-none"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 1px, transparent 0, transparent 18px),
                  repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 1px, transparent 0, transparent 18px)
                `,
                backgroundSize: '18px 18px',
              }}
            />
          )}

          <div className="relative z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-lg border border-white/20">
                {areaDetails[activeArea].title}
              </span>
              <span className="hidden sm:inline-block text-[11px] bg-slate-900/60 backdrop-blur-md text-slate-200 px-2.5 py-1 rounded-lg">
                {areaDetails[activeArea].subtitle}
              </span>
            </div>

            {hasMesh ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/90 text-white font-black text-xs shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Con malla</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/95 text-white font-black text-xs shadow-md">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Sin protección</span>
              </span>
            )}
          </div>

          <div className="relative z-20 bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setHasMesh(true)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    hasMesh ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Con malla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasMesh(false)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    !hasMesh ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Sin malla</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-medium">Color marco:</span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setProfileColor('blanco')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    profileColor === 'blanco' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Blanco
                </button>
                <button
                  type="button"
                  onClick={() => setProfileColor('titanio')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    profileColor === 'titanio' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gris
                </button>
                <button
                  type="button"
                  onClick={() => setProfileColor('negro')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    profileColor === 'negro' ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Negro
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Protección en altura</h4>
              <p className="text-[11px] text-slate-500">Pensada para niños y mascotas en balcones y ventanas.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Vista y luz</h4>
              <p className="text-[11px] text-slate-500">La malla no tapa el paisaje ni oscurece la habitación.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Hammer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Instalación en terreno</h4>
              <p className="text-[11px] text-slate-500">Fijación en obra, con visita según evaluación.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-sky-900 to-slate-900 text-white rounded-3xl p-6 border border-sky-700/50 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Malla de seguridad</h3>
                <span className="text-[11px] text-sky-300 font-semibold">Opción recomendada</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Deja pasar la luz y no tapa la vista.</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Suele estar permitida en condominios.</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>En una emergencia se puede cortar para evacuar.</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Plazo de instalación según evaluación.</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black">
                <X className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Rejas de fierro</h3>
                <span className="text-[11px] text-slate-500 font-medium">Menos recomendable</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
              <span>Tapan la luz y el paisaje.</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
              <span>Muchos edificios no las permiten.</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
              <span>Dificultan la evacuación en un incendio.</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
              <span>Obra más pesada, óxido y soldadura.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
              Cómo pedir tu cotización
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sin crear cuenta. Te respondemos por WhatsApp o teléfono.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs shrink-0">
              1
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white">Medidas o fotos</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Envíanos el tamaño aproximado o una foto del balcón, ventana o terraza.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs shrink-0">
              2
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white">Te llamamos o escribimos</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Coordinamos por WhatsApp o teléfono. El correo es opcional.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-xs shrink-0">
              3
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white">Recibes el presupuesto</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Te enviamos el valor y, si corresponde, agendamos la visita de instalación.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-white text-xs sm:text-sm">Listo para cotizar</h4>
              <p className="text-[11px] text-slate-300">
                Nombre, teléfono, comuna y una foto. Sin Gmail obligatorio.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onGoToQuoteMesh && (
                <button
                  type="button"
                  onClick={onGoToQuoteMesh}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Pedir cotización</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <a
                href={WHATSAPP_QUOTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {onOpenAssistant && (
          <p className="text-[11px] text-slate-500 text-center">
            ¿Dudas?{' '}
            <button
              type="button"
              onClick={onOpenAssistant}
              className="text-sky-400 hover:text-sky-300 font-semibold underline cursor-pointer"
            >
              Preguntas frecuentes
            </button>
            {' · '}
            <button
              type="button"
              onClick={onOpenAssistant}
              className="text-sky-400 hover:text-sky-300 font-semibold underline cursor-pointer"
            >
              Consulta por RUT
            </button>
          </p>
        )}
      </div>
    </section>
  );
};
