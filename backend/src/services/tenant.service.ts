import crypto from 'crypto';
import { pool } from '../db';
import { generateClientId, hashPassword } from './auth.service';

export type CreateTenantInput = {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  country: 'IN' | 'AE' | 'CA';
  plan: 'starter' | 'pro' | 'agency' | 'trial';
  trialDays?: number;
};

export type CreateTenantResult = {
  id: string;
  clientId: string;
  email: string;
  plan: string;
  businessName: string;
  ownerName: string;
  country: string;
};

const PLAN_LIMITS: Record<string, { ai: number; props: number; team: number }> = {
  starter: { ai: 500, props: 10, team: 1 },
  pro: { ai: 2000, props: 50, team: 3 },
  agency: { ai: 10000, props: 9999, team: 10 },
  trial: { ai: 100, props: 5, team: 1 },
};

export function generateTemporaryPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@';
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i]! % chars.length];
  }
  return result;
}

export async function createTenantAccount(
  input: CreateTenantInput
): Promise<CreateTenantResult> {
  const trialDays = input.trialDays ?? 14;
  const plan = input.plan === 'trial' ? 'trial' : input.plan;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.trial;

  const existing = await pool.query(`SELECT id FROM tenants WHERE email = $1`, [
    input.email.toLowerCase(),
  ]);
  if (existing.rowCount) {
    throw new Error('EMAIL_EXISTS');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const clientId = await generateClientId(input.country);
    const passwordHash = await hashPassword(input.password);

    const tenantResult = await client.query<{
      id: string;
      email: string;
      plan: string;
    }>(
      `INSERT INTO tenants (
        client_id, business_name, owner_name, email, password_hash,
        phone, country, plan, status, trial_expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'trial', NOW() + ($9 || ' days')::INTERVAL)
      RETURNING id, email, plan`,
      [
        clientId,
        input.businessName.trim(),
        input.ownerName.trim(),
        input.email.toLowerCase(),
        passwordHash,
        input.phone?.trim() ?? null,
        input.country,
        plan,
        String(trialDays),
      ]
    );

    const tenant = tenantResult.rows[0];
    if (!tenant) throw new Error('CREATE_FAILED');

    await client.query(`INSERT INTO broker_settings (tenant_id) VALUES ($1)`, [tenant.id]);

    await client.query(
      `INSERT INTO client_plans (
        tenant_id, ai_message_limit, max_properties, max_team_members
      ) VALUES ($1, $2, $3, $4)`,
      [tenant.id, limits.ai, limits.props, limits.team]
    );

    await client.query('COMMIT');

    return {
      id: tenant.id,
      clientId,
      email: tenant.email,
      plan: tenant.plan,
      businessName: input.businessName.trim(),
      ownerName: input.ownerName.trim(),
      country: input.country,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
