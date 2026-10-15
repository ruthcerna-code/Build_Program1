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
    <div className="overflow-x-auto rounded-xl border border-nydo-ink/10 bg-white">
      <table className={`w-full ${text} text-left`}>
        <thead className="bg-nydo-cream text-nydo-ink/70 uppercase tracking-wide">
          <tr>
            <th className="px-3 py-2 font-bold">{itemHeader}</th>
            <th className="px-3 py-2 font-bold">Ubicación</th>
            <th className="px-3 py-2 font-bold text-right">Ancho (cm)</th>
            <th className="px-3 py-2 font-bold text-right">Alto (cm)</th>
            <th className="px-3 py-2 font-bold text-right">Superficie (m²)</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row, index) => (
            <tr key={row.id || `${row.label}-${index}`} className="border-t border-nydo-ink/5">
              <td className="px-3 py-2 font-semibold text-nydo-ink">{row.label}</td>
              <td className="px-3 py-2 text-nydo-ink/70">{row.location || '—'}</td>
              <td className="px-3 py-2 text-right">{row.widthCm != null ? row.widthCm : '—'}</td>
              <td className="px-3 py-2 text-right">{row.heightCm != null ? row.heightCm : '—'}</td>
              <td className="px-3 py-2 text-right">{row.area != null ? formatAreaM2(row.area) : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-[#fbf6f1] border-t border-nydo-ink/10 font-bold tabular-nums">
          <tr>
            <td className="px-3 py-2" colSpan={2}>
              Total: {rows.length}
            </td>
            <td className="px-3 py-2" colSpan={2} />
            <td className="px-3 py-2 text-right">{formatAreaM2(totalArea)} m²</td>
          </tr>
        </tfoot>
      </table>
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
    <div className={compact ? 'space-y-2' : 'rounded-xl border border-nydo-ink/10 bg-[#fbf6f1] p-3 space-y-2'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={compact ? 'text-[11px] font-semibold text-nydo-ink' : 'text-sm font-semibold text-nydo-ink'}>
          {count} {balcony ? (count === 1 ? 'paño' : 'paños') : count === 1 ? 'ventana' : 'ventanas'} · {area} m²
        </p>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="ops-btn !min-h-8 !px-3 !text-xs"
        >
          {open ? 'Ocultar medidas' : 'Ver ventanas y medidas'}
        </button>
      </div>
      {open && (
        <WindowsMeasureTable rows={rows} itemHeader={balcony ? 'Paño' : 'Ventana'} compact={compact} />
      )}
    </div>
  );
};
