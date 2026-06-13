'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Calendar,
  MessageSquare,
  Phone,
  StickyNote,
  User,
  X,
  Zap,
} from 'lucide-react';
import type { Conversation, Escalation, Message } from '@/lib/api';
import {
  buildCustomerTags,
  formatBudget,
  formatRelativeTime,
  getAvatarColor,
  getInitials,
  getLeadScoreLabel,
} from '@/lib/chats-utils';
import { stageLabel } from '@/lib/leads-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

type LeadDetailTab = 'overview' | 'timeline' | 'notes' | 'meetings' | 'escalations';

type LeadDetailProps = {
  conversation: Conversation | null;
  messages: Message[];
  escalations: Escalation[];
  country: string;
  loading?: boolean;
  savingNotes?: boolean;
  open: boolean;
  onClose: () => void;
  onUpdateNotes: (notes: string) => void;
  onMarkUltraHot: () => void;
};

const TABS: { id: LeadDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Notes' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'escalations', label: 'Escalations' },
];

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function timelineIcon(sender: Message['sender']) {
  if (sender === 'ai') return Bot;
  if (sender === 'broker') return User;
  return MessageSquare;
}

export function LeadDetail({
  conversation,
  messages,
  escalations,
  country,
  loading,
  savingNotes,
  open,
  onClose,
  onUpdateNotes,
  onMarkUltraHot,
}: LeadDetailProps) {
  const [activeTab, setActiveTab] = useState<LeadDetailTab>('overview');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setNotes(conversation?.brokerNotes ?? '');
    setActiveTab('overview');
  }, [conversation?.id, conversation?.brokerNotes]);

  const timelineEntries = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }, [messages]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30 bg-black/40"
        onClick={onClose}
        aria-label="Close lead detail"
      />
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-xl',
          'animate-in slide-in-from-right duration-200'
        )}
      >
        {loading || !conversation ? (
          <div className="flex flex-1 flex-col p-4">
            <Skeleton className="mb-4 h-8 w-3/4" />
            <Skeleton className="mb-2 h-12 w-12 rounded-full" />
            <Skeleton className="mb-6 h-4 w-1/2" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-border px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    getAvatarColor(conversation)
                  )}
                >
                  {getInitials(conversation.customerName, conversation.customerPhone)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-foreground">
                    {conversation.customerName ?? conversation.customerPhone}
                  </h2>
                  <p className="text-sm text-muted">{stageLabel(conversation.leadStage)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-surface-2"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-light text-primary'
                      : 'text-muted hover:bg-surface-2 hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {tab.id === 'escalations' && escalations.length > 0 && (
                    <span className="ml-1 text-[10px]">({escalations.length})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <section>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">Lead score</span>
                      <Badge variant={conversation.leadScore >= 76 ? 'warning' : 'default'}>
                        {getLeadScoreLabel(conversation.leadScore)} · {conversation.leadScore}
                      </Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          conversation.leadScore >= 76
                            ? 'bg-orange'
                            : conversation.leadScore >= 51
                              ? 'bg-warning'
                              : conversation.leadScore >= 26
                                ? 'bg-primary'
                                : 'bg-muted-light'
                        )}
                        style={{
                          width: `${Math.min(100, Math.max(0, conversation.leadScore))}%`,
                        }}
                      />
                    </div>
                    {buildCustomerTags(conversation).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {buildCustomerTags(conversation).map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <DetailRow label="Phone" value={conversation.customerPhone} />
                    <DetailRow
                      label="Budget"
                      value={formatBudget(
                        conversation.budgetMin,
                        conversation.budgetMax,
                        country
                      )}
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
                    <DetailRow label="Intent" value={conversation.intent} />
                    <DetailRow
                      label="First contact"
                      value={new Date(conversation.firstMessageAt).toLocaleDateString()}
                    />
                    <DetailRow
                      label="Last active"
                      value={formatRelativeTime(conversation.lastMessageAt)}
                    />
                    <DetailRow
                      label="Messages"
                      value={String(conversation.messageCount ?? messages.length)}
                    />
                  </section>

                  <section className="grid gap-2">
                    <a
                      href={`tel:${conversation.customerPhone}`}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold hover:bg-surface-2"
                    >
                      <Phone className="h-4 w-4" />
                      Call Now
                    </a>
                    <Link
                      href={`/chats?conversation=${conversation.id}`}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-semibold hover:bg-surface-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Open Chat
                    </Link>
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
                  </section>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-3">
                  {timelineEntries.length === 0 ? (
                    <p className="text-sm text-muted">No activity yet.</p>
                  ) : (
                    timelineEntries.map((msg) => {
                      const Icon = timelineIcon(msg.sender);
                      return (
                        <div
                          key={msg.id}
                          className="flex gap-3 rounded-lg border border-border bg-surface-2 p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3">
                            <Icon className="h-4 w-4 text-muted" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold capitalize text-foreground">
                                {msg.sender === 'customer'
                                  ? 'Message received'
                                  : msg.sender === 'ai'
                                    ? 'AI reply'
                                    : msg.sender === 'broker'
                                      ? 'Broker message'
                                      : msg.sender}
                              </span>
                              <span className="shrink-0 text-[10px] text-muted">
                                {new Date(msg.sentAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-muted" />
                    <h3 className="text-sm font-semibold">Broker notes</h3>
                    {savingNotes && <span className="text-xs text-muted">Saving…</span>}
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => {
                      if (notes !== (conversation.brokerNotes ?? '')) {
                        onUpdateNotes(notes);
                      }
                    }}
                    placeholder="Private notes about this lead…"
                    rows={8}
                    className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary focus:shadow-[var(--focus-ring)]"
                  />
                </div>
              )}

              {activeTab === 'meetings' && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <Calendar className="h-10 w-10 text-muted" />
                  <p className="text-sm font-medium text-foreground">No meetings yet</p>
                  <p className="max-w-xs text-xs text-muted">
                    Meetings booked through Arjun will appear here with status and reschedule
                    options.
                  </p>
                </div>
              )}

              {activeTab === 'escalations' && (
                <div className="space-y-3">
                  {escalations.length === 0 ? (
                    <p className="text-sm text-muted">No escalations for this lead.</p>
                  ) : (
                    escalations.map((esc) => (
                      <div
                        key={esc.id}
                        className="rounded-lg border border-border bg-surface-2 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize text-foreground">
                            {esc.escalationType.replace(/_/g, ' ')}
                          </span>
                          <Badge variant={esc.resolved ? 'success' : 'warning'}>
                            {esc.resolved ? 'Resolved' : 'Open'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(esc.triggeredAt).toLocaleString()}
                        </p>
                        {esc.notes && (
                          <p className="mt-2 text-sm text-muted">{esc.notes}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
