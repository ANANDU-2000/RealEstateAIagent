'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  MessageSquare,
  Home,
  Clock,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { WhatsAppSetupDrawer } from '@/components/onboarding/WhatsAppSetupDrawer';
import { getOnboardingStatus, type OnboardingStatus } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type ChecklistItem = {
  id: keyof OnboardingStatus['steps'];
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  done: boolean;
  action?: 'drawer' | 'link';
  href?: string;
};

export function OnboardingChecklist() {
  const router = useRouter();
  const { accessToken, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOnboardingStatus(accessToken);
      setStatus(data);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load your setup progress. Please try again.';
      setError(message);
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
    void loadStatus();
  }, [accessToken, authLoading, loadStatus, router]);

  if (authLoading || (loading && !status)) {
    return (
      <div className="mx-auto flex w-full max-w-[500px] flex-col gap-6 p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Card className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="mx-auto flex w-full max-w-[500px] flex-col gap-4 p-6">
        <Alert variant="error">{error}</Alert>
        <Button onClick={() => void loadStatus()}>Try again</Button>
      </div>
    );
  }

  if (!status) return null;

  const items: ChecklistItem[] = [
    {
      id: 'accountCreated',
      label: 'Account created',
      description: 'Your PropAgent workspace is ready',
      icon: UserCheck,
      done: status.steps.accountCreated,
    },
    {
      id: 'whatsappConnected',
      label: 'Connect WhatsApp number',
      description: status.steps.whatsappConnected
        ? 'WhatsApp is connected'
        : 'Link the number buyers will message',
      icon: MessageSquare,
      done: status.steps.whatsappConnected,
      action: 'drawer',
    },
    {
      id: 'hasProperty',
      label: 'Add your first property',
      description: status.steps.hasProperty
        ? 'At least one listing added'
        : 'Arjun needs listings to recommend',
      icon: Home,
      done: status.steps.hasProperty,
      action: 'link',
      href: '/properties/new',
    },
    {
      id: 'hasAvailability',
      label: 'Set your availability',
      description: status.steps.hasAvailability
        ? 'Visit slots configured'
        : 'When can buyers book site visits?',
      icon: Clock,
      done: status.steps.hasAvailability,
      action: 'link',
      href: '/settings/availability',
    },
    {
      id: 'hasOfficeAddress',
      label: 'Add office address',
      description: status.steps.hasOfficeAddress
        ? 'Office location saved'
        : 'For office visit bookings',
      icon: MapPin,
      done: status.steps.hasOfficeAddress,
      action: 'link',
      href: '/settings/office',
    },
  ];

  const progressPct = Math.round(
    (status.quickStepsCompleted / status.quickStepsTotal) * 100
  );

  function handleItemClick(item: ChecklistItem) {
    if (item.done) return;
    if (item.action === 'drawer') {
      setDrawerOpen(true);
    } else if (item.href) {
      router.push(item.href);
    }
  }

  return (
    <>
      <div className="mx-auto flex min-h-screen w-full max-w-[500px] flex-col gap-6 p-6">
        <div className="flex flex-col gap-2 pt-4">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {status.ownerName.split(' ')[0]}!
          </h1>
          <p className="text-sm text-muted">
            {status.aiName} is ready to go. Just 4 quick steps.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Setup progress</span>
            <span>
              {status.quickStepsCompleted} of {status.quickStepsTotal} steps
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <Card padding="sm" className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const Icon = item.icon;
            const isClickable = !item.done && item.action;

            return (
              <button
                key={item.id}
                type="button"
                disabled={!isClickable}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-4 text-left transition-colors',
                  isClickable && 'cursor-pointer hover:bg-surface-2',
                  !isClickable && item.done && 'cursor-default',
                  !isClickable && !item.done && 'cursor-default opacity-60'
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-border" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                </div>
                {isClickable && <ChevronRight className="h-4 w-4 shrink-0 text-muted" />}
              </button>
            );
          })}
        </Card>

        <p className="text-center text-xs text-muted leading-relaxed">
          Test {status.aiName}: text your WhatsApp number &quot;Hi&quot; and watch the magic
          once WhatsApp is connected.
        </p>

        <Link
          href="/chats"
          className="text-center text-sm font-medium text-primary hover:underline"
        >
          Skip for now — go to dashboard →
        </Link>
      </div>

      <WhatsAppSetupDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialNumber={status.whatsappNumber ?? ''}
        accessToken={accessToken!}
        onSaved={() => {
          setDrawerOpen(false);
          void loadStatus();
        }}
      />
    </>
  );
}
