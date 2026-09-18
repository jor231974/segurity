'use client';

import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

export default function PendingApprovalsPage() {
  return (
    <div>
      <PageHeader
        icon="check"
        title="Consignas pendientes de aprobación"
        subtitle="Consignas del puesto y pendientes de aprobación"
      />
      <DataTable
        hideHeader
        endpoint="/consigns"
        title="Consignas"
        subtitle="Consignas del puesto y pendientes de aprobación"
        emptyText="No hay consignas registradas."
        columns={[
          { key: 'title', label: 'Título', render: (r: any) => <span className="font-medium text-slate-900">{r.title}</span> },
          { key: 'post', label: 'Puesto', render: (r: any) => r.post?.name ?? '—' },
          { key: 'version', label: 'Versión' },
          { key: 'status', label: 'Estatus', render: (r: any) => <StatusBadge status={r.status ?? '—'} /> },
        ]}
      />
    </div>
  );
}