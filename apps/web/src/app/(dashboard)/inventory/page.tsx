'use client';

import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { PageHeader } from '@/components/page-header';

const FIELDS: Field[] = [
  { name: 'name', label: 'Nombre del bien', required: true },
  { name: 'category', label: 'Categoría', type: 'select', options: [
    { label: 'Arma', value: 'arma' },
    { label: 'Equipo de protección', value: 'equipo_proteccion' },
    { label: 'Comunicación', value: 'comunicacion' },
    { label: 'Uniforme', value: 'uniforme' },
    { label: 'Otro', value: 'otro' },
  ]},
  { name: 'serialNumber', label: 'Número de serie' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
];

export default function InventoryPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <>
      <PageHeader
        icon="box"
        title="Inventario"
        subtitle="Bienes y equipo asignado"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Registrar bien
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/inventory"
        title="Inventario"
        subtitle="Bienes y equipo asignado"
        emptyText="No hay bienes registrados."
        emptyDescription="Registra armas, equipos, uniformes y demás bienes."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Registrar bien
          </button>
        }
        columns={[
          { key: 'name', label: 'Bien', render: (r: any) => <span className="font-medium text-slate-900">{r.name}</span> },
          { key: 'category', label: 'Categoría' },
          { key: 'serialNumber', label: 'No. serie' },
          { key: 'status', label: 'Estatus', render: (r: any) => r.status ?? '—' },
        ]}
      />
      <EntityModal
        open={open}
        title="Registrar bien"
        endpoint="/inventory"
        fields={FIELDS}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}