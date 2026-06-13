import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const config: Record<AlertVariant, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'border-primary bg-primary-light text-primary' },
  success: { icon: CheckCircle, className: 'border-success bg-success-light text-success' },
  warning: { icon: AlertTriangle, className: 'border-warning bg-warning-light text-warning' },
  error: { icon: AlertTriangle, className: 'border-danger bg-danger-light text-danger' },
};

export function Alert({
  variant = 'info',
  children,
  className,
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: variantClass } = config[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border px-4 py-3 text-sm',
        variantClass,
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
