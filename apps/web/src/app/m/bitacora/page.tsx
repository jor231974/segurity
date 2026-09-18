'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface LogEntry {
  id: string;
  description: string;
  createdAt: string;
  post?: { name: string; site?: { name?: string } } | null;
}

export default function MobileBitacora() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/logbook/mine');
      setEntries(res.data ?? res ?? []);
    } catch (e: any) {
      setMsg(e?.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!description.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      await apiFetch('/logbook', {
        method: 'POST',
        body: JSON.stringify({ description: description.trim(), synced: true }),
      });
      setDescription('');
      setForm(false);
      load();
    } catch (e: any) {
      setMsg(e?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Bitácora</h1>
        <button onClick={() => setForm(!form)} className="btn-primary text-sm">
          {form ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {msg && <p className="text-xs text-red-500">{msg}</p>}

      {form && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <textarea
            className="input min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el evento o novedad del puesto…"
          />
          <button onClick={submit} disabled={saving || !description.trim()} className="btn-primary w-full text-sm">
            {saving ? 'Guardando…' : 'Registrar en bitácora'}
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">Sin registros de bitácora.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {new Date(e.createdAt).toLocaleString('es-MX')}
                </span>
                {e.post?.site && <span className="badge bg-slate-100 text-slate-600 text-[10px]">{e.post.site.name}</span>}
              </div>
              <p className="mt-1 text-sm text-slate-700">{e.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}