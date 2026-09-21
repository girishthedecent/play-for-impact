import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { serverConfig } from '../config';

const pool = new Pool({
  connectionString: serverConfig.databaseUrl,
  ssl: serverConfig.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
});

export const query = async <T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> => {
  const client = await pool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export default pool;
