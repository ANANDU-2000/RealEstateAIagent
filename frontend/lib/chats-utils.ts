import type { Conversation, LeadStage } from '@/lib/api';

export type ChatTab = 'all' | 'ai_active' | 'you' | 'hot' | 'ultra_hot' | 'booked' | 'cold';

export const CHAT_TABS: { id: ChatTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai_active', label: 'AI Active' },
  { id: 'you', label: 'You' },
  { id: 'hot', label: 'Hot' },
  { id: 'ultra_hot', label: 'Ultra Hot' },
  { id: 'booked', label: 'Booked' },
  { id: 'cold', label: 'Cold' },
];

export function filterConversationsByTab(
  conversations: Conversation[],
  tab: ChatTab
): Conversation[] {
  switch (tab) {
    case 'all':
      return conversations;
    case 'ai_active':
      return conversations.filter(
        (c) =>
          !c.humanOverride &&
          !c.aiPaused &&
          !['ultra_hot', 'cold', 'low_budget'].includes(c.leadStage)
      );
    case 'you':
      return conversations.filter((c) => c.humanOverride);
    case 'hot':
      return conversations.filter((c) => c.leadStage === 'hot');
    case 'ultra_hot':
      return conversations.filter((c) => c.leadStage === 'ultra_hot' || c.aiPaused);
    case 'booked':
      return conversations.filter((c) => c.leadStage === 'meeting_booked');
    case 'cold':
      return conversations.filter((c) => c.leadStage === 'cold');
    default:
      return conversations;
  }
}

export function getTabCounts(conversations: Conversation[]): Record<ChatTab, number> {
  return {
    all: conversations.length,
    ai_active: filterConversationsByTab(conversations, 'ai_active').length,
    you: filterConversationsByTab(conversations, 'you').length,
    hot: filterConversationsByTab(conversations, 'hot').length,
    ultra_hot: filterConversationsByTab(conversations, 'ultra_hot').length,
    booked: filterConversationsByTab(conversations, 'booked').length,
    cold: filterConversationsByTab(conversations, 'cold').length,
  };
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getInitials(name: string | null, phone: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return phone.slice(-2);
}

export function getAvatarColor(conversation: Conversation): string {
  if (conversation.leadStage === 'ultra_hot' || conversation.aiPaused) return 'bg-orange text-white';
  if (conversation.leadStage === 'hot') return 'bg-warning text-white';
  if (conversation.leadStage === 'cold') return 'bg-surface-3 text-muted';
  if (conversation.leadScore >= 70) return 'bg-danger text-white';
  if (conversation.leadScore >= 40) return 'bg-primary text-white';
  return 'bg-surface-3 text-muted';
}

export function getLeadScoreLabel(score: number): string {
  if (score >= 76) return 'Ultra Hot';
  if (score >= 51) return 'Hot';
  if (score >= 26) return 'Warm';
  return 'Cold';
}

export function getConversationStatusBadge(conversation: Conversation): {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'primary';
} {
  if (conversation.leadStage === 'ultra_hot' || conversation.aiPaused) {
    return { label: 'Ultra Hot', variant: 'warning' };
  }
  if (conversation.leadStage === 'meeting_booked') {
    return { label: 'Booked', variant: 'primary' };
  }
  if (conversation.leadStage === 'cold') {
    return { label: 'Cold', variant: 'default' };
  }
  if (conversation.humanOverride) {
    return { label: 'You', variant: 'primary' };
  }
  return { label: 'AI', variant: 'success' };
}

export function formatBudget(
  min: number | null,
  max: number | null,
  country: string
): string {
  if (min == null && max == null) return 'Not specified';

  const prefix = country === 'IN' ? '₹' : country === 'AE' ? 'AED ' : '$';

  const fmt = (n: number): string => {
    if (country === 'IN') {
      if (n >= 10_000_000) return `${prefix}${(n / 10_000_000).toFixed(1)}Cr`;
      if (n >= 100_000) return `${prefix}${(n / 100_000).toFixed(1)}L`;
    }
    return `${prefix}${n.toLocaleString()}`;
  };

  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (max != null) return `Up to ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return 'Not specified';
}

export function isInputLocked(conversation: Conversation): boolean {
  return (
    conversation.aiPaused ||
    conversation.leadStage === 'ultra_hot' ||
    conversation.leadStage === 'low_budget'
  );
}

export function buildCustomerTags(conversation: Conversation): string[] {
  const tags: string[] = [];
  if (conversation.isNri) tags.push('NRI');
  if (conversation.isReturning) tags.push('Returning');
  if (conversation.voiceNoteReceived) tags.push('Voice Note');
  if (conversation.callbackRequested) tags.push('Callback');
  if (conversation.preferredType) tags.push(conversation.preferredType);
  if (conversation.languagePref && conversation.languagePref !== 'english') {
    tags.push(conversation.languagePref);
  }
  if (conversation.intent && conversation.intent !== 'unknown') {
    tags.push(conversation.intent);
  }
  return tags;
}

export function truncatePreview(text: string | null, max = 55): string {
  if (!text) return 'No messages yet';
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function mergeConversation(
  list: Conversation[],
  updated: Conversation
): Conversation[] {
  const idx = list.findIndex((c) => c.id === updated.id);
  if (idx === -1) return sortConversations([updated, ...list]);
  const next = [...list];
  next[idx] = { ...next[idx], ...updated };
  return sortConversations(next);
}
