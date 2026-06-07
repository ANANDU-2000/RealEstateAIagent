import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { pool } from '../db';

const SALT_ROUNDS = 12;

export type AccessTokenPayload = {
  tenant_id: string;
  plan: string;
  email: string;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  const expiresIn = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return jwt.verify(token, secret) as AccessTokenPayload;
}

export async function generateClientId(country: string): Promise<string> {
  const prefixMap: Record<string, string> = {
    IN: 'PA-IN',
    AE: 'PA-AE',
    CA: 'PA-CA',
  };
  const prefix = prefixMap[country] ?? 'PA-IN';

  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM tenants WHERE country = $1`,
    [country]
  );
  const seq = String(Number(result.rows[0]?.count ?? 0) + 1).padStart(4, '0');
  return `${prefix}-${seq}`;
}

export async function createSession(
  tenantId: string,
  refreshToken: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await pool.query(
    `INSERT INTO sessions (tenant_id, refresh_token, expires_at)
     VALUES ($1, $2, $3)`,
    [tenantId, hashToken(refreshToken), expiresAt]
  );
}

export async function revokeSession(refreshToken: string): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE refresh_token = $1`, [
    hashToken(refreshToken),
  ]);
}

export async function rotateSession(
  oldRefreshToken: string,
  tenantId: string,
  newRefreshToken: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM sessions WHERE refresh_token = $1`, [
      hashToken(oldRefreshToken),
    ]);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await client.query(
      `INSERT INTO sessions (tenant_id, refresh_token, expires_at) VALUES ($1, $2, $3)`,
      [tenantId, hashToken(newRefreshToken), expiresAt]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function findSessionByRefreshToken(
  refreshToken: string
): Promise<{ tenant_id: string; expires_at: Date } | null> {
  const result = await pool.query<{ tenant_id: string; expires_at: Date }>(
    `SELECT tenant_id, expires_at FROM sessions
     WHERE refresh_token = $1 AND expires_at > NOW()`,
    [hashToken(refreshToken)]
  );
  return result.rows[0] ?? null;
}
