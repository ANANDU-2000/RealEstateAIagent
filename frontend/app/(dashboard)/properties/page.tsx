'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PropertyList } from '@/components/properties/PropertyList';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function PropertiesPage() {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken, authLoading, router]);

  if (authLoading || !accessToken) {
    return (
      <div className="mx-auto flex w-full max-w-7xl animate-fade-in flex-col gap-7">
        <Skeleton className="mb-6 h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl animate-fade-in flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Properties</h1>
          <p className="mt-1 text-[14px] text-muted">
            Manage listings Arjun uses to answer buyer questions on WhatsApp.
          </p>
        </div>
        <Link href="/properties/new">
          <Button size="sm" iconLeft={<Plus className="h-4 w-4" />}>
            Add Property
          </Button>
        </Link>
      </div>

      <PropertyList token={accessToken} />
    </div>
  );
}
