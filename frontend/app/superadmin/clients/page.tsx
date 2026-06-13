'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSaAuth } from '@/hooks/useSaAuth';
import {
  saGetStats,
  saUpdateClientPlan,
  saUpdateClientStatus,
  type SaClient,
  type SaCreateClientResult,
  type SaStats,
} from '@/lib/api';
import { COUNTRIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

function StatusChip({ label, variant }: { label: string; variant: 'success' | 'warning' | 'danger' | 'default' }) {
  const styles = {
    success: 'bg-emerald-500/20 text-emerald-300',
    warning: 'bg-amber-500/20 text-amber-300',
    danger: 'bg-red-500/20 text-red-300',
    default: 'bg-slate-500/20 text-slate-300',
  };
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        styles[variant]
      )}
    >
      {label}
    </span>
  );
}

function AiUsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color = pct >= 95 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-primary';

  return (
    <div className="min-w-[100px]">
      <div className="mb-1 flex justify-between text-[10px] text-[#94A3B8]">
        <span>{used.toLocaleString()}</span>
        <span>{limit.toLocaleString()}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#334155]">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SuperAdminClientsPage() {
  const router = useRouter();
  const { token, loading: authLoading, listClients, createClient } = useSaAuth();
  const [clients, setClients] = useState<SaClient[]>([]);
  const [stats, setStats] = useState<SaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<SaCreateClientResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [rows, statsData] = await Promise.all([listClients(), saGetStats(token)]);
      setClients(rows);
      setStats(statsData);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load clients.'
      );
    } finally {
      setLoading(false);
    }
  }, [listClients, token]);

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

  async function handleStatusAction(
    clientId: string,
    action: 'suspend' | 'unsuspend' | 'block' | 'unblock'
  ) {
    if (!token) return;
    setActionLoading(`${clientId}-${action}`);
    setError(null);
    try {
      await saUpdateClientStatus(token, clientId, action);
      await load();
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not update client status.'
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePlanChange(clientId: string, plan: 'starter' | 'pro' | 'agency' | 'trial') {
    if (!token) return;
    setActionLoading(`${clientId}-plan`);
    setError(null);
    try {
      await saUpdateClientPlan(token, clientId, plan);
      await load();
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not update client plan.'
      );
    } finally {
      setActionLoading(null);
    }
  }

  function copyCredentials() {
    if (!created) return;
    const text = `PropAgent login\nClient ID: ${created.client.clientId}\nEmail: ${created.client.email}\nTemporary password: ${created.temporaryPassword}\nSign in: ${created.loginUrl}`;
    void navigator.clipboard.writeText(text);
  }

  if (authLoading || (!token && !error)) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Skeleton className="mb-4 h-10 w-64 bg-[#1E293B]" />
        <Skeleton className="h-64 w-full bg-[#1E293B]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">Manage broker accounts, plans, and access</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Create Client
        </Button>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Clients', value: stats?.totalClients },
          { label: 'Active Clients', value: stats?.activeClients },
          { label: 'Trial Clients', value: stats?.trialClients },
          { label: 'AI Messages', value: stats?.totalAiMessagesToday },
        ].map((card) => (
          <Card key={card.label} className="border-[#334155] bg-[#1E293B] p-4 text-white">
            <p className="text-xs font-medium uppercase tracking-wide text-[#94A3B8]">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">
              {loading ? '—' : (card.value ?? 0).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

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
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-[#1E293B] text-[#94A3B8]">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">AI usage</th>
              <th className="px-4 py-3 font-medium">Actions</th>
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
              clients.map((c) => {
                const busy = actionLoading?.startsWith(c.clientId) ?? false;
                return (
                  <tr key={c.clientId} className="border-t border-[#334155]">
                    <td className="px-4 py-3">
                      <p className="font-mono text-primary">{c.clientId}</p>
                      <p className="font-medium text-white">{c.businessName}</p>
                      <p className="text-xs text-[#94A3B8]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.isBlocked ? (
                          <StatusChip label="Blocked" variant="danger" />
                        ) : c.isSuspended ? (
                          <StatusChip label="Suspended" variant="warning" />
                        ) : (
                          <StatusChip label="Active" variant="success" />
                        )}
                        <StatusChip label={c.plan} variant="default" />
                        <StatusChip label={c.status} variant="default" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={c.plan}
                        disabled={busy}
                        onChange={(e) =>
                          void handlePlanChange(
                            c.clientId,
                            e.target.value as 'starter' | 'pro' | 'agency' | 'trial'
                          )
                        }
                        className="h-9 rounded-lg border border-[#334155] bg-[#0F172A] px-2 text-sm text-white outline-none focus:border-primary"
                      >
                        <option value="trial">Trial</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="agency">Agency</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <AiUsageBar used={c.aiUsed} limit={c.aiLimit} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.isSuspended ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-300 hover:text-emerald-200"
                            loading={actionLoading === `${c.clientId}-unsuspend`}
                            disabled={busy}
                            onClick={() => void handleStatusAction(c.clientId, 'unsuspend')}
                          >
                            Unsuspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-300 hover:text-amber-200"
                            loading={actionLoading === `${c.clientId}-suspend`}
                            disabled={busy}
                            onClick={() => void handleStatusAction(c.clientId, 'suspend')}
                          >
                            Suspend
                          </Button>
                        )}
                        {c.isBlocked ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-300 hover:text-emerald-200"
                            loading={actionLoading === `${c.clientId}-unblock`}
                            disabled={busy}
                            onClick={() => void handleStatusAction(c.clientId, 'unblock')}
                          >
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-300 hover:text-red-200"
                            loading={actionLoading === `${c.clientId}-block`}
                            disabled={busy}
                            onClick={() => void handleStatusAction(c.clientId, 'block')}
                          >
                            Block
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
