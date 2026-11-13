import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { fetchPricingScreen, savePricingRates } from '../services/pricingApi';
import {
  CONTROL_EXAMPLE_SPACE,
  computeEstimate,
  formatCLP,
  rowsToPricingConfig,
  type PricingRate,
} from '../utils/quotePricing';
import { EmptyState, Notice, OpsPageHeader } from './ops/OpsUi';
import { EstimateBreakdown } from './QuoteEstimatePanel';

const UNIT_LABEL: Record<string, string> = {
  mesh: 'por metro lineal',
  pillar: 'por unidad',
  deposit: '% del total estimado',
};

function parseAmount(raw: string | undefined): number {
  return Number(String(raw ?? '').trim().replace(/\./g, '').replace(',', '.'));
}

export const PricingSettingsView: React.FC = () => {
  const [rates, setRates] = useState<PricingRate[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyRates = (list: PricingRate[]) => {
    setRates(list);
    setValues(Object.fromEntries(list.map((r) => [r.id, String(r.amount)])));
  };

  useEffect(() => {
    fetchPricingScreen()
      .then((data) => {
        applyRates(data.rates);
        setNotice(data.notice || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const draftRates = useMemo(
    () => rates.map((r) => ({ ...r, amount: Number.isFinite(parseAmount(values[r.id])) ? parseAmount(values[r.id]) : r.amount })),
    [rates, values]
  );
  const dirty = rates.some((r) => parseAmount(values[r.id]) !== r.amount);
  const invalid = rates.filter((r) => {
    const n = parseAmount(values[r.id]);
    if (!Number.isFinite(n) || n < 0) return true;
    if (r.kind === 'deposit') return n > 100;
    return !Number.isInteger(n) || n <= 0;
  });

  const example = useMemo(() => {
    const config = rowsToPricingConfig(draftRates);
    if (!config) return null;
    const meshId = config.meshes.find((m) => m.id === 'mesh_06')?.id || config.meshes[0].id;
    const result = computeEstimate([CONTROL_EXAMPLE_SPACE], meshId, config);
    return 'error' in result ? null : result;
  }, [draftRates]);

  const lastUpdate = rates
    .filter((r) => r.updatedAt)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await savePricingRates(rates.map((r) => ({ id: r.id, amount: parseAmount(values[r.id]) })));
      applyRates(result.rates);
      setMessage(result.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const groups: { title: string; kind: PricingRate['kind'] }[] = [
    { title: 'Mallas', kind: 'mesh' },
    { title: 'Pilares', kind: 'pillar' },
    { title: 'Forma de pago', kind: 'deposit' },
  ];

  return (
    <section className="pb-16 space-y-5">
      <OpsPageHeader
        eyebrow="Cotizador"
        title="Tarifas"
        description="Precios referenciales que usa el cotizador público. Cada solicitud guarda las tarifas vigentes al momento de enviarse; cambiar un valor aquí no modifica cotizaciones anteriores."
        actions={
          rates.length > 0 && (
            <>
              <button type="button" className="ops-btn" disabled={!dirty || saving} onClick={() => applyRates(rates)}>
                <RotateCcw className="h-4 w-4" />
                Descartar
              </button>
              <button
                type="button"
                className="ops-btn ops-btn-primary"
                disabled={!dirty || saving || invalid.length > 0}
                onClick={() => void save()}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando…' : 'Guardar tarifas'}
              </button>
            </>
          )
        }
      />

      {message && <Notice tone="success">{message}</Notice>}
      {notice && <Notice tone="info">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <p className="text-sm text-nydo-ink/60">Cargando tarifas…</p>
      ) : rates.length === 0 ? (
        <div className="ops-card">
          <EmptyState
            title="Las tarifas aún no están en la base de datos"
            description="Ejecuta en Supabase el archivo supabase/migrations/20261015220000_pricing_rates.sql y vuelve a abrir esta pantalla."
          />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-4">
            {groups.map((group) => {
              const list = rates.filter((r) => r.kind === group.kind);
              if (!list.length) return null;
              return (
                <div key={group.kind} className="ops-card overflow-hidden">
                  <h2 className="border-b border-nydo-ink/10 px-4 py-3 text-sm font-bold uppercase tracking-wide">
                    {group.title}
                  </h2>
                  <ul className="divide-y divide-nydo-ink/10">
                    {list.map((rate) => {
                      const bad = invalid.some((r) => r.id === rate.id);
                      const changed = parseAmount(values[rate.id]) !== rate.amount;
                      return (
                        <li key={rate.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                          <div>
                            <p className="font-bold">{rate.label}</p>
                            <p className="text-xs text-nydo-ink/60">
                              {UNIT_LABEL[rate.kind]}
                              {changed && (
                                <span className="ml-2 font-semibold text-nydo-orange">
                                  antes {rate.kind === 'deposit' ? `${rate.amount} %` : formatCLP(rate.amount)}
                                </span>
                              )}
                            </p>
                          </div>
                          <label className="relative block w-44">
                            <span className="sr-only">{rate.label}</span>
                            {rate.kind !== 'deposit' && (
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-nydo-ink/50">
                                $
                              </span>
                            )}
                            <input
                              inputMode={rate.kind === 'deposit' ? 'decimal' : 'numeric'}
                              value={values[rate.id] ?? ''}
                              onChange={(e) => setValues((prev) => ({ ...prev, [rate.id]: e.target.value }))}
                              aria-invalid={bad}
                              className={`ops-input text-right tabular-nums ${rate.kind !== 'deposit' ? '!pl-7' : '!pr-8'} ${
                                bad ? '!border-[#b4232a]' : ''
                              }`}
                            />
                            {rate.kind === 'deposit' && (
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold text-nydo-ink/50">
                                %
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            {invalid.length > 0 && (
              <Notice tone="error">
                Revisa: {invalid.map((r) => r.label).join(', ')}. Los precios van en pesos enteros mayores a cero y el
                abono entre 0 y 100 %.
              </Notice>
            )}
            {lastUpdate && (
              <p className="text-xs text-nydo-ink/60">
                Último cambio: {new Date(lastUpdate.updatedAt!).toLocaleString('es-CL')}
                {lastUpdate.updatedBy ? ` por ${lastUpdate.updatedBy}` : ''}
              </p>
            )}
          </div>

          <div className="ops-card p-4 space-y-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">Ejemplo de control</h2>
              <p className="text-xs text-nydo-ink/60">
                Balcón abierto con esquina de 5 m × 3 m, 2 caras, {rates.find((r) => r.kind === 'mesh')?.label}, sin
                pilares extra. Se actualiza mientras editas.
              </p>
            </div>
            {example ? <EstimateBreakdown estimate={example} title="Resultado" /> : <p className="text-sm">Sin datos.</p>}
          </div>
        </div>
      )}
    </section>
  );
};
