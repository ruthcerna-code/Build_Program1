import type { MeshType, WindowItem } from '../types';
import type { SurfaceType } from '../constants/guidedQuote';
import {
  MAX_EXTRA_PILLARS,
  MAX_FACES,
  isSpaceType,
  parseWholeNumber,
  type SpaceType,
} from './quotePricing';

export type WindowMeasureDraft = {
  id: string;
  name: string;
  widthCm: string;
  heightCm: string;
  spaceType: SpaceType | '';
  faces: string;
  extraPillars: string;
};

export function emptyWindowDraft(spaceType: SpaceType | '' = ''): WindowMeasureDraft {
  return {
    id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    widthCm: '',
    heightCm: '',
    spaceType,
    faces: '1',
    extraPillars: '0',
  };
}

export function parsePositiveCm(raw: string | number | undefined): number | null {
  const n = Number(String(raw ?? '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Exact area; do not round until display. */
export function areaM2FromCm(widthCm: number, heightCm: number): number {
  return (widthCm / 100) * (heightCm / 100);
}

export function formatAreaM2(area: number): string {
  return (Math.round((area + 1e-10) * 100) / 100).toFixed(2);
}

export function isBalconySurface(surface: SurfaceType | ''): boolean {
  return surface === 'balcon_recto' || surface === 'balcon_l' || surface === 'balcon_u';
}

export function itemNoun(surface: SurfaceType | '', plural = false): string {
  if (isBalconySurface(surface)) return plural ? 'paños' : 'paño';
  return plural ? 'ventanas' : 'ventana';
}

export function itemTitle(surface: SurfaceType | '', index: number): string {
  const n = index + 1;
  return isBalconySurface(surface) ? `Paño ${n}` : `Ventana ${n}`;
}

export function windowHasData(win: WindowMeasureDraft): boolean {
  return Boolean(
    win.name.trim() || win.widthCm.trim() || win.heightCm.trim() || Number(win.extraPillars || 0) > 0
  );
}

export function toStoredWindow(
  draft: WindowMeasureDraft,
  order: number,
  fallbackName: string
): WindowItem | { error: string } {
  const widthCm = parsePositiveCm(draft.widthCm);
  const heightCm = parsePositiveCm(draft.heightCm);
  if (widthCm == null) {
    return { error: `${fallbackName}: ingresa un ancho mayor a cero.` };
  }
  if (heightCm == null) {
    return { error: `${fallbackName}: ingresa un alto mayor a cero.` };
  }
  if (!isSpaceType(draft.spaceType)) {
    return { error: `${fallbackName}: elige el tipo de espacio.` };
  }
  const faces = parseWholeNumber(draft.faces, 1, MAX_FACES);
  if (faces == null) {
    return { error: `${fallbackName}: las caras deben ser un número entero entre 1 y ${MAX_FACES}.` };
  }
  const extraPillars = parseWholeNumber(draft.extraPillars || '0', 0, MAX_EXTRA_PILLARS);
  if (extraPillars == null) {
    return { error: `${fallbackName}: los pilares extra deben ser un número entero entre 0 y ${MAX_EXTRA_PILLARS}.` };
  }
  const area = areaM2FromCm(widthCm, heightCm);
  const meshType: MeshType = 'monofilamento';
  return {
    id: draft.id || `win-${order}-${Date.now()}`,
    name: draft.name.trim() || fallbackName,
    width: widthCm / 100,
    height: heightCm / 100,
    unit: 'cm',
    meshType,
    area,
    order,
    widthCm,
    heightCm,
    spaceType: draft.spaceType,
    faces,
    extraPillars,
  };
}

function displayCm(storedCm: number | undefined, value: number, unit: WindowItem['unit']): number {
  if (typeof storedCm === 'number' && Number.isFinite(storedCm) && storedCm > 0) return storedCm;
  if (unit === 'cm' && value > 10) return value;
  return value * 100;
}

export function displayWidthCm(win: WindowItem): number {
  return displayCm(win.widthCm, win.width, win.unit);
}

export function displayHeightCm(win: WindowItem): number {
  return displayCm(win.heightCm, win.height, win.unit);
}

/** Draft rows that are complete enough to price; incomplete rows are left out of the live estimate. */
export function draftToSpaceInput(win: WindowMeasureDraft, label: string) {
  const widthCm = parsePositiveCm(win.widthCm);
  const heightCm = parsePositiveCm(win.heightCm);
  const faces = parseWholeNumber(win.faces, 1, MAX_FACES);
  const extraPillars = parseWholeNumber(win.extraPillars || '0', 0, MAX_EXTRA_PILLARS);
  if (widthCm == null || heightCm == null || faces == null || extraPillars == null || !isSpaceType(win.spaceType)) {
    return null;
  }
  return {
    label,
    location: win.name.trim(),
    spaceType: win.spaceType,
    widthCm,
    heightCm,
    faces,
    extraPillars,
  };
}
