import { ADMIN_EMAIL, FORMSUBMIT_COMPANY_ID, MAIL_FROM, QUOTE_COPY_EMAIL, RESEND_API_KEY, SITE_URL } from './config';
import {
  generateFormattedQuoteEmailText,
  generateFormattedQuoteSubject,
  generatePricedQuoteEmailText,
  generatePricedQuoteSubject,
} from '../src/services/emailFormatter';
import { generateQuoteEmailHtml } from '../src/services/quoteEmailHtml';
import type { QuoteRequest } from '../src/types';

type MailKind = 'request' | 'priced';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toHtml(text: string) {
  return `<pre style="font-family:Georgia,serif;white-space:pre-wrap;font-size:14px;line-height:1.45;color:#0f172a">${escapeHtml(
    text
  )}</pre>`;
}

function isResendTestBlock(detail: string) {
  const lower = detail.toLowerCase();
  return lower.includes('verify a domain') || lower.includes('testing emails');
}

function explainResendError(detail: string) {
  if (isResendTestBlock(detail)) {
    return 'Resend no entrega a nydo.mallas@gmail.com con el remitente de prueba. Usamos la bandeja alternativa de la empresa.';
  }
  return detail.slice(0, 220) || 'El servicio de correo no aceptó el envío.';
}

async function postResendEmail(
  to: string,
  subject: string,
  text: string,
  replyTo?: string,
  html?: string
): Promise<{ sent: boolean; error?: string; blockedTest?: boolean }> {
  if (!RESEND_API_KEY) {
    return { sent: false, error: 'El envío de correo aún no está configurado.' };
  }
  const sendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      reply_to: replyTo || QUOTE_COPY_EMAIL,
      subject,
      text,
      html: html || toHtml(text),
    }),
  });
  if (sendRes.ok) return { sent: true };
  const detail = await sendRes.text();
  console.warn('[mail] Resend rechazó el envío a', to, sendRes.status, detail.slice(0, 240));
  return {
    sent: false,
    blockedTest: isResendTestBlock(detail),
    error: explainResendError(detail),
  };
}

async function postCompanyInboxEmail(
  to: string,
  subject: string,
  text: string,
  _html?: string,
  replyTo?: string
): Promise<{ sent: boolean; error?: string }> {
  const inboxId = FORMSUBMIT_COMPANY_ID || to;
  const sendRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(inboxId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: SITE_URL,
      Referer: `${SITE_URL}/`,
    },
    body: JSON.stringify({
      _subject: subject,
      _template: 'box',
      _captcha: 'false',
      _replyto: replyTo || to,
      name: 'Nydo Mallas',
      email: replyTo || to,
      message: text,
    }),
  });
  const body = await sendRes.text();
  if (/<!doctype|just a moment|cf-ray|checking your browser/i.test(body)) {
    return { sent: false, error: 'El envío a nydo.mallas@gmail.com quedó bloqueado. Reenviamos a la administradora.' };
  }
  let parsed: { success?: string; message?: string } = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { message: body.slice(0, 180) };
  }
  const message = String(parsed.message || '');
  if (/<!doctype|just a moment/i.test(message)) {
    return { sent: false, error: 'El envío a nydo.mallas@gmail.com quedó bloqueado. Reenviamos a la administradora.' };
  }
  const activated = parsed.success === 'true' || /activated|successfully/i.test(message);
  const needsActivation = /activation|activ/i.test(message);
  if (activated || needsActivation) {
    if (needsActivation) {
      console.warn('[mail] nydo.mallas@gmail.com debe confirmar el enlace de activación del correo.');
    }
    return { sent: true };
  }
  console.warn('[mail] Bandeja empresa rechazó el envío:', sendRes.status, message.slice(0, 240));
  return { sent: false, error: message.slice(0, 220) || 'No pudimos dejar el correo en nydo.mallas@gmail.com.' };
}

export async function sendInboxEmail(
  to: string,
  subject: string,
  text: string,
  replyTo?: string,
  html?: string
): Promise<{ sent: boolean; error?: string }> {
  const destination = to.trim().toLowerCase();
  const resend = await postResendEmail(destination, subject, text, replyTo, html);
  if (resend.sent) return { sent: true };

  const companyInbox = (QUOTE_COPY_EMAIL || 'nydo.mallas@gmail.com').toLowerCase();
  if (destination === companyInbox) {
    const formSubmit = await postCompanyInboxEmail(destination, subject, text, html, replyTo);
    if (formSubmit.sent) return formSubmit;
    const adminTo = (ADMIN_EMAIL || '').toLowerCase();
    if (adminTo && adminTo !== destination) {
      const copy = await postResendEmail(
        adminTo,
        subject,
        `Copia de mensaje para ${destination}. El envío directo a ese buzón no está disponible con el correo de prueba.\n\n${text}`,
        replyTo,
        html
      );
      if (copy.sent) return { sent: true };
    }
    return formSubmit;
  }
  return { sent: false, error: resend.error };
}

function contentFor(quote: QuoteRequest, kind: MailKind, recipient: 'client' | 'company') {
  const html = generateQuoteEmailHtml(quote, kind, recipient);
  if (kind === 'priced' && quote.adminQuote) {
    return {
      subject: generatePricedQuoteSubject(quote),
      text: generatePricedQuoteEmailText(quote, recipient),
      html,
    };
  }
  return {
    subject: generateFormattedQuoteSubject(quote, recipient),
    text: generateFormattedQuoteEmailText(quote, recipient),
    html,
  };
}

export async function sendQuoteRequestEmail(
  quote: QuoteRequest,
  kind: MailKind = 'request'
): Promise<{ sent: boolean; error?: string }> {
  const clientTo = String(quote.clientEmail || '').trim().toLowerCase();
  if (!clientTo.includes('@')) {
    return { sent: false, error: 'El correo del cliente no es válido.' };
  }

  try {
    const companyTo = (QUOTE_COPY_EMAIL || 'nydo.mallas@gmail.com').toLowerCase();
    const companyMail = contentFor(quote, kind, 'company');
    const clientMail = contentFor(quote, kind, 'client');

    const client = await sendInboxEmail(
      clientTo,
      clientMail.subject,
      clientMail.text,
      companyTo,
      clientMail.html
    );
    const company =
      clientTo === companyTo
        ? client
        : await sendInboxEmail(
            companyTo,
            companyMail.subject,
            companyMail.text,
            clientTo,
            companyMail.html
          );

    if (!client.sent) {
      return {
        sent: false,
        error: `No llegó al cliente (${clientTo}). ${client.error || ''}`.trim(),
      };
    }
    if (!company.sent) {
      return {
        sent: true,
        error: `El cliente lo recibió. No llegó a nydo.mallas@gmail.com. ${company.error || ''}`.trim(),
      };
    }
    return { sent: true };
  } catch {
    return { sent: false, error: 'No pudimos conectar con el servicio de correo.' };
  }
}
