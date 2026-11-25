import { QUOTE_COPY_EMAIL, SITE_URL } from './config';
import { sendClientEmail } from './sendQuoteMail';
import {
  buildIcs,
  formatSlot,
  googleCalendarUrl,
  INSTALLATION_DURATION_MINUTES,
  scheduleSlot,
  type ScheduleSlot,
} from '../src/utils/installationSchedule';
import { CONTACT_PHONE_DISPLAY, WHATSAPP_QUOTE_URL } from '../src/constants/contact';

/** Datos mínimos de la cotización para el aviso de agendamiento (desde la fila de la base). */
export interface ScheduleQuote {
  id: string;
  folio: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientCity: string;
  confirmedDate?: string | null;
  confirmedTime?: string | null;
  tentativeDate?: string | null;
  tentativeTime?: string | null;
}

export function slotForQuote(q: ScheduleQuote): ScheduleSlot | null {
  return scheduleSlot(q.confirmedDate, q.confirmedTime) || scheduleSlot(q.tentativeDate, q.tentativeTime);
}

/** Clave que identifica lo que ya se avisó: evita mandar dos veces el mismo correo. */
export function noticeKey(slot: ScheduleSlot | null): string {
  return slot ? `${slot.date} ${slot.time}` : 'sin-fecha';
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function addressOf(q: ScheduleQuote) {
  return [q.clientAddress, q.clientCity].map((v) => String(v || '').trim()).filter(Boolean).join(', ');
}

export function buildScheduleEmail(q: ScheduleQuote, slot: ScheduleSlot | null) {
  const firstName = String(q.clientName || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `Hola ${firstName}` : 'Hola';
  const address = addressOf(q);
  const hours = INSTALLATION_DURATION_MINUTES / 60;

  if (!slot) {
    const subject = `Recibimos tu aprobación – Nydo Mallas (N° ${q.folio})`;
    const text = `${greeting},

Gracias por aprobar tu cotización N° ${q.folio}. En breve te contactaremos para coordinar el día y la hora de la instalación.

Si prefieres, escríbenos por WhatsApp al ${CONTACT_PHONE_DISPLAY}.

Equipo Nydo Mallas`;
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;line-height:1.55">
<p>${escapeHtml(greeting)},</p>
<p>Gracias por aprobar tu cotización <strong>N° ${escapeHtml(q.folio)}</strong>. En breve te contactaremos para coordinar el día y la hora de la instalación.</p>
<p>Si prefieres, escríbenos por <a href="${WHATSAPP_QUOTE_URL}">WhatsApp al ${escapeHtml(CONTACT_PHONE_DISPLAY)}</a>.</p>
<p>Equipo Nydo Mallas<br><a href="${SITE_URL}">${SITE_URL.replace(/^https?:\/\//, '')}</a></p></div>`;
    return { subject, text, html, attachments: [] };
  }

  const when = formatSlot(slot);
  const title = 'Instalación de mallas – Nydo Mallas';
  const description = `Instalación de mallas de seguridad (cotización N° ${q.folio}). Duración estimada: ${hours} h. Contacto: ${CONTACT_PHONE_DISPLAY} · ${QUOTE_COPY_EMAIL}`;
  const calendarUrl = googleCalendarUrl({ slot, title, description, location: address });
  const ics = buildIcs({
    uid: `nydo-${q.id}@nydo.cl`,
    slot,
    title,
    description,
    location: address,
    organizerEmail: QUOTE_COPY_EMAIL,
    attendeeEmail: q.clientEmail,
  });

  const subject = `Instalación agendada: ${when} – Nydo Mallas`;
  const text = `${greeting},

Tu instalación de mallas quedó agendada para el ${when}${address ? `, en ${address}` : ''}.
Duración estimada: ${hours} horas. Cotización N° ${q.folio}.

Adjuntamos la invitación para tu calendario. Si usas Google Calendar, también puedes agregarla aquí:
${calendarUrl}

¿Necesitas cambiar la fecha? Responde este correo o escríbenos por WhatsApp al ${CONTACT_PHONE_DISPLAY}.

Equipo Nydo Mallas`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;line-height:1.55">
<p>${escapeHtml(greeting)},</p>
<p>Tu instalación de mallas quedó agendada para el <strong>${escapeHtml(when)}</strong>${
    address ? `, en <strong>${escapeHtml(address)}</strong>` : ''
  }.</p>
<p style="color:#4b5563">Duración estimada: ${hours} horas · Cotización N° ${escapeHtml(q.folio)}</p>
<p><a href="${escapeHtml(calendarUrl)}" style="display:inline-block;background:#ff5a1f;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:10px">Agregar a mi calendario</a></p>
<p style="font-size:13px;color:#6b7280">También adjuntamos la invitación (archivo .ics) para Outlook, Apple Calendar u otros calendarios.</p>
<p>¿Necesitas cambiar la fecha? Responde este correo o escríbenos por <a href="${WHATSAPP_QUOTE_URL}">WhatsApp al ${escapeHtml(CONTACT_PHONE_DISPLAY)}</a>.</p>
<p>Equipo Nydo Mallas<br><a href="${SITE_URL}">${SITE_URL.replace(/^https?:\/\//, '')}</a></p></div>`;

  return {
    subject,
    text,
    html,
    attachments: [
      {
        filename: 'instalacion-nydo-mallas.ics',
        content: Buffer.from(ics, 'utf-8').toString('base64'),
        content_type: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ],
  };
}

export async function sendScheduleEmail(q: ScheduleQuote) {
  const slot = slotForQuote(q);
  const mail = buildScheduleEmail(q, slot);
  const result = await sendClientEmail(q.clientEmail, mail.subject, mail.text, mail.html, mail.attachments);
  return { ...result, slot, key: noticeKey(slot) };
}
