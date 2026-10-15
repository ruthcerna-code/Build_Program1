import React, { useState } from 'react';
import { Mail, Phone, Send } from 'lucide-react';
import { QuoteRequest, QuoteStatus, UserAccount } from '../types';
import { DetailModal } from './DetailModal';
import { QUOTE_STATUS_OPTIONS, quoteStatusLabel } from '../constants/quoteStatus';
import { formatCurrency } from '../services/quoteStorage';
import {
  FINISH_OPTIONS,
  HEIGHT_OPTIONS,
  LENGTH_OPTIONS,
  SURFACE_OPTIONS,
  TIMELINE_OPTIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
} from '../constants/guidedQuote';
import { QuoteWindowsPanel } from './WindowsMeasureTable';
import { PaymentBadge, StatusBadge } from './ops/OpsUi';

interface QuoteDetailModalProps {
  quote: QuoteRequest;
  currentUser: UserAccount | null;
  canEdit: boolean;
  canDelete: boolean;
  showHistory: boolean;
  onClose: () => void;
  onUpdateStatus?: (quoteId: string, status: QuoteStatus) => void;
  onUpdateNotes?: (quoteId: string, notes: string, total?: number) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onAcceptQuote?: (quoteId: string) => void;
  onRegisterPayment?: (quoteId: string, amount: number, method?: string, notes?: string) => void;
  onSendEmail?: (quoteId: string, details?: { total?: number; notes?: string }) => void | Promise<void>;
}

const Section: React.FC<{ title: string; children: React.ReactNode; aside?: React.ReactNode }> = ({
  title,
  children,
  aside,
}) => (
  <section className="ops-card p-4 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-nydo-ink">{title}</h3>
      {aside}
    </div>
    {children}
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="ops-label">{label}</dt>
    <dd className="mt-0.5 font-semibold text-nydo-ink break-words">{children}</dd>
  </div>
);

function formatDateTime(iso?: string) {
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

export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  quote,
  currentUser,
  canEdit,
  canDelete,
  showHistory,
  onClose,
  onUpdateStatus,
  onUpdateNotes,
  onDeleteQuote,
  onAcceptQuote,
  onRegisterPayment,
  onSendEmail,
}) => {
  const [notes, setNotes] = useState(quote.adminQuote?.adminNotes || quote.clientComments || '');
  const [total, setTotal] = useState(String(quote.adminQuote?.total || ''));
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const isClient = currentUser?.role === 'cliente';
  const responseAt = quote.adminQuote?.sentAt || quote.emailDispatch?.sentAt;
  const location =
    [quote.guidedQuote?.regionName || quote.clientAddress, quote.guidedQuote?.commune || quote.clientCity]
      .filter(Boolean)
      .join(' · ') || 'No indicada';
  const pendingBalance = Math.max(0, Number(quote.adminQuote?.total || 0) - Number(quote.paidAmount || 0));

  return (
    <DetailModal
      title={`Cotización ${quote.folio}`}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-2">
          <span>{quote.clientName}</span>
          <StatusBadge status={quote.status} />
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="ops-btn sm:mr-auto">
            Cancelar
          </button>
          {isClient && quote.status === 'cotizada' && onAcceptQuote && (
            <button
              type="button"
              onClick={() => {
                onAcceptQuote(quote.id);
                onClose();
              }}
              className="ops-btn ops-btn-primary"
            >
              Aceptar cotización
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus?.(quote.id, status);
                const parsed = Number(total);
                onUpdateNotes?.(quote.id, notes, Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
                onClose();
              }}
              className="ops-btn ops-btn-dark"
            >
              Guardar cambios
            </button>
          )}
          {canEdit && onSendEmail && (
            <button
              type="button"
              disabled={sending}
              onClick={async () => {
                const parsed = Number(String(total).replace(/[^\d]/g, ''));
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  setSendError('Ingresa el importe en pesos antes de enviar el correo al cliente.');
                  return;
                }
                setSendError(null);
                setSending(true);
                try {
                  onUpdateStatus?.(quote.id, status);
                  onUpdateNotes?.(quote.id, notes, parsed);
                  await onSendEmail(quote.id, { total: parsed, notes });
                  onClose();
                } catch (err: any) {
                  setSendError(err?.message || 'No pudimos enviar el correo al cliente.');
                } finally {
                  setSending(false);
                }
              }}
              className="ops-btn ops-btn-primary"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Enviando…' : 'Enviar al correo del cliente'}
            </button>
          )}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="ops-card px-4 py-3">
          <p className="ops-label">Importe cotizado</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {quote.adminQuote ? formatCurrency(quote.adminQuote.total) : <span className="text-nydo-ink/45">Aún no tiene precio</span>}
          </p>
        </div>
        <div className="ops-card px-4 py-3">
          <p className="ops-label">Pago</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <PaymentBadge status={quote.paymentStatus} />
            <span className="text-sm font-semibold tabular-nums">Cobrado {formatCurrency(quote.paidAmount || 0)}</span>
          </div>
          {quote.adminQuote && pendingBalance > 0 && (
            <p className="mt-1 text-xs text-nydo-ink/60 tabular-nums">Saldo {formatCurrency(pendingBalance)}</p>
          )}
        </div>
        <div className="ops-card px-4 py-3">
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-nydo-ink/60">Solicitud</dt>
              <dd className="font-semibold tabular-nums">{formatDateTime(quote.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-nydo-ink/60">Respuesta</dt>
              <dd className="font-semibold tabular-nums">{formatDateTime(responseAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <Section title="Cliente">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre">{quote.clientName}</Field>
          <Field label="Correo">
            <a href={`mailto:${quote.clientEmail}`} className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline">
              <Mail className="h-3.5 w-3.5 text-nydo-ink/50" />
              {quote.clientEmail}
            </a>
          </Field>
          <Field label="Teléfono">
            {quote.clientPhone ? (
              <a href={`tel:${quote.clientPhone}`} className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline">
                <Phone className="h-3.5 w-3.5 text-nydo-ink/50" />
                {quote.clientPhone}
              </a>
            ) : (
              'No indicado'
            )}
          </Field>
          <Field label="Región y comuna">{location}</Field>
        </dl>
      </Section>

      {(quote.guidedQuote || quote.windows?.length || quote.clientComments) && (
        <Section title="Solicitud">
          {quote.guidedQuote && (
            <dl className="grid gap-3 sm:grid-cols-3">
              <Field label="Tipo de trabajo">{labelOf(WORK_TYPE_OPTIONS, quote.guidedQuote.workType)}</Field>
              <Field label="Superficie">{labelOf(SURFACE_OPTIONS, quote.guidedQuote.surfaceType)}</Field>
              <Field label="Plazo">{labelOf(TIMELINE_OPTIONS, quote.guidedQuote.timeline)}</Field>
              <Field label="Longitud (rango)">{labelOf(LENGTH_OPTIONS, quote.guidedQuote.lengthRange)}</Field>
              <Field label="Altura (rango)">{labelOf(HEIGHT_OPTIONS, quote.guidedQuote.heightRange)}</Field>
              <Field label="Acabado">
                {quote.guidedQuote.finishType === 'lacado_otros' && quote.guidedQuote.finishColor
                  ? `${labelOf(FINISH_OPTIONS, quote.guidedQuote.finishType)} (${quote.guidedQuote.finishColor})`
                  : labelOf(FINISH_OPTIONS, quote.guidedQuote.finishType)}
              </Field>
            </dl>
          )}
          <QuoteWindowsPanel quote={quote} />
          {quote.clientComments && quote.quoteSource !== 'guided' && (
            <dl>
              <Field label="Comentario del cliente">
                <span className="font-normal">{quote.clientComments}</span>
              </Field>
            </dl>
          )}
        </Section>
      )}

      {canEdit && (
        <Section title="Responder al cliente">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="ops-label mb-1">Estado</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus)} className="ops-input">
                {QUOTE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {quoteStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="ops-label mb-1">Importe (CLP)</span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-nydo-ink/50">$</span>
                <input
                  value={total}
                  inputMode="numeric"
                  onChange={(e) => {
                    setTotal(e.target.value);
                    setSendError(null);
                  }}
                  placeholder="180000"
                  aria-invalid={Boolean(sendError)}
                  className={`ops-input !pl-7 tabular-nums ${sendError ? '!border-[#b4232a]' : ''}`}
                />
              </span>
            </label>
          </div>
          {sendError && (
            <p role="alert" className="text-sm font-bold text-[#9f1d24]">
              {sendError}
            </p>
          )}
          <label className="block">
            <span className="ops-label mb-1">Observaciones</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="ops-input" />
          </label>
          <p className="text-xs text-nydo-ink/60">
            «Guardar cambios» solo actualiza la ficha. «Enviar al correo del cliente» guarda y envía la cotización.
          </p>
        </Section>
      )}

      {canEdit && onRegisterPayment && (
        <Section title="Registrar pago" aside={<span className="text-xs text-nydo-ink/60">Aceptar no marca la cotización como pagada</span>}>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="ops-label mb-1">Monto</span>
              <input
                inputMode="numeric"
                placeholder="Ej: 90000"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="ops-input tabular-nums"
              />
            </label>
            <label className="block">
              <span className="ops-label mb-1">Medio de pago</span>
              <input
                placeholder="Transferencia, efectivo…"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="ops-input"
              />
            </label>
            <button
              type="button"
              disabled={!(Number(payAmount) > 0)}
              onClick={() => {
                const amount = Number(payAmount);
                if (amount > 0) {
                  onRegisterPayment(quote.id, amount, payMethod);
                  setPayAmount('');
                }
              }}
              className="ops-btn ops-btn-dark"
            >
              Guardar pago
            </button>
          </div>
        </Section>
      )}

      {showHistory && (quote.changeHistory?.length || 0) > 0 && (
        <Section title="Historial de cambios">
          <ol className="space-y-2 border-l-2 border-nydo-cream pl-4 text-xs">
            {quote.changeHistory!.slice(0, 12).map((ev) => (
              <li key={ev.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-nydo-orange" aria-hidden="true" />
                <span className="font-semibold tabular-nums text-nydo-ink/60">{formatDateTime(ev.at)}</span>
                <span className="block text-nydo-ink">
                  <strong>{ev.actorName}:</strong> {ev.detail}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {canDelete && onDeleteQuote && (
        <section className="rounded-[14px] border border-[#e9a3a6] bg-[#fdf3f3] p-4">
          {!confirmDelete ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#7a1a1f]">
                Ocultar esta cotización del listado. Quedará en el historial.
              </p>
              <button type="button" onClick={() => setConfirmDelete(true)} className="ops-btn ops-btn-danger">
                Eliminar cotización
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-bold text-[#7a1a1f]">
                ¿Eliminar la cotización {quote.folio} de {quote.clientName}? Quedará en el historial.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteQuote(quote.id);
                    onClose();
                  }}
                  className="ops-btn !bg-[#9f1d24] !border-[#9f1d24] !text-white"
                >
                  Sí, eliminar
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="ops-btn">
                  No, volver
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </DetailModal>
  );
};
