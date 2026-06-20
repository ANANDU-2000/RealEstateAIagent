'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateWhatsAppNumber } from '@/lib/api';
import { APP_NAME } from '@/lib/brand';
import { cn } from '@/lib/utils';

type WhatsAppSetupDrawerProps = {
  open: boolean;
  onClose: () => void;
  initialNumber: string;
  accessToken: string;
  onSaved: () => void;
};

const STEPS = [
  'Open Meta Business Suite and create or select your business account.',
  'Add a WhatsApp Business number under WhatsApp Manager.',
  'Copy your Phone Number ID. You will paste it in Settings later.',
  `Enter the same number below so ${APP_NAME} knows where to route messages.`,
];

export function WhatsAppSetupDrawer({
  open,
  onClose,
  initialNumber,
  accessToken,
  onSaved,
}: WhatsAppSetupDrawerProps) {
  const [number, setNumber] = useState(initialNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNumber(initialNumber);
      setError(null);
    }
  }, [open, initialNumber]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function handleSave() {
    setError(null);
    setLoading(true);
    try {
      await updateWhatsAppNumber(accessToken, number);
      onSaved();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'error' in err
          ? String((err as { error: string }).error)
          : 'Could not save your number. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex w-full max-w-md flex-col gap-5 rounded-t-[var(--radius-2xl)] bg-surface p-6 shadow-[var(--shadow-lg)]',
          'sm:rounded-[var(--radius-2xl)] sm:scale-100',
          'animate-scale-in'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Connect WhatsApp</h2>
            <p className="mt-1 text-sm text-muted">
              Save your business number now. Full Meta connection comes in Settings.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className="flex flex-col gap-2 text-sm text-muted">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-2">
              <span className="font-mono text-xs text-primary">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {error && (
          <p className="rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <Input
          label="WhatsApp business number"
          type="tel"
          placeholder="+91 98765 43210"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          hint="Include country code. This is the number buyers will message."
        />

        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button fullWidth loading={loading} onClick={() => void handleSave()}>
            Save number
          </Button>
        </div>
      </div>
    </div>
  );
}
