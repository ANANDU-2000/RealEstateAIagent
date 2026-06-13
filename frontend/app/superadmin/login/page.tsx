'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSaAuth } from '@/hooks/useSaAuth';
import type { SaLoginError } from '@/lib/api';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { login, token, loading: authLoading } = useSaAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setError(saErr.error ?? 'Sign in failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 p-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <p className="text-xs uppercase tracking-wider text-[#94A3B8]">PropAgent</p>
          <h1 className="text-xl font-bold text-white">Super Admin</h1>
        </div>
      </div>

      <p className="text-sm text-[#94A3B8]">
        Create broker accounts here. Share the Client ID and login credentials with each client.
        Brokers sign in at <span className="text-white">/login</span> only — no public signup.
      </p>

      {error && (
        <p className="rounded-lg bg-danger/20 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-[#334155] bg-[#1E293B] text-white"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-[#334155] bg-[#1E293B] text-white"
          required
        />
        {requiresTotp && (
          <Input
            label="Authenticator code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="border-[#334155] bg-[#1E293B] text-white"
            placeholder="000000"
            required
          />
        )}
        <Button type="submit" fullWidth loading={loading}>
          Sign in
        </Button>
      </form>
    </div>
  );
}
