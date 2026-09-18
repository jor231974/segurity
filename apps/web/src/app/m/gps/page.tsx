'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function MobileGps() {
  const [pos, setPos] = useState<{ latitude: number; longitude: number; accuracy: number; ts: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    navigator.geolocation.getCurrentPosition(
      (p) => { if (active) setPos({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy || 0, ts: new Date().toISOString() }); },
      (err) => setMsg('No se pudo obtener ubicación: ' + err.message),
      { enableHighAccuracy: true, timeout: 15000 },
    );
    return () => { active = false; };
  }, []);

  async function send() {
    setWorking(true);
    setMsg(null);
    try {
      await apiFetch('/gps/ping', { method: 'POST', body: JSON.stringify(pos) });
      setMsg('Ubicación enviada al centro de monitoreo ✓');
    } catch (e: any) {
      setMsg(e?.message || 'Error');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-3 p-4">
      <h1 className="text-lg font-bold text-slate-900">Mi ubicación</h1>

      {msg && <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{msg}</div>}

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Coordenadas actuales</h2>
        {pos ? (
          <>
            <p className="text-2xl font-bold text-slate-900">{pos.latitude.toFixed(6)}</p>
            <p className="text-2xl font-bold text-slate-900">{pos.longitude.toFixed(6)}</p>
            <p className="mt-2 text-xs text-slate-500">Precisión: ±{Math.round(pos.accuracy)} m</p>
            <p className="text-xs text-slate-500">Actualizado: {new Date(pos.ts).toLocaleTimeString('es-MX')}</p>
            <button className="btn-primary mt-4 w-full" disabled={working} onClick={send}>
              {working ? 'Enviando…' : 'Enviar al monitoreo'}
            </button>
          </>
        ) : (
          <p className="text-sm text-slate-400">Obteniendo coordenadas…</p>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Esta ubicación se envía también automáticamente al registrar entrada y salida, y valida que estés dentro de la geocerca del sitio.
      </p>
    </div>
  );
}