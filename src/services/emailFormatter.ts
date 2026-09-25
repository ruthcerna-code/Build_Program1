import { QuoteRequest, QuoteEmailDispatch } from '../types';

export const COMPANY_NOTIFICATION_EMAIL = 'rcv.informacion@gmail.com';

/**
 * Generates the email subject for the formatted quote notice
 */
export function generateFormattedQuoteSubject(
  quote: QuoteRequest,
  recipient: 'company' | 'client'
): string {
  if (recipient === 'company') {
    return `[NUEVA COTIZACIÓN EN CURSO #${quote.folio}] ${quote.clientName} - ${quote.windows.length} ventana(s) (${quote.clientCity})`;
  }
  return `[AVISO DE COTIZACIÓN] Solicitud #${quote.folio} Ingresada - MallasSeguras Chile`;
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
      ? '       MALLASSEGURAS CHILE - REGISTRO CENTRAL DE COTIZACIÓN'
      : '       MALLASSEGURAS CHILE - AVISO DE COTIZACIÓN EN CURSO',
    `                 NÚMERO DE FOLIO: ${quote.folio}`,
    '============================================================',
    '',
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
      'Nuestro equipo técnico de MallasSeguras evaluará las medidas de tus ventanas, el tipo de malla',
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
    ` • Dirección Inmueble   : ${quote.clientAddress}`,
    ` • Comuna / Ciudad      : ${quote.clientCity}`,
    ` • Tipo de Propiedad    : ${quote.propertyType.toUpperCase()}`,
    quote.clientComments ? ` • Observaciones        : "${quote.clientComments}"` : '',
    '',
    '------------------------------------------------------------',
    ' 2. FECHAS Y HORARIOS TENTATIVOS DE INSTALACIÓN SOLICITADOS',
    '------------------------------------------------------------',
    ` • Opción Tentativa 1 (Preferente) : ${quote.tentativeDate1 || 'A coordinar'} a las ${quote.tentativeTime1 || '10:00'} hrs`,
    ` • Opción Tentativa 2 (Alternativa): ${quote.tentativeDate2 || 'A coordinar'} a las ${quote.tentativeTime2 || '15:30'} hrs`,
    '',
    '------------------------------------------------------------',
    ` 3. DETALLE DE VENTANAS Y MEDIDAS INGRESADAS (${quote.windows.length} en total)`,
    '------------------------------------------------------------'
  );

  quote.windows.forEach((win, index) => {
    const heightCm = Math.round(win.height * 100);
    const widthCm = Math.round(win.width * 100);
    const meshDesc =
      win.meshType === 'monofilamento'
        ? 'Monofilamento Nylon 0.80mm (Máxima Visibilidad & Estética)'
        : 'Multifilamento Trenzado (Alta Densidad)';

    lines.push(
      ` [Ventana #${index + 1}] ${win.name}`,
      `   - Dimensiones : ${win.height} m alto x ${win.width} m ancho (${heightCm} x ${widthCm} cm)`,
      `   - Superficie  : ${win.area.toFixed(2)} m²`,
      `   - Tipo Malla  : ${meshDesc}`,
      win.notes ? `   - Notas       : ${win.notes}` : '   - Notas       : Sin observaciones',
      ''
    );
  });

  lines.push(
    '------------------------------------------------------------',
    ' 4. ESTADO DE LA SOLICITUD',
    '------------------------------------------------------------',
    ` • Cantidad Total de Ventanas : ${quote.windows.length} unidad(es)`,
    ` • Superficie Total Solicitada: ${quote.totalAreaM2.toFixed(2)} m²`,
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
      : 'Aviso: Gracias por cotizar con MallasSeguras Chile. Estamos procesando tu solicitud.'
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

/**
 * Creates the dispatch audit record
 */
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
