'use client';

import { AlertTriangle, MessageSquare, Search, X } from 'lucide-react';
import type { Conversation } from '@/lib/api';
import {
  CHAT_TABS_PRIMARY,
  type ChatTab,
  formatRelativeTime,
  getAvatarColor,
  getConversationStatusBadge,
  getInitials,
  getTabCounts,
  truncatePreview,
} from '@/lib/chats-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type ConversationListProps = {
  conversations: Conversation[];
  selectedId: string | null;
  activeTab: ChatTab;
  searchQuery: string;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onTabChange: (tab: ChatTab) => void;
  onSearchChange: (query: string) => void;
  onRetry: () => void;
};

export function ConversationList({
  conversations,
  selectedId,
  activeTab,
  searchQuery,
  unreadCount,
  loading,
  error,
  onSelect,
  onTabChange,
  onSearchChange,
  onRetry,
}: ConversationListProps) {
  const tabCounts = getTabCounts(conversations);

  return (
    <div className="flex h-full min-h-0 w-full shrink-0 flex-col border-r border-border bg-surface lg:w-[300px]">
      <div className="shrink-0 border-b border-border/60 px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[16px] font-bold tracking-tight text-foreground">Live Chats</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="h-10 w-full rounded-[var(--radius-md)] border border-border/90 bg-surface-2/80 pl-9 pr-9 text-[13px] outline-none transition-all placeholder:text-muted-light hover:border-border-dark focus:border-primary focus:shadow-[var(--focus-ring)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface-3"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 px-3 py-2.5">
        <div className="flex gap-1 overflow-x-auto">
          {CHAT_TABS_PRIMARY.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all',
                  isActive
                    ? 'bg-surface text-foreground shadow-[var(--shadow-sm)]'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {tab.label}
                <span className={cn('ml-1 tabular-nums', isActive ? 'text-muted' : 'text-muted/70')}>
                  ({tabCounts[tab.id]})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-[var(--radius-lg)]" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-light">
              <AlertTriangle className="h-6 w-6 text-danger" />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground">Unable to Load Conversations</h3>
            <p className="mt-1 max-w-[220px] text-[13px] leading-relaxed text-muted">{error}</p>
            <Button size="sm" className="mt-5 min-w-[160px]" onClick={onRetry}>
              Retry Connection
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="When buyers message your WhatsApp number, conversations will appear here. Open a chat to use Take Over or Hand Back to AI."
          />
        ) : (
          <ul>
            {conversations.map((conversation) => {
              const displayName = conversation.customerName ?? conversation.customerPhone;
              const statusBadge = getConversationStatusBadge(conversation);
              const isSelected = selectedId === conversation.id;

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    className={cn(
                      'relative flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors duration-100',
                      isSelected
                        ? 'border-l-[3px] border-l-primary bg-primary/5'
                        : 'border-l-[3px] border-l-transparent hover:bg-surface-2/80'
                    )}
                  >
                    {conversation.unread && (
                      <span className="absolute right-4 top-4 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}

                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                        getAvatarColor(conversation)
                      )}
                    >
                      {getInitials(conversation.customerName, conversation.customerPhone)}
                    </div>

                    <div className="min-w-0 flex-1 pr-5">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-foreground">
                          {displayName}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted">
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="truncate text-[12px] text-muted">
                        {truncatePreview(conversation.lastMessagePreview)}
                      </p>
                      <span
                        className={cn(
                          'mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          statusBadge.variant === 'success' && 'bg-success-light text-success',
                          statusBadge.variant === 'primary' && 'bg-primary/10 text-primary',
                          statusBadge.variant === 'warning' && 'bg-warning-light text-warning',
                          statusBadge.variant === 'default' && 'bg-surface-3 text-muted',
                          statusBadge.variant === 'danger' && 'bg-danger-light text-danger'
                        )}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
