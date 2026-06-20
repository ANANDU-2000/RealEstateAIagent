import dotenv from 'dotenv';
dotenv.config();
import { pool } from './index';
import { hashPassword } from '../services/sa.service';

async function main(): Promise<void> {
  const email = process.argv[2]?.toLowerCase();
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: ts-node src/db/reset-superadmin-password.ts <email> <newPassword>');
    process.exit(1);
  }

  const hash = await hashPassword(password);
  const result = await pool.query(
    `UPDATE super_admins SET password_hash = $1 WHERE email = $2 RETURNING email`,
    [hash, email]
  );

  if (!result.rowCount) {
    console.error(`No super admin found for ${email}`);
    process.exit(1);
  }

  console.log(`Super Admin password updated for ${result.rows[0].email}`);
  await pool.end();
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
