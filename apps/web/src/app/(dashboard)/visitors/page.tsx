'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/page-header';

interface Visitor {
  id: string;
  fullName: string;
  identification?: string | null;
  companyName?: string | null;
  personVisited?: string | null;
  vehiclePlate?: string | null;
  entryAt: string;
  exitAt?: string | null;
  site?: { id: string; name: string } | null;
  guard?: { id: string; firstName: string; lastName: string } | null;
}

const FIELDS: Field[] = [
  { name: 'siteId', label: 'Instalación', type: 'select', required: true },
  { name: 'fullName', label: 'Nombre completo', required: true },
  { name: 'identification', label: 'Identificación' },
  { name: 'companyName', label: 'Empresa del visitante' },
  { name: 'personVisited', label: 'Persona a visitar' },
  { name: 'vehiclePlate', label: 'Placa del vehículo' },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

function fmtDt(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function VisitorsPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [sites, setSites] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    apiFetch<any>('/sites')
      .then((res: any) => {
        const rows = Array.isArray(res) ? res : [];
        setSites(rows.map((s: any) => ({ id: s.id, label: s.name })));
      })
      .catch(() => {});
  }, []);

  const fields = FIELDS.map((f) =>
    f.name === 'siteId'
      ? { ...f, options: sites.map((s) => ({ label: s.label, value: s.id })) }
      : f,
  );

  return (
    <>
      <PageHeader
        icon="visitors"
        title="Visitantes"
        subtitle="Control de accesos de visitantes por instalación"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Registrar visita
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/visitors"
        title="Visitantes"
        subtitle="Control de accesos de visitantes por instalación"
        emptyText="No hay visitantes registrados."
        emptyDescription="Registra las entradas de visitantes a cada instalación."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Registrar visita
          </button>
        }
        columns={[
          { key: 'fullName', label: 'Visitante', render: (r: Visitor) => <span className="font-medium text-slate-900">{r.fullName}</span> },
          { key: 'companyName', label: 'Empresa' },
          { key: 'personVisited', label: 'Persona a visitar' },
          { key: 'site', label: 'Instalación', render: (r: Visitor) => r.site?.name ?? '—' },
          {
            key: 'entryAt',
            label: 'Entrada',
            render: (r: Visitor) =>
              r.exitAt ? (
                <span>
                  {fmtDt(r.entryAt)} → {fmtDt(r.exitAt)}
                </span>
              ) : (
                <span className="badge bg-green-100 text-green-700">Dentro · {fmtDt(r.entryAt)}</span>
              ),
          },
        ]}
      />
      <EntityModal
        open={open}
        title="Registrar visita"
        endpoint="/visitors"
        fields={fields}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}