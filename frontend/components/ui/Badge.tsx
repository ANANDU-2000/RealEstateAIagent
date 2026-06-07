import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-3 text-muted',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  primary: 'bg-primary-light text-primary',
};

export function Badge({
  variant = 'default',
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
