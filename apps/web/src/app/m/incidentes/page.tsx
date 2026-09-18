'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Incident {
  id: string;
  typeName?: string | null;
  severity: string;
  status: string;
  description: string;
  createdAt: string;
}

function getPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve({ latitude: 0, longitude: 0 });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({ latitude: 0, longitude: 0 }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

export default function MobileIncidentes() {
  const [items, setItems] = useState<Incident[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('media');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/incidents/mine');
      setItems(res.data ?? res ?? []);
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
      const pos = await getPosition();
      await apiFetch('/incidents', {
        method: 'POST',
        body: JSON.stringify({ description: description.trim(), severity, typeName: 'otra', ...pos, synced: true }),
      });
      setDescription('');
      setSeverity('media');
      setForm(false);
      load();
    } catch (e: any) {
      setMsg(e?.message);
    } finally {
      setSaving(false);
    }
  };

  const sevColor = (s: string) =>
    s === 'alta' ? 'bg-red-100 text-red-700'
    : s === 'media' ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-600';

  const statusColor = (s: string) =>
    s === 'abierta' ? 'bg-red-100 text-red-700'
    : s === 'en_proceso' ? 'bg-amber-100 text-amber-700'
    : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Incidencias</h1>
        <button onClick={() => setForm(!form)} className="btn-primary text-sm">
          {form ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {msg && <p className="text-xs text-red-500">{msg}</p>}

      {form && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Severidad</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <textarea
            className="input min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe la incidencia…"
          />
          <button onClick={submit} disabled={saving || !description.trim()} className="btn-primary w-full text-sm">
            {saving ? 'Guardando…' : 'Reportar incidencia'}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Sin incidencias registradas.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className={`badge text-[10px] ${sevColor(i.severity)}`}>{i.severity}</span>
                <span className={`badge text-[10px] ${statusColor(i.status)}`}>{i.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-700">{i.description}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {i.typeName ?? 'otra'} · {new Date(i.createdAt).toLocaleString('es-MX')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}