'use client';

import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/components/ui/toast';

function fmtDt(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsPage() {
  const toast = useToast();
  const [reloadKey, setReloadKey] = useState(0);

  async function markAll() {
    try {
      await apiFetch('/notifications/read-all', { method: 'PUT' });
      setReloadKey((k) => k + 1);
      toast.success('Avisos actualizados', 'Todos los avisos se marcaron como leídos.');
    } catch (e: any) {
      toast.error('No fue posible actualizar los avisos', e?.message);
    }
  }

  return (
    <>
      <PageHeader
        icon="bell"
        title="Avisos"
        subtitle="Notificaciones dirigidas a mi usuario"
        actions={
          <button className="btn-secondary" onClick={markAll}>Marcar todos leídos</button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/notifications"
        title="Avisos"
        subtitle="Notificaciones dirigidas a mi usuario"
        emptyText="No hay avisos."
        emptyDescription="Las notificaciones dirigidas a tu usuario aparecerán aquí."
        actions={<button className="btn-secondary" onClick={markAll}>Marcar todos leídos</button>}
        columns={[
          { key: 'createdAt', label: 'Fecha', render: (r: any) => fmtDt(r.createdAt) },
          { key: 'title', label: 'Título', render: (r: any) => <span className="font-medium text-slate-900">{r.title}</span> },
          { key: 'body', label: 'Contenido' },
          { key: 'readAt', label: 'Estado', render: (r: any) =>
            r.readAt
              ? <span className="badge bg-slate-100 text-slate-600">Leído</span>
              : <span className="badge bg-blue-100 text-blue-700">No leído</span>
          },
        ]}
      />
    </>
  );
}