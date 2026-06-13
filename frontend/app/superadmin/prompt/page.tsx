'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSaAuth } from '@/hooks/useSaAuth';
import { saGetPrompt, saUpdatePrompt } from '@/lib/api';

export default function SuperAdminPromptPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useSaAuth();
  const [content, setContent] = useState('');
  const [version, setVersion] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace('/superadmin/login');
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await saGetPrompt(token);
        if (!cancelled) {
          setContent(data.content);
          setVersion(data.version);
          setUpdatedAt(data.updatedAt);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err && typeof err === 'object' && 'error' in err
              ? String((err as { error: string }).error)
              : 'Could not load prompt.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, authLoading, router]);

  async function handleSave() {
    if (!token) return;
    if (content.trim().length < 50) {
      setError('Prompt must be at least 50 characters.');
      return;
    }

    const confirmed = window.confirm(
      'Deploy this prompt to all brokers? A new version will be created and activated immediately.'
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await saUpdatePrompt(token, content);
      setVersion(result.version);
      setUpdatedAt(new Date().toISOString());
      setSuccess(`Prompt saved as version ${result.version}.`);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not save prompt.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || (!token && !error)) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Skeleton className="mb-4 h-10 w-64 bg-[#1E293B]" />
        <Skeleton className="h-96 w-full bg-[#1E293B]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Global AI Prompt</h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Edit the system prompt used by Arjun across all broker accounts
          </p>
          {version !== null && (
            <p className="mt-2 text-xs text-[#64748B]">
              Version {version}
              {updatedAt ? ` · Last updated ${new Date(updatedAt).toLocaleString()}` : ''}
            </p>
          )}
        </div>
        <Button size="sm" loading={saving} onClick={() => void handleSave()} disabled={loading}>
          <Save className="h-4 w-4" />
          Save & deploy
        </Button>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-danger/20 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      )}

      <Card className="border-[#334155] bg-[#1E293B] p-4">
        {loading ? (
          <Skeleton className="h-96 w-full bg-[#334155]" />
        ) : (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={24}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-[#334155] bg-[#0F172A] p-4 font-mono text-sm leading-relaxed text-[#E2E8F0] outline-none focus:border-primary focus:shadow-[var(--focus-ring)]"
              placeholder="Enter the global AI system prompt…"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-[#94A3B8]">
              <span>{content.length.toLocaleString()} characters</span>
              <span>Minimum 50 characters required</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
