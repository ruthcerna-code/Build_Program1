import React, { useState } from 'react';
import { QuoteRequest, QuoteStatus, UserAccount } from '../types';
import { DetailModal } from './DetailModal';
import { QUOTE_STATUS_OPTIONS, quoteStatusLabel, PAYMENT_STATUS_LABELS } from '../constants/quoteStatus';
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

  return (
    <DetailModal
      title={`Cotización ${quote.folio}`}
      subtitle={`${quote.clientName} · ${quoteStatusLabel(quote.status)}`}
      onClose={onClose}
      footer={
        <>
          {isClient && quote.status === 'cotizada' && onAcceptQuote && (
            <button
              type="button"
              onClick={() => {
                onAcceptQuote(quote.id);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer"
            >
              Aceptar cotización
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
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold cursor-pointer disabled:opacity-60"
            >
              {sending ? 'Enviando…' : 'Enviar al correo del cliente'}
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
              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold cursor-pointer"
            >
              Guardar
            </button>
          )}
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 font-bold cursor-pointer">
            Cancelar
          </button>
        </>
      }
    >
      <p><strong>N° cotización:</strong> {quote.folio}</p>
      <p><strong>Fecha y hora de solicitud:</strong> {new Date(quote.createdAt).toLocaleString('es-CL')}</p>
      <p>
        <strong>Fecha y hora de respuesta:</strong>{' '}
        {quote.adminQuote?.sentAt || quote.emailDispatch?.sentAt
          ? new Date(quote.adminQuote?.sentAt || quote.emailDispatch?.sentAt || '').toLocaleString('es-CL')
          : 'Sin registro'}
      </p>
      <p><strong>Cliente:</strong> {quote.clientName}</p>
      <p><strong>Correo:</strong> {quote.clientEmail}</p>
      <p><strong>Teléfono:</strong> {quote.clientPhone || 'No indicado'}</p>
      <p>
        <strong>Región y comuna:</strong>{' '}
        {[quote.guidedQuote?.regionName || quote.clientAddress, quote.guidedQuote?.commune || quote.clientCity]
          .filter(Boolean)
          .join(' · ') || 'No indicada'}
      </p>
      {quote.guidedQuote && (
        <>
          <p>
            <strong>Tipo de trabajo:</strong> {labelOf(WORK_TYPE_OPTIONS, quote.guidedQuote.workType)}
          </p>
          <p>
            <strong>Superficie:</strong> {labelOf(SURFACE_OPTIONS, quote.guidedQuote.surfaceType)}
          </p>
          <p>
            <strong>Longitud (rango):</strong> {labelOf(LENGTH_OPTIONS, quote.guidedQuote.lengthRange)}
          </p>
          <p>
            <strong>Altura (rango):</strong> {labelOf(HEIGHT_OPTIONS, quote.guidedQuote.heightRange)}
          </p>
          <p>
            <strong>Acabado:</strong>{' '}
            {quote.guidedQuote.finishType === 'lacado_otros' && quote.guidedQuote.finishColor
              ? `${labelOf(FINISH_OPTIONS, quote.guidedQuote.finishType)} (${quote.guidedQuote.finishColor})`
              : labelOf(FINISH_OPTIONS, quote.guidedQuote.finishType)}
          </p>
          <p>
            <strong>Plazo:</strong> {labelOf(TIMELINE_OPTIONS, quote.guidedQuote.timeline)}
          </p>
        </>
      )}
      <QuoteWindowsPanel quote={quote} />
      <p><strong>Importe cotizado:</strong> {quote.adminQuote ? formatCurrency(quote.adminQuote.total) : 'Aún no tiene precio'}</p>
      <p>
        <strong>Pago:</strong>{' '}
        {PAYMENT_STATUS_LABELS[quote.paymentStatus || 'pendiente']} · cobrado{' '}
        {formatCurrency(quote.paidAmount || 0)}
      </p>
      {quote.clientComments && quote.quoteSource !== 'guided' && (
        <p><strong>Comentario:</strong> {quote.clientComments}</p>
      )}

      {canEdit && (
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="block font-bold">
            Actualizar estado
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuoteStatus)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              {QUOTE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {quoteStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-bold">
            Importe (CLP)
            <input
              value={total}
              onChange={(e) => {
                setTotal(e.target.value);
                setSendError(null);
              }}
              placeholder="Ej: 180000"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>
          {sendError && <p className="text-sm font-bold text-rose-700">{sendError}</p>}
          <label className="block font-bold">
            Observaciones
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>
          {onRegisterPayment && (
            <div className="rounded-2xl bg-slate-50 p-3 space-y-2">
              <p className="font-bold">Registrar un pago (no se marca solo por aceptar)</p>
              <input
                placeholder="Monto"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <input
                placeholder="Medio de pago"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
              <button
                type="button"
                onClick={() => {
                  const amount = Number(payAmount);
                  if (amount > 0) {
                    onRegisterPayment(quote.id, amount, payMethod);
                    setPayAmount('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold cursor-pointer"
              >
                Guardar pago
              </button>
            </div>
          )}
        </div>
      )}

      {canDelete && onDeleteQuote && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="font-bold text-rose-800 cursor-pointer"
            >
              Eliminar cotización
            </button>
          ) : (
            <div className="space-y-2">
              <p className="font-bold text-rose-900">
                ¿Eliminar la cotización {quote.folio} de {quote.clientName}? Quedará en el historial.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteQuote(quote.id);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-xl bg-white border font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showHistory && (quote.changeHistory?.length || 0) > 0 && (
        <div className="pt-2 border-t border-slate-200">
          <p className="font-bold mb-1">Historial de cambios</p>
          <ul className="space-y-1 text-xs">
            {quote.changeHistory!.slice(0, 12).map((ev) => (
              <li key={ev.id}>
                {new Date(ev.at).toLocaleString('es-CL')} · {ev.actorName}: {ev.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </DetailModal>
  );
};
