'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

interface Guard {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  hireDate: string;
  zone?: { id: string; name: string } | null;
  supervisor?: { firstName: string; lastName: string } | null;
  _count?: { shifts: number; documents: number };
}

const FIELDS: Field[] = [
  { name: 'employeeNumber', label: 'No. de empleado', required: true },
  { name: 'firstName', label: 'Nombre(s)', required: true },
  { name: 'lastName', label: 'Apellido paterno', required: true },
  { name: 'middleName', label: 'Apellido materno' },
  { name: 'email', label: 'Email (genera usuario)', type: 'email' },
  { name: 'phone', label: 'Teléfono' },
  { name: 'address', label: 'Dirección' },
  { name: 'hireDate', label: 'Fecha de contratación', type: 'date', required: true },
  { name: 'curp', label: 'CURP' },
  { name: 'rfc', label: 'RFC' },
  { name: 'nss', label: 'NSS' },
  { name: 'zoneId', label: 'Zona', type: 'select' },
  { name: 'supervisorId', label: 'Supervisor', type: 'select' },
];

export default function GuardsPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [zones, setZones] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    apiFetch<any>('/sites')
      .then(() => {})
      .catch(() => {});
  }, []);

  const fields = FIELDS.map((f) =>
    f.name === 'zoneId'
      ? { ...f, options: zones.map((z) => ({ label: z.label, value: z.id })) }
      : f,
  );

  return (
    <>
      <PageHeader
        icon="users"
        title="Guardias / Elementos"
        subtitle="Personal de seguridad asignado"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo guardia
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/guards"
        title="Guardias / Elementos"
        subtitle="Personal de seguridad asignado"
        emptyText="No hay guardias registrados."
        emptyDescription="Registra a tu primer elemento para poder asignarlo a turnos."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo guardia
          </button>
        }
        columns={[
          { key: 'employeeNumber', label: 'No.', render: (r: Guard) => <span className="font-medium text-slate-900">{r.employeeNumber}</span> },
          { key: 'firstName', label: 'Nombre', render: (r: Guard) => `${r.firstName} ${r.lastName}` },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Teléfono' },
          { key: 'zone', label: 'Zona', render: (r: Guard) => r.zone?.name ?? '—' },
          { key: 'status', label: 'Estatus', render: (r: Guard) => <StatusBadge status={r.status} /> },
          { key: 'hireDate', label: 'Ingreso', render: (r: Guard) => r.hireDate ? new Date(r.hireDate).toLocaleDateString('es-MX') : '—' },
        ]}
      />
      <EntityModal
        open={open}
        title="Nuevo guardia"
        endpoint="/guards"
        fields={fields}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}