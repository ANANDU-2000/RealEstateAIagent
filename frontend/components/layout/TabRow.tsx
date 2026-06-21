'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type TabRowItem = {
  id: string;
  label: string;
  count?: number;
  countVariant?: 'default' | 'danger';
  disabled?: boolean;
  href?: string;
};

type TabRowProps = {
  items: TabRowItem[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
  variant?: 'pills' | 'underline';
  /** Hide right-edge fade (e.g. inside a card) */
  noFade?: boolean;
};

export function TabRow({
  items,
  activeId,
  onChange,
  className,
  variant = 'pills',
  noFade = false,
}: TabRowProps) {
  const row = (
    <div
      className={cn(
        'tab-row shrink-0',
        variant === 'pills' &&
          'rounded-[var(--radius-lg)] border border-border bg-surface p-1 shadow-[var(--shadow-xs)]',
        variant === 'underline' && 'border-b border-border bg-transparent p-0 pb-0',
        className
      )}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        const content = (
          <>
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  'ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                  item.countVariant === 'danger'
                    ? 'bg-danger-light text-danger'
                    : isActive
                      ? 'bg-primary/15 text-primary'
                      : 'bg-surface-3 text-muted'
                )}
              >
                {item.count}
              </span>
            )}
          </>
        );

        const tabClass = cn(
          'tab-row-item shrink-0 whitespace-nowrap transition-all duration-150',
          variant === 'pills' &&
            cn(
              'rounded-[var(--radius-md)] px-4 py-2 text-[13px] font-medium',
              isActive
                ? 'bg-primary text-white font-semibold shadow-[var(--shadow-sm)]'
                : 'text-muted hover:bg-surface-2 hover:text-foreground'
            ),
          variant === 'underline' &&
            cn(
              'relative px-4 py-2.5 text-[13px] font-medium',
              isActive
                ? 'font-semibold text-primary after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
                : 'text-muted hover:text-foreground'
            ),
          item.disabled && 'cursor-not-allowed opacity-50'
        );

        if (item.href && !item.disabled) {
          return (
            <Link
              key={item.id}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              className={tabClass}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => onChange?.(item.id)}
            className={tabClass}
          >
            {content}
          </button>
        );
      })}
    </div>
  );

  if (noFade) return row;

  return <div className="tab-row-wrap min-w-0">{row}</div>;
}
