'use client';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

function fmtDt(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SupervisionPage() {
  return (
    <div>
      <PageHeader
        icon="supervis"
        title="Supervisión"
        subtitle="Visitas de supervisión realizadas a los puestos de guardia"
      />
      <DataTable
        hideHeader
        endpoint="/supervision"
        title="Supervisión"
        subtitle="Visitas de supervisión realizadas a los puestos de guardia"
        emptyText="No hay visitas de supervisión registradas."
        emptyDescription="Las visitas de supervisión registradas por el supervisor aparecerán aquí."
        columns={[
          { key: 'createdAt', label: 'Fecha', render: (r: any) => fmtDt(r.createdAt) },
          { key: 'supervisor', label: 'Supervisor', render: (r: any) => r.supervisor ? `${r.supervisor.name} ${r.supervisor.lastName}` : '—' },
          { key: 'guard', label: 'Guardia visitado', render: (r: any) => r.guard ? `${r.guard.firstName} ${r.guard.lastName}` : '—' },
          { key: 'post', label: 'Puesto', render: (r: any) => r.post?.name ?? '—' },
          {
            key: 'result',
            label: 'Resultado',
            render: (r: any) =>
              r.result === 'cumple'
                ? <StatusBadge status="cumple" />
                : r.result === 'no_cumple'
                  ? <StatusBadge status="no_cumple" />
                  : <StatusBadge status={r.result ?? '—'} />,
          },
        ]}
      />
    </div>
  );
}