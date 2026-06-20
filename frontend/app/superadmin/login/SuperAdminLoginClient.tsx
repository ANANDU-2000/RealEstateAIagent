'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSaAuth } from '@/hooks/useSaAuth';
import { API_BASE_URL, type SaLoginError } from '@/lib/api';
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

function isProductionApiMisconfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const onLocalHost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return !onLocalHost && API_BASE_URL.includes('localhost');
}

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { login, token, loading: authLoading } = useSaAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiMisconfigured = isProductionApiMisconfigured();

  if (!authLoading && token) {
    router.replace('/superadmin');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, requiresTotp ? totpCode : undefined);
      router.push('/superadmin');
    } catch (err) {
      const saErr = err as SaLoginError;
      if (saErr.requiresTotp) {
        setRequiresTotp(true);
        setError('Enter the 6-digit code from your authenticator app.');
      } else if (saErr.status === 0) {
        setError(saErr.error ?? `Cannot reach the ${APP_NAME} server. Try again in a moment.`);
      } else {
        setError(saErr.error ?? 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F172A] px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Shield className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <p className="text-sm font-medium uppercase tracking-wider text-[#94A3B8]">
            {APP_NAME} Platform
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Super Admin</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
            Manage broker accounts, plans, and the global AI prompt.
          </p>
        </div>

        {apiMisconfigured && (
          <p
            className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
            role="alert"
          >
            Server URL is not configured on this site. Set{' '}
            <span className="font-mono text-amber-100">NEXT_PUBLIC_API_URL</span> on Vercel to your
            Render backend URL.
          </p>
        )}

        <Card padding="lg" className="border-[#334155]/40 shadow-[var(--shadow-lg)]">
          {error && (
            <p
              className="mb-4 rounded-lg bg-danger-light px-3 py-2.5 text-sm text-danger"
              role="alert"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="admin@propagent.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sa-password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="sa-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    'h-11 w-full rounded-lg border border-border bg-surface px-3 pr-10 text-sm text-foreground',
                    'placeholder:text-muted-light outline-none transition-shadow',
                    'focus:border-primary focus:shadow-[var(--focus-ring)]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {requiresTotp && (
              <Input
                label="Authenticator code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                hint="6-digit code from your authenticator app"
                required
              />
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-1">
              Sign in
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-[#64748B]">
          Brokers use{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            /login
          </Link>
          . Accounts are created here. There is no public signup.
        </p>
      </div>
    </div>
  );
}
