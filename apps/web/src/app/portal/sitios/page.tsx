'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Site {
  id: string;
  name: string;
  address: string;
  posts: { id: string; name: string; shiftStart: string; shiftEnd: string }[];
}

export default function PortalSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/clients/mine');
      setSites(res.sites ?? []);
    } catch (e: any) {
      setMsg(e?.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-lg font-bold text-slate-900">Mis instalaciones</h1>
      {msg && <p className="text-xs text-red-500">{msg}</p>}
      {sites.length === 0 ? (
        <p className="text-sm text-slate-400">Sin instalaciones registradas.</p>
      ) : (
        <ul className="space-y-3">
          {sites.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-800">{s.name}</p>
              <p className="mt-1 text-xs text-slate-500">{s.address}</p>
              <div className="mt-3 space-y-1">
                {s.posts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span className="text-slate-700">{p.name}</span>
                    <span className="text-slate-500">{p.shiftStart} – {p.shiftEnd}</span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}