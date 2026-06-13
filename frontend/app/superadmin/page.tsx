'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, MessageSquare, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSaAuth } from '@/hooks/useSaAuth';
import { saGetStats, type SaStats } from '@/lib/api';

const STAT_CARDS = [
  { key: 'totalClients' as const, label: 'Total Clients', icon: Users },
  { key: 'activeClients' as const, label: 'Active Clients', icon: Activity },
  { key: 'trialClients' as const, label: 'Trial Clients', icon: Users },
  { key: 'totalAiMessagesToday' as const, label: 'AI Messages', icon: MessageSquare },
];

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useSaAuth();
  const [stats, setStats] = useState<SaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/superadmin/login');
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await saGetStats(token);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err && typeof err === 'object' && 'error' in err
              ? String((err as { error: string }).error)
              : 'Could not load stats.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, authLoading, router]);

  if (authLoading || (!token && !error)) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Skeleton className="mb-4 h-10 w-64 bg-[#1E293B]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 bg-[#1E293B]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-[#94A3B8]">Platform overview across all broker clients</p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-danger/20 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.slice(0, 4).map(({ key, label, icon: Icon }) => (
          <Card key={key} className="border-[#334155] bg-[#1E293B] p-4 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {loading ? '—' : (stats?.[key] ?? 0).toLocaleString()}
                </p>
              </div>
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
