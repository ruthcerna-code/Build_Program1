import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DetailModalProps {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  title,
  subtitle,
  onClose,
  children,
  footer,
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = original;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-nydo-ink/55 p-0 sm:p-4 font-body"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="w-full sm:max-w-3xl max-h-[94vh] bg-[#f7f1eb] text-nydo-ink rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 bg-nydo-ink text-nydo-cream">
          <div className="min-w-0">
            <h2 id="detail-modal-title" className="nydo-display text-3xl uppercase">
              {title}
            </h2>
            {subtitle && <div className="text-sm text-nydo-cream/75 mt-1">{subtitle}</div>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-nydo-cream/10 hover:bg-nydo-cream/20 text-nydo-cream text-sm font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>
        <div className="px-5 py-5 overflow-y-auto text-sm space-y-4">{children}</div>
        {footer && (
          <div className="px-5 py-3.5 bg-white border-t border-nydo-ink/10 flex flex-wrap items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
