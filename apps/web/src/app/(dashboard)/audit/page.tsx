'use client';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';

function fmtDt(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AuditPage() {
  return (
    <div>
      <PageHeader
        icon="eye"
        title="Auditoría"
        subtitle="Bitácora de cambios y accesos al sistema"
      />
      <DataTable
        hideHeader
        endpoint="/audit"
        title="Auditoría"
        subtitle="Bitácora de cambios y accesos al sistema"
        emptyText="No hay eventos de auditoría registrados."
        columns={[
          { key: 'createdAt', label: 'Fecha', render: (r: any) => fmtDt(r.createdAt) },
          { key: 'user', label: 'Usuario', render: (r: any) => r.user ? `${r.user.name} ${r.user.lastName}` : '—' },
          { key: 'module', label: 'Módulo' },
          { key: 'action', label: 'Acción' },
          { key: 'entityType', label: 'Entidad', render: (r: any) => r.entityType ?? '—' },
          { key: 'entityId', label: 'ID', render: (r: any) => r.entityId ? r.entityId.slice(0, 8) + '…' : '—' },
        ]}
      />
    </div>
  );
}