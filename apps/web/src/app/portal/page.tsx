'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, IconName, IconChevronRight, IconPhone } from '@/components/icons';

interface PortalData {
  commercialName: string;
  legalName: string;
  rfc?: string;
  status: string;
  contacts?: { name: string; position?: string; phone?: string; email?: string; isPrimary?: boolean }[];
  contracts?: { number: string; status: string; billingFrequency: string; services?: { name: string; guardCount: number }[] }[];
  sites?: { id: string; name: string; address: string; posts: { id: string; name: string; shiftStart: string; shiftEnd: string }[] }[];
  _count?: { contracts: number; sites: number; requests: number };
}

const TILES: { label: string; icon: IconName; tone: string }[] = [
  { label: 'Contratos', icon: 'contract', tone: 'text-primary-600 bg-primary-50' },
  { label: 'Instalaciones', icon: 'site', tone: 'text-sky-600 bg-sky-50' },
  { label: 'Solicitudes', icon: 'mail', tone: 'text-violet-600 bg-violet-50' },
];

export default function PortalHome() {
  const [data, setData] = useState<PortalData | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<PortalData>('/clients/mine');
      setData(res);
    } catch (e: any) {
      setMsg(e?.message || 'No fue posible cargar la información de tu cuenta.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const primaryContact = data?.contacts?.find((c) => c.isPrimary) ?? data?.contacts?.[0];

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      {msg && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{msg}</div>}

      {loading && (
        <div className="space-y-4">
          <div className="card"><div className="skeleton h-6 w-40" /><div className="skeleton mt-2 h-3 w-56" /></div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-3"><div className="skeleton h-6 w-10" /><div className="skeleton mt-2 h-3 w-14" /></div>)}
          </div>
          <div className="card"><div className="skeleton h-24 w-full" /></div>
        </div>
      )}

      {data && (
        <>
          {/* Empresa */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-50" />
            <div className="relative">
              <p className="text-xs font-medium text-slate-400">Mi empresa</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{data.commercialName}</h1>
              <p className="mt-0.5 text-xs text-slate-500">{data.legalName}{data.rfc ? ` · RFC ${data.rfc}` : ''}</p>
              <div className="mt-3">
                <StatusBadge status={data.status === 'activo' ? 'activo' : data.status} />
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-3 gap-2">
            {TILES.map((t, i) => {
              const value = i === 0 ? (data._count?.contracts ?? 0) : i === 1 ? (data._count?.sites ?? 0) : (data._count?.requests ?? 0);
              return (
                <div key={t.label} className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-card">
                  <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg ${t.tone}`}>
                    <Icon name={t.icon} size={17} />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{t.label}</p>
                </div>
              );
            })}
          </div>

          {/* Acciones principales */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/portal/solicitudes" className="btn-primary !justify-start btn-lg">
              <Icon name="mail" size={17} /> Nueva solicitud
            </Link>
            <Link href="/portal/sitios" className="btn-secondary !justify-start btn-lg">
              <Icon name="site" size={17} /> Mis sitios
            </Link>
          </div>

          {/* Servicios */}
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Servicios contratados</h2>
              <Link href="/portal/sitios" className="flex items-center text-xs font-medium text-primary-600 hover:underline">
                Detalle <IconChevronRight size={12} />
              </Link>
            </div>
            {(data.contracts?.length ?? 0) === 0 ? (
              <EmptyState icon="contract" title="Sin contratos vigentes" description="Cuando tengas un servicio contratado lo verás aquí." />
            ) : (
              <ul className="mt-3 space-y-2">
                {data.contracts?.map((c) => (
                  <li key={c.number} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{c.number}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">Facturación: {c.billingFrequency}</p>
                    {c.services?.map((s) => (
                      <div key={s.name} className="mt-2 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                        <span className="text-xs font-medium text-slate-700">{s.name}</span>
                        <span className="chip">{s.guardCount} guardia(s)</span>
                      </div>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Instalaciones */}
          <div className="card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Mis instalaciones</h2>
            {(data.sites?.length ?? 0) === 0 ? (
              <EmptyState icon="site" title="Sin instalaciones registradas" />
            ) : (
              <ul className="mt-3 space-y-2">
                {data.sites?.map((s) => (
                  <li key={s.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.address}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.posts.map((p) => (
                        <span key={p.id} className="chip">
                          {p.name} · {p.shiftStart}–{p.shiftEnd}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contacto */}
          {primaryContact && (
            <div className="card flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <IconPhone size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Contacto principal</p>
                <p className="text-sm font-semibold text-slate-800">
                  {primaryContact.name}{primaryContact.position ? ` · ${primaryContact.position}` : ''}
                </p>
                {primaryContact.phone && <p className="text-xs text-slate-500">{primaryContact.phone}</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}