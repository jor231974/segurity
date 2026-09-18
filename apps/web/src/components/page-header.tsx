import { IconName, Icon } from '@/components/icons';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: IconName;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, icon, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary-600 shadow-card ring-1 ring-slate-200">
            <Icon name={icon} size={22} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      {children}
    </div>
  );
}