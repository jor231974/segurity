'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { KpiCard } from '@/components/ui/kpi-card';
import { Donut } from '@/components/ui/donut';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/status-badge';
import { IconChevronRight, IconSun, IconDocument, IconWallet, Icon, IconName } from '@/components/icons';

interface DashboardData {
  date: string;
  guards: { total: number; assignedToday: number; checkedIn: number };
  coverage: { coveredPosts: number; totalShifts: number; uncoveredPosts: number };
  incidents: { open: number };
  sos: { active: number };
  clients: { total: number };
  services: { total: number };
  alerts: { expiringDocuments: number; overdueInvoices: number; outstandingAmount: number };
  activeShifts: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    guard?: { firstName: string; lastName: string; employeeNumber: string } | null;
    post?: { name: string; site?: { name: string } | null } | null;
  }[];
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const QUICK_LINKS: { href: string; label: string; icon: IconName; desc: string }[] = [
  { href: '/sos', label: 'Alertas SOS', icon: 'sos', desc: 'Monitorear alertas activas' },
  { href: '/incidents', label: 'Incidencias', icon: 'incident', desc: 'Incidencias abiertas' },
  { href: '/shifts', label: 'Turnos', icon: 'shifts', desc: 'Cobertura del día' },
  { href: '/guards', label: 'Guardias', icon: 'users', desc: 'Personal en campo' },
  { href: '/video', label: 'Video', icon: 'camera', desc: 'Grabaciones por turno' },
  { href: '/prepayroll', label: 'Pre-nómina', icon: 'payroll', desc: 'Corte del periodo' },
  { href: '/reports', label: 'Reportes', icon: 'report', desc: 'Reportes operativos' },
  { href: '/visitors', label: 'Visitantes', icon: 'visitors', desc: 'Ingresos en sitio' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>('/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const coveragePct = useMemo(() => {
    if (!data || data.coverage.totalShifts === 0) return 0;
    return Math.round((data.coverage.coveredPosts / data.coverage.totalShifts) * 100);
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {data ? fmtDate(data.date) : 'Cargando fecha…'}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
            {greeting()}, {user?.name?.split(' ')[0] ?? ''}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">Resumen operativo de tu empresa</p>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-card sm:flex">
          <IconSun size={14} className="text-amber-500" />
          <span>{new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {!data && !error && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton mt-3 h-8 w-14" />
              <div className="skeleton mt-3 h-3 w-32" />
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Guardias"
              value={data.guards.total}
              sub={`${data.guards.checkedIn} con entrada · ${data.guards.assignedToday} en turno hoy`}
              tone="primary"
              icon="users"
              href="/guards"
            />
            <KpiCard
              label="Cobertura de turnos"
              value={`${data.coverage.coveredPosts}/${data.coverage.totalShifts}`}
              sub={data.coverage.uncoveredPosts > 0 ? `${data.coverage.uncoveredPosts} puesto(s) sin cubrir` : 'Cobertura completa ✓'}
              tone={data.coverage.uncoveredPosts > 0 ? 'warning' : 'success'}
              icon="shifts"
              href="/shifts"
            />
            <KpiCard
              label="Incidencias"
              value={data.incidents.open}
              sub={data.incidents.open === 0 ? 'Sin incidencias pendientes' : 'Requieren atención'}
              tone={data.incidents.open > 0 ? 'warning' : 'neutral'}
              icon="incident"
              href="/incidents"
            />
            <KpiCard
              label="Alertas SOS"
              value={data.sos.active}
              sub={data.sos.active === 0 ? 'Sin alertas activas' : '¡Atender de inmediato!'}
              tone={data.sos.active > 0 ? 'danger' : 'neutral'}
              icon="sos"
              href="/sos"
              alert={data.sos.active > 0}
            />
          </div>

          {/* Alertas administrativas */}
          {(data.alerts.expiringDocuments > 0 || data.alerts.overdueInvoices > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.alerts.expiringDocuments > 0 && (
                <div className="card flex items-center gap-4 border-amber-200 bg-amber-50/60">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <IconDocument size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {data.alerts.expiringDocuments} documento(s) por vencer
                    </p>
                    <p className="text-xs text-slate-500">Revisa licencias y certificaciones próximas a caducar.</p>
                  </div>
                  <Link href="/guards" className="shrink-0 text-xs font-medium text-amber-700 hover:underline">
                    Revisar
                  </Link>
                </div>
              )}
              {data.alerts.overdueInvoices > 0 && (
                <div className="card flex items-center gap-4 border-red-200 bg-red-50/60">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                    <IconWallet size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {data.alerts.overdueInvoices} factura(s) con saldo pendiente
                    </p>
                    <p className="text-xs text-slate-500">
                      Saldo total: ${(data.alerts.outstandingAmount ?? 0).toLocaleString('es-MX')} MXN.
                    </p>
                  </div>
                  <Link href="/billing" className="shrink-0 text-xs font-medium text-red-700 hover:underline">
                    Cobranza
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Cobertura + operación */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cobertura del día</h3>
              <div className="mt-4 flex items-center justify-center">
                <Donut
                  value={data.coverage.coveredPosts}
                  total={data.coverage.totalShifts}
                  label={`${coveragePct}%`}
                  sublabel="cubierto"
                  color={coveragePct === 100 ? '#059669' : '#3558c9'}
                />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Puestos cubiertos
                  </span>
                  <span className="font-semibold text-slate-900">{data.coverage.coveredPosts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Puestos sin cubrir
                  </span>
                  <span className="font-semibold text-slate-900">{data.coverage.uncoveredPosts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Turnos del día
                  </span>
                  <span className="font-semibold text-slate-900">{data.coverage.totalShifts}</span>
                </div>
              </div>
            </div>

            <div className="card lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Turnos de hoy</h3>
                <Link href="/shifts" className="flex items-center text-xs font-medium text-primary-600 hover:underline">
                  Ver todos <IconChevronRight size={13} />
                </Link>
              </div>
              {data.activeShifts.length === 0 ? (
                <EmptyState
                  icon="shifts"
                  title="No hay turnos registrados hoy"
                  description="Programa turnos para ver aquí la operación del día."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.activeShifts.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{s.post?.name ?? 'Turno'}</p>
                        <p className="truncate text-xs text-slate-500">
                          {s.post?.site?.name} · {s.guard ? `${s.guard.firstName} ${s.guard.lastName}` : 'Sin asignar'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge bg-slate-100 text-slate-600">
                          {s.startTime} – {s.endTime}
                        </span>
                        <StatusBadge status={s.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Clientes + accesos */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Accesos directos</h3>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUICK_LINKS.map((q) => (
                  <Link
                    key={q.href}
                    href={q.href}
                    className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 p-3 transition-all hover:border-primary-200 hover:bg-primary-50/40 hover:shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-primary-100 group-hover:text-primary-600">
                      <Icon name={q.icon} size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{q.label}</p>
                      <p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">{q.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Clientes y servicios</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="text-sm text-slate-600">Clientes activos</span>
                  <span className="text-lg font-bold text-slate-900">{data.clients.total}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="text-sm text-slate-600">Servicios contratados</span>
                  <span className="text-lg font-bold text-slate-900">{data.services.total}</span>
                </div>
                <div className="mt-2 space-y-1">
                  <Link href="/clients" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-primary-600 hover:bg-primary-50 hover:underline">
                    Ver clientes <IconChevronRight size={14} />
                  </Link>
                  <Link href="/contracts" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-primary-600 hover:bg-primary-50 hover:underline">
                    Ver contratos <IconChevronRight size={14} />
                  </Link>
                  <Link href="/supervision" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-primary-600 hover:bg-primary-50 hover:underline">
                    Supervisión de campo <IconChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}