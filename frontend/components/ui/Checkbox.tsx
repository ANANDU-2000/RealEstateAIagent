import { cn } from '@/lib/utils';

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode;
  error?: string;
};

export function Checkbox({ label, error, className, id, ...props }: CheckboxProps) {
  const checkboxId = id ?? 'checkbox';

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-2">
        <input
          id={checkboxId}
          type="checkbox"
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary',
            className
          )}
          {...props}
        />
        <span className="text-sm text-muted leading-snug">{label}</span>
      </label>
      {error && <p className="text-xs text-danger pl-6">{error}</p>}
    </div>
  );
}
