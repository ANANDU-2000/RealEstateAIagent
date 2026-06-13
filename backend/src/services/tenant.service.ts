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

export type DuplicateTenantInput = {
  sourceTenantId: string;
  email: string;
  businessName?: string;
  ownerName?: string;
  password: string;
};

export async function duplicateTenantAccount(
  input: DuplicateTenantInput
): Promise<CreateTenantResult> {
  const existing = await pool.query(`SELECT id FROM tenants WHERE email = $1`, [
    input.email.toLowerCase(),
  ]);
  if (existing.rowCount) {
    throw new Error('EMAIL_EXISTS');
  }

  const sourceResult = await pool.query<{
    id: string;
    business_name: string;
    owner_name: string;
    country: string;
    plan: string;
    trial_expires_at: Date | null;
  }>(
    `SELECT id, business_name, owner_name, country, plan, trial_expires_at
     FROM tenants WHERE id = $1`,
    [input.sourceTenantId]
  );
  const source = sourceResult.rows[0];
  if (!source) {
    throw new Error('SOURCE_NOT_FOUND');
  }

  const settingsResult = await pool.query<Record<string, unknown>>(
    `SELECT office_address, office_city, office_maps_link, reminder_before_visit,
            customer_reminder, customer_reminder_time, ai_name, ai_tone,
            ai_followup_count, ai_followup_gap, no_msg_after_hour,
            language_default, timezone, language, ai_prefs, notification_prefs
     FROM broker_settings WHERE tenant_id = $1`,
    [source.id]
  );
  const settings = settingsResult.rows[0];

  const planResult = await pool.query<{
    ai_message_limit: number;
    max_properties: number;
    max_photos_per_property: number;
    max_team_members: number;
    max_storage_mb: number;
    can_use_instagram: boolean;
    can_use_custom_persona: boolean;
    can_use_api: boolean;
    can_upload_documents: boolean;
    can_white_label: boolean;
    can_use_video: boolean;
    monthly_price_paise: number | null;
    monthly_price_currency: string | null;
  }>(
    `SELECT ai_message_limit, max_properties, max_photos_per_property, max_team_members,
            max_storage_mb, can_use_instagram, can_use_custom_persona, can_use_api,
            can_upload_documents, can_white_label, can_use_video,
            monthly_price_paise, monthly_price_currency
     FROM client_plans WHERE tenant_id = $1`,
    [source.id]
  );
  const planRow = planResult.rows[0];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const clientId = await generateClientId(source.country as 'IN' | 'AE' | 'CA');
    const passwordHash = await hashPassword(input.password);
    const businessName = input.businessName?.trim() || `${source.business_name} (Copy)`;
    const ownerName = input.ownerName?.trim() || source.owner_name;

    const tenantResult = await client.query<{
      id: string;
      email: string;
      plan: string;
    }>(
      `INSERT INTO tenants (
        client_id, business_name, owner_name, email, password_hash,
        phone, country, plan, status, trial_expires_at
      ) VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, 'trial', $8)
      RETURNING id, email, plan`,
      [
        clientId,
        businessName,
        ownerName,
        input.email.toLowerCase(),
        passwordHash,
        source.country,
        source.plan,
        source.trial_expires_at,
      ]
    );

    const tenant = tenantResult.rows[0];
    if (!tenant) throw new Error('CREATE_FAILED');

    if (settings) {
      await client.query(
        `INSERT INTO broker_settings (
          tenant_id, office_address, office_city, office_maps_link,
          reminder_before_visit, customer_reminder, customer_reminder_time,
          ai_name, ai_tone, ai_followup_count, ai_followup_gap, no_msg_after_hour,
          language_default, timezone, language, ai_prefs, notification_prefs
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          tenant.id,
          settings.office_address ?? null,
          settings.office_city ?? null,
          settings.office_maps_link ?? null,
          settings.reminder_before_visit ?? '1hr',
          settings.customer_reminder ?? true,
          settings.customer_reminder_time ?? '1hr',
          settings.ai_name ?? 'Arjun',
          settings.ai_tone ?? 'friendly',
          settings.ai_followup_count ?? 2,
          settings.ai_followup_gap ?? 'next_morning',
          settings.no_msg_after_hour ?? 21,
          settings.language_default ?? 'english',
          settings.timezone ?? 'Asia/Kolkata',
          settings.language ?? 'en',
          settings.ai_prefs ?? {},
          settings.notification_prefs ?? {},
        ]
      );
    } else {
      await client.query(`INSERT INTO broker_settings (tenant_id) VALUES ($1)`, [tenant.id]);
    }

    const limits = planRow ?? {
      ai_message_limit: 100,
      max_properties: 5,
      max_photos_per_property: 5,
      max_team_members: 1,
      max_storage_mb: 500,
      can_use_instagram: false,
      can_use_custom_persona: false,
      can_use_api: false,
      can_upload_documents: false,
      can_white_label: false,
      can_use_video: false,
      monthly_price_paise: null,
      monthly_price_currency: 'INR',
    };

    await client.query(
      `INSERT INTO client_plans (
        tenant_id, ai_message_limit, ai_messages_used, max_properties,
        max_photos_per_property, max_team_members, max_storage_mb,
        can_use_instagram, can_use_custom_persona, can_use_api,
        can_upload_documents, can_white_label, can_use_video,
        monthly_price_paise, monthly_price_currency
      ) VALUES ($1, $2, 0, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        tenant.id,
        limits.ai_message_limit,
        limits.max_properties,
        limits.max_photos_per_property,
        limits.max_team_members,
        limits.max_storage_mb,
        limits.can_use_instagram,
        limits.can_use_custom_persona,
        limits.can_use_api,
        limits.can_upload_documents,
        limits.can_white_label,
        limits.can_use_video,
        limits.monthly_price_paise,
        limits.monthly_price_currency ?? 'INR',
      ]
    );

    await client.query('COMMIT');

    return {
      id: tenant.id,
      clientId,
      email: tenant.email,
      plan: tenant.plan,
      businessName,
      ownerName,
      country: source.country,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
