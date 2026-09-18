'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { IconClose } from '@/components/icons';
import { useToast } from '@/components/ui/toast';

export interface Field {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'date' | 'time' | 'textarea' | 'password' | 'select';
  options?: { label: string; value: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
}

interface EntityModalProps {
  open: boolean;
  title: string;
  description?: string;
  endpoint: string;
  fields: Field[];
  initial?: Record<string, any>;
  onClose: () => void;
  onSaved?: () => void;
  successMessage?: string;
}

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('401')) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (lower.includes('403')) return 'No tienes permisos para realizar esta acción.';
  if (lower.includes('409') || lower.includes('ya existe') || lower.includes('duplicado') || lower.includes('unique'))
    return 'Ya existe un registro con esos datos. Verifica la información.';
  if (lower.includes('400')) return 'Algunos datos no son válidos. Revisa los campos marcados.';
  if (lower.includes('404')) return 'No se encontró el registro solicitado.';
  if (lower.includes('fetch failed') || lower.includes('network') || lower.includes('failed to fetch'))
    return 'No hay conexión con el servidor. Verifica tu conexión e inténtalo de nuevo.';
  if (lower.includes('429')) return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
  return 'No fue posible guardar la información. Verifica los datos e inténtalo nuevamente.';
}

export function EntityModal({ open, title, description, endpoint, fields, initial, onClose, onSaved, successMessage }: EntityModalProps) {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};
    for (const f of fields) v[f.name] = initial?.[f.name] ?? '';
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function set(name: string, val: any) {
    setValues((prev) => ({ ...prev, [name]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      onSaved?.();
      onClose();
      toast.success(successMessage ?? 'Registro guardado correctamente.');
    } catch (err: any) {
      const msg = err?.message || 'Error al guardar';
      setError(friendlyError(msg));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex animate-fadeIn items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg animate-slideIn flex-col overflow-hidden rounded-2xl bg-white shadow-lift"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <IconClose size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            {fields.map((f) => (
              <div key={f.name}>
                <label className="label" htmlFor={f.name}>
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={f.name}
                    className="input"
                    rows={3}
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    required={f.required}
                  />
                ) : f.type === 'select' ? (
                  <select
                    id={f.name}
                    className="input"
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    required={f.required}
                  >
                    <option value="">Seleccionar…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={f.name}
                    type={f.type || 'text'}
                    className="input"
                    value={values[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    required={f.required}
                  />
                )}
                {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/50 px-6 py-4">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}