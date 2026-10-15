import React, { useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { QuoteRequest, UserAccount } from '../types';
import { formatCurrency } from '../services/quoteStorage';
import { QUOTE_STATUS_OPTIONS } from '../constants/quoteStatus';
import { QuoteDetailModal } from './QuoteDetailModal';
import { canEditQuotes } from '../services/permissions';
import { EmptyState, KpiCard, OpsPageHeader, PaymentBadge, StatusBadge } from './ops/OpsUi';

interface SalesViewProps {
  quotes: QuoteRequest[];
  currentUser: UserAccount | null;
  onRegisterPayment?: (quoteId: string, amount: number, method?: string, notes?: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ quotes, currentUser, onRegisterPayment }) => {
  const [client, setClient] = useState('');
  const [from, setFrom] = useState('');
  const [selected, setSelected] = useState<QuoteRequest | null>(null);

  const rows = useMemo(() => {
    const term = client.trim().toLowerCase();
    return quotes
      .filter((q) => {
        if (q.deletedAt) return false;
        if (term && !q.clientName.toLowerCase().includes(term) && !q.clientEmail.toLowerCase().includes(term)) {
          return false;
        }
        if (from && q.createdAt.slice(0, 10) < from) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotes, client, from]);

  const quoted = rows.reduce((s, q) => s + Number(q.adminQuote?.total || 0), 0);
  const accepted = rows.filter((q) => q.status === 'aceptada').reduce((s, q) => s + Number(q.adminQuote?.total || 0), 0);
  const collected = rows.reduce((s, q) => s + Number(q.paidAmount || 0), 0);
  const pending = Math.max(0, accepted - collected);
  const pctCollected = accepted > 0 ? Math.round((collected / accepted) * 100) : 0;
  const byStatus = rows.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  const hasFilters = Boolean(client || from);

  return (
    <section className="pb-16 space-y-5">
      <OpsPageHeader
        eyebrow="Resumen comercial"
        title="Ventas"
        description="Una cotización aceptada no está pagada. El cobro solo cuenta si hay un pago registrado."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Importe cotizado" value={formatCurrency(quoted)} hint={`${rows.length} cotizaciones`} tone="blue" />
        <KpiCard label="Importe aceptado" value={formatCurrency(accepted)} hint={`${byStatus.aceptada || 0} aceptadas`} tone="ink" />
        <KpiCard
          label="Importe cobrado"
          value={formatCurrency(collected)}
          hint={accepted > 0 ? `${pctCollected}% de lo aceptado` : 'Sin ventas aceptadas'}
          tone="yellow"
        />
        <KpiCard label="Por cobrar" value={formatCurrency(pending)} hint="Aceptado menos cobrado" tone="orange" />
      </div>

      {accepted > 0 && (
        <div className="ops-card px-4 py-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="ops-label">Avance de cobro</span>
            <span className="tabular-nums">{pctCollected}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-nydo-cream" role="progressbar" aria-valuenow={pctCollected} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-nydo-ink" style={{ width: `${Math.min(100, pctCollected)}%` }} />
          </div>
        </div>
      )}

      <div className="ops-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-nydo-ink/10 p-4">
          {Object.keys(byStatus).length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Cotizaciones por estado">
              {QUOTE_STATUS_OPTIONS.filter((s) => byStatus[s]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-sm">
                  <StatusBadge status={s} />
                  <span className="font-bold tabular-nums">{byStatus[s]}</span>
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end">
            <label className="block">
              <span className="ops-label mb-1">Cliente</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nydo-ink/45" />
                <input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Nombre o correo"
                  className="ops-input !pl-9"
                />
              </span>
            </label>
            <label className="block">
              <span className="ops-label mb-1">Desde</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ops-input" />
            </label>
            <button
              type="button"
              disabled={!hasFilters}
              onClick={() => {
                setClient('');
                setFrom('');
              }}
              className="ops-btn"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No hay ventas para mostrar"
            description={hasFilters ? 'Prueba con otro cliente o fecha.' : 'Cuando existan cotizaciones aparecerán aquí.'}
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th scope="col">N° cotización</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Pago</th>
                    <th scope="col" className="!text-right">Cotizado</th>
                    <th scope="col" className="!text-right">Cobrado</th>
                    <th scope="col" className="!text-right">Saldo</th>
                    <th scope="col" className="w-px">
                      <span className="sr-only">Acción</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((q) => {
                    const total = Number(q.adminQuote?.total || 0);
                    const paid = Number(q.paidAmount || 0);
                    return (
                      <tr key={q.id} className="cursor-pointer" onClick={() => setSelected(q)}>
                        <td className="font-mono text-[13px] font-semibold whitespace-nowrap">{q.folio}</td>
                        <td className="max-w-[240px]">
                          <span className="block truncate font-bold">{q.clientName}</span>
                          <span className="block truncate text-xs text-nydo-ink/55">{q.clientEmail}</span>
                        </td>
                        <td>
                          <StatusBadge status={q.status} />
                        </td>
                        <td>
                          <PaymentBadge status={q.paymentStatus} />
                        </td>
                        <td className="ops-num font-semibold">{q.adminQuote ? formatCurrency(total) : '—'}</td>
                        <td className="ops-num">{formatCurrency(paid)}</td>
                        <td className={`ops-num font-bold ${total - paid > 0 && q.status === 'aceptada' ? 'text-nydo-orange' : ''}`}>
                          {q.adminQuote ? formatCurrency(Math.max(0, total - paid)) : '—'}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(q);
                            }}
                            className="ops-btn"
                            aria-label={`Ver detalle de ${q.folio}, ${q.clientName}`}
                          >
                            Ver detalle
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="md:hidden divide-y divide-nydo-ink/10">
              {rows.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(q)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-[#fbf6f1]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{q.clientName}</span>
                      <span className="block text-xs text-nydo-ink/60">{q.folio}</span>
                      <span className="mt-1.5 flex flex-wrap gap-2">
                        <StatusBadge status={q.status} />
                        <PaymentBadge status={q.paymentStatus} />
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm tabular-nums">
                      <span className="block font-bold">{q.adminQuote ? formatCurrency(q.adminQuote.total) : '—'}</span>
                      <span className="block text-xs text-nydo-ink/60">Cobrado {formatCurrency(q.paidAmount || 0)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {selected && (
        <QuoteDetailModal
          quote={quotes.find((q) => q.id === selected.id) || selected}
          currentUser={currentUser}
          canEdit={canEditQuotes(currentUser)}
          canDelete={false}
          showHistory={true}
          onClose={() => setSelected(null)}
          onRegisterPayment={onRegisterPayment}
        />
      )}
    </section>
  );
};
