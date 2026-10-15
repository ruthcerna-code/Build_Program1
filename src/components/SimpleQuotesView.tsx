import React, { useMemo, useState } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import { QuoteRequest, QuoteStatus, UserAccount } from '../types';
import { formatCurrency } from '../services/quoteStorage';
import { QUOTE_STATUS_OPTIONS, quoteStatusLabel } from '../constants/quoteStatus';
import { QuoteDetailModal } from './QuoteDetailModal';
import { canDeleteQuotes, canEditQuotes, canViewHistory } from '../services/permissions';
import { formatAreaM2 } from '../utils/windowMeasures';
import { EmptyState, KpiCard, Notice, OpsPageHeader, PaymentBadge, StatusBadge } from './ops/OpsUi';

interface SimpleQuotesViewProps {
  quotes: QuoteRequest[];
  currentUser: UserAccount | null;
  title?: string;
  variant?: 'default' | 'accepted';
  onUpdateStatus?: (quoteId: string, status: QuoteStatus) => void;
  onUpdateNotes?: (quoteId: string, notes: string, total?: number) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onAcceptQuote?: (quoteId: string) => void;
  onRegisterPayment?: (quoteId: string, amount: number, method?: string, notes?: string) => void;
  onSendEmail?: (quoteId: string, details?: { total?: number; notes?: string }) => void | Promise<void>;
  toast?: string | null;
  banner?: React.ReactNode;
}

type SortKey = 'recent' | 'oldest' | 'amount';

function formatQuoteDate(iso?: string) {
  if (!iso) return 'Sin registro';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Sin registro';
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatQuoteTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function quoteResponseAt(quote: QuoteRequest) {
  return quote.adminQuote?.sentAt || quote.emailDispatch?.sentAt;
}

function daysSince(iso?: string) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((Date.now() - t) / 86_400_000);
}

function waitingLabel(quote: QuoteRequest) {
  if (quote.status !== 'pendiente' && quote.status !== 'en_revision') return null;
  const days = daysSince(quote.createdAt);
  if (days < 1) return { text: 'Hoy', urgent: false };
  return { text: `Espera ${days} ${days === 1 ? 'día' : 'días'}`, urgent: days >= 2 };
}

function measuresLabel(quote: QuoteRequest) {
  const count = quote.windows?.length || 0;
  if (!count) return '—';
  return `${count} ${count === 1 ? 'ventana' : 'ventanas'} · ${formatAreaM2(quote.totalAreaM2 || 0)} m²`;
}

const DateCell: React.FC<{ iso?: string }> = ({ iso }) => {
  const date = formatQuoteDate(iso);
  const time = formatQuoteTime(iso);
  return (
    <div className="whitespace-nowrap tabular-nums">
      <span className="font-semibold">{date}</span>
      {time && <span className="block text-xs text-nydo-ink/55">{time} h</span>}
    </div>
  );
};

export const SimpleQuotesView: React.FC<SimpleQuotesViewProps> = ({
  quotes,
  currentUser,
  title = 'Cotizaciones',
  variant = 'default',
  onUpdateStatus,
  onUpdateNotes,
  onDeleteQuote,
  onAcceptQuote,
  onRegisterPayment,
  onSendEmail,
  toast,
  banner,
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [selected, setSelected] = useState<QuoteRequest | null>(null);

  const isClient = currentUser?.role === 'cliente';
  const accepted = variant === 'accepted';

  const base = useMemo(
    () =>
      quotes.filter((q) => {
        if (q.deletedAt) return false;
        if (isClient && currentUser?.email && q.clientEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
          return false;
        }
        return true;
      }),
    [quotes, isClient, currentUser]
  );

  const statusCounts = useMemo(
    () =>
      base.reduce<Record<string, number>>((acc, q) => {
        acc[q.status] = (acc[q.status] || 0) + 1;
        return acc;
      }, {}),
    [base]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = base.filter((q) => {
      if (term && !`${q.folio} ${q.clientName} ${q.clientEmail}`.toLowerCase().includes(term)) return false;
      if (status !== 'all' && q.status !== status) return false;
      if (dateFrom && q.createdAt.slice(0, 10) < dateFrom) return false;
      return true;
    });
    return rows.sort((a, b) => {
      if (sort === 'amount') return Number(b.adminQuote?.total || 0) - Number(a.adminQuote?.total || 0);
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === 'oldest' ? -diff : diff;
    });
  }, [base, search, status, dateFrom, sort]);

  const hasFilters = Boolean(search || dateFrom || status !== 'all' || sort !== 'recent');
  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setStatus('all');
    setSort('recent');
  };

  const sumTotal = (list: QuoteRequest[]) => list.reduce((s, q) => s + Number(q.adminQuote?.total || 0), 0);
  const toAnswer = base.filter((q) => q.status === 'pendiente' || q.status === 'en_revision');
  const sent = base.filter((q) => q.status === 'cotizada');
  const acceptedTotal = sumTotal(base);
  const collected = base.reduce((s, q) => s + Number(q.paidAmount || 0), 0);

  const statusTabs = QUOTE_STATUS_OPTIONS.filter((s) => statusCounts[s]);

  return (
    <section className="pb-16 space-y-5">
      <OpsPageHeader
        eyebrow={isClient ? 'Tu cuenta' : 'Cotizaciones'}
        title={title}
        description={
          accepted
            ? 'Cotizaciones aprobadas por el cliente. Registra los pagos desde el detalle: aceptar no significa pagado.'
            : isClient
            ? 'Revisa el estado de tus solicitudes y abre el detalle para ver medidas e importe.'
            : 'Solicitudes de clientes. Prioriza las que llevan más días esperando y abre el detalle para responder.'
        }
      />

      {banner}

      {toast && <Notice tone="success">{toast}</Notice>}

      {!isClient && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {accepted ? (
            <>
              <KpiCard label="Aceptadas" value={base.length} tone="ink" />
              <KpiCard label="Importe aceptado" value={formatCurrency(acceptedTotal)} tone="blue" />
              <KpiCard label="Cobrado" value={formatCurrency(collected)} tone="yellow" />
              <KpiCard
                label="Por cobrar"
                value={formatCurrency(Math.max(0, acceptedTotal - collected))}
                tone="orange"
              />
            </>
          ) : (
            <>
              <KpiCard
                label="Por responder"
                value={toAnswer.length}
                hint="Recibidas y en revisión"
                tone="orange"
              />
              <KpiCard
                label="Enviadas al cliente"
                value={sent.length}
                hint="Esperando aceptación"
                tone="pink"
                active={status === 'cotizada'}
                onClick={() => setStatus(status === 'cotizada' ? 'all' : 'cotizada')}
              />
              <KpiCard label="Importe cotizado" value={formatCurrency(sumTotal(base))} tone="blue" />
              <KpiCard label="Total en bandeja" value={base.length} tone="ink" />
            </>
          )}
        </div>
      )}

      <div className="ops-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-nydo-ink/10 p-4">
          {!accepted && statusTabs.length > 0 && (
            <div role="tablist" aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5">
              {[{ key: 'all', label: 'Todas', count: base.length }, ...statusTabs.map((s) => ({
                key: s,
                label: quoteStatusLabel(s),
                count: statusCounts[s],
              }))].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.key}
                  onClick={() => setStatus(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold cursor-pointer transition-colors ${
                    status === tab.key
                      ? 'bg-nydo-ink text-nydo-cream'
                      : 'bg-nydo-cream/70 text-nydo-ink hover:bg-nydo-cream'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      status === tab.key ? 'bg-nydo-orange text-nydo-ink' : 'bg-white text-nydo-ink/70'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px_180px_auto] sm:items-end">
            <label className="block">
              <span className="ops-label mb-1">Buscar</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nydo-ink/45" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cliente, correo o N° de cotización"
                  className="ops-input !pl-9"
                />
              </span>
            </label>
            <label className="block">
              <span className="ops-label mb-1">Solicitadas desde</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="ops-input" />
            </label>
            <label className="block">
              <span className="ops-label mb-1">Ordenar</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="ops-input">
                <option value="recent">Más recientes primero</option>
                <option value="oldest">Más antiguas primero</option>
                <option value="amount">Mayor importe primero</option>
              </select>
            </label>
            <button type="button" onClick={clearFilters} disabled={!hasFilters} className="ops-btn">
              <X className="h-4 w-4" />
              Limpiar
            </button>
          </div>

          <p className="text-xs font-semibold text-nydo-ink/60" aria-live="polite">
            {visible.length === base.length
              ? `${visible.length} ${visible.length === 1 ? 'cotización' : 'cotizaciones'}`
              : `Mostrando ${visible.length} de ${base.length} cotizaciones`}
          </p>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title={base.length === 0 ? 'Aún no hay cotizaciones aquí' : 'No hay cotizaciones con esos filtros'}
            description={
              base.length === 0
                ? accepted
                  ? 'Cuando un cliente acepte una cotización aparecerá en esta lista.'
                  : 'Las nuevas solicitudes de clientes aparecerán en esta lista.'
                : 'Prueba con otro nombre, otra fecha o quita los filtros.'
            }
            action={
              hasFilters && base.length > 0 ? (
                <button type="button" onClick={clearFilters} className="ops-btn">
                  Quitar filtros
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th scope="col">N° cotización</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Solicitud</th>
                    {accepted ? <th scope="col">Respuesta</th> : <th scope="col">Medidas</th>}
                    <th scope="col" className="!text-right">Importe</th>
                    <th scope="col">{accepted ? 'Pago' : 'Estado'}</th>
                    <th scope="col" className="w-px">
                      <span className="sr-only">Acción</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((q) => {
                    const waiting = waitingLabel(q);
                    return (
                      <tr key={q.id} className="cursor-pointer" onClick={() => setSelected(q)}>
                        <td className="font-mono text-[13px] font-semibold whitespace-nowrap">{q.folio}</td>
                        <td className="max-w-[260px]">
                          <span className="block truncate font-bold">{q.clientName}</span>
                          <span className="block truncate text-xs text-nydo-ink/55">{q.clientEmail}</span>
                        </td>
                        <td>
                          <DateCell iso={q.createdAt} />
                          {waiting && (
                            <span
                              className={`mt-0.5 block text-xs font-bold ${
                                waiting.urgent ? 'text-nydo-orange' : 'text-nydo-ink/55'
                              }`}
                            >
                              {waiting.text}
                            </span>
                          )}
                        </td>
                        {accepted ? (
                          <td>
                            <DateCell iso={quoteResponseAt(q)} />
                          </td>
                        ) : (
                          <td className="whitespace-nowrap text-nydo-ink/75">{measuresLabel(q)}</td>
                        )}
                        <td className="ops-num font-bold">
                          {q.adminQuote ? (
                            formatCurrency(q.adminQuote.total)
                          ) : (
                            <span className="font-semibold text-nydo-ink/45">Sin importe</span>
                          )}
                        </td>
                        <td>
                          {accepted ? <PaymentBadge status={q.paymentStatus} /> : <StatusBadge status={q.status} />}
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
              {visible.map((q) => {
                const waiting = waitingLabel(q);
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(q)}
                      className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-[#fbf6f1]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{q.clientName}</span>
                        <span className="block text-xs text-nydo-ink/60 tabular-nums">
                          {q.folio} · {formatQuoteDate(q.createdAt)}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2">
                          {accepted ? <PaymentBadge status={q.paymentStatus} /> : <StatusBadge status={q.status} />}
                          {waiting && (
                            <span className={`text-xs font-bold ${waiting.urgent ? 'text-nydo-orange' : 'text-nydo-ink/55'}`}>
                              {waiting.text}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-bold tabular-nums">
                          {q.adminQuote ? formatCurrency(q.adminQuote.total) : <span className="text-nydo-ink/45">Sin importe</span>}
                        </span>
                        <ChevronRight className="ml-auto mt-1 h-4 w-4 text-nydo-ink/40" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {selected && (
        <QuoteDetailModal
          quote={quotes.find((q) => q.id === selected.id) || selected}
          currentUser={currentUser}
          canEdit={canEditQuotes(currentUser)}
          canDelete={canDeleteQuotes(currentUser)}
          showHistory={canViewHistory(currentUser)}
          onClose={() => setSelected(null)}
          onUpdateStatus={onUpdateStatus}
          onUpdateNotes={onUpdateNotes}
          onDeleteQuote={onDeleteQuote}
          onAcceptQuote={onAcceptQuote}
          onRegisterPayment={onRegisterPayment}
          onSendEmail={onSendEmail}
        />
      )}
    </section>
  );
};
