'use client';

import { useCallback } from 'react';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { apiFetch, getAccessToken, API_URL } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { IconDownload } from '@/components/icons';

function fmtDt(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtSize(b: number | bigint | undefined) {
  if (!b || b === 0) return '—';
  const n = Number(b);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoPage() {
  const toast = useToast();

  const download = useCallback(
    async (r: any) => {
      try {
        const tok = getAccessToken();
        const res = await fetch(`${API_URL}/video/recordings/${r.id}/file`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          toast.error('No se pudo descargar la grabación', j?.message ?? `Error ${res.status}.`);
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${r.id}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Descarga iniciada', 'El acceso quedó registrado en auditoría.');
      } catch (e: any) {
        toast.error('Error al descargar', e?.message);
      }
    },
    [toast],
  );

  return (
    <div>
      <PageHeader
        icon="camera"
        title="Video"
        subtitle="Videovigilancia registrada por turno (expira a las 48 horas)"
      />
      <div className="space-y-8">
        <DataTable
          hideHeader
          endpoint="/video/streams"
          title="Video en vivo"
          subtitle="Streaming WebRTC activo por turno"
          emptyText="No hay transmisiones en vivo activas."
          emptyDescription="Cuando un guardia inicie la cámara desde su aplicación, la transmisión aparecerá aquí."
          columns={[
            { key: 'startedAt', label: 'Inicio', render: (r: any) => fmtDt(r.startedAt) },
            { key: 'guard', label: 'Guardia', render: (r: any) => (r.guard ? <span className="font-medium text-slate-900">{r.guard.firstName} {r.guard.lastName}</span> : '—') },
            { key: 'site', label: 'Instalación', render: (r: any) => r.shift?.post?.site?.name ?? '—' },
            {
              key: 'status',
              label: 'Estado',
              render: (r: any) =>
                r.status === 'transmitiendo' || r.status === 'live' || r.status === 'activo' ? (
                  <span className="badge gap-1.5 bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                    En vivo
                  </span>
                ) : (
                  <StatusBadge status={r.status ?? '—'} />
                ),
            },
          ]}
        />

        <DataTable
          hideHeader
          endpoint="/video/recordings"
          title="Grabaciones"
          subtitle="Grabaciones temporales (expiran a las 48 horas)"
          emptyText="No hay grabaciones disponibles."
          emptyDescription="Las grabaciones requieren que un guardia active la cámara durante su turno."
          columns={[
            { key: 'createdAt', label: 'Guardada', render: (r: any) => fmtDt(r.createdAt) },
            { key: 'guard', label: 'Guardia', render: (r: any) => (r.guard ? <span className="font-medium text-slate-900">{r.guard.firstName} {r.guard.lastName}</span> : '—') },
            { key: 'durationSec', label: 'Duración', render: (r: any) => (r.durationSec ? `${r.durationSec} s` : '—') },
            { key: 'sizeBytes', label: 'Tamaño', render: (r: any) => fmtSize(r.sizeBytes) },
            { key: 'expiresAt', label: 'Expira', render: (r: any) => (r.hoursUntilExpiration ? `en ${r.hoursUntilExpiration} h` : r.expired ? <span className="text-slate-400">Expirada</span> : fmtDt(r.expiresAt)) },
            { key: '_count', label: 'Descargas', render: (r: any) => r._count?.downloads ?? '0' },
            {
              key: 'actions',
              label: '',
              render: (r: any) =>
                r.expired ? (
                  <span className="text-xs text-slate-400">Expirada</span>
                ) : (
                  <button className="btn-outline btn-sm" onClick={() => download(r)} disabled={!r.id}>
                    <IconDownload size={13} /> Descargar
                  </button>
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}