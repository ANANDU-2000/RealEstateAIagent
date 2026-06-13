'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Home,
  MapPin,
  MessageSquare,
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
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-[560px]">
          <Skeleton className="mb-4 h-64 w-full rounded-[var(--radius-2xl)]" />
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex w-full max-w-[560px] flex-col gap-4">
          <Alert variant="error">{error}</Alert>
          <Button onClick={() => void loadStatus()}>Try again</Button>
        </div>
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
  const firstIncompleteIndex = items.findIndex((item) => !item.done);

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
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card
          padding="lg"
          className="w-full max-w-[560px] rounded-[var(--radius-2xl)] p-8 shadow-[var(--shadow-lg)]"
        >
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-foreground">PropAgent</span>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-bold tracking-tight text-foreground">
              Welcome, {status.ownerName.split(' ')[0]}!
            </h1>
            <p className="text-[14px] text-muted">
              {status.aiName} is ready to go. Just 4 quick steps.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[12px] text-muted">
              <span>Setup progress</span>
              <span>
                {status.quickStepsCompleted} of {status.quickStepsTotal} steps
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isClickable = !item.done && item.action;
              const isCurrent = !item.done && index === firstIncompleteIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'flex w-full items-start gap-4 border-b border-border/60 py-4 text-left last:border-0',
                    isClickable && 'cursor-pointer hover:bg-surface-2/60',
                    !isClickable && item.done && 'cursor-default',
                    !isClickable && !item.done && 'cursor-default opacity-60'
                  )}
                >
                  {item.done ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  ) : isCurrent ? (
                    <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-2 ring-primary ring-offset-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    </div>
                  ) : (
                    <Circle className="mt-0.5 h-6 w-6 shrink-0 text-surface-3" strokeWidth={1.5} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-muted" />
                      <span className="text-[14px] font-semibold text-foreground">{item.label}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted">{item.description}</p>
                  </div>
                  {isClickable && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted" />}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
            Test {status.aiName}: text your WhatsApp number &quot;Hi&quot; once WhatsApp is connected.
          </p>

          <div className="mt-6 border-t border-border/60 pt-5 text-center">
            <Link
              href="/chats"
              className="text-[12px] text-muted underline hover:text-foreground"
            >
              Skip setup — go to dashboard
            </Link>
          </div>
        </Card>
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
