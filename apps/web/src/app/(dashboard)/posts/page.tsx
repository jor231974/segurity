'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

interface Post {
  id: string;
  name: string;
  siteId: string;
  shiftStart: string;
  shiftEnd: string;
  active: boolean;
  site?: { id: string; name: string } | null;
}

const FIELDS: Field[] = [
  { name: 'siteId', label: 'Instalación', type: 'select', required: true },
  { name: 'name', label: 'Nombre del puesto', required: true },
  { name: 'shiftStart', label: 'Inicio de turno (HH:MM)', type: 'time', required: true },
  { name: 'shiftEnd', label: 'Fin de turno (HH:MM)', type: 'time', required: true },
  {
    name: 'active',
    label: 'Activo',
    type: 'select',
    options: [
      { label: 'Sí', value: 'true' },
      { label: 'No', value: 'false' },
    ],
  },
];

export default function PostsPage() {
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
      : f.name === 'active'
        ? { ...f, options: [{ label: 'Sí', value: 'true' }, { label: 'No', value: 'false' }] }
        : f,
  );

  return (
    <>
      <PageHeader
        icon="post"
        title="Puestos"
        subtitle="Puestos de guardia por instalación"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo puesto
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/posts"
        title="Puestos"
        subtitle="Puestos de guardia por instalación"
        emptyText="No hay puestos registrados."
        emptyDescription="Define los puestos de guardia y su horario por instalación."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo puesto
          </button>
        }
        columns={[
          { key: 'name', label: 'Puesto', render: (r: Post) => <span className="font-medium text-slate-900">{r.name}</span> },
          { key: 'site', label: 'Instalación', render: (r: Post) => r.site?.name ?? '—' },
          { key: 'shiftStart', label: 'Turno inicio' },
          { key: 'shiftEnd', label: 'Turno fin' },
          {
            key: 'active',
            label: 'Activo',
            render: (r: Post) =>
              r.active ? (
                <StatusBadge status="activo" />
              ) : (
                <StatusBadge status="inactivo" />
              ),
          },
        ]}
      />
      <EntityModal
        open={open}
        title="Nuevo puesto"
        endpoint="/posts"
        fields={fields}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}