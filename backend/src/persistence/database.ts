import {
  Pool,
  type PoolClient,
  type QueryResult,
  type QueryResultRow,
} from 'pg';

let pool: Pool | undefined;

export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured.');

    pool = new Pool({
      connectionString,
      max: Number.parseInt(process.env.DB_POOL_MAX ?? '5', 10),
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  return pool;
};

export const query = <T extends QueryResultRow>(
  text: string,
  values?: unknown[],
) => getPool().query<T>(text, values);

export const transaction = async <T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
};

export type Database = {
  query: <T extends QueryResultRow>(
    text: string,
    values?: unknown[],
  ) => Promise<QueryResult<T>>;
  transaction: <T>(work: (client: PoolClient) => Promise<T>) => Promise<T>;
};

export const database: Database = { query, transaction };
