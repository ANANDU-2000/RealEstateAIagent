'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { loginSchema } from '@/lib/validation/auth';
import { useAuth } from '@/hooks/useAuth';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as 'email' | 'password';
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      if (remember) {
        localStorage.setItem('propagent_remember_email', parsed.data.email);
      } else {
        localStorage.removeItem('propagent_remember_email');
      }
      router.push('/onboarding');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Wrong email or password. Please try again.';
      setErrors({ form: message });
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex w-full max-w-[400px] flex-col gap-7', shake && 'animate-shake')}
      noValidate
    >
      <div className="flex flex-col gap-1">
        <div className="mb-2 flex items-center gap-2 lg:hidden">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">PropAgent</span>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          Sign in to PropAgent
        </h1>
        <p className="mt-1 text-[14px] text-muted">Manage your leads and never miss a deal.</p>
      </div>

      {errors.form && (
        <p
          className="rounded-[var(--radius-md)] border border-danger/15 bg-danger-light px-3.5 py-2.5 text-[13px] text-danger"
          role="alert"
        >
          {errors.form}
        </p>
      )}

      <div className="flex flex-col gap-5">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-medium text-foreground leading-none">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 pr-10 text-sm text-foreground',
                'placeholder:text-muted-light outline-none transition-all duration-150',
                'hover:border-border-dark',
                'focus:border-primary focus:shadow-[var(--focus-ring)]',
                errors.password && 'border-danger focus:border-danger focus:shadow-[var(--error-ring)]'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger leading-none">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            label="Remember me"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <Link
            href="/forgot-password"
            className="text-[13px] text-primary hover:text-primary-dark hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        loading={loading}
        size="lg"
        iconRight={<ArrowRight className="h-4 w-4" />}
      >
        Sign In
      </Button>

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" fullWidth disabled title="Coming soon" iconLeft={<GoogleIcon />}>
        Continue with Google
      </Button>

      <p className="rounded-[var(--radius-lg)] border border-border bg-surface-2 px-4 py-3 text-center text-[12px] text-muted">
        Accounts are invite-only. Your PropAgent admin will share your Client ID, email, and
        temporary password after creating your workspace.
      </p>
    </form>
  );
}
