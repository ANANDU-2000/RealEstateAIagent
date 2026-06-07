'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, LogOut, Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSaAuth } from '@/hooks/useSaAuth';
import type { SaClient, SaCreateClientResult } from '@/lib/api';
import { COUNTRIES } from '@/lib/constants';

export default function SuperAdminClientsPage() {
  const router = useRouter();
  const { token, loading: authLoading, logout, listClients, createClient } = useSaAuth();
  const [clients, setClients] = useState<SaClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<SaCreateClientResult | null>(null);

  const [form, setForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    country: 'IN' as 'IN' | 'AE' | 'CA',
    plan: 'trial' as 'starter' | 'pro' | 'agency' | 'trial',
    trialDays: 14,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listClients();
      setClients(rows);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load clients.'
      );
    } finally {
      setLoading(false);
    }
  }, [listClients]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/superadmin/login');
      return;
    }
    void load();
  }, [token, authLoading, load, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const result = await createClient({
        ...form,
        phone: form.phone || undefined,
        trialDays: form.trialDays,
      });
      setCreated(result);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not create client.'
      );
    } finally {
      setCreating(false);
    }
  }

  function copyCredentials() {
    if (!created) return;
    const text = `PropAgent login\nClient ID: ${created.client.clientId}\nEmail: ${created.client.email}\nTemporary password: ${created.temporaryPassword}\nSign in: ${created.loginUrl}`;
    void navigator.clipboard.writeText(text);
  }

  if (authLoading || (!token && !error)) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Skeleton className="mb-4 h-10 w-64 bg-[#1E293B]" />
        <Skeleton className="h-64 w-full bg-[#1E293B]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#334155] pb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-semibold text-white">Super Admin — Clients</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Create Client
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-[#94A3B8] hover:text-white"
            onClick={() => {
              logout();
              router.push('/superadmin/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {created && (
        <Card className="mb-6 border-success/30 bg-[#1E293B] p-4 text-white">
          <h2 className="font-semibold text-success">Client created — share these credentials</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#94A3B8]">Client ID</dt>
              <dd className="font-mono font-semibold">{created.client.clientId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#94A3B8]">Email</dt>
              <dd>{created.client.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#94A3B8]">Temporary password</dt>
              <dd className="font-mono">{created.temporaryPassword}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#94A3B8]">Login URL</dt>
              <dd>
                <Link href="/login" className="text-primary hover:underline">
                  /login
                </Link>
              </dd>
            </div>
          </dl>
          <Button size="sm" className="mt-4" onClick={copyCredentials}>
            <Copy className="h-4 w-4" />
            Copy for WhatsApp / email
          </Button>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6 border-[#334155] bg-[#1E293B] p-4 text-white">
          <h2 className="mb-4 font-semibold">New broker client</h2>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Business Name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              required
            />
            <Input
              label="Owner Name"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Select
              label="Country"
              value={form.country}
              onChange={(e) =>
                setForm({ ...form, country: e.target.value as 'IN' | 'AE' | 'CA' })
              }
              options={COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
            />
            <Select
              label="Plan"
              value={form.plan}
              onChange={(e) =>
                setForm({
                  ...form,
                  plan: e.target.value as 'starter' | 'pro' | 'agency' | 'trial',
                })
              }
              options={[
                { value: 'trial', label: 'Trial' },
                { value: 'starter', label: 'Starter' },
                { value: 'pro', label: 'Pro' },
                { value: 'agency', label: 'Agency' },
              ]}
            />
            <Input
              label="Trial days"
              type="number"
              min={1}
              max={90}
              value={form.trialDays}
              onChange={(e) => setForm({ ...form, trialDays: Number(e.target.value) })}
            />
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button type="submit" loading={creating}>
                Create & generate credentials
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-danger/20 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#334155]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#1E293B] text-[#94A3B8]">
            <tr>
              <th className="px-4 py-3 font-medium">Client ID</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">AI usage</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#94A3B8]">
                  Loading…
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#94A3B8]">
                  No clients yet. Create your first broker account.
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.clientId} className="border-t border-[#334155]">
                  <td className="px-4 py-3 font-mono text-primary">{c.clientId}</td>
                  <td className="px-4 py-3 text-white">{c.businessName}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">{c.email}</td>
                  <td className="px-4 py-3 capitalize text-[#CBD5E1]">{c.plan}</td>
                  <td className="px-4 py-3 text-[#CBD5E1]">
                    {c.aiUsed}/{c.aiLimit}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
