import { pool } from '../db';
import { fetchRelevantDocumentChunks } from './document.service';
import type { BuildSystemPromptParams } from './ai.service';

type ConversationContextRow = {
  customer_name: string | null;
  language_pref: string | null;
  budget_min: string | null;
  budget_max: string | null;
  preferred_type: string | null;
  preferred_area: string | null;
  intent: string | null;
  ai_story_summary: string | null;
};

function countryToMarket(country: string): { market: string; currency: string } {
  if (country === 'AE') return { market: 'UAE', currency: 'AED' };
  if (country === 'CA') return { market: 'Canada', currency: 'CAD' };
  return { market: 'India', currency: 'INR' };
}

function formatMoney(amount: string | number, currency: string): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return String(amount);
  if (currency === 'INR') {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  }
  return `${currency} ${n.toLocaleString('en-IN')}`;
}

export async function loadPropertiesForAi(tenantId: string): Promise<unknown[]> {
  const result = await pool.query<{
    id: string;
    name: string;
    property_type: string;
    listing_type: string;
    area_size: string | null;
    area_unit: string | null;
    price: string;
    currency: string;
    city: string | null;
    location: string | null;
    area_tags: string[] | null;
    details: string | null;
    updated_at: Date;
    photo_urls: string[] | null;
  }>(
    `SELECT
       p.id,
       p.name,
       p.property_type,
       p.listing_type,
       p.area_size::text,
       p.area_unit,
       p.price::text,
       p.currency,
       p.city,
       p.location,
       p.area_tags,
       p.details,
       p.updated_at,
       COALESCE(
         (SELECT array_agg(pp.url ORDER BY pp.sort_order, pp.uploaded_at)
          FROM property_photos pp
          WHERE pp.property_id = p.id),
         ARRAY[]::text[]
       ) AS photo_urls
     FROM properties p
     WHERE p.tenant_id = $1
       AND p.is_available = true
       AND p.is_hidden = false
     ORDER BY p.updated_at DESC, p.created_at DESC`,
    [tenantId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.property_type,
    listing: row.listing_type,
    area: row.area_size ? `${row.area_size} ${row.area_unit ?? ''}`.trim() : null,
    price: Number(row.price),
    currency: row.currency,
    price_display: formatMoney(row.price, row.currency),
    city: row.city,
    location: row.location,
    area_tags: row.area_tags ?? [],
    details: row.details,
    photo_urls: row.photo_urls ?? [],
    updated_at: row.updated_at,
  }));
}

export function buildConversationStoryBlock(
  conversation: ConversationContextRow,
  recentMessages: Array<{ role: string; content: string }>
): string {
  const lines: string[] = [];

  if (conversation.customer_name) lines.push(`Customer name: ${conversation.customer_name}`);
  if (conversation.language_pref) lines.push(`Language preference: ${conversation.language_pref}`);
  if (conversation.preferred_area) lines.push(`Preferred area: ${conversation.preferred_area}`);
  if (conversation.preferred_type) lines.push(`Preferred type: ${conversation.preferred_type}`);
  if (conversation.intent && conversation.intent !== 'unknown') {
    lines.push(`Intent: ${conversation.intent}`);
  }
  if (conversation.budget_min || conversation.budget_max) {
    lines.push(
      `Budget range: ${conversation.budget_min ?? '?'} – ${conversation.budget_max ?? '?'}`
    );
  }
  if (conversation.ai_story_summary?.trim()) {
    lines.push(`Running summary: ${conversation.ai_story_summary.trim()}`);
  }

  const tail = recentMessages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content.slice(0, 200)}`)
    .join('\n');

  if (tail) lines.push(`Recent thread:\n${tail}`);

  return lines.join('\n');
}

export async function buildTenantPromptContext(
  tenantId: string,
  customerMessage: string,
  conversationId?: string | null
): Promise<BuildSystemPromptParams & { conversation_story: string }> {
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

  const properties = await loadPropertiesForAi(tenantId);

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
        availableSlots.push({ day_of_week: dow, slot_time: slot.slot_time });
      }
    }
  }

  const documentChunks = await fetchRelevantDocumentChunks(tenantId, customerMessage, null, 8);
  const document_chunks_json = JSON.stringify(
    documentChunks.map((chunk) => ({
      filename: chunk.filename,
      chunk_index: chunk.chunkIndex,
      property_id: chunk.propertyId,
      text: chunk.chunkText,
    }))
  );

  let conversation_story = '';
  if (conversationId) {
    const convResult = await pool.query<ConversationContextRow>(
      `SELECT customer_name, language_pref, budget_min::text, budget_max::text,
              preferred_type, preferred_area, intent, ai_story_summary
       FROM conversations WHERE id = $1 AND tenant_id = $2`,
      [conversationId, tenantId]
    );
    const history = await buildConversationHistory(conversationId, 12);
    if (convResult.rows[0]) {
      conversation_story = buildConversationStoryBlock(convResult.rows[0], history);
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
    property_list_json: JSON.stringify(properties),
    available_slots_json: JSON.stringify(availableSlots),
    booked_slots_json: JSON.stringify(bookedResult.rows),
    min_property_price: priceResult.rows[0]?.min_price ?? '0',
    max_property_price: priceResult.rows[0]?.max_price ?? '0',
    currency,
    followup_max: String(tenant?.ai_followup_count ?? 2),
    no_msg_after_hour: String(tenant?.no_msg_after_hour ?? 21),
    document_chunks_json,
    conversation_story,
  };
}

export async function buildConversationHistory(
  conversationId: string,
  limit = 20
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const result = await pool.query<{ content: string; direction: string }>(
    `SELECT content, direction
     FROM messages
     WHERE conversation_id = $1
       AND media_type = 'text'
       AND content IS NOT NULL
       AND TRIM(content) <> ''
     ORDER BY sent_at DESC
     LIMIT $2`,
    [conversationId, limit]
  );

  return result.rows.reverse().map((row) => ({
    role: row.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
    content: row.content,
  }));
}

export async function appendConversationStory(
  conversationId: string,
  tenantId: string,
  customerText: string,
  agentText: string
): Promise<void> {
  const line = `Customer: ${customerText.slice(0, 120).replace(/\s+/g, ' ')} | Agent: ${agentText.slice(0, 120).replace(/\s+/g, ' ')}`;
  await pool.query(
    `UPDATE conversations
     SET ai_story_summary = TRIM(
       CASE
         WHEN ai_story_summary IS NULL OR ai_story_summary = '' THEN $3
         ELSE LEFT(ai_story_summary || E'\\n' || $3, 4000)
       END
     )
     WHERE id = $1 AND tenant_id = $2`,
    [conversationId, tenantId, line]
  );
}
