import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Trash2 } from 'lucide-react';
import { QuoteRequest, UserAccount, WindowItem } from '../types';
import { CONTACT_PHONE_DISPLAY, WHATSAPP_QUOTE_URL } from '../constants/contact';
import { CHILE_REGIONS, getRegionByCode } from '../constants/chileRegions';
import {
  FINISH_HELP,
  FINISH_OPTIONS,
  GUIDED_QUOTE_STEPS,
  HEIGHT_OPTIONS,
  LENGTH_OPTIONS,
  SURFACE_HELP,
  SURFACE_OPTIONS,
  TIMELINE_DISCLAIMER,
  TIMELINE_OPTIONS,
  WORK_TYPE_OPTIONS,
  labelOf,
  type FinishType,
  type HeightRange,
  type LengthRange,
  type SurfaceType,
  type TimelineType,
  type WorkType,
} from '../constants/guidedQuote';
import {
  clearGuidedDraft,
  loadGuidedDraft,
  saveGuidedDraft,
  type GuidedQuoteDraft,
} from '../services/guidedQuoteDraft';
import {
  areaM2FromCm,
  emptyWindowDraft,
  isBalconySurface,
  itemNoun,
  itemTitle,
  parsePositiveCm,
  windowHasData,
  type WindowMeasureDraft,
} from '../utils/windowMeasures';
import { HelpModal } from './HelpModal';
import { OptionCard } from './OptionCard';
import { WindowsMeasureTable, type WindowMeasureRow } from './WindowsMeasureTable';

interface GuidedQuoteViewProps {
  currentUser: UserAccount | null;
  onBackToHome: () => void;
  onGoToPrivacy: () => void;
  onGoToTerms: () => void;
  onSubmitted: (quote: QuoteRequest) => void;
}

type HelpKind = 'surface' | 'length' | 'height' | 'finish' | 'summary' | 'windows' | null;

type GuidedReceipt = {
  id: string;
  folio: string;
  createdAt: string;
  regionName: string;
  commune: string;
  workType: string;
  surfaceType: string;
  lengthRange: string;
  heightRange: string;
  finish: string;
  timeline: string;
  balcony: boolean;
  windows: WindowItem[];
  totalAreaM2: number;
  mailSent: boolean;
  clientEmail: string;
};

function formatReceiptDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function buildReceipt(
  draft: GuidedQuoteDraft,
  quote: QuoteRequest,
  regionName: string,
  mailSent: boolean
): GuidedReceipt {
  const guided = quote.guidedQuote;
  const finishType = guided?.finishType || draft.finishType;
  const finishColor = guided?.finishColor || draft.finishColor;
  const finishLabel = labelOf(FINISH_OPTIONS, finishType);
  return {
    id: quote.id,
    folio: quote.folio,
    createdAt: quote.createdAt || new Date().toISOString(),
    regionName: guided?.regionName || regionName,
    commune: guided?.commune || draft.commune,
    workType: labelOf(WORK_TYPE_OPTIONS, guided?.workType || draft.workType),
    surfaceType: labelOf(SURFACE_OPTIONS, guided?.surfaceType || draft.surfaceType),
    lengthRange: labelOf(LENGTH_OPTIONS, guided?.lengthRange || draft.lengthRange),
    heightRange: labelOf(HEIGHT_OPTIONS, guided?.heightRange || draft.heightRange),
    finish: finishType === 'lacado_otros' && finishColor ? `${finishLabel} (${finishColor})` : finishLabel,
    timeline: labelOf(TIMELINE_OPTIONS, guided?.timeline || draft.timeline),
    balcony: isBalconySurface(guided?.surfaceType || draft.surfaceType),
    windows: quote.windows || [],
    totalAreaM2: quote.totalAreaM2 || 0,
    mailSent,
    clientEmail: quote.clientEmail || draft.email,
  };
}

const fieldClass =
  'mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 disabled:bg-slate-100 disabled:text-slate-400';

export const GuidedQuoteView: React.FC<GuidedQuoteViewProps> = ({
  currentUser,
  onBackToHome,
  onGoToPrivacy,
  onGoToTerms,
  onSubmitted,
}) => {
  const [draft, setDraft] = useState<GuidedQuoteDraft>(() => {
    const loaded = loadGuidedDraft();
    if (currentUser) {
      return {
        ...loaded,
        name: loaded.name || currentUser.fullName || '',
        email: loaded.email || currentUser.email || '',
      };
    }
    return loaded;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [help, setHelp] = useState<HelpKind>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<GuidedReceipt | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const communes = useMemo(
    () => getRegionByCode(draft.regionCode)?.communes || [],
    [draft.regionCode]
  );
  const regionName = getRegionByCode(draft.regionCode)?.name || '';
  const balcony = isBalconySurface(draft.surfaceType);
  const liveWindowRows: WindowMeasureRow[] = useMemo(
    () =>
      draft.windows.map((win, index) => {
        const widthCm = parsePositiveCm(win.widthCm);
        const heightCm = parsePositiveCm(win.heightCm);
        return {
          id: win.id,
          label: itemTitle(draft.surfaceType, index),
          location: win.name.trim() || '—',
          widthCm,
          heightCm,
          area: widthCm != null && heightCm != null ? areaM2FromCm(widthCm, heightCm) : null,
        };
      }),
    [draft.windows, draft.surfaceType]
  );

  useEffect(() => {
    saveGuidedDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (!currentUser) return;
    setDraft((prev) => ({
      ...prev,
      name: prev.name || currentUser.fullName || '',
      email: prev.email || currentUser.email || '',
    }));
  }, [currentUser]);

  const update = (patch: Partial<GuidedQuoteDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setErrors({});
    setSubmitError(null);
  };

  const validateStep = (step: number): boolean => {
    const next: Record<string, string> = {};
    if (step === 1) {
      if (!draft.regionCode) next.regionCode = 'Selecciona una región.';
      if (!draft.commune) next.commune = 'Selecciona una comuna.';
    }
    if (step === 2 && !draft.workType) next.workType = 'Elige una opción.';
    if (step === 3 && !draft.surfaceType) next.surfaceType = 'Elige una opción.';
    if (step === 4 && !draft.lengthRange) next.lengthRange = 'Elige una opción.';
    if (step === 5 && !draft.heightRange) next.heightRange = 'Elige una opción.';
    if (step === 6) {
      if (!draft.finishType) next.finishType = 'Elige una opción.';
      if (draft.finishType === 'lacado_otros' && !draft.finishColor.trim()) {
        next.finishColor = 'Indica el color que prefieres.';
      }
    }
    if (step === 7 && !draft.timeline) next.timeline = 'Elige una opción.';
    if (step === 8) {
      if (!draft.name.trim()) next.name = 'Ingresa tu nombre.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) next.email = 'Ingresa un correo válido.';
      if (draft.phone.replace(/\D/g, '').length < 8) next.phone = 'Ingresa un teléfono válido.';
      if (!draft.acceptedTerms) next.acceptedTerms = 'Debes aceptar la Política de Privacidad y los Términos de uso.';
    }
    if (step === 9) {
      if (!draft.windows.length) {
        next.windows = `Agrega al menos un ${itemNoun(draft.surfaceType)} con sus medidas.`;
      }
      draft.windows.forEach((win, index) => {
        const title = itemTitle(draft.surfaceType, index);
        if (parsePositiveCm(win.widthCm) == null) {
          next[`width-${win.id}`] = `${title}: ingresa un ancho mayor a cero.`;
        }
        if (parsePositiveCm(win.heightCm) == null) {
          next[`height-${win.id}`] = `${title}: ingresa un alto mayor a cero.`;
        }
      });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(draft.step)) return;
    update({ step: Math.min(GUIDED_QUOTE_STEPS, draft.step + 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    update({ step: Math.max(1, draft.step - 1) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateWindow = (id: string, patch: Partial<WindowMeasureDraft>) => {
    setDraft((prev) => ({
      ...prev,
      windows: prev.windows.map((win) => (win.id === id ? { ...win, ...patch } : win)),
    }));
    setErrors({});
    setSubmitError(null);
  };

  const addWindow = () => {
    setDraft((prev) => ({ ...prev, windows: [...prev.windows, emptyWindowDraft()] }));
    setErrors({});
    setConfirmDeleteId(null);
  };

  const removeWindow = (id: string) => {
    setDraft((prev) => {
      const next = prev.windows.filter((win) => win.id !== id);
      return { ...prev, windows: next.length ? next : [emptyWindowDraft()] };
    });
    setConfirmDeleteId(null);
    setErrors({});
  };

  const requestRemoveWindow = (win: WindowMeasureDraft) => {
    if (windowHasData(win)) {
      setConfirmDeleteId(win.id);
      return;
    }
    removeWindow(win.id);
  };

  const sendRequest = async () => {
    if (!validateStep(9)) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { apiFetch } = await import('../services/sessionApi');
      const data = await apiFetch('/api/quotes/guided', {
        method: 'POST',
        body: JSON.stringify({
          clientRequestId: draft.clientRequestId,
          regionCode: draft.regionCode,
          commune: draft.commune,
          workType: draft.workType,
          surfaceType: draft.surfaceType,
          lengthRange: draft.lengthRange,
          heightRange: draft.heightRange,
          finishType: draft.finishType,
          finishColor: draft.finishType === 'lacado_otros' ? draft.finishColor.trim() : undefined,
          timeline: draft.timeline,
          name: draft.name.trim(),
          email: draft.email.trim(),
          phone: draft.phone.trim(),
          acceptedTerms: draft.acceptedTerms,
          commercialOptIn: draft.commercialOptIn,
          windows: draft.windows.map((win) => ({
            id: win.id,
            name: win.name.trim(),
            widthCm: win.widthCm,
            heightCm: win.heightCm,
          })),
        }),
      });
      const receipt = buildReceipt(draft, data.quote, regionName, !!data.mailSent);
      clearGuidedDraft();
      setSuccess(receipt);
      onSubmitted(data.quote);
    } catch (err: any) {
      setSubmitError(err?.message || 'No pudimos guardar la solicitud. Puedes reintentar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const rows: { label: string; value: string }[] = [
      { label: 'Trabajo a realizar', value: 'Mallas de protección' },
      { label: 'Fecha estimada del proyecto', value: success.timeline },
      { label: '¿Qué necesitas?', value: success.workType },
      { label: 'Tipo de superficie', value: success.surfaceType },
      { label: '¿Longitud de la malla?', value: success.lengthRange },
      { label: '¿Altura de la malla?', value: success.heightRange },
      { label: 'Tipo de acabado', value: success.finish },
      { label: 'Ubicación aproximada', value: `Mallas de protección en ${success.commune}` },
    ];

    return (
      <section className="max-w-5xl mx-auto pb-16 space-y-4">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 flex items-start gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Recibimos tu solicitud de cotización de mallas de protección.
            {success.mailSent
              ? ` Enviamos un correo a nydo.mallas@gmail.com y otro a ${success.clientEmail}.`
              : ' La solicitud quedó registrada. Si el correo no llega, te contactamos por WhatsApp o teléfono.'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
            <div>
              <h1 className="text-lg font-black text-slate-900">Detalles de tu solicitud</h1>
              <p className="text-sm text-slate-500 mt-1">
                Solicitud enviada el {formatReceiptDate(success.createdAt)}
                {success.regionName ? ` en ${success.commune}, ${success.regionName}` : ''}.
              </p>
              <p className="text-xs font-bold text-slate-400 mt-1">Folio {success.folio}</p>
            </div>

            <dl className="divide-y divide-slate-100">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm"
                >
                  <dt className="font-bold text-slate-800">{row.label}</dt>
                  <dd className="text-slate-600 sm:text-right">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-2">
              <h2 className="text-sm font-black text-slate-900">
                {success.balcony ? 'Paños y medidas' : 'Ventanas y medidas'}
              </h2>
              <WindowsMeasureTable
                rows={success.windows.map((win, index) => ({
                  id: win.id,
                  label: itemTitle(success.balcony ? 'balcon_recto' : '', index),
                  location: win.name || '—',
                  widthCm: win.widthCm ?? win.width * 100,
                  heightCm: win.heightCm ?? win.height * 100,
                  area: win.area,
                }))}
                itemHeader={success.balcony ? 'Paño' : 'Ventana'}
              />
              <p className="text-xs text-slate-500">
                Las medidas ingresadas son referenciales y deberán confirmarse antes de la instalación.
              </p>
            </div>
            <p className="text-xs text-slate-500">{TIMELINE_DISCLAIMER}</p>
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h2 className="text-sm font-black text-slate-900">Solicitud en curso</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Revisaremos tus datos y te contactaremos por WhatsApp, teléfono o correo. Esta solicitud no
                reserva fecha ni confirma la instalación.
              </p>
              <p className="text-xs text-slate-500">Estado: Recibida</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
              <a
                href={WHATSAPP_QUOTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                WhatsApp {CONTACT_PHONE_DISPLAY}
              </a>
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                Volver al inicio
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  const progress = (draft.step / GUIDED_QUOTE_STEPS) * 100;

  return (
    <section className="max-w-xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-sky-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </button>
        <span className="text-xs font-bold text-slate-500">Paso {draft.step} de {GUIDED_QUOTE_STEPS}</span>
      </div>

      <div className="h-2 rounded-full bg-slate-200 mb-5 overflow-hidden" aria-hidden="true">
        <div className="h-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
        {draft.step >= 3 && (
          <button
            type="button"
            onClick={() => update({ step: 2 })}
            className="text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
          >
            Cambiar tipo de trabajo
          </button>
        )}

        {draft.step === 1 && (
          <div className="space-y-4">
            <h1 className="text-xl font-black text-slate-900">
              ¿En qué zona necesitas el trabajo de mallas de protección?
            </h1>
            <label className="block text-sm font-bold text-slate-700">
              Región
              <select
                value={draft.regionCode}
                onChange={(e) => update({ regionCode: e.target.value, commune: '' })}
                className={fieldClass}
              >
                <option value="">Selecciona una región</option>
                {CHILE_REGIONS.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>
            {errors.regionCode && <p className="text-xs font-semibold text-rose-600">{errors.regionCode}</p>}
            <label className="block text-sm font-bold text-slate-700">
              Comuna
              <select
                value={draft.commune}
                disabled={!draft.regionCode}
                onChange={(e) => update({ commune: e.target.value })}
                className={fieldClass}
              >
                <option value="">{draft.regionCode ? 'Selecciona una comuna' : 'Primero elige la región'}</option>
                {communes.map((commune) => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </select>
            </label>
            {errors.commune && <p className="text-xs font-semibold text-rose-600">{errors.commune}</p>}
          </div>
        )}

        {draft.step === 2 && (
          <fieldset className="space-y-3">
            <legend className="text-xl font-black text-slate-900">¿Qué necesitas?</legend>
            <div role="radiogroup" className="space-y-2">
              {WORK_TYPE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  name="workType"
                  value={option.id}
                  label={option.label}
                  checked={draft.workType === option.id}
                  onSelect={() => update({ workType: option.id as WorkType })}
                />
              ))}
            </div>
            {errors.workType && <p className="text-xs font-semibold text-rose-600">{errors.workType}</p>}
          </fieldset>
        )}

        {draft.step === 3 && (
          <fieldset className="space-y-3">
            <legend className="text-xl font-black text-slate-900">Tipo de superficie</legend>
            <button type="button" onClick={() => setHelp('surface')} className="text-xs font-bold text-sky-700 cursor-pointer">
              + Ver detalle
            </button>
            <div role="radiogroup" className="space-y-2">
              {SURFACE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  name="surfaceType"
                  value={option.id}
                  label={option.label}
                  checked={draft.surfaceType === option.id}
                  onSelect={() => update({ surfaceType: option.id as SurfaceType })}
                />
              ))}
            </div>
            {errors.surfaceType && <p className="text-xs font-semibold text-rose-600">{errors.surfaceType}</p>}
          </fieldset>
        )}

        {draft.step === 4 && (
          <fieldset className="space-y-3">
            <legend className="text-xl font-black text-slate-900">¿Cuál es la longitud de la malla?</legend>
            <button type="button" onClick={() => setHelp('length')} className="text-xs font-bold text-sky-700 cursor-pointer">
              + Cómo medir
            </button>
            <div role="radiogroup" className="space-y-2">
              {LENGTH_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  name="lengthRange"
                  value={option.id}
                  label={option.label}
                  checked={draft.lengthRange === option.id}
                  onSelect={() => update({ lengthRange: option.id as LengthRange })}
                />
              ))}
            </div>
            {errors.lengthRange && <p className="text-xs font-semibold text-rose-600">{errors.lengthRange}</p>}
          </fieldset>
        )}

        {draft.step === 5 && (
          <fieldset className="space-y-3">
            <legend className="text-xl font-black text-slate-900">¿Cuál es la altura de la malla?</legend>
            <button type="button" onClick={() => setHelp('height')} className="text-xs font-bold text-sky-700 cursor-pointer">
              + Cómo medir
            </button>
            <div role="radiogroup" className="space-y-2">
              {HEIGHT_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  name="heightRange"
                  value={option.id}
                  label={option.label}
                  checked={draft.heightRange === option.id}
                  onSelect={() => update({ heightRange: option.id as HeightRange })}
                />
              ))}
            </div>
            {errors.heightRange && <p className="text-xs font-semibold text-rose-600">{errors.heightRange}</p>}
          </fieldset>
        )}

        {draft.step === 6 && (
          <fieldset className="space-y-3">
            <legend className="text-xl font-black text-slate-900">Tipo de acabado</legend>
            <button type="button" onClick={() => setHelp('finish')} className="text-xs font-bold text-sky-700 cursor-pointer">
              + Ver detalle
            </button>
            <div role="radiogroup" className="space-y-2">
              {FINISH_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  name="finishType"
                  value={option.id}
                  label={option.label}
                  checked={draft.finishType === option.id}
                  onSelect={() =>
                    update({
                      finishType: option.id as FinishType,
                      finishColor: option.id === 'lacado_otros' ? draft.finishColor : '',
                    })
                  }
                />
              ))}
            </div>
            {errors.finishType && <p className="text-xs font-semibold text-rose-600">{errors.finishType}</p>}
            {draft.finishType === 'lacado_otros' && (
              <label className="block text-sm font-bold text-slate-700">
                ¿Qué color prefieres?
                <input
                  value={draft.finishColor}
                  onChange={(e) => update({ finishColor: e.target.value })}
                  className={fieldClass}
                />
              </label>
            )}
            {errors.finishColor && <p className="text-xs font-semibold text-rose-600">{errors.finishColor}</p>}
          </fieldset>
        )}

        {draft.step === 7 && (
          <fieldset className="space-y-3">
            <legend className="text-xl font-black text-slate-900">¿Cuándo quieres realizar el trabajo?</legend>
            <p className="text-xs text-slate-500">{TIMELINE_DISCLAIMER}</p>
            <div role="radiogroup" className="space-y-2">
              {TIMELINE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.id}
                  name="timeline"
                  value={option.id}
                  label={option.label}
                  checked={draft.timeline === option.id}
                  onSelect={() => update({ timeline: option.id as TimelineType })}
                />
              ))}
            </div>
            {errors.timeline && <p className="text-xs font-semibold text-rose-600">{errors.timeline}</p>}
          </fieldset>
        )}

        {draft.step === 8 && (
          <div className="space-y-4">
            <h1 className="text-xl font-black text-slate-900">Tus datos de contacto</h1>
            <button type="button" onClick={() => setHelp('summary')} className="text-xs font-bold text-sky-700 cursor-pointer">
              + Ver resumen
            </button>
            <label className="block text-sm font-bold text-slate-700">
              Nombre
              <input value={draft.name} onChange={(e) => update({ name: e.target.value })} className={fieldClass} />
            </label>
            {errors.name && <p className="text-xs font-semibold text-rose-600">{errors.name}</p>}
            <label className="block text-sm font-bold text-slate-700">
              Email
              <input type="email" value={draft.email} onChange={(e) => update({ email: e.target.value })} className={fieldClass} />
            </label>
            {errors.email && <p className="text-xs font-semibold text-rose-600">{errors.email}</p>}
            <label className="block text-sm font-bold text-slate-700">
              Teléfono
              <input type="tel" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} className={fieldClass} />
            </label>
            {errors.phone && <p className="text-xs font-semibold text-rose-600">{errors.phone}</p>}
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.acceptedTerms}
                onChange={(e) => update({ acceptedTerms: e.target.checked })}
                className="mt-1"
              />
              <span>
                Acepto la{' '}
                <button type="button" onClick={onGoToPrivacy} className="font-bold text-sky-700 underline cursor-pointer">
                  Política de Privacidad
                </button>{' '}
                y los{' '}
                <button type="button" onClick={onGoToTerms} className="font-bold text-sky-700 underline cursor-pointer">
                  Términos de uso
                </button>
                .
              </span>
            </label>
            {errors.acceptedTerms && <p className="text-xs font-semibold text-rose-600">{errors.acceptedTerms}</p>}
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draft.commercialOptIn}
                onChange={(e) => update({ commercialOptIn: e.target.checked })}
                className="mt-1"
              />
              <span>Quiero recibir comunicaciones comerciales (opcional).</span>
            </label>
            {submitError && <p className="text-sm font-semibold text-rose-600">{submitError}</p>}
          </div>
        )}

        {draft.step === 9 && (
          <div className="space-y-4">
            <h1 className="text-xl font-black text-slate-900">
              {balcony
                ? 'Agrega los paños donde necesitas instalar mallas'
                : 'Agrega las ventanas donde necesitas instalar mallas'}
            </h1>
            <p className="text-sm text-slate-600">
              Agrega cada {itemNoun(draft.surfaceType)} por separado e indica sus medidas. Si tienes{' '}
              {balcony ? 'varios' : 'varias'} {itemNoun(draft.surfaceType, true)} iguales, registra una fila para cada{' '}
              {balcony ? 'uno' : 'una'}.
            </p>
            <button
              type="button"
              onClick={() => setHelp('windows')}
              className="text-xs font-bold text-sky-700 cursor-pointer"
            >
              + Cómo medir
            </button>
            <WindowSizeDiagram />
            <div className="space-y-3">
              {draft.windows.map((win, index) => (
                <article key={win.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-black text-slate-900">{itemTitle(draft.surfaceType, index)}</h2>
                    {(draft.windows.length > 1 || windowHasData(win)) && (
                      <button
                        type="button"
                        onClick={() => requestRemoveWindow(win)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    )}
                  </div>
                  {confirmDeleteId === win.id && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-rose-900">
                        ¿Eliminar {itemTitle(draft.surfaceType, index)}
                        {win.name.trim() ? ` (${win.name.trim()})` : ''} y sus medidas?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => removeWindow(win.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  <label className="block text-sm font-bold text-slate-700">
                    Nombre o ubicación <span className="font-medium text-slate-400">(opcional)</span>
                    <input
                      value={win.name}
                      onChange={(e) => updateWindow(win.id, { name: e.target.value })}
                      placeholder="Ej. dormitorio, cocina o living"
                      className={fieldClass}
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block text-sm font-bold text-slate-700">
                      Ancho
                      <span className={`mt-1 flex items-center rounded-xl border bg-white overflow-hidden ${errors[`width-${win.id}`] ? 'border-rose-400' : 'border-slate-300'}`}>
                        <input
                          value={win.widthCm}
                          inputMode="decimal"
                          onChange={(e) => updateWindow(win.id, { widthCm: e.target.value })}
                          placeholder="120"
                          className="w-full px-3 py-2.5 text-slate-900 outline-none"
                          aria-invalid={Boolean(errors[`width-${win.id}`])}
                        />
                        <span className="px-3 text-xs font-bold text-slate-500">cm</span>
                      </span>
                    </label>
                    <label className="block text-sm font-bold text-slate-700">
                      Alto
                      <span className={`mt-1 flex items-center rounded-xl border bg-white overflow-hidden ${errors[`height-${win.id}`] ? 'border-rose-400' : 'border-slate-300'}`}>
                        <input
                          value={win.heightCm}
                          inputMode="decimal"
                          onChange={(e) => updateWindow(win.id, { heightCm: e.target.value })}
                          placeholder="150"
                          className="w-full px-3 py-2.5 text-slate-900 outline-none"
                          aria-invalid={Boolean(errors[`height-${win.id}`])}
                        />
                        <span className="px-3 text-xs font-bold text-slate-500">cm</span>
                      </span>
                    </label>
                  </div>
                  {errors[`width-${win.id}`] && (
                    <p className="text-xs font-semibold text-rose-600">{errors[`width-${win.id}`]}</p>
                  )}
                  {errors[`height-${win.id}`] && (
                    <p className="text-xs font-semibold text-rose-600">{errors[`height-${win.id}`]}</p>
                  )}
                </article>
              ))}
            </div>
            <button
              type="button"
              onClick={addWindow}
              className="text-sm font-bold text-sky-700 cursor-pointer"
            >
              {balcony ? '+ Agregar otro paño' : '+ Agregar otra ventana'}
            </button>
            {errors.windows && <p className="text-xs font-semibold text-rose-600">{errors.windows}</p>}

            <div className="space-y-2 pt-1">
              <h2 className="text-sm font-black text-slate-900">Resumen de medidas</h2>
              <WindowsMeasureTable
                rows={liveWindowRows}
                itemHeader={balcony ? 'Paño' : 'Ventana'}
              />
              <p className="text-xs text-slate-500">
                Las medidas ingresadas son referenciales y deberán confirmarse antes de la instalación.
              </p>
            </div>
            {submitError && <p className="text-sm font-semibold text-rose-600">{submitError}</p>}
          </div>
        )}

        <div className="pt-2 space-y-2">
          <div className="flex gap-2">
            {draft.step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold cursor-pointer"
              >
                Volver
              </button>
            )}
            {draft.step < GUIDED_QUOTE_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold cursor-pointer"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void sendRequest()}
                className="flex-1 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
              >
                {submitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            )}
          </div>
          <p className="text-center text-xs font-semibold text-slate-500">Gratis y sin compromiso</p>
        </div>
      </div>

      <HelpModal open={help === 'surface'} title="Tipo de superficie" onClose={() => setHelp(null)}>
        <SurfaceDiagrams />
        {Object.entries(SURFACE_HELP).map(([id, text]) => (
          <p key={id}>
            <strong>{labelOf(SURFACE_OPTIONS, id as SurfaceType)}:</strong> {text}
          </p>
        ))}
      </HelpModal>

      <HelpModal open={help === 'length'} title="Cómo medir la longitud" onClose={() => setHelp(null)}>
        <MeasureDiagram axis="horizontal" />
        <p>La longitud es la medida horizontal del tramo que se desea cubrir.</p>
        {(draft.surfaceType === 'balcon_l' || draft.surfaceType === 'balcon_u') && (
          <p>En balcones en “L” o “U”, suma los tramos que se desean cubrir.</p>
        )}
      </HelpModal>

      <HelpModal open={help === 'height'} title="Cómo medir la altura" onClose={() => setHelp(null)}>
        <MeasureDiagram axis="vertical" />
        <p>La altura es la medida vertical del espacio que se desea cubrir, de abajo hacia arriba.</p>
      </HelpModal>

      <HelpModal open={help === 'finish'} title="Tipo de acabado" onClose={() => setHelp(null)}>
        <p>{FINISH_HELP}</p>
      </HelpModal>

      <HelpModal open={help === 'windows'} title="Cómo medir" onClose={() => setHelp(null)}>
        <WindowSizeDiagram />
        <p>
          El <strong>ancho</strong> es la medida horizontal. El <strong>alto</strong> es la medida vertical, de abajo
          hacia arriba. Usa centímetros (cm). Puedes escribir decimales con coma o punto, por ejemplo 120,5.
        </p>
        {balcony && (
          <p>En un balcón, registra cada tramo o paño por separado, con su propio ancho y alto.</p>
        )}
      </HelpModal>

      <HelpModal open={help === 'summary'} title="Resumen de tus respuestas" onClose={() => setHelp(null)}>
        <SummaryList
          draft={draft}
          regionName={regionName}
          onEdit={(step) => {
            setHelp(null);
            update({ step });
          }}
        />
      </HelpModal>
    </section>
  );
};

const SurfaceDiagrams: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {[
      { label: 'Interior', d: 'M8 28 V8 h16 v20 M12 18 h8' },
      { label: 'Exterior', d: 'M8 28 V8 h16 v20 M24 18 h8' },
      { label: 'Recto', d: 'M6 24 h28' },
      { label: 'L', d: 'M8 8 v20 h20' },
      { label: 'U', d: 'M8 8 v20 h24 V8' },
    ].map((item) => (
      <div key={item.label} className="rounded-xl border border-slate-200 p-2 text-center">
        <svg viewBox="0 0 40 36" className="w-full h-14 text-sky-700">
          <path d={item.d} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="text-[10px] font-bold text-slate-600">{item.label}</p>
      </div>
    ))}
  </div>
);

const WindowSizeDiagram: React.FC = () => (
  <svg viewBox="0 0 220 140" className="w-full h-28 text-sky-700" aria-hidden="true">
    <rect x="48" y="18" width="124" height="92" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5" rx="6" />
    <line x1="56" y1="122" x2="164" y2="122" stroke="currentColor" strokeWidth="2.5" />
    <polygon points="56,122 64,118 64,126" fill="currentColor" />
    <polygon points="164,122 156,118 156,126" fill="currentColor" />
    <text x="110" y="136" textAnchor="middle" className="fill-slate-600" fontSize="11" fontWeight="700">
      Ancho
    </text>
    <line x1="36" y1="26" x2="36" y2="102" stroke="currentColor" strokeWidth="2.5" />
    <polygon points="36,26 32,34 40,34" fill="currentColor" />
    <polygon points="36,102 32,94 40,94" fill="currentColor" />
    <text x="18" y="70" textAnchor="middle" className="fill-slate-600" fontSize="11" fontWeight="700" transform="rotate(-90 18 70)">
      Alto
    </text>
  </svg>
);

const MeasureDiagram: React.FC<{ axis: 'horizontal' | 'vertical' }> = ({ axis }) => (
  <svg viewBox="0 0 160 70" className="w-full h-20 text-sky-700">
    <rect x="20" y="12" width="120" height="46" fill="none" stroke="#cbd5e1" strokeWidth="2" rx="6" />
    {axis === 'horizontal' ? (
      <>
        <line x1="28" y1="35" x2="132" y2="35" stroke="currentColor" strokeWidth="3" />
        <polygon points="28,35 36,31 36,39" fill="currentColor" />
        <polygon points="132,35 124,31 124,39" fill="currentColor" />
      </>
    ) : (
      <>
        <line x1="80" y1="18" x2="80" y2="52" stroke="currentColor" strokeWidth="3" />
        <polygon points="80,18 76,26 84,26" fill="currentColor" />
        <polygon points="80,52 76,44 84,44" fill="currentColor" />
      </>
    )}
  </svg>
);

const SummaryList: React.FC<{
  draft: GuidedQuoteDraft;
  regionName: string;
  onEdit: (step: number) => void;
}> = ({ draft, regionName, onEdit }) => {
  const rows: { step: number; label: string; value: string }[] = [
    { step: 1, label: 'Zona', value: [regionName, draft.commune].filter(Boolean).join(' · ') },
    { step: 2, label: 'Trabajo', value: labelOf(WORK_TYPE_OPTIONS, draft.workType) },
    { step: 3, label: 'Superficie', value: labelOf(SURFACE_OPTIONS, draft.surfaceType) },
    { step: 4, label: 'Longitud', value: labelOf(LENGTH_OPTIONS, draft.lengthRange) },
    { step: 5, label: 'Altura', value: labelOf(HEIGHT_OPTIONS, draft.heightRange) },
    {
      step: 6,
      label: 'Acabado',
      value:
        draft.finishType === 'lacado_otros'
          ? `${labelOf(FINISH_OPTIONS, draft.finishType)} (${draft.finishColor})`
          : labelOf(FINISH_OPTIONS, draft.finishType),
    },
    { step: 7, label: 'Plazo', value: labelOf(TIMELINE_OPTIONS, draft.timeline) },
    {
      step: 9,
      label: isBalconySurface(draft.surfaceType) ? 'Paños' : 'Ventanas',
      value: `${draft.windows.length} ${itemNoun(draft.surfaceType, draft.windows.length !== 1)}`,
    },
  ];
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.step} className="flex items-start justify-between gap-3 text-sm">
          <span>
            <strong className="text-slate-900">{row.label}:</strong> {row.value || 'Sin responder'}
          </span>
          <button type="button" onClick={() => onEdit(row.step)} className="text-xs font-bold text-sky-700 cursor-pointer">
            Corregir
          </button>
        </li>
      ))}
    </ul>
  );
};
