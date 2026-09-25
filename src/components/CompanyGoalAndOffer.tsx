import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  ShieldAlert,
  Eye,
  CheckCircle2,
  Award,
  Sun,
  Hammer,
  Clock,
  ArrowRight,
  Mail,
  Sparkles,
  ShieldCheck,
  Building,
  Check,
  Layers,
  X,
  HelpCircle,
  Zap,
  Flame,
  Shield
} from 'lucide-react';

interface CompanyGoalAndOfferProps {
  onGoToQuoteMesh?: () => void;
  onAuthenticateWithGmail?: () => void;
  onGoToAdmin?: () => void;
  onGoToTechnicianOrders?: () => void;
  currentUser?: UserAccount | null;
}

type SimulationArea = 'balcon' | 'ventana' | 'terraza';
type ProfileColor = 'blanco' | 'titanio' | 'negro';

export const CompanyGoalAndOffer: React.FC<CompanyGoalAndOfferProps> = ({
  onGoToQuoteMesh,
  onAuthenticateWithGmail,
  onGoToAdmin,
  onGoToTechnicianOrders,
  currentUser,
}) => {
  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.email?.toLowerCase().includes('admin') ||
    currentUser?.email === 'rcv.informacion@gmail.com' ||
    currentUser?.email === 'ruth.cerna@gmail.com';

  const isGmailConnected =
    !!(currentUser?.email && currentUser.email.toLowerCase().endsWith('@gmail.com'));

  // Interactive Graphic Simulation States
  const [activeArea, setActiveArea] = useState<SimulationArea>('balcon');
  const [hasMesh, setHasMesh] = useState<boolean>(true);
  const [profileColor, setProfileColor] = useState<ProfileColor>('blanco');

  const areaDetails: Record<
    SimulationArea,
    { title: string; subtitle: string }
  > = {
    balcon: {
      title: 'Balcón en Altura',
      subtitle: 'Protección para niños y mascotas sin tapar la vista',
    },
    ventana: {
      title: 'Ventana de Dormitorio',
      subtitle: 'Ventilación fresca continua con total seguridad',
    },
    terraza: {
      title: 'Terraza Panorámica',
      subtitle: 'Seguridad perimetral para departamentos y casas',
    },
  };

  return (
    <section id="section-company-presentation" className="space-y-8 pb-12">
      {/* 1. COMPACT HIGH-IMPACT HERO BANNER (CONCISE, GRAPHIC-FIRST) */}
      <div
        id="hero-offer-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-sky-800/40"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Direct Headline, Metrics & CTA */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
              <span>Instalación Certificada &bull; 24 a 48 Horas</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Mallas de Seguridad:{' '}
              <span className="text-sky-400">Protección invisible para tu familia</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Evita caídas en altura de niños y mascotas. Resisten <strong className="text-white font-bold">180 kg/m²</strong> con filtro solar UV y perfiles de aluminio sin alterar la fachada ni tu vista.
            </p>

            {/* 4 Graphic Key Metrics (Bold & Scannable) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <div className="text-2xl font-black text-sky-300">180 kg/m²</div>
                <div className="text-[11px] text-slate-300 font-medium">Carga probada</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <div className="text-2xl font-black text-amber-300">100% UV</div>
                <div className="text-[11px] text-slate-300 font-medium">Filtro solar</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <div className="text-2xl font-black text-emerald-300">3 Años</div>
                <div className="text-[11px] text-slate-300 font-medium">Garantía oficial</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <div className="text-2xl font-black text-blue-300">98% Luz</div>
                <div className="text-[11px] text-slate-300 font-medium">Paso natural</div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={onGoToAdmin}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ir a Recepción de Cotizaciones (Admin)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : isGmailConnected ? (
                <button
                  type="button"
                  onClick={onGoToQuoteMesh}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Ingresar a Cotizar Malla</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onAuthenticateWithGmail}
                  className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-lg flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black">
                    G
                  </span>
                  <span>Conectar con Gmail para Cotizar</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </button>
              )}

              <span className="text-xs text-sky-200/90 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Respuesta formal y detallada a tu correo</span>
              </span>
            </div>
          </div>

          {/* Right Column: Visual Trust Badges (Compact Graphic Pill Grid) */}
          <div className="lg:col-span-5 bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-sky-500/30 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
              <span className="flex items-center gap-2 text-xs font-bold text-white">
                <Award className="w-4 h-4 text-amber-400" />
                Garantías y Certificación 2026
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                100% Homologado
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Nudos termosellados</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Aluminio inoxidable</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Anclajes de hormigón</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium">Apto condominios</span>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>Instalación limpia en 3 a 4 horas</span>
              </div>
              <span className="text-emerald-400 font-bold">Sin polvo residual</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE GRAPHIC SIMULATOR (HIGH VISUAL RETENTION, SCANNABLE) */}
      <div
        id="section-interactive-simulation"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 uppercase tracking-wide">
              <Eye className="w-3.5 h-3.5 text-sky-600" />
              <span>Simulador Visual Interactivo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Comprueba la transparencia y protección en tu hogar
            </h2>
          </div>

          {/* Area Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveArea('balcon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeArea === 'balcon'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Balcón
            </button>
            <button
              type="button"
              onClick={() => setActiveArea('ventana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeArea === 'ventana'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🪟 Ventana
            </button>
            <button
              type="button"
              onClick={() => setActiveArea('terraza')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeArea === 'terraza'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🐱 Terraza
            </button>
          </div>
        </div>

        {/* Visual Graphic Display Stage */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 shadow-inner h-72 sm:h-88 flex flex-col justify-between p-4 sm:p-5">
          {/* Panoramic Skyline Backdrop */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100 opacity-90 transition-all duration-500"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, #38bdf8 0%, #bae6fd 60%, #fed7aa 100%)',
            }}
          >
            {/* Distant City Silhouette */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-700/40 to-transparent flex items-end justify-around px-8 opacity-70">
              <div className="w-16 h-18 bg-slate-600/50 rounded-t-sm" />
              <div className="w-24 h-22 bg-slate-700/60 rounded-t-sm" />
              <div className="w-20 h-14 bg-slate-600/40 rounded-t-sm" />
              <div className="w-28 h-20 bg-slate-700/50 rounded-t-sm" />
              <div className="w-16 h-16 bg-slate-600/40 rounded-t-sm" />
            </div>
            {/* Sunlight glint */}
            <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-white/40 blur-xl pointer-events-none" />
          </div>

          {/* Window / Balcony Structural Frame */}
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
            {/* Center Mullion Divider */}
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

          {/* Transparent Safety Mesh Overlay (Toggled) */}
          {hasMesh && (
            <div
              className="absolute inset-5 sm:inset-6 transition-opacity duration-300 z-15 pointer-events-none"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(45deg, rgba(255,255,255,0.45) 0, rgba(255,255,255,0.45) 1px, transparent 0, transparent 20px),
                  repeating-linear-gradient(-45deg, rgba(255,255,255,0.45) 0, rgba(255,255,255,0.45) 1px, transparent 0, transparent 20px)
                `,
                backgroundSize: '20px 20px',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:20px_20px]" />
            </div>
          )}

          {/* Top Status Bar Inside Stage */}
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
                <span>100% Protegido (180 kg/m²)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/95 text-white font-black text-xs shadow-md animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Peligro: Sin Protección</span>
              </span>
            )}
          </div>

          {/* Bottom Interactive Control Island */}
          <div className="relative z-20 bg-slate-900/90 backdrop-blur-md rounded-xl p-3 border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                Estado:
              </span>
              <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setHasMesh(true)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    hasMesh
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Con Malla Invisible</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasMesh(false)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    !hasMesh
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Sin Malla</span>
                </button>
              </div>
            </div>

            {/* Profile color selector */}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-medium">Color Marco:</span>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setProfileColor('blanco')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    profileColor === 'blanco'
                      ? 'bg-white text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Blanco
                </button>
                <button
                  type="button"
                  onClick={() => setProfileColor('titanio')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    profileColor === 'titanio'
                      ? 'bg-slate-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gris
                </button>
                <button
                  type="button"
                  onClick={() => setProfileColor('negro')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    profileColor === 'negro'
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Negro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Graphical Spec Tokens (Ultra-Concise) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Nylon 0.80 mm Monofilamento</h4>
              <p className="text-[11px] text-slate-500">Nudos termosellados de alta resistencia.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Aluminio Anodizado</h4>
              <p className="text-[11px] text-slate-500">Perfiles inoxidables resistentes a lluvia y sol.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Hammer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Fijación Estructural</h4>
              <p className="text-[11px] text-slate-500">Anclaje en hormigón con tarugos expansivos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. VISUAL GRAPHIC COMPARISON: MALLA INVISIBLE VS REJAS TRADICIONALES (HIGH RETENTION) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: Mallas de Seguridad (La Opción Moderna) */}
        <div className="bg-gradient-to-br from-sky-900 to-slate-900 text-white rounded-3xl p-6 border border-sky-700/50 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Malla Invisible de Seguridad</h3>
                <span className="text-[11px] text-sky-300 font-semibold">Tecnología recomendada</span>
              </div>
            </div>
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              Aprobada 100%
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span><strong>98% Luz y Vista despejada:</strong> Sin sensación de encierro.</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span><strong>Permitida en Condominios:</strong> No altera la fachada arquitectónica.</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span><strong>Vía de Escape Rápida:</strong> Bomberos pueden cortarla en emergencias.</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
              <span><strong>Instalación Express:</strong> Lista en 3 horas sin ruidos molestos.</span>
            </div>
          </div>
        </div>

        {/* Card B: Rejas de Fierro (Desventajas) */}
        <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black">
                <X className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Rejas de Fierro Tradicionales</h3>
                <span className="text-[11px] text-slate-500 font-medium">Método obsoleto</span>
              </div>
            </div>
            <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-200">
              Desaconsejado
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
              <span><strong>Obstrucción visual severa:</strong> Bloquea la luz y arruina la vista.</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
              <span><strong>Prohibido por Copropiedad:</strong> La mayoría de edificios no las permiten.</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
              <span><strong>Trampa en Incendios:</strong> Impide la evacuación al exterior.</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
              <span><strong>Obras Pesadas:</strong> Soldadura, óxido con el tiempo y alto costo.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. THREE-STEP PROCESS (QUICK & SCANNABLE) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
              ¿Cómo solicitar tu cotización formal?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Proceso rápido en 3 simples pasos con respuesta oficial a tu correo.
            </p>
          </div>
          <span className="text-xs text-sky-400 font-bold bg-sky-950 px-3 py-1 rounded-xl border border-sky-800/60 w-fit">
            Tiempo estimado: 1 minuto
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black text-xs shrink-0">
              1
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white">Conecta tu Gmail</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Verificación en 1 clic para asegurar que recibas tu cotización oficial en PDF.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black text-xs shrink-0">
              2
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white">Ingresa Medidas</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Indica ancho y alto aproximado de tus ventanas o balcón y fecha tentativa.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs shrink-0">
              3
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-white">Recibe tu Presupuesto</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                El equipo técnico te responde con el valor exacto y coordina la visita de instalación.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Conversion Card */}
        <div className="pt-2">
          {isAdmin ? (
            <div className="bg-slate-800/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Modo Administrador Activo ({currentUser?.email})
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Acceso exclusivo para recepcionar cotizaciones y pedidos técnicos.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onGoToAdmin && (
                  <button
                    type="button"
                    onClick={onGoToAdmin}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>1. Recepción (Admin)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onGoToTechnicianOrders && (
                  <button
                    type="button"
                    onClick={onGoToTechnicianOrders}
                    className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>2. Pedidos Técnicos</span>
                  </button>
                )}
              </div>
            </div>
          ) : isGmailConnected ? (
            <div className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Autenticado con Gmail ({currentUser?.email})
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Tu cuenta está lista para ingresar medidas y cotizar.
                  </p>
                </div>
              </div>
              {onGoToQuoteMesh && (
                <button
                  type="button"
                  onClick={onGoToQuoteMesh}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Ir a Cotizar Malla</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Autenticación requerida para cotizar
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Conéctate con tu cuenta de Gmail para ingresar las medidas de tus ventanas.
                  </p>
                </div>
              </div>
              {onAuthenticateWithGmail && (
                <button
                  type="button"
                  onClick={onAuthenticateWithGmail}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black">
                    G
                  </span>
                  <span>Autenticarse con Gmail</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
