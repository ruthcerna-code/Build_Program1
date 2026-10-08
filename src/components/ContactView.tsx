import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { CONTACT_INBOX_EMAIL } from '../constants/admin';

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
    <section className="max-w-xl mx-auto pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Contáctanos</h1>
            <p className="text-sm text-slate-500">Te respondemos a tu correo. El mensaje llega a {CONTACT_INBOX_EMAIL}.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">
            Nombre
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Correo electrónico
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Teléfono (opcional)
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Asunto
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Mensaje
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900"
            />
          </label>
          <div className="hidden" aria-hidden="true">
            <input tabIndex={-1} value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>
          )}
          {ok && (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{ok}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold disabled:opacity-60 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Enviando…' : 'Enviar mensaje'}
          </button>
        </form>
      </div>
    </section>
  );
};
