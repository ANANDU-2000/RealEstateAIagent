'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { SettingsPageShell } from '@/components/settings/SettingsPageShell';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { getAvailability, saveAvailability, type AvailabilitySlot } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

/** JS Date.getDay(): 0 = Sunday … 6 = Saturday. Display Mon → Sun. */
const DAYS = [
  { dow: 1, label: 'Monday', short: 'Mon' },
  { dow: 2, label: 'Tuesday', short: 'Tue' },
  { dow: 3, label: 'Wednesday', short: 'Wed' },
  { dow: 4, label: 'Thursday', short: 'Thu' },
  { dow: 5, label: 'Friday', short: 'Fri' },
  { dow: 6, label: 'Saturday', short: 'Sat' },
  { dow: 0, label: 'Sunday', short: 'Sun' },
] as const;

type DayState = {
  enabled: boolean;
  slots: string[];
};

type DraftSlot = {
  dayOfWeek: number;
  slotTime: string;
  isActive: boolean;
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h).padStart(2, '0'),
  label: formatHour12(h),
}));

const MINUTE_OPTIONS = [
  { value: '00', label: ':00' },
  { value: '30', label: ':30' },
];

function formatHour12(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h} ${period}`;
}

function formatSlotDisplay(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${mStr} ${period}`;
}

function buildInitialDays(): Record<number, DayState> {
  const map: Record<number, DayState> = {};
  for (const { dow } of DAYS) {
    map[dow] = { enabled: false, slots: [] };
  }
  return map;
}

function parseApiSlots(
  slotsByDay: Record<string, Array<{ slotTime: string; isActive: boolean }>>
): Record<number, DayState> {
  const map = buildInitialDays();

  for (const [dayKey, slots] of Object.entries(slotsByDay)) {
    const dow = Number(dayKey);
    if (Number.isNaN(dow) || !(dow in map)) continue;

    const activeSlots = slots.filter((s) => s.isActive).map((s) => s.slotTime);
    if (activeSlots.length > 0) {
      map[dow] = { enabled: true, slots: activeSlots.sort() };
    } else if (slots.length > 0) {
      map[dow] = { enabled: false, slots: [] };
    }
  }

  return map;
}

function toPayload(days: Record<number, DayState>): DraftSlot[] {
  const result: DraftSlot[] = [];
  for (const { dow } of DAYS) {
    const day = days[dow];
    if (!day.enabled) continue;
    for (const slotTime of day.slots) {
      result.push({ dayOfWeek: dow, slotTime, isActive: true });
    }
  }
  return result;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-surface-3'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}

function AddSlotRow({ onAdd }: { onAdd: (time: string) => void }) {
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        label="Hour"
        value={hour}
        onChange={(e) => setHour(e.target.value)}
        options={HOUR_OPTIONS}
        className="min-w-[100px]"
      />
      <Select
        label="Minute"
        value={minute}
        onChange={(e) => setMinute(e.target.value)}
        options={MINUTE_OPTIONS}
        className="min-w-[80px]"
      />
      <Button
        variant="outline"
        size="sm"
        className="mb-0.5"
        onClick={() => onAdd(`${hour}:${minute}`)}
      >
        <Plus className="h-4 w-4" />
        Add slot
      </Button>
    </div>
  );
}

export default function AvailabilitySettingsPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [days, setDays] = useState<Record<number, DayState>>(buildInitialDays);

  const totalSlots = useMemo(
    () => Object.values(days).reduce((sum, d) => sum + (d.enabled ? d.slots.length : 0), 0),
    [days]
  );

  const loadSettings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAvailability(accessToken);
      setDays(parseApiSlots(data.slotsByDay));
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not load availability.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateDay(dow: number, patch: Partial<DayState>) {
    setDays((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], ...patch },
    }));
  }

  function addSlot(dow: number, time: string) {
    setDays((prev) => {
      const day = prev[dow];
      if (day.slots.includes(time)) return prev;
      return {
        ...prev,
        [dow]: {
          ...day,
          enabled: true,
          slots: [...day.slots, time].sort(),
        },
      };
    });
  }

  function removeSlot(dow: number, time: string) {
    setDays((prev) => ({
      ...prev,
      [dow]: {
        ...prev[dow],
        slots: prev[dow].slots.filter((t) => t !== time),
      },
    }));
  }

  async function handleSave() {
    if (!accessToken) return;
    setFormError(null);

    const payload: AvailabilitySlot[] = toPayload(days);

    setSaving(true);
    try {
      const result = await saveAvailability(accessToken, payload);
      toast(`Saved ${result.count} availability slot${result.count === 1 ? '' : 's'}`);
      void loadSettings();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not save availability.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPageShell
      title="Availability"
      description="Set when customers can book office or site visits."
      loading={loading}
      error={error}
      onRetry={() => void loadSettings()}
    >
      <p className="text-sm text-muted">
        {totalSlots === 0
          ? 'No slots configured yet. Enable a day and add meeting times.'
          : `${totalSlots} active slot${totalSlots === 1 ? '' : 's'} across your week.`}
      </p>

      <div className="flex flex-col gap-4">
        {DAYS.map(({ dow, label, short }) => {
          const day = days[dow];
          return (
            <Card
              key={dow}
              className={cn(!day.enabled && 'bg-surface-2 opacity-90')}
              padding="sm"
            >
              <div className="flex items-center justify-between gap-3 px-1 py-1">
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted">{short}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">
                    {day.enabled ? 'Available' : 'Blocked'}
                  </span>
                  <Toggle
                    checked={day.enabled}
                    onChange={(enabled) => updateDay(dow, { enabled })}
                    label={`Toggle ${label} availability`}
                  />
                </div>
              </div>

              {day.enabled ? (
                <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
                  {day.slots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {day.slots.map((time) => (
                        <span
                          key={time}
                          className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary"
                        >
                          {formatSlotDisplay(time)}
                          <button
                            type="button"
                            className="rounded p-0.5 hover:bg-primary/10"
                            aria-label={`Remove ${formatSlotDisplay(time)}`}
                            onClick={() => removeSlot(dow, time)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No slots yet. Add a time below.</p>
                  )}
                  <AddSlotRow onAdd={(time) => addSlot(dow, time)} />
                </div>
              ) : (
                <p className="mt-3 border-t border-border pt-3 text-sm text-muted">
                  No meetings on this day.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {formError && <Alert variant="error">{formError}</Alert>}

      <Button fullWidth loading={saving} onClick={() => void handleSave()}>
        Save availability
      </Button>
    </SettingsPageShell>
  );
}
