import { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { query } from '../services/supabase.service';

export abstract class BaseRepository {
  /**
   * Executes a SQL query, either using the provided transactional client
   * or falling back to the pooled query runner.
   */
  protected async executeQuery<T extends QueryResultRow = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
    client?: PoolClient
  ): Promise<QueryResult<T>> {
    if (client) {
      return client.query<T>(sql, params);
    }
    return query<T>(sql, params);
  }
}
