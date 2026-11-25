// Utilidades de agendamiento de instalación: compartidas por el servidor (correo con
// invitación .ics) y el panel de admin (botón de WhatsApp). Sin dependencias.

export const INSTALLATION_TIMEZONE = 'America/Santiago';
export const INSTALLATION_DURATION_MINUTES = 120;
export const DEFAULT_INSTALLATION_TIME = '10:00';

export interface ScheduleSlot {
  /** AAAA-MM-DD */
  date: string;
  /** HH:MM (24 h) */
  time: string;
}

/** Normaliza fechas tipo 2026-12-03, 03-12-2026 o 03/12/2026 a AAAA-MM-DD. */
export function normalizeDate(raw?: string | null): string | null {
  const value = String(raw || '').trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

/** Normaliza horas tipo 10:00, 9:30, 10.00 o 10:00 hrs a HH:MM. */
export function normalizeTime(raw?: string | null): string | null {
  const m = /(\d{1,2})[:.h](\d{2})/.exec(String(raw || ''));
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function scheduleSlot(date?: string | null, time?: string | null): ScheduleSlot | null {
  const d = normalizeDate(date);
  if (!d) return null;
  return { date: d, time: normalizeTime(time) || DEFAULT_INSTALLATION_TIME };
}

/** Diferencia en minutos entre la hora de Santiago y UTC para un instante dado. */
function santiagoOffsetMinutes(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: INSTALLATION_TIMEZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - utcMs) / 60000);
}

/** Convierte una fecha y hora de Santiago al instante UTC correspondiente. */
export function slotToUtc(slot: ScheduleSlot): Date {
  const [y, mo, d] = slot.date.split('-').map(Number);
  const [h, mi] = slot.time.split(':').map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  let utc = naive - santiagoOffsetMinutes(naive) * 60000;
  utc = naive - santiagoOffsetMinutes(utc) * 60000;
  return new Date(utc);
}

function icsStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Texto legible en español, p. ej. "jueves 3 de diciembre a las 10:00". */
export function formatSlot(slot: ScheduleSlot): string {
  const day = new Intl.DateTimeFormat('es-CL', {
    timeZone: INSTALLATION_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(slotToUtc(slot));
  return `${day} a las ${slot.time}`;
}

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

export interface CalendarEventInput {
  uid: string;
  slot: ScheduleSlot;
  title: string;
  description: string;
  location: string;
  organizerEmail: string;
  attendeeEmail: string;
}

/** Invitación de calendario (RFC 5545) para adjuntar al correo. */
export function buildIcs(input: CalendarEventInput): string {
  const start = slotToUtc(input.slot);
  const end = new Date(start.getTime() + INSTALLATION_DURATION_MINUTES * 60000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nydo Mallas//Agendamiento//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(input.title)}`,
    `DESCRIPTION:${icsEscape(input.description)}`,
    `LOCATION:${icsEscape(input.location)}`,
    `ORGANIZER;CN=Nydo Mallas:mailto:${input.organizerEmail}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${input.attendeeEmail}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Mañana instalamos tus mallas (Nydo Mallas)',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

/** Enlace para agregar el evento a Google Calendar (respaldo si el cliente no abre el .ics). */
export function googleCalendarUrl(input: Omit<CalendarEventInput, 'uid' | 'organizerEmail' | 'attendeeEmail'>): string {
  const start = slotToUtc(input.slot);
  const end = new Date(start.getTime() + INSTALLATION_DURATION_MINUTES * 60000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    details: input.description,
    location: input.location,
    ctz: INSTALLATION_TIMEZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Teléfono chileno a formato wa.me (solo dígitos con 56). Devuelve null si no es válido. */
export function whatsappNumber(raw?: string | null): string | null {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 8) digits = `569${digits}`;
  else if (digits.length === 9 && digits.startsWith('9')) digits = `56${digits}`;
  if (!/^56\d{9}$/.test(digits)) return null;
  return digits;
}

export function scheduleWhatsappText(clientName: string, slot: ScheduleSlot | null, address: string): string {
  const firstName = String(clientName || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `Hola ${firstName}` : 'Hola';
  if (!slot) {
    return `${greeting}, te confirmamos que recibimos la aprobación de tu cotización de mallas. En breve te escribimos para coordinar el día y la hora de la instalación. — Nydo Mallas`;
  }
  const where = address ? ` en ${address}` : '';
  return `${greeting}, te confirmamos que tu instalación de mallas quedó agendada para el ${formatSlot(slot)}${where}. Te enviamos también la invitación a tu correo. Cualquier duda, escríbenos por aquí. — Nydo Mallas`;
}

export function scheduleWhatsappUrl(phone: string, text: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
}
