'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, IconName } from '@/components/icons';
import { IconShield } from '@/components/icons';
import { IconClose } from '@/components/icons';

interface NavItem {
  href: string;
  label: string;
  section: string;
  icon: IconName;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Inicio', section: 'general', icon: 'dashboard' },
  { href: '/notifications', label: 'Avisos', section: 'general', icon: 'bell' },
  { href: '/clients', label: 'Clientes', section: 'comercial', icon: 'building' },
  { href: '/contracts', label: 'Contratos', section: 'comercial', icon: 'contract' },
  { href: '/sites', label: 'Instalaciones', section: 'comercial', icon: 'site' },
  { href: '/posts', label: 'Puestos', section: 'operacion', icon: 'post' },
  { href: '/guards', label: 'Guardias', section: 'operacion', icon: 'users' },
  { href: '/shifts', label: 'Turnos', section: 'operacion', icon: 'shifts' },
  { href: '/consigns', label: 'Consignas', section: 'operacion', icon: 'list' },
  { href: '/incidents', label: 'Incidencias', section: 'operacion', icon: 'incident' },
  { href: '/patrols', label: 'Rondines', section: 'operacion', icon: 'route' },
  { href: '/attendance', label: 'Asistencia', section: 'operacion', icon: 'clock' },
  { href: '/gps', label: 'Ubicaciones', section: 'operacion', icon: 'gps' },
  { href: '/visitors', label: 'Visitantes', section: 'operacion', icon: 'visitors' },
  { href: '/vehicles', label: 'Vehículos', section: 'operacion', icon: 'car' },
  { href: '/inventory', label: 'Equipo', section: 'operacion', icon: 'box' },
  { href: '/prepayroll', label: 'Pre-nómina', section: 'finanzas', icon: 'payroll' },
  { href: '/billing', label: 'Facturación', section: 'finanzas', icon: 'invoice' },
  { href: '/video', label: 'Video', section: 'supervision', icon: 'camera' },
  { href: '/supervision', label: 'Supervisión', section: 'supervision', icon: 'supervis' },
  { href: '/sos', label: 'SOS', section: 'supervision', icon: 'sos' },
  { href: '/users', label: 'Usuarios', section: 'admin', icon: 'user' },
  { href: '/audit', label: 'Auditoría', section: 'admin', icon: 'eye' },
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
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {SECTIONS.map((sec) => {
        const items = NAV_ITEMS.filter((i) => i.section === sec.key);
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