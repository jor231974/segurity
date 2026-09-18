'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface ClientRequest {
  id: string;
  type: string;
  priority: string;
  description: string;
  status: string;
  response?: string | null;
  createdAt: string;
  assignedTo?: { name: string; lastName: string } | null;
}

export default function PortalRequests() {
  const [items, setItems] = useState<ClientRequest[]>([]);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(false);
  const [type, setType] = useState('reporte');
  const [priority, setPriority] = useState('media');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/client-requests/mine');
      setItems(res.data ?? res ?? []);
    } catch (e: any) {
      setMsg(e?.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!description.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/client-requests', {
        method: 'POST',
        body: JSON.stringify({ type, priority, description }),
      });
      setForm(false);
      setDescription('');
      setType('reporte');
      setPriority('media');
      load();
    } catch (e: any) {
      setMsg(e?.message);
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (s: string) =>
    s === 'abierta' ? 'bg-red-100 text-red-700'
    : s === 'en_proceso' ? 'bg-amber-100 text-amber-700'
    : s === 'resuelta' ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-100 text-slate-600';

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Mis solicitudes</h1>
        <button onClick={() => setForm(!form)} className="btn-primary text-sm">
          {form ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>

      {msg && <p className="text-xs text-red-500">{msg}</p>}

      {form && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input">
              <option value="reporte">Reporte</option>
              <option value="queja">Queja</option>
              <option value="sugerencia">Sugerencia</option>
              <option value="servicio">Solicitud de servicio</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Prioridad</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Descripción</label>
            <textarea
              className="input min-h-[90px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu solicitud…"
            />
          </div>
          <button onClick={submit} disabled={saving || !description.trim()} className="btn-primary w-full text-sm">
            {saving ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No tienes solicitudes registradas.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800 capitalize">{r.type}</span>
                <span className={`badge text-[10px] ${statusColor(r.status)}`}>{r.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{r.description}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {new Date(r.createdAt).toLocaleString('es-MX')} · prioridad {r.priority}
                </span>
                {r.assignedTo && (
                  <span className="text-[10px] text-slate-500">
                    Atendido por: {r.assignedTo.name} {r.assignedTo.lastName}
                  </span>
                )}
              </div>
              {r.response && (
                <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                  <span className="font-semibold">Respuesta: </span>{r.response}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}