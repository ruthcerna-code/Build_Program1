import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from '../constants/contact';
import {
  FINISH_OPTIONS,
  SURFACE_OPTIONS,
  TIMELINE_OPTIONS,
  labelOf,
} from '../constants/guidedQuote';
import type { QuoteRequest } from '../types';
import {
  ATTENTION_STATUSES,
  ESTIMATE_FOOTNOTE,
  ESTIMATE_NEXT_STEP,
  ESTIMATE_VALIDITY_DAYS,
  clientTotalLine,
  formatBudgetCLP,
  formatBudgetQty,
  formatConfigDate,
  marginCaption,
  pesos,
  realMarginPercent,
  type InstallationBudget,
} from '../utils/installationBudget';

function when(iso?: string) {
  return new Date(iso || Date.now()).toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'short' });
}

function esc(value: string | number | undefined | null) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function clientRows(quote: QuoteRequest): { label: string; value: string }[] {
  const guided = quote.guidedQuote;
  const finish = guided
    ? guided.finishType === 'lacado_otros' && guided.finishColor
      ? `${labelOf(FINISH_OPTIONS, guided.finishType)} (${guided.finishColor})`
      : labelOf(FINISH_OPTIONS, guided.finishType)
    : '';
  const address =
    quote.clientAddress && quote.clientAddress !== guided?.regionName ? quote.clientAddress : 'No indicada';
  return [
    { label: 'Nombre', value: quote.clientName },
    { label: 'Teléfono', value: quote.clientPhone || 'No indicado' },
    { label: 'Correo', value: quote.clientEmail },
    { label: 'Región', value: guided?.regionName || quote.clientAddress || 'No indicada' },
    { label: 'Comuna', value: guided?.commune || quote.clientCity || 'No indicada' },
    { label: 'Dirección', value: address },
    { label: 'Tipo de inmueble', value: 'No indicado' },
    { label: 'Tipo de superficie', value: guided ? labelOf(SURFACE_OPTIONS, guided.surfaceType) : 'No indicado' },
    { label: 'Acabado', value: finish || 'No indicado' },
    { label: 'Plazo preferente', value: guided ? labelOf(TIMELINE_OPTIONS, guided.timeline) : 'No indicado' },
    { label: 'Observaciones', value: 'Sin observaciones' },
    { label: 'Comunicaciones comerciales', value: guided?.commercialOptIn ? 'Sí' : 'No' },
  ];
}

export function clientEstimateSubject(quote: QuoteRequest): string {
  return `Tu estimación referencial - Nydo Mallas - Solicitud N° ${quote.folio}`;
}

export function clientEstimateText(quote: QuoteRequest): string {
  const budget = quote.guidedQuote?.installationBudget;
  const rows = clientRows(quote);
  const windows = (quote.windows || [])
    .map((win) => `${win.name || 'Ventana'}: ${win.widthCm ?? win.width * 100} cm × ${win.heightCm ?? win.height * 100} cm · ${formatBudgetQty(win.area)} m²`)
    .join('\n');
  const total = budget ? clientTotalLine(budget) : clientTotalLine({ available: false, reason: 'tarifas' });
  const detail = budget?.available
    ? `${budget.meshLabel}. Pilares considerados: ${formatBudgetQty(budget.pillarCount)}.\n${total}\nVigencia de la estimación: ${ESTIMATE_VALIDITY_DAYS} días.`
    : `${total}\nUn asesor enviará el valor.`;
  return [
    'Nydo Mallas',
    `Solicitud N° ${quote.folio}`,
    `Fecha: ${when(quote.createdAt)}`,
    `Teléfono: ${CONTACT_PHONE_DISPLAY}`,
    `Correo: ${CONTACT_EMAIL}`,
    '',
    'Resumen de la solicitud',
    ...rows.map((row) => `${row.label}: ${row.value}`),
    '',
    'Detalle de ventanas',
    windows || 'Sin ventanas',
    `Superficie total: ${formatBudgetQty(quote.totalAreaM2)} m²`,
    '',
    'Estimación referencial',
    detail,
    '',
    ESTIMATE_FOOTNOTE,
    ESTIMATE_NEXT_STEP,
  ].join('\n');
}

export function clientEstimateHtml(quote: QuoteRequest): string {
  const budget = quote.guidedQuote?.installationBudget;
  const total = budget ? clientTotalLine(budget) : clientTotalLine({ available: false, reason: 'tarifas' });
  const rows = clientRows(quote)
    .map(
      (row) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e6edf2;color:#6b8494;">${esc(row.label)}</td><td style="padding:8px 0;border-bottom:1px solid #e6edf2;font-weight:bold;">${esc(row.value)}</td></tr>`
    )
    .join('');
  const windows = (quote.windows || [])
    .map(
      (win) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #e6edf2;">${esc(win.name || 'Ventana')}</td><td style="padding:8px;border-bottom:1px solid #e6edf2;text-align:right;">${esc(win.widthCm ?? win.width * 100)}</td><td style="padding:8px;border-bottom:1px solid #e6edf2;text-align:right;">${esc(win.heightCm ?? win.height * 100)}</td><td style="padding:8px;border-bottom:1px solid #e6edf2;text-align:right;">${esc(formatBudgetQty(win.area))}</td></tr>`
    )
    .join('');
  const detail = budget?.available
    ? `<p style="margin:0 0 8px 0;">${esc(budget.meshLabel)}. Pilares considerados: ${esc(formatBudgetQty(budget.pillarCount))}.</p>
       <p style="margin:0;font-size:22px;font-weight:bold;">${esc(total)}</p>
       <p style="margin:8px 0 0 0;">Vigencia de la estimación: ${ESTIMATE_VALIDITY_DAYS} días.</p>`
    : `<p style="margin:0 0 8px 0;font-weight:bold;">${esc(total)}</p><p style="margin:0;">Un asesor enviará el valor.</p>`;
  return `<!DOCTYPE html><html lang="es"><body style="font-family:Arial,sans-serif;color:#1f2d3a;background:#f4f7f8;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;padding:24px;border-radius:16px;">
      <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Nydo Mallas</p>
      <h1 style="margin:0 0 8px 0;font-size:22px;">Solicitud N° ${esc(quote.folio)}</h1>
      <p style="margin:0 0 16px 0;">${esc(when(quote.createdAt))}<br>${esc(CONTACT_PHONE_DISPLAY)} · ${esc(CONTACT_EMAIL)}</p>
      <h2 style="font-size:16px;">Resumen de la solicitud</h2>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <h2 style="font-size:16px;">Detalle de ventanas</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><th align="left">Ventana / Ubicación</th><th align="right">Ancho (cm)</th><th align="right">Alto (cm)</th><th align="right">m²</th></tr>
        ${windows}
        <tr><td colspan="3" style="padding:8px;font-weight:bold;">Superficie total</td><td style="padding:8px;text-align:right;font-weight:bold;">${esc(formatBudgetQty(quote.totalAreaM2))} m²</td></tr>
      </table>
      <div style="margin-top:16px;padding:16px;background:#eef6ff;border-radius:12px;">
        <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Estimación referencial</p>
        ${detail}
      </div>
      <p style="font-size:13px;color:#52616b;">${esc(ESTIMATE_FOOTNOTE)}</p>
      <p style="font-size:14px;">${esc(ESTIMATE_NEXT_STEP)}</p>
    </div>
  </body></html>`;
}

export function internalBudgetText(quote: QuoteRequest): string {
  const budget = quote.guidedQuote?.installationBudget;
  const mail = quote.guidedQuote?.clientMail;
  if (!budget?.available) {
    return [
      `Solicitud N° ${quote.folio}`,
      clientTotalLine(budget || { available: false, reason: 'tarifas' }),
      quote.guidedQuote?.budgetIncident
        ? `Incidente ${formatConfigDate(quote.guidedQuote.budgetIncident.at)}: ${quote.guidedQuote.budgetIncident.message}`
        : '',
      mail ? `Correo al cliente: ${mail.status} · ${mail.to} · ${when(mail.sentAt)}` : 'Correo al cliente: sin registro',
    ]
      .filter(Boolean)
      .join('\n');
  }
  const lines = budget.lines
    .map(
      (line) =>
        `${line.item} | ${formatBudgetQty(line.quantity)} ${line.unit} | ${formatBudgetCLP(line.unitCost)} | ${line.operation} | ${formatBudgetCLP(line.result)}`
    )
    .join('\n');
  const attention = budget.parameters.filter((item) =>
    ATTENTION_STATUSES.includes(item.status as (typeof ATTENTION_STATUSES)[number])
  );
  const below =
    realMarginPercent(budget.realMargin) < budget.margin.value
      ? `Aviso: el margen real ${realMarginPercent(budget.realMargin)}% quedó bajo el margen objetivo ${formatBudgetQty(budget.margin.value)}%.`
      : '';
  const minimum = budget.minimumApplied
    ? `Aviso: se aplicó el mínimo por trabajo. Sin ese mínimo el total habría sido ${formatBudgetCLP(budget.totalWithoutMinimum)}.`
    : '';
  return [
    `Desglose interno · Solicitud N° ${quote.folio}`,
    marginCaption(budget.margin),
    '',
    lines,
    '',
    `Subtotal: ${formatBudgetCLP(budget.subtotal)}`,
    `Reserva: ${formatBudgetCLP(budget.reserve)}`,
    `Costo total: ${formatBudgetCLP(budget.totalCost)}`,
    `Precio neto: ${formatBudgetCLP(budget.netPrice)}`,
    `IVA: ${formatBudgetCLP(budget.ivaAmount)}`,
    `Total calculado: ${formatBudgetCLP(budget.calculatedTotal)}`,
    `Redondeo aplicado: ${formatBudgetCLP(budget.roundedTotal)}`,
    `Mínimo aplicado: ${budget.minimumApplied ? 'sí' : 'no'}`,
    `Total cliente: ${formatBudgetCLP(budget.clientTotal)}`,
    `Margen: ${formatBudgetCLP(budget.marginPesos)} · margen real ${realMarginPercent(budget.realMargin)}%`,
    below,
    minimum,
    '',
    'Parámetros usados',
    ...budget.parameters.map(
      (item) => `${item.name}: ${formatBudgetQty(item.value)} ${item.unit} · ${item.status} · ${formatConfigDate(item.updatedAt)}`
    ),
    attention.length
      ? `Destacados por estado: ${attention.map((item) => `${item.name} (${item.status})`).join(', ')}`
      : '',
    mail ? `Correo al cliente: ${mail.status} · ${mail.to} · ${when(mail.sentAt)}` : 'Correo al cliente: sin registro',
  ]
    .filter(Boolean)
    .join('\n');
}

export function shownPesos(budget: InstallationBudget, value: number): string {
  return formatBudgetCLP(pesos(value));
}
