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
import {
  FINISH_OPTIONS,
  SURFACE_OPTIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
} from '../src/constants/guidedQuote';
import { displayHeightCm, displayWidthCm, formatAreaM2 } from '../src/utils/windowMeasures';
import { sentClientTotal } from '../src/utils/installationBudget';
import { SPACE_TYPE_OPTIONS } from '../src/utils/quotePricing';
import type { QuoteRequest } from '../src/types';

const SPACE_LABELS: Record<string, string> = Object.fromEntries(SPACE_TYPE_OPTIONS.map((o) => [o.id, o.label]));

const MESH_LABELS: Record<string, string> = {
  monofilamento: 'Monofilamento',
  multifilamento: 'Multifilamento',
};

export function slotForQuote(q: QuoteRequest): ScheduleSlot | null {
  return (
    scheduleSlot(q.adminQuote?.confirmedInstallationDate, q.adminQuote?.confirmedInstallationTime) ||
    scheduleSlot(q.tentativeDate1, q.tentativeTime1)
  );
}

/** Clave que identifica lo que ya se avisó: evita mandar dos veces el mismo correo. */
export function noticeKey(slot: ScheduleSlot | null): string {
  return slot ? `${slot.date} ${slot.time}` : 'sin-fecha';
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clp(value: number) {
  return `$${Math.round(value).toLocaleString('es-CL')}`;
}

function addressOf(q: QuoteRequest) {
  // Las solicitudes guiadas guardan región y comuna (sin calle): se muestran como "Comuna, Región".
  const parts = q.guidedQuote
    ? [q.guidedQuote.commune || q.clientCity, q.guidedQuote.regionName || q.clientAddress]
    : [q.clientAddress, q.clientCity];
  return parts.map((v) => String(v || '').trim()).filter(Boolean).join(', ');
}

/** El resumen automático de las solicitudes guiadas es interno (trae tarifas y cálculos): no va al cliente. */
function isInternalSummary(text: string) {
  return /^Solicitud guiada/i.test(text.trim());
}

/** Campos del trabajo que se muestran al cliente (solo los que tienen dato). */
export function workDetails(q: QuoteRequest) {
  const g = q.guidedQuote;
  const rows: { label: string; value: string }[] = [];
  if (g?.workType) rows.push({ label: 'Trabajo', value: labelOf(WORK_TYPE_OPTIONS, g.workType) });
  if (g?.surfaceType) rows.push({ label: 'Superficie', value: labelOf(SURFACE_OPTIONS, g.surfaceType) });
  if (g?.finishType) {
    const finish = labelOf(FINISH_OPTIONS, g.finishType);
    rows.push({ label: 'Acabado', value: g.finishColor ? `${finish} (${g.finishColor})` : finish });
  }
  const meshes = [...new Set((q.windows || []).map((w) => MESH_LABELS[w.meshType]).filter(Boolean))];
  if (meshes.length) rows.push({ label: 'Tipo de malla', value: meshes.join(', ') });

  const windows = (q.windows || []).map((w, i) => {
    const width = displayWidthCm(w);
    const height = displayHeightCm(w);
    const space = w.spaceType ? SPACE_LABELS[w.spaceType] || w.spaceType : '';
    return {
      name: w.name || `Espacio ${i + 1}`,
      space,
      size: width && height ? `${width} × ${height} cm` : '—',
      area: Number(w.area) > 0 ? `${formatAreaM2(Number(w.area))} m²` : '—',
      notes: String(w.notes || '').trim(),
    };
  });
  const totalArea = Number(q.totalAreaM2) > 0 ? `${formatAreaM2(Number(q.totalAreaM2))} m²` : '';

  const total = Number(q.adminQuote?.total || sentClientTotal(q.guidedQuote?.installationBudget) || 0);
  const amount = total > 0 ? `${clp(total)}${q.adminQuote ? (q.adminQuote.includeTax ? ' IVA incluido' : ' + IVA') : ' IVA incluido'}` : '';

  const notes: { label: string; value: string }[] = [];
  const rawTeam = String(q.adminQuote?.adminNotes || '').trim();
  const rawClient = String(q.clientComments || '').trim();
  const teamNotes = isInternalSummary(rawTeam) ? '' : rawTeam;
  const clientNotes = isInternalSummary(rawClient) ? '' : rawClient;
  if (teamNotes) notes.push({ label: 'Observaciones de Nydo', value: teamNotes });
  if (clientNotes && clientNotes !== teamNotes) notes.push({ label: 'Tus comentarios', value: clientNotes });

  return {
    rows,
    windows,
    totalArea,
    amount,
    warranty: q.adminQuote?.warrantyYears ? `${q.adminQuote.warrantyYears} año(s)` : '',
    notes,
  };
}

function detailText(q: QuoteRequest) {
  const d = workDetails(q);
  const lines: string[] = ['DETALLE DEL TRABAJO'];
  for (const r of d.rows) lines.push(`- ${r.label}: ${r.value}`);
  d.windows.forEach((w) =>
    lines.push(`- ${w.name}${w.space ? ` (${w.space})` : ''}: ${w.size} · ${w.area}${w.notes ? ` · ${w.notes}` : ''}`)
  );
  if (d.totalArea) lines.push(`- Superficie total: ${d.totalArea}`);
  if (d.amount) lines.push(`- Importe aprobado: ${d.amount}`);
  if (d.warranty) lines.push(`- Garantía: ${d.warranty}`);
  if (d.notes.length) {
    lines.push('', 'OBSERVACIONES');
    for (const n of d.notes) lines.push(`- ${n.label}: ${n.value}`);
  }
  return lines.join('\n');
}

const TD_LABEL = 'padding:6px 12px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap';
const TD_VALUE = 'padding:6px 0;color:#111827;font-weight:600;vertical-align:top';

function detailHtml(q: QuoteRequest) {
  const d = workDetails(q);
  const rows = [
    ...d.rows,
    ...(d.totalArea ? [{ label: 'Superficie total', value: d.totalArea }] : []),
    ...(d.amount ? [{ label: 'Importe aprobado', value: d.amount }] : []),
    ...(d.warranty ? [{ label: 'Garantía', value: d.warranty }] : []),
  ]
    .map((r) => `<tr><td style="${TD_LABEL}">${escapeHtml(r.label)}</td><td style="${TD_VALUE}">${escapeHtml(r.value)}</td></tr>`)
    .join('');

  const windows = d.windows.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-top:10px;font-size:14px">
<tr style="background:#f3f4f6"><th align="left" style="padding:8px">Espacio</th><th align="left" style="padding:8px">Medidas</th><th align="right" style="padding:8px">Superficie</th></tr>
${d.windows
  .map(
    (w) =>
      `<tr style="border-top:1px solid #e5e7eb"><td style="padding:8px">${escapeHtml(w.name)}${
        w.space ? `<br><span style="color:#6b7280;font-size:12px">${escapeHtml(w.space)}</span>` : ''
      }${w.notes ? `<br><span style="color:#6b7280;font-size:12px">${escapeHtml(w.notes)}</span>` : ''}</td><td style="padding:8px">${escapeHtml(
        w.size
      )}</td><td align="right" style="padding:8px">${escapeHtml(w.area)}</td></tr>`
  )
  .join('')}
</table>`
    : '';

  const notes = d.notes.length
    ? `<h3 style="margin:22px 0 8px;font-size:15px;color:#111827">Observaciones</h3>
${d.notes
  .map(
    (n) =>
      `<p style="margin:0 0 8px;padding:10px 12px;background:#fff7ed;border-left:3px solid #ff5a1f;border-radius:6px"><strong>${escapeHtml(
        n.label
      )}:</strong><br>${escapeHtml(n.value).replace(/\n/g, '<br>')}</p>`
  )
  .join('')}`
    : '';

  return `<h3 style="margin:22px 0 8px;font-size:15px;color:#111827">Detalle del trabajo</h3>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>
${windows}
${notes}`;
}

function wrapHtml(inner: string) {
  return `<div style="background:#f5f1ec;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;padding:28px 24px;color:#1f2937;font-size:15px;line-height:1.55">
<p style="margin:0 0 18px;font-size:22px;font-weight:900;color:#111827">nydo<span style="color:#ff5a1f">✳</span> <span style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#6b7280">MALLAS DE PROTECCIÓN</span></p>
${inner}
<p style="margin:24px 0 0">Equipo Nydo Mallas<br><a href="${SITE_URL}" style="color:#ff5a1f">${SITE_URL.replace(/^https?:\/\//, '')}</a> · ${escapeHtml(
    CONTACT_PHONE_DISPLAY
  )}</p>
</div></div>`;
}

export function buildScheduleEmail(q: QuoteRequest, slot: ScheduleSlot | null) {
  const firstName = String(q.clientName || '').trim().split(/\s+/)[0] || '';
  const greeting = firstName ? `Hola ${firstName}` : 'Hola';
  const address = addressOf(q);
  const hours = INSTALLATION_DURATION_MINUTES / 60;
  const whatsapp = `<a href="${WHATSAPP_QUOTE_URL}" style="color:#ff5a1f">WhatsApp ${escapeHtml(CONTACT_PHONE_DISPLAY)}</a>`;

  if (!slot) {
    const subject = `Aprobaste tu cotización: coordinaremos tu visita – Nydo Mallas (N° ${q.folio})`;
    const text = `${greeting},

Gracias por aprobar tu cotización N° ${q.folio}. Te contactaremos en breve para coordinar el día y la hora de la visita de instalación.

${detailText(q)}

¿Prefieres proponer una fecha? Responde este correo o escríbenos por WhatsApp al ${CONTACT_PHONE_DISPLAY}.

Equipo Nydo Mallas`;
    const html = wrapHtml(`<p>${escapeHtml(greeting)},</p>
<p>Gracias por aprobar tu cotización <strong>N° ${escapeHtml(q.folio)}</strong>. Te contactaremos en breve para coordinar el día y la hora de la visita de instalación.</p>
${detailHtml(q)}
<p style="margin-top:22px">¿Prefieres proponer una fecha? Responde este correo o escríbenos por ${whatsapp}.</p>`);
    return { subject, text, html, attachments: [] };
  }

  const when = formatSlot(slot);
  const title = `Visita de instalación Nydo Mallas (N° ${q.folio})`;
  const description = `Instalación de mallas de protección, cotización N° ${q.folio}. Duración estimada: ${hours} h. Contacto: ${CONTACT_PHONE_DISPLAY} · ${QUOTE_COPY_EMAIL}`;
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

  const subject = `Agendamos tu visita de instalación: ${when} – Nydo Mallas (N° ${q.folio})`;
  const text = `${greeting},

Agendamos tu visita de instalación de mallas.

FECHA COORDINADA
- Día y hora: ${when}
- Duración estimada: ${hours} horas
${address ? `- Dirección: ${address}\n` : ''}- Cotización: N° ${q.folio}

${detailText(q)}

Agrega la visita a tu calendario con el archivo adjunto o, si usas Google Calendar, aquí:
${calendarUrl}

¿Necesitas cambiar la fecha? Responde este correo o escríbenos por WhatsApp al ${CONTACT_PHONE_DISPLAY}.

Equipo Nydo Mallas`;

  const html = wrapHtml(`<p>${escapeHtml(greeting)},</p>
<p>Agendamos tu <strong>visita de instalación</strong> de mallas.</p>
<div style="margin:18px 0;padding:16px 18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px">
<p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;color:#9a3412">FECHA COORDINADA</p>
<p style="margin:0;font-size:19px;font-weight:800;color:#111827">${escapeHtml(when.charAt(0).toUpperCase() + when.slice(1))}</p>
<p style="margin:6px 0 0;color:#4b5563">Duración estimada: ${hours} horas${address ? `<br>${escapeHtml(address)}` : ''}<br>Cotización N° ${escapeHtml(q.folio)}</p>
<p style="margin:14px 0 0"><a href="${escapeHtml(calendarUrl)}" style="display:inline-block;background:#ff5a1f;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 18px;border-radius:10px">Agregar a mi calendario</a></p>
<p style="margin:8px 0 0;font-size:12px;color:#6b7280">También adjuntamos la invitación (.ics) para Outlook, Apple Calendar u otros.</p>
</div>
${detailHtml(q)}
<p style="margin-top:22px">¿Necesitas cambiar la fecha? Responde este correo o escríbenos por ${whatsapp}.</p>`);

  return {
    subject,
    text,
    html,
    attachments: [
      {
        filename: 'visita-instalacion-nydo-mallas.ics',
        content: Buffer.from(ics, 'utf-8').toString('base64'),
        content_type: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ],
  };
}

export async function sendScheduleEmail(q: QuoteRequest) {
  const slot = slotForQuote(q);
  const mail = buildScheduleEmail(q, slot);
  const result = await sendClientEmail(q.clientEmail, mail.subject, mail.text, mail.html, mail.attachments);
  return { ...result, slot, key: noticeKey(slot) };
}
