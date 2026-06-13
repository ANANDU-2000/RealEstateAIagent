import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'orange'
  | 'purple'
  | 'muted';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-3 text-text-secondary border-border',
  primary: 'bg-primary-light text-primary border-primary-100',
  success: 'bg-success-light text-success border-success/20',
  warning: 'bg-warning-light text-warning border-warning/20',
  danger: 'bg-danger-light text-danger border-danger/20',
  orange: 'bg-orange-light text-orange border-orange/20',
  purple: 'bg-purple-light text-purple border-purple/20',
  muted: 'bg-surface-2 text-muted border-transparent',
};

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
};

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
        'text-[11px] font-semibold leading-none whitespace-nowrap',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
