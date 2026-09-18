'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { IconAlert } from '../icons';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => setState({ ...options, resolve }));
  }, []);

  const close = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[90] flex animate-fadeIn items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-sm animate-slideIn rounded-2xl bg-white p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  state.danger ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'
                }`}
              >
                {state.danger ? <IconAlert size={18} /> : <IconAlert size={18} />}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">{state.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{state.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary btn-sm" onClick={() => close(false)}>
                Cancelar
              </button>
              <button
                className={state.danger ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}
                onClick={() => close(true)}
              >
                {state.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx.confirm;
}