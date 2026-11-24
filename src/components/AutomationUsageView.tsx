import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { apiFetch } from '../services/sessionApi';
import { EmptyState, KpiCard, Notice, OpsPageHeader } from './ops/OpsUi';

interface Execution {
  id: string;
  status: 'ok' | 'warning' | 'error' | 'pending';
  startedAt: string;
  durationMs: number | null;
  operations: number | null;
}

interface Scenario {
  id: number;
  name: string;
  isActive: boolean;
  isPaused: boolean;
  schedule: string;
  nextExec: string | null;
  lastEdit: string | null;
  pendingErrors: number;
  executions: Execution[];
}

type UsagePayload =
  | {
      configured: true;
      plan: string;
      operationsUsed: number;
      operationsLimit: number;
      creditsUsed: number | null;
      nextReset: string | null;
      scenariosLimit: number | null;
      minIntervalMinutes: number | null;
      scenarios: Scenario[];
      scenariosError: string | null;
      fetchedAt: string;
      editorUrl: string;
    }
  | { configured: false; missing: string[] };

const EXECUTION_LABEL: Record<Execution['status'], string> = {
  ok: 'Correcta',
  warning: 'Con advertencias',
  error: 'Falló',
  pending: 'En curso',
};

const EXECUTION_TONE: Record<Execution['status'], string> = {
  ok: 'bg-[#e3f6ea] text-[#1c6b3a] border-[#7fcf9c]',
  warning: 'bg-[#fdf1d2] text-[#7a5600] border-[#edbe49]',
  error: 'bg-[#fdecec] text-[#9f1d24] border-[#e9a3a6]',
  pending: 'bg-[#e3f1ff] text-[#0b4f8a] border-[#7ec1ff]',
};

function formatDate(value: string | null | undefined, withTime = true) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : { year: 'numeric' }),
    timeZone: 'America/Santiago',
  });
}

function daysUntil(value: string | null) {
  if (!value) return null;
  const diff = new Date(value).getTime() - Date.now();
  return Number.isFinite(diff) ? Math.max(0, Math.ceil(diff / 86_400_000)) : null;
}

export const AutomationUsageView: React.FC = () => {
  const [data, setData] = useState<UsagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiFetch(`/api/admin/automations${refresh ? '?refresh=1' : ''}`));
    } catch (err: any) {
      setError(err?.message || 'No pudimos leer el uso de Make.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const usage = data && data.configured ? data : null;
  const percent = usage && usage.operationsLimit > 0 ? Math.min(100, (usage.operationsUsed / usage.operationsLimit) * 100) : 0;
  const barTone = percent >= 90 ? 'bg-[#d64545]' : percent >= 70 ? 'bg-nydo-yellow' : 'bg-nydo-blue';
  const resetDays = usage ? daysUntil(usage.nextReset) : null;
  const activeCount = usage ? usage.scenarios.filter((s) => s.isActive).length : 0;

  return (
    <section className="max-w-6xl mx-auto px-4 pb-16 space-y-5 font-body text-nydo-ink">
      <OpsPageHeader
        eyebrow="Administración"
        title="Automatizaciones"
        description="Uso de tu cuenta de Make y estado de los escenarios que envían los acuses de recibo. Solo lectura."
        actions={
          <>
            {usage && (
              <a href={usage.editorUrl} target="_blank" rel="noopener noreferrer" className="ops-btn">
                <ExternalLink className="h-4 w-4" />
                Abrir Make
              </a>
            )}
            <button type="button" className="ops-btn ops-btn-primary" disabled={loading} onClick={() => void load(true)}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}

      {data && !data.configured && (
        <div className="ops-card">
          <EmptyState
            title="Falta conectar Make"
            description={
              <>
                Agrega en Vercel (y en <code>.env.local</code> para probar) estas variables:{' '}
                <strong>{data.missing.join(', ')}</strong>.
              </>
            }
          />
        </div>
      )}

      {loading && !data && <p className="text-sm text-nydo-ink/60">Cargando uso de Make…</p>}

      {usage && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Plan" value={usage.plan} hint={usage.minIntervalMinutes ? `Revisión mínima cada ${usage.minIntervalMinutes} min` : undefined} tone="ink" />
            <KpiCard
              label="Operaciones usadas"
              value={`${usage.operationsUsed.toLocaleString('es-CL')} / ${usage.operationsLimit.toLocaleString('es-CL')}`}
              hint={`${Math.round(percent)}% del mes`}
              tone={percent >= 90 ? 'pink' : percent >= 70 ? 'yellow' : 'blue'}
            />
            <KpiCard
              label="Se renueva"
              value={formatDate(usage.nextReset, false)}
              hint={resetDays == null ? undefined : `En ${resetDays} día${resetDays === 1 ? '' : 's'}`}
              tone="orange"
            />
            <KpiCard
              label="Escenarios activos"
              value={usage.scenariosError ? '—' : `${activeCount}${usage.scenariosLimit ? ` / ${usage.scenariosLimit}` : ''}`}
              hint={usage.scenariosLimit && usage.scenarios.length >= usage.scenariosLimit ? 'Llegaste al máximo del plan' : undefined}
              tone="plain"
            />
          </div>

          <div className="ops-card p-4">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>Consumo del mes</span>
              <span className="tabular-nums">{Math.round(percent)}%</span>
            </div>
            <div
              className="mt-2 h-3 w-full overflow-hidden rounded-full bg-nydo-ink/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(percent)}
              aria-label="Operaciones de Make usadas este mes"
            >
              <div className={`h-full ${barTone}`} style={{ width: `${percent}%` }} />
            </div>
            {percent >= 90 && (
              <p className="mt-2 text-sm text-[#9f1d24] font-semibold">
                Quedan pocas operaciones: si se acaban, los escenarios se detienen hasta la renovación.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {usage.scenariosError ? (
              <Notice tone="info">{usage.scenariosError}</Notice>
            ) : usage.scenarios.length === 0 ? (
              <div className="ops-card">
                <EmptyState title="Sin escenarios" description="Todavía no hay escenarios en este equipo de Make." />
              </div>
            ) : (
              usage.scenarios.map((scenario) => (
                <article key={scenario.id} className="ops-card p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-bold text-lg break-words">{scenario.name}</h2>
                      <p className="text-sm text-nydo-ink/70">
                        {scenario.schedule}
                        {scenario.nextExec && ` · próxima: ${formatDate(scenario.nextExec)}`}
                      </p>
                    </div>
                    <span
                      className={`ops-badge ${
                        scenario.isActive && !scenario.isPaused ? EXECUTION_TONE.ok : 'bg-[#f1ece7] text-[#55504b] border-[#c9bfb6]'
                      }`}
                    >
                      {scenario.isPaused ? 'Pausado' : scenario.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {scenario.pendingErrors > 0 && (
                    <Notice tone="error">
                      {scenario.pendingErrors} ejecución(es) con error esperando revisión en Make.
                    </Notice>
                  )}
                  <div>
                    <p className="ops-label mb-2">Últimas ejecuciones</p>
                    {scenario.executions.length === 0 ? (
                      <p className="text-sm text-nydo-ink/60">Aún no hay ejecuciones registradas.</p>
                    ) : (
                      <ul className="divide-y divide-nydo-ink/10 text-sm">
                        {scenario.executions.map((exec) => (
                          <li key={exec.id || exec.startedAt} className="flex flex-wrap items-center justify-between gap-2 py-2">
                            <span className="tabular-nums">{formatDate(exec.startedAt)}</span>
                            <span className="flex items-center gap-3 text-nydo-ink/70">
                              {exec.operations != null && (
                                <span className="tabular-nums">
                                  {exec.operations} op.
                                </span>
                              )}
                              <span className={`ops-badge ${EXECUTION_TONE[exec.status]}`}>{EXECUTION_LABEL[exec.status]}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>

          <p className="text-xs text-nydo-ink/50">Datos de Make actualizados el {formatDate(usage.fetchedAt)}.</p>
        </>
      )}
    </section>
  );
};
