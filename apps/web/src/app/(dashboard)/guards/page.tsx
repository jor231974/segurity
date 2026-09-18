'use client';

import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table';
import { EntityModal, Field } from '@/components/entity-modal';
import { apiFetch } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/components/ui/toast';
import { IconClose } from '@/components/icons';

interface ClientOption {
  id: string;
  commercialName: string;
  legalName?: string | null;
  label: string;
  value: string;
}

interface Guard {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  hireDate: string;
  zone?: { id: string; name: string } | null;
  assignedClient?: { id: string; commercialName: string; legalName?: string | null } | null;
  supervisor?: { firstName: string; lastName: string } | null;
  _count?: { shifts: number; documents: number };
}

function clientLabel(c?: { commercialName: string; legalName?: string | null } | null): string {
  if (!c) return '—';
  return c.commercialName || c.legalName || '—';
}

export default function GuardsPage() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [reassigning, setReassigning] = useState<Guard | null>(null);
  const [targetClient, setTargetClient] = useState('');
  const [reason, setReason] = useState('');
  const [savingReassign, setSavingReassign] = useState(false);

  useEffect(() => {
    apiFetch<any>('/clients')
      .then((res: any) => {
        const list = res?.items ?? res ?? [];
        setClients(list.map((c: any) => ({
          id: c.id,
          value: c.id,
          commercialName: c.commercialName,
          legalName: c.legalName,
          label: c.commercialName || c.legalName,
        })));
      })
      .catch(() => setClients([]));
  }, []);

  const fields: Field[] = useMemo(() => {
    const base: Field[] = [
      { name: 'employeeNumber', label: 'No. de empleado', required: true },
      { name: 'firstName', label: 'Nombre(s)', required: true },
      { name: 'lastName', label: 'Apellido paterno', required: true },
      { name: 'middleName', label: 'Apellido materno' },
      { name: 'email', label: 'Email (genera usuario)', type: 'email' },
      { name: 'phone', label: 'Teléfono' },
      { name: 'address', label: 'Dirección' },
      { name: 'hireDate', label: 'Fecha de contratación', type: 'date', required: true },
      { name: 'curp', label: 'CURP' },
      { name: 'rfc', label: 'RFC' },
      { name: 'nss', label: 'NSS' },
      {
        name: 'assignedClientId',
        label: 'Cliente asignado',
        type: 'select',
        hint: 'Exclusivo: solo podrá cubrir turnos de este cliente. Se puede cambiar después con "Reasignar".',
      },
      { name: 'zoneId', label: 'Zona', type: 'select' },
      { name: 'supervisorId', label: 'Supervisor', type: 'select' },
    ];
    return base.map((f) => (f.name === 'assignedClientId' ? { ...f, options: clients } : f));
  }, [clients]);

  async function doReassign(e: React.FormEvent) {
    e.preventDefault();
    if (!reassigning) return;
    setSavingReassign(true);
    try {
      const res: any = await apiFetch(`/guards/${reassigning.id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({ clientId: targetClient, reason: reason || undefined }),
      });
      const cancelled = res?.cancelledShifts ?? 0;
      toast.success(cancelled > 0 ? `Guardia reasignado. ${cancelled} turno(s) futuro(s) cancelado(s).` : 'Guardia reasignado correctamente.');
      setReassigning(null);
      setTargetClient('');
      setReason('');
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err?.message || 'No fue posible reasignar el guardia.');
    } finally {
      setSavingReassign(false);
    }
  }

  return (
    <>
      <PageHeader
        icon="users"
        title="Guardias / Elementos"
        subtitle="Personal de seguridad asignado"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo guardia
          </button>
        }
      />
      <DataTable
        hideHeader
        key={reloadKey}
        endpoint="/guards"
        title="Guardias / Elementos"
        subtitle="Personal de seguridad asignado"
        emptyText="No hay guardias registrados."
        emptyDescription="Registra a tu primer elemento para poder asignarlo a turnos."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Nuevo guardia
          </button>
        }
        columns={[
          { key: 'employeeNumber', label: 'No.', render: (r: Guard) => <span className="font-medium text-slate-900">{r.employeeNumber}</span> },
          { key: 'firstName', label: 'Nombre', render: (r: Guard) => `${r.firstName} ${r.lastName}` },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Teléfono' },
          { key: 'assignedClient', label: 'Cliente asignado', render: (r: Guard) => <span className="text-sm font-medium text-slate-700">{clientLabel(r.assignedClient)}</span> },
          { key: 'zone', label: 'Zona', render: (r: Guard) => r.zone?.name ?? '—' },
          { key: 'status', label: 'Estatus', render: (r: Guard) => <StatusBadge status={r.status} /> },
          {
            key: 'actions',
            label: '',
            render: (r: Guard) => (
              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  setReassigning(r);
                  setTargetClient(r.assignedClient?.id ?? '');
                }}
              >
                Reasignar
              </button>
            ),
          },
        ]}
      />
      <EntityModal
        open={open}
        title="Nuevo guardia"
        endpoint="/guards"
        fields={fields}
        onClose={() => setOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />

      {reassigning && (
        <div
          className="fixed inset-0 z-[80] flex animate-fadeIn items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          onClick={() => !savingReassign && setReassigning(null)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-md animate-slideIn flex-col overflow-hidden rounded-2xl bg-white shadow-lift"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reasignar guardia</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {reassigning.firstName} {reassigning.lastName} ({reassigning.employeeNumber})
                </p>
              </div>
              <button
                onClick={() => !savingReassign && setReassigning(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <IconClose size={18} />
              </button>
            </div>

            <form onSubmit={doReassign} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Al cambiar al guardia de cliente, sus turnos futuros ya programados en el cliente anterior serán cancelados.
                </div>
                <div>
                  <label className="label" htmlFor="targetClient">
                    Asignar a cliente
                  </label>
                  <select
                    id="targetClient"
                    className="input"
                    value={targetClient}
                    onChange={(e) => setTargetClient(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="reason">
                    Motivo de la reasignación
                  </label>
                  <textarea
                    id="reason"
                    className="input"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej. Terminó el contrato con el cliente anterior"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/50 px-6 py-4">
                <button type="button" className="btn-secondary" onClick={() => setReassigning(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingReassign || !targetClient}>
                  {savingReassign ? 'Reasignando…' : 'Reasignar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}