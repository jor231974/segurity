'use client';

import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { PageHeader } from '@/components/page-header';

const FIELDS: Field[] = [
  { name: 'brand', label: 'Marca', required: true },
  { name: 'model', label: 'Modelo', required: true },
  { name: 'year', label: 'Año', type: 'number' },
  { name: 'plates', label: 'Placas', required: true },
  { name: 'vin', label: 'VIN / NIV' },
  { name: 'insuranceExpiration', label: 'Vencimiento de seguro', type: 'date' },
  { name: 'currentMileage', label: 'Kilometraje actual', type: 'number' },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

export default function VehiclesPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <>
      <PageHeader
        icon="car"
        title="Vehículos"
        subtitle="Flotilla de vehículos de la empresa"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo vehículo
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/vehicles"
        title="Vehículos"
        subtitle="Flotilla de vehículos de la empresa"
        emptyText="No hay vehículos registrados."
        emptyDescription="Registra los vehículos de la flotilla y su seguro."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo vehículo
          </button>
        }
        columns={[
          { key: 'brand', label: 'Marca', render: (r: any) => <span className="font-medium text-slate-900">{r.brand}</span> },
          { key: 'model', label: 'Modelo' },
          { key: 'year', label: 'Año' },
          { key: 'plates', label: 'Placas' },
          { key: 'insuranceExpiration', label: 'Venc. seguro', render: (r: any) => r.insuranceExpiration ? new Date(r.insuranceExpiration).toLocaleDateString('es-MX') : '—' },
          {
            key: 'responsibleGuard',
            label: 'Responsable',
            render: (r: any) => r.responsibleGuard ? `${r.responsibleGuard.firstName} ${r.responsibleGuard.lastName}` : '—',
          },
        ]}
      />
      <EntityModal
        open={open}
        title="Nuevo vehículo"
        endpoint="/vehicles"
        fields={FIELDS}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}