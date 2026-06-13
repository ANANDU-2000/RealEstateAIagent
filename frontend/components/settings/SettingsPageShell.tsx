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
  children: React.ReactNode;
};

export function SettingsPageShell({
  title,
  description,
  loading,
  error,
  onRetry,
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
