'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({ toast: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((arg) => {
    const t = typeof arg === 'string' ? { text: arg, kind: 'ok' } : arg;
    const id = Math.random().toString(36).slice(2);
    setToasts(cur => [...cur, { ...t, id }]);
    const duration = t.duration ?? 3500;
    setTimeout(() => {
      setToasts(cur => cur.filter(x => x.id !== id));
    }, duration);
  }, []);

  const dismiss = (id) => setToasts(cur => cur.filter(x => x.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <Toast key={t.id} {...t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ kind = 'ok', text, onClose }) {
  const styles = {
    ok:    { bg: 'bg-success-soft', border: 'border-success', text: 'text-success', icon: CheckCircle2 },
    err:   { bg: 'bg-danger-soft',  border: 'border-danger',  text: 'text-danger',  icon: AlertCircle },
    info:  { bg: 'bg-lime-soft',    border: 'border-lime',    text: 'text-lime',    icon: Info },
  };
  const s = styles[kind] || styles.ok;
  const Icon = s.icon;
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-2xl border-2 shadow-popover backdrop-blur-sm ${s.bg} ${s.border} ${s.text} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span className="text-sm font-semibold flex-1">{text}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition">
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}