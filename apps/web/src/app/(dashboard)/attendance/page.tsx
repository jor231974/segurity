'use client';

import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AttendancePage() {
  const [date, setDate] = useState(today());

  return (
    <div>
      <PageHeader
        icon="clock"
        title="Asistencia"
        subtitle="Entradas y salidas registradas por los guardias"
      />
      <div className="mb-4">
        <label className="label">Fecha</label>
        <input
          type="date"
          value={date}
          max={today()}
          onChange={(e) => setDate(e.target.value)}
          className="input w-auto"
        />
      </div>
      <DataTable
        hideHeader
        key={date}
        endpoint={`/attendance?date=${date}`}
        title="Asistencia"
        subtitle="Entradas y salidas registradas por los guardias"
        emptyText="No hay registros de asistencia para esta fecha."
        emptyDescription="Cuando un guardia registre su entrada o salida, aparecerá aquí."
        columns={[
          { key: 'guard', label: 'Guardia', render: (r: any) => r.guard ? <span className="font-medium text-slate-900">{r.guard.firstName} {r.guard.lastName}</span> : '—' },
          { key: 'checkIn', label: 'Entrada', render: (r: any) => r.checkIn ? new Date(r.checkIn).toLocaleString('es-MX') : '—' },
          { key: 'checkOut', label: 'Salida', render: (r: any) => r.checkOut ? new Date(r.checkOut).toLocaleString('es-MX') : 'En turno' },
          {
            key: 'status',
            label: 'Estatus',
            render: (r: any) =>
              r.status
                ? <StatusBadge status={r.status} />
                : r.checkOut
                  ? <StatusBadge status="completo" />
                  : <StatusBadge status="activo" />,
          },
        ]}
      />
    </div>
  );
}