import { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { DrawRow, DrawEntryRow } from './types';

export class DrawRepository extends BaseRepository {
  async findAll(status?: string, client?: PoolClient): Promise<DrawRow[]> {
    let sql = `SELECT id, draw_date, winning_numbers, prize_pool, jackpot_rollover, status, created_at
               FROM draws`;
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      sql += ` WHERE status = $1`;
    }

    sql += ' ORDER BY draw_date DESC';

    const result = await this.executeQuery<DrawRow>(sql, params, client);
    return result.rows;
  }

  async findById(id: string, client?: PoolClient): Promise<DrawRow | null> {
    const result = await this.executeQuery<DrawRow>(
      `SELECT id, draw_date, winning_numbers, prize_pool, jackpot_rollover, status, created_at
       FROM draws WHERE id = $1`,
      [id],
      client
    );
    return result.rows[0] || null;
  }

  async findByIdForUpdate(id: string, client: PoolClient): Promise<DrawRow | null> {
    const result = await this.executeQuery<DrawRow>(
      'SELECT id, status, winning_numbers, prize_pool, jackpot_rollover FROM draws WHERE id = $1 FOR UPDATE',
      [id],
      client
    );
    return result.rows[0] || null;
  }

  async findByDate(drawDate: string, client?: PoolClient): Promise<DrawRow | null> {
    const result = await this.executeQuery<DrawRow>(
      'SELECT id, draw_date, winning_numbers, prize_pool, jackpot_rollover, status FROM draws WHERE draw_date = $1',
      [drawDate],
      client
    );
    return result.rows[0] || null;
  }

  async findUpcoming(client?: PoolClient): Promise<DrawRow[]> {
    const result = await this.executeQuery<DrawRow>(
      `SELECT id, draw_date, winning_numbers, prize_pool, jackpot_rollover, status, created_at
       FROM draws WHERE status IN ('pending', 'active') ORDER BY draw_date ASC`,
      [],
      client
    );
    return result.rows;
  }

  async findRecent(limit = 10, client?: PoolClient): Promise<DrawRow[]> {
    const result = await this.executeQuery<DrawRow>(
      `SELECT id, draw_date, winning_numbers, prize_pool, jackpot_rollover, status, algorithm, created_at
       FROM draws ORDER BY draw_date DESC LIMIT $1`,
      [limit],
      client
    );
    return result.rows;
  }

  async getLatestCompletedRollover(client?: PoolClient): Promise<number> {
    const result = await this.executeQuery<{ jackpot_rollover: string }>(
      `SELECT jackpot_rollover FROM draws WHERE status = 'completed' ORDER BY draw_date DESC LIMIT 1`,
      [],
      client
    );
    return parseFloat(result.rows[0]?.jackpot_rollover || '0');
  }

  async create(
    data: { drawDate: string; prizePool: number; jackpotRollover: number; status?: string },
    client?: PoolClient
  ): Promise<DrawRow> {
    const result = await this.executeQuery<DrawRow>(
      `INSERT INTO draws (draw_date, prize_pool, jackpot_rollover, status)
       VALUES ($1, $2, $3, COALESCE($4, 'pending'))
       RETURNING id, draw_date, winning_numbers, prize_pool, jackpot_rollover, status, created_at`,
      [data.drawDate, data.prizePool, data.jackpotRollover, data.status || 'pending'],
      client
    );
    return result.rows[0];
  }

  async updateWinningNumbers(
    id: string,
    winningNumbers: number[],
    algorithm: string,
    client?: PoolClient
  ): Promise<void> {
    await this.executeQuery(
      'UPDATE draws SET winning_numbers = $1, algorithm = $2 WHERE id = $3',
      [winningNumbers, algorithm, id],
      client
    );
  }

  async updateStatusAndRollover(
    id: string,
    status: string,
    rollover: number,
    client?: PoolClient
  ): Promise<void> {
    await this.executeQuery(
      'UPDATE draws SET status = $1, jackpot_rollover = $2 WHERE id = $3',
      [status, rollover, id],
      client
    );
  }

  async countCompleted(client?: PoolClient): Promise<number> {
    const result = await this.executeQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM draws WHERE status = 'completed'",
      [],
      client
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async getTotalPrizePool(status?: string, client?: PoolClient): Promise<number> {
    let sql = 'SELECT COALESCE(SUM(prize_pool), 0) as total FROM draws';
    const params: unknown[] = [];

    if (status) {
      params.push(status);
      sql = 'SELECT COALESCE(SUM(prize_pool + jackpot_rollover), 0) as total FROM draws WHERE status = $1';
    }

    const result = await this.executeQuery<{ total: string }>(sql, params, client);
    return parseFloat(result.rows[0]?.total || '0');
  }

  async getUserEntries(userId: string, client?: PoolClient): Promise<DrawEntryRow[]> {
    const result = await this.executeQuery<DrawEntryRow>(
      `SELECT de.id, de.draw_id, de.user_id, de.entry_numbers, de.match_count, de.prize_amount, de.winner_status,
              de.created_at, d.draw_date, d.winning_numbers, d.status as draw_status
       FROM draw_entries de JOIN draws d ON de.draw_id = d.id
       WHERE de.user_id = $1 ORDER BY d.draw_date DESC`,
      [userId],
      client
    );
    return result.rows;
  }

  async getDrawEntries(
    drawId: string,
    anonymized = false,
    client?: PoolClient
  ): Promise<DrawEntryRow[]> {
    let sql: string;
    if (anonymized) {
      sql = `SELECT de.id, de.draw_id, de.user_id, de.entry_numbers, de.match_count, de.prize_amount, de.winner_status, de.created_at
             FROM draw_entries de
             WHERE de.draw_id = $1 ORDER BY de.match_count DESC, de.prize_amount DESC`;
    } else {
      sql = `SELECT de.id, de.draw_id, de.user_id, de.entry_numbers, de.match_count, de.prize_amount, de.winner_status,
                    de.created_at, u.full_name, u.email
             FROM draw_entries de
             JOIN users u ON de.user_id = u.id
             WHERE de.draw_id = $1 ORDER BY de.match_count DESC, de.prize_amount DESC`;
    }

    const result = await this.executeQuery<DrawEntryRow>(sql, [drawId], client);
    return result.rows;
  }

  async findEntryById(id: string, client?: PoolClient): Promise<DrawEntryRow | null> {
    const result = await this.executeQuery<DrawEntryRow>(
      `SELECT id, draw_id, user_id, entry_numbers, match_count, prize_amount, winner_status, created_at
       FROM draw_entries WHERE id = $1`,
      [id],
      client
    );
    return result.rows[0] || null;
  }

  async batchInsertEntries(
    entries: Array<{
      drawId: string;
      userId: string;
      entryNumbers: number[];
      matchCount: number;
      prizeAmount: number;
      winnerStatus: string;
    }>,
    client: PoolClient
  ): Promise<void> {
    for (const entry of entries) {
      await client.query(
        `INSERT INTO draw_entries (draw_id, user_id, entry_numbers, match_count, prize_amount, winner_status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [entry.drawId, entry.userId, entry.entryNumbers, entry.matchCount, entry.prizeAmount, entry.winnerStatus]
      );
    }
  }

  async updatePrizeForMatchCount(
    drawId: string,
    matchCount: number,
    prizeAmount: number,
    client: PoolClient
  ): Promise<void> {
    await client.query(
      `UPDATE draw_entries SET prize_amount = $1 WHERE draw_id = $2 AND match_count = $3`,
      [prizeAmount, drawId, matchCount]
    );
  }

  async getWinnersWithCharity(
    drawId: string,
    client: PoolClient
  ): Promise<Array<{ id: string; user_id: string; prize_amount: number; selected_charity_id: string | null; charity_contribution_percent: number }>> {
    const result = await client.query<{
      id: string;
      user_id: string;
      prize_amount: number;
      selected_charity_id: string | null;
      charity_contribution_percent: number;
    }>(
      `SELECT de.id, de.user_id, de.prize_amount, u.selected_charity_id, u.charity_contribution_percent
       FROM draw_entries de JOIN users u ON de.user_id = u.id
       WHERE de.draw_id = $1 AND de.prize_amount > 0 AND u.selected_charity_id IS NOT NULL`,
      [drawId]
    );
    return result.rows;
  }

  async updateEntryWinnerStatus(id: string, status: string, client?: PoolClient): Promise<void> {
    await this.executeQuery(
      'UPDATE draw_entries SET winner_status = $1 WHERE id = $2',
      [status, id],
      client
    );
  }
}

export const drawRepository = new DrawRepository();
