import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendWhatsAppMessage } from '../services/whatsapp.service';
import {
  emitToTenant,
  emitConversationUpdate,
} from '../utils/conversation-realtime';
import {
  conversationListQuerySchema,
  conversationUpdateSchema,
  conversationStageSchema,
  conversationSendSchema,
  conversationMessagesQuerySchema,
} from '../utils/validators';

const router = Router();

router.use(requireAuth);

type ConversationRow = {
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
  message_count?: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  tenant_id: string;
  direction: string;
  sender: string;
  content: string;
  media_type: string;
  media_url: string | null;
  whatsapp_msg_id: string | null;
  ai_model_used: string | null;
  ai_confidence: string | null;
  status: string;
  sent_at: Date;
};

type EscalationRow = {
  id: string;
  tenant_id: string;
  conversation_id: string | null;
  escalation_type: string;
  triggered_at: Date;
  owner_notified_at: Date | null;
  resolved: boolean;
  notes: string | null;
};

function mapConversation(row: ConversationRow) {
  const unread =
    row.last_broker_read === null ||
    row.last_message_at > row.last_broker_read;

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
    messageCount: row.message_count ? Number(row.message_count) : undefined,
    unread,
  };
}

function mapMessage(row: MessageRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction,
    sender: row.sender,
    content: row.content,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    whatsappMsgId: row.whatsapp_msg_id,
    aiModelUsed: row.ai_model_used,
    aiConfidence: row.ai_confidence ? Number(row.ai_confidence) : null,
    status: row.status,
    sentAt: row.sent_at,
  };
}

function mapEscalation(row: EscalationRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    escalationType: row.escalation_type,
    triggeredAt: row.triggered_at,
    ownerNotifiedAt: row.owner_notified_at,
    resolved: row.resolved,
    notes: row.notes,
  };
}

async function getUnreadCount(tenantId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM conversations
     WHERE tenant_id = $1
       AND (last_broker_read IS NULL OR last_message_at > last_broker_read)`,
    [tenantId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function getOverdueCallbacksCount(tenantId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM callbacks
     WHERE tenant_id = $1 AND status = 'overdue'`,
    [tenantId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = conversationListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' });
    return;
  }

  const { status, intent, search, limit, offset, count } = parsed.data;

  try {
    const conditions = ['c.tenant_id = $1'];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }
    if (intent) {
      conditions.push(`c.intent = $${paramIndex++}`);
      params.push(intent);
    }
    if (search?.trim()) {
      conditions.push(
        `(c.customer_name ILIKE $${paramIndex} OR c.customer_phone ILIKE $${paramIndex})`
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (count && limit === 0) {
      const [unreadCount, overdueCallbacks] = await Promise.all([
        getUnreadCount(tenantId),
        getOverdueCallbacksCount(tenantId),
      ]);
      res.json({ unreadCount, overdueCallbacks });
      return;
    }

    params.push(limit, offset);

    const result = await pool.query<ConversationRow>(
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
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.last_message_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    const response: Record<string, unknown> = {
      conversations: result.rows.map(mapConversation),
    };

    if (count) {
      const [unreadCount, overdueCallbacks] = await Promise.all([
        getUnreadCount(tenantId),
        getOverdueCallbacksCount(tenantId),
      ]);
      response.unreadCount = unreadCount;
      response.overdueCallbacks = overdueCallbacks;
    }

    res.json(response);
  } catch (error) {
    console.error('List conversations failed:', error);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.get('/:id/messages', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = conversationMessagesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' });
    return;
  }

  const { before, limit } = parsed.data;

  try {
    const convCheck = await pool.query(
      `SELECT id FROM conversations WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!convCheck.rows[0]) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const conditions = ['conversation_id = $1', 'tenant_id = $2'];
    const params: unknown[] = [req.params.id, tenantId];
    let paramIndex = 3;

    if (before) {
      conditions.push(`sent_at < $${paramIndex++}`);
      params.push(new Date(before));
    }

    params.push(limit);

    const result = await pool.query<MessageRow>(
      `SELECT *
       FROM messages
       WHERE ${conditions.join(' AND ')}
       ORDER BY sent_at DESC
       LIMIT $${paramIndex}`,
      params
    );

    res.json({
      messages: result.rows.reverse().map(mapMessage),
      hasMore: result.rows.length === limit,
    });
  } catch (error) {
    console.error('List messages failed:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.patch('/:id/stage', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = conversationStageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  try {
    const result = await pool.query<ConversationRow>(
      `UPDATE conversations
       SET lead_stage = $3
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [req.params.id, tenantId, parsed.data.leadStage]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const conversationId = String(req.params.id);
    await emitConversationUpdate(conversationId, tenantId);

    res.json({ conversation: mapConversation(result.rows[0]) });
  } catch (error) {
    console.error('Update conversation stage failed:', error);
    res.status(500).json({ error: 'Failed to update lead stage' });
  }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query<ConversationRow>(
      `UPDATE conversations
       SET last_broker_read = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      [req.params.id, tenantId]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    res.json({ conversation: mapConversation(result.rows[0]) });
  } catch (error) {
    console.error('Mark conversation read failed:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

router.post('/:id/send', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = conversationSendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const convResult = await client.query<ConversationRow>(
      `SELECT * FROM conversations WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
      [req.params.id, tenantId]
    );

    const conversation = convResult.rows[0];
    if (!conversation) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (!conversation.human_override) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'Human override required to send messages' });
      return;
    }

    const settingsResult = await client.query<{
      meta_phone_number_id: string | null;
      meta_access_token: string | null;
    }>(
      `SELECT meta_phone_number_id, meta_access_token
       FROM broker_settings
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const settings = settingsResult.rows[0];
    if (!settings?.meta_phone_number_id || !settings.meta_access_token) {
      await client.query('ROLLBACK');
      res.status(502).json({
        error:
          'WhatsApp credentials missing. Open Settings → WhatsApp and save Phone Number ID plus access token.',
      });
      return;
    }

    const sendResult = await sendWhatsAppMessage({
      phoneNumberId: settings.meta_phone_number_id,
      accessToken: settings.meta_access_token,
      to: conversation.customer_phone,
      text: parsed.data.content.trim(),
    });

    if (!sendResult.success) {
      await client.query('ROLLBACK');
      res.status(502).json({ error: sendResult.error ?? 'Failed to send WhatsApp message' });
      return;
    }

    const messageResult = await client.query<MessageRow>(
      `INSERT INTO messages (
         conversation_id, tenant_id, direction, sender, content,
         media_type, whatsapp_msg_id, status
       ) VALUES ($1, $2, 'outbound', 'broker', $3, 'text', $4, 'sent')
       RETURNING *`,
      [req.params.id, tenantId, parsed.data.content.trim(), sendResult.whatsappMsgId]
    );

    await client.query(
      `UPDATE conversations
       SET last_message_at = NOW(), last_broker_read = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, tenantId]
    );

    await client.query('COMMIT');

    const mappedMessage = mapMessage(messageResult.rows[0]);

    const conversationId = String(req.params.id);

    emitToTenant(tenantId, 'new_message', {
      conversationId,
      message: {
        id: mappedMessage.id,
        direction: mappedMessage.direction,
        sender: mappedMessage.sender,
        content: mappedMessage.content,
        mediaType: mappedMessage.mediaType,
        status: mappedMessage.status,
        sentAt: mappedMessage.sentAt,
      },
    });
    await emitConversationUpdate(conversationId, tenantId);

    res.status(201).json({ message: mappedMessage });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Send broker message failed:', error);
    res.status(500).json({ error: 'Failed to send message' });
  } finally {
    client.release();
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const convResult = await pool.query<ConversationRow>(
      `SELECT c.*,
              (SELECT COUNT(*)::text FROM messages m WHERE m.conversation_id = c.id) AS message_count
       FROM conversations c
       WHERE c.id = $1 AND c.tenant_id = $2`,
      [req.params.id, tenantId]
    );

    const conversation = convResult.rows[0];
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const [messagesResult, escalationsResult] = await Promise.all([
      pool.query<MessageRow>(
        `SELECT *
         FROM messages
         WHERE conversation_id = $1 AND tenant_id = $2
         ORDER BY sent_at DESC
         LIMIT 50`,
        [req.params.id, tenantId]
      ),
      pool.query<EscalationRow>(
        `SELECT *
         FROM lead_escalations
         WHERE conversation_id = $1 AND tenant_id = $2
         ORDER BY triggered_at DESC`,
        [req.params.id, tenantId]
      ),
    ]);

    res.json({
      conversation: mapConversation(conversation),
      messages: messagesResult.rows.reverse().map(mapMessage),
      escalations: escalationsResult.rows.map(mapEscalation),
    });
  } catch (error) {
    console.error('Get conversation failed:', error);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = conversationUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;
  const fields: string[] = [];
  const values: unknown[] = [req.params.id, tenantId];
  let idx = 3;

  const mapping: Record<string, unknown> = {
    human_override: data.humanOverride,
    ai_paused: data.aiPaused,
    lead_stage: data.leadStage,
    customer_name: data.customerName?.trim(),
    broker_notes: data.brokerNotes,
    assigned_to: data.assignedTo,
  };

  for (const [column, value] of Object.entries(mapping)) {
    if (value !== undefined) {
      fields.push(`${column} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  if (data.assignedTo) {
    const memberCheck = await pool.query(
      `SELECT id FROM team_members WHERE id = $1 AND tenant_id = $2`,
      [data.assignedTo, tenantId]
    );
    if (!memberCheck.rows[0]) {
      res.status(400).json({ error: 'Assigned team member not found' });
      return;
    }
  }

  try {
    const result = await pool.query<ConversationRow>(
      `UPDATE conversations SET ${fields.join(', ')}
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const conversationId = String(req.params.id);
    await emitConversationUpdate(conversationId, tenantId);

    res.json({ conversation: mapConversation(result.rows[0]) });
  } catch (error) {
    console.error('Update conversation failed:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

export default router;
