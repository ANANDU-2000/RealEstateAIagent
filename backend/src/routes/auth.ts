import { Router, Request, Response } from 'express';
import { pool } from '../db';
import {
  createSession,
  generateClientId,
  generateRefreshToken,
  hashPassword,
  revokeSession,
  rotateSession,
  signAccessToken,
  verifyPassword,
  findSessionByRefreshToken,
} from '../services/auth.service';
import { authRateLimiter } from '../middleware/rateLimiter';
import { loginSchema, registerSchema, refreshSchema } from '../utils/validators';

const router = Router();

router.use(authRateLimiter);

type TenantRow = {
  id: string;
  email: string;
  password_hash: string;
  plan: string;
  status: string;
};

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const data = parsed.data;

  if (data.country === 'CA' && !data.caslConsent) {
    res.status(400).json({ error: 'WhatsApp consent is required for Canadian accounts' });
    return;
  }

  const existing = await pool.query(`SELECT id FROM tenants WHERE email = $1`, [
    data.email.toLowerCase(),
  ]);
  if (existing.rowCount) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const clientId = await generateClientId(data.country);
    const passwordHash = await hashPassword(data.password);
    const plan = data.plan === 'trial' ? 'trial' : data.plan;

    const tenantResult = await client.query<TenantRow>(
      `INSERT INTO tenants (
        client_id, business_name, owner_name, email, password_hash,
        phone, country, plan, status, trial_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'trial', NOW() + INTERVAL '14 days')
      RETURNING id, email, password_hash, plan, status`,
      [
        clientId,
        data.businessName.trim(),
        data.ownerName.trim(),
        data.email.toLowerCase(),
        passwordHash,
        data.phone?.trim() ?? null,
        data.country,
        plan,
      ]
    );

    const tenant = tenantResult.rows[0];
    if (!tenant) throw new Error('Failed to create tenant');

    await client.query(
      `INSERT INTO broker_settings (tenant_id) VALUES ($1)`,
      [tenant.id]
    );

    const planLimits: Record<string, { ai: number; props: number; team: number }> = {
      starter: { ai: 500, props: 10, team: 1 },
      pro: { ai: 2000, props: 50, team: 3 },
      agency: { ai: 10000, props: 9999, team: 10 },
      trial: { ai: 100, props: 5, team: 1 },
    };
    const limits = planLimits[plan] ?? planLimits.trial;

    await client.query(
      `INSERT INTO client_plans (
        tenant_id, ai_message_limit, max_properties, max_team_members
      ) VALUES ($1, $2, $3, $4)`,
      [tenant.id, limits.ai, limits.props, limits.team]
    );

    await client.query('COMMIT');

    const refreshToken = generateRefreshToken();
    await createSession(tenant.id, refreshToken);

    const accessToken = signAccessToken({
      tenant_id: tenant.id,
      plan: tenant.plan,
      email: tenant.email,
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      tenant: {
        id: tenant.id,
        email: tenant.email,
        plan: tenant.plan,
        clientId,
        businessName: data.businessName,
        ownerName: data.ownerName,
        country: data.country,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const { email, password } = parsed.data;

  const result = await pool.query<TenantRow>(
    `SELECT t.id, t.email, t.password_hash, t.plan, t.status,
            t.business_name, t.owner_name, t.client_id, t.country,
            cp.is_blocked, cp.is_suspended
     FROM tenants t
     LEFT JOIN client_plans cp ON cp.tenant_id = t.id
     WHERE t.email = $1`,
    [email.toLowerCase()]
  );

  const tenant = result.rows[0];

  if (!tenant || !(await verifyPassword(password, tenant.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if ((tenant as TenantRow & { is_blocked?: boolean }).is_blocked) {
    res.status(403).json({ error: 'This account has been blocked. Contact support.' });
    return;
  }

  if ((tenant as TenantRow & { is_suspended?: boolean }).is_suspended) {
    res.status(403).json({ error: 'This account is suspended. Contact support.' });
    return;
  }

  const refreshToken = generateRefreshToken();
  await createSession(tenant.id, refreshToken);

  const accessToken = signAccessToken({
    tenant_id: tenant.id,
    plan: tenant.plan,
    email: tenant.email,
  });

  const row = tenant as TenantRow & {
    business_name: string;
    owner_name: string;
    client_id: string;
    country: string;
  };

  res.json({
    accessToken,
    refreshToken,
    tenant: {
      id: row.id,
      email: row.email,
      plan: row.plan,
      clientId: row.client_id,
      businessName: row.business_name,
      ownerName: row.owner_name,
      country: row.country,
    },
  });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  const session = await findSessionByRefreshToken(parsed.data.refreshToken);
  if (!session) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
    return;
  }

  const tenantResult = await pool.query<TenantRow>(
    `SELECT id, email, plan FROM tenants WHERE id = $1`,
    [session.tenant_id]
  );
  const tenant = tenantResult.rows[0];
  if (!tenant) {
    res.status(401).json({ error: 'Account not found' });
    return;
  }

  const newRefreshToken = generateRefreshToken();
  await rotateSession(parsed.data.refreshToken, tenant.id, newRefreshToken);

  const accessToken = signAccessToken({
    tenant_id: tenant.id,
    plan: tenant.plan,
    email: tenant.email,
  });

  res.json({ accessToken, refreshToken: newRefreshToken });
});

router.post('/logout', async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (parsed.success) {
    await revokeSession(parsed.data.refreshToken);
  }
  res.json({ ok: true });
});

export default router;
