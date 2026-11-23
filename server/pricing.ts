import { requireAdminClient } from './supabaseAdmin';
import { preferRemote, readLocalConfig, writeLocalConfig } from './localConfig';
import { rowsToPricingConfig, type PricingConfig, type PricingRate } from '../src/utils/quotePricing';

function mapRate(row: any): PricingRate {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    unit: row.unit,
    amount: Number(row.amount),
    sort: Number(row.sort) || 0,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

async function loadRemotePricingRates(): Promise<PricingRate[]> {
  const db = requireAdminClient();
  const { data, error } = await db.from('pricing_rates').select('*').eq('active', true).order('sort');
  if (error) {
    throw new Error(
      /pricing_rates/.test(error.message) && !/fetch failed/i.test(error.message)
        ? 'Las tarifas aún no están configuradas en la base de datos.'
        : error.message
    );
  }
  return (data || []).map(mapRate);
}

export async function loadPricingRates(): Promise<PricingRate[]> {
  return preferRemote(loadRemotePricingRates, () =>
    readLocalConfig().pricingRates.slice().sort((a, b) => a.sort - b.sort)
  );
}

export async function loadPricingConfig(): Promise<PricingConfig> {
  const config = rowsToPricingConfig(await loadPricingRates());
  if (!config) throw new Error('Faltan tarifas de malla, pilar o abono en la base de datos.');
  return config;
}

export function validateRateAmount(rate: PricingRate, amount: number): string | null {
  if (!Number.isFinite(amount) || amount < 0) return `${rate.label}: ingresa un valor válido.`;
  if (rate.kind === 'deposit') {
    if (amount > 100) return `${rate.label}: el porcentaje debe estar entre 0 y 100.`;
    return null;
  }
  if (!Number.isInteger(amount)) return `${rate.label}: usa pesos enteros, sin decimales.`;
  if (amount <= 0) return `${rate.label}: el precio debe ser mayor a cero.`;
  return null;
}

export async function updatePricingRates(
  updates: { id: string; amount: number }[],
  actorEmail: string
): Promise<PricingRate[]> {
  const current = await loadPricingRates();
  const byId = new Map(current.map((r) => [r.id, r]));
  for (const update of updates) {
    const rate = byId.get(update.id);
    if (!rate) throw new Error('Una de las tarifas no existe.');
    const problem = validateRateAmount(rate, update.amount);
    if (problem) throw new Error(problem);
  }
  const now = new Date().toISOString();
  return preferRemote(
    async () => {
      const db = requireAdminClient();
      for (const update of updates) {
        if (byId.get(update.id)!.amount === update.amount) continue;
        const { error } = await db
          .from('pricing_rates')
          .update({ amount: update.amount, updated_at: now, updated_by: actorEmail })
          .eq('id', update.id);
        if (error) throw new Error(error.message);
      }
      return loadRemotePricingRates();
    },
    () => {
      const local = readLocalConfig();
      local.pricingRates = local.pricingRates.map((rate) => {
        const update = updates.find((item) => item.id === rate.id);
        if (!update || update.amount === rate.amount) return rate;
        return { ...rate, amount: update.amount, updatedAt: now, updatedBy: actorEmail };
      });
      writeLocalConfig(local);
      return local.pricingRates.slice().sort((a, b) => a.sort - b.sort);
    }
  );
}
