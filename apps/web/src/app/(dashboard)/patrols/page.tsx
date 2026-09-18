'use client';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

export default function PatrolsPage() {
  return (
    <div>
      <PageHeader
        icon="route"
        title="Rondines"
        subtitle="Rutas de rondín y sus puntos de verificación"
      />
      <DataTable
        hideHeader
        endpoint="/patrols/routes"
        title="Rondines"
        subtitle="Rutas de rondín y sus puntos de verificación"
        emptyText="No hay rutas de rondín registradas."
        emptyDescription="Define rutas con puntos de verificación para el control de rondines."
        columns={[
          { key: 'name', label: 'Ruta', render: (r: any) => <span className="font-medium text-slate-900">{r.name}</span> },
          { key: 'site', label: 'Instalación', render: (r: any) => r.site?.name ?? '—' },
          { key: 'post', label: 'Puesto', render: (r: any) => r.post?.name ?? '—' },
          { key: 'schedule', label: 'Frecuencia' },
          { key: 'checkpoints', label: 'Puntos', render: (r: any) => r.checkpoints?.length ?? 0 },
          { key: 'active', label: 'Activa', render: (r: any) => r.active ? <StatusBadge status="activo" /> : <StatusBadge status="inactivo" /> },
        ]}
      />
    </div>
  );
}