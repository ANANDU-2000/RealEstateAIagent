import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  locked?: boolean;
  onChange?: (checked: boolean) => void;
};

export function SettingsToggleRow({
  label,
  description,
  checked,
  disabled = false,
  locked = false,
  onChange,
}: SettingsToggleRowProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] py-3 first:pt-0 last:pb-0',
        disabled && 'cursor-default opacity-90'
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded-[var(--radius-sm)] border-border accent-primary outline-none focus:shadow-[var(--focus-ring)] disabled:cursor-not-allowed"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          {label}
          {locked && <Lock className="h-3.5 w-3.5 text-muted" aria-hidden />}
        </span>
        {description && (
          <span className="mt-0.5 block text-[12px] leading-snug text-muted">{description}</span>
        )}
      </span>
    </label>
  );
}
