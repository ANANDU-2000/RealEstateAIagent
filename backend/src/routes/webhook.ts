import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db';
import { getIo } from '../realtime/io-holder';
import { sendWhatsAppMessage, downloadWhatsAppMedia } from '../services/whatsapp.service';
import {
  buildSystemPrompt,
  getAIResponse,
  type ChatMessage,
  type BuildSystemPromptParams,
  type VisionAttachment,
} from '../services/ai.service';

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

function countryToMarket(country: string): { market: string; currency: string } {
  const code = country.toUpperCase();
  if (code === 'CA') return { market: 'canada', currency: 'CAD' };
  if (['AE', 'SA', 'QA'].includes(code)) return { market: 'uae', currency: 'AED' };
  return { market: 'india', currency: 'INR' };
}

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

  const appSecret = process.env.META_APP_SECRET;
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!appSecret || !signature || !req.rawBody) return false;

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
}): Promise<{ id: string } | null> {
  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO messages
         (conversation_id, tenant_id, direction, sender, content, media_type, media_url, whatsapp_msg_id)
       VALUES ($1, $2, 'inbound', 'customer', $3, $4, $5, $6)
       RETURNING id`,
      [
        params.conversationId,
        params.tenantId,
        params.content,
        params.mediaType,
        params.mediaUrl ?? null,
        params.whatsappMsgId,
      ]
    );
    return result.rows[0];
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

async function storeOutboundMessage(params: {
  conversationId: string;
  tenantId: string;
  content: string;
  aiModelUsed?: string;
}): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO messages
       (conversation_id, tenant_id, direction, sender, content, media_type, ai_model_used)
     VALUES ($1, $2, 'outbound', 'ai', $3, 'text', $4)
     RETURNING id`,
    [params.conversationId, params.tenantId, params.content, params.aiModelUsed ?? null]
  );
  return result.rows[0].id;
}

function emitToTenant(tenantId: string, event: string, payload: unknown): void {
  const io = getIo();
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, payload);
  }
}

async function buildPromptContext(tenantId: string): Promise<BuildSystemPromptParams> {
  const tenantResult = await pool.query<{
    business_name: string;
    owner_name: string;
    country: string;
    ai_name: string;
    office_address: string | null;
    office_maps_link: string | null;
    language_default: string;
    ai_followup_count: number;
    no_msg_after_hour: number;
  }>(
    `SELECT
       t.business_name,
       t.owner_name,
       t.country,
       COALESCE(bs.ai_name, 'Arjun') AS ai_name,
       COALESCE(bs.office_address, '') AS office_address,
       COALESCE(bs.office_maps_link, '') AS office_maps_link,
       COALESCE(bs.language_default, 'english') AS language_default,
       COALESCE(bs.ai_followup_count, 2) AS ai_followup_count,
       COALESCE(bs.no_msg_after_hour, 21) AS no_msg_after_hour
     FROM tenants t
     JOIN broker_settings bs ON bs.tenant_id = t.id
     WHERE t.id = $1`,
    [tenantId]
  );

  const tenant = tenantResult.rows[0];
  const { market, currency } = countryToMarket(tenant?.country ?? 'IN');

  const propertiesResult = await pool.query(
    `SELECT
       name, property_type, listing_type, area_size, area_unit,
       price, currency, city, location, area_tags, details
     FROM properties
     WHERE tenant_id = $1 AND is_available = true AND is_hidden = false
     ORDER BY created_at DESC`,
    [tenantId]
  );

  const priceResult = await pool.query<{ min_price: string | null; max_price: string | null }>(
    `SELECT MIN(price)::text AS min_price, MAX(price)::text AS max_price
     FROM properties
     WHERE tenant_id = $1 AND is_available = true AND is_hidden = false`,
    [tenantId]
  );

  const slotsResult = await pool.query(
    `SELECT day_of_week, slot_time::text AS slot_time
     FROM availability_slots
     WHERE tenant_id = $1 AND is_active = true`,
    [tenantId]
  );

  const bookedResult = await pool.query(
    `SELECT scheduled_at
     FROM meetings
     WHERE tenant_id = $1 AND status = 'confirmed' AND scheduled_at > NOW()
     ORDER BY scheduled_at ASC
     LIMIT 50`,
    [tenantId]
  );

  const availableSlots: Array<{ day_of_week: number; slot_time: string }> = [];
  const now = new Date();
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const dow = date.getDay();
    for (const slot of slotsResult.rows) {
      if (slot.day_of_week === dow) {
        availableSlots.push({
          day_of_week: dow,
          slot_time: slot.slot_time,
        });
      }
    }
  }

  return {
    workspace_name: tenant?.business_name ?? '',
    owner_name: tenant?.owner_name ?? '',
    ai_name: tenant?.ai_name ?? 'Arjun',
    office_address: tenant?.office_address ?? '',
    office_maps_link: tenant?.office_maps_link ?? '',
    language_default: tenant?.language_default ?? 'english',
    market,
    property_list_json: JSON.stringify(propertiesResult.rows),
    available_slots_json: JSON.stringify(availableSlots),
    booked_slots_json: JSON.stringify(bookedResult.rows),
    min_property_price: priceResult.rows[0]?.min_price ?? '0',
    max_property_price: priceResult.rows[0]?.max_price ?? '0',
    currency,
    followup_max: String(tenant?.ai_followup_count ?? 2),
    no_msg_after_hour: String(tenant?.no_msg_after_hour ?? 21),
  };
}

async function buildConversationHistory(conversationId: string): Promise<ChatMessage[]> {
  const result = await pool.query<{ content: string; sender: string; direction: string }>(
    `SELECT content, sender, direction
     FROM messages
     WHERE conversation_id = $1
     ORDER BY sent_at DESC
     LIMIT 10`,
    [conversationId]
  );

  return result.rows
    .reverse()
    .map((row) => ({
      role: row.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
      content: row.content,
    }));
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

  res.status(403).send('Forbidden');
});

router.post('/whatsapp', async (req: RawBodyRequest, res: Response) => {
  res.status(200).send('OK');

  try {
    if (!verifyMetaSignature(req)) {
      console.error('Webhook signature verification failed');
      return;
    }

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

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
    const phoneNumberId: string = value.metadata?.phone_number_id;
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
    if (
      !plan ||
      plan.is_blocked ||
      plan.is_suspended ||
      !plan.can_use_ai
    ) {
      return;
    }

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
      await sendWhatsAppMessage({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: 'You have been unsubscribed. Reply START to opt back in.',
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
      },
    });

    if (conversation.human_override || conversation.ai_paused) {
      emitToTenant(tenant.tenant_id, 'human_override', {
        conversationId: conversation.id,
        customerPhone: from,
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

      await sendWhatsAppMessage({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: audioReply,
      });

      const outboundId = await storeOutboundMessage({
        conversationId: conversation.id,
        tenantId: tenant.tenant_id,
        content: audioReply,
      });

      emitToTenant(tenant.tenant_id, 'new_message', {
        conversationId: conversation.id,
        message: {
          id: outboundId,
          direction: 'outbound',
          sender: 'ai',
          content: audioReply,
          mediaType: 'text',
        },
      });
      return;
    }

    if (messageType !== 'text' && messageType !== 'image' && messageType !== 'document') {
      return;
    }

    if (plan.ai_messages_used >= plan.ai_message_limit) {
      const limitMsg = `Thanks for reaching out. Our team has reached the monthly message limit. ${tenant.owner_name} will get back to you shortly.`;
      await sendWhatsAppMessage({
        phoneNumberId,
        accessToken: tenant.meta_access_token,
        to: from,
        text: limitMsg,
      });
      return;
    }

    if (conversation.followup_capped) {
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

    const history = await buildConversationHistory(conversation.id);
    const promptParams = await buildPromptContext(tenant.tenant_id);
    const systemPrompt = await buildSystemPrompt(promptParams);

    const aiResult = await getAIResponse(
      systemPrompt,
      history,
      tenant.tenant_id,
      conversation.id,
      visionAttachment ? { visionAttachment } : undefined
    );

    const escalationType = detectEscalationType(aiResult.text);
    if (escalationType) {
      await createEscalation(tenant.tenant_id, conversation.id, escalationType);
    }

    const replyText = stripEscalationFlags(aiResult.text) || 'Let me connect you with the team shortly.';

    await sendWhatsAppMessage({
      phoneNumberId,
      accessToken: tenant.meta_access_token,
      to: from,
      text: replyText,
    });

    const outboundId = await storeOutboundMessage({
      conversationId: conversation.id,
      tenantId: tenant.tenant_id,
      content: replyText,
      aiModelUsed: aiResult.model_used,
    });

    await pool.query(
      `UPDATE client_plans
       SET ai_messages_used = ai_messages_used + 1, updated_at = NOW()
       WHERE tenant_id = $1`,
      [tenant.tenant_id]
    );

    await pool.query(
      `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
      [conversation.id]
    );

    emitToTenant(tenant.tenant_id, 'new_message', {
      conversationId: conversation.id,
      message: {
        id: outboundId,
        direction: 'outbound',
        sender: 'ai',
        content: replyText,
        mediaType: 'text',
        aiModelUsed: aiResult.model_used,
      },
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});

export default router;
