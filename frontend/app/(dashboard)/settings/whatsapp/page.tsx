'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
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

const SETUP_STEPS = [
  'Open Meta Business Suite and select or create your business account.',
  'In WhatsApp Manager, register your phone number until Meta shows Connected (fixes error #133010).',
  'Copy the Phone Number ID and WhatsApp Business Account ID (WABA).',
  'Generate a permanent access token with whatsapp_business_messaging permission.',
  'Paste credentials below, save, then send a test message. Connected status requires a successful test.',
  'In Meta App → WhatsApp → Configuration, set webhook URL and verify token (see Webhook health below).',
];

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

export default function WhatsAppSettingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('');
  const [metaWabaId, setMetaWabaId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [tokenStored, setTokenStored] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

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
      if (tokenValue) {
        payload.metaAccessToken = tokenValue;
      }

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
        setShowToken(false);
      }
      if (result.credentialsChanged) {
        setSaveSuccess(
          'Saved. Connection reset because credentials changed — send a test message to verify.'
        );
        toast('Credentials updated. Send a test message to verify WhatsApp.');
      } else if (result.whatsappConnected) {
        setSaveSuccess('Saved. WhatsApp is connected and verified.');
        toast('Settings saved. WhatsApp is connected.');
      } else {
        setSaveSuccess('Saved. Credentials stored — use “Send test message” to verify.');
        toast('Settings saved.');
      }
      void loadSettings();
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

  async function handleTest() {
    if (!accessToken) return;
    setFormError(null);
    setSaveSuccess(null);
    setTesting(true);
    try {
      const result = await testWhatsAppConnection(accessToken);
      if (result.whatsappConnected) {
        setSaveSuccess('Test message sent successfully. WhatsApp is connected.');
        setSettings((prev) => (prev ? { ...prev, whatsappConnected: true } : prev));
        toast('Test passed — WhatsApp is connected.');
      } else {
        setSaveSuccess(null);
        toast(result.message);
      }
      void loadSettings();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Test message failed.';
      setFormError(message);
    } finally {
      setTesting(false);
    }
  }

  async function handleRegisterPhone() {
    if (!accessToken) return;
    setFormError(null);
    setSaveSuccess(null);
    setRegistering(true);
    try {
      const result = await registerWhatsAppPhone(accessToken, registerPin.trim());
      setRegisterPin('');
      if (result.whatsappConnected) {
        setSaveSuccess('Phone registered with Meta. Send a test message, then try WhatsApp again.');
        setSettings((prev) => (prev ? { ...prev, whatsappConnected: true } : prev));
      }
      toast(result.message);
      void loadSettings();
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
    const confirmed = window.confirm(
      'Disconnect WhatsApp? Arjun will stop receiving and sending messages until you reconnect.'
    );
    if (!confirmed) return;

    setFormError(null);
    setSaveSuccess(null);
    setDisconnecting(true);
    try {
      await updateWhatsAppSettings(accessToken, {
        whatsappNumber: null,
        metaPhoneNumberId: null,
        metaAccessToken: null,
        metaWabaId: null,
      });
      setWhatsappNumber('');
      setMetaPhoneNumberId('');
      setMetaWabaId('');
      setMetaAccessToken('');
      setTokenStored(false);
      toast('WhatsApp disconnected');
      void loadSettings();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not disconnect WhatsApp.';
      setFormError(message);
    } finally {
      setDisconnecting(false);
    }
  }

  const connected = settings?.whatsappConnected ?? false;
  const credentialsSaved =
    settings?.credentialsSaved ??
    (tokenStored && Boolean(metaPhoneNumberId.trim() || settings?.metaPhoneNumberId));
  const connectedAt = formatConnectedAt(settings?.whatsappConnectedAt ?? null);
  const lastTestFailed = settings?.lastWhatsappTestOk === false && settings?.lastWhatsappError;
  const missingPhoneNumberId =
    !credentialsSaved && (tokenStored || Boolean(metaAccessToken.trim())) && !metaPhoneNumberId.trim();
  const canTest =
    Boolean(metaPhoneNumberId.trim() || settings?.metaPhoneNumberId) &&
    (tokenStored || Boolean(metaAccessToken.trim()) || settings?.hasAccessToken);
  const webhookHealthData = webhookHealth ?? settings?.webhookHealth;

  return (
    <SettingsPageShell
      title="WhatsApp"
      description="Connect your business number so Arjun can reply to buyers on WhatsApp."
      loading={loading}
      error={error}
      onRetry={() => void loadSettings()}
    >
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Connection status</p>
            <p className="mt-0.5 text-sm text-muted">
              {connected
                ? whatsappNumber || 'Verified and ready'
                : credentialsSaved
                  ? 'Credentials saved. Send a test message to verify.'
                  : 'Not connected. Add Meta credentials below.'}
            </p>
            {connectedAt && (
              <p className="mt-1 text-xs text-muted">Connected since {connectedAt}</p>
            )}
          </div>
          <Badge variant={connected ? 'success' : credentialsSaved ? 'warning' : 'warning'}>
            {connected ? 'Connected' : credentialsSaved ? 'Needs verification' : 'Disconnected'}
          </Badge>
        </div>

        {lastTestFailed && !connected && (
          <Alert variant="error">{settings?.lastWhatsappError}</Alert>
        )}

        {(connected || credentialsSaved) && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              loading={testing}
              disabled={!canTest}
              onClick={() => void handleTest()}
            >
              Send test message
            </Button>
            {connected && (
              <Button
                variant="danger"
                size="sm"
                loading={disconnecting}
                onClick={() => void handleDisconnect()}
              >
                Disconnect
              </Button>
            )}
          </div>
        )}
      </Card>

      {webhookHealthData && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Webhook health</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              Verify token on server:{' '}
              <span className={webhookHealthData.verifyTokenConfigured ? 'text-success' : 'text-danger'}>
                {webhookHealthData.verifyTokenConfigured ? 'Configured' : 'Missing on Render'}
              </span>
            </li>
            <li>
              App secret on server:{' '}
              <span className={webhookHealthData.appSecretConfigured ? 'text-success' : 'text-danger'}>
                {webhookHealthData.appSecretConfigured ? 'Configured' : 'Missing — inbound chats will not appear'}
              </span>
            </li>
            <li>
              Callback URL:{' '}
              <code className="break-all text-xs text-foreground">{webhookHealthData.callbackUrl}</code>
            </li>
            {webhookHealth && (
              <li>
                Last webhook ping:{' '}
                {webhookHealth.lastWebhookAt
                  ? formatConnectedAt(webhookHealth.lastWebhookAt) ?? 'Recently'
                  : 'None — set Meta webhook URL and subscribe to messages'}
              </li>
            )}
            {webhookHealth && (
              <li>
                Last inbound message:{' '}
                {webhookHealth.lastInboundMessageAt
                  ? formatConnectedAt(webhookHealth.lastInboundMessageAt) ?? 'Recently'
                  : 'None yet — register phone, then message your business number from WhatsApp'}
              </li>
            )}
          </ul>
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Register phone with Meta</p>
          <p className="mt-1 text-sm text-muted">
            If test messages fail with error #133010, enter your 6-digit two-step verification PIN
            from Meta WhatsApp Manager and register the phone here.
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
        <Button
          variant="outline"
          loading={registering}
          disabled={registerPin.length !== 6}
          onClick={() => void handleRegisterPhone()}
        >
          Register phone with Meta
        </Button>
      </Card>

      {missingPhoneNumberId && (
        <Alert variant="warning">
          Your access token is saved, but Phone Number ID is missing. Buyers can message your
          number, yet PropAgent cannot receive those chats until you paste the Phone Number ID from
          Meta WhatsApp Manager and save.
        </Alert>
      )}

      <Card className="flex flex-col gap-4">
        <Input
          label="WhatsApp business number"
          type="tel"
          placeholder="+91 98765 43210"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          hint="Include country code. Test messages are sent to this number."
        />

        <Input
          label="Phone Number ID"
          placeholder="From Meta WhatsApp Manager"
          value={metaPhoneNumberId}
          onChange={(e) => setMetaPhoneNumberId(e.target.value)}
        />

        <Input
          label="WhatsApp Business Account ID (WABA)"
          placeholder="Meta Business Account ID"
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
                'h-11 w-full rounded-lg border bg-surface px-3 pr-10 text-sm text-foreground',
                'placeholder:text-muted-light outline-none transition-shadow',
                'focus:border-primary focus:shadow-[var(--focus-ring)]'
              )}
              placeholder={tokenStored ? 'Token saved. Enter a new value to replace.' : 'Paste permanent access token'}
              value={metaAccessToken}
              onChange={(e) => setMetaAccessToken(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
              onClick={() => setShowToken((v) => !v)}
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted">
            {tokenStored
              ? 'Leave blank to keep your saved token. Enter a new value to replace it.'
              : 'Required for sending and receiving WhatsApp messages.'}
          </p>
        </div>

        {formError && <Alert variant="error">{formError}</Alert>}
        {saveSuccess && !formError && (
          <Alert variant="success">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {saveSuccess}
            </span>
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          <Button loading={saving} onClick={() => void handleSave()}>
            Save settings
          </Button>
        </div>
      </Card>

      <Card padding="sm" className="overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left"
          onClick={() => setGuideOpen((v) => !v)}
          aria-expanded={guideOpen}
        >
          <span className="text-sm font-medium text-foreground">How to connect WhatsApp</span>
          {guideOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
          )}
        </button>
        {guideOpen && (
          <ol className="flex flex-col gap-2 border-t border-border px-2 pb-2 pt-3 text-sm text-muted">
            {SETUP_STEPS.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="font-mono text-xs text-primary">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </SettingsPageShell>
  );
}
