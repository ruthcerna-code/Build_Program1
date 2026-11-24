import { MAKE_API_TOKEN, MAKE_API_ZONE, MAKE_ORGANIZATION_ID, MAKE_TEAM_ID } from './config';

/** Resumen de uso de Make para el panel de administración. Solo lectura. */
export interface MakeExecution {
  id: string;
  status: 'ok' | 'warning' | 'error' | 'pending';
  startedAt: string;
  durationMs: number | null;
  operations: number | null;
}

export interface MakeScenarioUsage {
  id: number;
  name: string;
  isActive: boolean;
  isPaused: boolean;
  schedule: string;
  nextExec: string | null;
  lastEdit: string | null;
  pendingErrors: number;
  executions: MakeExecution[];
}

export interface MakeUsage {
  configured: true;
  plan: string;
  operationsUsed: number;
  operationsLimit: number;
  creditsUsed: number | null;
  nextReset: string | null;
  scenariosLimit: number | null;
  minIntervalMinutes: number | null;
  scenarios: MakeScenarioUsage[];
  scenariosError: string | null;
  fetchedAt: string;
  editorUrl: string;
}

export type MakeUsageResult = MakeUsage | { configured: false; missing: string[] };

const CACHE_MS = 60_000;
const REQUEST_TIMEOUT_MS = 8000;
let cache: { at: number; data: MakeUsage } | null = null;

export function missingMakeConfig(): string[] {
  const missing: string[] = [];
  if (!MAKE_API_TOKEN) missing.push('MAKE_API_TOKEN');
  if (!MAKE_ORGANIZATION_ID) missing.push('MAKE_ORGANIZATION_ID');
  if (!MAKE_TEAM_ID) missing.push('MAKE_TEAM_ID');
  return missing;
}

async function makeGet(path: string): Promise<any> {
  const res = await fetch(`https://${MAKE_API_ZONE}/api/v2${path}`, {
    headers: { Authorization: `Token ${MAKE_API_TOKEN}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (res.status === 401 || res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const scope = /Required scope: ([\w:]+)/.exec(String(body?.detail || ''))?.[1];
    throw new Error(
      scope
        ? `Al token de Make le falta el permiso ${scope}. Crea un token nuevo que lo incluya.`
        : 'Make rechazó el token. Revisa MAKE_API_TOKEN y que tenga los permisos de lectura.'
    );
  }
  if (!res.ok) {
    throw new Error(`Make respondió ${res.status}. Intenta de nuevo en unos minutos.`);
  }
  return res.json();
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function describeSchedule(scheduling: any): string {
  if (!scheduling?.type) return 'Sin programación';
  switch (scheduling.type) {
    case 'immediately':
      return 'Al instante (cuando llegan datos)';
    case 'on-demand':
      return 'Solo manual';
    case 'indefinitely': {
      const windows = Array.isArray(scheduling.restrict)
        ? scheduling.restrict
            .map((r: any) => (Array.isArray(r?.time) ? r.time[0] : null))
            .filter(Boolean)
        : [];
      if (windows.length) return `Diario a las ${windows.join(' y ')}`;
      const minutes = Math.round((Number(scheduling.interval) || 0) / 60);
      return minutes ? `Cada ${minutes} min` : 'Periódico';
    }
    case 'daily':
      return `Diario a las ${scheduling.time || '—'}`;
    default:
      return scheduling.type;
  }
}

function executionStatus(status: unknown): MakeExecution['status'] {
  switch (Number(status)) {
    case 1:
      return 'ok';
    case 2:
      return 'warning';
    case 3:
      return 'error';
    default:
      return 'pending';
  }
}

async function loadExecutions(scenarioId: number): Promise<MakeExecution[]> {
  try {
    const data = await makeGet(`/scenarios/${scenarioId}/logs?pg[limit]=10&pg[sortDir]=desc`);
    const logs: any[] = Array.isArray(data?.scenarioLogs) ? data.scenarioLogs : [];
    return logs
      .filter((log) => log && log.status != null && log.eventType !== 'modify' && log.type !== 'start')
      .slice(0, 5)
      .map((log) => ({
        id: String(log.id || log.imtId || ''),
        status: executionStatus(log.status),
        startedAt: String(log.timestamp || log.segmentStartedAt || ''),
        durationMs: toNumber(log.duration),
        operations: toNumber(log.operations),
      }));
  } catch (err: any) {
    console.warn(`[make] No se pudo leer el historial del escenario ${scenarioId}:`, err?.message);
    return [];
  }
}

export async function loadMakeUsage(force = false): Promise<MakeUsageResult> {
  const missing = missingMakeConfig();
  if (missing.length) return { configured: false, missing };
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  let scenariosError: string | null = null;
  const [orgData, scenarioData] = await Promise.all([
    makeGet(`/organizations/${MAKE_ORGANIZATION_ID}`),
    makeGet(`/scenarios?teamId=${MAKE_TEAM_ID}`).catch((err: any) => {
      scenariosError = err?.message || 'No se pudieron leer los escenarios.';
      return null;
    }),
  ]);
  const org = orgData?.organization || {};
  const license = org.license || {};
  const rawScenarios: any[] = Array.isArray(scenarioData?.scenarios) ? scenarioData.scenarios : [];

  const scenarios: MakeScenarioUsage[] = await Promise.all(
    rawScenarios.map(async (s) => ({
      id: Number(s.id),
      name: String(s.name || `Escenario ${s.id}`),
      isActive: !!s.isActive,
      isPaused: !!s.isPaused,
      schedule: describeSchedule(s.scheduling),
      nextExec: s.nextExec || null,
      lastEdit: s.lastEdit || null,
      pendingErrors: toNumber(s.dlqCount) || 0,
      executions: await loadExecutions(Number(s.id)),
    }))
  );

  const centicredits = toNumber(org.centicreditsConsumed);
  const data: MakeUsage = {
    configured: true,
    plan: String(org.productName || org.serviceName || 'Desconocido'),
    operationsUsed: toNumber(org.operations) || 0,
    operationsLimit: toNumber(license.operations) || 0,
    creditsUsed: centicredits == null ? null : centicredits / 100,
    nextReset: org.nextReset || null,
    scenariosLimit: toNumber(license.scenarios),
    minIntervalMinutes: toNumber(license.interval),
    scenarios,
    scenariosError,
    fetchedAt: new Date().toISOString(),
    editorUrl: `https://${MAKE_API_ZONE}/${MAKE_TEAM_ID}/scenarios`,
  };
  cache = { at: Date.now(), data };
  return data;
}
