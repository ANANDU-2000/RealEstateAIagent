import { Router, Response } from 'express';
import { pool } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

router.use(requireAuth);

type OnboardingRow = {
  owner_name: string;
  ai_name: string;
  whatsapp_connected: boolean;
  whatsapp_number: string | null;
  office_address: string | null;
  property_count: string;
  slot_count: string;
};

router.get('/onboarding-status', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

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

  const hasWhatsappNumber = Boolean(row.whatsapp_number?.trim());
  const whatsappReady = row.whatsapp_connected || hasWhatsappNumber;

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
});

const whatsappSchema = z.object({
  whatsappNumber: z
    .string()
    .min(8, 'Enter a valid WhatsApp number')
    .max(20, 'Number is too long'),
});

router.patch('/whatsapp', async (req: AuthRequest, res: Response) => {
  const tenantId = req.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const parsed = whatsappSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  await pool.query(
    `UPDATE broker_settings
     SET whatsapp_number = $1, updated_at = NOW()
     WHERE tenant_id = $2`,
    [parsed.data.whatsappNumber.trim(), tenantId]
  );

  res.json({ ok: true, whatsappNumber: parsed.data.whatsappNumber.trim() });
});

export default router;
