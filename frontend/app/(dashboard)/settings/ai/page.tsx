'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SettingsPageShell } from '@/components/settings/SettingsPageShell';
import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
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

const FIELD_CLASS =
  'h-10 rounded-[var(--radius-md)] border-border/90 bg-white shadow-[var(--shadow-xs)]';

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
      footer={
        <div className="flex flex-col gap-3">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Button fullWidth loading={saving} onClick={() => void handleSave()}>
            Save settings
          </Button>
        </div>
      }
    >
      <SettingsSectionCard
        title="Agent identity"
        description="Name, tone, and language preferences."
      >
        <div className="flex flex-col gap-4">
          <Input
            label="AI name"
            value={aiName}
            onChange={(e) => setAiName(e.target.value)}
            disabled={!canCustomizeName}
            className={FIELD_CLASS}
            hint={
              canCustomizeName
                ? 'This is the name Arjun uses when introducing itself.'
                : 'Upgrade to Pro to customize your AI agent name.'
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tone"
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value as AiSettings['aiTone'])}
              options={TONE_OPTIONS}
              className={FIELD_CLASS}
            />
            <Select
              label="Language preference"
              value={languageDefault}
              onChange={(e) =>
                setLanguageDefault(e.target.value as AiSettings['languageDefault'])
              }
              options={LANGUAGE_OPTIONS}
              className={FIELD_CLASS}
            />
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Follow-up rules"
        description="Arjun sends at most 2 follow-ups per lead. This cannot be increased."
      >
        <div className="flex flex-col gap-4">
          <Alert variant="info">
            Follow-ups help re-engage leads who stop replying. Max 2 per conversation.
          </Alert>

          <Checkbox
            label="Follow up unresponsive leads"
            checked={followupEnabled}
            onChange={(e) => setFollowupEnabled(e.target.checked)}
          />

          {followupEnabled && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Follow-up after silence of"
                value={aiFollowupGap}
                onChange={(e) =>
                  setAiFollowupGap(e.target.value as AiSettings['aiFollowupGap'])
                }
                options={FOLLOWUP_GAP_OPTIONS}
                className={FIELD_CLASS}
              />
              <Select
                label="Number of follow-ups"
                value={String(aiFollowupCount)}
                onChange={(e) => setAiFollowupCount(Number(e.target.value))}
                options={FOLLOWUP_COUNT_OPTIONS}
                className={FIELD_CLASS}
              />
            </div>
          )}
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Messaging limits">
        <div className="max-w-sm">
          <Select
            label="No messages after"
            value={String(noMsgAfterHour)}
            onChange={(e) => setNoMsgAfterHour(Number(e.target.value))}
            options={NO_MSG_HOUR_OPTIONS}
            className={FIELD_CLASS}
            hint="Arjun will not send proactive messages or follow-ups after this hour (local time)."
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard title="Conversation behaviour">
        <div className="divide-y divide-border/60">
          <SettingsToggleRow
            label='Ask "call first or direct visit?" before booking'
            description="Required — helps qualify customers before scheduling."
            checked
            disabled
            locked
          />
          <SettingsToggleRow
            label="Allow Arjun to answer property-specific questions"
            description="Enabled by default for your workspace."
            checked={answerPropertyQuestions}
            disabled
            onChange={setAnswerPropertyQuestions}
          />
          <SettingsToggleRow
            label="Show property photos automatically"
            description="Behaviour toggles are managed in a future update."
            checked={showPhotosAutomatically}
            disabled
            onChange={setShowPhotosAutomatically}
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Prompt preview"
        headerAction={
          <button
            type="button"
            onClick={() => void refreshPreview()}
            disabled={previewLoading}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-dark disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      >
        <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-2/90 px-4 py-3.5">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
            {promptPreview ?? 'Preview will appear after settings load.'}
          </p>
        </div>
        <p className="mt-3 text-[12px] text-muted-light">
          Read-only summary of how Arjun is configured. Full prompt is managed in Super Admin.
        </p>
      </SettingsSectionCard>
    </SettingsPageShell>
  );
}
