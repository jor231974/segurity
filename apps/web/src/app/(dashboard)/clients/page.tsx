'use client';

import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

interface Client {
  id: string;
  legalName: string;
  commercialName: string;
  rfc?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: string;
  contracts?: any[];
  _count?: { sites: number; contracts: number };
}

const FIELDS: Field[] = [
  { name: 'legalName', label: 'Razón social', required: true },
  { name: 'commercialName', label: 'Nombre comercial', required: true },
  { name: 'rfc', label: 'RFC', required: true },
  { name: 'email', label: 'Email de contacto', type: 'email' },
  { name: 'phone', label: 'Teléfono', type: 'text' },
  { name: 'address', label: 'Dirección', type: 'textarea' },
  {
    name: 'status',
    label: 'Estatus',
    type: 'select',
    options: [
      { label: 'Activo', value: 'activo' },
      { label: 'Inactivo', value: 'inactivo' },
      { label: 'Suspendido', value: 'suspendido' },
    ],
  },
];

export default function ClientsPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <>
      <PageHeader
        icon="building"
        title="Clientes"
        subtitle="Empresas atendidas"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo cliente
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/clients"
        title="Clientes"
        subtitle="Empresas atendidas"
        emptyText="No hay clientes registrados."
        emptyDescription="Registra una empresa para crear sus contratos y servicios."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo cliente
          </button>
        }
        columns={[
          { key: 'commercialName', label: 'Nombre comercial', render: (r: Client) => <span className="font-medium text-slate-900">{r.commercialName}</span> },
          { key: 'legalName', label: 'Razón social' },
          { key: 'rfc', label: 'RFC' },
          { key: 'phone', label: 'Teléfono' },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Estatus', render: (r: Client) => <StatusBadge status={r.status} /> },
          { key: 'siteCount', label: 'Sitios', render: (r: Client) => r._count?.sites ?? 0 },
        ]}
      />
      <EntityModal
        open={open}
        title="Nuevo cliente"
        endpoint="/clients"
        fields={FIELDS}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}