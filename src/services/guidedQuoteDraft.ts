import {
  GUIDED_QUOTE_STEPS,
  type FinishType,
  type HeightRange,
  type LengthRange,
  type SurfaceType,
  type TimelineType,
  type WorkType,
} from '../constants/guidedQuote';
import { emptyWindowDraft, windowHasData, type WindowMeasureDraft } from '../utils/windowMeasures';

const DRAFT_KEY = 'mallas_guided_quote_draft_v1';

export type GuidedQuoteDraft = {
  clientRequestId: string;
  step: number;
  regionCode: string;
  commune: string;
  workType: WorkType | '';
  surfaceType: SurfaceType | '';
  lengthRange: LengthRange | '';
  heightRange: HeightRange | '';
  finishType: FinishType | '';
  finishColor: string;
  timeline: TimelineType | '';
  name: string;
  email: string;
  phone: string;
  acceptedTerms: boolean;
  commercialOptIn: boolean;
  windows: WindowMeasureDraft[];
};

export const emptyGuidedDraft = (): GuidedQuoteDraft => ({
  clientRequestId: `gq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  step: 1,
  regionCode: '',
  commune: '',
  workType: '',
  surfaceType: '',
  lengthRange: '',
  heightRange: '',
  finishType: '',
  finishColor: '',
  timeline: '',
  name: '',
  email: '',
  phone: '',
  acceptedTerms: false,
  commercialOptIn: false,
  windows: [emptyWindowDraft()],
});

export function loadGuidedDraft(): GuidedQuoteDraft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyGuidedDraft();
    const parsed = JSON.parse(raw) as Partial<GuidedQuoteDraft>;
    const windows =
      Array.isArray(parsed.windows) && parsed.windows.length > 0
        ? parsed.windows.map((w, i) => ({
            id: w.id || `win-${i + 1}`,
            name: w.name || '',
            widthCm: w.widthCm || '',
            heightCm: w.heightCm || '',
          }))
        : [emptyWindowDraft()];
    const step = Math.min(Math.max(1, Number(parsed.step) || 1), GUIDED_QUOTE_STEPS);
    return { ...emptyGuidedDraft(), ...parsed, step, acceptedTerms: !!parsed.acceptedTerms, windows };
  } catch {
    return emptyGuidedDraft();
  }
}

export function saveGuidedDraft(draft: GuidedQuoteDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function clearGuidedDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function hasUnsavedGuidedDraft(): boolean {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw) as GuidedQuoteDraft;
    return Boolean(
      draft.regionCode ||
        draft.commune ||
        draft.workType ||
        draft.surfaceType ||
        draft.lengthRange ||
        draft.heightRange ||
        draft.finishType ||
        draft.timeline ||
        draft.name ||
        draft.email ||
        draft.phone ||
        (Array.isArray(draft.windows) && draft.windows.some(windowHasData))
    );
  } catch {
    return false;
  }
}
