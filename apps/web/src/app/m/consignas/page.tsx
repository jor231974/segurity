'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Consign {
  id: string;
  postId: string;
  title: string;
  content: string;
  version: string;
  status: string;
  post?: { id: string; name: string; site?: { name: string } } | null;
}

export default function MobileConsigns() {
  const [list, setList] = useState<Consign[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Consign[]>('/consigns/mine')
      .then(setList)
      .catch((e) => setMsg(e?.message));
  }, []);

  if (msg) return <div className="p-4 text-sm text-red-600">{msg}</div>;
  if (!list) return <div className="p-4 text-sm text-slate-400">Cargando…</div>;

  return (
    <div className="space-y-3 p-4">
      <h1 className="text-lg font-bold text-slate-900">Mis consignas</h1>
      {list.length === 0 && <p className="text-sm text-slate-400">No tienes consignas asignadas.</p>}
      {list.map((c) => (
        <div key={c.id} className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">{c.title}</h2>
            <span className="badge bg-slate-100 text-slate-600">v{c.version}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{c.post?.name ?? ''} · {c.post?.site?.name ?? ''}</p>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{c.content}</pre>
        </div>
      ))}
    </div>
  );
}