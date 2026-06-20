'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, Plus, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSaAuth } from '@/hooks/useSaAuth';
import {
  saGetStats,
  saGetClientAiActivity,
  saDuplicateClient,
  saUpdateClientPlan,
  saUpdateClientStatus,
  saUpdateClientUsage,
  type SaClient,
  type SaCreateClientResult,
  type SaStats,
  type SaClientAiActivity,
} from '@/lib/api';
import { COUNTRIES } from '@/lib/constants';
import { APP_NAME, EMPTY_VALUE } from '@/lib/brand';
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
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [duplicateFor, setDuplicateFor] = useState<SaClient | null>(null);
  const [duplicateForm, setDuplicateForm] = useState({ email: '', businessName: '', ownerName: '' });
  const [expandedAiClientId, setExpandedAiClientId] = useState<string | null>(null);
  const [aiActivity, setAiActivity] = useState<SaClientAiActivity | null>(null);
  const [aiActivityLoading, setAiActivityLoading] = useState(false);

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

  async function handleSaveLimit(clientId: string) {
    if (!token) return;
    const raw = limitDrafts[clientId];
    const limit = Number(raw);
    if (!Number.isFinite(limit) || limit < 0) {
      setError('Enter a valid AI message limit (0 or higher).');
      return;
    }
    setActionLoading(`${clientId}-limit`);
    setError(null);
    try {
      await saUpdateClientUsage(token, clientId, { aiMessageLimit: limit });
      await load();
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not update AI limit.'
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetUsage(clientId: string) {
    if (!token) return;
    setActionLoading(`${clientId}-reset`);
    setError(null);
    try {
      await saUpdateClientUsage(token, clientId, { resetUsage: true });
      await load();
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not reset AI usage.'
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSavePrice(clientId: string, currency: 'INR' | 'AED' | 'CAD') {
    if (!token) return;
    const raw = priceDrafts[clientId]?.trim();
    const paise =
      raw === '' || raw === undefined
        ? null
        : Math.round(Number(raw) * 100);
    if (paise !== null && (!Number.isFinite(paise) || paise < 0)) {
      setError('Enter a valid monthly price.');
      return;
    }
    setActionLoading(`${clientId}-price`);
    setError(null);
    try {
      await saUpdateClientUsage(token, clientId, {
        monthlyPricePaise: paise,
        monthlyPriceCurrency: currency,
      });
      await load();
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not update monthly price.'
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleAiActivity(clientId: string) {
    if (!token) return;
    if (expandedAiClientId === clientId) {
      setExpandedAiClientId(null);
      setAiActivity(null);
      return;
    }
    setExpandedAiClientId(clientId);
    setAiActivityLoading(true);
    setAiActivity(null);
    try {
      const data = await saGetClientAiActivity(token, clientId);
      setAiActivity(data);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load AI activity.'
      );
      setExpandedAiClientId(null);
    } finally {
      setAiActivityLoading(false);
    }
  }

  async function handleDuplicate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !duplicateFor) return;
    setActionLoading(`${duplicateFor.clientId}-duplicate`);
    setError(null);
    try {
      const result = await saDuplicateClient(token, duplicateFor.clientId, {
        email: duplicateForm.email,
        businessName: duplicateForm.businessName || undefined,
        ownerName: duplicateForm.ownerName || undefined,
      });
      setCreated(result);
      setDuplicateFor(null);
      setDuplicateForm({ email: '', businessName: '', ownerName: '' });
      await load();
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not duplicate client.'
      );
    } finally {
      setActionLoading(null);
    }
  }

  function formatMonthlyPrice(paise: number | null | undefined, currency: string | undefined): string {
    if (paise == null) return '';
    return (paise / 100).toString();
  }

  function copyCredentials() {
    if (!created) return;
    const text = `${APP_NAME} login\nClient ID: ${created.client.clientId}\nEmail: ${created.client.email}\nTemporary password: ${created.temporaryPassword}\nSign in: ${created.loginUrl}`;
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
              {loading ? '…' : (card.value ?? 0).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      {created && (
        <Card className="mb-6 border-success/30 bg-[#1E293B] p-4 text-white">
          <h2 className="font-semibold text-success">Client created. Share these credentials.</h2>
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

      {duplicateFor && (
        <Card className="mb-6 border-[#334155] bg-[#1E293B] p-4 text-white">
          <h2 className="mb-4 font-semibold">
            Duplicate {duplicateFor.clientId}. Copies AI settings and limits, not WhatsApp or leads.
          </h2>
          <form onSubmit={handleDuplicate} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="New email"
              type="email"
              value={duplicateForm.email}
              onChange={(e) => setDuplicateForm({ ...duplicateForm, email: e.target.value })}
              required
            />
            <Input
              label="Business name (optional)"
              value={duplicateForm.businessName}
              onChange={(e) => setDuplicateForm({ ...duplicateForm, businessName: e.target.value })}
            />
            <Input
              label="Owner name (optional)"
              value={duplicateForm.ownerName}
              onChange={(e) => setDuplicateForm({ ...duplicateForm, ownerName: e.target.value })}
            />
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button type="submit" loading={actionLoading === `${duplicateFor.clientId}-duplicate`}>
                Duplicate & generate password
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDuplicateFor(null)}>
                Cancel
              </Button>
            </div>
          </form>
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
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="bg-[#1E293B] text-[#94A3B8]">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">AI usage / limit</th>
              <th className="px-4 py-3 font-medium">Monthly price</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#94A3B8]">
                  Loading…
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#94A3B8]">
                  No clients yet. Create your first broker account.
                </td>
              </tr>
            ) : (
              clients.map((c) => {
                const busy = actionLoading?.startsWith(c.clientId) ?? false;
                const currency = (c.monthlyPriceCurrency ?? 'INR') as 'INR' | 'AED' | 'CAD';
                const limitValue = limitDrafts[c.clientId] ?? String(c.aiLimit);
                const priceValue =
                  priceDrafts[c.clientId] ??
                  formatMonthlyPrice(c.monthlyPricePaise, c.monthlyPriceCurrency);
                return (
                  <>
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
                      {c.aiResetDate && (
                        <p className="mt-1 text-[10px] text-[#64748B]">
                          Resets {new Date(c.aiResetDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={limitValue}
                          disabled={busy}
                          onChange={(e) =>
                            setLimitDrafts({ ...limitDrafts, [c.clientId]: e.target.value })
                          }
                          className="h-8 w-20 rounded border border-[#334155] bg-[#0F172A] px-2 text-xs text-white"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={actionLoading === `${c.clientId}-limit`}
                          disabled={busy}
                          onClick={() => void handleSaveLimit(c.clientId)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#94A3B8]"
                          loading={actionLoading === `${c.clientId}-reset`}
                          disabled={busy}
                          onClick={() => void handleResetUsage(c.clientId)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={priceValue}
                          disabled={busy}
                          onChange={(e) =>
                            setPriceDrafts({ ...priceDrafts, [c.clientId]: e.target.value })
                          }
                          className="h-8 w-24 rounded border border-[#334155] bg-[#0F172A] px-2 text-xs text-white"
                        />
                        <span className="text-xs text-[#94A3B8]">{currency}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={actionLoading === `${c.clientId}-price`}
                          disabled={busy}
                          onClick={() => void handleSavePrice(c.clientId, currency)}
                        >
                          Save
                        </Button>
                      </div>
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
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void toggleAiActivity(c.clientId)}
                        >
                          {expandedAiClientId === c.clientId ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          AI Activity
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            setDuplicateFor(c);
                            setDuplicateForm({
                              email: '',
                              businessName: `${c.businessName} (Copy)`,
                              ownerName: c.ownerName ?? '',
                            });
                          }}
                        >
                          Duplicate
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedAiClientId === c.clientId && (
                    <tr key={`${c.clientId}-ai`} className="border-t border-[#334155] bg-[#0F172A]">
                      <td colSpan={6} className="px-4 py-4">
                        {aiActivityLoading ? (
                          <p className="text-sm text-[#94A3B8]">Loading AI activity…</p>
                        ) : aiActivity ? (
                          <div className="grid gap-4 lg:grid-cols-3">
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                                Recent AI usage (last 20)
                              </h4>
                              {aiActivity.usage.length === 0 ? (
                                <p className="text-sm text-[#64748B]">No AI usage logged yet.</p>
                              ) : (
                                <div className="max-h-64 overflow-auto rounded-lg border border-[#334155]">
                                  <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 bg-[#1E293B] text-[#94A3B8]">
                                      <tr>
                                        <th className="px-2 py-1.5">Time</th>
                                        <th className="px-2 py-1.5">Model</th>
                                        <th className="px-2 py-1.5">Tokens</th>
                                        <th className="px-2 py-1.5">Cost</th>
                                        <th className="px-2 py-1.5">Fallback</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {aiActivity.usage.map((row, i) => (
                                        <tr key={i} className="border-t border-[#334155]">
                                          <td className="px-2 py-1.5 text-[#CBD5E1]">
                                            {new Date(row.createdAt).toLocaleString()}
                                          </td>
                                          <td className="px-2 py-1.5 font-mono text-primary">
                                            {row.model ?? EMPTY_VALUE}
                                          </td>
                                          <td className="px-2 py-1.5 text-[#CBD5E1]">
                                            {row.inputTokens}+{row.outputTokens}
                                          </td>
                                          <td className="px-2 py-1.5 text-[#CBD5E1]">
                                            ${row.costUsd.toFixed(6)}
                                          </td>
                                          <td className="px-2 py-1.5">
                                            {row.fallbackUsed ? 'Yes' : 'No'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                                AI failures (last 20)
                              </h4>
                              {aiActivity.failures.length === 0 ? (
                                <p className="text-sm text-[#64748B]">No provider failures logged.</p>
                              ) : (
                                <div className="max-h-64 overflow-auto rounded-lg border border-[#334155]">
                                  <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 bg-[#1E293B] text-[#94A3B8]">
                                      <tr>
                                        <th className="px-2 py-1.5">Time</th>
                                        <th className="px-2 py-1.5">Error</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {aiActivity.failures.map((row, i) => (
                                        <tr key={i} className="border-t border-[#334155]">
                                          <td className="whitespace-nowrap px-2 py-1.5 text-[#CBD5E1]">
                                            {new Date(row.createdAt).toLocaleString()}
                                          </td>
                                          <td className="px-2 py-1.5 text-red-300">
                                            {row.errorMessage}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                                WhatsApp delivery failures (last 20)
                              </h4>
                              {aiActivity.deliveryFailures.length === 0 ? (
                                <p className="text-sm text-[#64748B]">No failed outbound deliveries logged.</p>
                              ) : (
                                <div className="max-h-64 overflow-auto rounded-lg border border-[#334155]">
                                  <table className="w-full text-left text-xs">
                                    <thead className="sticky top-0 bg-[#1E293B] text-[#94A3B8]">
                                      <tr>
                                        <th className="px-2 py-1.5">Time</th>
                                        <th className="px-2 py-1.5">Message</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {aiActivity.deliveryFailures.map((row, i) => (
                                        <tr key={i} className="border-t border-[#334155]">
                                          <td className="whitespace-nowrap px-2 py-1.5 text-[#CBD5E1]">
                                            {new Date(row.createdAt).toLocaleString()}
                                          </td>
                                          <td className="px-2 py-1.5 text-amber-300">
                                            {row.content}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
