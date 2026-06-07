import { Router, Response } from 'express';
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
import { saCreateClientSchema, saLoginSchema } from '../utils/validators';

const router = Router();

router.post('/login', async (req, res: Response) => {
  const parsed = saLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const { email, password } = parsed.data;
  const admin = await findSuperAdminByEmail(email);

  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
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
  }>(
    `SELECT t.client_id, t.business_name, t.owner_name, t.email, t.country,
            t.plan, t.status, t.created_at,
            COALESCE(cp.ai_messages_used, 0) AS ai_messages_used,
            COALESCE(cp.ai_message_limit, 0) AS ai_message_limit
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

export default router;
