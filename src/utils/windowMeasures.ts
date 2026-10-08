import type { MeshType, WindowItem } from '../types';
import type { SurfaceType } from '../constants/guidedQuote';

export type WindowMeasureDraft = {
  id: string;
  name: string;
  widthCm: string;
  heightCm: string;
};

export function emptyWindowDraft(): WindowMeasureDraft {
  return {
    id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    widthCm: '',
    heightCm: '',
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
  return Boolean(win.name.trim() || win.widthCm.trim() || win.heightCm.trim());
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
