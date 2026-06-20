'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Check,
  CircleHelp,
  Clock,
  MapPin,
  MessageSquare,
  Store,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { WhatsAppSetupDrawer } from '@/components/onboarding/WhatsAppSetupDrawer';
import { getOnboardingStatus, type OnboardingStatus } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type StepId = keyof OnboardingStatus['steps'];

type ChecklistStep = {
  id: StepId;
  label: string;
  doneDescription: string;
  pendingDescription: string;
  action?: 'drawer' | 'link';
  href?: string;
};

const STEPS: ChecklistStep[] = [
  {
    id: 'accountCreated',
    label: 'Account created',
    doneDescription: 'Profile established successfully.',
    pendingDescription: 'Complete your broker registration.',
  },
  {
    id: 'whatsappConnected',
    label: 'Connect WhatsApp number',
    doneDescription: 'Buyers can message your AI agent.',
    pendingDescription: 'Link the number leads will message on WhatsApp.',
    action: 'drawer',
  },
  {
    id: 'hasProperty',
    label: 'Add your first property',
    doneDescription: 'Listing enables automated lead management.',
    pendingDescription: 'Listing a property enables automated lead management.',
    action: 'link',
    href: '/properties/new',
  },
  {
    id: 'hasAvailability',
    label: 'Set your availability',
    doneDescription: 'Visit slots are ready for bookings.',
    pendingDescription: 'Define your working hours for tour bookings.',
    action: 'link',
    href: '/settings/availability',
  },
  {
    id: 'hasOfficeAddress',
    label: 'Add office address',
    doneDescription: 'Office visits can be scheduled.',
    pendingDescription: 'Share your office location for in-person meetings.',
    action: 'link',
    href: '/settings/office',
  },
];

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

  const firstIncompleteIndex = useMemo(() => {
    if (!status) return 0;
    return STEPS.findIndex((step) => !status.steps[step.id]);
  }, [status]);

  const activeStep = firstIncompleteIndex >= 0 ? STEPS[firstIncompleteIndex] : null;

  const ctaConfig = useMemo(() => {
    if (!activeStep) {
      return {
        label: 'Open dashboard',
        icon: <ArrowRight className="h-4 w-4" />,
        onClick: () => router.push('/chats'),
      };
    }
    switch (activeStep.id) {
      case 'whatsappConnected':
        return {
          label: 'Connect WhatsApp',
          icon: <MessageSquare className="h-4 w-4" />,
          onClick: () => setDrawerOpen(true),
        };
      case 'hasProperty':
        return {
          label: 'Add your first property',
          icon: <Store className="h-4 w-4" />,
          onClick: () => router.push('/properties/new'),
        };
      case 'hasAvailability':
        return {
          label: 'Set your availability',
          icon: <Clock className="h-4 w-4" />,
          onClick: () => router.push('/settings/availability'),
        };
      case 'hasOfficeAddress':
        return {
          label: 'Add office address',
          icon: <MapPin className="h-4 w-4" />,
          onClick: () => router.push('/settings/office'),
        };
      default:
        return {
          label: 'Continue setup',
          icon: <ArrowRight className="h-4 w-4" />,
          onClick: () => undefined,
        };
    }
  }, [activeStep, router]);

  function handleStepClick(step: ChecklistStep, index: number) {
    if (!status || status.steps[step.id]) return;
    if (index !== firstIncompleteIndex) return;
    if (step.action === 'drawer') setDrawerOpen(true);
    else if (step.href) router.push(step.href);
  }

  if (authLoading || (loading && !status)) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-8">
          <Skeleton className="mb-3 h-8 w-48" />
          <Skeleton className="mb-8 h-4 w-72" />
          <Skeleton className="h-[320px] w-full rounded-[var(--radius-2xl)]" />
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="flex h-screen items-center justify-center overflow-hidden bg-background p-6">
        <div className="flex w-full max-w-md flex-col gap-4">
          <Alert variant="error">{error}</Alert>
          <Button onClick={() => void loadStatus()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const firstName = status.ownerName.trim().split(/\s+/)[0] ?? 'there';

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sidebar" />
            <span className="text-base font-bold tracking-tight text-sidebar">PropAgent</span>
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="mailto:support@propagent.in"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-border-dark hover:text-foreground"
              aria-label="Help"
            >
              <CircleHelp className="h-4 w-4" />
            </a>
            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-border-dark hover:text-foreground"
              aria-label="Profile settings"
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-6 lg:px-8">
          <div className="flex w-full max-w-xl flex-col">
            <div className="mb-5 text-center">
              <h1 className="text-[32px] font-bold leading-tight tracking-tight text-sidebar lg:text-[36px]">
                Welcome, {firstName}
              </h1>
              <p className="mt-2 text-[15px] text-muted">
                Let&apos;s get your professional workspace ready in under 2 minutes.
              </p>
            </div>

            <div className="mb-4 h-0.5 w-full rounded-full bg-sidebar" aria-hidden />

            <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-surface shadow-[var(--shadow-lg)]">
              {STEPS.map((step, index) => {
                const done = status.steps[step.id];
                const isActive = !done && index === firstIncompleteIndex;
                const isLocked = !done && index > firstIncompleteIndex;
                const clickable = isActive && Boolean(step.action);

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={!clickable}
                    onClick={() => handleStepClick(step, index)}
                    className={cn(
                      'flex w-full items-center gap-4 border-b border-border/70 px-5 py-4 text-left last:border-b-0',
                      isActive && 'bg-primary-muted',
                      clickable && 'cursor-pointer hover:bg-primary-light/80',
                      !clickable && 'cursor-default'
                    )}
                  >
                    {done ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-light">
                        <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
                      </div>
                    ) : isActive ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar">
                        <span className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2">
                        <span className="text-xs font-semibold text-muted-light">{index + 1}</span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-[15px] font-semibold leading-snug',
                          done && 'text-foreground',
                          isActive && 'text-sidebar',
                          isLocked && 'text-muted-light'
                        )}
                      >
                        {step.label}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-[13px] leading-snug',
                          done && 'text-muted',
                          isActive && 'text-sidebar/70',
                          isLocked && 'text-muted-light'
                        )}
                      >
                        {done ? step.doneDescription : step.pendingDescription}
                      </p>
                    </div>

                    {isActive && (
                      <ArrowRight className="h-4 w-4 shrink-0 text-sidebar" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              type="button"
              size="lg"
              fullWidth
              className="mt-5 h-12 bg-gradient-to-b from-primary to-primary-dark shadow-[0_8px_24px_rgba(37,99,235,0.28)] hover:from-primary-dark hover:to-primary-dark"
              iconLeft={ctaConfig.icon}
              onClick={ctaConfig.onClick}
            >
              {ctaConfig.label}
            </Button>
          </div>
        </main>

        <footer className="flex h-12 shrink-0 items-center justify-between border-t border-border/60 px-8 text-[11px] text-muted lg:px-12">
          <span>© {new Date().getFullYear()} PropAgent</span>
          <div className="flex items-center gap-5">
            <a href="mailto:support@propagent.in" className="hover:text-foreground hover:underline">
              Support
            </a>
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              Privacy policy
            </Link>
            <Link
              href="/chats"
              className="font-semibold text-sidebar hover:underline"
            >
              Skip for now
            </Link>
          </div>
        </footer>
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
