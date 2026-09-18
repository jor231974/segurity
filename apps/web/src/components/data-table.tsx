'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';
import { IconRefresh, IconSearch, IconChevronRight } from '@/components/icons';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  endpoint: string;
  columns: Column<T>[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  emptyText?: string;
  emptyDescription?: string;
  refreshKey?: unknown;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  hideHeader?: boolean;
}

export function DataTable<T extends { id: string }>({
  endpoint,
  columns,
  title,
  subtitle,
  actions,
  emptyText = 'Sin registros.',
  emptyDescription,
  refreshKey,
  searchPlaceholder = 'Buscar en esta lista…',
  toolbar,
  hideHeader = false,
}: DataTableProps<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [paginated, setPaginated] = useState(false);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res: any = await apiFetch(`${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}&limit=${limit}`);
      let rows: any[] | null = null;
      if (res && typeof res === 'object' && 'items' in res) {
        rows = res.items;
        setTotal(Number(res.total ?? 0));
        setPaginated(true);
      } else if (Array.isArray(res)) {
        rows = res;
        setTotal(res.length);
        setPaginated(false);
      }
      setItems((rows ?? []) as T[]);
      if (rows && rows.length === 0 && page > 1) setPage(1);
    } catch (e: any) {
      setError(e.message);
      setItems([]);
      setTotal(0);
    }
  }, [endpoint, page, limit]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (refreshKey !== undefined) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const visible = useMemo(() => {
    if (!items) return items;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      columns.some((c) => {
        const raw = c.render ? undefined : (row as any)[c.key];
        const val = raw !== undefined ? String(raw ?? '') : '';
        const rendered = c.render ? String((c.render(row) as any)?.toString?.() ?? '') : val;
        return (val + ' ' + rendered).toLowerCase().includes(q);
      }),
    );
  }, [items, query, columns]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showPagination = paginated && total > 0 && (total > limit || page > 1);
  const loading = items === null && !error;

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <div>
      {!hideHeader && (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {(toolbar || items !== null) && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="relative w-full max-w-xs">
              <IconSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="input input-icon !py-1.5 text-sm"
                aria-label="Buscar"
              />
            </div>
            <div className="flex items-center gap-2">
              {toolbar}
              <button
                onClick={refresh}
                disabled={refreshing}
                className="btn-secondary btn-icon"
                title="Actualizar"
                aria-label="Actualizar"
              >
                <IconRefresh size={15} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                {Array.from({ length: Math.min(columns.length, 5) }).map((__, j) => (
                  <div key={j} className="skeleton h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        )}

        {!loading && visible && visible.length === 0 && (
          <EmptyState
            title={query ? 'Sin resultados' : emptyText}
            description={query ? 'Intenta con otro término de búsqueda.' : emptyDescription}
            icon={query ? 'search' : 'list'}
          />
        )}

        {!loading && visible && visible.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="bg-slate-50/70">
                  <tr>
                    {columns.map((c) => (
                      <th key={c.key}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-primary-50/40">
                      {columns.map((c) => (
                        <td key={c.key}>
                          {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showPagination && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                <span className="text-sm text-slate-500">
                  Página <span className="font-semibold text-slate-700">{page}</span> de {totalPages} ·{' '}
                  <span className="font-semibold text-slate-700">{total}</span> registro(s)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="btn-secondary btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <IconChevronRight size={14} className="rotate-180" />
                    Anterior
                  </button>
                  <button
                    className="btn-secondary btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                    <IconChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
            {!showPagination && paginated && total > 0 && (
              <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                {total} registro(s)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}