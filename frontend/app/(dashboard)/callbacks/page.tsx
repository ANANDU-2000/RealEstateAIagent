'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  MessageSquare,
  Phone,
  PhoneCall,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  type ApiError,
  type Callback,
  type CallbackStatus,
  listCallbacks,
  updateCallback,
} from '@/lib/api';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { EMPTY_VALUE } from '@/lib/brand';

type TabKey = 'all' | CallbackStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'done', label: 'Done' },
];

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    return (err as ApiError).error;
  }
  return 'Something went wrong';
}

function formatDateTime(iso: string | null): string {
  if (!iso) return EMPTY_VALUE;
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function statusBadgeVariant(status: string): 'warning' | 'danger' | 'success' | 'default' {
  if (status === 'overdue') return 'danger';
  if (status === 'pending') return 'warning';
  if (status === 'done') return 'success';
  return 'default';
}

function statusLabel(status: string): string {
  if (status === 'overdue') return 'Overdue';
  if (status === 'pending') return 'Pending';
  if (status === 'done') return 'Done';
  return status;
}

function statusIconClass(status: string): string {
  if (status === 'overdue') return 'bg-danger-light text-danger';
  if (status === 'pending') return 'bg-warning-light text-warning';
  if (status === 'done') return 'bg-success-light text-success';
  return 'bg-surface-3 text-muted';
}

export default function CallbacksPage() {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const overdueCount = useMemo(
    () => callbacks.filter((c) => c.status === 'overdue').length,
    [callbacks]
  );

  const tabCounts = useMemo(
    () => ({
      all: callbacks.length,
      pending: callbacks.filter((c) => c.status === 'pending').length,
      overdue: callbacks.filter((c) => c.status === 'overdue').length,
      done: callbacks.filter((c) => c.status === 'done').length,
    }),
    [callbacks]
  );

  const filteredCallbacks = useMemo(() => {
    if (activeTab === 'all') return callbacks;
    return callbacks.filter((c) => c.status === activeTab);
  }, [callbacks, activeTab]);

  const loadCallbacks = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listCallbacks(accessToken);
      setCallbacks(result.callbacks);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    loadCallbacks();
  }, [accessToken, authLoading, router, loadCallbacks]);

  const handleMarkDone = async (callback: Callback) => {
    if (!accessToken || callback.status === 'done') return;
    setMarkingId(callback.id);
    try {
      const result = await updateCallback(accessToken, callback.id, { status: 'done' });
      setCallbacks((prev) =>
        prev.map((c) => (c.id === callback.id ? result.callback : c))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMarkingId(null);
    }
  };

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
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">Callbacks</h1>
        <p className="mt-1 text-[14px] text-muted">
          Customers who asked Arjun to call them back.
        </p>
      </div>

      {overdueCount > 0 && (
        <Alert variant="warning" className="mb-4">
          You have {overdueCount} overdue callback{overdueCount === 1 ? '' : 's'}. These
          customers are waiting.
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
            {!loading && tab.key !== 'all' && tabCounts[tab.key] > 0 && (
              <span
                className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  tab.key === 'overdue'
                    ? 'bg-danger-light text-danger'
                    : 'bg-surface-3 text-muted'
                }`}
              >
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <Card padding="sm" className="mb-4 border-danger bg-danger-light">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="outline" size="sm" onClick={loadCallbacks}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredCallbacks.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title={
            activeTab === 'all'
              ? 'No callbacks yet'
              : `No ${activeTab} callbacks`
          }
          description={
            activeTab === 'all'
              ? 'When buyers ask Arjun to call them back, they appear here.'
              : 'Try another tab or check back later.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {activeTab === 'overdue' && filteredCallbacks.length > 0 && (
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-danger">
              Overdue. Needs attention.
            </p>
          )}
          {filteredCallbacks.map((callback) => (
            <Card
              key={callback.id}
              padding="none"
              className={`flex items-start gap-4 p-4 transition-all duration-150 hover:shadow-[var(--shadow-sm)] ${
                callback.status === 'overdue' ? 'border-l-4 border-l-danger' : ''
              } ${callback.status === 'done' ? 'opacity-60' : ''}`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${statusIconClass(callback.status)}`}
              >
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">
                      {callback.customerName ?? 'Unknown'}
                    </p>
                    <a
                      href={`tel:${callback.customerPhone}`}
                      className="mt-0.5 flex items-center gap-1 text-[12px] text-muted hover:text-primary"
                    >
                      {callback.customerPhone}
                    </a>
                  </div>
                  <Badge variant={statusBadgeVariant(callback.status)}>
                    {statusLabel(callback.status)}
                  </Badge>
                </div>
                {callback.requestedTime && (
                  <p className="mt-2 text-[12px] text-muted">
                    Scheduled: {formatDateTime(callback.requestedTime)}
                  </p>
                )}
                {callback.contextNotes && (
                  <p className="mt-1 text-[13px] text-muted">{callback.contextNotes}</p>
                )}
                <p className="mt-1 text-[11px] text-muted-light">
                  Created {formatRelativeTime(callback.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`tel:${callback.customerPhone}`}>
                    <Button variant="outline" size="xs" iconLeft={<Phone className="h-3.5 w-3.5" />}>
                      Call
                    </Button>
                  </a>
                  {callback.status !== 'done' && (
                    <Button
                      variant="outline"
                      size="xs"
                      loading={markingId === callback.id}
                      onClick={() => handleMarkDone(callback)}
                      iconLeft={<Check className="h-3.5 w-3.5" />}
                    >
                      Mark Done
                    </Button>
                  )}
                  {callback.conversationId && (
                    <Link href={`/chats?conversation=${callback.conversationId}`}>
                      <Button variant="ghost" size="xs" iconLeft={<MessageSquare className="h-3.5 w-3.5" />}>
                        View Chat
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
