'use client';

import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function PrepayrollPage() {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  async function handleGenerate() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setGenerating(true);
    try {
      await apiFetch('/prepayroll', {
        method: 'POST',
        body: JSON.stringify({
          periodStart: start.toISOString().slice(0, 10),
          periodEnd: end.toISOString().slice(0, 10),
        }),
      });
      setReloadKey((k) => k + 1);
      toast.success('Pre-nómina generada', 'El cálculo del periodo se guardó correctamente.');
    } catch (e: any) {
      const msg = e?.message || '';
      if (String(msg).toLowerCase().includes('ya existe') || String(msg).toLowerCase().includes('409'))
        toast.info('Ya existe una pre-nómina', 'Para el periodo actual ya se generó una pre-nómina.');
      else toast.error('No fue posible generar la pre-nómina', 'Verifica que existan turnos y asistencias en el periodo.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <DataTable
        key={reloadKey}
        endpoint="/prepayroll"
        title="Pre-nómina"
        subtitle="Cálculo de nómina quincenal/mensual de guardias"
        emptyText="No hay pre-nóminas generadas. Use el botón para generar una."
        actions={
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generando…' : 'Generar pre-nómina actual'}
          </button>
        }
        columns={[
          { key: 'periodStart', label: 'Inicio', render: (r: any) => fmtDate(r.periodStart) },
          { key: 'periodEnd', label: 'Fin', render: (r: any) => fmtDate(r.periodEnd) },
          { key: 'totalAmount', label: 'Monto total', render: (r: any) => r.totalAmount ? `$${Number(r.totalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
          { key: '_count', label: 'Guardias', render: (r: any) => r._count?.lines ?? 0 },
          { key: 'generatedBy', label: 'Generado por', render: (r: any) => r.generatedBy ? `${r.generatedBy.name} ${r.generatedBy.lastName}` : '—' },
          { key: 'createdAt', label: 'Fecha', render: (r: any) => fmtDate(r.createdAt) },
        ]}
      />
    </>
  );
}