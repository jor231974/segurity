'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

interface Shift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  guard?: { id: string; firstName: string; lastName: string; employeeNumber: string } | null;
  post?: { id: string; name: string; site?: { id: string; name: string } | null } | null;
  service?: { id: string; name: string } | null;
}

const FIELDS: Field[] = [
  { name: 'guardId', label: 'Guardia', type: 'select', required: true },
  { name: 'postId', label: 'Puesto', type: 'select', required: true },
  { name: 'date', label: 'Fecha', type: 'date', required: true },
  { name: 'startTime', label: 'Inicio (HH:MM)', type: 'time', required: true },
  { name: 'endTime', label: 'Fin (HH:MM)', type: 'time', required: true },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

export default function ShiftsPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [guards, setGuards] = useState<{ id: string; label: string }[]>([]);
  const [posts, setPosts] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    apiFetch<any>('/guards?pageSize=100')
      .then((res: any) => {
        const rows = res?.items ?? (Array.isArray(res) ? res : []);
        setGuards(rows.map((g: any) => ({ id: g.id, label: `${g.employeeNumber} — ${g.firstName} ${g.lastName}` })));
      })
      .catch(() => {});
    apiFetch<any>('/posts')
      .then((res: any) => {
        const rows = Array.isArray(res) ? res : [];
        setPosts(rows.map((p: any) => ({ id: p.id, label: `${p.name} (${p.site?.name ?? ''})` })));
      })
      .catch(() => {});
  }, []);

  const fields = FIELDS.map((f) =>
    f.name === 'guardId'
      ? { ...f, options: guards.map((g) => ({ label: g.label, value: g.id })) }
      : f.name === 'postId'
        ? { ...f, options: posts.map((p) => ({ label: p.label, value: p.id })) }
        : f,
  );

  function fmtDate(d: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  return (
    <>
      <PageHeader
        icon="shifts"
        title="Turnos"
        subtitle="Programación de guardias por puesto"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo turno
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/shifts"
        title="Turnos"
        subtitle="Programación de guardias por puesto"
        emptyText="No hay turnos registrados."
        emptyDescription="Asigna un guardia a un puesto para un rango de horario."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo turno
          </button>
        }
        columns={[
          { key: 'date', label: 'Fecha', render: (r: Shift) => fmtDate(r.date) },
          { key: 'guard', label: 'Guardia', render: (r: Shift) => r.guard ? `${r.guard.firstName} ${r.guard.lastName}` : 'Sin asignar' },
          { key: 'post', label: 'Puesto', render: (r: Shift) => r.post?.name ?? '—' },
          { key: 'startTime', label: 'Inicio' },
          { key: 'endTime', label: 'Fin' },
          { key: 'status', label: 'Estatus', render: (r: Shift) => <StatusBadge status={r.status} /> },
        ]}
      />
      <EntityModal
        open={open}
        title="Nuevo turno"
        endpoint="/shifts"
        fields={fields}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}