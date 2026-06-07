import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../db';

export type SaTokenPayload = {
  sub: string;
  email: string;
  role: 'super_admin';
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signSaToken(payload: SaTokenPayload): string {
  const secret = process.env.SA_JWT_SECRET;
  if (!secret) throw new Error('SA_JWT_SECRET is not configured');
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

export function verifySaToken(token: string): SaTokenPayload {
  const secret = process.env.SA_JWT_SECRET;
  if (!secret) throw new Error('SA_JWT_SECRET is not configured');
  return jwt.verify(token, secret) as SaTokenPayload;
}

export async function findSuperAdminByEmail(
  email: string
): Promise<{ id: string; email: string; password_hash: string; name: string | null } | null> {
  const result = await pool.query<{
    id: string;
    email: string;
    password_hash: string;
    name: string | null;
  }>(
    `SELECT id, email, password_hash, name FROM super_admins
     WHERE email = $1 AND is_active = true`,
    [email.toLowerCase()]
  );
  return result.rows[0] ?? null;
}

export async function logSaAction(
  adminEmail: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown>
): Promise<void> {
  await pool.query(
    `INSERT INTO sa_audit_log (admin_email, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminEmail, action, targetType, targetId, JSON.stringify(details)]
  );
}
