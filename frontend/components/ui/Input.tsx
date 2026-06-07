import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-11 w-full rounded-lg border bg-surface px-3 text-sm text-foreground',
          'placeholder:text-muted-light outline-none transition-shadow',
          'focus:border-primary focus:shadow-[var(--focus-ring)]',
          error && 'border-danger focus:border-danger focus:shadow-[var(--error-ring)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
