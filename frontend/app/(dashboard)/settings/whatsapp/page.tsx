'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Copy, Eye, EyeOff, Pencil } from 'lucide-react';
import { TabRow } from '@/components/layout/TabRow';
import { SettingsPageShell } from '@/components/settings/SettingsPageShell';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  getWhatsAppHealth,
  getWhatsAppSettings,
  registerWhatsAppPhone,
  testWhatsAppConnection,
  updateWhatsAppSettings,
  type WhatsAppHealth,
  type WhatsAppSettings,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type WaTab = 'overview' | 'credentials' | 'register' | 'webhook';

const WA_TABS: { id: WaTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'register', label: 'Register phone' },
  { id: 'webhook', label: 'Webhook' },
];

const CORRECT_WEBHOOK = 'https://realestateaiagent-0ubp.onrender.com/webhook/whatsapp';

function formatConnectedAt(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

function has133010Error(msg: string | null | undefined): boolean {
  return Boolean(msg?.includes('133010'));
}

export default function WhatsAppSettingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<WaTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('');
  const [metaWabaId, setMetaWabaId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [tokenStored, setTokenStored] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [editingCredentials, setEditingCredentials] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [webhookHealth, setWebhookHealth] = useState<WhatsAppHealth | null>(null);
  const [registerPin, setRegisterPin] = useState('');
  const [registering, setRegistering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [data, health] = await Promise.all([
        getWhatsAppSettings(accessToken),
        getWhatsAppHealth(accessToken).catch(() => null),
      ]);
      setSettings(data);
      setWebhookHealth(health);
      setWhatsappNumber(data.whatsappNumber ?? '');
      setMetaPhoneNumberId(data.metaPhoneNumberId ?? '');
      setMetaWabaId(data.metaWabaId ?? '');
      setTokenStored(data.hasAccessToken);
      setMetaAccessToken('');
      setShowToken(false);
      const saved =
        data.credentialsSaved ??
        (data.hasAccessToken && Boolean(data.metaPhoneNumberId));
      setEditingCredentials(!saved);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load WhatsApp settings.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (has133010Error(settings?.lastWhatsappError) && !settings?.whatsappConnected) {
      setActiveTab('register');
    }
  }, [settings?.lastWhatsappError, settings?.whatsappConnected]);

  async function handleSave() {
    if (!accessToken) return;
    setFormError(null);
    setSaveSuccess(null);

    const phoneId = metaPhoneNumberId.trim();
    const hasToken = Boolean(metaAccessToken.trim()) || tokenStored;
    if (hasToken && !phoneId) {
      setFormError('Phone Number ID is required when an access token is set.');
      return;
    }

    setSaving(true);
    try {
      const payload: {
        whatsappNumber: string;
        metaPhoneNumberId: string;
        metaWabaId: string;
        metaAccessToken?: string;
      } = {
        whatsappNumber: whatsappNumber.trim(),
        metaPhoneNumberId: metaPhoneNumberId.trim(),
        metaWabaId: metaWabaId.trim(),
      };

      const tokenValue = metaAccessToken.trim();
      if (tokenValue) payload.metaAccessToken = tokenValue;

      const result = await updateWhatsAppSettings(accessToken, payload);
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              whatsappNumber: result.whatsappNumber,
              metaPhoneNumberId: result.metaPhoneNumberId,
              metaWabaId: result.metaWabaId,
              whatsappConnected: result.whatsappConnected,
              hasAccessToken: Boolean(result.credentialsReady ?? tokenStored),
            }
          : null
      );
      if (tokenValue) {
        setTokenStored(true);
        setMetaAccessToken('');
      }
      setEditingCredentials(false);
      setSaveSuccess('Credentials saved. Go to Overview and send a test message.');
      toast('Credentials saved.');
      void loadSettings();
      setActiveTab('overview');
    } catch (err) {
      setFormError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not save settings.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!accessToken) return;
    setFormError(null);
    setSaveSuccess(null);
    setTesting(true);
    try {
      const result = await testWhatsAppConnection(accessToken);
      if (result.whatsappConnected) {
        setSaveSuccess('Test message sent. WhatsApp is connected.');
        toast('WhatsApp connected.');
      } else {
        toast(result.message);
      }
      void loadSettings();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Test message failed.';
      setFormError(message);
      if (has133010Error(message)) setActiveTab('register');
    } finally {
      setTesting(false);
    }
  }

  async function handleRegisterPhone() {
    if (!accessToken) return;
    setFormError(null);
    setRegistering(true);
    try {
      const result = await registerWhatsAppPhone(accessToken, registerPin.trim());
      setRegisterPin('');
      toast(result.message);
      setSaveSuccess('Phone registered with Meta. Send a test message from Overview.');
      void loadSettings();
      setActiveTab('overview');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Phone registration failed.';
      setFormError(message);
    } finally {
      setRegistering(false);
    }
  }

  async function handleDisconnect() {
    if (!accessToken) return;
    if (!window.confirm('Disconnect WhatsApp? Arjun will stop replying until you reconnect.')) return;
    setDisconnecting(true);
    try {
      await updateWhatsAppSettings(accessToken, {
        whatsappNumber: null,
        metaPhoneNumberId: null,
        metaAccessToken: null,
        metaWabaId: null,
      });
      setEditingCredentials(true);
      toast('WhatsApp disconnected');
      void loadSettings();
    } catch (err) {
      setFormError(
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not disconnect.'
      );
    } finally {
      setDisconnecting(false);
    }
  }

  function copyWebhookUrl(url: string) {
    void navigator.clipboard.writeText(url);
    toast('Webhook URL copied');
  }

  const connected = settings?.whatsappConnected ?? false;
  const credentialsSaved =
    settings?.credentialsSaved ??
    (tokenStored && Boolean(metaPhoneNumberId.trim() || settings?.metaPhoneNumberId));
  const connectedAt = formatConnectedAt(settings?.whatsappConnectedAt ?? null);
  const lastError = settings?.lastWhatsappError;
  const show133010 = has133010Error(lastError) || has133010Error(formError);
  const webhookHealthData = webhookHealth ?? settings?.webhookHealth;
  const callbackUrl = webhookHealthData?.callbackUrl ?? CORRECT_WEBHOOK;
  const webhookUrlWrong = callbackUrl !== CORRECT_WEBHOOK;
  const canTest =
    credentialsSaved &&
    Boolean(metaPhoneNumberId.trim() || settings?.metaPhoneNumberId) &&
    (tokenStored || settings?.hasAccessToken);

  return (
    <SettingsPageShell
      title="WhatsApp"
      description="Connect PropAgent to your Meta business number."
      loading={loading}
      error={error}
      onRetry={() => void loadSettings()}
    >
      <TabRow
        items={WA_TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as WaTab)}
        variant="pills"
        className="w-full"
      />

      {formError && activeTab !== 'credentials' && (
        <Alert variant="error">{formError}</Alert>
      )}
      {saveSuccess && activeTab === 'overview' && (
        <Alert variant="success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {saveSuccess}
          </span>
        </Alert>
      )}

      {activeTab === 'overview' && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Connection</p>
              <p className="mt-1 text-sm text-muted">
                {connected
                  ? `Live on ${whatsappNumber || settings?.whatsappNumber}`
                  : credentialsSaved
                    ? 'Credentials saved — verify with a test message.'
                    : 'Add credentials in the Credentials tab first.'}
              </p>
              {connectedAt && (
                <p className="mt-1 text-xs text-muted">Connected since {connectedAt}</p>
              )}
            </div>
            <Badge variant={connected ? 'success' : credentialsSaved ? 'warning' : 'warning'}>
              {connected ? 'Connected' : credentialsSaved ? 'Needs test' : 'Not set up'}
            </Badge>
          </div>

          {show133010 && (
            <Alert variant="error">
              Error #133010 — phone not registered for Cloud API. Open the{' '}
              <button
                type="button"
                className="font-semibold text-primary underline"
                onClick={() => setActiveTab('register')}
              >
                Register phone
              </button>{' '}
              tab, enter your Meta 6-digit PIN, then test again.
            </Alert>
          )}

          {lastError && !show133010 && !connected && (
            <Alert variant="error">{lastError}</Alert>
          )}

          {credentialsSaved && (
            <dl className="grid gap-2 rounded-[var(--radius-lg)] border border-border bg-surface-2/50 p-3 text-[12px] sm:grid-cols-2">
              <div>
                <dt className="text-muted">Number</dt>
                <dd className="font-mono font-medium text-foreground">{whatsappNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted">Phone Number ID</dt>
                <dd className="font-mono font-medium text-foreground">{metaPhoneNumberId || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">WABA</dt>
                <dd className="font-mono font-medium text-foreground">{metaWabaId || '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Access token</dt>
                <dd className="text-foreground">{tokenStored ? 'Saved securely' : 'Not saved'}</dd>
              </div>
            </dl>
          )}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {!credentialsSaved && (
              <Button size="sm" onClick={() => setActiveTab('credentials')}>
                Add credentials
              </Button>
            )}
            {credentialsSaved && (
              <>
                <Button
                  size="sm"
                  loading={testing}
                  disabled={!canTest}
                  onClick={() => void handleTest()}
                >
                  Send test message
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingCredentials(true);
                    setActiveTab('credentials');
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit credentials
                </Button>
              </>
            )}
            {connected && (
              <Button
                size="sm"
                variant="danger"
                loading={disconnecting}
                onClick={() => void handleDisconnect()}
              >
                Disconnect
              </Button>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'credentials' && (
        <Card className="flex flex-col gap-4">
          {!editingCredentials && credentialsSaved ? (
            <>
              <p className="text-sm text-muted">
                Credentials are saved. Use Overview to test, or edit if Meta IDs changed.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => setEditingCredentials(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit credentials
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                Enter once from Meta Business Suite → WhatsApp Manager. After saving, you will not
                need to fill these again unless you change Meta apps.
              </p>
              <Input
                label="WhatsApp business number"
                type="tel"
                placeholder="9056458838"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                hint="Digits only, with country code (no +)."
              />
              <Input
                label="Phone Number ID"
                placeholder="1234959086357829"
                value={metaPhoneNumberId}
                onChange={(e) => setMetaPhoneNumberId(e.target.value)}
              />
              <Input
                label="WABA ID"
                placeholder="930455233343881"
                value={metaWabaId}
                onChange={(e) => setMetaWabaId(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="meta-access-token" className="text-sm font-medium text-foreground">
                  Access token
                </label>
                <div className="relative">
                  <input
                    id="meta-access-token"
                    type={showToken ? 'text' : 'password'}
                    className={cn(
                      'h-11 w-full rounded-lg border border-border bg-surface px-3 pr-10 text-sm',
                      'focus:border-primary focus:shadow-[var(--focus-ring)] outline-none'
                    )}
                    placeholder={
                      tokenStored ? 'Leave blank to keep saved token' : 'Paste permanent token'
                    }
                    value={metaAccessToken}
                    onChange={(e) => setMetaAccessToken(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted"
                    onClick={() => setShowToken((v) => !v)}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {formError && <Alert variant="error">{formError}</Alert>}
              <div className="flex flex-wrap gap-2">
                <Button loading={saving} onClick={() => void handleSave()}>
                  Save credentials
                </Button>
                {credentialsSaved && (
                  <Button variant="ghost" onClick={() => setEditingCredentials(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      {activeTab === 'register' && (
        <Card className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Fix error #133010</p>
            <p className="mt-1 text-sm text-muted">
              Meta Business Suite may show &quot;Connected&quot; but Cloud API still needs registration.
              Use the same 6-digit PIN from WhatsApp Manager → Two-step verification.
            </p>
          </div>
          <Input
            label="Two-step verification PIN"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit PIN"
            value={registerPin}
            onChange={(e) => setRegisterPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          {formError && <Alert variant="error">{formError}</Alert>}
          <Button
            loading={registering}
            disabled={registerPin.length !== 6 || !credentialsSaved}
            onClick={() => void handleRegisterPhone()}
          >
            Register phone with Meta
          </Button>
          {!credentialsSaved && (
            <p className="text-xs text-muted">Save credentials first, then register.</p>
          )}
        </Card>
      )}

      {activeTab === 'webhook' && webhookHealthData && (
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-foreground">Webhook (for inbound chats)</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              Verify token:{' '}
              <span
                className={
                  webhookHealthData.verifyTokenConfigured ? 'text-success' : 'text-danger'
                }
              >
                {webhookHealthData.verifyTokenConfigured ? 'Configured' : 'Missing on Render'}
              </span>
            </li>
            <li>
              App secret:{' '}
              <span
                className={
                  webhookHealthData.appSecretConfigured ? 'text-success' : 'text-danger'
                }
              >
                {webhookHealthData.appSecretConfigured ? 'Configured' : 'Missing on Render'}
              </span>
            </li>
            <li>
              Last webhook:{' '}
              {webhookHealth?.lastWebhookAt
                ? formatConnectedAt(webhookHealth.lastWebhookAt)
                : 'None yet'}
            </li>
            <li>
              Last inbound message:{' '}
              {webhookHealth?.lastInboundMessageAt
                ? formatConnectedAt(webhookHealth.lastInboundMessageAt)
                : 'None yet'}
            </li>
          </ul>

          <div className="rounded-[var(--radius-md)] border border-border bg-surface-2/50 p-3">
            <p className="text-xs font-medium text-muted">Paste this URL in Meta → WhatsApp → Configuration</p>
            <code className="mt-2 block break-all text-[12px] text-foreground">{CORRECT_WEBHOOK}</code>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => copyWebhookUrl(CORRECT_WEBHOOK)}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy webhook URL
            </Button>
          </div>

          {webhookUrlWrong && (
            <Alert variant="warning">
              Server reported a different URL ({callbackUrl}). Set{' '}
              <code>PUBLIC_API_URL=https://realestateaiagent-0ubp.onrender.com</code> on Render and
              use the URL above in Meta.
            </Alert>
          )}

          <p className="text-xs text-muted">
            Verify token: <code>propagent_webhook_verify_2026_secure</code> · Subscribe to{' '}
            <strong>messages</strong>
          </p>
        </Card>
      )}
    </SettingsPageShell>
  );
}
