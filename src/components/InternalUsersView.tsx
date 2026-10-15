import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/sessionApi';
import { upsertLocalStaffUser } from '../services/authStorage';
import { EmptyState, Notice, OpsPageHeader } from './ops/OpsUi';

type PermissionKey = 'viewQuotes' | 'editQuotes' | 'deleteQuotes' | 'viewSales';

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
  password: '',
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
      if (form.password.trim()) {
        upsertLocalStaffUser({
          id: data.user?.id || `int-${Date.now()}`,
          email: form.email.trim().toLowerCase(),
          passwordHash: form.password.trim(),
          fullName: form.fullName.trim(),
          role: 'interno',
          createdAt: new Date().toISOString(),
          active: form.active,
          authProvider: 'password',
          permissions: {
            viewQuotes: form.viewQuotes,
            editQuotes: form.editQuotes,
            deleteQuotes: form.deleteQuotes,
            viewSales: form.viewSales,
          },
        });
      }
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

  const permissionOptions: { key: PermissionKey; title: string; detail: string }[] = [
    { key: 'viewQuotes', title: 'Consultar cotizaciones', detail: 'Puede ver el listado y abrir Ver detalle.' },
    { key: 'editQuotes', title: 'Modificar cotizaciones', detail: 'Puede cambiar datos, importe y estado, y registrar pagos.' },
    { key: 'deleteQuotes', title: 'Eliminar cotizaciones', detail: 'Las oculta, pero quedan en el historial.' },
    { key: 'viewSales', title: 'Consultar ventas', detail: 'Ve resúmenes de importes y pagos.' },
  ];

  const rowPermissions = (row: InternalRow) =>
    [
      row.can_view_quotes && 'Consultar',
      row.can_edit_quotes && 'Modificar',
      row.can_delete_quotes && 'Eliminar',
      row.can_view_sales && 'Ventas',
    ].filter(Boolean) as string[];

  const activeCount = users.filter((u) => u.active).length;

  return (
    <section className="pb-16 space-y-5">
      <OpsPageHeader
        eyebrow="Equipo"
        title="Cuentas"
        description="Crea correo y contraseña para que esa persona ingrese al panel. No se usa Google. La única cuenta administradora es ruth.cerna@gmail.com."
      />

      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
        <form onSubmit={save} className="ops-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide">Nueva cuenta o actualizar</h2>
            <p className="mt-1 text-xs text-nydo-ink/60">Si el correo ya existe, se actualizan sus datos y permisos.</p>
          </div>
          <label className="block">
            <span className="ops-label mb-1">Nombre</span>
            <input
              required
              placeholder="Nombre y apellido"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="ops-input"
            />
          </label>
          <label className="block">
            <span className="ops-label mb-1">Correo</span>
            <input
              required
              type="email"
              placeholder="persona@correo.cl"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="ops-input"
            />
          </label>
          <label className="block">
            <span className="ops-label mb-1">Contraseña</span>
            <input
              required
              type="password"
              placeholder="Contraseña para ingresar"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={4}
              autoComplete="new-password"
              className="ops-input"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="ops-label mb-1">Permisos</legend>
            {permissionOptions.map((opt) => (
              <label
                key={opt.key}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  form[opt.key] ? 'border-nydo-ink bg-nydo-cream/60' : 'border-nydo-ink/15 hover:bg-[#fbf6f1]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form[opt.key]}
                  onChange={(e) => setForm({ ...form, [opt.key]: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-[#090909]"
                />
                <span>
                  <strong className="block">{opt.title}</strong>
                  <span className="text-xs text-nydo-ink/65">{opt.detail}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <button type="submit" disabled={loading} className="ops-btn ops-btn-primary w-full">
            {loading ? 'Guardando…' : 'Guardar cuenta'}
          </button>
        </form>

        <div className="ops-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-nydo-ink/10 px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-wide">Equipo interno</h2>
            <span className="text-xs font-semibold text-nydo-ink/60 tabular-nums">
              {activeCount} activas de {users.length}
            </span>
          </div>
          {users.length === 0 ? (
            <EmptyState title="Aún no hay cuentas internas" description="Crea la primera con el formulario." />
          ) : (
            <ul className="divide-y divide-nydo-ink/10">
              {users.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                        row.active ? 'bg-nydo-blue text-nydo-ink' : 'bg-nydo-ink/10 text-nydo-ink/50'
                      }`}
                      aria-hidden="true"
                    >
                      {(row.full_name || row.email).charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{row.full_name}</p>
                      <p className="truncate text-xs text-nydo-ink/60">{row.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rowPermissions(row).length === 0 ? (
                          <span className="text-xs text-nydo-ink/50">Sin permisos</span>
                        ) : (
                          rowPermissions(row).map((p) => (
                            <span key={p} className="rounded-md bg-nydo-cream px-1.5 py-0.5 text-[11px] font-bold">
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`ops-badge ${
                        row.active
                          ? 'bg-[#e3f6ea] text-[#1c6b3a] border-[#7fcf9c]'
                          : 'bg-[#f1ece7] text-[#55504b] border-[#c9bfb6]'
                      }`}
                    >
                      {row.active ? 'Acceso activo' : 'Desactivado'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      className={`ops-btn ${row.active ? 'ops-btn-danger' : ''}`}
                    >
                      {row.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
