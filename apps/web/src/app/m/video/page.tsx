'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, getAccessToken, API_URL } from '@/lib/api';
import { listPending, queuePending, removePending } from '@/lib/idb-video';

type RecStat = 'idle' | 'starting' | 'recording' | 'uploading' | 'done' | 'error';

interface VideoConfig {
  resolution: string;
  fps: number;
  bitrate: number;
  audioEnabled: boolean;
  maxDurationSec: number;
  fragmentSec: number;
  expirationHours: number;
  mimeType: string;
}

let fragmentIdSeq = 0;

export default function MobileVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streamIdRef = useRef<string | null>(null);
  const seqRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const hasServer = useRef(false);

  const [status, setStatus] = useState<RecStat>('idle');
  const [msg, setMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hasCamera, setHasCamera] = useState(true);
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [latLong, setLatLong] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener('online', onUp);
    window.addEventListener('offline', onDown);
    return () => {
      window.removeEventListener('online', onUp);
      window.removeEventListener('offline', onDown);
    };
  }, []);

  // Sincronizar cola offline pendiente al volver a estar en línea
  const syncPending = useCallback(async () => {
    const pending = await listPending();
    if (pending.length === 0) return 0;
    let ok = 0;
    for (const item of pending) {
      if (navigator.onLine === false) break;
      try {
        const res = await fetch(`${API_URL}/video/streams/${item.streamId}/fragments?seq=${item.seq}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/octet-stream',
            'X-Fragment-Seq': String(item.seq),
          },
          body: item.blob,
        });
        if (res.ok) {
          await removePending(item.id);
          ok++;
        } else if (res.status >= 400 && res.status < 500) {
          await removePending(item.id);
          ok++;
        }
      } catch {
        continue;
      }
    }
    return ok;
  }, []);

  useEffect(() => {
    if (online) syncPending();
  }, [online, syncPending]);

  useEffect(() => {
    if (!('MediaRecorder' in window)) {
      setHasCamera(false);
      setMsg('Tu dispositivo no soporta grabación (MediaRecorder no disponible).');
    }
    apiFetch<VideoConfig>('/video/config')
      .then((c) => {
        hasServer.current = true;
        setConfig(c);
      })
      .catch(() => {
        setConfig(null);
        setMsg('No se pudo leer la configuración del servidor. Verifica tu conexión o sesión.');
      });

    // Posición GPS para anclar el video al turno/puesto
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLatLong({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => undefined,
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function uploadFragment(blob: Blob): Promise<void> {
    const id = streamIdRef.current;
    if (!id) return;
    const seq = seqRef.current++;
    const itemId = `${Date.now()}-${fragmentIdSeq++}`;

    const tryUpload = async (): Promise<boolean> => {
      if (!navigator.onLine) return false;
      try {
        const res = await fetch(`${API_URL}/video/streams/${id}/fragments?seq=${seq}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            'Content-Type': 'application/octet-stream',
            'X-Fragment-Seq': String(seq),
          },
          body: blob,
        });
        return res.ok;
      } catch {
        return false;
      }
    };

    if (await tryUpload()) return;

    // Sin conexión: encolar localmente para sincronizar después
    await queuePending({ id: itemId, streamId: id, seq, blob, attempts: 0 });
  }

  async function start() {
    setMsg(null);
    setStatus('starting');
    setElapsed(0);
    try {
      const stream = await apiFetch('/video/streams', {
        method: 'POST',
        body: JSON.stringify({
          latitude: latLong?.lat,
          longitude: latLong?.lon,
          resolution: config?.resolution ?? '1280x720',
          fps: config?.fps ?? 15,
          bitrate: config?.bitrate ?? 1200,
          audioEnabled: config?.audioEnabled ?? true,
          platform: 'pwa',
          deviceId: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          maxDurationSec: config?.maxDurationSec || undefined,
        }),
      });
      streamIdRef.current = stream.id;
      seqRef.current = 0;
      setMsg('Transmisión creada, activando cámara…');

      const [w, h] = (config?.resolution ?? '1280x720').split('x').map((n) => parseInt(n, 10));
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: w || 1280 },
          height: { ideal: h || 720 },
          frameRate: { ideal: config?.fps ?? 15 },
        },
        audio: config?.audioEnabled ?? true,
      });
      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play().catch(() => undefined);
      }

      const mimeType =
        config?.mimeType && MediaRecorder.isTypeSupported(config.mimeType) ? config.mimeType : 'video/webm';
      const rec = new MediaRecorder(media, {
        mimeType,
        videoBitsPerSecond: (config?.bitrate ?? 1200) * 1000,
      });
      recRef.current = rec;

      const fragmentSec = Math.max(2, config?.fragmentSec ?? 5);

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          uploadFragment(e.data).catch(() => undefined);
        }
      };

      rec.onerror = () => {
        setStatus('error');
        setMsg('Error en el grabador. Prueba detener y reiniciar la transmisión.');
      };

      rec.onstop = async () => {
        setStatus('uploading');
        try {
          const pending = await listPending();
          const owned = pending.filter((p) => p.streamId === stream.id);
          if (owned.length > 0) {
            const synced = await syncPending();
            const after = await listPending();
            const still = after.filter((p) => p.streamId === stream.id);
            if (still.length > 0) {
              setStatus('error');
              setMsg(`Grabación local, sin subir (${still.length} fragmentos). Se sincronizará cuando haya conexión.`);
              return;
            }
            setMsg(`Faltó conexión durante la grabación (${synced} fragmentos sincronizados).`);
          }
          const end = await apiFetch(`/video/streams/${stream.id}/end`, { method: 'PUT' });
          if (end.aborted) {
            setStatus('error');
            setMsg(`Transmisión sin contenido grabado: ${end.reason ?? ''}`);
            return;
          }
          setStatus('done');
          setMsg(`Grabación guardada (${end.recording?.durationSec ?? '?'}s). Se conserva ${end.recording?.hoursUntilExpiration ?? 48} horas.`);
        } catch (e: any) {
          setStatus('error');
          setMsg('Error al guardar: ' + (e?.message || 'intenta de nuevo'));
        }
      };

      const started = Date.now();
      timerRef.current = window.setInterval(() => {
        const sec = Math.floor((Date.now() - started) / 1000);
        setElapsed(sec);
        if (config?.maxDurationSec && config.maxDurationSec > 0 && sec >= config.maxDurationSec && recRef.current?.state === 'recording') {
          stop();
        }
      }, 1000);

      rec.start(fragmentSec * 1000);
      setStatus('recording');
    } catch (e: any) {
      setStatus('error');
      setMsg(e?.message || 'No se pudo acceder a la cámara');
    }
  }

  async function stop() {
    if (recRef.current && recRef.current.state !== 'inactive') {
      recRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  }

  const live = status === 'recording';
  const maxSec = config?.maxDurationSec && config.maxDurationSec > 0 ? config.maxDurationSec : null;

  return (
    <div className="space-y-3 p-4">
      <h1 className="text-lg font-bold text-slate-900">Grabación en vivo</h1>

      <div className="flex flex-wrap gap-2 text-xs">
        {!online ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">Sin conexión · cola local</span>
        ) : (
          <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">En línea</span>
        )}
        {latLong ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">GPS {latLong.lat.toFixed(5)}, {latLong.lon.toFixed(5)}</span>
        ) : null}
        {config ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
            {config.resolution} · {config.fps} fps · {config.bitrate} kbps{config.audioEnabled ? ' · audio' : ''} · expira en {config.expirationHours}h
          </span>
        ) : null}
      </div>

      {msg && (
        <div className={`rounded-xl p-3 text-sm ${status === 'error' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
          {msg}
        </div>
      )}

      <div className="card">
        <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-xl bg-black" />
        <div className="mt-3 flex items-center justify-between">
          <div>
            {live ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" /> EN VIVO · {elapsed}s{maxSec ? ` / ${maxSec}s` : ''}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Cámara apagada</span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {status === 'idle' || status === 'done' || status === 'error' ? (
            <button className="btn-primary col-span-2 w-full" onClick={start} disabled={!hasCamera || !hasServer.current}>
              ▶ Iniciar transmisión y grabación
            </button>
          ) : null}
          {status === 'starting' ? (
            <div className="col-span-2 text-center text-sm text-slate-500">Activando cámara…</div>
          ) : null}
          {live ? (
            <button className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white" onClick={stop}>
              ■ Detener transmisión
            </button>
          ) : null}
          {status === 'uploading' ? (
            <div className="col-span-2 text-center text-sm text-slate-500">Subiendo y guardando grabación…</div>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        El video se transmite en tiempo real y queda almacenado en fragmentos por {config?.fragmentSec ?? 5} segundos. Se conserva
        {config?.expirationHours ?? 48} horas o de forma indefinida si se conserva como evidencia. Si pierdes conexión, los
        fragmentos se guardan localmente y se sincronizan después. Cada acceso y descarga queda en auditoría.
      </p>
    </div>
  );
}