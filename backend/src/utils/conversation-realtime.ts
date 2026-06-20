import { pool } from '../db';
import { getIo } from '../realtime/io-holder';

type ConversationEmitRow = {
  id: string;
  tenant_id: string;
  customer_phone: string;
  customer_name: string | null;
  status: string;
  intent: string;
  lead_stage: string;
  budget_min: string | null;
  budget_max: string | null;
  preferred_type: string | null;
  preferred_area: string | null;
  language_pref: string;
  lead_score: number;
  human_override: boolean;
  ai_paused: boolean;
  followup_count: number;
  followup_capped: boolean;
  is_returning: boolean;
  callback_requested: boolean;
  callback_requested_time: Date | null;
  voice_note_received: boolean;
  opted_out: boolean;
  is_nri: boolean;
  assigned_to: string | null;
  broker_notes: string | null;
  last_broker_read: Date | null;
  first_message_at: Date;
  last_message_at: Date;
  created_at: Date;
  last_message_content?: string | null;
  last_message_sender?: string | null;
};

function mapConversationForEmit(row: ConversationEmitRow) {
  const unread =
    row.last_broker_read === null || row.last_message_at > row.last_broker_read;

  return {
    id: row.id,
    customerPhone: row.customer_phone,
    customerName: row.customer_name,
    status: row.status,
    intent: row.intent,
    leadStage: row.lead_stage,
    budgetMin: row.budget_min ? Number(row.budget_min) : null,
    budgetMax: row.budget_max ? Number(row.budget_max) : null,
    preferredType: row.preferred_type,
    preferredArea: row.preferred_area,
    languagePref: row.language_pref,
    leadScore: row.lead_score,
    humanOverride: row.human_override,
    aiPaused: row.ai_paused,
    followupCount: row.followup_count,
    followupCapped: row.followup_capped,
    isReturning: row.is_returning,
    callbackRequested: row.callback_requested,
    callbackRequestedTime: row.callback_requested_time,
    voiceNoteReceived: row.voice_note_received,
    optedOut: row.opted_out,
    isNri: row.is_nri,
    assignedTo: row.assigned_to,
    brokerNotes: row.broker_notes,
    lastBrokerRead: row.last_broker_read,
    firstMessageAt: row.first_message_at,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    lastMessagePreview: row.last_message_content ?? null,
    lastMessageSender: row.last_message_sender ?? null,
    unread,
  };
}

export function emitToTenant(tenantId: string, event: string, payload: unknown): void {
  const io = getIo();
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, payload);
  }
}

export async function fetchConversationForEmit(
  conversationId: string,
  tenantId: string
): Promise<ReturnType<typeof mapConversationForEmit> | null> {
  const result = await pool.query<ConversationEmitRow>(
    `SELECT c.*,
            lm.content AS last_message_content,
            lm.sender AS last_message_sender
     FROM conversations c
     LEFT JOIN LATERAL (
       SELECT content, sender
       FROM messages
       WHERE conversation_id = c.id
       ORDER BY sent_at DESC
       LIMIT 1
     ) lm ON true
     WHERE c.id = $1 AND c.tenant_id = $2`,
    [conversationId, tenantId]
  );

  const row = result.rows[0];
  return row ? mapConversationForEmit(row) : null;
}

export async function emitConversationUpdate(
  conversationId: string,
  tenantId: string
): Promise<void> {
  const conversation = await fetchConversationForEmit(conversationId, tenantId);
  if (!conversation) return;
  emitToTenant(tenantId, 'conversation_update', { conversation });
}
