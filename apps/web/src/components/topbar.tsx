'use client';

import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { IconMenu, IconLogout, IconBell, IconUser } from '@/components/icons';

interface TopbarProps {
  onMenu?: () => void;
}

const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Superadministrador',
  DIRECTOR: 'Director',
  ADMINISTRATOR: 'Administrador',
  HR: 'Recursos Humanos',
  OPS_COORDINATOR: 'Coordinador de Operaciones',
  SUPERVISOR: 'Supervisor',
  MONITOR: 'Monitor',
  GUARD: 'Guardia',
  ACCOUNTING: 'Contabilidad',
  CLIENT: 'Cliente',
};

export function Topbar({ onMenu }: TopbarProps) {
  const router = useRouter();
  const { user } = useAuth();

  const roleLabel = user?.roleCodes?.map((r) => ROL_LABELS[r] ?? r).join(' · ') || '';
  const initials = user ? `${user.name?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '';

  function logout() {
    setAccessToken(null);
    if (typeof window !== 'undefined') window.__AUTH_TOKEN__ = undefined;
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenu && (
          <button
            onClick={onMenu}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <IconMenu size={20} />
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {user ? `${user.name} ${user.lastName}` : 'Cargando…'}
          </p>
          {roleLabel && <p className="truncate text-xs text-slate-500">{roleLabel}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => router.push('/notifications')}
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Avisos"
          title="Avisos"
        >
          <IconBell size={19} />
        </button>
        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white">
            {initials || <IconUser size={15} />}
          </div>
          <div className="hidden sm:block">
            <p className="max-w-[160px] truncate text-xs font-medium text-slate-700">
              {user ? `${user.name} ${user.lastName}` : ''}
            </p>
            <p className="max-w-[160px] truncate text-[11px] text-slate-400">
              {user?.email ?? ''}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:px-3"
          title="Cerrar sesión"
        >
          <IconLogout size={17} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}