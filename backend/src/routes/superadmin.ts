import { Router, Response } from 'express';
import { verifySync } from 'otplib';
import { pool } from '../db';
import {
  createTenantAccount,
  generateTemporaryPassword,
} from '../services/tenant.service';
import {
  findSuperAdminByEmail,
  logSaAction,
  signSaToken,
  verifyPassword,
} from '../services/sa.service';
import { requireSaAuth, type SaRequest } from '../middleware/saAuth';
import {
  saClientPlanSchema,
  saClientStatusSchema,
  saCreateClientSchema,
  saLoginSchema,
  saPromptSchema,
} from '../utils/validators';

const router = Router();

router.post('/login', async (req, res: Response) => {
  const parsed = saLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const { email, password, totpCode } = parsed.data;
  const admin = await findSuperAdminByEmail(email);

  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (admin.totp_secret) {
    const totpValid = totpCode
      ? verifySync({ token: totpCode, secret: admin.totp_secret }).valid
      : false;
    if (!totpValid) {
      res.status(401).json({ error: 'Invalid MFA code', requiresTotp: true });
      return;
    }
  }

  await pool.query(`UPDATE super_admins SET last_login = NOW() WHERE id = $1`, [admin.id]);

  const accessToken = signSaToken({
    sub: admin.id,
    email: admin.email,
    role: 'super_admin',
  });

  res.json({
    accessToken,
    admin: { id: admin.id, email: admin.email, name: admin.name },
    requiresTotp: Boolean(admin.totp_secret),
  });
});

router.use(requireSaAuth);

router.get('/clients', async (req: SaRequest, res: Response) => {
  const result = await pool.query<{
    client_id: string;
    business_name: string;
    owner_name: string;
    email: string;
    country: string;
    plan: string;
    status: string;
    created_at: Date;
    ai_messages_used: number;
    ai_message_limit: number;
    is_suspended: boolean;
    is_blocked: boolean;
  }>(
    `SELECT t.client_id, t.business_name, t.owner_name, t.email, t.country,
            t.plan, t.status, t.created_at,
            COALESCE(cp.ai_messages_used, 0) AS ai_messages_used,
            COALESCE(cp.ai_message_limit, 0) AS ai_message_limit,
            COALESCE(cp.is_suspended, false) AS is_suspended,
            COALESCE(cp.is_blocked, false) AS is_blocked
     FROM tenants t
     LEFT JOIN client_plans cp ON cp.tenant_id = t.id
     ORDER BY t.created_at DESC
     LIMIT 200`
  );

  res.json({
    clients: result.rows.map((row) => ({
      clientId: row.client_id,
      businessName: row.business_name,
      ownerName: row.owner_name,
      email: row.email,
      country: row.country,
      plan: row.plan,
      status: row.status,
      joinedAt: row.created_at,
      aiUsed: row.ai_messages_used,
      aiLimit: row.ai_message_limit,
      isSuspended: row.is_suspended,
      isBlocked: row.is_blocked,
    })),
  });
});

router.post('/clients', async (req: SaRequest, res: Response) => {
  const parsed = saCreateClientSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;
  const temporaryPassword = generateTemporaryPassword();

  try {
    const tenant = await createTenantAccount({
      businessName: data.businessName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      country: data.country,
      plan: data.plan,
      trialDays: data.trialDays,
      password: temporaryPassword,
    });

    await logSaAction(req.saEmail ?? 'unknown', 'create_client', 'tenant', tenant.id, {
      clientId: tenant.clientId,
      email: tenant.email,
      plan: tenant.plan,
    });

    res.status(201).json({
      client: tenant,
      temporaryPassword,
      loginUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/login`,
      message:
        'Share the Client ID, email, and temporary password with the broker. They sign in at /login only.',
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    console.error('SA create client error:', err);
    res.status(500).json({ error: 'Could not create client. Please try again.' });
  }
});

router.get('/stats', async (req: SaRequest, res: Response) => {
  try {
    const result = await pool.query<{
      total_clients: string;
      active_clients: string;
      trial_clients: string;
      ai_messages_today: string;
      meetings_today: string;
    }>(
      `SELECT
         (SELECT COUNT(*)::text FROM tenants) AS total_clients,
         (SELECT COUNT(*)::text FROM tenants t
          JOIN client_plans cp ON cp.tenant_id = t.id
          WHERE cp.is_blocked = false AND cp.is_suspended = false) AS active_clients,
         (SELECT COUNT(*)::text FROM tenants WHERE plan = 'trial') AS trial_clients,
         (SELECT COALESCE(SUM(cp.ai_messages_used), 0)::text FROM client_plans cp) AS ai_messages_today,
         (SELECT COUNT(*)::text FROM meetings m
          WHERE m.scheduled_at::date = CURRENT_DATE AND m.status = 'confirmed') AS meetings_today`
    );

    const row = result.rows[0];
    res.json({
      totalClients: Number(row?.total_clients ?? 0),
      activeClients: Number(row?.active_clients ?? 0),
      trialClients: Number(row?.trial_clients ?? 0),
      totalAiMessagesToday: Number(row?.ai_messages_today ?? 0),
      totalMeetingsToday: Number(row?.meetings_today ?? 0),
    });
  } catch (error) {
    console.error('SA stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/prompt', async (_req: SaRequest, res: Response) => {
  try {
    const result = await pool.query<{ content: string; version: number; created_at: Date }>(
      `SELECT content, version, created_at FROM prompt_versions
       WHERE is_active = true ORDER BY version DESC LIMIT 1`
    );
    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: 'No active prompt found' });
      return;
    }
    res.json({ content: row.content, version: row.version, updatedAt: row.created_at });
  } catch (error) {
    console.error('SA get prompt error:', error);
    res.status(500).json({ error: 'Failed to load prompt' });
  }
});

router.patch('/prompt', async (req: SaRequest, res: Response) => {
  const parsed = saPromptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE prompt_versions SET is_active = false WHERE is_active = true`);

    const versionResult = await client.query<{ next_version: number }>(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM prompt_versions`
    );
    const nextVersion = versionResult.rows[0]?.next_version ?? 1;

    await client.query(
      `INSERT INTO prompt_versions (version, content, created_by, is_active, deployed_at)
       VALUES ($1, $2, $3, true, NOW())`,
      [nextVersion, parsed.data.content, req.saEmail ?? 'admin']
    );

    await client.query('COMMIT');

    await logSaAction(req.saEmail ?? 'unknown', 'update_prompt', 'prompt_versions', null, {
      version: nextVersion,
    });

    res.json({ ok: true, version: nextVersion });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('SA update prompt error:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  } finally {
    client.release();
  }
});

router.patch('/clients/:clientId/status', async (req: SaRequest, res: Response) => {
  const parsed = saClientStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const tenantResult = await pool.query<{ id: string }>(
    `SELECT id FROM tenants WHERE client_id = $1`,
    [req.params.clientId]
  );
  const tenant = tenantResult.rows[0];
  if (!tenant) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  const { action } = parsed.data;

  if (action === 'suspend') {
    await pool.query(
      `UPDATE client_plans SET is_suspended = true, updated_at = NOW() WHERE tenant_id = $1`,
      [tenant.id]
    );
  } else if (action === 'unsuspend') {
    await pool.query(
      `UPDATE client_plans SET is_suspended = false, updated_at = NOW() WHERE tenant_id = $1`,
      [tenant.id]
    );
  } else if (action === 'block') {
    await pool.query(
      `UPDATE client_plans SET is_blocked = true, updated_at = NOW() WHERE tenant_id = $1`,
      [tenant.id]
    );
  } else if (action === 'unblock') {
    await pool.query(
      `UPDATE client_plans SET is_blocked = false, updated_at = NOW() WHERE tenant_id = $1`,
      [tenant.id]
    );
  }

  await logSaAction(req.saEmail ?? 'unknown', `client_${action}`, 'tenant', tenant.id, {
    clientId: req.params.clientId,
  });

  res.json({ ok: true });
});

router.patch('/clients/:clientId/plan', async (req: SaRequest, res: Response) => {
  const parsed = saClientPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const tenantResult = await pool.query<{ id: string }>(
    `SELECT id FROM tenants WHERE client_id = $1`,
    [req.params.clientId]
  );
  const tenant = tenantResult.rows[0];
  if (!tenant) {
    res.status(404).json({ error: 'Client not found' });
    return;
  }

  await pool.query(`UPDATE tenants SET plan = $2, updated_at = NOW() WHERE id = $1`, [
    tenant.id,
    parsed.data.plan,
  ]);
  await pool.query(
    `UPDATE client_plans SET ai_message_limit = $2, updated_at = NOW() WHERE tenant_id = $1`,
    [tenant.id, parsed.data.aiMessageLimit]
  );

  await logSaAction(req.saEmail ?? 'unknown', 'change_plan', 'tenant', tenant.id, {
    clientId: req.params.clientId,
    plan: parsed.data.plan,
    aiMessageLimit: parsed.data.aiMessageLimit,
  });

  res.json({ ok: true });
});

export default router;
