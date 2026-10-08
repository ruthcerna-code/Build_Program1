import React, { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { QuoteRequest, QuoteStatus, UserAccount } from '../types';
import { formatCurrency } from '../services/quoteStorage';
import { QUOTE_STATUS_OPTIONS, quoteStatusLabel } from '../constants/quoteStatus';
import { QuoteDetailModal } from './QuoteDetailModal';
import { canDeleteQuotes, canEditQuotes, canViewHistory } from '../services/permissions';
import { formatAreaM2 } from '../utils/windowMeasures';
import { QuoteWindowsPanel } from './WindowsMeasureTable';

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
  onSendEmail?: (quoteId: string, details?: { total?: number; notes?: string }) => void;
  toast?: string | null;
}

function formatQuoteDate(iso?: string) {
  if (!iso) return 'Sin registro';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Sin registro';
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatQuoteDateTime(iso?: string) {
  if (!iso) return 'Sin registro';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Sin registro';
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function quoteResponseAt(quote: QuoteRequest) {
  return quote.adminQuote?.sentAt || quote.emailDispatch?.sentAt;
}

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
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [selected, setSelected] = useState<QuoteRequest | null>(null);

  const visible = useMemo(() => {
    return quotes.filter((q) => {
      if (q.deletedAt) return false;
      if (currentUser?.role === 'cliente' && currentUser.email) {
        if (q.clientEmail.toLowerCase() !== currentUser.email.toLowerCase()) return false;
      }
      const blob = `${q.folio} ${q.clientName} ${q.clientEmail}`.toLowerCase();
      if (search && !blob.includes(search.toLowerCase())) return false;
      if (status !== 'all' && q.status !== status) return false;
      if (dateFrom && q.createdAt.slice(0, 10) < dateFrom) return false;
      return true;
    });
  }, [quotes, currentUser, search, status, dateFrom]);

  return (
    <section className="pb-16 space-y-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">
          {variant === 'accepted'
            ? 'Número de cotización, fecha y hora de solicitud, y fecha y hora de respuesta.'
            : 'Cliente, fecha, importe y estado. El resto está en Ver detalle.'}
        </p>
      </div>

      {toast && (
        <p className="text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-3 py-2">{toast}</p>
      )}

      <div className="grid sm:grid-cols-3 gap-2">
        <label className="text-sm font-bold text-slate-600">
          Buscar
          <span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cliente o folio"
              className="w-full outline-none text-slate-900 font-medium"
            />
          </span>
        </label>
        {variant !== 'accepted' && (
          <label className="text-sm font-bold text-slate-600">
            Estado
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
            >
              <option value="all">Todos</option>
              {QUOTE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {quoteStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm font-bold text-slate-600">
          Desde
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
          />
        </label>
      </div>

      <div className="space-y-2">
        {visible.length === 0 && (
          <p className="bg-white rounded-2xl border border-slate-200 px-4 py-8 text-center text-slate-500">
            No hay cotizaciones con esos filtros.
          </p>
        )}
        {visible.map((q) => (
          <article key={q.id} className="bg-white rounded-2xl border border-slate-200 px-4 py-3 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-[16rem] flex-1">
                <p className="font-black text-slate-900">{q.clientName}</p>
                {variant === 'accepted' ? (
                  <dl className="mt-2 grid sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div>
                      <dt className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                        Fecha · N° cotización
                      </dt>
                      <dd className="font-semibold text-slate-900">
                        {formatQuoteDate(q.createdAt)} · {q.folio}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                        Solicitud
                      </dt>
                      <dd className="font-semibold text-slate-900">{formatQuoteDateTime(q.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                        Respuesta
                      </dt>
                      <dd className="font-semibold text-slate-900">{formatQuoteDateTime(quoteResponseAt(q))}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-xs text-slate-500">
                    {new Date(q.createdAt).toLocaleDateString('es-CL')} · {q.folio}
                    {q.windows?.length
                      ? ` · ${q.windows.length} ${q.windows.length === 1 ? 'ventana' : 'ventanas'} · ${formatAreaM2(q.totalAreaM2 || 0)} m²`
                      : ''}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{q.adminQuote ? formatCurrency(q.adminQuote.total) : 'Sin importe'}</p>
                <p className="text-xs font-bold text-sky-700">{quoteStatusLabel(q.status)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(q)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 text-white text-sm font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Ver detalle
              </button>
            </div>
            <QuoteWindowsPanel quote={q} compact />
          </article>
        ))}
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
