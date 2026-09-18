'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import { getAccessToken } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';

export default function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !getAccessToken()) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router]);

  if (loading || !getAccessToken() || !user) {
    return <div className="flex min-h-screen items-center justify-center">Cargando…</div>;
  }

  if (roles && roles.length > 0 && !roles.some((r) => user.roleCodes.includes(r))) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 p-6 text-center">
        <p className="text-lg font-semibold text-slate-800">Acceso restringido</p>
        <p className="text-sm text-slate-500">Tu usuario no tiene permisos para esta sección.</p>
        <Link href="/" className="btn-primary text-sm">
          Ir al inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}