'use client';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-slate-100 px-5 py-4">
      <h2 className="text-base font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        icon="report"
        title="Reportes"
        subtitle="Reportes operativos de asistencia y turnos"
      />
      <section className="card overflow-hidden p-0">
        <SectionTitle title="Reporte de asistencia" subtitle="Asistencia de guardias por día" />
        <DataTable
          hideHeader
          endpoint="/reports/attendance"
          title="Reporte de asistencia"
          emptyText="Sin datos de asistencia para el reporte."
          columns={[
            { key: 'guard', label: 'Guardia', render: (r: any) => r.guard ? `${r.guard.firstName} ${r.guard.lastName}` : (r.name ?? '—') },
            { key: 'date', label: 'Fecha', render: (r: any) => r.date ? new Date(r.date).toLocaleDateString('es-MX') : '—' },
            { key: 'checkIn', label: 'Entrada', render: (r: any) => r.checkIn ? new Date(r.checkIn).toLocaleString('es-MX') : '—' },
            { key: 'checkOut', label: 'Salida', render: (r: any) => r.checkOut ? new Date(r.checkOut).toLocaleString('es-MX') : '—' },
          ]}
        />
      </section>
      <section className="card overflow-hidden p-0">
        <SectionTitle title="Reporte de turnos" subtitle="Cobertura de turnos" />
        <DataTable
          hideHeader
          endpoint="/reports/shifts"
          title="Reporte de turnos"
          emptyText="Sin datos de turnos para el reporte."
          columns={[
            { key: 'post', label: 'Puesto', render: (r: any) => r.post?.name ?? (r.postName ?? '—') },
            { key: 'guard', label: 'Guardia', render: (r: any) => r.guard ? `${r.guard.firstName} ${r.guard.lastName}` : (r.guardName ?? '—') },
            { key: 'date', label: 'Fecha', render: (r: any) => r.date ? new Date(r.date).toLocaleDateString('es-MX') : '—' },
            { key: 'startTime', label: 'Inicio' },
            { key: 'endTime', label: 'Fin' },
            { key: 'status', label: 'Estatus', render: (r: any) => r.status ?? '—' },
          ]}
        />
      </section>
    </div>
  );
}