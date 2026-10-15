import React, { useState } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { apiFetch } from '../services/sessionApi';
import { DetailModal } from './DetailModal';

interface AdminSyncBarProps {
  dirty?: boolean;
  onApplyQuotes: (quotes: any[]) => void;
}

export const AdminSyncBar: React.FC<AdminSyncBarProps> = ({ dirty, onApplyQuotes }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastOk, setLastOk] = useState<string | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [openReport, setOpenReport] = useState(false);

  const run = async () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. Si continúas, se mostrarán los datos de la base. ¿Seguir?')) {
      return;
    }
    if (loading) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch('/api/sync', { method: 'POST', body: JSON.stringify({}) });
      onApplyQuotes(data.quotes || []);
      setLastOk(data.syncedAt);
      setMessage(data.message || 'Datos actualizados');
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'No pudimos actualizar los datos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const stateDot = error ? 'bg-[#d23a3f]' : lastOk ? 'bg-[#2fa35b]' : 'bg-nydo-yellow';

  return (
    <div className="ops-card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${stateDot}`} aria-hidden="true" />
        <div className="min-w-0 text-sm" aria-live="polite">
          <p className="font-bold">
            {lastOk ? `Última sincronización: ${new Date(lastOk).toLocaleString('es-CL')}` : 'Datos de la base'}
          </p>
          {error ? (
            <p className="font-semibold text-[#9f1d24]">{error}</p>
          ) : message ? (
            <p className="text-nydo-ink/70">{message}</p>
          ) : (
            <p className="text-nydo-ink/60">Consulta los últimos registros guardados y actualiza esta pantalla.</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {report && (
          <button type="button" onClick={() => setOpenReport(true)} className="ops-btn">
            <FileText className="h-4 w-4" />
            Ver resultado
          </button>
        )}
        <button type="button" disabled={loading} onClick={run} className="ops-btn ops-btn-dark">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Consultando…' : 'Sincronizar datos'}
        </button>
      </div>

      {openReport && report && (
        <DetailModal title="Resultado de la revisión" onClose={() => setOpenReport(false)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="ops-card px-4 py-3">
              <p className="ops-label">Registros consultados</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{report.consulted}</p>
            </div>
            <div className="ops-card px-4 py-3">
              <p className="ops-label">Visibles ahora</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{report.visible}</p>
            </div>
          </div>
          {report.review && <p>{report.review}</p>}
          {(report.issues || []).length === 0 ? (
            <p className="font-semibold text-[#1c6b3a]">No hay inconsistencias evidentes.</p>
          ) : (
            <ul className="ops-card divide-y divide-nydo-ink/10">
              {report.issues.map((issue: any, idx: number) => (
                <li key={idx} className="px-4 py-2.5">
                  <span className="font-mono font-semibold">{issue.folio}</span>
                  <span className="text-nydo-ink/70"> · {issue.message}</span>
                </li>
              ))}
            </ul>
          )}
        </DetailModal>
      )}
    </div>
  );
};
