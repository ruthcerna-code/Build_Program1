import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/sessionApi';

interface InternalRow {
  id: string;
  email: string;
  full_name: string;
  active: boolean;
  can_view_quotes: boolean;
  can_edit_quotes: boolean;
  can_delete_quotes: boolean;
  can_view_sales: boolean;
}

const emptyForm = {
  email: '',
  fullName: '',
  active: true,
  viewQuotes: true,
  editQuotes: false,
  deleteQuotes: false,
  viewSales: false,
};

export const InternalUsersView: React.FC = () => {
  const [users, setUsers] = useState<InternalRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const data = await apiFetch('/api/internal-users');
      setUsers(data.users || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const data = await apiFetch('/api/internal-users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMessage(data.message);
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (row: InternalRow) => {
    try {
      await apiFetch('/api/internal-users', {
        method: 'POST',
        body: JSON.stringify({
          email: row.email,
          fullName: row.full_name,
          active: !row.active,
          viewQuotes: row.can_view_quotes,
          editQuotes: row.can_edit_quotes,
          deleteQuotes: row.can_delete_quotes,
          viewSales: row.can_view_sales,
        }),
      });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <section className="pb-16 max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-black">Equipo interno</h1>
        <p className="text-sm text-slate-500">
          Autorizas un correo para entrar con su propia cuenta de Google. No se crea una cuenta de Google aquí.
        </p>
      </div>

      {message && <p className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-3 py-2">{message}</p>}
      {error && <p className="text-sm bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-3 py-2">{error}</p>}

      <form onSubmit={save} className="bg-white rounded-2xl border p-4 space-y-3">
        <input
          required
          placeholder="Nombre"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full rounded-xl border px-3 py-2"
        />
        <input
          required
          type="email"
          placeholder="Correo de la persona"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-xl border px-3 py-2"
        />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={form.viewQuotes} onChange={(e) => setForm({ ...form, viewQuotes: e.target.checked })} />
          <span><strong>Consultar cotizaciones.</strong> Puede ver el listado y abrir Ver detalle.</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={form.editQuotes} onChange={(e) => setForm({ ...form, editQuotes: e.target.checked })} />
          <span><strong>Modificar cotizaciones.</strong> Puede cambiar datos, importe y estado, y registrar pagos.</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={form.deleteQuotes} onChange={(e) => setForm({ ...form, deleteQuotes: e.target.checked })} />
          <span><strong>Eliminar cotizaciones.</strong> Las oculta, pero quedan en el historial.</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={form.viewSales} onChange={(e) => setForm({ ...form, viewSales: e.target.checked })} />
          <span><strong>Consultar ventas.</strong> Ve resúmenes de importes y pagos.</span>
        </label>
        <button disabled={loading} className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold cursor-pointer">
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </form>

      <div className="space-y-2">
        {users.map((row) => (
          <article key={row.id} className="bg-white rounded-2xl border px-4 py-3 flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-black">{row.full_name}</p>
              <p className="text-xs text-slate-500">{row.email}</p>
              <p className="text-xs">{row.active ? 'Acceso activo' : 'Acceso desactivado'}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleActive(row)}
              className="px-3 py-2 rounded-xl border font-bold cursor-pointer"
            >
              {row.active ? 'Desactivar' : 'Activar'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
