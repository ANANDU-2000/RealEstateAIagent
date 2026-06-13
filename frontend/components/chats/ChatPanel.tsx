'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Mic,
  Paperclip,
  Phone,
  Send,
  User,
  Zap,
} from 'lucide-react';
import type { Conversation, Message } from '@/lib/api';
import {
  formatMessageDate,
  formatRelativeTime,
  getConversationStatusBadge,
  isInputLocked,
} from '@/lib/chats-utils';
import { cn } from '@/lib/utils';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { MessageSquare } from 'lucide-react';

type ChatPanelProps = {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  aiName?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  onOpenProfile?: () => void;
  onTakeOver: () => void;
  onHandBackToAi: () => void;
  onSendMessage: (content: string) => void;
  onRetry: () => void;
};

type MessageGroup = { dateLabel: string; messages: Message[] };

function groupMessagesByDate(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const dateLabel = formatMessageDate(message.sentAt);
    const last = groups[groups.length - 1];
    if (last?.dateLabel === dateLabel) {
      last.messages.push(message);
    } else {
      groups.push({ dateLabel, messages: [message] });
    }
  }
  return groups;
}

function MessageBubble({ message }: { message: Message }) {
  const isSystem = message.sender === 'system';
  const isCustomer = message.sender === 'customer';
  const isAi = message.sender === 'ai';
  const isBroker = message.sender === 'broker';
  const isAudio = message.mediaType === 'audio';

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-surface-3 px-3 py-1 text-[11px] font-medium text-muted/70">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 py-1', isCustomer ? 'justify-start' : 'justify-end')}>
      {isCustomer && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-bold text-muted">
          C
        </div>
      )}

      <div className={cn('max-w-[75%]', !isCustomer && 'flex flex-col items-end')}>
        {isAi && (
          <span className="mb-1 text-[9px] font-bold uppercase tracking-widest text-primary/70">
            AI
          </span>
        )}
        <div
          className={cn(
            'px-3.5 py-2.5 text-[13px] shadow-[var(--shadow-xs)]',
            isCustomer &&
              'max-w-[72%] rounded-[18px] rounded-tl-[6px] border border-border bg-surface text-foreground',
            isAi && 'max-w-[72%] rounded-[18px] rounded-tr-[6px] bg-primary text-white',
            isBroker && 'max-w-[72%] rounded-[18px] rounded-tr-[6px] bg-[#1E293B] text-white'
          )}
        >
          {isAudio && (
            <div className="mb-1 flex items-center gap-1 text-xs opacity-80">
              <Mic className="h-3.5 w-3.5" />
              Voice note
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {message.mediaUrl && message.mediaType === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.mediaUrl}
              alt="Shared media"
              className="mt-2 max-h-48 rounded-lg object-cover"
            />
          )}
        </div>
        <span className="mt-1 text-[10px] text-muted/60">
          {formatRelativeTime(message.sentAt)}
        </span>
      </div>
    </div>
  );
}

export function ChatPanel({
  conversation,
  messages,
  loading,
  error,
  sending,
  aiName = 'Arjun',
  showBackButton,
  onBack,
  onOpenProfile,
  onTakeOver,
  onHandBackToAi,
  onSendMessage,
  onRetry,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const groups = groupMessagesByDate(messages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversation?.id]);

  useEffect(() => {
    setDraft('');
  }, [conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-surface-2/40">
        <EmptyState
          icon={MessageSquare}
          title="Select a conversation"
          description="Choose a chat from the list to view messages and respond."
        />
      </div>
    );
  }

  const statusBadge = getConversationStatusBadge(conversation);
  const locked = isInputLocked(conversation);
  const humanMode = conversation.humanOverride;
  const displayName = conversation.customerName ?? conversation.customerPhone;
  const showUltraHotBanner =
    conversation.leadStage === 'ultra_hot' || conversation.aiPaused;

  const handleSend = () => {
    const content = draft.trim();
    if (!content || locked || !humanMode || sending) return;
    onSendMessage(content);
    setDraft('');
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-surface">
      <div className="shrink-0 border-b border-border/60 bg-surface px-5 py-3.5">
        <div className="flex items-center gap-3">
          {showBackButton && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-surface-2 lg:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[14px] font-semibold text-foreground">{displayName}</h3>
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <p className="text-sm text-muted">{conversation.customerPhone}</p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <a
              href={`tel:${conversation.customerPhone}`}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
              aria-label="Call customer"
            >
              <Phone className="h-4 w-4" />
            </a>
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-surface-2"
                aria-label="Toggle profile"
              >
                <User className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {showUltraHotBanner && (
          <Alert variant="warning" className="mt-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>
                Ultra Hot — owner notified. AI paused.
              </span>
            </div>
          </Alert>
        )}

        {conversation.leadStage === 'low_budget' && (
          <Alert variant="warning" className="mt-3">
            Low budget lead — owner notified. AI paused.
          </Alert>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-surface-2/40 px-5 py-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className={cn('h-12', i % 2 === 0 ? 'w-2/3' : 'ml-auto w-1/2')} />
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="mb-3 text-sm text-danger">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No messages yet.</p>
        ) : (
          groups.map((group) => (
            <div key={group.dateLabel}>
              <div className="my-4 flex justify-center">
                <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted/70">
                  {group.dateLabel}
                </span>
              </div>
              {group.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-border/60 bg-surface px-4 py-3">
        {locked ? (
          <Alert variant="warning">
            AI paused — owner has been notified. Messaging is disabled.
          </Alert>
        ) : !humanMode ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              <span className="font-semibold text-primary">{aiName}</span> is handling this chat
            </p>
            <Button onClick={onTakeOver} size="sm">
              Take Over
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
                aria-label="Attach file"
                disabled
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-[var(--radius-lg)] border border-border bg-surface-2 px-3.5 py-2.5 text-[13px] outline-none focus:border-primary focus:shadow-[var(--focus-ring)]"
              />
              <Button
                onClick={handleSend}
                loading={sending}
                disabled={!draft.trim()}
                size="sm"
                className="shrink-0"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onHandBackToAi}>
              Hand Back to AI
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
