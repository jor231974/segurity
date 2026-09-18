'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import RequireAuth from '@/components/require-auth';
import { useAuth } from '@/components/auth-provider';
import { Icon, IconName, IconShield, IconLogout } from '@/components/icons';

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/portal', label: 'Inicio', icon: 'dashboard' },
  { href: '/portal/sitios', label: 'Mis sitios', icon: 'site' },
  { href: '/portal/solicitudes', label: 'Solicitudes', icon: 'mail' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <RequireAuth roles={['CLIENT']}>
      <div className="flex min-h-screen flex-col bg-slate-100">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-sm">
              <IconShield size={17} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {user ? `${user.name} ${user.lastName}` : ''}
              </p>
              <p className="text-[11px] text-slate-400">Portal del cliente</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
          >
            <IconLogout size={13} /> Salir
          </Link>
        </header>

        <main className="flex-1 pb-20">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex">
            {TABS.map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                    active ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={active ? 'text-primary-600' : ''}>
                    <Icon name={t.icon} size={20} />
                  </span>
                  {t.label}
                  {active && <span className="h-0.5 w-5 rounded-full bg-primary-500" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </RequireAuth>
  );
}