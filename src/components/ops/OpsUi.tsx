import React from 'react';
import { PAYMENT_STATUS_LABELS, quoteStatusLabel } from '../../constants/quoteStatus';

const STATUS_TONE: Record<string, string> = {
  pendiente: 'bg-[#fdf1d2] text-[#7a5600] border-[#edbe49]',
  en_revision: 'bg-[#e3f1ff] text-[#0b4f8a] border-[#7ec1ff]',
  cotizada: 'bg-[#ffe6f4] text-[#9c1468] border-[#fb63be]',
  aceptada: 'bg-[#e3f6ea] text-[#1c6b3a] border-[#7fcf9c]',
  rechazada: 'bg-[#f1ece7] text-[#55504b] border-[#c9bfb6]',
  cancelada: 'bg-[#f1ece7] text-[#55504b] border-[#c9bfb6]',
};

const PAYMENT_TONE: Record<string, string> = {
  pendiente: 'bg-[#f1ece7] text-[#55504b] border-[#c9bfb6]',
  abono_parcial: 'bg-[#fdf1d2] text-[#7a5600] border-[#edbe49]',
  pagado_total: 'bg-[#e3f6ea] text-[#1c6b3a] border-[#7fcf9c]',
};

export const StatusBadge: React.FC<{ status?: string }> = ({ status }) => (
  <span className={`ops-badge ${STATUS_TONE[status || 'pendiente'] || STATUS_TONE.pendiente}`}>
    {quoteStatusLabel(status)}
  </span>
);

export const PaymentBadge: React.FC<{ status?: keyof typeof PAYMENT_STATUS_LABELS }> = ({ status }) => {
  const key = status || 'pendiente';
  return <span className={`ops-badge ${PAYMENT_TONE[key]}`}>{PAYMENT_STATUS_LABELS[key]}</span>;
};

interface OpsPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export const OpsPageHeader: React.FC<OpsPageHeaderProps> = ({ eyebrow, title, description, actions }) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="ops-label mb-1">{eyebrow}</p>}
      <h1 className="nydo-display text-4xl sm:text-5xl uppercase text-nydo-ink">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-nydo-ink/70">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

type KpiTone = 'ink' | 'orange' | 'blue' | 'yellow' | 'pink' | 'plain';

const KPI_ACCENT: Record<KpiTone, string> = {
  ink: 'bg-nydo-ink',
  orange: 'bg-nydo-orange',
  blue: 'bg-nydo-blue',
  yellow: 'bg-nydo-yellow',
  pink: 'bg-nydo-pink',
  plain: 'bg-nydo-ink/20',
};

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: KpiTone;
  active?: boolean;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, tone = 'plain', active, onClick }) => {
  const content = (
    <>
      <span className={`absolute left-0 top-0 h-full w-1.5 rounded-l-[14px] ${KPI_ACCENT[tone]}`} aria-hidden="true" />
      <span className="ops-label">{label}</span>
      <span className="mt-1 block text-2xl font-bold tabular-nums text-nydo-ink">{value}</span>
      {hint && <span className="mt-0.5 block text-xs text-nydo-ink/60">{hint}</span>}
    </>
  );
  const base = `ops-card relative block w-full overflow-hidden pl-5 pr-4 py-3 text-left ${
    active ? 'ring-2 ring-nydo-ink' : ''
  }`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={`${base} cursor-pointer hover:border-nydo-ink/40`}>
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
};

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="px-6 py-14 text-center">
    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-nydo-cream text-xl" aria-hidden="true">
      ✳
    </div>
    <p className="font-bold text-nydo-ink">{title}</p>
    {description && <p className="mt-1 text-sm text-nydo-ink/60">{description}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export const Notice: React.FC<{ tone: 'success' | 'error' | 'info'; children: React.ReactNode }> = ({ tone, children }) => {
  const styles = {
    success: 'bg-[#e3f6ea] border-[#7fcf9c] text-[#1c6b3a]',
    error: 'bg-[#fdecec] border-[#e9a3a6] text-[#9f1d24]',
    info: 'bg-[#e3f1ff] border-[#7ec1ff] text-[#0b4f8a]',
  }[tone];
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${styles}`}>
      {children}
    </p>
  );
};
