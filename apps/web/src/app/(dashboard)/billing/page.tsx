'use client';

import { DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

export default function BillingPage() {
  return (
    <div>
      <PageHeader
        icon="invoice"
        title="Facturación"
        subtitle="Facturas, pagos y estado de cuenta de clientes"
      />
      <DataTable
        hideHeader
        endpoint="/billing/invoices"
        title="Facturación"
        subtitle="Facturas, pagos y estado de cuenta de clientes"
        emptyText="No hay facturas registradas."
        emptyDescription="Las facturas generadas por los contratos y servicios aparecerán aquí."
        columns={[
          { key: 'number', label: 'Factura', render: (r: any) => <span className="font-medium text-slate-900">{r.number ?? r.id?.slice(0, 8) ?? '—'}</span> },
          { key: 'client', label: 'Cliente', render: (r: any) => r.client?.commercialName ?? '—' },
          { key: 'total', label: 'Monto', render: (r: any) => r.total ? `$${Number(r.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
          { key: 'dueDate', label: 'Vencimiento', render: (r: any) => r.dueDate ? new Date(r.dueDate).toLocaleDateString('es-MX') : '—' },
          {
            key: 'status',
            label: 'Estatus',
            render: (r: any) =>
              r.status === 'pagado' || r.status === 'paid'
                ? <StatusBadge status="pagado" />
                : <StatusBadge status={r.status ?? 'pendiente'} />,
          },
        ]}
      />
    </div>
  );
}