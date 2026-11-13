/**
 * Presupuesto de instalación de mallas.
 * Los costos y el margen llegan desde configuración. Esta función no tiene valores de negocio propios.
 */

import type { QuoteRequest } from '../types';

export const ESTIMATE_UNAVAILABLE =
  'Estimación referencial: no disponible (tarifas sin configurar)';

export const ESTIMATE_FOOTNOTE =
  'Las medidas son las informadas por el cliente y se confirman antes de la instalación. Esta estimación referencial no constituye un presupuesto definitivo.';

export const ESTIMATE_NEXT_STEP =
  'Un asesor técnico te contactará para confirmar medidas y enviarte la cotización formal.';

export const ESTIMATE_VALIDITY_DAYS = 15;

export const ATTENTION_STATUSES = ['Por confirmar', 'Supuesto', 'Por definir'] as const;

export const COST_PARAM_KEYS = [
  'malla_06',
  'perdida_malla',
  'fijaciones',
  'pilar',
  'mano_obra',
  'traslado',
  'reserva',
  'minimo_trabajo',
  'iva',
  'redondeo',
] as const;

export type CostParamKey = (typeof COST_PARAM_KEYS)[number];

export interface CostParameter {
  key: string;
  name: string;
  value: number;
  unit: string;
  status: string;
  updatedAt: string;
}

export interface MarginSetting {
  value: number;
  unit: string;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

export interface BudgetOpeningInput {
  name: string;
  widthCm: number;
  heightCm: number;
}

export interface BudgetRequest {
  openings: BudgetOpeningInput[];
  pillarCount: number;
}

export interface BudgetOpeningResult {
  name: string;
  widthCm: number;
  heightCm: number;
  areaM2: number;
  contourM: number;
}

export interface BudgetLine {
  item: string;
  quantity: number;
  unit: string;
  unitCost: number;
  operation: string;
  result: number;
}

export interface InstallationBudget {
  available: true;
  openings: BudgetOpeningResult[];
  totalAreaM2: number;
  totalContourM: number;
  pillarCount: number;
  meshLabel: string;
  lines: BudgetLine[];
  subtotal: number;
  reserve: number;
  totalCost: number;
  netPrice: number;
  ivaAmount: number;
  calculatedTotal: number;
  roundedTotal: number;
  minimumJob: number;
  minimumApplied: boolean;
  totalWithoutMinimum: number;
  clientTotal: number;
  marginPesos: number;
  realMargin: number;
  parameters: CostParameter[];
  margin: MarginSetting;
}

export interface BudgetUnavailable {
  available: false;
  reason: 'tarifas' | 'medidas';
}

export type BudgetResult = InstallationBudget | BudgetUnavailable;

export function pesos(value: number): number {
  return Math.round(value);
}

export function realMarginPercent(realMargin: number): number {
  return Math.round(realMargin * 1000) / 10;
}

export function roundUpToStep(value: number, step: number): number {
  if (!(step > 0)) return value;
  const units = value / step;
  const nearest = Math.round(units);
  if (Math.abs(units - nearest) < 1e-8) return nearest * step;
  return Math.ceil(units - 1e-8) * step;
}

export function formatBudgetCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(pesos(amount));
}

export function formatBudgetQty(value: number): string {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value);
}

export function formatBudgetFactor(value: number): string {
  return new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatConfigDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'sin fecha';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getUTCFullYear()}`;
}

export function marginCaption(margin: MarginSetting): string {
  return `Margen objetivo: ${formatBudgetQty(margin.value)}% (vigente desde ${formatConfigDate(margin.updatedAt)})`;
}

export function clientTotalLine(budget: BudgetResult): string {
  if (budget.available === false) {
    return budget.reason === 'medidas'
      ? 'No se puede calcular: hay medidas en cero o negativas.'
      : ESTIMATE_UNAVAILABLE;
  }
  return `TOTAL IVA incluido: ${formatBudgetCLP(budget.clientTotal)}`;
}

export function sentClientTotal(budget?: BudgetResult | null): number | null {
  if (!budget || budget.available !== true) return null;
  return budget.clientTotal;
}

export function quoteWithInstallationBudget(
  quote: QuoteRequest,
  parameters: CostParameter[] | null | undefined,
  margin: MarginSetting | null | undefined
): QuoteRequest {
  if (quote.guidedQuote?.installationBudget?.available) return quote;
  if (!quote.guidedQuote || !quote.windows?.length) return quote;
  const budget = computeInstallationBudget(
    {
      openings: quote.windows.map((win) => ({
        name: win.name || '',
        widthCm: Number(win.widthCm ?? win.width * 100),
        heightCm: Number(win.heightCm ?? win.height * 100),
      })),
      pillarCount: quote.windows.reduce((sum, win) => sum + (Number(win.extraPillars) || 0), 0),
    },
    parameters,
    margin
  );
  if (!budget.available) return quote;
  return { ...quote, guidedQuote: { ...quote.guidedQuote, installationBudget: budget } };
}

function paramMap(parameters: CostParameter[]): Map<string, CostParameter> | null {
  const map = new Map<string, CostParameter>();
  for (const key of COST_PARAM_KEYS) {
    const found = parameters.find((item) => item.key === key);
    if (!found || !Number.isFinite(Number(found.value))) return null;
    map.set(key, { ...found, value: Number(found.value) });
  }
  return map;
}

function marginIsUsable(margin: MarginSetting | null | undefined): margin is MarginSetting {
  if (!margin) return false;
  const value = Number(margin.value);
  return Number.isFinite(value) && value >= 0 && value < 100 && Boolean(margin.updatedAt);
}

export function computeInstallationBudget(
  request: BudgetRequest,
  parameters: CostParameter[] | null | undefined,
  margin: MarginSetting | null | undefined
): BudgetResult {
  const openings = request.openings || [];
  if (!openings.length || openings.some((item) => !(item.widthCm > 0) || !(item.heightCm > 0))) {
    return { available: false, reason: 'medidas' };
  }
  if (!Number.isFinite(request.pillarCount) || request.pillarCount < 0) {
    return { available: false, reason: 'medidas' };
  }

  const costs = paramMap(parameters || []);
  if (!costs || !marginIsUsable(margin)) {
    return { available: false, reason: 'tarifas' };
  }

  const detailed: BudgetOpeningResult[] = openings.map((item) => {
    const widthM = item.widthCm / 100;
    const heightM = item.heightCm / 100;
    return {
      name: item.name?.trim() || 'Sin nombre',
      widthCm: item.widthCm,
      heightCm: item.heightCm,
      areaM2: widthM * heightM,
      contourM: 2 * (widthM + heightM),
    };
  });
  const totalAreaM2 = detailed.reduce((sum, item) => sum + item.areaM2, 0);
  const totalContourM = detailed.reduce((sum, item) => sum + item.contourM, 0);

  const mesh = costs.get('malla_06')!;
  const loss = costs.get('perdida_malla')!.value / 100;
  const fixing = costs.get('fijaciones')!;
  const pillar = costs.get('pilar')!;
  const labor = costs.get('mano_obra')!;
  const transport = costs.get('traslado')!;
  const reserveRate = costs.get('reserva')!.value / 100;
  const minimumJob = costs.get('minimo_trabajo')!.value;
  const ivaRate = costs.get('iva')!.value / 100;
  const roundingStep = costs.get('redondeo')!.value;
  const marginRate = margin.value / 100;

  const meshCost = totalAreaM2 * (1 + loss) * mesh.value;
  const fixingCost = totalContourM * fixing.value;
  const pillarCost = request.pillarCount * pillar.value;
  const lines: BudgetLine[] = [
    {
      item: mesh.name,
      quantity: totalAreaM2,
      unit: 'm²',
      unitCost: mesh.value,
      operation: `${formatBudgetQty(totalAreaM2)} m² × ${formatBudgetFactor(1 + loss)} × ${formatBudgetCLP(mesh.value)}`,
      result: meshCost,
    },
    {
      item: fixing.name,
      quantity: totalContourM,
      unit: 'm',
      unitCost: fixing.value,
      operation: `${formatBudgetQty(totalContourM)} m × ${formatBudgetCLP(fixing.value)}`,
      result: fixingCost,
    },
    {
      item: pillar.name,
      quantity: request.pillarCount,
      unit: 'unidad',
      unitCost: pillar.value,
      operation: `${formatBudgetQty(request.pillarCount)} × ${formatBudgetCLP(pillar.value)}`,
      result: pillarCost,
    },
    {
      item: labor.name,
      quantity: 1,
      unit: 'trabajo',
      unitCost: labor.value,
      operation: `1 trabajo × ${formatBudgetCLP(labor.value)}`,
      result: labor.value,
    },
    {
      item: transport.name,
      quantity: 1,
      unit: 'trabajo',
      unitCost: transport.value,
      operation: `1 trabajo × ${formatBudgetCLP(transport.value)}`,
      result: transport.value,
    },
  ];

  const subtotal = lines.reduce((sum, line) => sum + line.result, 0);
  const reserve = subtotal * reserveRate;
  const totalCost = subtotal + reserve;
  const netPrice = totalCost / (1 - marginRate);
  const ivaAmount = netPrice * ivaRate;
  const calculatedTotal = netPrice + ivaAmount;
  const roundedTotal = roundUpToStep(calculatedTotal, roundingStep);
  const clientTotal = Math.max(roundedTotal, minimumJob);
  const netOfClient = clientTotal / (1 + ivaRate);
  const marginPesos = netOfClient - totalCost;
  const realMargin = netOfClient === 0 ? 0 : marginPesos / netOfClient;

  return {
    available: true,
    openings: detailed,
    totalAreaM2,
    totalContourM,
    pillarCount: request.pillarCount,
    meshLabel: mesh.name,
    lines,
    subtotal,
    reserve,
    totalCost,
    netPrice,
    ivaAmount,
    calculatedTotal,
    roundedTotal,
    minimumJob,
    minimumApplied: clientTotal > roundedTotal,
    totalWithoutMinimum: roundedTotal,
    clientTotal,
    marginPesos,
    realMargin,
    parameters: COST_PARAM_KEYS.map((key) => costs.get(key)!),
    margin,
  };
}
