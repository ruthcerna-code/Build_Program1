import React, { useState } from 'react';
import type { QuoteRequest, WindowItem } from '../types';
import {
  displayHeightCm,
  displayWidthCm,
  formatAreaM2,
  isBalconySurface,
  itemTitle,
} from '../utils/windowMeasures';

export type WindowMeasureRow = {
  id?: string;
  label: string;
  location: string;
  widthCm: number | null;
  heightCm: number | null;
  area: number | null;
};

export function rowsFromWindows(windows: WindowItem[], itemLabel: (index: number) => string): WindowMeasureRow[] {
  return windows.map((win, index) => ({
    id: win.id,
    label: itemLabel(index),
    location: win.name?.trim() && win.name !== itemLabel(index) ? win.name : win.name || '—',
    widthCm: displayWidthCm(win),
    heightCm: displayHeightCm(win),
    area: win.area,
  }));
}

interface WindowsMeasureTableProps {
  rows: WindowMeasureRow[];
  itemHeader?: string;
  compact?: boolean;
}

export const WindowsMeasureTable: React.FC<WindowsMeasureTableProps> = ({
  rows,
  itemHeader = 'Ventana o paño',
  compact = false,
}) => {
  const totalArea = rows.reduce((sum, row) => sum + (row.area || 0), 0);
  const text = compact ? 'text-[11px]' : 'text-xs';

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className={`w-full ${text} text-left`}>
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 font-bold">{itemHeader}</th>
            <th className="px-3 py-2 font-bold">Ubicación</th>
            <th className="px-3 py-2 font-bold">Ancho (cm)</th>
            <th className="px-3 py-2 font-bold">Alto (cm)</th>
            <th className="px-3 py-2 font-bold">Superficie (m²)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || `${row.label}-${index}`} className="border-t border-slate-100">
              <td className="px-3 py-2 font-semibold text-slate-800">{row.label}</td>
              <td className="px-3 py-2 text-slate-600">{row.location || '—'}</td>
              <td className="px-3 py-2 text-slate-700">{row.widthCm != null ? row.widthCm : '—'}</td>
              <td className="px-3 py-2 text-slate-700">{row.heightCm != null ? row.heightCm : '—'}</td>
              <td className="px-3 py-2 text-slate-700">{row.area != null ? formatAreaM2(row.area) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`${text} px-3 py-2 bg-slate-50 border-t border-slate-200 text-slate-700 space-y-0.5`}>
        <p>
          <strong>Cantidad total:</strong> {rows.length}
        </p>
        <p>
          <strong>Superficie total:</strong> {formatAreaM2(totalArea)} m²
        </p>
      </div>
    </div>
  );
};

export const QuoteWindowsPanel: React.FC<{ quote: QuoteRequest; compact?: boolean }> = ({
  quote,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const balcony = isBalconySurface(quote.guidedQuote?.surfaceType || '');
  const rows = rowsFromWindows(quote.windows || [], (index) =>
    itemTitle(quote.guidedQuote?.surfaceType || '', index)
  );
  const count = quote.windows?.length || 0;
  const area = formatAreaM2(quote.totalAreaM2 || 0);

  if (count === 0) return null;

  return (
    <div className={compact ? 'space-y-2' : 'rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={compact ? 'text-[11px] font-semibold text-slate-800' : 'text-sm font-semibold text-slate-800'}>
          {count} {balcony ? (count === 1 ? 'paño' : 'paños') : count === 1 ? 'ventana' : 'ventanas'} · {area} m²
        </p>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-sky-700 hover:text-sky-900 font-bold text-[11px] cursor-pointer"
        >
          {open ? 'Ocultar medidas' : '+ Ver ventanas y medidas'}
        </button>
      </div>
      {open && (
        <WindowsMeasureTable rows={rows} itemHeader={balcony ? 'Paño' : 'Ventana'} compact={compact} />
      )}
    </div>
  );
};
