import { QuoteStatus } from '../types';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  pendiente: 'Recibida',
  en_revision: 'En revisión',
  cotizada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

export const QUOTE_STATUS_OPTIONS: QuoteStatus[] = [
  'pendiente',
  'en_revision',
  'cotizada',
  'aceptada',
  'rechazada',
  'cancelada',
];

export function quoteStatusLabel(status?: string): string {
  if (!status) return 'Recibida';
  return QUOTE_STATUS_LABELS[status as QuoteStatus] || status;
}

export const PAYMENT_STATUS_LABELS = {
  pendiente: 'Pendiente',
  abono_parcial: 'Parcial',
  pagado_total: 'Pagado',
} as const;
