'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  LayoutGrid,
  List,
  MessageSquare,
  Phone,
  Search,
  Star,
} from 'lucide-react';
import { LeadDetail } from '@/components/leads/LeadDetail';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import {
  type ApiError,
  type Conversation,
  type Escalation,
  type LeadStage,
  type Message,
  getConversation,
  listConversations,
  updateConversation,
  updateConversationStage,
} from '@/lib/api';
import {
  buildCustomerTags,
  formatBudget,
  formatRelativeTime,
  mergeConversation,
} from '@/lib/chats-utils';
import { LEAD_COLUMNS, groupByStage, stageLabel } from '@/lib/leads-utils';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'list';
type SortKey = 'name' | 'score' | 'stage' | 'lastActive';
type SortDir = 'asc' | 'desc';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    return (err as ApiError).error;
  }
  return 'Something went wrong';
}

function LeadKanbanCard({
  conversation,
  country,
  columnBorderClass,
  onOpen,
  onDragStart,
}: {
  conversation: Conversation;
  country: string;
  columnBorderClass?: string;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const name = conversation.customerName ?? conversation.customerPhone;
  const tags = buildCustomerTags(conversation).slice(0, 3);
  const isUltraHot = conversation.leadStage === 'ultra_hot';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className={cn(
        'group cursor-grab rounded-[var(--radius-lg)] border border-border bg-surface p-3 shadow-[var(--shadow-sm)] transition-shadow active:cursor-grabbing hover:shadow-[var(--shadow-md)]',
        columnBorderClass
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="truncate text-sm font-semibold text-foreground">{name}</span>
        {isUltraHot && <Star className="h-3.5 w-3.5 shrink-0 fill-orange text-orange" />}
      </div>
      <p className="text-xs font-medium text-primary">
        {formatBudget(conversation.budgetMin, conversation.budgetMax, country)}
      </p>
      {conversation.preferredArea && (
        <p className="mt-0.5 truncate text-xs text-muted">{conversation.preferredArea}</p>
      )}
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} className="normal-case">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted">
          {formatRelativeTime(conversation.lastMessageAt)}
        </span>
        <span className="text-[10px] font-semibold text-muted">Score {conversation.leadScore}</span>
      </div>
      <div
        className="mt-2 hidden gap-1 border-t border-border pt-2 group-hover:flex"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={`tel:${conversation.customerPhone}`}
          className="inline-flex h-7 flex-1 items-center justify-center rounded border border-border text-[10px] font-semibold hover:bg-surface-2"
          title="Call"
        >
          <Phone className="h-3 w-3" />
        </a>
        <Link
          href={`/chats?conversation=${conversation.id}`}
          className="inline-flex h-7 flex-1 items-center justify-center rounded border border-border text-[10px] font-semibold hover:bg-surface-2"
          title="Chat"
        >
          <MessageSquare className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const router = useRouter();
  const { accessToken, tenant, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<LeadStage | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [savingNotes, setSavingNotes] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const country = tenant?.country ?? 'IN';

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.customerName?.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        c.preferredArea?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => groupByStage(filteredConversations), [filteredConversations]);

  const sortedList = useMemo(() => {
    const list = [...filteredConversations];
    const dir = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return (
            dir *
            (a.customerName ?? a.customerPhone).localeCompare(
              b.customerName ?? b.customerPhone
            )
          );
        case 'stage':
          return dir * a.leadStage.localeCompare(b.leadStage);
        case 'lastActive':
          return (
            dir *
            (new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime())
          );
        case 'score':
        default:
          return dir * (a.leadScore - b.leadScore);
      }
    });
    return list;
  }, [filteredConversations, sortKey, sortDir]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const loadLeads = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listConversations(accessToken, { limit: 500 });
      setConversations(result.conversations);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadDetail = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      setDetailLoading(true);
      try {
        const data = await getConversation(accessToken, id);
        setMessages(data.messages);
        setEscalations(data.escalations);
        setConversations((prev) => mergeConversation(prev, data.conversation));
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setDetailLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    void loadLeads();
  }, [accessToken, authLoading, router, loadLeads]);

  useEffect(() => {
    if (selectedId && accessToken) {
      void loadDetail(selectedId);
    } else {
      setMessages([]);
      setEscalations([]);
    }
  }, [selectedId, accessToken, loadDetail]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handleChange = () => {
      if (mq.matches) setViewMode('list');
    };
    handleChange();
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const handleDrop = async (stage: LeadStage) => {
    if (!accessToken || !draggingId) return;
    const conv = conversations.find((c) => c.id === draggingId);
    if (!conv || conv.leadStage === stage) {
      setDraggingId(null);
      setDropTarget(null);
      return;
    }

    const prevStage = conv.leadStage;
    setConversations((prev) =>
      prev.map((c) => (c.id === draggingId ? { ...c, leadStage: stage } : c))
    );
    setDraggingId(null);
    setDropTarget(null);

    try {
      const result = await updateConversationStage(accessToken, draggingId, stage);
      setConversations((prev) => mergeConversation(prev, result.conversation));
    } catch (err) {
      setConversations((prev) =>
        prev.map((c) => (c.id === draggingId ? { ...c, leadStage: prevStage } : c))
      );
      setError(getErrorMessage(err));
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    if (!accessToken || !selectedId) return;
    setSavingNotes(true);
    try {
      const result = await updateConversation(accessToken, selectedId, { brokerNotes: notes });
      setConversations((prev) => mergeConversation(prev, result.conversation));
    } catch (err) {
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'stage' ? 'asc' : 'desc');
    }
  };

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => (
    <button
      type="button"
      onClick={() => toggleSort(col)}
      className="inline-flex items-center gap-1 font-semibold hover:text-primary"
    >
      {label}
      {sortKey === col ? (
        sortDir === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );

  if (authLoading || !accessToken) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl animate-fade-in flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted">
            Drag cards between stages or open a lead for full history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden rounded-lg border border-border p-0.5 md:flex">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold',
                viewMode === 'kanban'
                  ? 'bg-primary-light text-primary'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold',
                viewMode === 'list'
                  ? 'bg-primary-light text-primary'
                  : 'text-muted hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search by name or phone…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {error && (
        <Alert variant="error">
          {error}{' '}
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => void loadLeads()}>
            Retry
          </Button>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <EmptyState
            icon={LayoutGrid}
            title="No leads yet"
            description="When buyers message Arjun on WhatsApp, they appear here as CRM leads."
          />
        </Card>
      ) : viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-3">
            {LEAD_COLUMNS.map((col) => {
              const items = grouped[col.stage];
              return (
                <div
                  key={col.stage}
                  className={cn(
                    'flex w-64 shrink-0 flex-col rounded-xl border border-border bg-surface-2',
                    dropTarget === col.stage && 'ring-2 ring-primary'
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTarget(col.stage);
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleDrop(col.stage);
                  }}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-t-xl border-b border-border px-3 py-2',
                      col.headerClass ?? 'bg-surface'
                    )}
                  >
                    <span className="text-xs font-bold uppercase tracking-wide">{col.label}</span>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-muted">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex max-h-[calc(100vh-280px)] flex-col gap-2 overflow-y-auto p-2">
                    {items.map((conv) => (
                      <LeadKanbanCard
                        key={conv.id}
                        conversation={conv}
                        country={country}
                        columnBorderClass={col.cardBorderClass}
                        onOpen={() => setSelectedId(conv.id)}
                        onDragStart={(e) => {
                          setDraggingId(conv.id);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', conv.id);
                        }}
                      />
                    ))}
                    {items.length === 0 && (
                      <p className="py-6 text-center text-xs text-muted">Drop leads here</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card padding="sm" className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-3 py-3">
                  <SortHeader label="Name" col="name" />
                </th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Budget</th>
                <th className="px-3 py-3">Area</th>
                <th className="px-3 py-3">
                  <SortHeader label="Stage" col="stage" />
                </th>
                <th className="px-3 py-3">
                  <SortHeader label="Score" col="score" />
                </th>
                <th className="px-3 py-3">
                  <SortHeader label="Last Active" col="lastActive" />
                </th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedList.map((conv) => (
                <tr
                  key={conv.id}
                  className="cursor-pointer border-b border-border/60 hover:bg-surface-2"
                  onClick={() => setSelectedId(conv.id)}
                >
                  <td className="px-3 py-3 font-medium">
                    {conv.customerName ?? 'Unknown'}
                  </td>
                  <td className="px-3 py-3 text-muted">{conv.customerPhone}</td>
                  <td className="px-3 py-3">
                    {formatBudget(conv.budgetMin, conv.budgetMax, country)}
                  </td>
                  <td className="px-3 py-3 text-muted">{conv.preferredArea ?? '—'}</td>
                  <td className="px-3 py-3">
                    <Badge>{stageLabel(conv.leadStage)}</Badge>
                  </td>
                  <td className="px-3 py-3 font-semibold">{conv.leadScore}</td>
                  <td className="px-3 py-3 text-muted">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <a
                        href={`tel:${conv.customerPhone}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-surface-2"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <Link
                        href={`/chats?conversation=${conv.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-border hover:bg-surface-2"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <LeadDetail
        open={!!selectedId}
        conversation={selectedConversation}
        messages={messages}
        escalations={escalations}
        country={country}
        loading={detailLoading}
        savingNotes={savingNotes}
        onClose={() => setSelectedId(null)}
        onUpdateNotes={(notes) => void handleUpdateNotes(notes)}
        onMarkUltraHot={() => void handleMarkUltraHot()}
      />
    </div>
  );
}
