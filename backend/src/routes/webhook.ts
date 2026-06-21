import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db';
import {
  emitToTenant,
  emitConversationUpdate,
} from '../utils/conversation-realtime';
import { sendWhatsAppMessage, downloadWhatsAppMedia } from '../services/whatsapp.service';
import {
  buildSystemPrompt,
  getAIResponse,
  type VisionAttachment,
} from '../services/ai.service';
import {
  appendConversationStory,
  buildConversationHistory,
  buildTenantPromptContext,
} from '../services/promptContext.service';

const router = Router();

type RawBodyRequest = Request & { rawBody?: Buffer };

type ConversationRow = {
  id: string;
  tenant_id: string;
  customer_phone: string;
  customer_name: string | null;
  human_override: boolean;
  ai_paused: boolean;
  followup_count: number;
  followup_capped: boolean;
  language_pref: string;
  opted_out: boolean;
};

type TenantContext = {
  tenant_id: string;
  business_name: string;
  owner_name: string;
  country: string;
  meta_access_token: string;
  ai_name: string;
  office_address: string | null;
  office_maps_link: string | null;
  language_default: string;
  ai_followup_count: number;
  no_msg_after_hour: number;
};

type PlanContext = {
  can_use_ai: boolean;
  ai_messages_used: number;
  ai_message_limit: number;
  is_suspended: boolean;
  is_blocked: boolean;
};

const STOP_PATTERN = /^(stop|unsubscribe|opt[\s-]?out)$/i;
const ESCALATION_FLAGS = [
  'ULTRA_HOT',
  'LOW_BUDGET_ESCALATION',
  'LOW_BUDGET',
  'NEGOTIATION',
  'LOAN_QUESTION',
  'NRI',
] as const;

function detectLanguage(text: string): 'english' | 'hinglish' | 'devanagari' | 'arabic' | 'french' {
  if (/[\u0600-\u06FF]/.test(text)) return 'arabic';
  if (/[\u0900-\u097F]/.test(text)) return 'devanagari';
  if (/\b(kya|hai|chahiye|bhai|yaar|dekh|kar|nahi|mujhe|kaunsa|bilkul)\b/i.test(text)) {
    return 'hinglish';
  }
  if (/\b(bonjour|merci|cherche|appartement|maison)\b/i.test(text)) return 'french';
  return 'english';
}

function languagePrefFromDetection(
  detected: ReturnType<typeof detectLanguage>
): string {
  if (detected === 'devanagari' || detected === 'hinglish') return 'hinglish';
  if (detected === 'arabic') return 'arabic';
  if (detected === 'french') return 'french';
  return 'english';
}

function verifyMetaSignature(req: RawBodyRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;

  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appSecret) {
    console.warn(
      'META_APP_SECRET not set — accepting webhook without signature verification. Add App Secret from Meta Developer Console to Render env.'
    );
    return true;
  }

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature || !req.rawBody) {
    console.error('Webhook missing signature or raw body');
    return false;
  }

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function stripEscalationFlags(text: string): string {
  let cleaned = text;
  for (const flag of ESCALATION_FLAGS) {
    cleaned = cleaned.replace(new RegExp(flag, 'gi'), '').trim();
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

function detectEscalationType(text: string): string | null {
  const upper = text.toUpperCase();
  if (upper.includes('ULTRA_HOT')) return 'ultra_hot';
  if (upper.includes('LOW_BUDGET_ESCALATION') || upper.includes('LOW_BUDGET')) {
    return 'low_budget';
  }
  if (upper.includes('NEGOTIATION')) return 'negotiation';
  if (upper.includes('LOAN_QUESTION')) return 'loan_question';
  if (upper.includes('NRI')) return 'nri';
  return null;
}

async function fetchTenantByPhoneNumberId(
  phoneNumberId: string
): Promise<(TenantContext & { meta_phone_number_id: string }) | null> {
  const result = await pool.query<TenantContext & { meta_phone_number_id: string }>(
    `SELECT
       bs.tenant_id,
       t.business_name,
       t.owner_name,
       t.country,
       bs.meta_access_token,
       bs.meta_phone_number_id,
       COALESCE(bs.ai_name, 'Arjun') AS ai_name,
       bs.office_address,
       bs.office_maps_link,
       COALESCE(bs.language_default, 'english') AS language_default,
       COALESCE(bs.ai_followup_count, 2) AS ai_followup_count,
       COALESCE(bs.no_msg_after_hour, 21) AS no_msg_after_hour
     FROM broker_settings bs
     JOIN tenants t ON t.id = bs.tenant_id
     WHERE bs.meta_phone_number_id = $1
     LIMIT 1`,
    [phoneNumberId]
  );

  return result.rows[0] ?? null;
}

async function fetchPlan(tenantId: string): Promise<PlanContext | null> {
  const result = await pool.query<PlanContext>(
    `SELECT
       COALESCE(can_use_ai, true) AS can_use_ai,
       COALESCE(ai_messages_used, 0) AS ai_messages_used,
       COALESCE(ai_message_limit, 100) AS ai_message_limit,
       COALESCE(is_suspended, false) AS is_suspended,
       COALESCE(is_blocked, false) AS is_blocked
     FROM client_plans
     WHERE tenant_id = $1`,
    [tenantId]
  );

  return result.rows[0] ?? null;
}

async function upsertConversation(
  tenantId: string,
  customerPhone: string,
  customerName: string | null
): Promise<ConversationRow> {
  const result = await pool.query<ConversationRow>(
    `INSERT INTO conversations (tenant_id, customer_phone, customer_name, last_message_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (tenant_id, customer_phone)
     DO UPDATE SET
       last_message_at = NOW(),
       customer_name = COALESCE(EXCLUDED.customer_name, conversations.customer_name)
     RETURNING *`,
    [tenantId, customerPhone, customerName]
  );

  return result.rows[0];
}

async function storeInboundMessage(params: {
  conversationId: string;
  tenantId: string;
  content: string;
  mediaType: string;
  whatsappMsgId: string;
  mediaUrl?: string | null;
}): Promise<{ id: string; sentAt: string } | null> {
  try {
    const result = await pool.query<{ id: string; sent_at: Date }>(
      `INSERT INTO messages
         (conversation_id, tenant_id, direction, sender, content, media_type, media_url, whatsapp_msg_id)
       VALUES ($1, $2, 'inbound', 'customer', $3, $4, $5, $6)
       RETURNING id, sent_at`,
      [
        params.conversationId,
        params.tenantId,
        params.content,
        params.mediaType,
        params.mediaUrl ?? null,
        params.whatsappMsgId,
      ]
    );
    return {
      id: result.rows[0].id,
      sentAt: result.rows[0].sent_at.toISOString(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    ) {
      return null;
    }
    throw error;
  }
}

const AI_FAILURE_FALLBACK =
  'Thanks for reaching out — let me get back to you shortly.';

async function storeOutboundMessage(params: {
  conversationId: string;
  tenantId: string;
  content: string;
  aiModelUsed?: string;
  status?: 'sent' | 'failed';
  whatsappMsgId?: string | null;
}): Promise<{ id: string; sentAt: string }> {
  const result = await pool.query<{ id: string; sent_at: Date }>(
    `INSERT INTO messages
       (conversation_id, tenant_id, direction, sender, content, media_type,
        ai_model_used, status, whatsapp_msg_id)
     VALUES ($1, $2, 'outbound', 'ai', $3, 'text', $4, $5, $6)
     RETURNING id, sent_at`,
    [
      params.conversationId,
      params.tenantId,
      params.content,
      params.aiModelUsed ?? null,
      params.status ?? 'sent',
      params.whatsappMsgId ?? null,
    ]
  );
  return {
    id: result.rows[0].id,
    sentAt: result.rows[0].sent_at.toISOString(),
  };
}

async function logAiFailure(
  tenantId: string,
  conversationId: string,
  error: unknown
): Promise<void> {
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown AI provider error';
  try {
    await pool.query(
      `INSERT INTO ai_failures (tenant_id, conversation_id, error_message)
       VALUES ($1, $2, $3)`,
      [tenantId, conversationId, errorMessage]
    );
  } catch (logError) {
    console.error('Failed to persist ai_failures row:', logError);
  }
}

async function sendOutboundAndStore(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  text: string;
  conversationId: string;
  tenantId: string;
  aiModelUsed?: string;
  updateLastMessageAt?: boolean;
}): Promise<{ messageId: string; delivered: boolean; sentAt: string }> {
  const sendResult = await sendWhatsAppMessage({
    phoneNumberId: params.phoneNumberId,
    accessToken: params.accessToken,
    to: params.to,
    text: params.text,
  });

  const status = sendResult.success ? 'sent' : 'failed';
  if (!sendResult.success) {
    console.error('WhatsApp outbound delivery failed:', {
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      error: sendResult.error,
    });
  }

  const stored = await storeOutboundMessage({
    conversationId: params.conversationId,
    tenantId: params.tenantId,
    content: params.text,
    aiModelUsed: params.aiModelUsed,
    status,
    whatsappMsgId: sendResult.whatsappMsgId,
  });

  if (params.updateLastMessageAt !== false) {
    await pool.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = $1 AND tenant_id = $2`,
      [params.conversationId, params.tenantId]
    );
  }

  emitToTenant(params.tenantId, 'new_message', {
    conversationId: params.conversationId,
    message: {
      id: stored.id,
      direction: 'outbound',
      sender: 'ai',
      content: params.text,
      mediaType: 'text',
      status,
      sentAt: stored.sentAt,
      aiModelUsed: params.aiModelUsed ?? null,
    },
  });

  await emitConversationUpdate(params.conversationId, params.tenantId);

  return {
    messageId: stored.id,
    delivered: sendResult.success,
    sentAt: stored.sentAt,
  };
}

async function createEscalation(
  tenantId: string,
  conversationId: string,
  escalationType: string
): Promise<void> {
  await pool.query(
    `INSERT INTO lead_escalations (tenant_id, conversation_id, escalation_type)
     VALUES ($1, $2, $3)`,
    [tenantId, conversationId, escalationType]
  );

  emitToTenant(tenantId, 'escalation', {
    conversationId,
    type: escalationType,
  });
}

router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }

  if (!mode && !token) {
    res.status(200).json({
      ok: true,
      service: 'propagent-whatsapp-webhook',
      message:
        'Webhook is live. Browser visits are normal — Meta verifies with hub.mode=subscribe.',
      verifyTokenConfigured: Boolean(process.env.META_VERIFY_TOKEN?.trim()),
      appSecretConfigured: Boolean(process.env.META_APP_SECRET?.trim()),
    });
    return;
  }

  res.status(403).send('Forbidden — verify token mismatch. Check META_VERIFY_TOKEN on Render.');
});

async function touchWebhookReceived(tenantId: string | null): Promise<void> {
  if (!tenantId) return;
  try {
    await pool.query(
      `UPDATE broker_settings SET last_webhook_at = NOW(), updated_at = NOW() WHERE tenant_id = $1`,
      [tenantId]
    );
  } catch (error) {
    console.error('Failed to update last_webhook_at:', error);
  }
}

router.post('/whatsapp', async (req: RawBodyRequest, res: Response) => {
  res.status(200).send('OK');

  const phoneNumberIdPreview =
    req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ?? null;
  console.log('WhatsApp webhook POST', {
    phoneNumberId: phoneNumberIdPreview,
    hasSignature: Boolean(req.headers['x-hub-signature-256']),
  });

  try {
    if (!verifyMetaSignature(req)) {
      console.error('Webhook signature verification failed');
      return;
    }

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;
    const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;

    if (phoneNumberId) {
      const tenantPreview = await fetchTenantByPhoneNumberId(phoneNumberId);
      await touchWebhookReceived(tenantPreview?.tenant_id ?? null);
    }

    if (!messages?.length) {
      return;
    }

    const message = messages[0];
    const from: string = message.from;
    const messageId: string = message.id;
    const messageType: string = message.type ?? 'text';
    const text: string =
      message.text?.body ??
      message.image?.caption ??
      message.document?.caption ??
      '';
    const customerName: string | null = value.contacts?.[0]?.profile?.name ?? null;

    if (!phoneNumberId || !from || !messageId) {
      return;
    }

    const tenant = await fetchTenantByPhoneNumberId(phoneNumberId);
    if (!tenant?.meta_access_token) {
      console.error('No tenant found for phone_number_id:', phoneNumberId);
      return;
    }

    const plan = await fetchPlan(tenant.tenant_id);

    const conversation = await upsertConversation(
      tenant.tenant_id,
      from,
      customerName
    );

    if (conversation.opted_out) {
      return;
    }

    if (messageType === 'text' && STOP_PATTERN.test(text.trim())) {
      await pool.query(
        `UPDATE conversations SET opted_out = true WHERE id = $1`,
        [conversation.id]
      );
      await sendOutboundAndStore({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: 'You have been unsubscribed. Reply START to opt back in.',
        conversationId: conversation.id,
        tenantId: tenant.tenant_id,
        updateLastMessageAt: false,
      });
      return;
    }

    let inboundContent =
      messageType === 'audio'
        ? '[voice note]'
        : text;

    let visionAttachment: VisionAttachment | undefined;

    if (messageType === 'image' || messageType === 'document') {
      const mediaId: string | undefined = message.image?.id ?? message.document?.id;
      const filename: string = message.document?.filename ?? 'document';

      if (mediaId) {
        try {
          const media = await downloadWhatsAppMedia(mediaId, tenant.meta_access_token);

          if (media.mimeType.startsWith('image/')) {
            visionAttachment = {
              mimeType: media.mimeType,
              base64: media.buffer.toString('base64'),
              caption: text || undefined,
            };
            inboundContent = text || '[image received]';
          } else {
            inboundContent = text
              ? `[document: ${filename}] ${text}`
              : `[document received: ${filename}]`;
          }
        } catch (mediaError) {
          console.error('WhatsApp media download failed:', mediaError);
          inboundContent =
            messageType === 'image'
              ? text || '[image received — download failed]'
              : text || `[document received: ${filename}]`;
        }
      } else {
        inboundContent =
          messageType === 'image'
            ? text || '[image received]'
            : text || `[document received: ${filename}]`;
      }
    }

    const stored = await storeInboundMessage({
      conversationId: conversation.id,
      tenantId: tenant.tenant_id,
      content: inboundContent,
      mediaType: messageType,
      whatsappMsgId: messageId,
    });

    if (!stored) {
      return;
    }

    emitToTenant(tenant.tenant_id, 'new_message', {
      conversationId: conversation.id,
      message: {
        id: stored.id,
        direction: 'inbound',
        sender: 'customer',
        content: inboundContent,
        mediaType: messageType,
        status: 'sent',
        sentAt: stored.sentAt,
      },
    });

    await emitConversationUpdate(conversation.id, tenant.tenant_id);

    if (conversation.human_override || conversation.ai_paused) {
      emitToTenant(tenant.tenant_id, 'human_override', {
        conversationId: conversation.id,
        customerPhone: from,
        humanOverride: conversation.human_override,
        aiPaused: conversation.ai_paused,
      });
      return;
    }

    if (messageType === 'audio') {
      const audioReply =
        'Could you send that as a text? I\'ll help right away.';

      await pool.query(
        `UPDATE conversations SET voice_note_received = true WHERE id = $1`,
        [conversation.id]
      );

      await sendOutboundAndStore({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: audioReply,
        conversationId: conversation.id,
        tenantId: tenant.tenant_id,
      });
      return;
    }

    if (messageType !== 'text' && messageType !== 'image' && messageType !== 'document') {
      const unsupportedReply =
        'Thanks for your message. Please send a text message and I\'ll help right away.';
      await sendOutboundAndStore({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: unsupportedReply,
        conversationId: conversation.id,
        tenantId: tenant.tenant_id,
      });
      return;
    }

    if (
      !plan ||
      plan.is_blocked ||
      plan.is_suspended ||
      !plan.can_use_ai
    ) {
      const serviceMsg = plan?.is_blocked
        ? 'This service is currently unavailable. Please contact the office directly.'
        : plan?.is_suspended
          ? 'This account is temporarily suspended. Our team will reach out soon.'
          : 'Our AI assistant is currently unavailable. Our team will follow up shortly.';
      await sendOutboundAndStore({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: serviceMsg,
        conversationId: conversation.id,
        tenantId: tenant.tenant_id,
      });
      return;
    }

    if (plan.ai_messages_used >= plan.ai_message_limit) {
      const limitMsg = `Thanks for reaching out. Our team has reached the monthly message limit. ${tenant.owner_name} will get back to you shortly.`;
      await sendOutboundAndStore({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: limitMsg,
        conversationId: conversation.id,
        tenantId: tenant.tenant_id,
      });
      return;
    }

    if (conversation.followup_capped) {
      const cappedMsg =
        'Thanks for your message. Our team will get back to you shortly.';
      await sendOutboundAndStore({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: cappedMsg,
        conversationId: conversation.id,
        tenantId: tenant.tenant_id,
      });
      return;
    }

    if (text.trim()) {
      const detected = detectLanguage(text);
      const languagePref = languagePrefFromDetection(detected);
      if (languagePref !== conversation.language_pref) {
        await pool.query(
          `UPDATE conversations SET language_pref = $1 WHERE id = $2`,
          [languagePref, conversation.id]
        );
      }
    }

    const history = await buildConversationHistory(conversation.id, 20);
    const promptParams = await buildTenantPromptContext(
      tenant.tenant_id,
      text || inboundContent,
      conversation.id
    );
    const systemPrompt = await buildSystemPrompt(promptParams);

    let aiResult;
    try {
      aiResult = await getAIResponse(
        systemPrompt,
        history,
        tenant.tenant_id,
        conversation.id,
        visionAttachment ? { visionAttachment } : undefined
      );
    } catch (aiError) {
      console.error('AI response failed:', aiError);
      await logAiFailure(tenant.tenant_id, conversation.id, aiError);
      await sendOutboundAndStore({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: AI_FAILURE_FALLBACK,
        conversationId: conversation.id,
        tenantId: tenant.tenant_id,
      });
      return;
    }

    const escalationType = detectEscalationType(aiResult.text);
    if (escalationType) {
      await createEscalation(tenant.tenant_id, conversation.id, escalationType);
    }

    const replyText = stripEscalationFlags(aiResult.text) || 'Let me connect you with the team shortly.';

    await sendOutboundAndStore({
      phoneNumberId,
      accessToken: tenant.meta_access_token,
      to: from,
      text: replyText,
      conversationId: conversation.id,
      tenantId: tenant.tenant_id,
      aiModelUsed: aiResult.model_used,
    });

    await appendConversationStory(
      conversation.id,
      tenant.tenant_id,
      text || inboundContent,
      replyText
    );

    await pool.query(
      `UPDATE client_plans
       SET ai_messages_used = ai_messages_used + 1, updated_at = NOW()
       WHERE tenant_id = $1`,
      [tenant.tenant_id]
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});

export default router;
