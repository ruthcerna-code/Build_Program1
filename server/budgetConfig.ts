import { requireAdminClient } from './supabaseAdmin';
import { isNetworkFailure, preferRemote, readLocalConfig, writeLocalConfig, type MarginChangeRecord } from './localConfig';
import {
  ESTIMATE_UNAVAILABLE,
  computeInstallationBudget,
  type CostParameter,
  type MarginSetting,
} from '../src/utils/installationBudget';
import type { QuoteRequest } from '../src/types';

function mapCost(row: any): CostParameter {
  return {
    key: String(row.clave),
    name: String(row.nombre),
    value: Number(row.valor),
    unit: String(row.unidad),
    status: String(row.estado),
    updatedAt: row.actualizado_en || new Date(0).toISOString(),
  };
}

function mapMargin(row: any): MarginSetting {
  return {
    value: Number(row.valor),
    unit: String(row.unidad || '%'),
    description: String(row.descripcion || ''),
    updatedBy: String(row.actualizado_por || ''),
    updatedAt: row.actualizado_en || '',
  };
}

function throwIfStoreError(error: { message?: string } | null) {
  if (!error) return;
  if (isNetworkFailure(error)) throw new Error(error.message || 'fetch failed');
  throw new Error(error.message || 'No pudimos leer la configuración.');
}

async function loadRemoteBudgetSettings(): Promise<{ parameters: CostParameter[]; margin: MarginSetting | null }> {
  const db = requireAdminClient();
  const costs = await db.from('parametros_costo').select('*').order('clave');
  const margin = await db.from('configuracion_comercial').select('*').eq('clave', 'margen_objetivo').maybeSingle();
  throwIfStoreError(costs.error);
  throwIfStoreError(margin.error);
  return {
    parameters: (costs.data || []).map(mapCost),
    margin: margin.data ? mapMargin(margin.data) : null,
  };
}

export async function loadBudgetSettings(): Promise<{ parameters: CostParameter[]; margin: MarginSetting | null } | null> {
  try {
    return await preferRemote(loadRemoteBudgetSettings, () => {
      const local = readLocalConfig();
      return { parameters: local.costs, margin: local.margin };
    });
  } catch (err: any) {
    console.warn('[budget] No se leyeron los parámetros:', err?.cause?.code || err?.message);
    return null;
  }
}

export async function attachInstallationBudget(quote: QuoteRequest): Promise<void> {
  if (!quote.guidedQuote) return;
  const settings = await loadBudgetSettings();
  const openings = (quote.windows || []).map((win) => ({
    name: win.name || '',
    widthCm: Number(win.widthCm ?? win.width * 100),
    heightCm: Number(win.heightCm ?? win.height * 100),
  }));
  const pillarCount = (quote.windows || []).reduce((sum, win) => sum + (Number(win.extraPillars) || 0), 0);
  const budget = computeInstallationBudget(
    { openings, pillarCount },
    settings?.parameters ?? null,
    settings?.margin ?? null
  );
  quote.guidedQuote.installationBudget = budget;
  if (budget.available === false && budget.reason === 'tarifas') {
    const incident = { at: new Date().toISOString(), message: ESTIMATE_UNAVAILABLE };
    quote.guidedQuote.budgetIncident = incident;
    console.warn('[budget]', quote.folio, incident.message);
  }
}

export type MarginChange = MarginChangeRecord;

async function loadRemoteMarginHistory(): Promise<MarginChange[]> {
  const db = requireAdminClient();
  const { data, error } = await db
    .from('configuracion_comercial_historial')
    .select('*')
    .eq('clave', 'margen_objetivo')
    .order('actualizado_en', { ascending: false })
    .limit(20);
  throwIfStoreError(error);
  return (data || []).map((row) => ({
    previous: row.valor_anterior == null ? null : Number(row.valor_anterior),
    next: Number(row.valor_nuevo),
    unit: String(row.unidad || '%'),
    updatedBy: String(row.actualizado_por || ''),
    updatedAt: row.actualizado_en,
  }));
}

export async function loadMarginHistory(): Promise<MarginChange[]> {
  return preferRemote(loadRemoteMarginHistory, () => readLocalConfig().marginHistory.slice(0, 20));
}

export function validateMarginInput(value: number): string | null {
  if (!Number.isFinite(value)) return 'Ingresa un margen numérico.';
  if (value === 100) return '100% es imposible: el precio se calcula dividiendo el costo por 1 − margen.';
  if (value < 0 || value > 90) return 'El margen debe ser un número entre 0 y 90.';
  return null;
}

export async function saveMargin(value: number, actorEmail: string, confirmLow: boolean): Promise<MarginSetting> {
  const problem = validateMarginInput(value);
  if (problem) throw new Error(problem);
  if (value < 20 && !confirmLow) {
    const error = new Error('Un margen bajo 20% deja poco espacio para imprevistos. ¿Confirmas?');
    (error as Error & { needsConfirm?: boolean }).needsConfirm = true;
    throw error;
  }
  const now = new Date().toISOString();
  const description =
    'Porcentaje del precio de venta que queda como margen. No es un recargo sobre el costo.';
  return preferRemote(
    async () => {
      const db = requireAdminClient();
      const current = await db.from('configuracion_comercial').select('*').eq('clave', 'margen_objetivo').maybeSingle();
      throwIfStoreError(current.error);
      const previous = current.data ? Number(current.data.valor) : null;
      const saved = await db
        .from('configuracion_comercial')
        .upsert({
          clave: 'margen_objetivo',
          valor: value,
          unidad: '%',
          descripcion: current.data?.descripcion || description,
          actualizado_por: actorEmail,
          actualizado_en: now,
        })
        .select('*')
        .single();
      throwIfStoreError(saved.error);
      const history = await db.from('configuracion_comercial_historial').insert({
        clave: 'margen_objetivo',
        valor_anterior: previous,
        valor_nuevo: value,
        unidad: '%',
        actualizado_por: actorEmail,
        actualizado_en: now,
      });
      if (history.error) console.warn('[budget] No se guardó el historial del margen:', history.error.message);
      return mapMargin(saved.data);
    },
    () => {
      const local = readLocalConfig();
      const previous = local.margin?.value ?? null;
      local.margin = {
        value,
        unit: '%',
        description: local.margin?.description || description,
        updatedBy: actorEmail,
        updatedAt: now,
      };
      local.marginHistory = [
        { previous, next: value, unit: '%', updatedBy: actorEmail, updatedAt: now },
        ...local.marginHistory,
      ].slice(0, 20);
      writeLocalConfig(local);
      return local.margin;
    }
  );
}

export async function saveCostParameters(
  updates: { key: string; value: number }[],
  actorEmail: string
): Promise<CostParameter[]> {
  const now = new Date().toISOString();
  for (const update of updates) {
    if (!Number.isFinite(update.value) || update.value < 0) {
      throw new Error('Cada parámetro de costo necesita un valor numérico mayor o igual a cero.');
    }
  }
  return preferRemote(
    async () => {
      const db = requireAdminClient();
      for (const update of updates) {
        const saved = await db
          .from('parametros_costo')
          .update({ valor: update.value, actualizado_por: actorEmail, actualizado_en: now })
          .eq('clave', update.key);
        throwIfStoreError(saved.error);
      }
      const remote = await loadRemoteBudgetSettings();
      return remote.parameters;
    },
    () => {
      const local = readLocalConfig();
      const byKey = new Map(updates.map((item) => [item.key, item.value]));
      local.costs = local.costs.map((item) =>
        byKey.has(item.key) ? { ...item, value: byKey.get(item.key)!, updatedAt: now } : item
      );
      writeLocalConfig(local);
      return local.costs;
    }
  );
}
