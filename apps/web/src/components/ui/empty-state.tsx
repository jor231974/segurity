import { IconName, Icon } from '../icons';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: IconName;
  className?: string;
}

export function EmptyState({ title, description, action, icon = 'list', className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className ?? ''}`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}