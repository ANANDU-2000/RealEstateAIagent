'use client';

import { useEffect, useState } from 'react';
import { Calendar, Phone, StickyNote, Trash2, X, Zap } from 'lucide-react';
import type { Conversation, Escalation } from '@/lib/api';
import {
  buildCustomerTags,
  formatBudget,
  formatRelativeTime,
  getAvatarColor,
  getInitials,
  getLeadScoreLabel,
} from '@/lib/chats-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

type ProfilePanelProps = {
  conversation: Conversation | null;
  escalations: Escalation[];
  country: string;
  loading?: boolean;
  savingNotes?: boolean;
  onClose?: () => void;
  onUpdateNotes: (notes: string) => void;
  onMarkUltraHot: () => void;
  onArchive?: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5">
      <span className="text-[11px] text-muted">{label}</span>
      <span className="text-[13px] font-medium text-foreground">{value}</span>
    </div>
  );
}

export function ProfilePanel({
  conversation,
  escalations,
  country,
  loading,
  savingNotes,
  onClose,
  onUpdateNotes,
  onMarkUltraHot,
  onArchive,
}: ProfilePanelProps) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(conversation?.brokerNotes ?? '');
  }, [conversation?.id, conversation?.brokerNotes]);

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col border-l border-border bg-surface p-4">
        <Skeleton className="mb-4 h-12 w-12 rounded-full" />
        <Skeleton className="mb-2 h-5 w-2/3" />
        <Skeleton className="mb-6 h-4 w-1/2" />
        <Skeleton className="mb-2 h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="hidden h-full w-[280px] shrink-0 items-center justify-center border-l border-border bg-surface p-6 xl:flex">
        <p className="text-center text-sm text-muted">Select a conversation to view profile</p>
      </div>
    );
  }

  const displayName = conversation.customerName ?? 'Unknown';
  const tags = buildCustomerTags(conversation);
  const scoreLabel = getLeadScoreLabel(conversation.leadScore);

  return (
    <div className="animate-slide-in-right flex h-full min-h-0 w-full flex-col overflow-y-auto border-l border-border bg-surface xl:w-[280px] xl:shrink-0">
      {onClose && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3 xl:hidden">
          <h3 className="font-semibold text-foreground">Customer Profile</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2"
            aria-label="Close profile"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="space-y-6 p-4">
        <section>
          <div className="mb-4 flex items-start gap-3">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold',
                getAvatarColor(conversation)
              )}
            >
              {getInitials(conversation.customerName, conversation.customerPhone)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">{displayName}</h3>
              <a
                href={`tel:${conversation.customerPhone}`}
                className="text-sm text-primary hover:underline"
              >
                {conversation.customerPhone}
              </a>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Lead score</span>
            <Badge variant={conversation.leadScore >= 76 ? 'warning' : 'default'}>
              {scoreLabel} · {conversation.leadScore}
            </Badge>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                conversation.leadScore >= 76
                  ? 'bg-orange'
                  : conversation.leadScore >= 51
                    ? 'bg-warning'
                    : conversation.leadScore >= 26
                      ? 'bg-primary'
                      : 'bg-muted-light'
              )}
              style={{ width: `${Math.min(100, Math.max(0, conversation.leadScore))}%` }}
            />
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="muted">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-1 border-t border-border/60 pt-4">
          <h4 className="px-4 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Details
          </h4>
          <DetailRow
            label="Budget"
            value={formatBudget(conversation.budgetMin, conversation.budgetMax, country)}
          />
          <DetailRow
            label="Area interest"
            value={conversation.preferredArea ?? 'Not specified'}
          />
          <DetailRow
            label="Property type"
            value={conversation.preferredType ?? 'Not specified'}
          />
          <DetailRow label="Language" value={conversation.languagePref} />
          <DetailRow
            label="First contact"
            value={new Date(conversation.firstMessageAt).toLocaleDateString()}
          />
          <DetailRow
            label="Total messages"
            value={String(conversation.messageCount ?? '—')}
          />
          <DetailRow
            label="Last active"
            value={formatRelativeTime(conversation.lastMessageAt)}
          />
        </section>

        <section className="space-y-2 border-t border-border/60 pt-4">
          <h4 className="px-4 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Actions
          </h4>
          <div className="grid gap-2 px-4">
            <a
              href={`tel:${conversation.customerPhone}`}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground hover:bg-surface-2"
            >
              <Phone className="h-4 w-4" />
              Call Now
            </a>
            <Button variant="outline" size="sm" fullWidth disabled>
              <Calendar className="h-4 w-4" />
              Schedule Callback
            </Button>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={onMarkUltraHot}
              disabled={conversation.leadStage === 'ultra_hot'}
            >
              <Zap className="h-4 w-4" />
              Mark Ultra Hot
            </Button>
            {onArchive && (
              <Button variant="ghost" size="sm" fullWidth onClick={onArchive}>
                <Trash2 className="h-4 w-4" />
                Archive
              </Button>
            )}
          </div>
        </section>

        <section className="space-y-2 border-t border-border/60 pt-4">
          <div className="flex items-center gap-2 px-4 pb-2 pt-5">
            <StickyNote className="h-4 w-4 text-muted" />
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              Notes
            </h4>
            {savingNotes && <span className="text-[11px] text-muted">Saving…</span>}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (conversation.brokerNotes ?? '')) {
                onUpdateNotes(notes);
              }
            }}
            placeholder="Private broker notes…"
            rows={4}
            className="mx-4 min-h-[120px] w-[calc(100%-2rem)] resize-none rounded-[var(--radius-lg)] border border-border bg-surface-2 px-3.5 py-3 text-[13px] outline-none focus:border-primary focus:shadow-[var(--focus-ring)]"
          />
        </section>

        {escalations.length > 0 && (
          <section className="space-y-2 border-t border-border/60 pt-4">
            <h4 className="px-4 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              Escalations
            </h4>
            <ul className="space-y-2 px-4">
              {escalations.map((esc) => (
                <li
                  key={esc.id}
                  className="rounded-[var(--radius-lg)] border border-border bg-surface-2 px-3 py-2.5 text-[13px]"
                >
                  <div className="font-medium capitalize text-foreground">
                    {esc.escalationType.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-muted">
                    {new Date(esc.triggeredAt).toLocaleString()}
                  </div>
                  {esc.notes && <p className="mt-1 text-xs text-muted">{esc.notes}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
