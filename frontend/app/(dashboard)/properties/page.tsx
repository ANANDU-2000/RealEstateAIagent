'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
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
      <PageShell>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Properties"
      description="Manage listings Arjun uses to answer buyer questions on WhatsApp."
      actions={
        <Link href="/properties/new">
          <Button size="sm" iconLeft={<Plus className="h-4 w-4" />}>
            Add Property
          </Button>
        </Link>
      }
    >
      <PropertyList token={accessToken} />
    </PageShell>
  );
}
