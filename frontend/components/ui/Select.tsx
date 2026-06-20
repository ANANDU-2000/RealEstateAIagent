import { cn } from '@/lib/utils';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  labelClassName?: string;
};

export function Select({ label, error, hint, options, className, id, labelClassName, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className={cn('text-[13px] font-medium text-foreground leading-none', labelClassName)}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-foreground',
          'outline-none transition-all duration-150',
          'hover:border-border-dark',
          'focus:border-primary focus:shadow-[var(--focus-ring)]',
          error && 'border-danger focus:border-danger focus:shadow-[var(--error-ring)]',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger leading-none">{error}</p>}
      {hint && !error && <p className="text-xs text-muted leading-none">{hint}</p>}
    </div>
  );
}
