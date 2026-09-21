import { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { ScoreRow, LeaderboardRow } from './types';

export class ScoreRepository extends BaseRepository {
  async findByUser(userId: string, limit?: number, client?: PoolClient): Promise<ScoreRow[]> {
    let sql = `SELECT id, stableford_points, course_name, date, created_at
               FROM scores WHERE user_id = $1 ORDER BY date DESC`;
    const params: unknown[] = [userId];

    if (limit) {
      params.push(limit);
      sql += ` LIMIT $${params.length}`;
    }

    const result = await this.executeQuery<ScoreRow>(sql, params, client);
    return result.rows;
  }

  async findByIdAndUser(id: string, userId: string, client?: PoolClient): Promise<ScoreRow | null> {
    const result = await this.executeQuery<ScoreRow>(
      'SELECT id, stableford_points, course_name, date, created_at FROM scores WHERE id = $1 AND user_id = $2',
      [id, userId],
      client
    );
    return result.rows[0] || null;
  }

  async findByUserAndDate(
    userId: string,
    date: string,
    excludeId?: string,
    client?: PoolClient
  ): Promise<ScoreRow | null> {
    let sql = 'SELECT id FROM scores WHERE user_id = $1 AND date = $2';
    const params: unknown[] = [userId, date];

    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $${params.length}`;
    }

    const result = await this.executeQuery<ScoreRow>(sql, params, client);
    return result.rows[0] || null;
  }

  async countByUser(userId: string, client?: PoolClient): Promise<number> {
    const result = await this.executeQuery<{ count: string }>(
      'SELECT COUNT(*) as count FROM scores WHERE user_id = $1',
      [userId],
      client
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async getOldestByUser(userId: string, client?: PoolClient): Promise<ScoreRow | null> {
    const result = await this.executeQuery<ScoreRow>(
      'SELECT id FROM scores WHERE user_id = $1 ORDER BY date ASC LIMIT 1',
      [userId],
      client
    );
    return result.rows[0] || null;
  }

  async create(
    data: { userId: string; stablefordPoints: number; courseName: string; date: string },
    client?: PoolClient
  ): Promise<ScoreRow> {
    const result = await this.executeQuery<ScoreRow>(
      `INSERT INTO scores (user_id, stableford_points, course_name, date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, stableford_points, course_name, date, created_at`,
      [data.userId, data.stablefordPoints, data.courseName, data.date],
      client
    );
    return result.rows?.[0];
  }

  async update(
    id: string,
    userId: string,
    data: { stablefordPoints?: number; courseName?: string; date?: string },
    client?: PoolClient
  ): Promise<ScoreRow | null> {
    const result = await this.executeQuery<ScoreRow>(
      `UPDATE scores
       SET stableford_points = COALESCE($1, stableford_points),
           course_name = COALESCE($2, course_name),
           date = COALESCE($3, date)
       WHERE id = $4 AND user_id = $5
       RETURNING id, stableford_points, course_name, date, created_at`,
      [data.stablefordPoints, data.courseName, data.date, id, userId],
      client
    );
    return result.rows[0] || null;
  }

  async delete(id: string, userId?: string, client?: PoolClient): Promise<boolean> {
    let sql = 'DELETE FROM scores WHERE id = $1';
    const params: unknown[] = [id];

    if (userId) {
      params.push(userId);
      sql += ' AND user_id = $2';
    }

    const result = await this.executeQuery(sql, params, client);
    return (result.rowCount ?? 0) > 0;
  }

  async getLeaderboard(limit = 10, client?: PoolClient): Promise<LeaderboardRow[]> {
    const result = await this.executeQuery<LeaderboardRow>(
      `SELECT u.id as user_id, u.full_name,
              SUM(s.stableford_points) as total_points,
              ROUND(AVG(s.stableford_points)::numeric, 1) as avg_score,
              COUNT(s.id) as score_count
       FROM users u
       JOIN scores s ON u.id = s.user_id
       WHERE u.onboarding_completed = true
       GROUP BY u.id, u.full_name
       HAVING COUNT(s.id) >= 1
       ORDER BY total_points DESC
       LIMIT $1`,
      [limit],
      client
    );
    return result.rows;
  }

  async getScoreFrequency(client?: PoolClient): Promise<Array<{ stableford_points: number; count: string }>> {
    const result = await this.executeQuery<{ stableford_points: number; count: string }>(
      `SELECT stableford_points, COUNT(*) as count
       FROM scores GROUP BY stableford_points ORDER BY stableford_points`,
      [],
      client
    );
    return result.rows;
  }

  async getRankedScoresForUsers(
    userIds: string[],
    limitPerUser = 5,
    client?: PoolClient
  ): Promise<Array<{ user_id: string; stableford_points: number }>> {
    if (userIds.length === 0) return [];
    const result = await this.executeQuery<{ user_id: string; stableford_points: number }>(
      `WITH ranked_scores AS (
         SELECT user_id, stableford_points,
                ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY date DESC) as rn
         FROM scores
         WHERE user_id = ANY($1::uuid[])
       )
       SELECT user_id, stableford_points FROM ranked_scores WHERE rn <= $2
       ORDER BY user_id, rn`,
      [userIds, limitPerUser],
      client
    );
    return result.rows;
  }
}

export const scoreRepository = new ScoreRepository();
