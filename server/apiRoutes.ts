import type { Express, Request, Response } from 'express';
import {
  CONTACT_TO_EMAIL,
  RESEND_API_KEY,
  isPrincipalAdmin,
  missingServerConfig,
} from './config';
import {
  authenticateWithPassword,
  createSessionToken,
  getSessionUser,
  requirePrincipalAdmin,
  requireSession,
  resolveRole,
  sessionToAccount,
  type SessionUser,
} from './session';
import { hashPassword } from './passwords';
import { requireAdminClient } from './supabaseAdmin';
import { buildGuidedQuoteRecord, guidedQuoteToDbRow, validateGuidedQuote } from './guidedQuote';
import { sendInboxEmail, sendQuoteRequestEmail } from './sendQuoteMail';

const contactAttempts = new Map<string, number[]>();
const syncLocks = new Set<string>();

function clientIp(req: Request): string {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
}

function tooManyContact(ip: string): boolean {
  const now = Date.now();
  const recent = (contactAttempts.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  contactAttempts.set(ip, recent);
  return recent.length >= 3;
}

function markContact(ip: string) {
  const list = contactAttempts.get(ip) || [];
  list.push(Date.now());
  contactAttempts.set(ip, list);
}

function canViewQuotes(user: SessionUser): boolean {
  return isPrincipalAdmin(user.email) || user.role === 'admin' || user.permissions.viewQuotes;
}

function canEditQuotes(user: SessionUser): boolean {
  return isPrincipalAdmin(user.email) || user.role === 'admin' || user.permissions.editQuotes;
}

function canDeleteQuotes(user: SessionUser): boolean {
  return isPrincipalAdmin(user.email) || user.role === 'admin' || user.permissions.deleteQuotes;
}

function canViewSales(user: SessionUser): boolean {
  return isPrincipalAdmin(user.email) || user.role === 'admin' || user.permissions.viewSales;
}

function mapQuoteRow(row: any) {
  return {
    id: row.id,
    folio: row.folio,
    createdAt: row.created_at,
    clientName: row.client_name,
    clientRut: row.client_rut,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    clientAddress: row.client_address,
    clientCity: row.client_city,
    propertyType: row.property_type,
    clientComments: row.client_comments,
    totalAreaM2: Number(row.total_area_m2) || 0,
    status: row.status,
    acceptedAt: row.accepted_at,
    paidAmount: row.paid_amount != null ? Number(row.paid_amount) : 0,
    paymentStatus: row.payment_status || 'pendiente',
    paymentMethod: row.payment_method,
    paymentNotes: row.payment_notes,
    windows: row.windows || [],
    adminQuote: row.admin_quote,
    installerAssignment: row.installer_assignment,
    technicianExecution: row.technician_execution,
    payments: row.payments || [],
    changeHistory: row.change_history || [],
    deletedAt: row.deleted_at,
    ownerEmail: row.owner_email || row.client_email,
    quoteSource: row.quote_source || undefined,
    guidedQuote: row.guided_quote || undefined,
  };
}

async function fetchVisibleQuotes(user: SessionUser, includeDeleted = false) {
  const db = requireAdminClient();
  let query = db.from('quotes').select('*').order('created_at', { ascending: false });
  if (!includeDeleted) query = query.is('deleted_at', null);

  if (user.role === 'cliente') {
    query = query.or(`owner_email.eq.${user.email},client_email.eq.${user.email}`);
  } else if (!canViewQuotes(user)) {
    return [];
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapQuoteRow);
}

export function mountApiRoutes(app: Express) {
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      googleConfigured: false,
      supabaseAdmin: missingServerConfig().filter((x) => x.includes('SUPABASE')).length === 0,
      mailConfigured: !!RESEND_API_KEY,
      missing: missingServerConfig(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/auth/config', (_req, res) => {
    res.json({
      googleClientId: null,
      googleReady: false,
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim();
      const password = String(req.body?.password || '');
      const sessionUser = await authenticateWithPassword(email, password);
      if (sessionUser.active === false) {
        return res.status(403).json({ error: 'Tu acceso está desactivado.' });
      }
      const token = createSessionToken(sessionUser);
      if (!token) {
        return res.status(500).json({
          error: 'Falta SESSION_SECRET en el servidor. No se puede crear una sesión segura.',
        });
      }
      return res.json({
        token,
        user: sessionToAccount(sessionUser),
      });
    } catch (err: any) {
      return res.status(401).json({
        error: err?.message || 'Correo o contraseña incorrectos.',
      });
    }
  });

  app.get('/api/auth/me', requireSession, async (req, res) => {
    const current = getSessionUser(req)!;
    const refreshed = await resolveRole(current.email, current.name);
    res.json({ user: sessionToAccount(refreshed) });
  });

  app.post('/api/quotes/guided', async (req, res) => {
    try {
      const ip = clientIp(req);
      if (tooManyContact(ip)) {
        return res.status(429).json({
          error: 'Enviaste varias solicitudes seguidas. Espera unos minutos e intenta de nuevo.',
        });
      }
      const error = validateGuidedQuote(req.body || {});
      if (error) return res.status(400).json({ error });

      const db = requireAdminClient();
      const ownerEmail = String(req.body?.email || '').trim().toLowerCase();
      const ownerName = String(req.body?.name || '').trim();
      const quote = buildGuidedQuoteRecord(req.body || {}, ownerEmail, ownerName);
      const { data: existing } = await db.from('quotes').select('*').eq('id', quote.id).maybeSingle();
      if (existing) {
        return res.json({ quote: mapQuoteRow(existing), message: 'Solicitud ya registrada.' });
      }

      const row = guidedQuoteToDbRow(quote);
      const { data, error: insertError } = await db.from('quotes').insert(row).select('*').single();
      if (insertError) {
        const fallback = { ...row } as Record<string, unknown>;
        delete fallback.guided_quote;
        delete fallback.quote_source;
        const retry = await db.from('quotes').insert(fallback).select('*').single();
        if (retry.error) return res.status(400).json({ error: retry.error.message });
        markContact(ip);
        const mail = await sendQuoteRequestEmail(quote);
        return res.json({
          quote: mapQuoteRow(retry.data),
          message: 'Solicitud guardada.',
          mailSent: mail.sent,
          mailError: mail.error || null,
        });
      }
      markContact(ip);
      const mail = await sendQuoteRequestEmail(quote);
      res.json({
        quote: mapQuoteRow(data),
        message: 'Solicitud guardada.',
        mailSent: mail.sent,
        mailError: mail.error || null,
      });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos guardar la solicitud.' });
    }
  });

  app.post('/api/quotes/:id/send-email', requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req)!;
      if (!canEditQuotes(user)) {
        return res.status(403).json({ error: 'No tienes permiso para enviar cotizaciones.' });
      }
      const db = requireAdminClient();
      const { data: existing, error: findError } = await db
        .from('quotes')
        .select('*')
        .eq('id', req.params.id)
        .maybeSingle();
      if (findError || !existing) {
        return res.status(404).json({ error: 'No encontramos esa cotización.' });
      }
      const quote = mapQuoteRow(existing);
      if (req.body?.adminQuote && typeof req.body.adminQuote === 'object') {
        quote.adminQuote = { ...(quote.adminQuote || {}), ...req.body.adminQuote };
      }
      if (typeof req.body?.total === 'number') {
        quote.adminQuote = {
          ...(quote.adminQuote || {
            pricePerM2: 0,
            meshTotalCost: req.body.total,
            profilesAndFixingsCost: 0,
            laborAndInstallCost: 0,
            discountPercentage: 0,
            discountAmount: 0,
            subtotal: req.body.total,
            includeTax: false,
            taxAmount: 0,
            warrantyYears: 2,
            estimatedTime: '2 a 3 horas',
            adminNotes: '',
          }),
          total: req.body.total,
          subtotal: req.body.total,
        };
      }
      if (typeof req.body?.notes === 'string' && quote.adminQuote) {
        quote.adminQuote.adminNotes = req.body.notes;
      }
      const mail = await sendQuoteRequestEmail(quote, quote.adminQuote ? 'priced' : 'request');
      if (!mail.sent) {
        return res.status(502).json({ error: mail.error || 'No pudimos enviar el correo al cliente.' });
      }
      const sentAt = new Date().toISOString();
      const adminQuote = quote.adminQuote
        ? { ...quote.adminQuote, sentAt, sentToEmail: quote.clientEmail }
        : quote.adminQuote;
      if (adminQuote) {
        await db.from('quotes').update({ admin_quote: adminQuote }).eq('id', quote.id);
      }
      res.json({
        quote: { ...quote, adminQuote },
        message: `Enviamos un correo a nydo.mallas@gmail.com y otro a ${quote.clientEmail}.`,
        mailSent: true,
      });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos enviar el correo.' });
    }
  });

  app.get('/api/quotes', requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req)!;
      if (user.role !== 'cliente' && !canViewQuotes(user)) {
        return res.status(403).json({ error: 'No tienes permiso para ver cotizaciones.' });
      }
      const quotes = await fetchVisibleQuotes(user);
      res.json({ quotes });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos consultar las cotizaciones.' });
    }
  });

  app.patch('/api/quotes/:id', requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req)!;
      if (!canEditQuotes(user)) {
        return res.status(403).json({ error: 'No tienes permiso para modificar cotizaciones.' });
      }
      const db = requireAdminClient();
      const { data: existing, error: findError } = await db
        .from('quotes')
        .select('*')
        .eq('id', req.params.id)
        .maybeSingle();
      if (findError || !existing) {
        return res.status(404).json({ error: 'No encontramos esa cotización.' });
      }

      const patch = req.body || {};
      const history = Array.isArray(existing.change_history) ? existing.change_history : [];
      history.unshift({
        id: `ev-${Date.now()}`,
        at: new Date().toISOString(),
        actorEmail: user.email,
        actorName: user.name,
        action: patch.status ? 'Actualizar estado' : 'Modificar cotización',
        detail: patch.status
          ? `Estado cambiado a ${patch.status}`
          : 'Se guardaron cambios en la cotización',
      });

      const row: Record<string, unknown> = {
        change_history: history.slice(0, 50),
      };
      if (patch.status) row.status = patch.status;
      if (patch.adminNotes != null && existing.admin_quote) {
        row.admin_quote = { ...existing.admin_quote, adminNotes: patch.adminNotes };
      }
      if (typeof patch.total === 'number' && existing.admin_quote) {
        row.admin_quote = {
          ...(row.admin_quote as object || existing.admin_quote),
          total: patch.total,
          subtotal: patch.total,
        };
      }
      if (patch.clientComments != null) row.client_comments = patch.clientComments;

      const { data, error } = await db.from('quotes').update(row).eq('id', req.params.id).select('*').single();
      if (error) return res.status(400).json({ error: error.message });
      const quote = mapQuoteRow(data);
      if (patch.sendEmail) {
        const mail = await sendQuoteRequestEmail(quote, quote.adminQuote ? 'priced' : 'request');
        return res.json({
          quote,
          message: mail.sent ? 'Cambios guardados y correo enviado al cliente.' : 'Cambios guardados.',
          mailSent: mail.sent,
          mailError: mail.error || null,
        });
      }
      res.json({ quote, message: 'Cambios guardados.' });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos guardar los cambios.' });
    }
  });

  app.delete('/api/quotes/:id', requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req)!;
      if (!canDeleteQuotes(user)) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar cotizaciones.' });
      }
      const db = requireAdminClient();
      const { data: existing } = await db.from('quotes').select('*').eq('id', req.params.id).maybeSingle();
      if (!existing) return res.status(404).json({ error: 'No encontramos esa cotización.' });

      const history = Array.isArray(existing.change_history) ? existing.change_history : [];
      history.unshift({
        id: `ev-${Date.now()}`,
        at: new Date().toISOString(),
        actorEmail: user.email,
        actorName: user.name,
        action: 'Eliminar',
        detail: `Baja lógica de ${existing.folio}`,
      });

      const { error } = await db
        .from('quotes')
        .update({ deleted_at: new Date().toISOString(), change_history: history })
        .eq('id', req.params.id);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ message: `Se eliminó la cotización ${existing.folio}. Queda en el historial.` });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos eliminar la cotización.' });
    }
  });

  app.post('/api/quotes/:id/payments', requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req)!;
      if (!canEditQuotes(user)) {
        return res.status(403).json({ error: 'No tienes permiso para registrar pagos.' });
      }
      const amount = Number(req.body?.amount);
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Ingresa un monto de pago mayor a cero.' });
      }
      const db = requireAdminClient();
      const { data: quote } = await db.from('quotes').select('*').eq('id', req.params.id).maybeSingle();
      if (!quote) return res.status(404).json({ error: 'No encontramos esa cotización.' });

      const payment = {
        id: `pay-${Date.now()}`,
        quote_id: quote.id,
        amount,
        method: String(req.body?.method || '').slice(0, 80) || null,
        notes: String(req.body?.notes || '').slice(0, 400) || null,
        created_by: user.email,
      };
      const { error: payError } = await db.from('quote_payments').insert(payment);
      if (payError) return res.status(400).json({ error: payError.message });

      const { data: pays } = await db.from('quote_payments').select('amount').eq('quote_id', quote.id);
      const paid = (pays || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
      const quoted = Number(quote.admin_quote?.total || 0);
      const paymentStatus =
        paid <= 0 ? 'pendiente' : quoted > 0 && paid >= quoted ? 'pagado_total' : 'abono_parcial';

      await db
        .from('quotes')
        .update({
          paid_amount: paid,
          payment_status: paymentStatus,
          payment_method: payment.method,
          payment_notes: payment.notes,
        })
        .eq('id', quote.id);

      res.json({ message: 'Pago registrado.', paidAmount: paid, paymentStatus });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos registrar el pago.' });
    }
  });

  app.get('/api/sales', requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req)!;
      if (!canViewSales(user)) {
        return res.status(403).json({ error: 'No tienes permiso para ver ventas.' });
      }
      const quotes = (await fetchVisibleQuotes(user)).filter((q) => !q.deletedAt);
      const db = requireAdminClient();
      const { data: payments } = await db.from('quote_payments').select('*');
      const payByQuote = new Map<string, number>();
      (payments || []).forEach((p) => {
        payByQuote.set(p.quote_id, (payByQuote.get(p.quote_id) || 0) + Number(p.amount || 0));
      });

      const byStatus: Record<string, number> = {};
      let quotedTotal = 0;
      let acceptedTotal = 0;
      let collectedTotal = 0;

      quotes.forEach((q) => {
        byStatus[q.status] = (byStatus[q.status] || 0) + 1;
        const quoted = Number(q.adminQuote?.total || 0);
        quotedTotal += quoted;
        if (q.status === 'aceptada') acceptedTotal += quoted;
        collectedTotal += payByQuote.get(q.id) || Number(q.paidAmount || 0);
      });

      res.json({
        counts: byStatus,
        quotedTotal,
        acceptedTotal,
        collectedTotal,
        quotes: quotes.map((q) => ({
          ...q,
          collectedAmount: payByQuote.get(q.id) || Number(q.paidAmount || 0),
        })),
      });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos cargar las ventas.' });
    }
  });

  app.get('/api/internal-users', requireSession, requirePrincipalAdmin, async (_req, res) => {
    try {
      const db = requireAdminClient();
      const { data, error } = await db.from('internal_users').select('*').order('created_at', { ascending: false });
      if (error) return res.status(400).json({ error: error.message });
      res.json({ users: data || [] });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos cargar el equipo.' });
    }
  });

  app.post('/api/internal-users', requireSession, requirePrincipalAdmin, async (req, res) => {
    try {
      const user = getSessionUser(req)!;
      const email = String(req.body?.email || '').trim().toLowerCase();
      const fullName = String(req.body?.fullName || '').trim();
      const password = String(req.body?.password || '').trim();
      if (!email.includes('@') || !fullName) {
        return res.status(400).json({ error: 'Necesitamos nombre y un correo válido.' });
      }
      if (isPrincipalAdmin(email)) {
        return res.status(400).json({ error: 'Esa cuenta ya es la administradora principal.' });
      }
      const db = requireAdminClient();
      const { data: existing } = await db.from('internal_users').select('*').eq('email', email).maybeSingle();
      if (!existing && password.length < 4) {
        return res.status(400).json({ error: 'Asigna una contraseña de al menos 4 caracteres.' });
      }
      const passwordHash = password ? hashPassword(password) : existing?.password_hash;
      const row: Record<string, unknown> = {
        id: existing?.id || `int-${Date.now()}`,
        email,
        full_name: fullName,
        active: req.body?.active !== false,
        can_view_quotes: !!req.body?.viewQuotes,
        can_edit_quotes: !!req.body?.editQuotes,
        can_delete_quotes: !!req.body?.deleteQuotes,
        can_view_sales: !!req.body?.viewSales,
        created_by: user.email,
        updated_at: new Date().toISOString(),
      };
      if (passwordHash) row.password_hash = passwordHash;

      let { data, error } = await db.from('internal_users').upsert(row, { onConflict: 'email' }).select('*').single();
      if (error && String(error.message || '').includes('password_hash')) {
        const fallback = { ...row };
        delete fallback.password_hash;
        const retry = await db.from('internal_users').upsert(fallback, { onConflict: 'email' }).select('*').single();
        data = retry.data;
        error = retry.error;
      }
      if (error) return res.status(400).json({ error: error.message });

      if (passwordHash) {
        await db.from('app_users').upsert(
          {
            id: existing?.id || row.id,
            email,
            password_hash: passwordHash,
            full_name: fullName,
            role: 'interno',
          },
          { onConflict: 'email' }
        );
      }
      res.json({ user: data, message: 'Cuenta interna guardada.' });
    } catch (err: any) {
      res.status(503).json({ error: err?.message || 'No pudimos guardar el usuario.' });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      if (req.body?.website) {
        return res.json({ message: 'Recibimos tu mensaje.' });
      }
      const ip = clientIp(req);
      if (tooManyContact(ip)) {
        return res.status(429).json({
          error: 'Enviaste varios mensajes seguidos. Espera unos minutos e intenta de nuevo.',
        });
      }

      const name = String(req.body?.name || '').trim();
      const email = String(req.body?.email || '').trim();
      const phone = String(req.body?.phone || '').trim();
      const subject = String(req.body?.subject || '').trim();
      const message = String(req.body?.message || '').trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !emailOk || !subject || !message) {
        return res.status(400).json({
          error: 'Completa nombre, un correo válido, asunto y mensaje.',
        });
      }
      const mail = await sendInboxEmail(
        CONTACT_TO_EMAIL,
        `[Contáctanos] ${subject}`,
        `Nombre: ${name}\nCorreo: ${email}\nTeléfono: ${phone || 'No indicado'}\n\n${message}`,
        email
      );
      if (!mail.sent) {
        return res.status(502).json({
          error: mail.error || 'El servicio de correo no aceptó el envío. Intenta de nuevo en unos minutos.',
        });
      }

      markContact(ip);
      try {
        const db = requireAdminClient();
        await db.from('contact_messages').insert({
          id: `msg-${Date.now()}`,
          name,
          email,
          phone,
          subject,
          message,
          delivered: true,
        });
      } catch {
        // El correo sí salió; no fallar la confirmación por el registro.
      }

      res.json({ message: 'Tu mensaje fue enviado. Te responderemos a tu correo.' });
    } catch {
      res.status(500).json({
        error: 'No pudimos enviar el mensaje. Revisa tu conexión e intenta de nuevo.',
      });
    }
  });

  app.post('/api/sync', requireSession, requirePrincipalAdmin, async (req, res) => {
    const user = getSessionUser(req)!;
    if (syncLocks.has(user.email)) {
      return res.status(409).json({ error: 'Ya hay una sincronización en curso.' });
    }
    syncLocks.add(user.email);
    try {
      const quotes = await fetchVisibleQuotes(user, true);
      const visible = quotes.filter((q) => !q.deletedAt);
      const issues: { folio: string; message: string }[] = [];

      visible.forEach((q) => {
        if (!q.clientName) issues.push({ folio: q.folio, message: 'Falta el nombre del cliente.' });
        if (!q.clientEmail || !String(q.clientEmail).includes('@')) {
          issues.push({ folio: q.folio, message: 'El correo del cliente está incompleto.' });
        }
        if (q.status === 'aceptada' && !(Number(q.adminQuote?.total) > 0)) {
          issues.push({ folio: q.folio, message: 'Está aceptada pero no tiene un importe.' });
        }
        if ((q.paymentStatus === 'pagado_total' || q.paymentStatus === 'abono_parcial') && !(Number(q.paidAmount) > 0)) {
          issues.push({ folio: q.folio, message: 'Dice que hay pago, pero no hay un monto cobrado.' });
        }
      });

      res.json({
        message: 'Datos actualizados',
        syncedAt: new Date().toISOString(),
        consulted: quotes.length,
        visible: visible.length,
        issues,
        quotes: visible,
        review:
          issues.length === 0
            ? 'La revisión no encontró problemas evidentes.'
            : `Encontramos ${issues.length} dato(s) para revisar.`,
      });
    } catch (err: any) {
      res.status(503).json({
        error: err?.message || 'No pudimos actualizar los datos. Intenta nuevamente.',
      });
    } finally {
      syncLocks.delete(user.email);
    }
  });

}
