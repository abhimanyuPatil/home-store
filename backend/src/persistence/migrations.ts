import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { getPool } from './database.js';

const migrationDirectory = path.resolve(process.cwd(), 'migrations');
const migrationFilePattern = /^(\d+)_([a-z0-9-]+)\.sql$/i;
const migrationLockKey = 'home-store-schema-migrations';

type MigrationFile = {
  version: string;
  path: string;
};

const getMigrationFiles = async (): Promise<MigrationFile[]> => {
  const entries = await readdir(migrationDirectory, { withFileTypes: true });
  const migrations = entries.flatMap((entry) => {
    if (!entry.isFile()) return [];
    const match = migrationFilePattern.exec(entry.name);
    if (!match) return [];
    return [
      {
        version: entry.name.replace(/\.sql$/i, ''),
        path: path.join(migrationDirectory, entry.name),
      },
    ];
  });

  migrations.sort((left, right) => left.version.localeCompare(right.version));

  const versions = new Set<string>();
  for (const migration of migrations) {
    if (versions.has(migration.version)) {
      throw new Error(`Duplicate migration version: ${migration.version}`);
    }
    versions.add(migration.version);
  }

  return migrations;
};

export const migrate = async (): Promise<void> => {
  const migrations = await getMigrationFiles();
  const client = await getPool().connect();

  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [
      migrationLockKey,
    ]);
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const appliedResult = await client.query<{ version: string }>(
      'SELECT version FROM schema_migrations',
    );
    const appliedVersions = new Set(
      appliedResult.rows.map((row) => row.version),
    );

    for (const migrationFile of migrations) {
      if (appliedVersions.has(migrationFile.version)) continue;

      const migration = await readFile(migrationFile.path, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(migration);
        await client.query(
          'INSERT INTO schema_migrations(version) VALUES ($1)',
          [migrationFile.version],
        );
        await client.query('COMMIT');
        console.info(`Applied database migration ${migrationFile.version}.`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } catch (error) {
    throw error;
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [
      migrationLockKey,
    ]);
    client.release();
  }
};
