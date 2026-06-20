import dotenv from 'dotenv';
import { pool } from './index';
import { seedPromptIfNeeded } from './seed-prompt';

dotenv.config();

async function main(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await seedPromptIfNeeded(client);
    await client.query('COMMIT');
    console.log('Prompt seed completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Prompt seed failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
