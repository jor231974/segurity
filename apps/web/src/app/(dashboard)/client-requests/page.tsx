'use client';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

function fmtDt(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ClientRequestsPage() {
  return (
    <div>
      <PageHeader
        icon="folder"
        title="Solicitudes de clientes"
        subtitle="Solicitudes y reportes enviados por los clientes"
      />
      <DataTable
        hideHeader
        endpoint="/client-requests"
        title="Solicitudes de clientes"
        subtitle="Solicitudes y reportes enviados por los clientes"
        emptyText="No hay solicitudes de clientes."
        emptyDescription="Las solicitudes enviadas desde el portal del cliente aparecerán aquí."
        columns={[
          { key: 'createdAt', label: 'Fecha', render: (r: any) => fmtDt(r.createdAt) },
          { key: 'client', label: 'Cliente', render: (r: any) => r.client?.commercialName ?? '—' },
          { key: 'subject', label: 'Asunto', render: (r: any) => <span className="font-medium text-slate-900">{r.subject ?? r.title ?? '—'}</span> },
          { key: 'status', label: 'Estado', render: (r: any) => <StatusBadge status={r.status ?? '—'} /> },
        ]}
      />
    </div>
  );
}