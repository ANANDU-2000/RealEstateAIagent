'use client';

import { MessageSquare, Search, X } from 'lucide-react';
import type { Conversation } from '@/lib/api';
import {
  CHAT_TABS,
  type ChatTab,
  formatRelativeTime,
  getAvatarColor,
  getConversationStatusBadge,
  getInitials,
  getTabCounts,
  truncatePreview,
} from '@/lib/chats-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
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
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Live Chats</h2>
            {unreadCount > 0 && (
              <Badge variant="primary">{unreadCount} unread</Badge>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="h-10 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-9 text-sm outline-none focus:border-primary focus:shadow-[var(--focus-ring)]"
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

      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {CHAT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-surface-2 text-muted hover:bg-surface-3'
            )}
          >
            {tab.label}
            <span className="ml-1 opacity-80">({tabCounts[tab.id]})</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="mb-3 text-sm text-danger">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations"
            description="When buyers message your WhatsApp number, conversations will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
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
                      'relative flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2',
                      isSelected && 'bg-primary-light'
                    )}
                  >
                    {conversation.unread && (
                      <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" />
                    )}

                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        getAvatarColor(conversation)
                      )}
                    >
                      {getInitials(conversation.customerName, conversation.customerPhone)}
                    </div>

                    <div className="min-w-0 flex-1 pr-4">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-foreground">{displayName}</span>
                        <span className="shrink-0 text-[11px] text-muted">
                          {formatRelativeTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <p className="mb-1 truncate text-sm text-muted">
                        {truncatePreview(conversation.lastMessagePreview)}
                      </p>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
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
