'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import { loginSchema } from '@/lib/validation/auth';
import { useAuth } from '@/hooks/useAuth';

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
      className={cn('flex w-full max-w-[400px] flex-col gap-6', shake && 'animate-shake')}
      noValidate
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 lg:hidden">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-foreground">PropAgent</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sign in to PropAgent</h1>
        <p className="text-sm text-muted">Manage your leads and never miss a deal.</p>
      </div>

      {errors.form && (
        <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger" role="alert">
          {errors.form}
        </p>
      )}

      <div className="flex flex-col gap-4">
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
          <label htmlFor="password" className="text-sm font-medium text-foreground">
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
                'h-11 w-full rounded-lg border bg-surface px-3 pr-10 text-sm text-foreground',
                'placeholder:text-muted-light outline-none transition-shadow',
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
          {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            label="Remember me"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth loading={loading} size="lg">
        Sign In →
      </Button>

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" fullWidth disabled title="Coming soon">
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Start free trial
        </Link>
      </p>
    </form>
  );
}
