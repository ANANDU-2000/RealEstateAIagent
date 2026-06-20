'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';

type SettingsPageShellProps = {
  title: string;
  description?: string;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsPageShell({
  title,
  description,
  loading,
  error,
  onRetry,
  footer,
  children,
}: SettingsPageShellProps) {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !accessToken) {
      router.replace('/login');
    }
  }, [accessToken, authLoading, router]);

  if (authLoading || (loading && !error)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </div>
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-44 w-full rounded-[var(--radius-xl)]" />
          <Skeleton className="h-36 w-full rounded-[var(--radius-xl)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-xl)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-foreground">{title}</h2>
          {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
        </div>
        <Alert variant="error">{error}</Alert>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0">
        <h2 className="text-[24px] font-bold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] leading-snug text-muted">{description}</p>
        )}
      </header>

      <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 lg:max-h-[calc(100vh-11rem)]">
        {children}
      </div>

      {footer && (
        <div className="mt-4 shrink-0 border-t border-border/60 pt-4 lg:sticky lg:bottom-0 lg:bg-background/95 lg:backdrop-blur-sm">
          {footer}
        </div>
      )}
    </div>
  );
}
