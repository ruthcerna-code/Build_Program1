import fs from 'node:fs';
import path from 'node:path';
import { getAdminClient } from './supabaseAdmin';
import type { PricingRate } from '../src/utils/quotePricing';
import type { CostParameter, MarginSetting } from '../src/utils/installationBudget';

export const LOCAL_CONFIG_NOTICE =
  'La base en la nube no responde, así que esta pantalla usa la copia local del servidor. Puedes ver y guardar los valores. Cuando Supabase vuelva, hay que aplicar las migraciones para que queden en la nube.';

const FILE = path.join(process.cwd(), 'data', 'panel-config.json');

export interface MarginChangeRecord {
  previous: number | null;
  next: number;
  unit: string;
  updatedBy: string;
  updatedAt: string;
}

interface LocalFile {
  pricingRates: PricingRate[];
  costs: CostParameter[];
  margin: MarginSetting;
  marginHistory: MarginChangeRecord[];
}

const SEEDED_AT = '2026-11-12T15:00:00.000Z';

function seed(): LocalFile {
  return {
    pricingRates: [
      { id: 'mesh_06', kind: 'mesh', label: 'Malla de 0,6 mm', unit: 'metro lineal', amount: 6500, sort: 1, updatedAt: SEEDED_AT, updatedBy: 'sistema' },
      { id: 'mesh_07', kind: 'mesh', label: 'Malla de 0,7 mm', unit: 'metro lineal', amount: 7200, sort: 2, updatedAt: SEEDED_AT, updatedBy: 'sistema' },
      { id: 'mesh_08', kind: 'mesh', label: 'Malla de 0,8 mm', unit: 'metro lineal', amount: 7500, sort: 3, updatedAt: SEEDED_AT, updatedBy: 'sistema' },
      { id: 'mesh_09', kind: 'mesh', label: 'Malla de 0,9 mm', unit: 'metro lineal', amount: 8800, sort: 4, updatedAt: SEEDED_AT, updatedBy: 'sistema' },
      { id: 'pillar', kind: 'pillar', label: 'Pilar adicional', unit: 'unidad', amount: 12000, sort: 10, updatedAt: SEEDED_AT, updatedBy: 'sistema' },
      { id: 'deposit', kind: 'deposit', label: 'Abono inicial', unit: 'porcentaje', amount: 30, sort: 20, updatedAt: SEEDED_AT, updatedBy: 'sistema' },
    ],
    costs: [
      { key: 'malla_06', name: 'Malla 0,6 mm', value: 440, unit: '$ por m²', status: 'Promedio mercado', updatedAt: SEEDED_AT },
      { key: 'perdida_malla', name: 'Pérdida de malla', value: 20, unit: '%', status: 'Supuesto', updatedAt: SEEDED_AT },
      { key: 'fijaciones', name: 'Fijaciones (perfil, tornillos, tarugos, alambre)', value: 1125, unit: '$ por metro de contorno', status: 'Estimado', updatedAt: SEEDED_AT },
      { key: 'pilar', name: 'Pilar de aluminio', value: 5000, unit: '$ por unidad', status: 'Por confirmar', updatedAt: SEEDED_AT },
      { key: 'mano_obra', name: 'Mano de obra', value: 20000, unit: '$ por trabajo', status: 'Por confirmar', updatedAt: SEEDED_AT },
      { key: 'traslado', name: 'Traslado', value: 8000, unit: '$ por trabajo', status: 'Por confirmar', updatedAt: SEEDED_AT },
      { key: 'reserva', name: 'Reserva garantía y consumibles', value: 5, unit: '% del subtotal', status: 'Supuesto', updatedAt: SEEDED_AT },
      { key: 'minimo_trabajo', name: 'Mínimo por trabajo', value: 60000, unit: '$ con IVA', status: 'Por definir', updatedAt: SEEDED_AT },
      { key: 'iva', name: 'IVA', value: 19, unit: '%', status: 'Fijo', updatedAt: SEEDED_AT },
      { key: 'redondeo', name: 'Redondeo del total', value: 1000, unit: '$ (hacia arriba)', status: 'Definido', updatedAt: SEEDED_AT },
    ],
    margin: {
      value: 30,
      unit: '%',
      description: 'Porcentaje del precio de venta que queda como margen. No es un recargo sobre el costo.',
      updatedBy: 'sistema',
      updatedAt: SEEDED_AT,
    },
    marginHistory: [],
  };
}

function writeLocal(data: LocalFile) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

export function readLocalConfig(): LocalFile {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Partial<LocalFile>;
    const base = seed();
    const data: LocalFile = {
      pricingRates: Array.isArray(parsed.pricingRates) && parsed.pricingRates.length ? parsed.pricingRates : base.pricingRates,
      costs: Array.isArray(parsed.costs) && parsed.costs.length ? parsed.costs : base.costs,
      margin: parsed.margin?.value != null ? parsed.margin : base.margin,
      marginHistory: Array.isArray(parsed.marginHistory) ? parsed.marginHistory : [],
    };
    return data;
  } catch {
    const data = seed();
    writeLocal(data);
    return data;
  }
}

export function writeLocalConfig(data: LocalFile) {
  writeLocal(data);
}

let remoteCache: { at: number; ok: boolean } | null = null;

export function isNetworkFailure(err: unknown): boolean {
  const any = err as { message?: string; code?: string; cause?: { code?: string } };
  const code = any?.cause?.code || any?.code || '';
  const message = String(any?.message || err || '');
  return (
    ['ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'ENETUNREACH'].includes(code) ||
    /fetch failed|ENOTFOUND|getaddrinfo|network/i.test(message)
  );
}

function rememberRemote(ok: boolean) {
  remoteCache = { at: Date.now(), ok };
}

export function remoteLooksDown(): boolean {
  return remoteCache != null && !remoteCache.ok && Date.now() - remoteCache.at < 60_000;
}

export function configStorage(): 'remote' | 'local' {
  return remoteLooksDown() ? 'local' : 'remote';
}

export function configNotice(): string | undefined {
  return configStorage() === 'local' ? LOCAL_CONFIG_NOTICE : undefined;
}

export async function probeSupabase(): Promise<boolean> {
  if (remoteCache && Date.now() - remoteCache.at < 30_000) return remoteCache.ok;
  const db = getAdminClient();
  if (!db) {
    rememberRemote(false);
    return false;
  }
  try {
    const { error } = await db.from('pricing_rates').select('id').limit(1);
    if (error && isNetworkFailure(error)) {
      rememberRemote(false);
      return false;
    }
    rememberRemote(true);
    return true;
  } catch (err) {
    rememberRemote(!isNetworkFailure(err) ? true : false);
    return !isNetworkFailure(err);
  }
}

export async function preferRemote<T>(remote: () => Promise<T>, local: () => T): Promise<T> {
  if (remoteLooksDown()) return local();
  try {
    const value = await remote();
    rememberRemote(true);
    return value;
  } catch (err) {
    if (!isNetworkFailure(err)) throw err;
    rememberRemote(false);
    console.warn('[config] Supabase no responde. Se usa la copia local:', (err as { cause?: { code?: string }; message?: string })?.cause?.code || (err as Error)?.message);
    return local();
  }
}
