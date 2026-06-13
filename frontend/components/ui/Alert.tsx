import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const config: Record<
  AlertVariant,
  { icon: typeof Info; className: string }
> = {
  info: {
    icon: Info,
    className: 'border-primary/20 bg-primary-light text-primary',
  },
  success: {
    icon: CheckCircle,
    className: 'border-success/20 bg-success-light text-success',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-warning/20 bg-warning-light text-warning',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-danger/20 bg-danger-light text-danger',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: variantClass } = config[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-lg)] border px-4 py-3',
        variantClass,
        className
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex min-w-0 flex-col gap-0.5">
        {title && <p className="text-[13px] font-semibold">{title}</p>}
        <div className="text-[13px]">{children}</div>
      </div>
    </div>
  );
}
