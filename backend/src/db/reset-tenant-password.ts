import dotenv from 'dotenv';
dotenv.config();
import { pool } from './index';
import { hashPassword } from '../services/auth.service';

async function main(): Promise<void> {
  const email = process.argv[2]?.toLowerCase();
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: ts-node src/db/reset-tenant-password.ts <email> <newPassword>');
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const result = await pool.query(
    `UPDATE tenants SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING email, client_id`,
    [hash, email]
  );

  if (!result.rowCount) {
    console.error(`No tenant found for ${email}`);
    process.exit(1);
  }

  console.log(`Password updated for ${result.rows[0].email} (client ${result.rows[0].client_id})`);
  await pool.end();
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
