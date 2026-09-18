'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

export default function MobileSos() {
  const router = useRouter();
  const { user } = useAuth();
  const [pos, setPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    setEnrolled((user as any)?.guardId != null);
  }, [user]);

  async function activate() {
    if (!enrolled) {
      setMsg('Tu usuario no tiene perfil de guardia. No puedes activar SOS.');
      return;
    }
    setWorking(true);
    setMsg(null);
    try {
      const p = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          (err) => reject(new Error('No se pudo obtener la ubicación: ' + err.message)),
          { enableHighAccuracy: true, timeout: 15000 },
        );
      });
      setPos(p);
      await apiFetch('/sos', {
        method: 'POST',
        body: JSON.stringify({ latitude: p.latitude, longitude: p.longitude, message: 'SOS desde PWA móvil' }),
      });
      setMsg('¡Alerta SOS enviada! El monitoreo ha sido notificado de tu ubicación.');
    } catch (e: any) {
      setMsg(e?.message || 'Error al activar SOS');
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-3 p-4">
      <h1 className="text-lg font-bold text-slate-900">Alerta SOS</h1>

      {msg && <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">{msg}</div>}

      {enrolled ? (
        <div className="card bg-red-50 text-center">
          <p className="mb-3 text-sm text-red-700">
            Activa esta alerta solo en una situación de emergencia. Se notificará a monitores, supervisores y administración con tu ubicación actual.
          </p>
          <button
            className="btn-danger w-full py-4 text-lg"
            disabled={working}
            onClick={activate}
          >
            {working ? 'Enviando…' : '🆘 ACTIVAR ALERTA SOS'}
          </button>
          {pos && (
            <p className="mt-3 text-xs text-red-600">
              Ubicación: {pos.latitude.toFixed(6)}, {pos.longitude.toFixed(6)}
            </p>
          )}
        </div>
      ) : (
        <div className="card">
          <p className="text-sm text-slate-500">
            Tu usuario no está vinculado a un guardia. Contacta al administrador para activar esta función.
          </p>
          <button className="btn-secondary mt-3" onClick={() => router.push('/m')}>
            Volver
          </button>
        </div>
      )}
    </div>
  );
}