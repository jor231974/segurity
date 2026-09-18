'use client';

import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

interface Incident {
  id: string;
  folio: string;
  title: string;
  type?: string | null;
  severity?: string | null;
  status: string;
  createdAt: string;
  site?: { id: string; name: string } | null;
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function IncidentsPage() {
  return (
    <div>
      <PageHeader
        icon="alert"
        title="Incidencias"
        subtitle="Incidencias reportadas en las operaciones"
      />
      <DataTable
        hideHeader
        endpoint="/incidents"
        title="Incidencias"
        subtitle="Incidencias reportadas en las operaciones"
        emptyText="No hay incidencias registradas."
        emptyDescription="Las incidencias reportadas por los guardias y supervisores aparecerán aquí."
      columns={[
          { key: 'folio', label: 'Folio', render: (r: Incident) => <span className="font-medium text-slate-900">{r.folio}</span> },
          { key: 'title', label: 'Incidencia' },
          { key: 'severity', label: 'Severidad', render: (r: Incident) => r.severity ? <StatusBadge status={r.severity} /> : '—' },
          { key: 'site', label: 'Sitio', render: (r: Incident) => r.site?.name ?? '—' },
          { key: 'status', label: 'Estatus', render: (r: Incident) => <StatusBadge status={r.status} /> },
          { key: 'createdAt', label: 'Creada', render: (r: Incident) => fmtDate(r.createdAt) },
        ]}
      />
    </div>
  );
}