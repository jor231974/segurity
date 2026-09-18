'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { IconMapPin, IconPhone } from '@/components/icons';

interface SosAlert {
  id: string;
  status: string;
  notes?: string | null;
  resolution?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  guard?: { firstName: string; lastName: string; phone?: string };
}

export default function SupervisorSos() {
  const toast = useToast();
  const confirm = useConfirm();
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [msg, setMsg] = useState('');
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: SosAlert[] }>('/sos');
      setAlerts(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handle = async (id: string, action: 'ack' | 'close') => {
    if (action === 'close') {
      const ok = await confirm({
        title: 'Cerrar alerta SOS',
        message: '¿Confirmas que la emergencia fue atendida y la alerta puede cerrarse?',
        confirmLabel: 'Cerrar alerta',
        danger: true,
      });
      if (!ok) return;
    }
    setWorkingId(id);
    try {
      await apiFetch(`/sos/${id}/${action === 'ack' ? 'ack' : 'close'}`, { method: 'PUT' });
      toast.success(action === 'ack' ? 'Alerta atendida' : 'Alerta cerrada');
      load();
    } catch (e: any) {
      toast.error('No fue posible actualizar la alerta', e?.message);
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold text-slate-900">Alertas SOS</h1>
      {msg && <p className="text-xs text-red-500">{msg}</p>}

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">Sin alertas registradas.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`rounded-xl border p-3 shadow-sm ${
                a.status === 'activa' ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">
                  {a.guard?.firstName} {a.guard?.lastName}
                </span>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(a.createdAt).toLocaleString('es-MX')}
              </p>
              {a.guard?.phone && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <IconPhone size={12} /> {a.guard.phone}
                </p>
              )}
              {a.latitude && (
                <a
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                >
                  <IconMapPin size={12} /> Ver ubicación
                </a>
              )}
              {a.status === 'activa' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => handle(a.id, 'ack')} disabled={workingId === a.id} className="btn-primary flex-1 text-xs">
                    {workingId === a.id ? 'Procesando…' : 'Atender'}
                  </button>
                  <button onClick={() => handle(a.id, 'close')} disabled={workingId === a.id} className="btn-danger flex-1 text-xs">
                    Cerrar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}