'use client';

import Link from 'next/link';
import { Icon, IconName } from '../icons';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONES: Record<Tone, { icon: string; iconBg: string; text: string }> = {
  primary: { icon: 'text-primary-600', iconBg: 'bg-primary-50', text: 'text-slate-900' },
  success: { icon: 'text-emerald-600', iconBg: 'bg-emerald-50', text: 'text-slate-900' },
  warning: { icon: 'text-amber-600', iconBg: 'bg-amber-50', text: 'text-slate-900' },
  danger: { icon: 'text-red-600', iconBg: 'bg-red-50', text: 'text-slate-900' },
  neutral: { icon: 'text-slate-500', iconBg: 'bg-slate-100', text: 'text-slate-900' },
  info: { icon: 'text-sky-600', iconBg: 'bg-sky-50', text: 'text-slate-900' },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  icon?: IconName;
  href?: string;
  alert?: boolean;
}

export function KpiCard({ label, value, sub, tone = 'primary', icon, href, alert }: KpiCardProps) {
  const t = TONES[tone];
  const inner = (
    <div className="card card-hover relative h-full overflow-hidden">
      {alert && (
        <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
      )}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${t.text}`}>{value}</p>
        </div>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.iconBg} ${t.icon}`}>
            <Icon name={icon} size={20} />
          </div>
        )}
      </div>
      {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {inner}
      </Link>
    );
  }
  return inner;
}