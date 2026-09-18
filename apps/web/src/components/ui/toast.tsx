'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { IconCheck, IconClose, IconBell } from '../icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { bar: string; icon: React.ReactNode }> = {
  success: {
    bar: 'border-emerald-200 bg-emerald-50',
    icon: <IconCheck size={16} className="text-emerald-600" />,
  },
  error: {
    bar: 'border-red-200 bg-red-50',
    icon: <IconClose size={16} className="text-red-600" />,
  },
  info: {
    bar: 'border-primary-200 bg-primary-50',
    icon: <IconBell size={16} className="text-primary-600" />,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-3), { id, type, title, message }]);
      window.setTimeout(() => dismiss(id), type === 'error' ? 6000 : 4000);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    toast,
    success: (t, m) => toast('success', t, m),
    error: (t, m) => toast('error', t, m),
    info: (t, m) => toast('info', t, m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => {
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex animate-toastIn items-start gap-3 rounded-xl border p-3 shadow-lift ${s.bar}`}
            >
              <div className="mt-0.5 shrink-0">{s.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs text-slate-600">{t.message}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-400 transition hover:text-slate-600"
                aria-label="Cerrar"
              >
                <IconClose size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}