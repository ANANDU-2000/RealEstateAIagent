import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: 'sm' | 'md' | 'lg';
};

const paddingMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)]',
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
