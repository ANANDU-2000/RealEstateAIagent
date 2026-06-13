import { Pool, PoolConfig } from 'pg';

const connectionString = process.env.DATABASE_URL ?? '';
const requiresSsl =
  process.env.NODE_ENV === 'production' ||
  connectionString.includes('render.com') ||
  connectionString.includes('sslmode=require');

const poolConfig: PoolConfig = {
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (requiresSsl) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(poolConfig);

export async function testDbConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('DB connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
}
