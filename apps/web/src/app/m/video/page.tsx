'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch, getAccessToken, API_URL } from '@/lib/api';

type RecStat = 'idle' | 'starting' | 'recording' | 'uploading' | 'done' | 'error';

export default function MobileVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamIdRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<RecStat>('idle');
  const [msg, setMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    if (!('MediaRecorder' in window)) {
      setHasCamera(false);
      setMsg('Tu dispositivo no soporta grabación (MediaRecorder no disponible).');
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function uploadChunk(blob: Blob): Promise<void> {
    const id = streamIdRef.current;
    if (!id) return;
    await fetch(`${API_URL}/video/streams/${id}/chunk`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/octet-stream',
      },
      body: blob,
    });
  }

  async function start() {
    setMsg(null);
    setStatus('starting');
    setElapsed(0);
    try {
      const stream = await apiFetch('/video/streams', {
        method: 'POST',
        body: JSON.stringify({ latitude: undefined, longitude: undefined }),
      });
      streamIdRef.current = stream.id;
      setMsg('Transmisión creada, activando cámara…');

      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      streamRef.current = media;
      if (videoRef.current) {
        videoRef.current.srcObject = media;
        await videoRef.current.play().catch(() => undefined);
      }

      const rec = new MediaRecorder(media, { mimeType: 'video/webm' });
      recRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          uploadChunk(e.data).catch(() => undefined);
        }
      };

      rec.onstop = async () => {
        setStatus('uploading');
        try {
          const end = await apiFetch(`/video/streams/${stream.id}/end`, { method: 'PUT' });
          setStatus('done');
          setMsg(`Grabación guardada (${end.recording?.durationSec ?? '?'}s). Se conserva 48 horas.`);
        } catch (e: any) {
          setStatus('error');
          setMsg('Error al guardar: ' + (e?.message || 'intenta de nuevo'));
        }
      };

      rec.start(5000);
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

  useEffect(() => {
    if (status === 'recording') {
      const started = Date.now();
      timerRef.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [status]);

  const live = status === 'recording';

  return (
    <div className="space-y-3 p-4">
      <h1 className="text-lg font-bold text-slate-900">Grabación en vivo</h1>

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
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" /> EN VIVO · {elapsed}s
              </span>
            ) : (
              <span className="text-xs text-slate-400">Cámara apagada</span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {status === 'idle' || status === 'done' || status === 'error' ? (
            <button className="btn-primary col-span-2 w-full" onClick={start} disabled={!hasCamera}>
              ▶ Iniciar grabación
            </button>
          ) : null}
          {status === 'starting' ? (
            <div className="col-span-2 text-center text-sm text-slate-500">Activando cámara…</div>
          ) : null}
          {live ? (
            <button className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white" onClick={stop}>
              ■ Detener
            </button>
          ) : null}
          {status === 'uploading' ? (
            <div className="col-span-2 text-center text-sm text-slate-500">Subiendo y guardando grabación…</div>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        El video se transmite en tiempo real y queda almacenado de forma segura por 48 horas. Solo personal autorizado puede
        verlo o descargarlo, y cada descarga se registra en auditoría.
      </p>
    </div>
  );
}