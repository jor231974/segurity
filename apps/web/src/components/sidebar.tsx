'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, IconName } from '@/components/icons';
import { IconShield } from '@/components/icons';
import { IconClose } from '@/components/icons';
import { useAuth } from '@/components/auth-provider';
import { PERMISSIONS } from '@servicom/shared';

interface NavItem {
  href: string;
  label: string;
  section: string;
  icon: IconName;
  perm?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', section: 'general', icon: 'dashboard', perm: PERMISSIONS.DASHBOARD_VIEW },
  { href: '/notifications', label: 'Avisos', section: 'general', icon: 'bell', perm: PERMISSIONS.DASHBOARD_VIEW },
  { href: '/clients', label: 'Clientes', section: 'comercial', icon: 'building', perm: PERMISSIONS.CLIENTS_VIEW },
  { href: '/contracts', label: 'Contratos', section: 'comercial', icon: 'contract', perm: PERMISSIONS.CONTRACTS_VIEW },
  { href: '/sites', label: 'Instalaciones', section: 'comercial', icon: 'site', perm: PERMISSIONS.SITES_VIEW },
  { href: '/posts', label: 'Puestos', section: 'operacion', icon: 'post', perm: PERMISSIONS.POSTS_VIEW },
  { href: '/guards', label: 'Guardias', section: 'operacion', icon: 'users', perm: PERMISSIONS.GUARDS_VIEW },
  { href: '/shifts', label: 'Turnos', section: 'operacion', icon: 'shifts', perm: PERMISSIONS.SHIFTS_VIEW },
  { href: '/consigns', label: 'Consignas', section: 'operacion', icon: 'list', perm: PERMISSIONS.CONSIGNS_VIEW },
  { href: '/incidents', label: 'Incidencias', section: 'operacion', icon: 'incident', perm: PERMISSIONS.INCIDENTS_VIEW },
  { href: '/patrols', label: 'Rondines', section: 'operacion', icon: 'route', perm: PERMISSIONS.PATROLS_VIEW },
  { href: '/attendance', label: 'Asistencia', section: 'operacion', icon: 'clock', perm: PERMISSIONS.ATTENDANCE_VIEW },
  { href: '/gps', label: 'Ubicaciones', section: 'operacion', icon: 'gps', perm: PERMISSIONS.GPS_VIEW },
  { href: '/visitors', label: 'Visitantes', section: 'operacion', icon: 'visitors', perm: PERMISSIONS.VISITORS_VIEW },
  { href: '/vehicles', label: 'Vehículos', section: 'operacion', icon: 'car', perm: PERMISSIONS.VEHICLES_VIEW },
  { href: '/inventory', label: 'Equipo', section: 'operacion', icon: 'box', perm: PERMISSIONS.INVENTORY_VIEW },
  { href: '/prepayroll', label: 'Pre-nómina', section: 'finanzas', icon: 'payroll', perm: PERMISSIONS.PREPAYROLL_VIEW },
  { href: '/billing', label: 'Facturación', section: 'finanzas', icon: 'invoice', perm: PERMISSIONS.BILLING_VIEW },
  { href: '/video', label: 'Video', section: 'supervision', icon: 'camera', perm: PERMISSIONS.VIDEO_RECORDING_VIEW },
  { href: '/supervision', label: 'Supervisión', section: 'supervision', icon: 'supervis', perm: PERMISSIONS.SUPERVISION_VIEW },
  { href: '/sos', label: 'SOS', section: 'supervision', icon: 'sos', perm: PERMISSIONS.SOS_VIEW },
  { href: '/users', label: 'Usuarios', section: 'admin', icon: 'user', perm: PERMISSIONS.USERS_VIEW },
  { href: '/audit', label: 'Auditoría', section: 'admin', icon: 'eye', perm: PERMISSIONS.AUDIT_VIEW },
];

const SECTIONS: { key: string; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'comercial', label: 'Comercial' },
  { key: 'operacion', label: 'Operación' },
  { key: 'finanzas', label: 'Finanzas' },
  { key: 'supervision', label: 'Supervisión' },
  { key: 'admin', label: 'Administración' },
];

function Nav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const perms = new Set(user?.permissions ?? []);

  const visibleItems = NAV_ITEMS.filter(
    (i) => !i.perm || perms.has(i.perm) || user?.roleCodes?.includes('SUPER_ADMIN'),
  );

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {SECTIONS.map((sec) => {
        const items = visibleItems.filter((i) => i.section === sec.key);
        if (items.length === 0) return null;
        return (
          <div key={sec.key} className="mb-5">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {sec.label}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon name={item.icon} size={17} className={active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500'} />
                    <span>{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-sm">
        <IconShield size={18} />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight text-slate-900">Grupo Servicom</p>
        <p className="text-[11px] text-slate-400">Seguridad Integral</p>
      </div>
    </div>
  );
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Drawer móvil */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-white shadow-drawer transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="lg:hidden">
          <div className="relative">
            <Brand />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar menú"
            >
              <IconClose size={18} />
            </button>
          </div>
        </div>
        <div className="hidden lg:block">
          <Brand />
        </div>
        <Nav />
      </aside>
    </>
  );
}