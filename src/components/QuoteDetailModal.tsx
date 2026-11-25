import React, { useState } from 'react';
import { CalendarCheck, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import {
  DEFAULT_INSTALLATION_TIME,
  formatSlot,
  normalizeDate,
  normalizeTime,
  scheduleSlot,
  scheduleWhatsappText,
  scheduleWhatsappUrl,
} from '../utils/installationSchedule';
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
import { InstallationBudgetDetail } from './InstallationBudgetDetail';
import { PaymentBadge, StatusBadge } from './ops/OpsUi';
import { sentClientTotal } from '../utils/installationBudget';
import { EstimateBreakdown } from './QuoteEstimatePanel';

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
  onSendScheduleEmail?: (quoteId: string, date?: string, time?: string) => void | Promise<void>;
  onAcceptWithSchedule?: (quoteId: string, date: string, time: string) => void | Promise<void>;
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

/** Fecha y hora de instalación + correo con invitación + aviso por WhatsApp (solo equipo). */
const ScheduleSection: React.FC<{
  quote: QuoteRequest;
  onSendScheduleEmail?: (quoteId: string, date?: string, time?: string) => void | Promise<void>;
}> = ({ quote, onSendScheduleEmail }) => {
  const current = scheduleSlot(
    quote.adminQuote?.confirmedInstallationDate || quote.tentativeDate1,
    quote.adminQuote?.confirmedInstallationTime || quote.tentativeTime1
  );
  const [date, setDate] = useState(current?.date || '');
  const [time, setTime] = useState(current?.time || DEFAULT_INSTALLATION_TIME);
  const [sending, setSending] = useState(false);
  const typed = scheduleSlot(date, time);
  const address = [quote.clientAddress, quote.guidedQuote?.commune || quote.clientCity].filter(Boolean).join(', ');
  const whatsappUrl = scheduleWhatsappUrl(quote.clientPhone || '', scheduleWhatsappText(quote.clientName, typed, address));
  const notice = (quote.emailDispatch as { scheduleNotice?: { sentAt?: string; key?: string } } | undefined)
    ?.scheduleNotice;

  return (
    <Section
      title="Agendamiento"
      aside={
        notice?.sentAt ? (
          <span className="text-xs text-nydo-ink/60">Correo enviado {formatDateTime(notice.sentAt)}</span>
        ) : (
          <span className="text-xs text-nydo-ink/60">Correo de agendamiento sin enviar</span>
        )
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="ops-label mb-1">Fecha de instalación</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ops-input" />
        </label>
        <label className="block">
          <span className="ops-label mb-1">Hora</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="ops-input" />
        </label>
      </div>
      <p className="text-sm text-nydo-ink/70">
        {typed
          ? `Se agenda para el ${formatSlot(typed)} (duración estimada 2 h).`
          : 'Sin fecha: el correo avisa que coordinarás la instalación.'}
      </p>
      <div className="flex flex-wrap gap-2">
        {onSendScheduleEmail && (
          <button
            type="button"
            disabled={sending}
            className="ops-btn ops-btn-primary"
            onClick={async () => {
              setSending(true);
              try {
                await onSendScheduleEmail(quote.id, typed?.date, typed?.time);
              } finally {
                setSending(false);
              }
            }}
          >
            <CalendarCheck className="h-4 w-4" />
            {sending ? 'Enviando…' : 'Enviar correo con invitación'}
          </button>
        )}
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="ops-btn nydo-btn-whatsapp">
            <MessageCircle className="h-4 w-4" />
            Avisar por WhatsApp
          </a>
        ) : (
          <span className="text-sm text-nydo-ink/60">El teléfono del cliente no es un celular chileno válido para WhatsApp.</span>
        )}
      </div>
      <p className="text-xs text-nydo-ink/60">
        WhatsApp se abre con el número del cliente y el mensaje listo; revisa y presiona Enviar desde tu WhatsApp.
      </p>
    </Section>
  );
};

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
  onSendScheduleEmail,
  onAcceptWithSchedule,
}) => {
  const [notes, setNotes] = useState(quote.adminQuote?.adminNotes || quote.clientComments || '');
  const sentTotal = sentClientTotal(quote.guidedQuote?.installationBudget);
  const [total, setTotal] = useState(String(quote.adminQuote?.total || sentTotal || ''));
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [acceptDate, setAcceptDate] = useState(
    normalizeDate(quote.adminQuote?.confirmedInstallationDate || quote.tentativeDate1) || ''
  );
  const [acceptTime, setAcceptTime] = useState(
    normalizeTime(quote.adminQuote?.confirmedInstallationTime || quote.tentativeTime1) || DEFAULT_INSTALLATION_TIME
  );
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const acceptingNow = canEdit && status === 'aceptada' && quote.status !== 'aceptada';
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
  const estimate = quote.guidedQuote?.estimate;

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
                const parsed = Number(total);
                if (acceptingNow) {
                  const slot = scheduleSlot(acceptDate, acceptTime);
                  if (!slot || !normalizeTime(acceptTime)) {
                    setAcceptError('Para aprobar, indica la fecha y la hora agendadas con el cliente.');
                    return;
                  }
                  onUpdateNotes?.(quote.id, notes, Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
                  if (onAcceptWithSchedule) onAcceptWithSchedule(quote.id, slot.date, slot.time);
                  else onUpdateStatus?.(quote.id, status);
                  onClose();
                  return;
                }
                onUpdateStatus?.(quote.id, status);
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
          <p className="ops-label">{sentTotal != null && !quote.adminQuote ? 'Precio enviado' : 'Importe cotizado'}</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {quote.adminQuote ? (
              formatCurrency(quote.adminQuote.total)
            ) : sentTotal != null ? (
              formatCurrency(sentTotal)
            ) : estimate ? (
              <>
                <span className="text-nydo-ink/45 text-xs font-semibold block">Estimación del cotizador</span>
                {formatCurrency(estimate.total)}
              </>
            ) : (
              <span className="text-nydo-ink/45">Aún no tiene precio</span>
            )}
          </p>
          {sentTotal != null && (
            <p className="mt-1 text-xs text-nydo-ink/60">
              {quote.adminQuote && quote.adminQuote.total !== sentTotal
                ? `Precio enviado al cliente: ${formatCurrency(sentTotal)}.`
                : 'Total IVA incluido enviado al cliente.'}
            </p>
          )}
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

      {currentUser && currentUser.role !== 'cliente' && <InstallationBudgetDetail quote={quote} />}

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

      {estimate && (
        <Section
          title="Estimación del cotizador"
          aside={
            canEdit && (
              <button
                type="button"
                onClick={() => {
                  setTotal(String(estimate.total));
                  setSendError(null);
                }}
                className="ops-btn !min-h-8 !text-xs"
              >
                Usar {formatCurrency(estimate.total)} como importe
              </button>
            )
          }
        >
          <p className="text-xs text-nydo-ink/60">
            Calculada en el servidor con las tarifas vigentes el {formatDateTime(estimate.calculatedAt)}. Si cambias las
            tarifas después, esta estimación no cambia.
          </p>
          <EstimateBreakdown estimate={estimate} />
        </Section>
      )}

      {canEdit && (
        <Section title="Responder al cliente">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="ops-label mb-1">Estado</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as QuoteStatus);
                  setAcceptError(null);
                }}
                className="ops-input"
              >
                {QUOTE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {quoteStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            {acceptingNow && (
              <div className="sm:col-span-2 rounded-xl border border-nydo-ink/15 bg-[#fbf6f1] p-3 space-y-2">
                <p className="text-sm font-bold">Instalación agendada con el cliente</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="ops-label mb-1">Fecha</span>
                    <input
                      type="date"
                      required
                      value={acceptDate}
                      onChange={(e) => {
                        setAcceptDate(e.target.value);
                        setAcceptError(null);
                      }}
                      aria-invalid={Boolean(acceptError && !acceptDate)}
                      className="ops-input"
                    />
                  </label>
                  <label className="block">
                    <span className="ops-label mb-1">Hora</span>
                    <input
                      type="time"
                      required
                      value={acceptTime}
                      onChange={(e) => {
                        setAcceptTime(e.target.value);
                        setAcceptError(null);
                      }}
                      className="ops-input"
                    />
                  </label>
                </div>
                <p className="text-xs text-nydo-ink/60">
                  Al guardar, la cotización queda aprobada con esta fecha y el cliente recibe el correo con la invitación
                  a su calendario.
                </p>
                {acceptError && (
                  <p role="alert" className="text-sm font-bold text-[#9f1d24]">
                    {acceptError}
                  </p>
                )}
              </div>
            )}
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

      {canEdit && quote.status === 'aceptada' && (
        <ScheduleSection quote={quote} onSendScheduleEmail={onSendScheduleEmail} />
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
