/**
 * One-time: create the first Super Admin user.
 * Usage: npx ts-node src/db/seed-superadmin.ts admin@propagent.com YourSecurePassword "Admin Name"
 */
import dotenv from 'dotenv';
dotenv.config();

import { pool } from './index';
import { hashPassword } from '../services/sa.service';

async function main(): Promise<void> {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] ?? 'Super Admin';

  if (!email || !password) {
    console.error('Usage: ts-node src/db/seed-superadmin.ts <email> <password> [name]');
    process.exit(1);
  }

  const existing = await pool.query(`SELECT id FROM super_admins WHERE email = $1`, [
    email.toLowerCase(),
  ]);
  if (existing.rowCount) {
    console.log('Super Admin already exists for this email.');
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  await pool.query(
    `INSERT INTO super_admins (email, password_hash, name, role, is_active)
     VALUES ($1, $2, $3, 'super_admin', true)`,
    [email.toLowerCase(), passwordHash, name]
  );

  console.log(`Super Admin created: ${email}`);
  await pool.end();
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
