'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface MapGuard {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  phone?: string;
  lastLocation?: { latitude: number; longitude: number; timestamp: string } | null;
  shifts?: { id: string; status: string; post?: { name: string; site?: { name: string } } }[];
}

export default function SupervisorGuards() {
  const [guards, setGuards] = useState<MapGuard[]>([]);
  const [msg, setMsg] = useState('');
  const [showMap, setShowMap] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/guards/map');
      setGuards(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const online = guards.filter((g) => g.lastLocation);
  const activeShift = guards.filter((g) => g.shifts?.some((s) => s.status === 'activo' || s.status === 'programado'));

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Guardias en campo</h1>
        <button onClick={() => setShowMap(!showMap)} className="btn-secondary text-sm">
          {showMap ? 'Lista' : 'Mapa'}
        </button>
      </div>

      {msg && <p className="text-xs text-red-500">{msg}</p>}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{guards.length}</p>
          <p className="text-xs text-slate-500">Guardias</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{online.length}</p>
          <p className="text-xs text-slate-500">Con ubicación</p>
        </div>
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-primary-600">{activeShift.length}</p>
          <p className="text-xs text-slate-500">Con turno programado/activo</p>
        </div>
      </div>

      {showMap ? (
        <div className="space-y-2">
          {online.length === 0 && <p className="text-sm text-slate-400">Ningún guardia reportó ubicación aún.</p>}
          {online.map((g) => (
            <div key={g.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{g.firstName} {g.lastName}</span>
                <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">EN LÍNEA</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {g.lastLocation!.latitude.toFixed(5)}, {g.lastLocation!.longitude.toFixed(5)}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(g.lastLocation!.timestamp).toLocaleTimeString('es-MX')}
              </p>
              <a
                className="mt-2 inline-block rounded-lg bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps?q=${g.lastLocation!.latitude},${g.lastLocation!.longitude}`}
              >
                Abrir en mapa
              </a>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {guards.map((g) => (
            <li key={g.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{g.firstName} {g.lastName}</span>
                <span className={`badge text-[10px] ${g.lastLocation ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {g.lastLocation ? 'EN LÍNEA' : 'SIN REPORTE'}
                </span>
              </div>
              {g.shifts?.slice(0, 1).map((s) => (
                <div key={s.id} className="mt-1 text-xs text-slate-500">
                  {s.post?.site?.name} · {s.post?.name} · {s.status}
                </div>
              ))}
              {g.phone && <p className="mt-1 text-xs text-slate-400">{g.phone}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}