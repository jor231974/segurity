'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { Icon, IconName, IconChevronRight } from '@/components/icons';

interface SupervisionVisit {
  id: string;
  observations?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  guard?: { firstName: string; lastName: string };
  post?: { name: string };
  checklist?: Record<string, boolean>;
}

interface PositionItem {
  guard?: { id: string; firstName: string; lastName: string; phone?: string };
  lastPosition?: { timestamp: string; latitude: number; longitude: number } | null;
  shift?: { status: string; post?: { name: string; site?: { name: string } } } | null;
}

interface DashboardData {
  guards: { total: number; checkedIn: number };
  coverage: { coveredPosts: number; totalShifts: number; uncoveredPosts: number };
  incidents: { open: number };
  sos: { active: number };
}

const RADAR: { label: string; icon: IconName; tone: string; limit?: (v: number) => boolean }[] = [
  { label: 'Guardias en turno', icon: 'users', tone: 'bg-sky-50 text-sky-600' },
  { label: 'Con conexión', icon: 'gps', tone: 'bg-emerald-50 text-emerald-600' },
  { label: 'Puestos descubiertos', icon: 'post', tone: 'bg-amber-50 text-amber-600', limit: (v) => v > 0 },
  { label: 'Incidencias abiertas', icon: 'incident', tone: 'bg-amber-50 text-amber-600', limit: (v) => v > 0 },
  { label: 'Alertas SOS', icon: 'sos', tone: 'bg-red-50 text-red-600', limit: (v) => v > 0 },
];

export default function SupervisorHome() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<SupervisionVisit[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState(false);
  const [guards, setGuards] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [selectedGuard, setSelectedGuard] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    uniforme: false, equipo: false, presentacion: false, consignas: false, asistencia: false, puesto: false,
  });

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: SupervisionVisit[] }>('/supervision');
      setVisits(res.data ?? []);
    } catch (e: any) {
      setMsg(e?.message);
    }
    try {
      const res = await apiFetch<{ data: PositionItem[] }>('/gps/positions');
      setPositions(res.data ?? []);
    } catch { setPositions([]); }
    try {
      const res = await apiFetch<DashboardData>('/dashboard');
      setDash(res);
    } catch { /* radar parcial */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const online = positions.filter((p) => p.lastPosition).length;
  const radar = [
    { label: 'Guardias en turno', icon: 'users' as IconName, tone: 'bg-sky-50 text-sky-600', value: positions.length, alert: false },
    { label: 'Con conexión', icon: 'gps' as IconName, tone: 'bg-emerald-50 text-emerald-600', value: online, alert: false },
    { label: 'Puestos descubiertos', icon: 'post' as IconName, tone: 'bg-amber-50 text-amber-600', value: dash?.coverage.uncoveredPosts ?? 0, alert: (dash?.coverage.uncoveredPosts ?? 0) > 0 },
    { label: 'Incidencias', icon: 'incident' as IconName, tone: 'bg-amber-50 text-amber-600', value: dash?.incidents.open ?? 0, alert: (dash?.incidents.open ?? 0) > 0 },
    { label: 'Alertas SOS activas', icon: 'sos' as IconName, tone: 'bg-red-50 text-red-600', value: dash?.sos.active ?? 0, alert: (dash?.sos.active ?? 0) > 0 },
  ];

  const openForm = async () => {
    setForm(true);
    try {
      const res = await apiFetch<{ data: { id: string; firstName: string; lastName: string }[] }>('/guards/map');
      setGuards(res.data ?? []);
    } catch { setGuards([]); }
  };

  const submit = async () => {
    if (!selectedGuard) return;
    setSaving(true);
    try {
      const pos = await new Promise<{ latitude: number; longitude: number }>((res, rej) => {
        navigator.geolocation.getCurrentPosition(
          (p) => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          (e) => rej(e), { enableHighAccuracy: true, timeout: 10000 }
        );
      }).catch(() => ({ latitude: 0, longitude: 0 }));

      await apiFetch('/supervision', {
        method: 'POST',
        body: JSON.stringify({ guardId: selectedGuard, observations, ...pos, checklist }),
      });
      setForm(false);
      setSelectedGuard('');
      setObservations('');
      setMsg('');
      load();
    } catch (e: any) {
      setMsg(e?.message || 'No fue posible guardar la visita.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Panel del supervisor</h1>
          <p className="text-xs text-slate-500">{user?.name} {user?.lastName}</p>
        </div>
        <button onClick={openForm} className="btn-primary btn-sm">
          + Nueva visita
        </button>
      </div>

      {msg && <p className="text-xs text-red-500">{msg}</p>}

      {/* Radar operativo */}
      <div className="grid grid-cols-3 gap-2">
        {radar.map((r) => (
          <div key={r.label} className="relative rounded-xl border border-slate-200 bg-white p-3">
            {r.alert && (
              <span className="absolute right-2 top-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
            )}
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${r.tone}`}>
              <Icon name={r.icon} size={16} />
            </div>
            <p className="mt-2 text-xl font-bold text-slate-900">{r.value}</p>
            <p className="text-[10px] leading-tight text-slate-500">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links operación */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/ms/posiciones" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition hover:border-primary-200 hover:bg-primary-50/40">
          <span className="text-sm font-medium text-slate-800">Posiciones</span>
          <IconChevronRight size={15} className="text-slate-400" />
        </Link>
        <Link href="/ms/guardias" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition hover:border-primary-200 hover:bg-primary-50/40">
          <span className="text-sm font-medium text-slate-800">Guardias</span>
          <IconChevronRight size={15} className="text-slate-400" />
        </Link>
        <Link href="/ms/sos" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/50 p-3 transition hover:bg-red-50">
          <span className="text-sm font-medium text-red-700">Alertas SOS</span>
          <Icon name="sos" size={16} className="text-red-500" />
        </Link>
        <Link href="/m" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 transition hover:border-primary-200 hover:bg-primary-50/40">
          <span className="text-sm font-medium text-slate-800">App guardia</span>
          <Icon name="shield" size={16} className="text-slate-400" />
        </Link>
      </div>

      {form && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <h2 className="font-semibold text-slate-800">Registrar visita</h2>
          <select
            className="input"
            value={selectedGuard}
            onChange={(e) => setSelectedGuard(e.target.value)}
          >
            <option value="">Seleccionar guardia…</option>
            {guards.map((g) => (
              <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>
            ))}
          </select>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-600">Checklist</p>
            {Object.entries(checklist).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={v} onChange={(e) => setChecklist({ ...checklist, [k]: e.target.checked })} />
                {k}
              </label>
            ))}
          </div>
          <textarea
            className="input min-h-[80px]"
            placeholder="Observaciones"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving || !selectedGuard} className="btn-primary flex-1 text-sm">
              {saving ? 'Guardando…' : 'Guardar visita'}
            </button>
            <button onClick={() => setForm(false)} className="btn-secondary text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Visitas recientes</h2>
        {visits.length === 0 ? (
          <p className="text-sm text-slate-400">Sin visitas registradas.</p>
        ) : (
          <ul className="space-y-2">
            {visits.map((v) => (
              <li key={v.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    {v.guard?.firstName} {v.guard?.lastName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(v.createdAt).toLocaleString('es-MX')}
                  </span>
                </div>
                {v.post && <p className="mt-1 text-xs text-slate-500">Puesto: {v.post.name}</p>}
                {v.observations && <p className="mt-1 text-xs italic text-slate-600">{v.observations}</p>}
                {v.checklist && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Object.entries(v.checklist).filter(([, val]) => val).map(([k]) => (
                      <span key={k} className="chip text-[10px]">{k}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}