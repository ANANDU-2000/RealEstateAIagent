'use client';

import { useCallback, useEffect, useState } from 'react';
import { SettingsPageShell } from '@/components/settings/SettingsPageShell';
import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
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

const FIELD_CLASS =
  'h-10 rounded-[var(--radius-md)] border-border bg-surface shadow-[var(--shadow-xs)]';

const TEXTAREA_CLASS = cn(
  'min-h-[96px] w-full resize-y rounded-[var(--radius-md)] border border-border/90 bg-surface px-3.5 py-2.5 text-sm text-foreground shadow-[var(--shadow-xs)]',
  'placeholder:text-muted-light outline-none transition-all duration-150',
  'hover:border-border-dark focus:border-primary focus:shadow-[var(--focus-ring)]'
);

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
      footer={
        <div className="flex flex-col gap-3">
          {formError && <Alert variant="error">{formError}</Alert>}
          <Button fullWidth loading={saving} onClick={() => void handleSave()}>
            Save settings
          </Button>
        </div>
      }
    >
      {showAddressWarning && (
        <Alert variant="warning">
          Add your office address so customers can visit you in person.
        </Alert>
      )}

      <SettingsSectionCard
        title="Office address"
        description="Shared with customers who request an office visit."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="office-address"
              className="text-[13px] font-medium leading-none text-foreground"
            >
              Full office address
            </label>
            <textarea
              id="office-address"
              rows={3}
              className={TEXTAREA_CLASS}
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
            className={FIELD_CLASS}
          />

          <Input
            label="Google Maps link"
            type="url"
            placeholder="https://maps.google.com/..."
            value={officeMapsLink}
            onChange={(e) => setOfficeMapsLink(e.target.value)}
            className={FIELD_CLASS}
            hint="Optional. Helps customers find your office."
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Pre-visit reminders"
        description="Get notified before a customer visits so you can call to confirm."
      >
        <div className="flex flex-col gap-4">
          <Checkbox
            label="Remind me before customer visits"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
          />

          {reminderEnabled && (
            <div className="max-w-sm">
              <Select
                label="Remind me how early?"
                value={reminderBeforeVisit}
                onChange={(e) =>
                  setReminderBeforeVisit(e.target.value as OfficeSettings['reminderBeforeVisit'])
                }
                options={REMINDER_OPTIONS}
                className={FIELD_CLASS}
              />
            </div>
          )}

          <div className="border-t border-border/60 pt-4">
            <Checkbox
              label="Send customer a WhatsApp reminder before their visit"
              checked={customerReminder}
              onChange={(e) => setCustomerReminder(e.target.checked)}
            />

            {customerReminder && (
              <div className="mt-3 max-w-sm pl-6">
                <Select
                  label="How early to remind customer?"
                  value={customerReminderTime}
                  onChange={(e) =>
                    setCustomerReminderTime(
                      e.target.value as OfficeSettings['customerReminderTime']
                    )
                  }
                  options={CUSTOMER_REMINDER_OPTIONS}
                  className={FIELD_CLASS}
                />
              </div>
            )}
          </div>
        </div>
      </SettingsSectionCard>
    </SettingsPageShell>
  );
}
