'use client';

import { useCallback, useEffect, useState } from 'react';
import { SettingsPageShell } from '@/components/settings/SettingsPageShell';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { getOfficeSettings, updateOfficeSettings, type OfficeSettings } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const REMINDER_OPTIONS = [
  { value: '30min', label: '30 minutes before' },
  { value: '1hr', label: '1 hour before' },
  { value: '2hr', label: '2 hours before' },
  { value: '1day', label: '1 day before' },
];

const CUSTOMER_REMINDER_OPTIONS = [
  { value: '1hr', label: '1 hour before' },
  { value: '2hr', label: '2 hours before' },
  { value: '1day', label: '1 day before' },
];

export default function OfficeSettingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [officeAddress, setOfficeAddress] = useState('');
  const [officeCity, setOfficeCity] = useState('');
  const [officeMapsLink, setOfficeMapsLink] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderBeforeVisit, setReminderBeforeVisit] =
    useState<OfficeSettings['reminderBeforeVisit']>('1hr');
  const [customerReminder, setCustomerReminder] = useState(true);
  const [customerReminderTime, setCustomerReminderTime] =
    useState<OfficeSettings['customerReminderTime']>('1hr');

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOfficeSettings(accessToken);
      setOfficeAddress(data.officeAddress ?? '');
      setOfficeCity(data.officeCity ?? '');
      setOfficeMapsLink(data.officeMapsLink ?? '');
      setReminderBeforeVisit(data.reminderBeforeVisit);
      setReminderEnabled(Boolean(data.reminderBeforeVisit));
      setCustomerReminder(data.customerReminder);
      setCustomerReminderTime(data.customerReminderTime);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load office settings.';
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
    setSaving(true);
    try {
      await updateOfficeSettings(accessToken, {
        officeAddress: officeAddress.trim() || null,
        officeCity: officeCity.trim() || null,
        officeMapsLink: officeMapsLink.trim() || null,
        reminderBeforeVisit: reminderEnabled ? reminderBeforeVisit : '1hr',
        customerReminder,
        customerReminderTime,
      });
      toast('Office settings saved');
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

  const showAddressWarning = !officeAddress.trim();

  return (
    <SettingsPageShell
      title="Office & Visits"
      description="Share your office location and configure visit reminders."
      loading={loading}
      error={error}
      onRetry={() => void loadSettings()}
    >
      {showAddressWarning && (
        <Alert variant="warning">
          Add your office address so customers can visit you in person.
        </Alert>
      )}

      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Office address</h3>
          <p className="mt-1 text-sm text-muted">
            Shared with customers who request an office visit.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="office-address" className="text-sm font-medium text-foreground">
            Full office address
          </label>
          <textarea
            id="office-address"
            rows={4}
            className={cn(
              'w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-foreground',
              'placeholder:text-muted-light outline-none transition-shadow resize-y min-h-[100px]',
              'focus:border-primary focus:shadow-[var(--focus-ring)]'
            )}
            placeholder="e.g. SCO 154, Sector 17-C, Chandigarh 160017"
            value={officeAddress}
            onChange={(e) => setOfficeAddress(e.target.value)}
          />
        </div>

        <Input
          label="City"
          placeholder="Chandigarh"
          value={officeCity}
          onChange={(e) => setOfficeCity(e.target.value)}
        />

        <Input
          label="Google Maps link"
          type="url"
          placeholder="https://maps.google.com/..."
          value={officeMapsLink}
          onChange={(e) => setOfficeMapsLink(e.target.value)}
          hint="Optional — helps customers navigate to your office."
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Pre-visit reminders</h3>
          <p className="mt-1 text-sm text-muted">
            Get notified before a customer visits so you can call to confirm.
          </p>
        </div>

        <Checkbox
          label="Remind me before customer visits"
          checked={reminderEnabled}
          onChange={(e) => setReminderEnabled(e.target.checked)}
        />

        {reminderEnabled && (
          <Select
            label="Remind me how early?"
            value={reminderBeforeVisit}
            onChange={(e) =>
              setReminderBeforeVisit(e.target.value as OfficeSettings['reminderBeforeVisit'])
            }
            options={REMINDER_OPTIONS}
          />
        )}

        <div className="border-t border-border pt-4">
          <Checkbox
            label="Send customer a WhatsApp reminder before their visit"
            checked={customerReminder}
            onChange={(e) => setCustomerReminder(e.target.checked)}
          />
          {customerReminder && (
            <div className="mt-3 pl-6">
              <Select
                label="How early to remind customer?"
                value={customerReminderTime}
                onChange={(e) =>
                  setCustomerReminderTime(
                    e.target.value as OfficeSettings['customerReminderTime']
                  )
                }
                options={CUSTOMER_REMINDER_OPTIONS}
              />
            </div>
          )}
        </div>
      </Card>

      {formError && <Alert variant="error">{formError}</Alert>}

      <Button fullWidth loading={saving} onClick={() => void handleSave()}>
        Save settings
      </Button>
    </SettingsPageShell>
  );
}
