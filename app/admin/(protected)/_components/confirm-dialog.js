'use client';

import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}) {
  // ESC to close
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape' && !loading) onCancel?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !loading && onCancel?.()}
    >
      <div
        className="w-full max-w-md bg-raised border-2 border-default rounded-3xl p-6 shadow-popover"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${danger ? 'bg-danger-soft text-danger' : 'bg-lime-soft text-lime'}`}>
            <AlertTriangle size={22} />
          </div>
          <button
            onClick={() => !loading && onCancel?.()}
            className="text-muted hover:text-ink transition p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <h2 className="text-xl font-extrabold text-ink mb-2">{title}</h2>
        <p className="text-sm text-secondary leading-relaxed mb-6">{description}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-sm font-semibold px-4 py-2 rounded-full border border-default hover:border-ink text-ink transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`text-sm font-bold px-5 py-2 rounded-full transition disabled:opacity-50 ${
              danger
                ? 'bg-cherry text-white hover:opacity-90'
                : 'bg-lime text-inverse-text hover:opacity-90'
            }`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}