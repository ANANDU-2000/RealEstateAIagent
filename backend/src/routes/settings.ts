import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  settingsWhatsappSchema,
  settingsOfficeSchema,
  settingsAiSchema,
  availabilityPostSchema,
} from '../utils/validators';

const router = Router();

router.use(requireAuth);

const META_GRAPH_API_VERSION = 'v20.0';

type OnboardingRow = {
  owner_name: string;
  ai_name: string;
  whatsapp_connected: boolean;
  whatsapp_number: string | null;
  office_address: string | null;
  property_count: string;
  slot_count: string;
};

type BrokerSettingsRow = {
  whatsapp_number: string | null;
  meta_phone_number_id: string | null;
  meta_access_token: string | null;
  meta_waba_id: string | null;
  whatsapp_connected: boolean;
};

type AiSettingsRow = {
  ai_name: string;
  ai_tone: string;
  ai_followup_count: number;
  ai_followup_gap: string;
  no_msg_after_hour: number;
  language_default: string;
};

type AvailabilityRow = {
  id: string;
  day_of_week: number;
  slot_time: string;
  is_active: boolean;
};

async function ensureBrokerSettings(tenantId: string): Promise<void> {
  await pool.query(
    `INSERT INTO broker_settings (tenant_id) VALUES ($1) ON CONFLICT (tenant_id) DO NOTHING`,
    [tenantId]
  );
}

function normalizeWhatsappRecipient(number: string): string {
  return number.replace(/\D/g, '');
}

function formatSlotTime(slotTime: string): string {
  return slotTime.slice(0, 5);
}

function assemblePromptPreview(
  businessName: string,
  settings: AiSettingsRow
): string {
  return [
    `You are ${settings.ai_name}, a property assistant for ${businessName}.`,
    `Tone: ${settings.ai_tone}.`,
    `Default language: ${settings.language_default}.`,
    `Follow up up to ${settings.ai_followup_count} time(s) with ${settings.ai_followup_gap} between messages.`,
    `Do not send messages after ${settings.no_msg_after_hour}:00 local time.`,
    'Your job is to qualify leads, match properties from inventory, and book visits.',
    'Never invent property details. Never message outside allowed hours.',
  ].join(' ');
}

router.get('/onboarding-status', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query<OnboardingRow>(
      `SELECT t.owner_name,
              COALESCE(bs.ai_name, 'Arjun') AS ai_name,
              COALESCE(bs.whatsapp_connected, false) AS whatsapp_connected,
              bs.whatsapp_number,
              bs.office_address,
              (SELECT COUNT(*)::text FROM properties p WHERE p.tenant_id = t.id) AS property_count,
              (SELECT COUNT(*)::text FROM availability_slots a
               WHERE a.tenant_id = t.id AND a.is_active = true) AS slot_count
       FROM tenants t
       LEFT JOIN broker_settings bs ON bs.tenant_id = t.id
       WHERE t.id = $1`,
      [tenantId]
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const hasProperty = Number(row.property_count) > 0;
    const hasAvailability = Number(row.slot_count) > 0;
    const hasOfficeAddress = Boolean(row.office_address?.trim());

    const whatsappReady = row.whatsapp_connected;

    const steps = {
      accountCreated: true,
      whatsappConnected: whatsappReady,
      hasProperty,
      hasAvailability,
      hasOfficeAddress,
    };

    const completedCount =
      (steps.accountCreated ? 1 : 0) +
      (steps.whatsappConnected ? 1 : 0) +
      (steps.hasProperty ? 1 : 0) +
      (steps.hasAvailability ? 1 : 0) +
      (steps.hasOfficeAddress ? 1 : 0);

    res.json({
      ownerName: row.owner_name,
      aiName: row.ai_name,
      whatsappNumber: row.whatsapp_number,
      steps,
      completedCount,
      totalSteps: 5,
      quickStepsCompleted:
        (steps.whatsappConnected ? 1 : 0) +
        (steps.hasProperty ? 1 : 0) +
        (steps.hasAvailability ? 1 : 0) +
        (steps.hasOfficeAddress ? 1 : 0),
      quickStepsTotal: 4,
    });
  } catch (error) {
    console.error('Get onboarding status failed:', error);
    res.status(500).json({ error: 'Failed to load onboarding status' });
  }
});

router.get('/whatsapp', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    await ensureBrokerSettings(tenantId);

    const result = await pool.query<{
      whatsapp_number: string | null;
      meta_phone_number_id: string | null;
      meta_waba_id: string | null;
      has_access_token: boolean;
      whatsapp_connected: boolean;
      whatsapp_connected_at: string | null;
    }>(
      `SELECT whatsapp_number,
              meta_phone_number_id,
              meta_waba_id,
              (meta_access_token IS NOT NULL AND meta_access_token <> '') AS has_access_token,
              COALESCE(whatsapp_connected, false) AS whatsapp_connected,
              whatsapp_connected_at
       FROM broker_settings
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const row = result.rows[0];
    res.json({
      whatsappNumber: row?.whatsapp_number ?? null,
      metaPhoneNumberId: row?.meta_phone_number_id ?? null,
      metaWabaId: row?.meta_waba_id ?? null,
      hasAccessToken: Boolean(row?.has_access_token),
      whatsappConnected: Boolean(row?.whatsapp_connected),
      whatsappConnectedAt: row?.whatsapp_connected_at ?? null,
    });
  } catch (error) {
    console.error('Get WhatsApp settings failed:', error);
    res.status(500).json({ error: 'Failed to load WhatsApp settings' });
  }
});

router.patch('/whatsapp', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = settingsWhatsappSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  try {
    await ensureBrokerSettings(tenantId);

    const current = await pool.query<BrokerSettingsRow>(
      `SELECT whatsapp_number, meta_phone_number_id, meta_access_token, meta_waba_id, whatsapp_connected
       FROM broker_settings
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const row = current.rows[0];
    const data = parsed.data;

    const whatsappNumber =
      data.whatsappNumber === undefined
        ? row?.whatsapp_number ?? null
        : data.whatsappNumber === null
          ? null
          : data.whatsappNumber.trim();

    const metaPhoneNumberId =
      data.metaPhoneNumberId === undefined
        ? row?.meta_phone_number_id ?? null
        : data.metaPhoneNumberId === null
          ? null
          : data.metaPhoneNumberId.trim() || null;

    const metaAccessToken =
      data.metaAccessToken === undefined
        ? row?.meta_access_token ?? null
        : data.metaAccessToken === null
          ? null
          : data.metaAccessToken.trim() || null;

    const metaWabaId =
      data.metaWabaId === undefined
        ? row?.meta_waba_id ?? null
        : data.metaWabaId === null
          ? null
          : data.metaWabaId.trim() || null;

    const whatsappConnected = Boolean(metaPhoneNumberId && metaAccessToken);

    if (metaAccessToken && !metaPhoneNumberId) {
      res.status(400).json({
        error: 'Phone Number ID is required when an access token is set.',
      });
      return;
    }

    const wasConnected = Boolean(row?.whatsapp_connected);

    await pool.query(
      `UPDATE broker_settings
       SET whatsapp_number = $1,
           meta_phone_number_id = $2,
           meta_access_token = $3,
           meta_waba_id = $4,
           whatsapp_connected = $5,
           whatsapp_connected_at = CASE
             WHEN $5 = true AND COALESCE($6, false) = false THEN NOW()
             WHEN $5 = false THEN NULL
             ELSE whatsapp_connected_at
           END,
           updated_at = NOW()
       WHERE tenant_id = $7`,
      [
        whatsappNumber,
        metaPhoneNumberId,
        metaAccessToken,
        metaWabaId,
        whatsappConnected,
        wasConnected,
        tenantId,
      ]
    );

    res.json({
      ok: true,
      whatsappNumber,
      metaPhoneNumberId,
      metaWabaId,
      whatsappConnected,
    });
  } catch (error) {
    console.error('Update WhatsApp settings failed:', error);
    res.status(500).json({ error: 'Failed to update WhatsApp settings' });
  }
});

router.post('/whatsapp/test', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query<{
      whatsapp_number: string | null;
      meta_phone_number_id: string | null;
      meta_access_token: string | null;
    }>(
      `SELECT whatsapp_number, meta_phone_number_id, meta_access_token
       FROM broker_settings
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const row = result.rows[0];
    if (!row?.meta_phone_number_id || !row.meta_access_token) {
      res.status(400).json({ error: 'WhatsApp is not fully configured' });
      return;
    }

    if (!row.whatsapp_number?.trim()) {
      res.status(400).json({ error: 'WhatsApp number is not set' });
      return;
    }

    const testBody = 'Hi from PropAgent test';
    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${row.meta_phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${row.meta_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizeWhatsappRecipient(row.whatsapp_number),
          type: 'text',
          text: { body: testBody },
        }),
      }
    );

    const payload = (await response.json()) as { error?: { message?: string } };
    if (!response.ok) {
      console.error('WhatsApp test message failed:', payload);
      res.status(502).json({
        error: payload.error?.message ?? 'Failed to send test message',
      });
      return;
    }

    res.json({
      ok: true,
      message: `Test message sent to ${row.whatsapp_number}`,
    });
  } catch (error) {
    console.error('WhatsApp test message failed:', error);
    res.status(500).json({ error: 'Failed to send test message' });
  }
});

router.get('/office', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    await ensureBrokerSettings(tenantId);

    const result = await pool.query<{
      office_address: string | null;
      office_city: string | null;
      office_maps_link: string | null;
      reminder_before_visit: string;
      customer_reminder: boolean;
      customer_reminder_time: string;
    }>(
      `SELECT office_address,
              office_city,
              office_maps_link,
              COALESCE(reminder_before_visit, '1hr') AS reminder_before_visit,
              COALESCE(customer_reminder, true) AS customer_reminder,
              COALESCE(customer_reminder_time, '1hr') AS customer_reminder_time
       FROM broker_settings
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const row = result.rows[0];
    res.json({
      officeAddress: row?.office_address ?? null,
      officeCity: row?.office_city ?? null,
      officeMapsLink: row?.office_maps_link ?? null,
      reminderBeforeVisit: row?.reminder_before_visit ?? '1hr',
      customerReminder: row?.customer_reminder ?? true,
      customerReminderTime: row?.customer_reminder_time ?? '1hr',
    });
  } catch (error) {
    console.error('Get office settings failed:', error);
    res.status(500).json({ error: 'Failed to load office settings' });
  }
});

router.patch('/office', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = settingsOfficeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.officeAddress !== undefined) {
    updates.push(`office_address = $${paramIndex++}`);
    values.push(
      data.officeAddress === null ? null : data.officeAddress.trim() || null
    );
  }
  if (data.officeCity !== undefined) {
    updates.push(`office_city = $${paramIndex++}`);
    values.push(data.officeCity === null ? null : data.officeCity.trim() || null);
  }
  if (data.officeMapsLink !== undefined) {
    updates.push(`office_maps_link = $${paramIndex++}`);
    const link =
      data.officeMapsLink === null || data.officeMapsLink === ''
        ? null
        : data.officeMapsLink.trim();
    values.push(link);
  }
  if (data.reminderBeforeVisit !== undefined) {
    updates.push(`reminder_before_visit = $${paramIndex++}`);
    values.push(data.reminderBeforeVisit);
  }
  if (data.customerReminder !== undefined) {
    updates.push(`customer_reminder = $${paramIndex++}`);
    values.push(data.customerReminder);
  }
  if (data.customerReminderTime !== undefined) {
    updates.push(`customer_reminder_time = $${paramIndex++}`);
    values.push(data.customerReminderTime);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'At least one field is required' });
    return;
  }

  try {
    await ensureBrokerSettings(tenantId);

    updates.push('updated_at = NOW()');
    values.push(tenantId);

    await pool.query(
      `UPDATE broker_settings SET ${updates.join(', ')} WHERE tenant_id = $${paramIndex}`,
      values
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Update office settings failed:', error);
    res.status(500).json({ error: 'Failed to update office settings' });
  }
});

router.get('/ai', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    await ensureBrokerSettings(tenantId);

    const result = await pool.query<AiSettingsRow>(
      `SELECT ai_name, ai_tone, ai_followup_count, ai_followup_gap,
              no_msg_after_hour, language_default
       FROM broker_settings
       WHERE tenant_id = $1`,
      [tenantId]
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'Settings not found' });
      return;
    }

    res.json({
      aiName: row.ai_name,
      aiTone: row.ai_tone,
      aiFollowupCount: row.ai_followup_count,
      aiFollowupGap: row.ai_followup_gap,
      noMsgAfterHour: row.no_msg_after_hour,
      languageDefault: row.language_default,
    });
  } catch (error) {
    console.error('Get AI settings failed:', error);
    res.status(500).json({ error: 'Failed to load AI settings' });
  }
});

router.patch('/ai', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = settingsAiSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.aiName !== undefined) {
    updates.push(`ai_name = $${paramIndex++}`);
    values.push(data.aiName.trim());
  }
  if (data.aiTone !== undefined) {
    updates.push(`ai_tone = $${paramIndex++}`);
    values.push(data.aiTone);
  }
  if (data.aiFollowupCount !== undefined) {
    updates.push(`ai_followup_count = $${paramIndex++}`);
    values.push(data.aiFollowupCount);
  }
  if (data.aiFollowupGap !== undefined) {
    updates.push(`ai_followup_gap = $${paramIndex++}`);
    values.push(data.aiFollowupGap);
  }
  if (data.noMsgAfterHour !== undefined) {
    updates.push(`no_msg_after_hour = $${paramIndex++}`);
    values.push(data.noMsgAfterHour);
  }
  if (data.languageDefault !== undefined) {
    updates.push(`language_default = $${paramIndex++}`);
    values.push(data.languageDefault);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'At least one field is required' });
    return;
  }

  try {
    await ensureBrokerSettings(tenantId);

    updates.push('updated_at = NOW()');
    values.push(tenantId);

    await pool.query(
      `UPDATE broker_settings SET ${updates.join(', ')} WHERE tenant_id = $${paramIndex}`,
      values
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Update AI settings failed:', error);
    res.status(500).json({ error: 'Failed to update AI settings' });
  }
});

router.get('/ai/prompt-preview', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query<AiSettingsRow & { business_name: string }>(
      `SELECT t.business_name,
              COALESCE(bs.ai_name, 'Arjun') AS ai_name,
              COALESCE(bs.ai_tone, 'friendly') AS ai_tone,
              COALESCE(bs.ai_followup_count, 2) AS ai_followup_count,
              COALESCE(bs.ai_followup_gap, 'next_morning') AS ai_followup_gap,
              COALESCE(bs.no_msg_after_hour, 21) AS no_msg_after_hour,
              COALESCE(bs.language_default, 'english') AS language_default
       FROM tenants t
       LEFT JOIN broker_settings bs ON bs.tenant_id = t.id
       WHERE t.id = $1`,
      [tenantId]
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    const prompt = assemblePromptPreview(row.business_name, row);
    res.json({ preview: prompt.slice(0, 300) });
  } catch (error) {
    console.error('Get AI prompt preview failed:', error);
    res.status(500).json({ error: 'Failed to load prompt preview' });
  }
});

router.get('/availability', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const result = await pool.query<AvailabilityRow>(
      `SELECT id, day_of_week, slot_time::text, is_active
       FROM availability_slots
       WHERE tenant_id = $1
       ORDER BY day_of_week ASC, slot_time ASC`,
      [tenantId]
    );

    const slotsByDay: Record<
      string,
      Array<{ id: string; slotTime: string; isActive: boolean }>
    > = {};

    for (const row of result.rows) {
      const dayKey = String(row.day_of_week);
      if (!slotsByDay[dayKey]) {
        slotsByDay[dayKey] = [];
      }
      slotsByDay[dayKey].push({
        id: row.id,
        slotTime: formatSlotTime(row.slot_time),
        isActive: row.is_active,
      });
    }

    res.json({ slotsByDay });
  } catch (error) {
    console.error('Get availability failed:', error);
    res.status(500).json({ error: 'Failed to load availability' });
  }
});

router.post('/availability', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = availabilityPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM availability_slots WHERE tenant_id = $1`, [tenantId]);

    for (const slot of parsed.data.slots) {
      const slotTime =
        slot.slotTime.length === 5 ? `${slot.slotTime}:00` : slot.slotTime;

      await client.query(
        `INSERT INTO availability_slots (tenant_id, day_of_week, slot_time, is_active)
         VALUES ($1, $2, $3::time, $4)`,
        [tenantId, slot.dayOfWeek, slotTime, slot.isActive]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true, count: parsed.data.slots.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Save availability failed:', error);
    res.status(500).json({ error: 'Failed to save availability' });
  } finally {
    client.release();
  }
});

export default router;
