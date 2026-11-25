import React from 'react';
import type { QuoteRequest } from '../../types';
import { scheduleSlot } from '../../utils/installationSchedule';

/** Fecha y hora de instalación agendada (confirmada por el equipo o la tentativa del cliente). */
export function scheduledSlot(quote: QuoteRequest) {
  return scheduleSlot(
    quote.adminQuote?.confirmedInstallationDate || quote.tentativeDate1,
    quote.adminQuote?.confirmedInstallationTime || quote.tentativeTime1
  );
}

export const ScheduleCell: React.FC<{ quote: QuoteRequest }> = ({ quote }) => {
  const slot = scheduledSlot(quote);
  if (!slot) return <span className="text-xs font-bold text-nydo-orange">Sin agendar</span>;
  const [y, m, d] = slot.date.split('-');
  return (
    <span className="block tabular-nums">
      <span className="block font-semibold">{`${d}/${m}/${y}`}</span>
      <span className="block text-xs text-nydo-ink/55">{slot.time} hrs</span>
    </span>
  );
};

