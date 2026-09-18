'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import { IconShield, IconMail, IconLock, IconEye, IconCheck } from '@/components/icons';

const FEATURES = [
  'Monitoreo de guardias y turnos en tiempo real',
  'Rondines, bitácora e incidencias digitalizadas',
  'Video por turno con almacenamiento seguro',
  'Portal para clientes y facturación',
];

export default function LoginPage() {
  const router = useRouter();
  const { reload } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      await reload();
      router.push('/');
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión';
      if (String(msg).toLowerCase().includes('401')) setError('Usuario o contraseña incorrectos.');
      else if (String(msg).toLowerCase().includes('bloqueada')) setError('Cuenta bloqueada temporalmente. Intenta más tarde.');
      else setError('No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Panel de marca */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 p-10 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-400/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
            <IconShield size={20} />
          </div>
          <div>
            <p className="text-base font-bold text-white">Grupo Servicom</p>
            <p className="text-xs text-slate-300">Seguridad Privada · Plataforma Integral</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Control total de tu operación de seguridad.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Una sola plataforma para administrar guardias, turnos, rondines, videovigilancia y la relación con tus clientes.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                  <IconCheck size={12} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} Grupo Servicom · Acceso restringido al personal autorizado
        </p>
      </div>

      {/* Formulario */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-sm">
              <IconShield size={22} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Grupo Servicom</p>
              <p className="text-xs text-slate-500">Seguridad Privada</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-slate-500">Ingresa con tus credenciales para continuar.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label" htmlFor="email">Correo electrónico</label>
              <div className="relative">
                <IconMail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  className="input input-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Contraseña</label>
              <div className="relative">
                <IconLock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  className="input input-icon pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <IconEye size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cuentas de demostración</p>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p><span className="font-medium">Administración:</span> admin@gruposervicom.com / Admin123!</p>
              <p><span className="font-medium">Supervisor:</span> supervisor@gruposervicom.com / Supervisor123!</p>
              <p><span className="font-medium">Guardia:</span> guardia@gruposervicom.com / Guardia123!</p>
              <p><span className="font-medium">Cliente:</span> cliente@abccorp.com / Cliente123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}