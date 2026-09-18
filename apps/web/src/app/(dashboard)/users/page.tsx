'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/page-header';

const FIELDS: Field[] = [
  { name: 'name', label: 'Nombre', required: true },
  { name: 'lastName', label: 'Apellido(s)', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Teléfono' },
  { name: 'password', label: 'Contraseña', type: 'password', hint: 'Mínimo 8 caracteres', required: true },
  { name: 'roleCode', label: 'Rol', type: 'select', options: [
    { label: 'Administrador', value: 'ADMINISTRATOR' },
    { label: 'Director', value: 'DIRECTOR' },
    { label: 'Monitor', value: 'MONITOR' },
    { label: 'Supervisor', value: 'SUPERVISOR' },
    { label: 'Guardia', value: 'GUARD' },
  ]},
];

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (created) setReloadKey((k) => k + 1);
    setCreated(false);
  }, [created]);

  return (
    <>
      <PageHeader
        icon="users"
        title="Usuarios"
        subtitle="Usuarios del sistema y sus roles"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo usuario
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/users"
        title="Usuarios"
        subtitle="Usuarios del sistema y sus roles"
        emptyText="No hay usuarios registrados."
        emptyDescription="Crea usuarios y asígnales un rol para controlar su acceso."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo usuario
          </button>
        }
        columns={[
          { key: 'name', label: 'Nombre', render: (r: any) => <span className="font-medium text-slate-900">{r.name} {r.lastName}</span> },
          { key: 'email', label: 'Email' },
          { key: 'userRoles', label: 'Rol', render: (r: any) => {
            const roles = (r.userRoles ?? []).map((x: any) => x.role?.code ?? x.roleCode ?? '').filter(Boolean);
            return roles.length ? roles.join(', ') : '—';
          }},
          { key: 'active', label: 'Activo', render: (r: any) =>
            r.active ? <span className="badge bg-green-100 text-green-700">Sí</span> : <span className="badge bg-red-100 text-red-700">No</span>
          },
          { key: 'lastLoginAt', label: 'Último acceso', render: (r: any) => r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString('es-MX') : 'Nunca' },
        ]}
      />
      <EntityModal
        open={open}
        title="Nuevo usuario"
        endpoint="/users"
        fields={FIELDS}
        onClose={() => setOpen(false)}
        onSaved={() => setCreated(true)}
      />
    </>
  );
}