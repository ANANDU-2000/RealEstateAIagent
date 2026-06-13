import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'outline' | 'subtle';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:scale-[0.975] shadow-[0_1px_2px_rgba(37,99,235,0.25)] hover:shadow-[0_2px_6px_rgba(37,99,235,0.30)] disabled:opacity-40 disabled:shadow-none',
  ghost:
    'bg-transparent text-foreground hover:bg-surface-2 active:bg-surface-3 active:scale-[0.975]',
  danger:
    'bg-danger text-white hover:bg-red-700 active:scale-[0.975] shadow-[0_1px_2px_rgba(220,38,38,0.20)]',
  outline:
    'border border-border bg-surface text-foreground hover:bg-surface-2 hover:border-border-dark active:scale-[0.975]',
  subtle:
    'bg-primary-muted text-primary hover:bg-primary-100 active:scale-[0.975]',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7  px-2.5 text-xs  rounded-[var(--radius-sm)] gap-1.5',
  sm: 'h-9  px-3   text-sm  rounded-[var(--radius-md)] gap-2',
  md: 'h-10 px-4   text-sm  rounded-[var(--radius-md)] gap-2',
  lg: 'h-11 px-5   text-sm  rounded-[var(--radius-lg)] gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          {iconLeft && <span className="shrink-0">{iconLeft}</span>}
          {children}
          {iconRight && <span className="shrink-0">{iconRight}</span>}
        </>
      )}
    </button>
  );
}
