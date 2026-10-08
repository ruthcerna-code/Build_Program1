import {
  FINISH_OPTIONS,
  HEIGHT_OPTIONS,
  LENGTH_OPTIONS,
  SURFACE_OPTIONS,
  TIMELINE_OPTIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
  type FinishType,
  type HeightRange,
  type LengthRange,
  type SurfaceType,
  type TimelineType,
  type WorkType,
} from '../src/constants/guidedQuote';
import { getRegionByCode, isValidRegionCommune } from '../src/constants/chileRegions';
import type { GuidedQuoteDetails, QuoteRequest, WindowItem } from '../src/types';
import {
  formatAreaM2,
  itemTitle,
  toStoredWindow,
  type WindowMeasureDraft,
} from '../src/utils/windowMeasures';

const WORK = new Set(WORK_TYPE_OPTIONS.map((o) => o.id));
const SURFACE = new Set(SURFACE_OPTIONS.map((o) => o.id));
const LENGTH = new Set(LENGTH_OPTIONS.map((o) => o.id));
const HEIGHT = new Set(HEIGHT_OPTIONS.map((o) => o.id));
const FINISH = new Set(FINISH_OPTIONS.map((o) => o.id));
const TIMELINE = new Set(TIMELINE_OPTIONS.map((o) => o.id));

export type GuidedQuotePayload = {
  clientRequestId?: string;
  regionCode?: string;
  commune?: string;
  workType?: string;
  surfaceType?: string;
  lengthRange?: string;
  heightRange?: string;
  finishType?: string;
  finishColor?: string;
  timeline?: string;
  name?: string;
  email?: string;
  phone?: string;
  acceptedTerms?: boolean;
  commercialOptIn?: boolean;
  windows?: Array<{ id?: string; name?: string; widthCm?: string | number; heightCm?: string | number }>;
};

export function validateGuidedQuote(body: GuidedQuotePayload): string | null {
  const regionCode = String(body.regionCode || '');
  const commune = String(body.commune || '');
  if (!getRegionByCode(regionCode) || !isValidRegionCommune(regionCode, commune)) {
    return 'Selecciona una región y una comuna válidas.';
  }
  if (!WORK.has(body.workType as WorkType)) return 'Elige qué necesitas.';
  if (!SURFACE.has(body.surfaceType as SurfaceType)) return 'Elige el tipo de superficie.';
  if (!LENGTH.has(body.lengthRange as LengthRange)) return 'Elige la longitud.';
  if (!HEIGHT.has(body.heightRange as HeightRange)) return 'Elige la altura.';
  if (!FINISH.has(body.finishType as FinishType)) return 'Elige el tipo de acabado.';
  if (body.finishType === 'lacado_otros' && !String(body.finishColor || '').trim()) {
    return 'Indica el color que prefieres.';
  }
  if (!TIMELINE.has(body.timeline as TimelineType)) return 'Elige un plazo.';
  if (!String(body.name || '').trim()) return 'Ingresa tu nombre.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || '').trim())) return 'Ingresa un correo válido.';
  if (String(body.phone || '').replace(/\D/g, '').length < 8) return 'Ingresa un teléfono válido.';
  if (body.acceptedTerms !== true) return 'Debes aceptar la Política de Privacidad y los Términos de uso.';
  const windowsResult = parseGuidedWindows(body.windows, body.surfaceType as SurfaceType);
  if ('error' in windowsResult) return windowsResult.error;
  return null;
}

export function parseGuidedWindows(
  raw: GuidedQuotePayload['windows'],
  surface: SurfaceType | ''
): { error: string } | { windows: WindowItem[]; totalAreaM2: number } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: 'Agrega al menos una ventana o paño con sus medidas.' };
  }
  const windows: WindowItem[] = [];
  let total = 0;
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] || {};
    const draft: WindowMeasureDraft = {
      id: String(item.id || `win-${i + 1}`),
      name: String(item.name || ''),
      widthCm: String(item.widthCm ?? ''),
      heightCm: String(item.heightCm ?? ''),
    };
    const stored = toStoredWindow(draft, i + 1, itemTitle(surface, i));
    if ('error' in stored) return { error: stored.error };
    windows.push(stored);
    total += stored.area;
  }
  return { windows, totalAreaM2: total };
}

export function buildGuidedQuoteRecord(
  body: GuidedQuotePayload,
  ownerEmail: string,
  ownerName: string
): QuoteRequest {
  const region = getRegionByCode(String(body.regionCode))!;
  const finishType = body.finishType as FinishType;
  const finishColor = finishType === 'lacado_otros' ? String(body.finishColor || '').trim() : undefined;
  const guided: GuidedQuoteDetails = {
    regionCode: region.code,
    regionName: region.name,
    commune: String(body.commune),
    workType: body.workType as WorkType,
    surfaceType: body.surfaceType as SurfaceType,
    lengthRange: body.lengthRange as LengthRange,
    heightRange: body.heightRange as HeightRange,
    finishType,
    finishColor,
    timeline: body.timeline as TimelineType,
    acceptedTerms: true,
    commercialOptIn: !!body.commercialOptIn,
  };

  const parsedWindows = parseGuidedWindows(body.windows, guided.surfaceType);
  if ('error' in parsedWindows) {
    throw new Error(parsedWindows.error);
  }

  const windowLines = parsedWindows.windows.map((win, i) => {
    const label = itemTitle(guided.surfaceType, i);
    return `${label}${win.name && win.name !== label ? ` (${win.name})` : ''}: ${win.widthCm} cm × ${win.heightCm} cm = ${formatAreaM2(win.area)} m²`;
  });

  const summary = [
    'Solicitud guiada (sin precio; medidas por rangos). Las medidas por ventana son las ingresadas por el cliente.',
    `Región: ${guided.regionName}`,
    `Comuna: ${guided.commune}`,
    `Trabajo: ${labelOf(WORK_TYPE_OPTIONS, guided.workType)}`,
    `Superficie: ${labelOf(SURFACE_OPTIONS, guided.surfaceType)}`,
    `Longitud (rango): ${labelOf(LENGTH_OPTIONS, guided.lengthRange)}`,
    `Altura (rango): ${labelOf(HEIGHT_OPTIONS, guided.heightRange)}`,
    `Acabado: ${labelOf(FINISH_OPTIONS, guided.finishType)}${finishColor ? ` (${finishColor})` : ''}`,
    `Plazo (preferencia, no reserva): ${labelOf(TIMELINE_OPTIONS, guided.timeline)}`,
    `Comunicaciones comerciales: ${guided.commercialOptIn ? 'sí' : 'no'}`,
    `Cantidad: ${parsedWindows.windows.length}`,
    `Superficie total: ${formatAreaM2(parsedWindows.totalAreaM2)} m²`,
    ...windowLines,
  ].join('\n');

  const id = String(body.clientRequestId || '').trim() || `gq-${Date.now()}`;
  const year = new Date().getFullYear();
  const folio = `COT-${year}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  return {
    id,
    folio,
    createdAt: new Date().toISOString(),
    clientName: String(body.name).trim() || ownerName,
    clientEmail: String(body.email).trim().toLowerCase(),
    clientPhone: String(body.phone).trim(),
    clientAddress: guided.regionName,
    clientCity: guided.commune,
    propertyType: 'departamento',
    windows: parsedWindows.windows,
    totalAreaM2: parsedWindows.totalAreaM2,
    clientComments: summary,
    status: 'pendiente',
    ownerEmail: ownerEmail.toLowerCase(),
    quoteSource: 'guided',
    guidedQuote: guided,
  };
}

export function guidedQuoteToDbRow(quote: QuoteRequest) {
  return {
    id: quote.id,
    folio: quote.folio,
    created_at: quote.createdAt,
    client_name: quote.clientName,
    client_rut: quote.clientRut || '',
    client_email: quote.clientEmail.toLowerCase().trim(),
    client_phone: quote.clientPhone || '',
    client_address: quote.clientAddress || '',
    client_city: quote.clientCity || '',
    property_type: quote.propertyType,
    client_comments: quote.clientComments || '',
    total_area_m2: quote.totalAreaM2,
    status: quote.status,
    windows: quote.windows || [],
    owner_email: (quote.ownerEmail || quote.clientEmail || '').toLowerCase(),
    change_history: quote.changeHistory || [],
    quote_source: quote.quoteSource || 'guided',
    guided_quote: quote.guidedQuote || null,
  };
}
