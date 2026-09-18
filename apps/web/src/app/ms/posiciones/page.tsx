'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface PositionItem {
  guard?: { id: string; firstName: string; lastName: string };
  lastPosition?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  } | null;
  shift?: {
    status: string;
    post?: { name: string; site?: { name: string } };
  } | null;
}

export default function SupervisorPositions() {
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/gps/positions');
      setPositions(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const online = positions.filter((p) => p.lastPosition);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold text-slate-900">Posiciones en tiempo real</h1>
      {msg && <p className="text-xs text-red-500">{msg}</p>}
      {positions.length === 0 ? (
        <p className="text-sm text-slate-400">Sin guardias en turno.</p>
      ) : (
        <ul className="space-y-2">
          {positions.map((p) => {
            const inService = p.lastPosition !== null;
            return (
              <li key={p.guard?.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">
                    {p.guard?.firstName} {p.guard?.lastName}
                  </span>
                  <span className={`badge text-[10px] ${inService ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {inService ? 'EN LÍNEA' : 'SIN REPORTE'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {p.shift?.post?.site?.name} · {p.shift?.post?.name} · {p.shift?.status}
                </p>
                {inService ? (
                  <>
                    <p className="mt-1 text-xs text-slate-500">
                      {p.lastPosition!.latitude.toFixed(5)}, {p.lastPosition!.longitude.toFixed(5)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Actualizado {new Date(p.lastPosition!.timestamp).toLocaleTimeString('es-MX')}
                    </p>
                    <a
                      className="mt-2 inline-block rounded-lg bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps?q=${p.lastPosition!.latitude},${p.lastPosition!.longitude}`}
                    >
                      Abrir en mapa
                    </a>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">Aún no reporta ubicación esta hora de turno.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}