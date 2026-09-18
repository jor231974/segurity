'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Route {
  id: string;
  name: string;
  site: { id: string; name: string };
  post?: { name: string } | null;
  checkpoints?: {
    id: string;
    name: string;
    sequence: number;
    latitude?: number | null;
    longitude?: number | null;
    lastCheckIn?: { timestamp: string; result: string } | null;
  }[];
}

function getPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocalización no disponible'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export default function MobileRondin() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState<Route | null>(null);
  const [working, setWorking] = useState(false);
  const [checkinMsg, setCheckinMsg] = useState('');
  const [done, setDone] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/patrols/routes/mine');
      setRoutes(res.data ?? res ?? []);
      setMsg('');
    } catch (e: any) {
      setMsg(e?.message);
    }
  }, []);

  useEffect(() => {
    load();
    const done = new Set<string>();
    routes.forEach((r) => r.checkpoints?.forEach((c) => { if (c.lastCheckIn) done.add(c.id); }));
    setDone(done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, routes]);

  const checkIn = async (checkpointId: string) => {
    setWorking(true);
    setCheckinMsg('');
    try {
      let pos = { latitude: 0, longitude: 0 };
      try {
        pos = await getPosition();
      } catch {
        // sin GPS, se registra con método manual
      }
      const res = await apiFetch('/patrols/checkin', {
        method: 'POST',
        body: JSON.stringify({ checkpointId, ...pos, method: pos.latitude ? 'gps' : 'manual' }),
      });
      const result = res?.data?.result ?? res?.result ?? 'ok';
      if (result === 'ok') {
        setDone((prev) => new Set(prev).add(checkpointId));
        setCheckinMsg('Rondín registrado correctamente.');
      } else {
        setCheckinMsg(`Registrado, pero estás ${result === 'fuera_de_ruta' ? 'fuera de la ruta' : result}.`);
      }
    } catch (e: any) {
      setCheckinMsg(`Error: ${e?.message || 'no se pudo registrar'}`);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold text-slate-900">Rondín</h1>
      {msg && <p className="text-xs text-red-500">{msg}</p>}

      {routes.length === 0 && !msg ? (
        <p className="text-sm text-slate-400">Cargando rutas…</p>
      ) : (
        <ul className="space-y-2">
          {routes.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <button className="flex w-full items-center justify-between" onClick={() => setSelected(selected?.id === r.id ? null : r)}>
                <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                <span className="text-xs text-primary-600">{selected?.id === r.id ? 'Ocultar' : 'Ver puntos'}</span>
              </button>
              <p className="mt-1 text-xs text-slate-500">{r.site.name}{r.post ? ` · ${r.post.name}` : ''}</p>

              {selected?.id === r.id && (
                <div className="mt-3 space-y-2">
                  {r.checkpoints?.map((c) => (
                    <div key={c.id} className="rounded-lg bg-slate-50 p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">
                          {c.sequence + 1}. {c.name}
                        </span>
                        {done.has(c.id) ? (
                          <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">✓ HECHO</span>
                        ) : (
                          <button
                            onClick={() => checkIn(c.id)}
                            disabled={working}
                            className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                          >
                            {working ? 'Registrando…' : 'Check-in'}
                          </button>
                        )}
                      </div>
                      {c.latitude && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {c.latitude.toFixed(5)}, {c.longitude?.toFixed(5)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {checkinMsg && (
        <p className={`rounded-lg p-2 text-xs ${checkinMsg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {checkinMsg}
        </p>
      )}
    </div>
  );
}