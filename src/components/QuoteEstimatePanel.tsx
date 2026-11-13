import React from 'react';
import {
  ESTIMATE_DISCLAIMER,
  LINEAR_RULE_NOTE,
  estimateNarrative,
  formatCLP,
  formatMeters,
  formatPercent,
  spaceMeshAmount,
  type PricingConfig,
  type QuoteEstimate,
} from '../utils/quotePricing';

const Row: React.FC<{ label: React.ReactNode; value: React.ReactNode; strong?: boolean; muted?: boolean }> = ({
  label,
  value,
  strong,
  muted,
}) => (
  <div className={`flex items-baseline justify-between gap-4 py-1.5 ${strong ? 'text-base font-bold' : 'text-sm'}`}>
    <dt className={muted ? 'text-nydo-ink/60' : ''}>{label}</dt>
    <dd className="tabular-nums text-right whitespace-nowrap">{value}</dd>
  </div>
);

function cm(value: number) {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value);
}

export const EstimateBreakdown: React.FC<{ estimate: QuoteEstimate; title?: string }> = ({
  estimate,
  title = 'Estimación referencial',
}) => (
  <div className="space-y-4">
    <EstimateStory estimate={estimate} />

    <div className="overflow-x-auto rounded-xl border border-nydo-ink/10 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="bg-nydo-cream uppercase tracking-wide text-nydo-ink/70">
          <tr>
            <th className="px-3 py-2 font-bold">Espacio</th>
            <th className="px-3 py-2 font-bold">Medidas</th>
            <th className="px-3 py-2 font-bold text-right">Caras</th>
            <th className="px-3 py-2 font-bold text-right">Metros lineales</th>
            <th className="px-3 py-2 font-bold text-right">Valor malla</th>
            <th className="px-3 py-2 font-bold text-right">Pilares</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {estimate.spaces.map((space, index) => (
            <tr key={`${space.label}-${index}`} className="border-t border-nydo-ink/5 align-top">
              <td className="px-3 py-2">
                <span className="block font-semibold">{space.label}</span>
                <span className="block text-nydo-ink/60">
                  {space.spaceTypeLabel}
                  {space.location ? ` · ${space.location}` : ''}
                </span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {cm(space.widthCm)} × {cm(space.heightCm)} cm
              </td>
              <td className="px-3 py-2 text-right">{space.faces}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                <span className="font-semibold">{formatMeters(space.linearMeters)} ml</span>
                <span className="block text-[11px] text-nydo-ink/55">
                  ({formatMeters(space.widthCm / 100)} + {formatMeters(space.heightCm / 100)}) × {space.faces}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-semibold whitespace-nowrap">
                {formatCLP(spaceMeshAmount(space, estimate.mesh.pricePerMeter))}
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                {space.autoPillars + space.extraPillars === 0 ? (
                  '—'
                ) : (
                  <>
                    {space.autoPillars > 0 && (
                      <span className="block">
                        {space.autoPillars} automático · {formatCLP(space.autoPillars * estimate.pillarPrice)}
                      </span>
                    )}
                    {space.extraPillars > 0 && (
                      <span className="block">
                        {space.extraPillars} {space.extraPillars === 1 ? 'extra' : 'extras'} ·{' '}
                        {formatCLP(space.extraPillars * estimate.pillarPrice)}
                      </span>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-nydo-ink/10 bg-[#fbf6f1] font-bold tabular-nums">
          <tr>
            <td className="px-3 py-2" colSpan={3}>
              Total
            </td>
            <td className="px-3 py-2 text-right">{formatMeters(estimate.totalLinearMeters)} ml</td>
            <td className="px-3 py-2 text-right">{formatCLP(estimate.meshSubtotal)}</td>
            <td className="px-3 py-2 text-right">{estimate.totalPillars}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <section className="rounded-xl border border-nydo-ink/10 bg-white p-4" aria-label={title}>
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">{title}</h3>
      <dl className="divide-y divide-nydo-ink/5">
        <Row label="Malla seleccionada" value={estimate.mesh.label} />
        <Row label="Tarifa de la malla" value={`${formatCLP(estimate.mesh.pricePerMeter)} por metro lineal`} muted />
        <Row
          label={`Subtotal de malla (${formatMeters(estimate.totalLinearMeters)} ml × ${formatCLP(estimate.mesh.pricePerMeter)})`}
          value={formatCLP(estimate.meshSubtotal)}
        />
        <Row
          label="Pilares automáticos y extras"
          value={`${estimate.autoPillars} automáticos + ${estimate.extraPillars} extras = ${estimate.totalPillars}`}
          muted
        />
        <Row label="Precio unitario del pilar" value={formatCLP(estimate.pillarPrice)} muted />
        <Row
          label={`Subtotal de pilares (${estimate.totalPillars} × ${formatCLP(estimate.pillarPrice)})`}
          value={formatCLP(estimate.pillarSubtotal)}
        />
      </dl>
      <dl className="mt-2 rounded-lg bg-nydo-ink px-4 py-3 text-nydo-cream">
        <Row label="Total estimado" value={formatCLP(estimate.total)} strong />
        <Row label={`Abono inicial (${formatPercent(estimate.depositPercent)})`} value={formatCLP(estimate.deposit)} />
        <Row label="Saldo al finalizar" value={formatCLP(estimate.balance)} />
      </dl>
      <p className="mt-3 text-xs text-nydo-ink/60">{ESTIMATE_DISCLAIMER}</p>
    </section>
  </div>
);

export const EstimateStory: React.FC<{ estimate: QuoteEstimate }> = ({ estimate }) => (
  <section className="rounded-xl border border-nydo-ink/10 bg-[#fbf6f1] p-4 text-sm" aria-label="Cómo se calcula el valor">
    <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">Cómo se calcula el valor para el cliente</h3>
    <ol className="list-decimal space-y-1.5 pl-5 text-nydo-ink/85">
      {estimateNarrative(estimate).map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ol>
  </section>
);

export const PricingExplainer: React.FC<{ config: PricingConfig }> = ({ config }) => (
  <div className="rounded-xl border border-nydo-ink/10 bg-white p-4 text-sm space-y-3">
    <h3 className="font-bold">Cómo armamos la cotización</h3>
    <ol className="list-decimal space-y-1.5 pl-5 text-nydo-ink/85">
      <li>
        Por cada espacio: <strong>metros lineales = (ancho + alto) × caras</strong>. Ejemplo: un balcón de 5 m × 3 m
        con 2 caras suma (5 + 3) × 2 = 16 metros lineales.
      </li>
      <li>Sumamos los metros lineales de todos los espacios.</li>
      <li>
        <strong>Valor de la malla</strong> = metros lineales totales × la tarifa del grosor que elijas.
      </li>
      <li>
        <strong>Pilares</strong>: una ventana en esquina o un balcón abierto con esquina incluye 1 pilar automático
        ({formatCLP(config.pillar.amount)}). Puedes sumar pilares extra al mismo precio. No se cobran dos veces.
      </li>
      <li>
        <strong>Valor estimado para el cliente</strong> = valor de la malla + valor de los pilares.
      </li>
      <li>
        <strong>Abono inicial</strong> = {formatPercent(config.deposit.amount)} de ese total. El saldo se paga al
        finalizar la instalación.
      </li>
    </ol>
    <div>
      <p className="mb-1 font-bold">Tarifas referenciales vigentes</p>
      <ul className="grid gap-1 sm:grid-cols-2">
        {config.meshes.map((mesh) => (
          <li key={mesh.id} className="flex justify-between gap-2 rounded-lg bg-[#fbf6f1] px-3 py-1.5">
            <span>{mesh.label}</span>
            <span className="font-semibold tabular-nums">{formatCLP(mesh.amount)} / ml</span>
          </li>
        ))}
        <li className="flex justify-between gap-2 rounded-lg bg-[#fbf6f1] px-3 py-1.5">
          <span>{config.pillar.label}</span>
          <span className="font-semibold tabular-nums">{formatCLP(config.pillar.amount)} c/u</span>
        </li>
      </ul>
    </div>
    <p className="text-xs text-nydo-ink/65">{LINEAR_RULE_NOTE}</p>
    <p className="text-xs text-nydo-ink/65">{ESTIMATE_DISCLAIMER}</p>
  </div>
);
