import { Router, Request, Response } from 'express';
import { pool } from '../db';
import {
  createSession,
  generateRefreshToken,
  revokeSession,
  rotateSession,
  signAccessToken,
  verifyPassword,
  findSessionByRefreshToken,
} from '../services/auth.service';
import { createTenantAccount } from '../services/tenant.service';
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
  if (process.env.ALLOW_PUBLIC_SIGNUP !== 'true') {
    res.status(403).json({
      error:
        'Public signup is disabled. Your PropAgent admin will create your account and share your Client ID.',
    });
    return;
  }

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

  try {
    const tenant = await createTenantAccount({
      businessName: data.businessName,
      ownerName: data.ownerName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      country: data.country,
      plan: data.plan,
    });

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
        clientId: tenant.clientId,
        businessName: tenant.businessName,
        ownerName: tenant.ownerName,
        country: tenant.country,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
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
