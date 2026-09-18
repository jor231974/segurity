'use client';

import { useEffect, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';

interface Consign {
  id: string;
  postId: string;
  title: string;
  content: string;
  version: string;
  status: string;
  createdAt: string;
  post?: { id: string; name: string; site?: { name: string } | null } | null;
}

const FIELDS: Field[] = [
  { name: 'postId', label: 'Puesto', type: 'select', required: true },
  { name: 'title', label: 'Título', required: true },
  { name: 'content', label: 'Instrucciones', type: 'textarea', required: true },
];

export default function ConsignsPage() {
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [posts, setPosts] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    apiFetch<any>('/posts')
      .then((res: any) => {
        const rows = Array.isArray(res) ? res : [];
        setPosts(rows.map((p: any) => ({ id: p.id, label: `${p.name} (${p.site?.name ?? ''})` })));
      })
      .catch(() => {});
  }, []);

  const fields = FIELDS.map((f) =>
    f.name === 'postId'
      ? { ...f, options: posts.map((p) => ({ label: p.label, value: p.id })) }
      : f,
  );

  return (
    <>
      <PageHeader
        icon="document"
        title="Consignas"
        subtitle="Instrucciones operativas por puesto"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nueva consigna
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/consigns"
        title="Consignas"
        subtitle="Instrucciones operativas por puesto"
        emptyText="No hay consignas registradas."
        emptyDescription="Redacta las instrucciones que verá el guardia en su puesto."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nueva consigna
          </button>
        }
        columns={[
          { key: 'title', label: 'Título', render: (r: Consign) => <span className="font-medium text-slate-900">{r.title}</span> },
          { key: 'post', label: 'Puesto', render: (r: Consign) => `${r.post?.name ?? '—'} (${r.post?.site?.name ?? ''})` },
          { key: 'version', label: 'Versión' },
          { key: 'status', label: 'Estatus', render: (r: Consign) => <StatusBadge status={r.status} /> },
        ]}
      />
      <EntityModal
        open={open}
        title="Nueva consigna"
        endpoint="/consigns"
        fields={fields}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}