import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  labelClassName?: string;
};

export function Input({ label, error, hint, prefix, suffix, className, id, labelClassName, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className={cn('text-[13px] font-medium text-foreground leading-none', labelClassName)}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3 text-muted">{prefix}</span>
        )}
        <input
          id={inputId}
          className={cn(
            'h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface text-sm text-foreground',
            'placeholder:text-muted-light outline-none',
            'transition-all duration-150',
            'hover:border-border-dark',
            'focus:border-primary focus:shadow-[var(--focus-ring)]',
            error && 'border-danger focus:border-danger focus:shadow-[var(--error-ring)]',
            'px-3',
            !!prefix && 'pl-9',
            !!suffix && 'pr-9',
            className
          )}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-muted">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-danger leading-none">{error}</p>}
      {hint && !error && <p className="text-xs text-muted leading-none">{hint}</p>}
    </div>
  );
}
