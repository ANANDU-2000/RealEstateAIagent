'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';
import {
  type ApiError,
  type Conversation,
  type Escalation,
  type Message,
  getConversation,
  getConversationCounts,
  listConversations,
  markConversationRead,
  sendConversationMessage,
  updateConversation,
} from '@/lib/api';
import {
  type ChatTab,
  filterConversationsByTab,
  mergeConversation,
  sortConversations,
} from '@/lib/chats-utils';
import { ConversationList } from '@/components/chats/ConversationList';
import { ChatPanel } from '@/components/chats/ChatPanel';
import { ProfilePanel } from '@/components/chats/ProfilePanel';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

type MobileView = 'list' | 'chat' | 'profile';

type RealtimeNewMessage = {
  conversationId: string;
  message: Partial<Message> & { id?: string; content?: string; sender?: Message['sender'] };
};

type RealtimeConversationUpdate = {
  conversation: Conversation;
};

type RealtimeEscalation = {
  conversationId: string;
  type: string;
};

type RealtimeHumanOverride = {
  conversationId: string;
  customerPhone?: string;
};

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    return (err as ApiError).error;
  }
  return 'Something went wrong';
}

function normalizeSocketMessage(
  conversationId: string,
  partial: RealtimeNewMessage['message']
): Message {
  return {
    id: partial.id ?? `temp-${Date.now()}`,
    conversationId,
    direction: partial.direction ?? (partial.sender === 'customer' ? 'inbound' : 'outbound'),
    sender: partial.sender ?? 'customer',
    content: partial.content ?? '',
    mediaType: partial.mediaType ?? 'text',
    mediaUrl: partial.mediaUrl ?? null,
    whatsappMsgId: partial.whatsappMsgId ?? null,
    aiModelUsed: partial.aiModelUsed ?? null,
    aiConfidence: partial.aiConfidence ?? null,
    status: partial.status ?? 'sent',
    sentAt: partial.sentAt ?? new Date().toISOString(),
  };
}

export default function ChatsPage() {
  const { accessToken, tenant, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [activeTab, setActiveTab] = useState<ChatTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [showProfileDesktop, setShowProfileDesktop] = useState(true);

  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const filteredConversations = useMemo(() => {
    const byTab = filterConversationsByTab(conversations, activeTab);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter(
      (c) =>
        c.customerName?.toLowerCase().includes(q) ||
        c.customerPhone.includes(q)
    );
  }, [conversations, activeTab, searchQuery]);

  const loadConversations = useCallback(async () => {
    if (!accessToken) return;
    setListLoading(true);
    setListError(null);
    try {
      const [listResult, counts] = await Promise.all([
        listConversations(accessToken, { count: true }),
        getConversationCounts(accessToken),
      ]);
      setConversations(sortConversations(listResult.conversations));
      setUnreadCount(counts.unreadCount ?? listResult.unreadCount ?? 0);
    } catch (err) {
      setListError(getErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, [accessToken]);

  const loadConversationDetail = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      setChatLoading(true);
      setChatError(null);
      try {
        const data = await getConversation(accessToken, id);
        setMessages(data.messages);
        setEscalations(data.escalations);
        setConversations((prev) => mergeConversation(prev, data.conversation));

        if (data.conversation.unread) {
          const readResult = await markConversationRead(accessToken, id);
          setConversations((prev) => mergeConversation(prev, readResult.conversation));
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        setChatError(getErrorMessage(err));
      } finally {
        setChatLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (accessToken) {
      void loadConversations();
    }
  }, [accessToken, loadConversations]);

  useEffect(() => {
    if (selectedId && accessToken) {
      void loadConversationDetail(selectedId);
    } else {
      setMessages([]);
      setEscalations([]);
    }
  }, [selectedId, accessToken, loadConversationDetail]);

  const handleNewMessage = useCallback(
    (data: unknown) => {
      const payload = data as RealtimeNewMessage;
      if (!payload.conversationId || !payload.message) return;

      const incoming = normalizeSocketMessage(payload.conversationId, payload.message);

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === payload.conversationId);
        const updated: Conversation = existing
          ? {
              ...existing,
              lastMessagePreview: incoming.content,
              lastMessageSender: incoming.sender,
              lastMessageAt: incoming.sentAt,
              unread: selectedId !== payload.conversationId,
            }
          : {
              id: payload.conversationId,
              customerPhone: '',
              customerName: null,
              status: 'active',
              intent: 'unknown',
              leadStage: 'new',
              budgetMin: null,
              budgetMax: null,
              preferredType: null,
              preferredArea: null,
              languagePref: 'english',
              leadScore: 0,
              humanOverride: false,
              aiPaused: false,
              followupCount: 0,
              followupCapped: false,
              isReturning: false,
              callbackRequested: false,
              callbackRequestedTime: null,
              voiceNoteReceived: false,
              optedOut: false,
              isNri: false,
              assignedTo: null,
              brokerNotes: null,
              lastBrokerRead: null,
              firstMessageAt: incoming.sentAt,
              lastMessageAt: incoming.sentAt,
              createdAt: incoming.sentAt,
              lastMessagePreview: incoming.content,
              lastMessageSender: incoming.sender,
              unread: selectedId !== payload.conversationId,
            };

        if (selectedId !== payload.conversationId && existing?.unread === false) {
          setUnreadCount((c) => c + 1);
        }

        return mergeConversation(prev, updated);
      });

      if (selectedId === payload.conversationId) {
        setMessages((prev) => {
          if (incoming.id && prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming];
        });
      }
    },
    [selectedId]
  );

  const handleConversationUpdate = useCallback(
    (data: unknown) => {
      const payload = data as RealtimeConversationUpdate;
      if (!payload.conversation?.id) return;
      setConversations((prev) => mergeConversation(prev, payload.conversation));
    },
    []
  );

  const handleEscalation = useCallback(
    (data: unknown) => {
      const payload = data as RealtimeEscalation;
      if (!payload.conversationId || !accessToken) return;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId
            ? { ...c, aiPaused: true, leadStage: c.leadStage === 'ultra_hot' ? 'ultra_hot' : c.leadStage }
            : c
        )
      );

      if (selectedId === payload.conversationId) {
        void loadConversationDetail(payload.conversationId);
      }
    },
    [accessToken, selectedId, loadConversationDetail]
  );

  const handleMeetingBooked = useCallback(
    (data: unknown) => {
      const payload = data as { meetingId?: string; conversationId?: string };
      const conversationId = payload.conversationId;
      if (!conversationId) return;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, leadStage: 'meeting_booked' as const } : c
        )
      );

      if (selectedId === conversationId) {
        void loadConversationDetail(conversationId);
      }
    },
    [selectedId, loadConversationDetail]
  );

  const handleHumanOverride = useCallback(
    (data: unknown) => {
      const payload = data as RealtimeHumanOverride;
      if (!payload.conversationId) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== payload.conversationId) return c;
          const unread = selectedId !== payload.conversationId;
          if (unread && !c.unread) {
            setUnreadCount((count) => count + 1);
          }
          return { ...c, humanOverride: true, unread };
        })
      );
    },
    [selectedId]
  );

  useRealtime(accessToken, {
    onNewMessage: handleNewMessage,
    onConversationUpdate: handleConversationUpdate,
    onEscalation: handleEscalation,
    onMeetingBooked: handleMeetingBooked,
    onHumanOverride: handleHumanOverride,
  });

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setMobileView('chat');
  };

  const handleTakeOver = async () => {
    if (!accessToken || !selectedId) return;
    try {
      const result = await updateConversation(accessToken, selectedId, { humanOverride: true });
      setConversations((prev) => mergeConversation(prev, result.conversation));
    } catch (err) {
      setChatError(getErrorMessage(err));
    }
  };

  const handleHandBackToAi = async () => {
    if (!accessToken || !selectedId) return;
    try {
      const result = await updateConversation(accessToken, selectedId, { humanOverride: false });
      setConversations((prev) => mergeConversation(prev, result.conversation));
    } catch (err) {
      setChatError(getErrorMessage(err));
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!accessToken || !selectedId) return;
    setSending(true);
    setChatError(null);
    try {
      const result = await sendConversationMessage(accessToken, selectedId, content);
      setMessages((prev) => [...prev, result.message]);
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === selectedId);
        if (!existing) return prev;
        return mergeConversation(prev, {
          ...existing,
          lastMessagePreview: result.message.content,
          lastMessageSender: 'broker',
          lastMessageAt: result.message.sentAt,
          unread: false,
        });
      });
    } catch (err) {
      setChatError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!accessToken || !selectedId) return;
    setSavingNotes(true);
    try {
      const result = await updateConversation(accessToken, selectedId, { brokerNotes: notes });
      setConversations((prev) => mergeConversation(prev, result.conversation));
    } catch (err) {
      setChatError(getErrorMessage(err));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkUltraHot = async () => {
    if (!accessToken || !selectedId) return;
    try {
      const result = await updateConversation(accessToken, selectedId, {
        leadStage: 'ultra_hot',
        aiPaused: true,
      });
      setConversations((prev) => mergeConversation(prev, result.conversation));
    } catch (err) {
      setChatError(getErrorMessage(err));
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted">
        Please log in to view chats.
      </div>
    );
  }

  const showList = mobileView === 'list';
  const showChat = mobileView === 'chat';
  const showProfile = mobileView === 'profile';

  return (
    <div className="-mx-8 -mt-7 -mb-28 flex h-[calc(100dvh-7rem)] min-h-0 overflow-hidden lg:-mb-8 lg:h-[calc(100dvh-3.5rem)]">
      {/* Column 1 — conversation list */}
      <div
        className={cn(
          'h-full min-h-0 shrink-0',
          showList ? 'flex w-full lg:w-[300px]' : 'hidden lg:flex lg:w-[300px]'
        )}
      >
        <ConversationList
          conversations={filteredConversations}
          selectedId={selectedId}
          activeTab={activeTab}
          searchQuery={searchQuery}
          unreadCount={unreadCount}
          loading={listLoading}
          error={listError}
          onSelect={handleSelectConversation}
          onTabChange={setActiveTab}
          onSearchChange={setSearchQuery}
          onRetry={() => void loadConversations()}
        />
      </div>

      {/* Column 2 — message thread */}
      <div
        className={cn(
          'min-h-0 min-w-0 flex-1',
          showChat ? 'flex' : 'hidden xl:flex'
        )}
      >
        <ChatPanel
          conversation={selectedConversation}
          messages={messages}
          loading={chatLoading}
          error={chatError}
          sending={sending}
          showBackButton
          onBack={() => {
            setMobileView('list');
            setSelectedId(null);
          }}
          onOpenProfile={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches) {
              setShowProfileDesktop((v) => !v);
            } else {
              setMobileView('profile');
            }
          }}
          onTakeOver={() => void handleTakeOver()}
          onHandBackToAi={() => void handleHandBackToAi()}
          onSendMessage={(content) => void handleSendMessage(content)}
          onRetry={() => selectedId && void loadConversationDetail(selectedId)}
        />
      </div>

      {showProfile && (
        <button
          type="button"
          aria-label="Close profile"
          className="fixed inset-0 z-10 bg-black/10 backdrop-blur-[1px] xl:hidden"
          onClick={() => setMobileView('chat')}
        />
      )}

      {/* Column 3 — lead profile */}
      <div
        className={cn(
          'fixed inset-0 z-20 bg-white xl:static xl:z-auto xl:flex',
          showProfile ? 'flex' : 'hidden',
          showProfileDesktop ? 'xl:flex' : 'xl:hidden'
        )}
      >
        <ProfilePanel
          conversation={selectedConversation}
          escalations={escalations}
          country={tenant?.country ?? 'IN'}
          loading={chatLoading && !!selectedId}
          savingNotes={savingNotes}
          onClose={() => setMobileView('chat')}
          onUpdateNotes={(notes) => void handleUpdateNotes(notes)}
          onMarkUltraHot={() => void handleMarkUltraHot()}
        />
      </div>
    </div>
  );
}
