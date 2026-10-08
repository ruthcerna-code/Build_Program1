import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { QuoteRequest, UserAccount } from '../types';
import { formatCurrency } from '../services/quoteStorage';
import { quoteStatusLabel, PAYMENT_STATUS_LABELS } from '../constants/quoteStatus';
import { QuoteDetailModal } from './QuoteDetailModal';
import { canEditQuotes } from '../services/permissions';

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
    return quotes.filter((q) => {
      if (q.deletedAt) return false;
      if (client && !q.clientName.toLowerCase().includes(client.toLowerCase()) && !q.clientEmail.toLowerCase().includes(client.toLowerCase())) {
        return false;
      }
      if (from && q.createdAt.slice(0, 10) < from) return false;
      return true;
    });
  }, [quotes, client, from]);

  const quoted = rows.reduce((s, q) => s + Number(q.adminQuote?.total || 0), 0);
  const accepted = rows.filter((q) => q.status === 'aceptada').reduce((s, q) => s + Number(q.adminQuote?.total || 0), 0);
  const collected = rows.reduce((s, q) => s + Number(q.paidAmount || 0), 0);
  const byStatus = rows.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="pb-16 space-y-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Ventas</h1>
        <p className="text-sm text-slate-500">
          Una cotización aceptada no está pagada. El cobro solo cuenta si hay un pago registrado.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <article className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-slate-500">Importe cotizado</p>
          <p className="text-xl font-black">{formatCurrency(quoted)}</p>
        </article>
        <article className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-slate-500">Importe aceptado</p>
          <p className="text-xl font-black">{formatCurrency(accepted)}</p>
        </article>
        <article className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-slate-500">Importe cobrado</p>
          <p className="text-xl font-black">{formatCurrency(collected)}</p>
        </article>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
        {Object.entries(byStatus).map(([status, count]) => (
          <span key={status} className="px-3 py-1 rounded-full bg-slate-100">
            {quoteStatusLabel(status)}: {count}
          </span>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          placeholder="Filtrar por cliente"
          className="rounded-xl border border-slate-300 px-3 py-2"
        />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        {rows.map((q) => (
          <article key={q.id} className="bg-white rounded-2xl border px-4 py-3 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-black">{q.clientName}</p>
              <p className="text-xs text-slate-500">
                {quoteStatusLabel(q.status)} · {PAYMENT_STATUS_LABELS[q.paymentStatus || 'pendiente']}
              </p>
            </div>
            <div className="text-sm text-right">
              <p>Cotizado: {q.adminQuote ? formatCurrency(q.adminQuote.total) : '—'}</p>
              <p>Cobrado: {formatCurrency(q.paidAmount || 0)}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(q)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-sky-600 text-white font-bold"
            >
              <Plus className="w-4 h-4" />
              Ver detalle
            </button>
          </article>
        ))}
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
