import React from 'react';
import {
  ShieldAlert,
  Eye,
  Wind,
  CheckCircle2,
  HeartHandshake,
  Award,
  Sun,
  Hammer,
  BadgePercent,
  Clock,
  ArrowDown
} from 'lucide-react';

interface CompanyGoalAndOfferProps {
  onScrollToForm: () => void;
}

export const CompanyGoalAndOffer: React.FC<CompanyGoalAndOfferProps> = ({ onScrollToForm }) => {
  return (
    <section id="section-company-presentation" className="space-y-12">
      {/* Hero Offer Banner */}
      <div
        id="hero-offer-banner"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-blue-900 text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-sky-800/40"
      >
        {/* Subtle decorative mesh background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
              <span>OFERTA DE TEMPORADA &bull; INSTALACIÓN EN 24-48 HRS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Mallas de Seguridad para Ventanas:{' '}
              <span className="text-sky-400">Protección Total sin perder la vista</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              Instalamos redes de máxima resistencia para niños y mascotas en departamentos y casas. 
              Soportan hasta <strong className="text-white font-semibold">180 kg por metro cuadrado</strong> con 
              filtro UV que evita el desgaste solar y perfiles de aluminio de alta durabilidad.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <div className="text-2xl font-black text-sky-300">180 kg/m²</div>
                <div className="text-[11px] text-slate-300 font-medium">Resistencia al impacto</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center">
                <div className="text-2xl font-black text-amber-300">100% UV</div>
                <div className="text-[11px] text-slate-300 font-medium">Protección solar certificada</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10 text-center col-span-2 sm:col-span-1">
                <div className="text-2xl font-black text-emerald-300">2 a 3 Años</div>
                <div className="text-[11px] text-slate-300 font-medium">Garantía por escrito</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                id="btn-hero-quote-action"
                type="button"
                onClick={onScrollToForm}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm sm:text-base transition-all duration-200 shadow-lg shadow-sky-500/30 hover:scale-[1.02]"
              >
                <span>Cotizar Mis Ventanas Ahora</span>
                <ArrowDown className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <BadgePercent className="w-4 h-4 text-emerald-400" />
                <span>15% de descuento por 3 o más ventanas</span>
              </div>
            </div>
          </div>

          {/* Offer highlight card */}
          <div className="lg:col-span-5 bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-sky-500/30 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-700/80 pb-3">
              <Award className="w-5 h-5 text-amber-400" />
              ¿Qué incluye nuestra oferta de instalación?
            </h3>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Malla monofilamento o multifilamento:</strong> Hilos de nylon de alta tenacidad calibre 0.70mm / 0.80mm.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Perfiles de aluminio anodizado perimetral:</strong> Acabado blanco, gris o negro para mimetizarse con tu ventana.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Fijaciones técnicas de seguridad:</strong> Tarugos y anclajes reforzados para hormigón, ladrillo o marcos metálicos.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Instalación profesional limpia:</strong> En menos de medio día, sin polvo residual y probada ante impactos.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Certificado de garantía:</strong> Sellado y con fecha para tranquilidad de tu familia o administración del edificio.
                </span>
              </li>
            </ul>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs bg-slate-900/60 px-3.5 py-2.5 rounded-lg border border-slate-700 text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-400" /> Tiempo de respuesta
                </span>
                <span className="font-bold text-sky-300">Cotización formal en minutos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPANY GOAL SECTION */}
      <div
        id="section-company-goal"
        className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs"
      >
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold mb-3">
            <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
            NUESTRO PROPÓSITO Y OBJETIVO
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            El Objetivo de Nuestra Empresa: Cero accidentes, máxima tranquilidad en tu hogar
          </h2>
          <p className="mt-3 text-slate-600 text-base leading-relaxed">
            Nuestro objetivo primordial es brindar seguridad absoluta a las familias protegiendo a los más pequeños 
            y a las mascotas contra cualquier riesgo de caída en altura, sin alterar la luminosidad natural, la 
            ventilación fresca ni la armonía visual de las ventanas de tu vivienda.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div
            id="goal-card-safety"
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 transition-colors duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              1. Protección Infantil y Mascotas
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Evitamos caídas accidentales en pisos altos. Nuestras mallas cuentan con nudos termosellados 
              que impiden que se deshilachen aun con mordeduras de gatos o empujes continuos de niños.
            </p>
          </div>

          <div
            id="goal-card-visibility"
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 transition-colors duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              2. Estética y 100% Visibilidad
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A diferencia de las rejas de fierro tradicionales, la malla de monofilamento es casi imperceptible a 
              más de 3 metros, permitiendo disfrutar de la vista panorámica y la luz del día sin efecto de encierro.
            </p>
          </div>

          <div
            id="goal-card-craft"
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-sky-300 transition-colors duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Hammer className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              3. Calidad de Instalación y Garantía
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              No tercerizamos. Cada instalación es realizada por técnicos expertos capacitados en anclaje estructural 
              y tensado milimétrico, asegurando que la malla nunca quede suelta o deformada con el tiempo.
            </p>
          </div>
        </div>

        {/* Feature quick icons */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center">
            <Wind className="w-5 h-5 text-sky-600 mb-1" />
            <span className="text-xs font-semibold text-slate-800">Ventilación Natural</span>
            <span className="text-[11px] text-slate-500">Paso libre de aire puro</span>
          </div>
          <div className="flex flex-col items-center">
            <Sun className="w-5 h-5 text-amber-500 mb-1" />
            <span className="text-xs font-semibold text-slate-800">Filtro Solar UV</span>
            <span className="text-[11px] text-slate-500">No se tuesta con el sol</span>
          </div>
          <div className="flex flex-col items-center">
            <Award className="w-5 h-5 text-blue-600 mb-1" />
            <span className="text-xs font-semibold text-slate-800">Normativa de Edificios</span>
            <span className="text-[11px] text-slate-500">Apta para condominios</span>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-xs font-semibold text-slate-800">Presupuesto Rápido</span>
            <span className="text-[11px] text-slate-500">Respuesta a tu correo</span>
          </div>
        </div>
      </div>
    </section>
  );
};
