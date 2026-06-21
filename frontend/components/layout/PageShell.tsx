import { cn } from '@/lib/utils';

type PageShellProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  /** Full viewport height — inner panels scroll, page body does not */
  fill?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function PageShell({
  title,
  description,
  actions,
  fill = false,
  children,
  className,
}: PageShellProps) {
  return (
    <div
      className={cn(
        'page-shell mx-auto flex w-full max-w-7xl animate-fade-in flex-col pb-4',
        fill && 'dashboard-fill min-h-0 flex-1',
        className
      )}
    >
      {(title || actions) && (
        <header className="page-header shrink-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {title && (
              <div className="min-w-0">
                <h1 className="text-heading-lg text-foreground">{title}</h1>
                {description && (
                  <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted">
                    {description}
                  </p>
                )}
              </div>
            )}
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </header>
      )}

      <div className={cn('page-body', fill && 'min-h-0 flex-1 overflow-hidden')}>{children}</div>
    </div>
  );
}
