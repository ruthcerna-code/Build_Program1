import React, { useState } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
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

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
      <p className="text-sm text-amber-950">
        Consulta los últimos registros guardados y actualiza la información de esta pantalla.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={run}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Consultando…' : 'Sincronizar datos'}
        </button>
        {report && (
          <button
            type="button"
            onClick={() => setOpenReport(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ver detalle
          </button>
        )}
      </div>
      {lastOk && (
        <p className="text-xs text-amber-900">
          Última sincronización: {new Date(lastOk).toLocaleString('es-CL')}
        </p>
      )}
      {message && <p className="text-sm font-bold text-emerald-800">{message}</p>}
      {error && <p className="text-sm font-bold text-rose-800">{error}</p>}

      {openReport && report && (
        <DetailModal title="Resultado de la revisión" onClose={() => setOpenReport(false)}>
          <p>Registros consultados: {report.consulted}</p>
          <p>Visibles ahora: {report.visible}</p>
          <p>{report.review}</p>
          {(report.issues || []).length === 0 ? (
            <p>No hay inconsistencias evidentes.</p>
          ) : (
            <ul className="list-disc pl-5">
              {report.issues.map((issue: any, idx: number) => (
                <li key={idx}>
                  {issue.folio}: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </DetailModal>
      )}
    </div>
  );
};
