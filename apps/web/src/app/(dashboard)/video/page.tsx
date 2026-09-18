'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm';
import { apiFetch, getAccessToken, API_URL } from '@/lib/api';
import { IconDownload, IconCamera, IconEye, IconClose, IconShield } from '@/components/icons';

function fmtDt(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtSize(b?: number | bigint | null) {
  if (!b || Number(b) === 0) return '—';
  const n = Number(b);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function guardName(r: any) {
  if (!r.guard) return '—';
  return `${r.guard.firstName} ${r.guard.lastName}`;
}

function LiveBadge({ status }: { status: string }) {
  if (status === 'transmitiendo' || status === 'live' || status === 'iniciada') {
    return (
      <span className="badge gap-1.5 bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
        En vivo
      </span>
    );
  }
  return <StatusBadge status={status ?? '—'} />;
}

function RetentionBadge({ retention, hours }: { retention?: string; hours?: number | null }) {
  if (retention === 'evidencia') {
    return (
      <span className="badge gap-1.5 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <IconShield size={12} /> Evidencia (no expira)
      </span>
    );
  }
  if (hours != null && hours >= 0) return <span className="badge bg-slate-50 text-slate-600">Expira en {hours} h</span>;
  return <span className="badge bg-slate-50 text-slate-400">Expirada</span>;
}

/** Reproductor en vivo por MSE: encuesta el manifest y va anexando fragmentos WebM. */
function LivePlayer({ streamId }: { streamId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const msRef = useRef<MediaSource | null>(null);
  const sbRef = useRef<SourceBuffer | null>(null);
  const nextSeqRef = useRef(0);
  const appendingRef = useRef(false);
  const endedRef = useRef(false);
  const [live, setLive] = useState(true);

  useEffect(() => {
    const mimeCandidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm'];
    let cancelled = false;

    async function initMse() {
      if (!window.MediaSource?.isTypeSupported('audio/webm') && typeof (window as any).MediaSource === 'undefined') {
        return;
      }
      const ms = new MediaSource();
      msRef.current = ms;
      const video = videoRef.current;
      if (!video) return;
      video.src = URL.createObjectURL(ms);

      ms.addEventListener('sourceopen', async () => {
        if (cancelled) return;
        const sb = ms.addSourceBuffer(mimeCandidates.find((m) => window.MediaSource.isTypeSupported(m)) ?? 'video/webm');
        sbRef.current = sb;
        pollLoop();
      });
    }

    async function pollLoop() {
      try {
        const man = await apiFetch<any>(`/video/streams/${streamId}/manifest`);
        if (cancelled) return;
        if (man.status !== 'transmitiendo' && man.status !== 'iniciada') {
          setLive(false);
          return;
        }
        // Encadenar fragmentos en orden si el servidor ya los tiene
        const seqs = (man.fragments ?? []).map((f: any) => f.seq).sort((a: number, b: number) => a - b);
        for (const seq of seqs) {
          if (endedRef.current || cancelled) return;
          if (seq >= nextSeqRef.current) {
            await appendSeq(seq);
          }
        }
        if (!cancelled) setTimeout(pollLoop, 2500);
      } catch {
        if (!cancelled) setTimeout(pollLoop, 4000);
      }
    }

    async function appendSeq(seq: number) {
      const sb = sbRef.current;
      if (!sb) return;
      if (appendingRef.current) return;
      appendingRef.current = true;
      try {
        const res = await fetch(`${API_URL}/video/streams/${streamId}/fragments/${seq}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        await waitForUpdateEnd(sb);
        if (sb.updating) return;
        try {
          sb.appendBuffer(buf);
        } catch {
          // Quota o timestamp duplicado: se omite el fragmento
        }
        await waitForUpdateEnd(sb);
        nextSeqRef.current = seq + 1;
      } catch {
        // reintentar en el próximo ciclo
      } finally {
        appendingRef.current = false;
      }
    }

    function waitForUpdateEnd(sb: SourceBuffer): Promise<void> {
      return new Promise((resolve) => {
        if (!sb.updating) return resolve();
        const onEnd = () => {
          sb.removeEventListener('updateend', onEnd);
          resolve();
        };
        sb.addEventListener('updateend', onEnd);
      });
    }

    initMse();
    return () => {
      cancelled = true;
      URL.revokeObjectURL(videoRef.current?.src || '');
      try {
        if (msRef.current?.readyState === 'open') msRef.current.endOfStream();
      } catch {}
    };
  }, [streamId]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} controls autoPlay playsInline className="aspect-video w-full" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        {live ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" /> EN VIVO (latencia ~3s)
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <IconCamera size={13} /> Transmisión finalizada
          </span>
        )}
        <p className="text-xs text-slate-500">Los fragmentos se reproducen en tiempo real y quedan grabados.</p>
      </div>
    </div>
  );
}

export default function VideoPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [liveStream, setLiveStream] = useState<any | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [auditRec, setAuditRec] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [preserving, setPreserving] = useState<any | null>(null);
  const [preserveReason, setPreserveReason] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const downloadSigned = useCallback(
    async (r: any) => {
      try {
        const url = await apiFetch<{ url: string }>(`/video/recordings/${r.id}/download-url`);
        const res = await fetch(`${API_URL}${url.url}`);
        if (!res.ok) {
          toast.error('No se pudo descargar', `Error ${res.status}.`);
          return;
        }
        const blob = await res.blob();
        const obj = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = obj;
        a.download = `${r.id}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(obj);
        toast.success('Descarga iniciada', 'El acceso quedó en auditoría.');
      } catch (e: any) {
        toast.error('Error al descargar', e?.message ?? 'Reintenta.');
      }
    },
    [toast],
  );

  const openAudit = useCallback(
    async (r: any) => {
      try {
        const logs = await apiFetch<any[]>(`/video/recordings/${r.id}/audit`);
        setAuditLogs(logs);
        setAuditRec(r);
      } catch (e: any) {
        toast.error('No se pudo leer la auditoría', e?.message);
      }
    },
    [toast],
  );

  const markEvidence = useCallback(
    async (r: any, reason: string) => {
      if (!reason.trim()) {
        toast.error('Motivo obligatorio', 'Indica por qué se conserva esta evidencia.');
        return;
      }
      try {
        await apiFetch(`/video/recordings/${r.id}/preserve`, {
          method: 'PUT',
          body: JSON.stringify({ reason: reason.trim() }),
        });
        setPreserving(null);
        setPreserveReason('');
        setRefreshKey((k) => k + 1);
        toast.success('Conservada como evidencia', 'Ya no caduca y quedó registrado en auditoría.');
      } catch (e: any) {
        toast.error('No se pudo conservar', e?.message ?? 'Reintenta.');
      }
    },
    [toast],
  );

  const removeVideo = useCallback(
    async (r: any) => {
      const ok = await confirm({
        title: 'Eliminar grabación',
        message: r.retentionPolicy === 'evidencia'
          ? 'Esta grabación está conservada como evidencia. ¿Seguro que deseas eliminarla?'
          : 'La grabación y su archivo se eliminarán permanentemente. ¿Continuar?',
        confirmLabel: 'Eliminar',
        danger: true,
      });
      if (!ok) return;
      try {
        await apiFetch(`/video/recordings/${r.id}/delete`, { method: 'PUT' });
        setRefreshKey((k) => k + 1);
        toast.success('Grabación eliminada');
      } catch (e: any) {
        toast.error('No se pudo eliminar', e?.message ?? 'Reintenta.');
      }
    },
    [confirm, toast],
  );

  return (
    <div>
      <PageHeader
        icon="camera"
        title="Video"
        subtitle="Videovigilancia en vivo y grabaciones por turno (expiran a las 48 horas; la evidencia se conserva)"
      />
      <div className="space-y-8">
        <DataTable
          refreshKey={refreshKey}
          endpoint="/video/streams"
          title="Video en vivo"
          subtitle="Transmisiones WebRTC activas por turno"
          emptyText="No hay transmisiones en vivo activas."
          emptyDescription="Cuando un guardia inicie la cámara desde su aplicación, la transmisión aparecerá aquí y podrás verla en tiempo real."
          columns={[
            { key: 'startedAt', label: 'Inicio', render: (r: any) => fmtDt(r.startedAt) },
            { key: 'guard', label: 'Guardia', render: (r: any) => <span className="font-medium text-slate-900">{guardName(r)}</span> },
            {
              key: 'post',
              label: 'Instalación / Puesto',
              render: (r: any) => (
                <span className="text-slate-600">
                  {r.post?.site?.name ?? r.shift?.post?.site?.name ?? '—'}
                  {r.post?.name ? ` · ${r.post.name}` : r.shift?.post?.name ? ` · ${r.shift.post.name}` : ''}
                </span>
              ),
            },
            {
              key: 'res',
              label: 'Config',
              render: (r: any) =>
                r.resolution ? (
                  <span className="text-xs text-slate-500">{r.resolution} · {r.fps ?? '?'} fps · {r.bitrate ?? '?'} kbps</span>
                ) : (
                  '—'
                ),
            },
            { key: 'fragments', label: 'Fragmentos', render: (r: any) => r.fragmentCount ?? 0 },
            { key: 'status', label: 'Estado', render: (r: any) => <LiveBadge status={r.status} /> },
            {
              key: 'actions',
              label: '',
              render: (r: any) =>
                r.status === 'transmitiendo' || r.status === 'live' || r.status === 'iniciada' ? (
                  <button className="btn-outline btn-sm" onClick={() => setLiveStream(r)}>
                    <IconEye size={13} /> Ver en vivo
                  </button>
                ) : null,
            },
          ]}
        />

        <DataTable
          refreshKey={refreshKey}
          endpoint="/video/recordings"
          title="Grabaciones"
          subtitle="Grabaciones temporales (48 h) y evidencia conservada"
          emptyText="No hay grabaciones disponibles."
          emptyDescription="Las grabaciones requieren que un guardia active la cámara durante su turno."
          columns={[
            { key: 'createdAt', label: 'Guardada', render: (r: any) => fmtDt(r.createdAt) },
            { key: 'guard', label: 'Guardia', render: (r: any) => <span className="font-medium text-slate-900">{guardName(r)}</span> },
            {
              key: 'context',
              label: 'Contexto',
              render: (r: any) => (
                <span className="text-xs text-slate-600">
                  {[r.site?.name, r.post?.name, r.client?.commercialName].filter(Boolean).join(' · ') || '—'}
                </span>
              ),
            },
            {
              key: 'incident',
              label: 'Incidencia',
              render: (r: any) =>
                r.incident ? (
                  <span className="text-xs font-medium text-red-600">{r.incident.typeName}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                ),
            },
            { key: 'durationSec', label: 'Duración', render: (r: any) => (r.durationSec ? `${r.durationSec} s` : '—') },
            { key: 'sizeBytes', label: 'Tamaño', render: (r: any) => fmtSize(r.sizeBytes) },
            {
              key: 'expiresAt',
              label: 'Vigencia',
              render: (r: any) => <RetentionBadge retention={r.retentionPolicy} hours={r.hoursUntilExpiration} />,
            },
            { key: '_count', label: 'Descargas', render: (r: any) => r._count?.downloads ?? 0 },
            {
              key: 'actions',
              label: '',
              render: (r: any) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  <button className="btn-outline btn-sm" onClick={() => setSelected(r)}>
                    <IconEye size={13} /> Ver
                  </button>
                  <button className="btn-outline btn-sm" onClick={() => downloadSigned(r)} disabled={r.expired}>
                    <IconDownload size={13} /> Bajar
                  </button>
                  {r.retentionPolicy !== 'evidencia' ? (
                    <button className="btn-outline btn-sm text-amber-700" onClick={() => { setPreserving(r); setPreserveReason(''); }}>
                      <IconShield size={13} /> Evidencia
                    </button>
                  ) : null}
                  <button className="btn-outline btn-sm text-slate-500" onClick={() => openAudit(r)}>
                    Auditoría
                  </button>
                  <button className="btn-outline btn-sm text-red-600" onClick={() => removeVideo(r)}>
                    Eliminar
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Modal Ver en vivo */}
      {liveStream && (
        <ModalShell onClose={() => setLiveStream(null)} title={`En vivo · ${guardName(liveStream)}`}>
          <div className="space-y-3">
            <LivePlayer streamId={liveStream.id} />
            <p className="text-xs text-slate-500">
              Instalación: {liveStream.post?.site?.name ?? liveStream.shift?.post?.site?.name ?? '—'} · Puesto:{' '}
              {liveStream.post?.name ?? liveStream.shift?.post?.name ?? '—'} · Cliente:{' '}
              {liveStream.client?.commercialName ?? '—'} · Inicio: {fmtDt(liveStream.startedAt)}
            </p>
          </div>
        </ModalShell>
      )}

      {/* Modal detalle grabación */}
      {selected && (
        <ModalShell onClose={() => setSelected(null)} title={`Grabación · ${guardName(selected)}`}>
          <div className="space-y-3">
            <video controls preload="metadata" className="aspect-video w-full rounded-xl bg-black">
              <source src={`${API_URL}/video/recordings/${selected.id}/file`} type="video/webm" />
            </video>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Inicio" value={fmtDt(selected.createdAt)} />
              <Field label="Duración" value={selected.durationSec ? `${selected.durationSec} s` : '—'} />
              <Field label="Guardia" value={guardName(selected)} />
              <Field
                label="Configuración"
                value={selected.resolution ? `${selected.resolution} · ${selected.fps ?? '?'} fps${selected.audioEnabled ? ' · audio' : ''}` : '—'}
              />
              <Field label="Instalación / Puesto" value={`${selected.site?.name ?? '—'}${selected.post?.name ? ` · ${selected.post.name}` : ''}`} />
              <Field label="Cliente" value={selected.client?.commercialName ?? '—'} />
              <Field label="Incidencia" value={selected.incident?.typeName ?? '—'} />
              <Field label="Conservación" value={selected.retentionPolicy === 'evidencia' ? `Evidencia · ${selected.evidenceBy ? `${selected.evidenceBy.name} ${selected.evidenceBy.lastName}` : ''}` : `Temporal (expira en ${selected.hoursUntilExpiration ?? '?'} h)`} />
            </dl>
            {selected.retentionPolicy === 'evidencia' && selected.evidenceReason && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Motivo de conservación: {selected.evidenceReason}</p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn-outline btn-sm" onClick={() => downloadSigned(selected)}>
                <IconDownload size={13} /> Descargar
              </button>
              <button className="btn-primary btn-sm" onClick={() => setSelected(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Modal auditoría */}
      {auditRec && (
        <ModalShell onClose={() => setAuditRec(null)} title={`Auditoría · ${auditLogs.length} evento(s)`}>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500">Sin eventos registrados.</p>
            ) : (
              auditLogs.map((l: any) => (
                <div key={l.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{l.action}</span>
                    <span className="text-xs text-slate-400">{fmtDt(l.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {l.user ? `${l.user.name} ${l.user.lastName}` : 'Sistema'} · IP {l.ip ?? '—'} · {l.device ?? ''}
                  </p>
                  {l.detail && <pre className="mt-1 text-[11px] text-slate-500">{JSON.stringify(l.detail, null, 1)}</pre>}
                </div>
              ))
            )}
          </div>
        </ModalShell>
      )}

      {/* Modal conservar evidencia */}
      {preserving && (
        <ModalShell onClose={() => setPreserving(null)} title="Conservar como evidencia">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              La grabación de <strong>{guardName(preserving)}</strong> quedará sin expiración. Se conserva por su valor probatorio.
            </p>
            <label className="block text-sm font-medium text-slate-700">
              Motivo de conservación
              <textarea
                className="input mt-1 min-h-[90px]"
                value={preserveReason}
                onChange={(e) => setPreserveReason(e.target.value)}
                placeholder="Ej. Robo en la entrada principal; video de respaldo para la investigación."
              />
            </label>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary btn-sm" onClick={() => setPreserving(null)}>
                Cancelar
              </button>
              <button className="btn-primary btn-sm" onClick={() => markEvidence(preserving, preserveReason)}>
                <IconShield size={13} /> Conservar
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex animate-fadeIn items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl animate-slideIn overflow-y-auto rounded-2xl bg-white p-5 shadow-lift" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button className="btn-icon btn-secondary" onClick={onClose} aria-label="Cerrar">
            <IconClose size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
    </div>
  );
}