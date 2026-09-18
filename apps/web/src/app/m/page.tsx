'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, AuthUser } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { enqueue, isOnline, syncQueue, onNetworkChange, getQueue } from '@/lib/offline';
import { StatusBadge } from '@/components/status-badge';
import { Icon, IconName, IconMapPin, IconRefresh, IconChevronRight } from '@/components/icons';

interface MyToday {
  records: {
    id: string;
    type: string;
    timestamp: string;
    status?: string | null;
    geofenceResult?: string | null;
    shift?: { post?: { name: string; site?: { name: string } } } | null;
  }[];
  shifts: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    post?: { name: string; site?: { name: string } } | null;
  }[];
}

interface GuardHub {
  guard: { firstName: string; lastName: string; employeeNumber: string };
  currentShift: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    post?: {
      name: string;
      shiftStart: string;
      shiftEnd: string;
      site?: {
        name: string;
        address: string;
        contactName?: string | null;
        contactPhone?: string | null;
        instructions?: string | null;
        latitude?: number | null;
        longitude?: number | null;
      };
    } | null;
  } | null;
}

const ACTIONS: { href: string; label: string; icon: IconName; tone: string; primary?: boolean }[] = [
  { href: '/m/rondin', label: 'Rondín', icon: 'route', tone: 'bg-sky-50 text-sky-600', primary: true },
  { href: '/m/bitacora', label: 'Bitácora', icon: 'log', tone: 'bg-indigo-50 text-indigo-600', primary: true },
  { href: '/m/incidentes', label: 'Incidencias', icon: 'incident', tone: 'bg-amber-50 text-amber-600', primary: true },
  { href: '/m/video', label: 'Video', icon: 'camera', tone: 'bg-slate-100 text-slate-600', primary: true },
  { href: '/m/consignas', label: 'Consignas', icon: 'list', tone: 'bg-violet-50 text-violet-600', primary: true },
  { href: '/m/sos', label: 'SOS', icon: 'sos', tone: 'bg-red-50 text-red-600', primary: true },
];

function getPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocalización no disponible en este dispositivo'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 0,
        }),
      (err) => reject(new Error('No se pudo obtener la ubicación: ' + err.message)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function MobileHome() {
  const { user } = useAuth();
  const [data, setData] = useState<MyToday | null>(null);
  const [hub, setHub] = useState<GuardHub | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [geofenceStatus, setGeofenceStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [pos, setPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [working, setWorking] = useState<'entrada' | 'salida' | 'gps' | null>(null);
  const [offlineMode, setOfflineMode] = useState(!isOnline());
  const [pendingOps, setPendingOps] = useState(0);

  useEffect(() => {
    const update = () => setPendingOps(getQueue().length);
    update();
    const unsub = onNetworkChange(() => {
      setOfflineMode(!isOnline());
      update();
    });
    window.addEventListener('servicom_offline_changed', update);
    return () => {
      unsub();
      window.removeEventListener('servicom_offline_changed', update);
    };
  }, []);

  useEffect(() => {
    if (isOnline()) {
      syncQueue((path, method, body) =>
        apiFetch(path, { method, body: JSON.stringify(body) }),
      )
        .then(() => setPendingOps(getQueue().length))
        .catch(() => {});
    }
  }, [offlineMode]);

  const load = useCallback(async () => {
    try {
      const res: MyToday = await apiFetch('/attendance/my-today');
      setData(res);
    } catch (e: any) {
      setMsg({ tone: 'err', text: e?.message });
    }
    try {
      const hubRes: GuardHub = await apiFetch('/dashboard/guard-hub');
      setHub(hubRes);
    } catch {
      // hub opcional
    }
  }, []);

  useEffect(() => {
    setEnrolled((user as AuthUser | null)?.guardId != null);
    load();
  }, [user, load]);

  useEffect(() => {
    let active = true;
    if (enrolled) {
      navigator.geolocation.getCurrentPosition(
        (p) => { if (active) setPos({ latitude: p.coords.latitude, longitude: p.coords.longitude }); },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
    return () => { active = false; };
  }, [enrolled]);

  async function check(type: 'entrada' | 'salida') {
    setWorking(type);
    setMsg(null);
    setGeofenceStatus(null);
    try {
      const p = await getPosition();
      if (!isOnline()) {
        enqueue('/attendance', 'POST', { type, latitude: p.latitude, longitude: p.longitude, device: 'pwa' });
        setMsg({ tone: 'info', text: 'Sin conexión: se guardó localmente. Se sincronizará automáticamente.' });
        setWorking(null);
        return;
      }
      const res = await apiFetch('/attendance', {
        method: 'POST',
        body: JSON.stringify({ type, latitude: p.latitude, longitude: p.longitude, device: 'pwa' }),
      });
      setGeofenceStatus({
        ok: res?.geofenceResult === 'dentro',
        text:
          res?.geofenceResult === 'dentro'
            ? 'Estás dentro de la zona de tu puesto. Todo en orden.'
            : 'Tu registro se guardó, pero estás fuera de la zona del puesto. Avisa a tu supervisor.',
      });
      if (res?.status === 'fuera_de_horario') {
        setMsg({ tone: 'err', text: 'Registrado, pero se marcó después de la hora de tu turno. Avisa a tu supervisor.' });
      } else if (res?.status === 'salida_anticipada') {
        setMsg({ tone: 'err', text: 'Registrado, pero sales antes de la hora de tu turno. Avisa a tu supervisor.' });
      } else {
        setMsg({
          tone: 'ok',
          text: type === 'entrada' ? 'Tu entrada quedó registrada. ¡Buen turno!' : 'Tu salida quedó registrada. Hasta pronto.',
        });
      }
      await load();
    } catch (e: any) {
      if (isOnline()) setMsg({ tone: 'err', text: e?.message || 'No fue posible registrar. Inténtalo de nuevo.' });
    } finally {
      setWorking(null);
    }
  }

  async function pingGps() {
    setWorking('gps');
    setMsg(null);
    try {
      const p = await getPosition();
      if (!isOnline()) {
        enqueue('/gps/ping', 'POST', p);
        setMsg({ tone: 'info', text: 'Sin conexión: ubicación guardada localmente. Se sincronizará sola.' });
        setWorking(null);
        return;
      }
      await apiFetch('/gps/ping', { method: 'POST', body: JSON.stringify(p) });
      setMsg({ tone: 'ok', text: 'Ubicación enviada. Gracias por mantenerte conectado.' });
    } catch (e: any) {
      if (isOnline()) setMsg({ tone: 'err', text: e?.message || 'No se pudo enviar la ubicación.' });
    } finally {
      setWorking(null);
    }
  }

  function fmt(t: string) {
    return new Date(t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  /** Primera entrada del día (turno en curso). */
const hasCheckedIn = (data?.records ?? []).some((r) => r.type === 'entrada');
/** Último movimiento del día: entrada (activo) o salida. */
const lastRecord = (data?.records ?? []).length > 0 ? data!.records[data!.records.length - 1] : null;
const alreadyCheckedIn = !!lastRecord && lastRecord.type === 'entrada';
const alreadyCheckedOut = !!lastRecord && lastRecord.type === 'salida';

  return (
    <div className="space-y-4 p-4">
      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-5 text-white shadow-lift">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-400/20 blur-2xl" />
        <p className="text-xs font-medium text-slate-300">
          {greeting()}, {user?.name?.split(' ')[0] ?? 'guardia'}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Mi turno</h1>
        {hub?.currentShift ? (
          <div className="relative mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{hub.currentShift.post?.name ?? 'Turno'}</p>
              <p className="truncate text-xs text-slate-300">{hub.currentShift.post?.site?.name}</p>
              <p className="mt-2 badge bg-white/15 text-white ring-1 ring-white/20">
                {hub.currentShift.startTime} – {hub.currentShift.endTime}
              </p>
            </div>
            <StatusBadge status={hub.currentShift.status} />
          </div>
        ) : (
          <p className="relative mt-2 text-sm text-slate-300">No tienes un turno asignado para hoy. Pregunta a tu supervisor si es correcto.</p>
        )}
      </div>

      {/* Sin perfil */}
      {!enrolled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Tu usuario no tiene perfil de guardia asociado. Contacta a tu administrador.
        </div>
      )}

      {/* Avisos */}
      {offlineMode && (
        <div className="rounded-xl border border-slate-200 bg-slate-800 p-3 text-sm text-white">
          Sin conexión — tus registros se guardan localmente y se sincronizan al reconectar.
        </div>
      )}
      {msg && (
        <div
          className={`rounded-xl p-3 text-sm ${
            msg.tone === 'ok'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : msg.tone === 'err'
                ? 'border border-red-200 bg-red-50 text-red-700'
                : 'border border-sky-200 bg-sky-50 text-sky-800'
          }`}
        >
          {msg.text}
        </div>
      )}
      {geofenceStatus && (
        <div
          className={`flex items-center justify-between rounded-xl p-3 text-sm ${
            geofenceStatus.ok
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {geofenceStatus.text}
          <IconMapPin size={16} />
        </div>
      )}

      {/* Entrada / Salida */}
      {enrolled && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Registro de asistencia</h2>
            {alreadyCheckedOut ? (
              <span className="badge bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20">Salida registrada ✓</span>
            ) : alreadyCheckedIn ? (
              <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Entrada registrada ✓</span>
            ) : null}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="btn bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={working !== null || alreadyCheckedIn}
              onClick={() => check('entrada')}
            >
              {working === 'entrada' ? 'Espera tu ubicación…' : alreadyCheckedIn ? 'Entrada ya registrada' : 'Marcar entrada'}
            </button>
            <button
              className="btn bg-slate-800 text-white shadow-sm hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={working !== null || !hasCheckedIn || alreadyCheckedOut}
              onClick={() => check('salida')}
            >
              {working === 'salida' ? 'Espera tu ubicación…' : alreadyCheckedOut ? 'Salida ya registrada' : 'Marcar salida'}
            </button>
          </div>
          {!hasCheckedIn && (
            <p className="mt-2 text-xs text-slate-400">Primero marca tu entrada cuando llegues a tu puesto.</p>
          )}
        </div>
      )}

      {/* Acciones rápidas */}
      {enrolled && (
        <div className="card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Acciones</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-3 transition-all hover:border-primary-200 hover:bg-primary-50/40 active:scale-[0.97]"
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.tone}`}>
                  <Icon name={a.icon} size={19} />
                </span>
                <span className="text-[11px] font-medium leading-tight text-slate-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Asistencia de hoy */}
      <div className="card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Registros de hoy</h2>
        {(data?.records?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Aún no hay registros de asistencia hoy.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {data!.records.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      r.type === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'
                    }`}
                  >
                    <Icon name={r.type === 'entrada' ? 'shield' : 'clock'} size={14} />
                  </span>
                  <div>
                    <p className={`font-medium ${r.type === 'entrada' ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {r.type === 'entrada' ? 'Entrada' : 'Salida'}
                    </p>
                    <p className="text-xs text-slate-400">{r.shift?.post?.name ?? ''}</p>
                  </div>
                </span>
                <span className="text-sm font-medium text-slate-600">{fmt(r.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ubicación */}
      {enrolled && (
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mi ubicación</h2>
            {pos ? (
              <span className="text-xs text-slate-400">
                {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Obteniendo coordenadas…</span>
            )}
          </div>
          <button
            className="btn-primary mt-3 w-full"
            disabled={working !== null}
            onClick={pingGps}
          >
            {working === 'gps' ? (
              <IconRefresh size={16} className="animate-spin" />
            ) : (
              <IconMapPin size={16} />
            )}
            Enviar ubicación al centro de monitoreo
          </button>
        </div>
      )}

      {/* Pendientes offline */}
      {pendingOps > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {pendingOps} registro(s) pendientes de sincronizar.
          {isOnline() && (
            <button
              className="ml-2 inline-flex items-center gap-1 font-semibold underline"
              onClick={async () => {
                await syncQueue((path, method, body) =>
                  apiFetch(path, { method, body: JSON.stringify(body) }),
                );
                setPendingOps(getQueue().length);
                load();
              }}
            >
              Sincronizar ahora <IconChevronRight size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}