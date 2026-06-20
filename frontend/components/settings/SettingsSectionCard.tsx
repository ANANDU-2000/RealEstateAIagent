import { cn } from '@/lib/utils';

type SettingsSectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
};

export function SettingsSectionCard({
  title,
  description,
  children,
  className,
  headerAction,
}: SettingsSectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-[13px] leading-snug text-muted">{description}</p>
          )}
        </div>
        {headerAction}
      </div>
      {children}
    </section>
  );
}
