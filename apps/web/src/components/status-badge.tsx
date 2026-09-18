const MAP: Record<string, string> = {
  // activo/estados positivos
  activo: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  alta: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  activada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  aprobado: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  resuelto: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  dentro: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  completa: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  completo: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cumple: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pagado: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  // negativos / crítica
  baja: 'bg-red-50 text-red-700 ring-red-600/20',
  no_cumple: 'bg-red-50 text-red-700 ring-red-600/20',
  fuera: 'bg-red-50 text-red-700 ring-red-600/20',
  activa: 'bg-red-50 text-red-700 ring-red-600/20',
  vencida: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelado: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  suspendido: 'bg-red-50 text-red-700 ring-red-600/20',
  // pendiente / atención
  pendiente: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  en_revision: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'en revisión': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  en_investigacion: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  en_proceso: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  atendida: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  abierta: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  fuera_de_horario: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  fuera_de_ruta: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  fuera_de_zona: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  programado: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  programa: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  asignado: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  transmitiendo: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  parcialmente_pagada: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  en_comision: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  'en comisión': 'bg-purple-50 text-purple-700 ring-purple-600/20',
  vacaciones: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  media: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  alta_severidad: 'bg-red-50 text-red-700 ring-red-600/20',
  terminado: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  cerrado: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  cerrada: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  inactivo: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  disponible: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  fuera_ruta: 'bg-red-50 text-red-700 ring-red-600/20',
  sin_senal: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  sin_datos: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  expirada: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase() ?? '';
  return (
    <span className={`badge ring-1 ring-inset ${MAP[key] ?? 'bg-slate-100 text-slate-600 ring-slate-500/20'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
}