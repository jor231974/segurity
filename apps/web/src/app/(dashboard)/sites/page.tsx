'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/page-header';

interface Site {
  id: string;
  name: string;
  clientId: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  client?: { id: string; commercialName: string } | null;
  posts?: any[];
}

const FIELDS: Field[] = [
  { name: 'clientId', label: 'Cliente', type: 'select', required: true },
  { name: 'name', label: 'Nombre del sitio', required: true },
  { name: 'address', label: 'Dirección', type: 'textarea', required: true },
  { name: 'latitude', label: 'Latitud (-90 a 90)', type: 'number' },
  { name: 'longitude', label: 'Longitud (-180 a 180)', type: 'number' },
  { name: 'geofenceRadiusMeters', label: 'Radio de geocerca (m, 10–5000)', type: 'number' },
  { name: 'schedule', label: 'Horario del sitio' },
  { name: 'contactName', label: 'Contacto' },
  { name: 'contactPhone', label: 'Teléfono de contacto' },
  { name: 'instructions', label: 'Instrucciones', type: 'textarea' },
];

export default function SitesPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [clients, setClients] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    apiFetch<any>('/clients?limit=100')
      .then((res: any) => {
        const rows = res?.items ?? (Array.isArray(res) ? res : []);
        setClients(rows.map((c: any) => ({ id: c.id, label: c.commercialName || c.legalName })));
      })
      .catch(() => {});
  }, []);

  const fields = FIELDS.map((f) =>
    f.name === 'clientId'
      ? { ...f, options: clients.map((c) => ({ label: c.label, value: c.id })) }
      : f,
  );

  return (
    <>
      <PageHeader
        icon="site"
        title="Instalaciones"
        subtitle="Sitios donde se presta el servicio"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nueva instalación
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/sites"
        title="Instalaciones"
        subtitle="Sitios donde se presta el servicio"
        emptyText="No hay instalaciones registradas."
        emptyDescription="Registra la ubicación física donde se presta el servicio."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nueva instalación
          </button>
        }
        columns={[
          { key: 'name', label: 'Sitio', render: (r: Site) => <span className="font-medium text-slate-900">{r.name}</span> },
          { key: 'client', label: 'Cliente', render: (r: Site) => r.client?.commercialName ?? '—' },
          { key: 'address', label: 'Dirección' },
          { key: 'contactName', label: 'Contacto' },
          { key: 'contactPhone', label: 'Teléfono' },
          { key: 'posts', label: 'Puestos', render: (r: Site) => r.posts?.length ?? 0 },
        ]}
      />
      <EntityModal
        open={open}
        title="Nueva instalación"
        endpoint="/sites"
        fields={fields}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}