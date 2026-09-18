'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

interface Contract {
  id: string;
  number: string;
  clientId: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  billingFrequency: string;
  status: string;
  client?: { id: string; commercialName: string } | null;
}

interface ClientOption {
  id: string;
  commercialName: string;
}

const FIELDS: Field[] = [
  { name: 'clientId', label: 'Cliente', type: 'select', required: true },
  { name: 'number', label: 'Número de contrato', required: true },
  { name: 'startDate', label: 'Fecha de inicio', type: 'date', required: true },
  { name: 'endDate', label: 'Fecha de fin', type: 'date', required: true },
  {
    name: 'billingFrequency',
    label: 'Frecuencia de facturación',
    type: 'select',
    options: [
      { label: 'Mensual', value: 'mensual' },
      { label: 'Quincenal', value: 'quincenal' },
      { label: 'Semanal', value: 'semanal' },
    ],
  },
  {
    name: 'status',
    label: 'Estatus',
    type: 'select',
    options: [
      { label: 'Activo', value: 'activo' },
      { label: 'Suspendido', value: 'suspendido' },
      { label: 'Cerrado', value: 'cerrado' },
    ],
  },
];

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function ContractsPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [clients, setClients] = useState<ClientOption[]>([]);

  useEffect(() => {
    apiFetch<any>('/clients?limit=100')
      .then((res: any) => {
        const rows = res?.items ?? (Array.isArray(res) ? res : []);
        setClients(rows.map((c: any) => ({ id: c.id, commercialName: c.commercialName || c.legalName })));
      })
      .catch(() => {});
  }, []);

  const fields = FIELDS.map((f) =>
    f.name === 'clientId'
      ? { ...f, options: clients.map((c) => ({ label: c.commercialName, value: c.id })) }
      : f,
  );

  return (
    <>
      <PageHeader
        icon="contract"
        title="Contratos"
        subtitle="Contratos de servicios de seguridad"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo contrato
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/contracts"
        title="Contratos"
        subtitle="Contratos de servicios de seguridad"
        emptyText="No hay contratos registrados."
        emptyDescription="Crea un contrato para formalizar los servicios de una empresa."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo contrato
          </button>
        }
        columns={[
          { key: 'number', label: 'Contrato', render: (r: Contract) => <span className="font-medium text-slate-900">{r.number}</span> },
          { key: 'client', label: 'Cliente', render: (r: Contract) => r.client?.commercialName ?? '—' },
          { key: 'startDate', label: 'Inicio', render: (r: Contract) => fmtDate(r.startDate) },
          { key: 'endDate', label: 'Fin', render: (r: Contract) => fmtDate(r.endDate) },
          { key: 'billingFrequency', label: 'Facturación' },
          { key: 'autoRenew', label: 'Auto-renovación', render: (r: Contract) => (r.autoRenew ? 'Sí' : 'No') },
          { key: 'status', label: 'Estatus', render: (r: Contract) => <StatusBadge status={r.status} /> },
        ]}
      />
      <EntityModal
        open={open}
        title="Nuevo contrato"
        endpoint="/contracts"
        fields={fields}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}