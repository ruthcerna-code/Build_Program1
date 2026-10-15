import React, { useState } from 'react';
import { ChevronRight, ExternalLink, Send } from 'lucide-react';
import { QuoteRequest, UserAccount, UserAccessLog } from '../types';
import { formatCurrency } from '../services/quoteStorage';
import { getStoredAccessLogs } from '../services/accessLogService';
import { EmptyState, KpiCard, OpsPageHeader } from './ops/OpsUi';

interface HomeAdminViewProps {
  quotes: QuoteRequest[];
  currentUser: UserAccount | null;
  onGoToAdminQuotes: () => void;
  onGoToTechnicianOrders: () => void;
  onGoToAccessLogs: () => void;
  onViewClientPreview: () => void;
  onRespondQuote?: (quote: QuoteRequest) => void;
}

function daysWaiting(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86_400_000);
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

  const live = quotes.filter((q) => !q.deletedAt);
  const solicitadas = live
    .filter((q) => q.status === 'pendiente')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const respondidasCount = live.filter((q) => q.status === 'cotizada' || q.status === 'aceptada' || !!q.adminQuote).length;
  const aceptadasCount = live.filter((q) => q.status === 'aceptada').length;

  let totalPresupuestado = 0;
  let totalPagado = 0;
  live.forEach((q) => {
    const total = q.adminQuote?.total || 0;
    if (total > 0) {
      totalPresupuestado += total;
      totalPagado +=
        typeof q.paidAmount === 'number'
          ? q.paidAmount
          : q.paymentStatus === 'pagado_total'
          ? total
          : q.paymentStatus === 'abono_parcial'
          ? Math.round(total * 0.5)
          : 0;
    }
  });
  const totalPendiente = Math.max(0, totalPresupuestado - totalPagado);
  const pctCobrado = totalPresupuestado > 0 ? Math.round((totalPagado / totalPresupuestado) * 100) : 0;

  const recentLogs = accessLogs.slice(0, 6);
  const firstName = (currentUser?.fullName || 'Ruth').split(' ')[0];

  return (
    <div id="view-home-admin" className="space-y-5 pb-16">
      <OpsPageHeader
        eyebrow="Resumen del día"
        title={`Hola, ${firstName}`}
        description="Lo más importante primero: solicitudes por responder, avance de ventas y actividad reciente."
        actions={
          <>
            <button type="button" onClick={onViewClientPreview} className="ops-btn">
              <ExternalLink className="h-4 w-4" />
              Ver sitio como cliente
            </button>
            <button type="button" onClick={onGoToAdminQuotes} className="ops-btn ops-btn-primary">
              Ir a CT recibida
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Por responder"
          value={solicitadas.length}
          hint="Solicitudes recibidas"
          tone="orange"
          onClick={onGoToAdminQuotes}
        />
        <KpiCard label="Respondidas" value={respondidasCount} hint="Con importe o enviadas" tone="pink" />
        <KpiCard
          label="Aceptadas"
          value={aceptadasCount}
          hint="Listas para instalar"
          tone="blue"
          onClick={onGoToTechnicianOrders}
        />
        <KpiCard
          label="Cobrado"
          value={formatCurrency(totalPagado)}
          hint={`${pctCobrado}% · pendiente ${formatCurrency(totalPendiente)}`}
          tone="yellow"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="ops-card overflow-hidden lg:col-span-7">
          <div className="flex items-center justify-between gap-2 border-b border-nydo-ink/10 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">Por responder</h2>
              <p className="text-xs text-nydo-ink/60">Las más antiguas primero</p>
            </div>
            <button type="button" onClick={onGoToAdminQuotes} className="ops-btn !min-h-8 !text-xs">
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {solicitadas.length === 0 ? (
            <EmptyState title="Al día" description="No hay solicitudes pendientes de respuesta." />
          ) : (
            <ul className="divide-y divide-nydo-ink/10">
              {solicitadas.slice(0, 5).map((quote) => {
                const days = daysWaiting(quote.createdAt);
                return (
                  <li key={quote.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        {quote.clientName}
                        <span className="ml-2 font-mono text-xs font-semibold text-nydo-ink/55">{quote.folio}</span>
                      </p>
                      <p className="text-xs text-nydo-ink/60">
                        {quote.windows.length} {quote.windows.length === 1 ? 'ventana' : 'ventanas'} · {quote.totalAreaM2} m²
                        {quote.clientCity ? ` · ${quote.clientCity}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${days >= 2 ? 'text-nydo-orange' : 'text-nydo-ink/55'}`}>
                        {days < 1 ? 'Hoy' : `Espera ${days} ${days === 1 ? 'día' : 'días'}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => (onRespondQuote ? onRespondQuote(quote) : onGoToAdminQuotes())}
                        className="ops-btn ops-btn-dark !min-h-8 !text-xs"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Responder
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="ops-card overflow-hidden lg:col-span-5">
          <div className="flex items-center justify-between gap-2 border-b border-nydo-ink/10 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">Actividad reciente</h2>
              <p className="text-xs text-nydo-ink/60">Ingresos al sistema y cotizaciones tocadas</p>
            </div>
            <button type="button" onClick={onGoToAccessLogs} className="ops-btn !min-h-8 !text-xs">
              Ver más
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {recentLogs.length === 0 ? (
            <EmptyState title="Sin actividad registrada" />
          ) : (
            <ul className="divide-y divide-nydo-ink/10">
              {recentLogs.map((log) => {
                const d = new Date(log.connectedAt);
                return (
                  <li key={log.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{log.userName}</p>
                      <p className="truncate text-xs text-nydo-ink/65">{log.actionDescription}</p>
                      {log.quoteFolios && log.quoteFolios.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {log.quoteFolios.map((f) => (
                            <span key={f} className="rounded bg-nydo-cream px-1.5 font-mono text-[10px] font-bold">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right text-xs tabular-nums">
                      <p className="font-bold">{d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-nydo-ink/55">{d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
