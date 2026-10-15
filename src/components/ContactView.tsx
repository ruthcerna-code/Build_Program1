import React, { useState } from 'react';
import { CONTACT_INBOX_EMAIL } from '../constants/admin';
import { CONTACT_PHONE_DISPLAY, WHATSAPP_QUOTE_URL } from '../constants/contact';

export const ContactView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const raw = String(data.error || '');
        setError(
          /<!doctype|<html|just a moment/i.test(raw) || !raw
            ? 'No pudimos enviar el mensaje. Intenta de nuevo en un minuto.'
            : raw
        );
        return;
      }
      setOk(data.message);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch {
      setError('No hay conexión con el servidor. Conservamos tu texto para que puedas reintentar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto pb-16 font-body text-nydo-ink">
      <p className="uppercase tracking-[0.14em] text-xs font-bold mb-3">Hablemos</p>
      <h1 className="nydo-display text-[clamp(2.8rem,6vw,4.5rem)] mb-3">Contáctanos</h1>
      <p className="text-sm mb-6 max-w-md">
        Te respondemos a tu correo. El mensaje llega a {CONTACT_INBOX_EMAIL}. También puedes escribir por WhatsApp.
      </p>
      <a href={WHATSAPP_QUOTE_URL} target="_blank" rel="noopener noreferrer" className="nydo-btn nydo-btn-whatsapp mb-8">
        WhatsApp {CONTACT_PHONE_DISPLAY}
      </a>

      <form onSubmit={handleSubmit} className="bg-nydo-orange rounded-[20px] p-6 sm:p-8 space-y-4">
        <label className="block text-sm font-bold">
          Nombre
          <input required value={name} onChange={(e) => setName(e.target.value)} className="nydo-input mt-1" />
        </label>
        <label className="block text-sm font-bold">
          Correo electrónico
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="nydo-input mt-1"
          />
        </label>
        <label className="block text-sm font-bold">
          Teléfono (opcional)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="nydo-input mt-1" />
        </label>
        <label className="block text-sm font-bold">
          Asunto
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} className="nydo-input mt-1" />
        </label>
        <label className="block text-sm font-bold">
          Mensaje
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="nydo-input mt-1 min-h-[140px]"
          />
        </label>
        <div className="hidden" aria-hidden="true">
          <input tabIndex={-1} value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        {error && <p className="text-sm font-bold bg-nydo-cream rounded-lg px-3 py-2">{error}</p>}
        {ok && <p className="text-sm font-bold bg-nydo-cream rounded-lg px-3 py-2">{ok}</p>}
        <button type="submit" disabled={loading} className="nydo-btn nydo-btn-blue w-full disabled:opacity-60">
          {loading ? 'Enviando…' : 'Enviar mensaje ↗'}
        </button>
      </form>
    </section>
  );
};
