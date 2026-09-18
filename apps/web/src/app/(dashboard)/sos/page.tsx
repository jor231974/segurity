'use client';

import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

function fmtDt(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function SosPage() {
  return (
    <div>
      <PageHeader
        icon="sos"
        title="Alertas SOS"
        subtitle="Alertas de emergencia activadas por los guardias"
      />
      <DataTable
        hideHeader
        endpoint="/sos"
        title=""
        emptyText="No hay alertas SOS registradas."
        columns={[
          { key: 'createdAt', label: 'Fecha', render: (r: any) => fmtDt(r.createdAt) },
          { key: 'guard', label: 'Guardia', render: (r: any) => r.guard ? <span className="font-medium text-slate-900">{r.guard.firstName} {r.guard.lastName}</span> : '—' },
          { key: 'message', label: 'Mensaje' },
          { key: 'status', label: 'Estado', render: (r: any) => <StatusBadge status={r.status ?? '—'} /> },
        ]}
      />
    </div>
  );
}