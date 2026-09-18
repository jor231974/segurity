'use client';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

export default function GpsPage() {
  return (
    <div>
      <PageHeader
        icon="gps"
        title="Ubicaciones GPS"
        subtitle="Última posición conocida de cada guardia en servicio"
      />
      <DataTable
        hideHeader
        endpoint="/gps/positions"
        title="Ubicaciones GPS"
        subtitle="Última posición conocida de cada guardia en servicio"
        emptyText="Sin posiciones GPS registradas."
        emptyDescription="Las ubicaciones aparecen cuando un guardia reporta su posición desde la aplicación."
        columns={[
          { key: 'guard', label: 'Guardia', render: (r: any) => r.guard ? <span className="font-medium text-slate-900">{r.guard.firstName} {r.guard.lastName}</span> : '—' },
          { key: 'lastPosition', label: 'Última posición', render: (r: any) =>
            r.lastPosition
              ? `${r.lastPosition.latitude?.toFixed(5)}, ${r.lastPosition.longitude?.toFixed(5)}`
              : 'Sin señal'
          },
          { key: 'lastPosition', label: 'Hora', render: (r: any) =>
            r.lastPosition?.recordedAt
              ? new Date(r.lastPosition.recordedAt).toLocaleString('es-MX')
              : '—'
          },
          { key: 'shift', label: 'Turno', render: (r: any) =>
            r.shift?.post?.name ?? '—'
          },
          {
            key: 'lastPosition',
            label: 'Estado',
            render: (r: any) =>
              r.lastPosition
                ? <StatusBadge status="activo" />
                : <StatusBadge status="sin_datos" />,
          },
        ]}
      />
    </div>
  );
}