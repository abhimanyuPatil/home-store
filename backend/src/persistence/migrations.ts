import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { getPool } from './database.js';

const migrationDirectory = path.resolve(process.cwd(), 'migrations');

export const migrate = async (): Promise<void> => {
  const migration = await readFile(
    path.join(migrationDirectory, '001_initial.sql'),
    'utf8',
  );
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await client.query(migration);
    await client.query(
      'INSERT INTO schema_migrations(version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
      ['001_initial'],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
