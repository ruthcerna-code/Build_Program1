import React from 'react';
import type { QuoteRequest } from '../types';
import {
  ATTENTION_STATUSES,
  clientTotalLine,
  formatBudgetCLP,
  formatBudgetQty,
  formatConfigDate,
  marginCaption,
  pesos,
  realMarginPercent,
  type InstallationBudget,
} from '../utils/installationBudget';

function money(value: number) {
  return formatBudgetCLP(pesos(value));
}

const TotalRow: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex items-center justify-between gap-3 py-1.5 text-sm ${strong ? 'font-black' : ''}`}>
    <span>{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

export const InstallationBudgetDetail: React.FC<{ quote: QuoteRequest }> = ({ quote }) => {
  const budget = quote.guidedQuote?.installationBudget;
  const mail = quote.guidedQuote?.clientMail;
  const incident = quote.guidedQuote?.budgetIncident;
  if (!budget) return null;

  return (
    <section className="ops-card p-4 space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-nydo-ink">Desglose interno</h3>
      {!budget.available ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p className="font-bold">{clientTotalLine(budget)}</p>
          {incident && (
            <p className="mt-1">
              Incidente del {formatConfigDate(incident.at)}: {incident.message}
            </p>
          )}
        </div>
      ) : (
        <BudgetFigures budget={budget} />
      )}
      <p className="text-sm">
        Correo al cliente:{' '}
        {mail ? (
          <strong>
            {mail.status} · {mail.to} · {formatConfigDate(mail.sentAt)}
          </strong>
        ) : (
          'sin registro'
        )}
      </p>
    </section>
  );
};

const BudgetFigures: React.FC<{ budget: InstallationBudget }> = ({ budget }) => {
  const attention = budget.parameters.filter((item) =>
    ATTENTION_STATUSES.includes(item.status as (typeof ATTENTION_STATUSES)[number])
  );
  const real = realMarginPercent(budget.realMargin);
  return (
    <>
      <p className="text-sm font-semibold">{marginCaption(budget.margin)}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wide text-nydo-ink/60">
            <tr>
              <th className="py-2 pr-3">Ítem</th>
              <th className="py-2 pr-3">Cantidad</th>
              <th className="py-2 pr-3">Unidad</th>
              <th className="py-2 pr-3">Costo unitario</th>
              <th className="py-2 pr-3">Operación</th>
              <th className="py-2 text-right">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {budget.lines.map((line) => (
              <tr key={line.item} className="border-t border-nydo-ink/10">
                <td className="py-2 pr-3 font-semibold">{line.item}</td>
                <td className="py-2 pr-3 tabular-nums">{formatBudgetQty(line.quantity)}</td>
                <td className="py-2 pr-3">{line.unit}</td>
                <td className="py-2 pr-3 tabular-nums">{formatBudgetCLP(line.unitCost)}</td>
                <td className="py-2 pr-3">{line.operation}</td>
                <td className="py-2 text-right tabular-nums">{money(line.result)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="max-w-md">
        <TotalRow label="Subtotal" value={money(budget.subtotal)} />
        <TotalRow label="Reserva" value={money(budget.reserve)} />
        <TotalRow label="Costo total" value={money(budget.totalCost)} />
        <TotalRow label="Precio neto" value={money(budget.netPrice)} />
        <TotalRow label="IVA" value={money(budget.ivaAmount)} />
        <TotalRow label="Total calculado" value={money(budget.calculatedTotal)} />
        <TotalRow label="Redondeo aplicado" value={formatBudgetCLP(budget.roundedTotal)} />
        <TotalRow label="Mínimo aplicado" value={budget.minimumApplied ? 'sí' : 'no'} />
        <TotalRow label="Total cliente" value={formatBudgetCLP(budget.clientTotal)} strong />
        <TotalRow label="Margen" value={`${money(budget.marginPesos)} · ${formatBudgetQty(real)}%`} />
      </div>
      {real < budget.margin.value && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          El margen real quedó en {formatBudgetQty(real)}%, bajo el margen objetivo de {formatBudgetQty(budget.margin.value)}%.
        </p>
      )}
      {budget.minimumApplied && (
        <p className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-950">
          Se aplicó el mínimo por trabajo. Sin ese mínimo el total habría sido {formatBudgetCLP(budget.totalWithoutMinimum)}.
        </p>
      )}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-nydo-ink/60 mb-2">Parámetros usados</p>
        <ul className="space-y-1 text-sm">
          {budget.parameters.map((item) => {
            const warn = ATTENTION_STATUSES.includes(item.status as (typeof ATTENTION_STATUSES)[number]);
            return (
              <li key={item.key} className={warn ? 'font-bold text-amber-900' : ''}>
                {item.name}: {formatBudgetQty(item.value)} {item.unit} · {item.status}
                {warn ? ' · revisar' : ''} · {formatConfigDate(item.updatedAt)}
              </li>
            );
          })}
        </ul>
        {attention.length > 0 && (
          <p className="mt-2 text-sm font-semibold text-amber-900">
            Hay parámetros en estado {attention.map((item) => item.status).filter((status, index, list) => list.indexOf(status) === index).join(', ')}.
          </p>
        )}
      </div>
    </>
  );
};
