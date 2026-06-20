'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Briefcase,
  Fingerprint,
  HelpCircle,
  Lock,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { loginSchema } from '@/lib/validation/auth';
import { useAuth } from '@/hooks/useAuth';

const TRUST_ITEMS = [
  { icon: Shield, label: 'Tenant isolated' },
  { icon: Zap, label: 'Real-time sync' },
  { icon: Lock, label: 'JWT secured' },
] as const;

export function HomeBrokerAuthCard() {
  const router = useRouter();
  const { login } = useAuth();
  const [clientId, setClientId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      if (clientId.trim()) {
        localStorage.setItem('propagent_client_id', clientId.trim());
      }
      router.push('/onboarding');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Wrong email or password. Please try again.';
      setError(message);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center">
      <div
        className={cn(
          'w-full rounded-[var(--radius-2xl)] border border-border bg-surface p-8 shadow-[var(--shadow-lg)]',
          shake && 'animate-shake'
        )}
      >
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            <Lock className="h-3 w-3" />
            End-to-end encrypted
          </span>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Broker authentication</h2>
            <p className="mt-1 text-sm text-muted">
              Sign in to your private PropAgent workspace.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {error && (
            <p
              className="rounded-[var(--radius-md)] border border-danger/15 bg-danger-light px-3 py-2 text-xs text-danger"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="client-id" className="text-[13px] font-medium text-foreground">
              Client ID <span className="font-normal text-muted">(optional)</span>
            </label>
            <div className="relative">
              <Fingerprint className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="client-id"
                type="text"
                placeholder="PA-IN-0003"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-light focus:border-primary focus:shadow-[var(--focus-ring)]"
              />
            </div>
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="you@brokerage.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            className="mt-1 bg-sidebar hover:bg-sidebar-2 shadow-none"
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Broker sign in
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Need assistance?
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <a
          href="mailto:support@propagent.in"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-primary/20 bg-primary-light text-sm font-medium text-primary transition-colors hover:bg-primary-100"
        >
          <HelpCircle className="h-4 w-4" />
          Support center
        </a>

        <Link
          href="/superadmin/login"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted transition-colors hover:text-primary"
        >
          <Shield className="h-3.5 w-3.5" />
          Super Admin access
        </Link>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
          Public signup may be restricted. Your admin can create accounts at{' '}
          <Link href="/superadmin/clients" className="text-primary hover:underline">
            /superadmin/clients
          </Link>
          . Brokers sign in here or at{' '}
          <Link href="/login" className="text-primary hover:underline">
            /login
          </Link>
          .
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
