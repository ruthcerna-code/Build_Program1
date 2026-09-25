import React, { useState } from 'react';
import {
  ShieldCheck,
  Inbox,
  Wrench,
  Database,
  Clock,
  Mail,
  Phone,
  ArrowRight,
  Eye,
  Sparkles,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Activity,
  UserCheck,
  Laptop,
  LogIn,
  Send,
  AlertCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { QuoteRequest, UserAccount, UserAccessLog } from '../types';
import { formatCurrency } from '../services/quoteStorage';
import { getStoredAccessLogs } from '../services/accessLogService';

interface HomeAdminViewProps {
  quotes: QuoteRequest[];
  currentUser: UserAccount | null;
  onGoToAdminQuotes: () => void;
  onGoToTechnicianOrders: () => void;
  onGoToAccessLogs: () => void;
  onViewClientPreview: () => void;
  onRespondQuote?: (quote: QuoteRequest) => void;
}

export const HomeAdminView: React.FC<HomeAdminViewProps> = ({
  quotes,
  currentUser,
  onGoToAdminQuotes,
  onGoToTechnicianOrders,
  onGoToAccessLogs,
  onViewClientPreview,
  onRespondQuote,
}) => {
  const [accessLogs] = useState<UserAccessLog[]>(() => getStoredAccessLogs());

  // Operational metrics
  const solicitadas = quotes.filter((q) => q.status === 'pendiente');
  const solicitadasCount = solicitadas.length;

  const respondidas = quotes.filter(
    (q) => q.status === 'cotizada' || q.status === 'aceptada' || !!q.adminQuote
  );
  const respondidasCount = respondidas.length;

  const aceptadas = quotes.filter((q) => q.status === 'aceptada');
  const aceptadasCount = aceptadas.length;

  let totalPresupuestado = 0;
  let totalPagado = 0;

  quotes.forEach((q) => {
    const total = q.adminQuote?.total || 0;
    if (total > 0) {
      totalPresupuestado += total;
      const paid =
        typeof q.paidAmount === 'number'
          ? q.paidAmount
          : q.paymentStatus === 'pagado_total'
          ? total
          : q.paymentStatus === 'abono_parcial'
          ? Math.round(total * 0.5)
          : 0;
      totalPagado += paid;
    }
  });

  const totalPendiente = Math.max(0, totalPresupuestado - totalPagado);
  const pctCobrado = totalPresupuestado > 0 ? Math.round((totalPagado / totalPresupuestado) * 100) : 0;

  // Recent logs
  const recentLogs = accessLogs.slice(0, 5);

  return (
    <div id="view-home-admin" className="space-y-8 pb-16 animate-fade-in">
      {/* 1. EXECUTIVE ADMIN HERO BANNER */}
      <div
        id="admin-home-hero"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-sky-800/40"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Panel de Inicio &bull; Modo Administrador Activo</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Firebase Firestore Sincronizado</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Bienvenida, {currentUser?.fullName || 'Ruth Cerna'}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Estás en el <strong>Home de Administración Central</strong> de MallasSeguras Chile. Desde este panel puedes recepcionar solicitudes de clientes, despachar presupuestos oficiales a sus correos, coordinar pedidos técnicos de instaladores y auditar la conectividad registrada en base de datos.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>{currentUser?.email || 'rcv.informacion@gmail.com'}</span>
              </span>
              <span>&bull;</span>
              <span className="text-sky-300 font-semibold">
                Rol: Administrador Central
              </span>
              <span>&bull;</span>
              <span>Base de Datos: Colecciones <code className="text-sky-200">quotes</code> y <code className="text-sky-200">access_logs</code></span>
            </div>
          </div>

          {/* Quick toggle to see client public home */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={onViewClientPreview}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs group"
              title="Previsualizar la página de inicio tal como la ven los clientes"
            >
              <Eye className="w-4 h-4 text-sky-300 group-hover:scale-110 transition-transform" />
              <span>Ver Home como Cliente (Página Pública)</span>
            </button>

            <button
              type="button"
              onClick={onGoToAdminQuotes}
              className="px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Inbox className="w-4 h-4" />
              <span>Dashboard Completo Recepción</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR MAIN OPERATIONAL HUB CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: RECEPCIÓN DE COTIZACIONES */}
        <div
          onClick={onGoToAdminQuotes}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                1. Recepción de Cotizaciones
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Inbox className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{solicitadasCount}</span>
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                por responder
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Solicitudes ingresadas por clientes sin precio visible. Evalúa las medidas y despacha la respuesta a su correo.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-700 group-hover:text-sky-900">
            <span>Abrir Recepción</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 2: PEDIDOS TÉCNICOS */}
        <div
          onClick={onGoToTechnicianOrders}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                2. Pedidos Técnicos
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{aceptadasCount}</span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                aceptadas
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Cotizaciones aprobadas por clientes listas para asignación de cuadrilla, notas técnicas y confirmación de instalación.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:text-indigo-900">
            <span>Gestionar Pedidos Técnicos</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 3: RECAUDACIÓN Y PAGOS */}
        <div
          onClick={onGoToAdminQuotes}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                3. Recaudación y Pagos
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xl font-black text-emerald-700 truncate">
                {formatCurrency(totalPagado)}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Pendiente:</span>
                <span className="font-bold text-rose-600">{formatCurrency(totalPendiente)}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, pctCobrado))}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {pctCobrado}% recaudado sobre presupuestos formales
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-900">
            <span>Ver Control de Pagos</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARD 4: REGISTRO DE CONECTIVIDAD BD */}
        <div
          onClick={onGoToAccessLogs}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                4. Conectividad en BD
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{accessLogs.length}</span>
              <span className="text-xs text-slate-500 font-semibold">
                registros en BD
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Auditoría en tiempo real de accesos de usuarios, hora de conectividad y folios cotizados en Firestore.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-800 group-hover:text-amber-950">
            <span>Ver Registro de Conectividad</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. TWO OPERATIONAL DRILLDOWN COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: SOLICITUDES PENDIENTES DE RESPUESTA FORMAL (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Cotizaciones Solicitadas por Responder ({solicitadasCount})
                </h3>
                <p className="text-[11px] text-slate-500">
                  El cliente está cotizando sin precio; responder enviando propuesta al correo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onGoToAdminQuotes}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Ver todas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {solicitadas.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">¡Al día! No hay cotizaciones pendientes</h4>
              <p className="text-xs text-slate-500">
                Todas las solicitudes han recibido respuesta por correo electrónico.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitadas.slice(0, 4).map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-amber-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                        {quote.folio}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {quote.clientName}
                      </span>
                      <span className="text-[11px] text-slate-400">&bull; {quote.clientCity}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                      <span>{quote.windows.length} ventanas ({quote.totalAreaM2} m²)</span>
                      <span>&bull;</span>
                      <span className="text-slate-600 font-semibold">{quote.clientEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (onRespondQuote) {
                          onRespondQuote(quote);
                        } else {
                          onGoToAdminQuotes();
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Responder al Correo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: REGISTRO DE CONECTIVIDAD EN BD RECIENTE (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Conectividad Reciente en BD
                </h3>
                <p className="text-[11px] text-slate-500">
                  Historial de accesos y cotizaciones en Firestore
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onGoToAccessLogs}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Ver log completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.map((log) => {
              const dateObj = new Date(log.connectedAt);
              const timeStr = dateObj.toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const dateStr = dateObj.toLocaleDateString('es-CL', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                      <span>{log.userName}</span>
                      <span className="text-[10px] font-semibold text-slate-400 font-normal truncate">
                        ({log.userEmail})
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 truncate">
                      {log.actionDescription}
                    </p>

                    {log.quoteFolios && log.quoteFolios.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {log.quoteFolios.map((f) => (
                          <span
                            key={f}
                            className="font-mono text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px] font-bold text-slate-800">{timeStr}</div>
                    <div className="text-[10px] text-slate-400">{dateStr}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sincronización activa con Firestore (<code className="text-[10px]">access_logs</code>)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
