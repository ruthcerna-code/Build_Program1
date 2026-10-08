import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, WHATSAPP_QUOTE_URL } from '../constants/contact';
import {
  FINISH_OPTIONS,
  HEIGHT_OPTIONS,
  LENGTH_OPTIONS,
  SURFACE_OPTIONS,
  TIMELINE_OPTIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
} from '../constants/guidedQuote';
import type { QuoteRequest } from '../types';
import {
  displayHeightCm,
  displayWidthCm,
  formatAreaM2,
  isBalconySurface,
  itemNoun,
  itemTitle,
} from '../utils/windowMeasures';

const PROPERTY_LABEL: Record<string, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  oficina: 'Oficina',
  otro: 'Otro',
};

function esc(value: string | number | undefined | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatWhen(iso?: string) {
  return new Date(iso || Date.now()).toLocaleString('es-CL', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function infoRow(label: string, value: string) {
  if (!value) return '';
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #e6edf2;width:42%;font-size:13px;color:#6b8494;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0;border-bottom:1px solid #e6edf2;font-size:14px;color:#1f2d3a;font-weight:bold;vertical-align:top;">${esc(value)}</td>
  </tr>`;
}

function sectionTitle(title: string) {
  return `<p style="margin:0 0 12px 0;font-size:12px;letter-spacing:0.8px;text-transform:uppercase;color:#6b8494;font-weight:bold;">${esc(title)}</p>`;
}

function wrapEmail(params: {
  folio: string;
  title: string;
  preview: string;
  innerHtml: string;
}): string {
  const { folio, title, preview, innerHtml } = params;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f5;font-family:Arial,Helvetica,sans-serif;color:#1f2d3a;">

<!-- Texto de vista previa (se ve en la bandeja de entrada, no en el cuerpo) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
${esc(preview)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f5;">
<tr>
<td align="center" style="padding:24px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:10px;overflow:hidden;">

  <!-- ENCABEZADO -->
  <tr>
    <td style="background-color:#12344d;padding:28px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.3px;">NydoMallas</td>
          <td align="right" style="font-size:12px;color:#a9c4d8;">Folio<br><span style="font-size:15px;font-weight:bold;color:#ffffff;">${esc(folio)}</span></td>
        </tr>
      </table>
    </td>
  </tr>

${innerHtml}

  <!-- PIE -->
  <tr>
    <td style="background-color:#12344d;padding:22px 32px;">
      <p style="margin:0 0 6px 0;font-size:14px;font-weight:bold;color:#ffffff;">Nydo Mallas</p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#a9c4d8;">
        ${esc(CONTACT_EMAIL)} · WhatsApp ${esc(CONTACT_PHONE_DISPLAY)}<br>
        Mallas de seguridad para ventanas y balcones.
      </p>
    </td>
  </tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function measuresTable(quote: QuoteRequest) {
  const balcony = isBalconySurface(quote.guidedQuote?.surfaceType || '');
  const noun = itemNoun(quote.guidedQuote?.surfaceType || '', true);
  const rows = (quote.windows || [])
    .map((win, index) => {
      const zebra = index % 2 === 1 ? 'background-color:#f7fafc;' : '';
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e6edf2;font-size:13px;color:#1f2d3a;${zebra}">${esc(itemTitle(quote.guidedQuote?.surfaceType || '', index))}<br><span style="font-size:12px;color:#6b8494;font-weight:normal;">${esc(win.name || '—')}</span></td>
        <td align="center" style="padding:10px 8px;border-bottom:1px solid #e6edf2;font-size:13px;color:#1f2d3a;${zebra}">${esc(displayWidthCm(win))}</td>
        <td align="center" style="padding:10px 8px;border-bottom:1px solid #e6edf2;font-size:13px;color:#1f2d3a;${zebra}">${esc(displayHeightCm(win))}</td>
        <td align="right" style="padding:10px 8px;border-bottom:1px solid #e6edf2;font-size:13px;color:#1f2d3a;${zebra}">${esc(formatAreaM2(win.area))}</td>
      </tr>`;
    })
    .join('');

  return `${sectionTitle(`Detalle de ${noun} (${quote.windows.length})`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:8px;background-color:#eef2f5;font-size:11px;font-weight:bold;color:#12344d;text-transform:uppercase;">${balcony ? 'Paño' : 'Ventana'} / ubicación</td>
    <td align="center" style="padding:8px;background-color:#eef2f5;font-size:11px;font-weight:bold;color:#12344d;text-transform:uppercase;">Ancho (cm)</td>
    <td align="center" style="padding:8px;background-color:#eef2f5;font-size:11px;font-weight:bold;color:#12344d;text-transform:uppercase;">Alto (cm)</td>
    <td align="right" style="padding:8px;background-color:#eef2f5;font-size:11px;font-weight:bold;color:#12344d;text-transform:uppercase;">m²</td>
  </tr>
  ${rows || `<tr><td colspan="4" style="padding:12px 8px;font-size:13px;color:#6b8494;">Sin medidas registradas.</td></tr>`}
  <tr>
    <td colspan="3" style="padding:12px 8px 4px 8px;font-size:13px;color:#6b8494;">Superficie total</td>
    <td align="right" style="padding:12px 8px 4px 8px;font-size:15px;font-weight:bold;color:#12344d;">${esc(formatAreaM2(quote.totalAreaM2))} m²</td>
  </tr>
</table>
<p style="margin:10px 0 0 0;font-size:12px;line-height:1.5;color:#6b8494;">Las medidas son referenciales y se confirman antes de la instalación.</p>`;
}

function clientBlock(quote: QuoteRequest) {
  const g = quote.guidedQuote;
  const finish = g
    ? g.finishType === 'lacado_otros' && g.finishColor
      ? `${labelOf(FINISH_OPTIONS, g.finishType)} (${g.finishColor})`
      : labelOf(FINISH_OPTIONS, g.finishType)
    : '';
  return `${sectionTitle('Datos del cliente')}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  ${infoRow('Nombre', quote.clientName)}
  ${infoRow('Correo', quote.clientEmail)}
  ${infoRow('Teléfono', quote.clientPhone)}
  ${infoRow('Región', g?.regionName || quote.clientAddress)}
  ${infoRow('Comuna', g?.commune || quote.clientCity)}
  ${infoRow('Tipo de propiedad', PROPERTY_LABEL[quote.propertyType] || quote.propertyType)}
  ${g ? infoRow('Tipo de trabajo', labelOf(WORK_TYPE_OPTIONS, g.workType)) : ''}
  ${g ? infoRow('Superficie', labelOf(SURFACE_OPTIONS, g.surfaceType)) : ''}
  ${g ? infoRow('Longitud', labelOf(LENGTH_OPTIONS, g.lengthRange)) : ''}
  ${g ? infoRow('Altura', labelOf(HEIGHT_OPTIONS, g.heightRange)) : ''}
  ${g ? infoRow('Acabado', finish) : ''}
  ${g ? infoRow('Plazo preferente', labelOf(TIMELINE_OPTIONS, g.timeline)) : ''}
  ${quote.clientComments ? infoRow('Observaciones', quote.clientComments) : ''}
</table>`;
}

function ctaBlock() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background-color:#12344d;border-radius:6px;">
      <a href="${esc(WHATSAPP_QUOTE_URL)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Escribir por WhatsApp</a>
    </td>
  </tr>
</table>
<p style="margin:12px 0 0 0;font-size:12px;color:#6b8494;">O responde este correo · ${esc(CONTACT_EMAIL)}</p>`;
}

function requestInner(quote: QuoteRequest, recipient: 'client' | 'company') {
  const heading =
    recipient === 'company' ? 'Nueva solicitud de cotización' : 'Recibimos tu solicitud de cotización';
  const intro =
    recipient === 'company'
      ? `El cliente ${quote.clientName} ingresó una solicitud. Revisa las medidas, emite el presupuesto en Recepción y coordina la instalación. En este aviso no hay precio para el cliente.`
      : `Hola ${quote.clientName}: un asesor revisará tus medidas y te enviará la cotización formal. En esta instancia no incluimos precios automáticos ni referenciales.`;
  const status =
    recipient === 'company'
      ? 'En proceso · Sin precio emitido · Acción: evaluar en Recepción'
      : 'En proceso de cotización · Sin precio emitido';

  return `
  <!-- MENSAJE PRINCIPAL -->
  <tr>
    <td style="padding:32px 32px 8px 32px;">
      <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.8px;text-transform:uppercase;color:#6b8494;font-weight:bold;">Solicitud recibida</p>
      <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#12344d;">${esc(heading)}</h1>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1f2d3a;">${esc(intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f5;border-radius:8px;">
        <tr>
          <td style="padding:14px 16px;font-size:14px;color:#12344d;">
            <strong>Estado:</strong> ${esc(status)}<br>
            <span style="font-size:12px;color:#6b8494;">Fecha de ingreso: ${esc(formatWhen(quote.createdAt))}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">${clientBlock(quote)}</td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">${measuresTable(quote)}</td>
  </tr>
  <tr>
    <td style="padding:24px 32px 32px 32px;">
      ${sectionTitle('Siguiente paso')}
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#1f2d3a;">${
        recipient === 'company'
          ? 'Fija el presupuesto oficial y avisa al cliente cuando la cotización formal esté lista.'
          : 'Un asesor técnico te contactará para confirmar medidas y enviarte la cotización formal.'
      }</p>
      ${ctaBlock()}
    </td>
  </tr>`;
}

function pricedInner(quote: QuoteRequest, recipient: 'client' | 'company') {
  const admin = quote.adminQuote;
  const heading = recipient === 'company' ? 'Copia del presupuesto enviado' : 'Tu cotización formal está lista';
  const intro =
    recipient === 'company'
      ? `Presupuesto enviado a ${quote.clientName} <${quote.clientEmail}>.`
      : `Hola ${quote.clientName}: adjuntamos el presupuesto de mallas de seguridad para tu propiedad.`;

  const valueRows = admin
    ? `${infoRow('Malla y anclajes', formatCLP(admin.meshTotalCost))}
       ${infoRow('Perfiles y fijaciones', formatCLP(admin.profilesAndFixingsCost))}
       ${infoRow('Mano de obra e instalación', formatCLP(admin.laborAndInstallCost))}
       ${admin.discountAmount > 0 ? infoRow(`Descuento (${admin.discountPercentage}%)`, `-${formatCLP(admin.discountAmount)}`) : ''}
       ${infoRow('Garantía', `${admin.warrantyYears} años`)}
       ${infoRow('Tiempo estimado', admin.estimatedTime)}
       ${admin.adminNotes ? infoRow('Observaciones', admin.adminNotes) : ''}`
    : infoRow('Valor', 'A coordinar');

  const total = admin ? formatCLP(admin.total) : 'A coordinar';

  return `
  <tr>
    <td style="padding:32px 32px 8px 32px;">
      <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.8px;text-transform:uppercase;color:#6b8494;font-weight:bold;">Cotización formal</p>
      <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#12344d;">${esc(heading)}</h1>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1f2d3a;">${esc(intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#12344d;border-radius:8px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#a9c4d8;">Total</p>
            <p style="margin:0;font-size:24px;font-weight:bold;color:#ffffff;">${esc(total)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">${clientBlock(quote)}</td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">${measuresTable(quote)}</td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">
      ${sectionTitle('Valores')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${valueRows}</table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 32px 32px;">
      ${sectionTitle('Confirmar o agendar')}
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#1f2d3a;">Responde este correo o escribe al WhatsApp para confirmar el presupuesto.</p>
      ${ctaBlock()}
    </td>
  </tr>`;
}

export function generateQuoteEmailHtml(
  quote: QuoteRequest,
  kind: 'request' | 'priced',
  recipient: 'client' | 'company'
): string {
  const folio = quote.folio || '—';
  if (kind === 'priced' && quote.adminQuote) {
    const title = `Cotización ${folio} - Nydo Mallas`;
    const preview =
      recipient === 'company'
        ? `Copia interna. Presupuesto ${folio} enviado a ${quote.clientName}.`
        : `Tu cotización ${folio} está lista. Revisa el presupuesto de Nydo Mallas.`;
    return wrapEmail({
      folio,
      title,
      preview,
      innerHtml: pricedInner(quote, recipient),
    });
  }

  const title = `Solicitud de cotización ${folio} recibida`;
  const preview =
    recipient === 'company'
      ? `Nueva solicitud ${folio} de ${quote.clientName}. Revisa las medidas y emite el presupuesto.`
      : `Recibimos tu solicitud ${folio}. Un asesor revisará tus medidas y te enviará la cotización formal.`;
  return wrapEmail({
    folio,
    title,
    preview,
    innerHtml: requestInner(quote, recipient),
  });
}
