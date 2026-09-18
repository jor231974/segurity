'use client';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';

function fmtDt(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function LogbookPage() {
  return (
    <div>
      <PageHeader
        icon="log"
        title="Bitácora"
        subtitle="Bitácora de eventos registrados por los guardias"
      />
      <DataTable
        hideHeader
        endpoint="/logbook"
        title="Bitácora"
        subtitle="Bitácora de eventos registrados por los guardias"
        emptyText="No hay eventos en la bitácora."
        emptyDescription="Los eventos que registran los guardias en su turno aparecerán aquí."
        columns={[
          { key: 'createdAt', label: 'Fecha', render: (r: any) => fmtDt(r.createdAt) },
          { key: 'guard', label: 'Guardia', render: (r: any) => r.guard ? `${r.guard.firstName} ${r.guard.lastName}` : '—' },
          { key: 'post', label: 'Puesto', render: (r: any) => r.post?.name ?? '—' },
          { key: 'type', label: 'Tipo', render: (r: any) => r.type ?? '—' },
          { key: 'description', label: 'Descripción', render: (r: any) => r.description ?? r.content ?? '—' },
        ]}
      />
    </div>
  );
}