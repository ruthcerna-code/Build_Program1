import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CONTROL_EXAMPLE_SPACE,
  autoPillarsFor,
  computeEstimate,
  type PricingConfig,
} from './quotePricing';

const config: PricingConfig = {
  meshes: [
    { id: 'mesh_06', kind: 'mesh', label: 'Malla de 0,6 mm', unit: 'metro lineal', amount: 6500, sort: 1 },
    { id: 'mesh_07', kind: 'mesh', label: 'Malla de 0,7 mm', unit: 'metro lineal', amount: 7200, sort: 2 },
    { id: 'mesh_08', kind: 'mesh', label: 'Malla de 0,8 mm', unit: 'metro lineal', amount: 7500, sort: 3 },
    { id: 'mesh_09', kind: 'mesh', label: 'Malla de 0,9 mm', unit: 'metro lineal', amount: 8800, sort: 4 },
  ],
  pillar: { id: 'pillar', kind: 'pillar', label: 'Pilar adicional', unit: 'unidad', amount: 12000, sort: 10 },
  deposit: { id: 'deposit', kind: 'deposit', label: 'Abono inicial', unit: 'porcentaje', amount: 30, sort: 20 },
};

test('balcón abierto con esquina: 16 ml, 1 pilar automático, $116.000', () => {
  const result = computeEstimate([CONTROL_EXAMPLE_SPACE], 'mesh_06', config);
  assert.ok(!('error' in result));
  assert.equal(result.totalLinearMeters, 16);
  assert.equal(result.meshSubtotal, 104000);
  assert.equal(result.autoPillars, 1);
  assert.equal(result.extraPillars, 0);
  assert.equal(result.pillarSubtotal, 12000);
  assert.equal(result.total, 116000);
  assert.equal(result.deposit, 34800);
  assert.equal(result.balance, 81200);
});

test('al quitar la esquina se elimina el pilar automático', () => {
  const result = computeEstimate(
    [{ ...CONTROL_EXAMPLE_SPACE, spaceType: 'balcon_abierto' }],
    'mesh_06',
    config
  );
  assert.ok(!('error' in result));
  assert.equal(autoPillarsFor('balcon_abierto'), 0);
  assert.equal(result.autoPillars, 0);
  assert.equal(result.pillarSubtotal, 0);
  assert.equal(result.total, 104000);
  assert.equal(result.deposit, 31200);
  assert.equal(result.balance, 72800);
});

test('dos ventanas en esquina generan dos pilares automáticos', () => {
  const corner = {
    label: 'Ventana',
    location: '',
    spaceType: 'ventana_esquina' as const,
    widthCm: 120,
    heightCm: 150,
    faces: 1,
    extraPillars: 0,
  };
  const result = computeEstimate([corner, { ...corner, label: 'Ventana 2' }], 'mesh_06', config);
  assert.ok(!('error' in result));
  assert.equal(result.autoPillars, 2);
  assert.equal(result.extraPillars, 0);
  assert.equal(result.pillarSubtotal, 24000);
});

test('los pilares extra no se mezclan con los automáticos', () => {
  const result = computeEstimate(
    [{ ...CONTROL_EXAMPLE_SPACE, extraPillars: 2 }],
    'mesh_06',
    config
  );
  assert.ok(!('error' in result));
  assert.equal(result.autoPillars, 1);
  assert.equal(result.extraPillars, 2);
  assert.equal(result.totalPillars, 3);
  assert.equal(result.pillarSubtotal, 36000);
  assert.equal(result.total, 140000);
});
