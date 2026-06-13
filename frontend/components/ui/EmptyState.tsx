import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-surface-3">
        <Icon className="h-6 w-6 text-muted" />
      </div>
      <h3 className="mb-1 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="max-w-[280px] text-[13px] leading-relaxed text-muted">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
