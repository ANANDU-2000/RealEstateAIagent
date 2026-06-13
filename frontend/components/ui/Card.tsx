import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  bordered?: boolean;
};

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  padding = 'md',
  hover = false,
  bordered = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] bg-surface',
        bordered && 'border border-border',
        'shadow-[var(--shadow-card)]',
        hover && 'cursor-pointer transition-shadow duration-200 hover:shadow-[var(--shadow-md)]',
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
