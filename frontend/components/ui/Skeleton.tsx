import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-[var(--radius-md)] bg-gradient-to-r from-surface-3 via-surface-2 to-surface-3 bg-[length:200%_100%]',
        className
      )}
    />
  );
}
