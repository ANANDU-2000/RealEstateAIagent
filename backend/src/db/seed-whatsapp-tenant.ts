/**
 * One-time: save Meta WhatsApp credentials for a tenant (broker_settings).
 * Usage: npx ts-node src/db/seed-whatsapp-tenant.ts <email> <accessToken> <phoneNumberId> <wabaId> [whatsappNumber]
 */
import dotenv from 'dotenv';
dotenv.config();

import { pool } from './index';

async function main(): Promise<void> {
  const email = process.argv[2]?.toLowerCase();
  const accessToken = process.argv[3];
  const phoneNumberId = process.argv[4] ?? null;
  const wabaId = process.argv[5] ?? null;
  const whatsappNumber = process.argv[6];

  if (!email || !accessToken) {
    console.error(
      'Usage: ts-node src/db/seed-whatsapp-tenant.ts <email> <accessToken> [phoneNumberId] [wabaId] [whatsappNumber]'
    );
    process.exit(1);
  }

  const tenant = await pool.query<{ id: string }>(
    `SELECT id FROM tenants WHERE email = $1`,
    [email]
  );

  const tenantId = tenant.rows[0]?.id;
  if (!tenantId) {
    console.error(`No tenant found for ${email}`);
    process.exit(1);
  }

  await pool.query(
    `INSERT INTO broker_settings (tenant_id)
     VALUES ($1)
     ON CONFLICT (tenant_id) DO NOTHING`,
    [tenantId]
  );

  const connected = Boolean(phoneNumberId && accessToken);

  await pool.query(
    `UPDATE broker_settings
     SET meta_access_token = $1,
         meta_phone_number_id = COALESCE($2, meta_phone_number_id),
         meta_waba_id = COALESCE($3, meta_waba_id),
         whatsapp_number = COALESCE($4, whatsapp_number),
         whatsapp_connected = $5,
         whatsapp_connected_at = CASE
           WHEN $5 = true AND COALESCE(whatsapp_connected, false) = false THEN NOW()
           ELSE whatsapp_connected_at
         END,
         updated_at = NOW()
     WHERE tenant_id = $6`,
    [
      accessToken,
      phoneNumberId,
      wabaId,
      whatsappNumber ?? null,
      connected,
      tenantId,
    ]
  );

  console.log(`WhatsApp credentials saved for ${email}`);
  await pool.end();
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
