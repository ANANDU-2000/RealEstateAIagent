'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { SettingsPageShell } from '@/components/settings/SettingsPageShell';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import {
  getAiPromptPreview,
  getAiSettings,
  updateAiSettings,
  type AiSettings,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly & casual (recommended)' },
  { value: 'professional', label: 'Professional' },
  { value: 'mix', label: 'Mix — friendly with professional tone' },
];

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'English first' },
  { value: 'hinglish', label: 'Hinglish first' },
];

const FOLLOWUP_GAP_OPTIONS = [
  { value: '3hr', label: '3 hours after silence' },
  { value: '6hr', label: '6 hours after silence' },
  { value: 'next_morning', label: 'Next morning (9 AM)' },
];

const FOLLOWUP_COUNT_OPTIONS = [
  { value: '1', label: '1 follow-up' },
  { value: '2', label: '2 follow-ups (max)' },
];

const NO_MSG_HOUR_OPTIONS = [
  { value: '20', label: '8:00 PM' },
  { value: '21', label: '9:00 PM (default)' },
  { value: '22', label: '10:00 PM' },
];

export default function AiSettingsPage() {
  const { accessToken, tenant } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [aiName, setAiName] = useState('Arjun');
  const [aiTone, setAiTone] = useState<AiSettings['aiTone']>('friendly');
  const [languageDefault, setLanguageDefault] = useState<AiSettings['languageDefault']>('english');
  const [followupEnabled, setFollowupEnabled] = useState(true);
  const [aiFollowupCount, setAiFollowupCount] = useState(2);
  const [aiFollowupGap, setAiFollowupGap] = useState<AiSettings['aiFollowupGap']>('next_morning');
  const [noMsgAfterHour, setNoMsgAfterHour] = useState(21);

  const [answerPropertyQuestions, setAnswerPropertyQuestions] = useState(true);
  const [showPhotosAutomatically, setShowPhotosAutomatically] = useState(true);

  const [promptPreview, setPromptPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const canCustomizeName =
    tenant?.plan === 'pro' || tenant?.plan === 'agency' || tenant?.plan === 'trial';

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [data, preview] = await Promise.all([
        getAiSettings(accessToken),
        getAiPromptPreview(accessToken),
      ]);
      setAiName(data.aiName);
      setAiTone(data.aiTone);
      setLanguageDefault(data.languageDefault);
      setAiFollowupCount(data.aiFollowupCount);
      setFollowupEnabled(data.aiFollowupCount > 0);
      setAiFollowupGap(data.aiFollowupGap);
      setNoMsgAfterHour(data.noMsgAfterHour);
      setPromptPreview(preview.preview);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load AI settings.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function refreshPreview() {
    if (!accessToken) return;
    setPreviewLoading(true);
    try {
      const preview = await getAiPromptPreview(accessToken);
      setPromptPreview(preview.preview);
    } catch {
      // keep existing preview on failure
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSave() {
    if (!accessToken) return;
    setFormError(null);
    setSaving(true);
    try {
      await updateAiSettings(accessToken, {
        aiName: aiName.trim(),
        aiTone,
        languageDefault,
        aiFollowupCount: followupEnabled ? aiFollowupCount : 1,
        aiFollowupGap,
        noMsgAfterHour,
      });
      toast('AI settings saved');
      void refreshPreview();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not save settings.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPageShell
      title="AI Agent"
      description="Configure how Arjun talks to your leads on WhatsApp."
      loading={loading}
      error={error}
      onRetry={() => void loadSettings()}
    >
      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Agent identity</h3>
          <p className="mt-1 text-sm text-muted">Name, tone, and language preferences.</p>
        </div>

        <div>
          <Input
            label="AI name"
            value={aiName}
            onChange={(e) => setAiName(e.target.value)}
            disabled={!canCustomizeName}
            hint={
              canCustomizeName
                ? 'This is the name Arjun uses when introducing itself.'
                : 'Upgrade to Pro to customise your AI agent name.'
            }
          />
        </div>

        <Select
          label="Tone"
          value={aiTone}
          onChange={(e) => setAiTone(e.target.value as AiSettings['aiTone'])}
          options={TONE_OPTIONS}
        />

        <Select
          label="Language preference"
          value={languageDefault}
          onChange={(e) =>
            setLanguageDefault(e.target.value as AiSettings['languageDefault'])
          }
          options={LANGUAGE_OPTIONS}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Follow-up rules</h3>
          <p className="mt-1 text-sm text-muted">
            Arjun sends at most 2 follow-ups per lead. This cannot be increased.
          </p>
        </div>

        <Alert variant="info">
          Follow-ups help re-engage leads who stop replying. Max 2 per conversation.
        </Alert>

        <Checkbox
          label="Follow up unresponsive leads"
          checked={followupEnabled}
          onChange={(e) => setFollowupEnabled(e.target.checked)}
        />

        {followupEnabled && (
          <>
            <Select
              label="Follow-up after silence of"
              value={aiFollowupGap}
              onChange={(e) =>
                setAiFollowupGap(e.target.value as AiSettings['aiFollowupGap'])
              }
              options={FOLLOWUP_GAP_OPTIONS}
            />
            <Select
              label="Number of follow-ups"
              value={String(aiFollowupCount)}
              onChange={(e) => setAiFollowupCount(Number(e.target.value))}
              options={FOLLOWUP_COUNT_OPTIONS}
            />
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Messaging limits</h3>
        </div>

        <Select
          label="No messages after"
          value={String(noMsgAfterHour)}
          onChange={(e) => setNoMsgAfterHour(Number(e.target.value))}
          options={NO_MSG_HOUR_OPTIONS}
        />
        <p className="text-xs text-muted">
          Arjun will not send proactive messages or follow-ups after this hour (local time).
        </p>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Conversation behaviour</h3>
        </div>

        <Checkbox
          label={
            <span className="flex items-center gap-1.5">
              Ask &quot;call first or direct visit?&quot; before booking
              <Lock className="h-3.5 w-3.5 text-muted" aria-hidden />
            </span>
          }
          checked
          disabled
        />
        <p className="-mt-2 pl-6 text-xs text-muted">
          Required — helps qualify customers before scheduling.
        </p>

        <Checkbox
          label="Allow Arjun to answer property-specific questions"
          checked={answerPropertyQuestions}
          onChange={(e) => setAnswerPropertyQuestions(e.target.checked)}
          disabled
        />
        <p className="-mt-2 pl-6 text-xs text-muted">Enabled by default for your workspace.</p>

        <Checkbox
          label="Show property photos automatically"
          checked={showPhotosAutomatically}
          onChange={(e) => setShowPhotosAutomatically(e.target.checked)}
          disabled
        />
        <p className="-mt-2 pl-6 text-xs text-muted">
          Behaviour toggles are managed in a future update.
        </p>
      </Card>

      <Card className="flex flex-col gap-3 bg-surface-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Prompt preview</h3>
          <Button
            variant="ghost"
            size="sm"
            loading={previewLoading}
            onClick={() => void refreshPreview()}
          >
            Refresh
          </Button>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          {promptPreview ?? 'Preview will appear after settings load.'}
        </p>
        <p className="text-xs text-muted-light">
          Read-only summary of how Arjun is configured. Full prompt is managed in Super Admin.
        </p>
      </Card>

      {formError && <Alert variant="error">{formError}</Alert>}

      <Button fullWidth loading={saving} onClick={() => void handleSave()}>
        Save settings
      </Button>
    </SettingsPageShell>
  );
}
