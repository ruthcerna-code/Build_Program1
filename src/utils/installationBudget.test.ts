import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  computeInstallationBudget,
  pesos,
  realMarginPercent,
  type CostParameter,
  type MarginSetting,
} from './installationBudget';

const updatedAt = '2026-11-12T15:00:00.000Z';

function parameter(
  key: string,
  name: string,
  value: number,
  unit: string,
  status: string
): CostParameter {
  return { key, name, value, unit, status, updatedAt };
}

function marketParameters(): CostParameter[] {
  return [
    parameter('malla_06', 'Malla 0,6 mm', 440, '$ por m²', 'Promedio mercado'),
    parameter('perdida_malla', 'Pérdida de malla', 20, '%', 'Supuesto'),
    parameter('fijaciones', 'Fijaciones (perfil, tornillos, tarugos, alambre)', 1125, '$ por metro de contorno', 'Estimado'),
    parameter('pilar', 'Pilar de aluminio', 5000, '$ por unidad', 'Por confirmar'),
    parameter('mano_obra', 'Mano de obra', 20000, '$ por trabajo', 'Por confirmar'),
    parameter('traslado', 'Traslado', 8000, '$ por trabajo', 'Por confirmar'),
    parameter('reserva', 'Reserva garantía y consumibles', 5, '% del subtotal', 'Supuesto'),
    parameter('minimo_trabajo', 'Mínimo por trabajo', 60000, '$ con IVA', 'Por definir'),
    parameter('iva', 'IVA', 19, '%', 'Fijo'),
    parameter('redondeo', 'Redondeo del total', 1000, '$ (hacia arriba)', 'Definido'),
  ];
}

function margin(value: number): MarginSetting {
  return {
    value,
    unit: '%',
    description: 'Porcentaje del precio de venta que queda como margen.',
    updatedBy: 'prueba',
    updatedAt,
  };
}

test('caso 1: balcón 400 × 200 cm, 1 pilar, margen 30%', () => {
  const result = computeInstallationBudget(
    { openings: [{ name: 'Balcón', widthCm: 400, heightCm: 200 }], pillarCount: 1 },
    marketParameters(),
    margin(30)
  );
  assert.equal(result.available, true);
  if (!result.available) return;
  assert.equal(result.totalAreaM2, 8);
  assert.equal(result.totalContourM, 12);
  assert.equal(pesos(result.lines[0].result), 4224);
  assert.equal(pesos(result.lines[1].result), 13500);
  assert.equal(pesos(result.lines[2].result), 5000);
  assert.equal(pesos(result.subtotal), 50724);
  assert.equal(pesos(result.reserve), 2536);
  assert.equal(pesos(result.totalCost), 53260);
  assert.equal(pesos(result.netPrice), 76086);
  assert.equal(pesos(result.ivaAmount), 14456);
  assert.equal(pesos(result.calculatedTotal), 90542);
  assert.equal(result.clientTotal, 91000);
  assert.equal(realMarginPercent(result.realMargin), 30.4);
});

test('caso 2: ventana 120 × 100 cm, 0 pilares, aplica el mínimo', () => {
  const result = computeInstallationBudget(
    { openings: [{ name: 'Ventana', widthCm: 120, heightCm: 100 }], pillarCount: 0 },
    marketParameters(),
    margin(30)
  );
  assert.equal(result.available, true);
  if (!result.available) return;
  assert.equal(result.totalAreaM2, 1.2);
  assert.equal(result.totalContourM, 4.4);
  assert.equal(pesos(result.lines[0].result), 634);
  assert.equal(pesos(result.lines[1].result), 4950);
  assert.equal(pesos(result.subtotal), 33584);
  assert.equal(pesos(result.reserve), 1679);
  assert.equal(pesos(result.totalCost), 35263);
  assert.equal(pesos(result.netPrice), 50375);
  assert.equal(pesos(result.ivaAmount), 9571);
  assert.equal(pesos(result.calculatedTotal), 59947);
  assert.equal(result.roundedTotal, 60000);
  assert.equal(result.minimumJob, 60000);
  assert.equal(result.clientTotal, 60000);
  assert.equal(result.minimumApplied, false);
  assert.equal(realMarginPercent(result.realMargin), 30.1);
});

test('caso 1 con margen 40% y de vuelta a 30%', () => {
  const request = { openings: [{ name: 'Balcón', widthCm: 400, heightCm: 200 }], pillarCount: 1 };
  const atForty = computeInstallationBudget(request, marketParameters(), margin(40));
  assert.equal(atForty.available, true);
  if (!atForty.available) return;
  assert.equal(pesos(atForty.totalCost), 53260);
  assert.equal(pesos(atForty.netPrice), 88767);
  assert.equal(pesos(atForty.ivaAmount), 16866);
  assert.equal(pesos(atForty.calculatedTotal), 105633);
  assert.equal(atForty.clientTotal, 106000);

  const atThirty = computeInstallationBudget(request, marketParameters(), margin(30));
  assert.equal(atThirty.available, true);
  if (!atThirty.available) return;
  assert.equal(atThirty.clientTotal, 91000);
  assert.equal(pesos(atThirty.netPrice), 76086);
});

test('sin margen configurado no calcula y no usa un 30% escondido', () => {
  const result = computeInstallationBudget(
    { openings: [{ name: 'Balcón', widthCm: 400, heightCm: 200 }], pillarCount: 1 },
    marketParameters(),
    null
  );
  assert.deepEqual(result, { available: false, reason: 'tarifas' });
});

test('rechaza una medida en cero', () => {
  const result = computeInstallationBudget(
    { openings: [{ name: 'Ventana', widthCm: 0, heightCm: 100 }], pillarCount: 0 },
    marketParameters(),
    margin(30)
  );
  assert.deepEqual(result, { available: false, reason: 'medidas' });
});
