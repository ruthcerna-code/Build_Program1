import { QuoteRequest, QuoteEmailDispatch } from '../types';
import { CONTACT_PHONE_DISPLAY } from '../constants/contact';
import {
  FINISH_OPTIONS,
  HEIGHT_OPTIONS,
  LENGTH_OPTIONS,
  SURFACE_OPTIONS,
  TIMELINE_OPTIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
} from '../constants/guidedQuote';
import {
  displayHeightCm,
  displayWidthCm,
  formatAreaM2,
  isBalconySurface,
  itemTitle,
} from '../utils/windowMeasures';

export const COMPANY_NOTIFICATION_EMAIL = 'nydo.mallas@gmail.com';

/**
 * Generates the email subject for the formatted quote notice
 */
export function generateFormattedQuoteSubject(
  quote: QuoteRequest,
  _recipient: 'company' | 'client'
): string {
  return `Solicitud de cotización ${quote.folio} recibida`;
}

/**
 * Generates the formatted text body for the quotation email notice without prices
 */
export function generateFormattedQuoteEmailText(
  quote: QuoteRequest,
  recipient: 'company' | 'client'
): string {
  const formattedDate = new Date(quote.createdAt || Date.now()).toLocaleString('es-CL', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const lines: string[] = [
    '============================================================',
    recipient === 'company'
      ? '       NYDO MALLAS - REGISTRO CENTRAL DE COTIZACIÓN'
      : '       NYDO MALLAS - AVISO DE COTIZACIÓN EN CURSO',
    `                 NÚMERO DE FOLIO: ${quote.folio}`,
    '============================================================',
    '',
    `Identificador: ${quote.id}`,
    `Fecha de Emisión: ${formattedDate}`,
    recipient === 'company'
      ? `Destinatario: Central de Operaciones (${COMPANY_NOTIFICATION_EMAIL})`
      : `Destinatario: ${quote.clientName} <${quote.clientEmail}>`,
    '',
  ];

  if (recipient === 'client') {
    lines.push(
      '------------------------------------------------------------',
      ' AVISO IMPORTANTE AL CLIENTE: ESTÁS COTIZANDO',
      '------------------------------------------------------------',
      `Estimado(a) ${quote.clientName}:`,
      'Te confirmamos que has solicitado una cotización formal de mallas de seguridad para tus ventanas.',
      'Tu requerimiento ha sido registrado con éxito en nuestro sistema y está en proceso de revisión.',
      '',
      '• NOTA SOBRE EL PRECIO:',
      'En esta instancia no se incluye ningún precio automático o referencial.',
      'Nuestro equipo técnico de Nydo Mallas evaluará las medidas de tus ventanas, el tipo de malla',
      'y las condiciones de instalación para formular tu presupuesto formal y coordinar la fecha definitiva.',
      ''
    );
  } else {
    lines.push(
      '------------------------------------------------------------',
      ' NOTA INTERNA DE RECEPCIÓN (ADMIN)',
      '------------------------------------------------------------',
      `Nueva cotización solicitada por el cliente ${quote.clientName}.`,
      '• AVISO: No se ha colocado ningún precio al cliente; únicamente se le notificó que está cotizando.',
      '• ACCIÓN: El administrador debe ingresar a la Pantalla de Recepción para evaluar las medidas,',
      'fijar el valor oficial y coordinar la cuadrilla técnica.',
      ''
    );
  }

  lines.push(
    '------------------------------------------------------------',
    ' 1. DATOS DEL CLIENTE',
    '------------------------------------------------------------',
    ` • Nombre del Titular   : ${quote.clientName}`,
    ` • Correo Electrónico   : ${quote.clientEmail}`,
    ` • Teléfono de Contacto : ${quote.clientPhone}`,
    ` • Dirección Inmueble   : ${quote.guidedQuote?.regionName || quote.clientAddress}`,
    ` • Comuna / Ciudad      : ${quote.guidedQuote?.commune || quote.clientCity}`,
    ` • Tipo de Propiedad    : ${quote.propertyType.toUpperCase()}`,
    quote.clientComments && !quote.guidedQuote ? ` • Observaciones        : "${quote.clientComments}"` : '',
    '',
  );

  if (quote.guidedQuote) {
    const g = quote.guidedQuote;
    const finish =
      g.finishType === 'lacado_otros' && g.finishColor
        ? `${labelOf(FINISH_OPTIONS, g.finishType)} (${g.finishColor})`
        : labelOf(FINISH_OPTIONS, g.finishType);
    lines.push(
      '------------------------------------------------------------',
      ' 2. RESPUESTAS DEL FORMULARIO',
      '------------------------------------------------------------',
      ` • Tipo de trabajo      : ${labelOf(WORK_TYPE_OPTIONS, g.workType)}`,
      ` • Superficie           : ${labelOf(SURFACE_OPTIONS, g.surfaceType)}`,
      ` • Longitud (rango)     : ${labelOf(LENGTH_OPTIONS, g.lengthRange)}`,
      ` • Altura (rango)       : ${labelOf(HEIGHT_OPTIONS, g.heightRange)}`,
      ` • Acabado              : ${finish}`,
      ` • Plazo (preferencia)  : ${labelOf(TIMELINE_OPTIONS, g.timeline)}`,
      ''
    );
  } else {
    lines.push(
      '------------------------------------------------------------',
      ' 2. FECHAS Y HORARIOS TENTATIVOS DE INSTALACIÓN SOLICITADOS',
      '------------------------------------------------------------',
      ` • Opción Tentativa 1 (Preferente) : ${quote.tentativeDate1 || 'A coordinar'} a las ${quote.tentativeTime1 || '10:00'} hrs`,
      ` • Opción Tentativa 2 (Alternativa): ${quote.tentativeDate2 || 'A coordinar'} a las ${quote.tentativeTime2 || '15:30'} hrs`,
      ''
    );
  }

  const balcony = isBalconySurface(quote.guidedQuote?.surfaceType || '');
  lines.push(
    '------------------------------------------------------------',
    ` 3. DETALLE DE ${balcony ? 'PAÑOS' : 'VENTANAS'} Y MEDIDAS (${quote.windows.length} en total)`,
    '------------------------------------------------------------',
    ' Ventana o paño | Ubicación | Ancho (cm) | Alto (cm) | Superficie (m²)'
  );

  quote.windows.forEach((win, index) => {
    const label = itemTitle(quote.guidedQuote?.surfaceType || '', index);
    const widthCm = displayWidthCm(win);
    const heightCm = displayHeightCm(win);
    lines.push(
      ` ${label} | ${win.name || '—'} | ${widthCm} | ${heightCm} | ${formatAreaM2(win.area)}`
    );
  });
  lines.push('');

  lines.push(
    '------------------------------------------------------------',
    ' 4. ESTADO DE LA SOLICITUD',
    '------------------------------------------------------------',
    ` • Cantidad Total de ${balcony ? 'Paños' : 'Ventanas'} : ${quote.windows.length}`,
    ` • Superficie Total Solicitada: ${formatAreaM2(quote.totalAreaM2)} m²`,
    ' • Las medidas ingresadas son referenciales y deberán confirmarse antes de la instalación.',
    ' • Estado del Presupuesto     : EN PROCESO DE COTIZACIÓN (Sin precio previo emitido)',
    recipient === 'client'
      ? ' • Próximo Paso               : Un asesor técnico revisará tus medidas y te contactará para confirmar tu cotización formal.'
      : ' • Próximo Paso               : Fijar el presupuesto en Recepción (Admin) y asignar técnico instalador.',
    '',
    '------------------------------------------------------------',
    ' 5. ESTÁNDARES TÉCNICOS Y GARANTÍA CERTIFICADA',
    '------------------------------------------------------------',
    ' • Resistencia al Impacto : Certificación de hasta 180 kg por m² para protección infantil y mascotas.',
    ' • Filtro Solar           : Protección UV 100% contra resecamiento prematuro.',
    ' • Perfilería             : Perfiles de aluminio anodizado y anclajes perimetrales certificados.',
    ' • Garantía Escrita       : 2 a 3 años garantizados por escrito tras la instalación.',
    '',
    '============================================================',
    ' REGISTRO DE DISTRIBUCIÓN AUTOMÁTICA:',
    ` 1. Recepción Central Empresa : ${COMPANY_NOTIFICATION_EMAIL}`,
    ` 2. Copia de Aviso al Cliente : ${quote.clientEmail}`,
    '============================================================',
    '',
    recipient === 'company'
      ? 'Gestión: Accede a la plataforma para determinar el presupuesto y derivar al instalador.'
      : 'Aviso: Gracias por cotizar con Nydo Mallas. Estamos procesando tu solicitud.'
  );

  return lines.filter((line) => line !== undefined).join('\n');
}

/**
 * Builds a direct Gmail Web compose URL with pre-filled To, Subject and Body
 */
export function buildGmailComposeUrl(
  toEmail: string,
  subject: string,
  body: string,
  ccEmail?: string
): string {
  let url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}`;
  if (ccEmail) {
    url += `&cc=${encodeURIComponent(ccEmail)}`;
  }
  url += `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return url;
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generatePricedQuoteSubject(quote: QuoteRequest): string {
  return `Cotización ${quote.folio} - Nydo Mallas`;
}

export function generatePricedQuoteEmailText(
  quote: QuoteRequest,
  recipient: 'company' | 'client'
): string {
  const adminQuote = quote.adminQuote;
  const total = adminQuote ? formatCLP(adminQuote.total) : 'A coordinar';
  const greeting =
    recipient === 'client'
      ? `Estimado/a ${quote.clientName}:`
      : `Copia interna. Presupuesto enviado a ${quote.clientName} <${quote.clientEmail}>.`;

  const windowLines = (quote.windows || [])
    .map((win, i) => {
      const width = win.widthCm ?? Math.round((win.width || 0) * 100);
      const height = win.heightCm ?? Math.round((win.height || 0) * 100);
      return ` • ${win.name || `Ventana ${i + 1}`}: ${width} cm × ${height} cm (${formatAreaM2(win.area)} m²)`;
    })
    .join('\n');

  const hasBreakdown = Boolean(
    adminQuote &&
      (adminQuote.profilesAndFixingsCost > 0 ||
        adminQuote.laborAndInstallCost > 0 ||
        (adminQuote.meshTotalCost > 0 && adminQuote.meshTotalCost !== adminQuote.total))
  );
  const valueLines = adminQuote
    ? [
        hasBreakdown ? ` • Malla y anclajes: ${formatCLP(adminQuote.meshTotalCost)}` : '',
        hasBreakdown ? ` • Perfiles y fijaciones: ${formatCLP(adminQuote.profilesAndFixingsCost)}` : '',
        hasBreakdown ? ` • Mano de obra e instalación: ${formatCLP(adminQuote.laborAndInstallCost)}` : '',
        adminQuote.discountAmount > 0
          ? ` • Descuento (${adminQuote.discountPercentage}%): -${formatCLP(adminQuote.discountAmount)}`
          : '',
        ` • TOTAL: ${total}`,
      ]
        .filter(Boolean)
        .join('\n')
    : ' • El importe se coordinará con el cliente.';

  return [
    greeting,
    '',
    `Folio ${quote.folio}. Presupuesto de mallas de seguridad.`,
    `Ubicación: ${quote.guidedQuote?.commune || quote.clientCity || 'No indicada'}.`,
    '',
    'Medidas:',
    windowLines || ' • Sin detalle de ventanas',
    '',
    'Valores:',
    valueLines,
    '',
    adminQuote
      ? `Garantía: ${adminQuote.warrantyYears} años. Tiempo estimado: ${adminQuote.estimatedTime}.`
      : '',
    adminQuote?.adminNotes ? `Observaciones: ${adminQuote.adminNotes}` : '',
    '',
    `Para confirmar o agendar, responde este correo o escribe al WhatsApp ${CONTACT_PHONE_DISPLAY}.`,
    '',
    'Equipo Nydo Mallas',
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

export function createQuoteEmailDispatch(quote: QuoteRequest): QuoteEmailDispatch {
  return {
    toCompany: COMPANY_NOTIFICATION_EMAIL,
    toClient: quote.clientEmail,
    sentAt: new Date().toISOString(),
    companyDelivered: true,
    clientDelivered: true,
    formattedContent: generateFormattedQuoteEmailText(quote, 'company'),
  };
}
