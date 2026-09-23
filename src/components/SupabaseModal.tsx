import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Key,
  Globe,
  Server,
  X,
  ShieldCheck,
  ArrowUpRight,
  UploadCloud,
  DownloadCloud,
  Flame,
  Cloud,
  Layers,
  FileJson,
  Eye,
  FolderTree
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseCustomConfig,
  testSupabaseConnection,
  syncAllLocalQuotesToSupabase,
} from '../services/supabaseClient';
import {
  isFirebaseConfigured,
  getFirebaseProjectInfo,
  testFirestoreConnection,
  syncAllLocalQuotesToFirestore,
  fetchQuotesFromFirestore,
} from '../services/firebaseClient';
import {
  syncWithSupabaseDatabase,
  syncWithFirestoreDatabase,
  getStoredQuotes,
} from '../services/quoteStorage';
import { UserAccount } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onQuotesSynced?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onQuotesSynced,
}) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'datamodel' | 'supabase'>('firebase');
  const [supabaseCfg, setSupabaseCfg] = useState(getSupabaseConfig());
  const [urlInput, setUrlInput] = useState(supabaseCfg.url || '');
  const [keyInput, setKeyInput] = useState(supabaseCfg.anonKey || '');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const firebaseInfo = getFirebaseProjectInfo();
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (isOpen) {
      const current = getSupabaseConfig();
      setSupabaseCfg(current);
      setUrlInput(current.url || '');
      setKeyInput(current.anonKey || '');
      setTestResult(null);
      setSyncFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // FIREBASE ACTIONS
  const handleTestFirebase = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testFirestoreConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error al conectar con Firebase.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAllToFirebase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const allQuotes = getStoredQuotes();
      const res = await syncAllLocalQuotesToFirestore(allQuotes);
      if (res.success) {
        setSyncFeedback(`✅ ¡Éxito! Se subieron ${res.synced} cotizaciones/pedidos a Google Firebase Firestore.`);
        if (onQuotesSynced) onQuotesSynced();
      } else {
        setSyncFeedback(`❌ Error al subir datos: ${res.error}`);
      }
    } catch (err: any) {
      setSyncFeedback(`❌ Error: ${err?.message || 'Error de red'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromFirebase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncWithFirestoreDatabase(
        currentUser?.role === 'cliente' ? currentUser.email : undefined
      );
      if (res.success) {
        setSyncFeedback(`✅ ¡Sincronizado! Se descargaron ${res.count} registros desde Google Firebase.`);
        if (onQuotesSynced) onQuotesSynced();
      } else {
        setSyncFeedback(`❌ ${res.message}`);
      }
    } catch (err: any) {
      setSyncFeedback(`❌ Error: ${err?.message || 'Error de red'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // SUPABASE ACTIONS
  const handleSaveSupabaseConfig = () => {
    saveSupabaseCustomConfig(urlInput, keyInput);
    const updated = getSupabaseConfig();
    setSupabaseCfg(updated);
    setTestResult(null);
    setSyncFeedback('Configuración de Supabase guardada exitosamente.');
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleClearSupabaseConfig = () => {
    saveSupabaseCustomConfig('', '');
    const updated = getSupabaseConfig();
    setSupabaseCfg(updated);
    setUrlInput('');
    setKeyInput('');
    setTestResult(null);
    setSyncFeedback('Configuración restablecida.');
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  const handleTestSupabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error inesperado al conectar.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAllToSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const allQuotes = getStoredQuotes();
      const res = await syncAllLocalQuotesToSupabase(allQuotes);
      if (res.success) {
        setSyncFeedback(`✅ ¡Éxito! Se subieron ${res.synced} cotizaciones/pedidos a Supabase.`);
        if (onQuotesSynced) onQuotesSynced();
      } else {
        setSyncFeedback(`❌ Error al subir datos: ${res.error}`);
      }
    } catch (err: any) {
      setSyncFeedback(`❌ Error: ${err?.message || 'Fallo de red al sincronizar'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncWithSupabaseDatabase(
        currentUser?.role === 'cliente' ? currentUser.email : undefined
      );
      if (res.success) {
        setSyncFeedback(`✅ ¡Sincronización completada! Se descargaron ${res.count} registros.`);
        if (onQuotesSynced) onQuotesSynced();
      } else {
        setSyncFeedback(`❌ ${res.message}`);
      }
    } catch (err: any) {
      setSyncFeedback(`❌ Error: ${err?.message || 'Fallo de red'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const sqlCode = `-- TABLA PRINCIPAL DE COTIZACIONES Y ÓRDENES DE TRABAJO
create table if not exists public.quotes (
  id text primary key,
  folio text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  client_address text,
  client_city text,
  property_type text,
  client_comments text,
  tentative_date1 text,
  tentative_time1 text,
  tentative_date2 text,
  tentative_time2 text,
  total_area_m2 numeric default 0,
  status text not null default 'pendiente',
  accepted_at timestamp with time zone,
  windows jsonb default '[]'::jsonb,
  admin_quote jsonb,
  installer_assignment jsonb,
  technician_execution jsonb
);

-- ÍNDICE PARA BÚSQUEDA RÁPIDA POR CORREO (ruth.cerna@gmail.com)
create index if not exists idx_quotes_client_email on public.quotes(client_email);

-- HABILITAR ROW LEVEL SECURITY (RLS)
alter table public.quotes enable row level security;

-- POLÍTICA PERMISIVA PARA PRUEBAS CON ANON KEY
drop policy if exists "Permitir acceso publico" on public.quotes;
create policy "Permitir acceso publico" on public.quotes
  for all using (true) with check (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Base de Datos en la Nube</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {firebaseReady ? 'Firebase Activo' : 'Nube'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Almacenamiento persistente y sincronización en tiempo real para cotizaciones y pedidos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('firebase');
              setTestResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'firebase'
                ? 'bg-white border-slate-200 text-amber-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Google Firebase</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('datamodel');
              setTestResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'datamodel'
                ? 'bg-white border-slate-200 text-sky-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4 text-sky-600" />
            <span>Modelo de Datos (Schema)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-sky-100 text-sky-800 font-bold">
              Firestore
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('supabase');
              setTestResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-t-xl border-t border-x transition-all ${
              activeTab === 'supabase'
                ? 'bg-white border-slate-200 text-emerald-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>Supabase (PostgreSQL)</span>
            {supabaseCfg.isConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300" />
            )}
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* USER ACCOUNT BADGE */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                @
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Cuenta vinculada a las cotizaciones</p>
                <p className="font-bold text-slate-900">{currentUser?.email || 'ruth.cerna@gmail.com'}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Sincronización en la Nube
            </span>
          </div>

          {/* TAB 1: FIREBASE (GOOGLE CLOUD) */}
          {activeTab === 'firebase' && (
            <div className="space-y-5">
              {/* Status Card */}
              <div className="p-4 rounded-2xl border bg-emerald-50/70 border-emerald-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900">
                          Google Firebase Firestore Conectado
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Aprovisionado en 1 Clic
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Proyecto: <strong className="font-mono text-slate-800">{firebaseInfo.projectId}</strong>.
                        Tus cotizaciones, pedidos y ejecuciones técnicas se guardan automáticamente en la nube de Google.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestFirebase}
                    disabled={isTesting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Probando...' : 'Probar Conexión'}</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 border ${
                      testResult.success
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.success ? 'Conexión Exitosa' : 'Fallo'}</p>
                      <p className="text-[11px] mt-0.5">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sincronización Inmediata */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-slate-900">Sincronización de Cotizaciones y Pedidos</h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                    Automática
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Cualquier cambio (nuevo presupuesto, cambio de precio por el administrador, confirmación de cliente o fotos del técnico) se sincroniza en vivo. También puedes sincronizar manualmente ahora:
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePushAllToFirebase}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>Subir datos actuales a Google Firebase</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullFromFirebase}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <DownloadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>Descargar últimas órdenes de Firebase</span>
                  </button>
                </div>

                {syncFeedback && (
                  <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-[11px] font-medium text-slate-800 mt-2">
                    {syncFeedback}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: DATA MODEL (FIRESTORE SCHEMA & DOCUMENT INSPECTOR) */}
          {activeTab === 'datamodel' && (
            <div className="space-y-5">
              {/* How to access in Firebase Console Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Flame className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Ver Base de Datos en la Consola Oficial de Firebase</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Proyecto: <strong className="text-slate-800">{firebaseInfo.projectId}</strong> • Base de datos: <span className="font-mono text-sky-800 text-[10px]">ai-studio-mallassegurascot...</span>
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://console.firebase.google.com/project/${firebaseInfo.projectId}/firestore/databases/${firebaseInfo.databaseId}/data`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                  >
                    <span>Abrir en Firebase Console</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="mt-3 pt-3 border-t border-sky-200/70 text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Pasos para navegar en la consola de Firebase:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-700 pl-1">
                    <li>Inicia sesión con tu cuenta de Google (<strong className="text-sky-700">ruth.cerna@gmail.com</strong>).</li>
                    <li>En el menú izquierdo, haz clic en <strong>Build &gt; Firestore Database</strong>.</li>
                    <li>En el selector superior de base de datos, confirma que esté seleccionada <strong className="text-slate-900">{firebaseInfo.databaseId}</strong>.</li>
                    <li>Haz clic en la colección <strong className="font-mono text-amber-800 bg-amber-100 px-1 rounded">quotes</strong> para ver todos los documentos y editar sus campos.</li>
                  </ol>
                </div>
              </div>

              {/* Data Model Visual Diagram */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-slate-900 text-xs">Esquema de Colecciones (Firestore Schema)</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Document-oriented NoSQL</span>
                </div>

                {/* Collection: quotes */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-amber-400" />
                      <span className="font-mono font-bold text-amber-400">/quotes</span>
                      <span className="text-slate-400 text-[11px] font-sans">
                        &#123;quoteId&#125; (Colección Principal)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      En producción
                    </span>
                  </div>

                  <div className="p-4 space-y-3 divide-y divide-slate-100 text-[11px]">
                    {/* Identification */}
                    <div className="space-y-1.5 pt-1">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block text-sky-700">
                        1. Identificación y Estado
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                        <div><code className="text-slate-900 font-bold">id:</code> <span className="text-slate-500">string (UUID único)</span></div>
                        <div><code className="text-slate-900 font-bold">folio:</code> <span className="text-slate-500">string (COT-2026-XXXX)</span></div>
                        <div><code className="text-slate-900 font-bold">createdAt:</code> <span className="text-slate-500">string ISO 8601</span></div>
                        <div><code className="text-slate-900 font-bold">status:</code> <span className="text-amber-700 font-semibold">'pendiente' | 'cotizada' | 'aceptada' | 'rechazada'</span></div>
                        <div><code className="text-slate-900 font-bold">acceptedAt:</code> <span className="text-slate-500">string ISO (opcional)</span></div>
                      </div>
                    </div>

                    {/* Client info */}
                    <div className="space-y-1.5 pt-2.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block text-sky-700">
                        2. Datos del Cliente & Contacto
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                        <div><code className="text-slate-900 font-bold">clientName:</code> <span className="text-slate-500">string</span></div>
                        <div><code className="text-slate-900 font-bold">clientEmail:</code> <span className="text-sky-700 font-semibold">string (con índice)</span></div>
                        <div><code className="text-slate-900 font-bold">clientPhone:</code> <span className="text-slate-500">string</span></div>
                        <div><code className="text-slate-900 font-bold">clientAddress:</code> <span className="text-slate-500">string</span></div>
                        <div><code className="text-slate-900 font-bold">clientCity:</code> <span className="text-slate-500">string</span></div>
                        <div><code className="text-slate-900 font-bold">propertyType:</code> <span className="text-slate-500">string ('departamento' | 'casa' | ...)</span></div>
                        <div className="sm:col-span-2"><code className="text-slate-900 font-bold">clientComments:</code> <span className="text-slate-500">string</span></div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-1.5 pt-2.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block text-sky-700">
                        3. Agendamiento Tentativo
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                        <div><code className="text-slate-900 font-bold">tentativeDate1 / tentativeTime1:</code> <span className="text-slate-500">string (Opción 1)</span></div>
                        <div><code className="text-slate-900 font-bold">tentativeDate2 / tentativeTime2:</code> <span className="text-slate-500">string (Opción 2)</span></div>
                      </div>
                    </div>

                    {/* Windows array */}
                    <div className="space-y-1.5 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block text-sky-700">
                          4. Medidas y Ventanas (<code className="text-sky-900">windows[]</code>)
                        </span>
                        <span className="text-slate-500 text-[10.5px]">totalAreaM2: <strong>number</strong></span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[10.5px] text-slate-700">
                        Array&lt;&#123; id: string, name: string, widthM: number, heightM: number, quantity: number, areaM2: number &#125;&gt;
                      </div>
                    </div>

                    {/* Admin quote object */}
                    <div className="space-y-1.5 pt-2.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block text-sky-700">
                        5. Presupuesto Administrativo (<code className="text-sky-900">adminQuote</code>)
                      </span>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10.5px]">
                        <div>pricePerM2: number</div>
                        <div>meshTotalCost: number</div>
                        <div>profilesAndFixingsCost: number</div>
                        <div>laborAndInstallCost: number</div>
                        <div>subtotal / total: number</div>
                        <div>discountPercentage: number</div>
                        <div>warrantyYears: number (2-3 años)</div>
                        <div>estimatedTime: string</div>
                        <div>confirmedInstallationDate: string</div>
                        <div>adminNotes: string</div>
                      </div>
                    </div>

                    {/* Installer assignment & execution */}
                    <div className="space-y-1.5 pt-2.5">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block text-sky-700">
                        6. Asignación & Ejecución Técnica (<code className="text-sky-900">installerAssignment</code> & <code className="text-sky-900">technicianExecution</code>)
                      </span>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[10.5px]">
                        <div><strong className="font-mono text-slate-800">installerAssignment:</strong> &#123; installerName, installerRut, installerPhone, scheduledDate, installationStatus: 'asignado' | 'en_camino' | 'instalado' &#125;</div>
                        <div><strong className="font-mono text-slate-800">technicianExecution:</strong> &#123; status: 'pendiente_aceptar' | 'solicitud_aceptada' | 'trabajo_realizado', notes, completedAt, photoUrl &#125;</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection: users */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="px-4 py-2 bg-slate-800 text-white flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FolderTree className="w-3.5 h-3.5 text-sky-400" />
                      <span className="font-mono font-bold text-sky-400">/users</span>
                      <span className="text-slate-400 text-[11px] font-sans">&#123;userId&#125; (Cuentas de Acceso)</span>
                    </div>
                  </div>
                  <div className="p-3 text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pl-4">
                    <div><code className="font-bold text-slate-900">id:</code> string</div>
                    <div><code className="font-bold text-slate-900">email:</code> string</div>
                    <div><code className="font-bold text-slate-900">fullName:</code> string</div>
                    <div><code className="font-bold text-slate-900">role:</code> 'admin' | 'tecnico' | 'cliente'</div>
                  </div>
                </div>
              </div>

              {/* Live Document JSON Inspector */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-xs text-white">Inspeccionar Documento Real en Vivo</h4>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                      aria-label="Seleccionar documento a inspeccionar"
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-sky-500 w-full sm:w-60"
                    >
                      <option value="">Seleccionar una cotización...</option>
                      {getStoredQuotes().map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.folio} - {q.clientName} ({q.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedDocId ? (
                  (() => {
                    const found = getStoredQuotes().find((q) => q.id === selectedDocId);
                    if (!found) return null;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Ruta Firestore: <strong className="font-mono text-amber-400">quotes/{found.id}</strong></span>
                          <span>Cliente: <strong className="text-white">{found.clientEmail}</strong></span>
                        </div>
                        <pre className="p-3 bg-slate-950 rounded-xl text-[10.5px] font-mono text-emerald-300 overflow-x-auto max-h-56 border border-slate-800">
                          {JSON.stringify(found, null, 2)}
                        </pre>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Selecciona una cotización en el menú desplegable para ver su estructura JSON exacta guardada en Firestore.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SUPABASE */}
          {activeTab === 'supabase' && (
            <div className="space-y-5">
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  supabaseCfg.isConfigured
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        supabaseCfg.isConfigured
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-400 text-white shadow-xs'
                      }`}
                    >
                      {supabaseCfg.isConfigured ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-900">
                          {supabaseCfg.isConfigured ? 'Supabase Conectado' : 'Supabase No Configurado'}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            supabaseCfg.isConfigured
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {supabaseCfg.source === 'env'
                            ? 'Variables .env'
                            : supabaseCfg.source === 'custom'
                            ? 'Claves Personalizadas'
                            : 'Opcional'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {supabaseCfg.isConfigured
                          ? `Conectado al proyecto: ${supabaseCfg.url}`
                          : 'Si prefieres usar Supabase en lugar de Firebase, puedes pegar tu Project URL y Anon Key.'}
                      </p>
                    </div>
                  </div>

                  {supabaseCfg.isConfigured && (
                    <button
                      type="button"
                      onClick={handleTestSupabase}
                      disabled={isTesting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Probando...' : 'Probar'}</span>
                    </button>
                  )}
                </div>

                {testResult && (
                  <div
                    className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 border ${
                      testResult.success
                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.success ? 'Conexión Exitosa' : 'Fallo'}</p>
                      <p className="text-[11px] mt-0.5">{testResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Supabase inputs */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-slate-500" />
                    <h4 className="font-bold text-slate-900">Credenciales de Supabase</h4>
                  </div>
                  {supabaseCfg.source === 'custom' && (
                    <button
                      type="button"
                      onClick={handleClearSupabaseConfig}
                      className="text-[11px] text-rose-600 hover:underline font-semibold"
                    >
                      Restablecer
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Project URL:
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://abcdefghijklm.supabase.co"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Anon Public Key:
                  </label>
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Abrir panel de Supabase</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={handleSaveSupabaseConfig}
                    disabled={!urlInput || !keyInput}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    Guardar Credenciales
                  </button>
                </div>
              </div>

              {/* SQL Script */}
              <div className="bg-slate-900 rounded-2xl p-4 text-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">Script SQL para Supabase</span>
                  </div>
                  <button
                    type="button"
                    onClick={copySqlToClipboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl text-[10.5px] font-mono text-emerald-300 overflow-x-auto max-h-36 border border-slate-800">
                  {sqlCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Seguridad en la nube y persistencia de cotizaciones</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
