import React, { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { apiFetch } from '../services/sessionApi';
import {
  computeInstallationBudget,
  formatBudgetCLP,
  formatBudgetQty,
  formatConfigDate,
  pesos,
  type CostParameter,
  type MarginSetting,
} from '../utils/installationBudget';
import { Notice, OpsPageHeader } from './ops/OpsUi';

interface MarginChange {
  previous: number | null;
  next: number;
  updatedBy: string;
  updatedAt: string;
}

interface CommercialPayload {
  parameters: CostParameter[];
  margin: MarginSetting | null;
  history: MarginChange[];
  notice?: string;
}

const EXAMPLE = { openings: [{ name: 'Ejemplo', widthCm: 400, heightCm: 200 }], pillarCount: 1 };

export const CommercialSettingsView: React.FC = () => {
  const [parameters, setParameters] = useState<CostParameter[]>([]);
  const [costValues, setCostValues] = useState<Record<string, string>>({});
  const [margin, setMargin] = useState<MarginSetting | null>(null);
  const [marginInput, setMarginInput] = useState('');
  const [history, setHistory] = useState<MarginChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apply = (data: CommercialPayload) => {
    setParameters(data.parameters || []);
    setCostValues(Object.fromEntries((data.parameters || []).map((item) => [item.key, String(item.value)])));
    setMargin(data.margin);
    setMarginInput(data.margin ? String(data.margin.value) : '');
    setHistory(data.history || []);
    setNotice(data.notice || null);
  };

  useEffect(() => {
    apiFetch('/api/commercial')
      .then(apply)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const typedMargin = Number(String(marginInput).trim().replace(',', '.'));
  const example = useMemo(() => {
    if (!margin || !Number.isFinite(typedMargin)) return null;
    return computeInstallationBudget(EXAMPLE, parameters, { ...margin, value: typedMargin });
  }, [parameters, margin, typedMargin]);

  const saveMargin = async (confirmLow = false) => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await apiFetch('/api/commercial/margin', {
        method: 'PUT',
        body: JSON.stringify({ value: typedMargin, confirmLow }),
      });
      setMargin(result.margin);
      setMarginInput(String(result.margin.value));
      setHistory(result.history || []);
      setMessage(result.message);
    } catch (err: any) {
      if (err?.status === 409 || /bajo 20%/.test(err?.message || '')) {
        const confirmed = window.confirm(err.message);
        if (confirmed) {
          setSaving(false);
          await saveMargin(true);
          return;
        }
      }
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCosts = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await apiFetch('/api/commercial/costs', {
        method: 'PUT',
        body: JSON.stringify({
          parameters: parameters.map((item) => ({
            key: item.key,
            value: Number(String(costValues[item.key] ?? '').trim().replace(/\./g, '').replace(',', '.')),
          })),
        }),
      });
      setParameters(result.parameters);
      setCostValues(Object.fromEntries(result.parameters.map((item: CostParameter) => [item.key, String(item.value)])));
      setMessage(result.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="pb-16 space-y-5">
      <OpsPageHeader
        eyebrow="Cotizador"
        title="Parámetros comerciales"
        description="El margen se lee en cada cotización nueva. Las ya emitidas conservan el margen con que se calcularon."
      />
      {message && <Notice tone="success">{message}</Notice>}
      {notice && <Notice tone="info">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {loading ? (
        <p className="text-sm text-nydo-ink/60">Cargando parámetros…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="ops-card p-4 space-y-4">
            <label className="block">
              <span className="text-sm font-bold">Margen objetivo (%)</span>
              <input
                inputMode="decimal"
                value={marginInput}
                onChange={(event) => setMarginInput(event.target.value)}
                className="ops-input mt-2"
              />
            </label>
            <p className="text-sm text-nydo-ink/70">
              Porcentaje del precio de venta que queda como margen. Con 30%, un trabajo que cuesta $53.260 se cotiza en
              $76.086 netos.
            </p>
            {example?.available ? (
              <p className="rounded-xl bg-nydo-cream px-3 py-2 text-sm">
                Ejemplo 400 × 200 cm, 1 pilar: precio neto {formatBudgetCLP(pesos(example.netPrice))} · total cliente{' '}
                {formatBudgetCLP(example.clientTotal)}.
              </p>
            ) : (
              <p className="text-sm text-amber-900">Estimación referencial: no disponible (tarifas sin configurar).</p>
            )}
            <button type="button" className="ops-btn ops-btn-primary" disabled={saving} onClick={() => void saveMargin()}>
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-nydo-ink/60 mb-2">Últimos cambios</p>
              {history.length === 0 ? (
                <p className="text-sm text-nydo-ink/60">Todavía no hay cambios registrados.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {history.map((change) => (
                    <li key={`${change.updatedAt}-${change.next}`}>
                      {change.previous == null ? 'Inicio' : `${formatBudgetQty(change.previous)}%`} →{' '}
                      {formatBudgetQty(change.next)}% · {change.updatedBy} · {formatConfigDate(change.updatedAt)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="ops-card p-4 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide">Parámetros de costo</h2>
            <ul className="divide-y divide-nydo-ink/10">
              {parameters.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs text-nydo-ink/60">
                      {item.unit} · {item.status}
                    </p>
                  </div>
                  <input
                    inputMode="decimal"
                    value={costValues[item.key] ?? ''}
                    onChange={(event) => setCostValues((prev) => ({ ...prev, [item.key]: event.target.value }))}
                    className="ops-input w-32 text-right"
                  />
                </li>
              ))}
            </ul>
            <button type="button" className="ops-btn ops-btn-primary" disabled={saving || parameters.length === 0} onClick={() => void saveCosts()}>
              <Save className="h-4 w-4" />
              Guardar costos
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
