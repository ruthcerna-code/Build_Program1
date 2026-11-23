export type SpaceType =
  | 'ventana'
  | 'ventana_esquina'
  | 'balcon_abierto'
  | 'balcon_abierto_esquina'
  | 'balcon_cerrado'
  | 'terraza'
  | 'otro';

export const SPACE_TYPE_OPTIONS: { id: SpaceType; label: string; autoPillars: number }[] = [
  { id: 'ventana', label: 'Ventana', autoPillars: 0 },
  { id: 'ventana_esquina', label: 'Ventana en esquina', autoPillars: 1 },
  { id: 'balcon_abierto', label: 'Balcón abierto sin esquina', autoPillars: 0 },
  { id: 'balcon_abierto_esquina', label: 'Balcón abierto con esquina', autoPillars: 1 },
  { id: 'balcon_cerrado', label: 'Balcón cerrado', autoPillars: 0 },
  { id: 'terraza', label: 'Terraza', autoPillars: 0 },
  { id: 'otro', label: 'Otro espacio', autoPillars: 0 },
];

export const AUTO_PILLAR_NOTE =
  'Se incluye 1 pilar en esta estimación por el tipo de espacio seleccionado. Su necesidad se confirmará en la evaluación técnica.';

export const LINEAR_RULE_NOTE =
  'Los metros lineales facturables son una regla comercial de cotización: (ancho + alto) × caras. No corresponden a la superficie de malla.';

export const ESTIMATE_DISCLAIMER =
  'Valores referenciales en pesos chilenos, sin impuestos ni otros cargos. El valor final se confirma en la evaluación técnica.';

/** Ejemplo de control: balcón abierto con esquina, 5 × 3 m, 2 caras, malla 0,6 mm. */
export const CONTROL_EXAMPLE_SPACE: SpaceInput = {
  label: 'Balcón de ejemplo',
  location: '',
  spaceType: 'balcon_abierto_esquina',
  widthCm: 500,
  heightCm: 300,
  faces: 2,
  extraPillars: 0,
};

export const MAX_FACES = 10;
export const MAX_EXTRA_PILLARS = 20;

export type PricingRateKind = 'mesh' | 'pillar' | 'deposit';

export interface PricingRate {
  id: string;
  kind: PricingRateKind;
  label: string;
  unit: string;
  amount: number;
  sort: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface PricingConfig {
  meshes: PricingRate[];
  pillar: PricingRate;
  deposit: PricingRate;
}

export interface SpaceInput {
  label: string;
  location: string;
  spaceType: SpaceType;
  widthCm: number;
  heightCm: number;
  faces: number;
  extraPillars: number;
}

export interface SpaceEstimate extends SpaceInput {
  spaceTypeLabel: string;
  linearMeters: number;
  autoPillars: number;
}

export interface QuoteEstimate {
  mesh: { id: string; label: string; pricePerMeter: number };
  pillarPrice: number;
  depositPercent: number;
  spaces: SpaceEstimate[];
  totalLinearMeters: number;
  meshSubtotal: number;
  autoPillars: number;
  extraPillars: number;
  totalPillars: number;
  pillarSubtotal: number;
  total: number;
  deposit: number;
  balance: number;
  calculatedAt: string;
}

/** Centimeters are scaled to thousandths so sums and products stay in exact integers. */
const CM_SCALE = 1000;
const UNITS_PER_METER = 100 * CM_SCALE;

export function isSpaceType(value: unknown): value is SpaceType {
  return SPACE_TYPE_OPTIONS.some((o) => o.id === value);
}

export function spaceTypeLabel(id: string | undefined): string {
  return SPACE_TYPE_OPTIONS.find((o) => o.id === id)?.label || 'Sin tipo';
}

export function autoPillarsFor(spaceType: string | undefined): number {
  return SPACE_TYPE_OPTIONS.find((o) => o.id === spaceType)?.autoPillars || 0;
}

export function defaultSpaceTypeForSurface(surface: string): SpaceType {
  return surface.startsWith('balcon') ? 'balcon_abierto' : 'ventana';
}

export function parseWholeNumber(raw: unknown, min: number, max: number): number | null {
  const n = Number(String(raw ?? '').trim());
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

function linearUnits(space: Pick<SpaceInput, 'widthCm' | 'heightCm' | 'faces'>): number {
  const w = Math.round(space.widthCm * CM_SCALE);
  const h = Math.round(space.heightCm * CM_SCALE);
  return (w + h) * space.faces;
}

export function linearMetersFor(space: Pick<SpaceInput, 'widthCm' | 'heightCm' | 'faces'>): number {
  return linearUnits(space) / UNITS_PER_METER;
}

export function spaceMeshAmount(
  space: Pick<SpaceInput, 'widthCm' | 'heightCm' | 'faces'>,
  pricePerMeter: number
): number {
  return (linearUnits(space) * pricePerMeter) / UNITS_PER_METER;
}

export function spacePillarAmount(autoPillars: number, extraPillars: number, pillarPrice: number): number {
  return (autoPillars + extraPillars) * pillarPrice;
}

export function computeEstimate(
  spaces: SpaceInput[],
  meshId: string,
  config: PricingConfig
): QuoteEstimate | { error: string } {
  const mesh = config.meshes.find((m) => m.id === meshId);
  if (!mesh) return { error: 'Elige el grosor de la malla.' };
  if (!spaces.length) return { error: 'Agrega al menos un espacio con sus medidas.' };

  let totalUnits = 0;
  let autoPillars = 0;
  let extraPillars = 0;
  const detailed: SpaceEstimate[] = spaces.map((space) => {
    const units = linearUnits(space);
    const auto = autoPillarsFor(space.spaceType);
    totalUnits += units;
    autoPillars += auto;
    extraPillars += space.extraPillars;
    return {
      ...space,
      spaceTypeLabel: spaceTypeLabel(space.spaceType),
      linearMeters: units / UNITS_PER_METER,
      autoPillars: auto,
    };
  });

  const pricePerMeter = Number(mesh.amount);
  const pillarPrice = Number(config.pillar.amount);
  const depositPercent = Number(config.deposit.amount);

  const meshSubtotal = Math.round((totalUnits * pricePerMeter) / UNITS_PER_METER);
  const totalPillars = autoPillars + extraPillars;
  const pillarSubtotal = totalPillars * pillarPrice;
  const total = meshSubtotal + pillarSubtotal;
  const deposit = Math.round((total * depositPercent) / 100);

  return {
    mesh: { id: mesh.id, label: mesh.label, pricePerMeter },
    pillarPrice,
    depositPercent,
    spaces: detailed,
    totalLinearMeters: totalUnits / UNITS_PER_METER,
    meshSubtotal,
    autoPillars,
    extraPillars,
    totalPillars,
    pillarSubtotal,
    total,
    deposit,
    balance: total - deposit,
    calculatedAt: new Date().toISOString(),
  };
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(
    Math.round(amount)
  );
}

export function formatMeters(value: number): string {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value)} %`;
}

/** Frases para explicar al cliente cómo se llega al valor estimado. */
export function estimateNarrative(estimate: QuoteEstimate): string[] {
  const pillars =
    estimate.totalPillars === 0
      ? 'No se incluyen pilares en esta estimación.'
      : `Pilares: ${estimate.autoPillars} automático${estimate.autoPillars === 1 ? '' : 's'} + ${estimate.extraPillars} extra = ${estimate.totalPillars} × ${formatCLP(estimate.pillarPrice)} = ${formatCLP(estimate.pillarSubtotal)}.`;
  return [
    `Tus espacios suman ${formatMeters(estimate.totalLinearMeters)} metros lineales facturables. Se calculan como (ancho + alto) × caras; no son la superficie de la malla.`,
    `La ${estimate.mesh.label} vale ${formatCLP(estimate.mesh.pricePerMeter)} por metro lineal. Valor de la malla: ${formatMeters(estimate.totalLinearMeters)} ml × ${formatCLP(estimate.mesh.pricePerMeter)} = ${formatCLP(estimate.meshSubtotal)}.`,
    pillars,
    `Valor estimado para el cliente: ${formatCLP(estimate.meshSubtotal)} de malla + ${formatCLP(estimate.pillarSubtotal)} de pilares = ${formatCLP(estimate.total)}.`,
    `Abono inicial del ${formatPercent(estimate.depositPercent)}: ${formatCLP(estimate.deposit)}. Saldo al finalizar la instalación: ${formatCLP(estimate.balance)}.`,
  ];
}

export function rowsToPricingConfig(rows: PricingRate[]): PricingConfig | null {
  const meshes = rows.filter((r) => r.kind === 'mesh').sort((a, b) => a.sort - b.sort);
  const pillar = rows.find((r) => r.kind === 'pillar');
  const deposit = rows.find((r) => r.kind === 'deposit');
  if (!meshes.length || !pillar || !deposit) return null;
  return { meshes, pillar, deposit };
}
