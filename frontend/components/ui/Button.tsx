import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:scale-[0.98] disabled:opacity-40',
  ghost: 'bg-transparent text-foreground hover:bg-surface-2 active:scale-[0.98]',
  danger: 'bg-danger text-white hover:opacity-90 active:scale-[0.98]',
  outline:
    'border border-border bg-surface text-foreground hover:bg-surface-2 active:scale-[0.98]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-md',
  md: 'h-11 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all',
        'disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
