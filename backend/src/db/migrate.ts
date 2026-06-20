import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { pool } from './index';
import { seedPromptIfNeeded } from './seed-prompt';

dotenv.config();

function findSchemaPath(): string {
  const candidates = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '..', '..', 'src', 'db', 'schema.sql'),
  ];
  const schemaPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!schemaPath) {
    throw new Error('schema.sql not found');
  }
  return schemaPath;
}

function findMigrationsDir(): string | null {
  const candidates = [
    path.join(__dirname, 'migrations'),
    path.join(__dirname, '..', '..', 'src', 'db', 'migrations'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

export async function runMigrations(): Promise<void> {
  const schemaPath = findSchemaPath();
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(sql);

    const migrationsDir = findMigrationsDir();
    if (migrationsDir) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(migrationSql);
        console.log(`Applied migration: ${file}`);
      }
    }

    await seedPromptIfNeeded(client);

    await client.query('COMMIT');
    console.log('Database migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error instanceof Error ? error.message : error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
