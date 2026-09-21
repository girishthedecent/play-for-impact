import { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { WinnerProofRow } from './types';

export interface WinnerDetail {
  id: string;
  match_count: number;
  prize_amount: number;
  winner_status: string;
  draw_date: string;
  winning_numbers: number[];
  full_name: string;
  email: string;
  image_url: string | null;
  image_type?: string | null;
  image_size?: number | null;
  rejection_reason: string | null;
  verified_at: string | null;
}

export class WinnerRepository extends BaseRepository {
  async getMyWinnings(userId: string, client?: PoolClient): Promise<WinnerDetail[]> {
    const result = await this.executeQuery<WinnerDetail>(
      `SELECT de.id, de.match_count, de.prize_amount, de.winner_status,
              d.draw_date, d.winning_numbers, u.full_name, u.email,
              wp.image_url, wp.rejection_reason, wp.verified_at
       FROM draw_entries de
       JOIN draws d ON de.draw_id = d.id
       JOIN users u ON de.user_id = u.id
       LEFT JOIN winner_proofs wp ON de.id = wp.draw_entry_id
       WHERE de.user_id = $1 AND de.prize_amount > 0
       ORDER BY d.draw_date DESC`,
      [userId],
      client
    );
    return result.rows;
  }

  async getAllWinners(client?: PoolClient): Promise<WinnerDetail[]> {
    const result = await this.executeQuery<WinnerDetail>(
      `SELECT de.id, de.match_count, de.prize_amount, de.winner_status,
              d.draw_date, d.winning_numbers, u.full_name, u.email,
              wp.image_url, wp.rejection_reason, wp.verified_at
       FROM draw_entries de
       JOIN draws d ON de.draw_id = d.id
       JOIN users u ON de.user_id = u.id
       LEFT JOIN winner_proofs wp ON de.id = wp.draw_entry_id
       WHERE de.prize_amount > 0
       ORDER BY d.draw_date DESC, de.prize_amount DESC`,
      [],
      client
    );
    return result.rows;
  }

  async getWinnerById(id: string, client?: PoolClient): Promise<WinnerDetail | null> {
    const result = await this.executeQuery<WinnerDetail>(
      `SELECT de.id, de.match_count, de.prize_amount, de.winner_status,
              d.draw_date, d.winning_numbers, u.full_name, u.email,
              wp.image_url, wp.image_type, wp.image_size, wp.rejection_reason, wp.verified_at
       FROM draw_entries de
       JOIN draws d ON de.draw_id = d.id
       JOIN users u ON de.user_id = u.id
       LEFT JOIN winner_proofs wp ON de.id = wp.draw_entry_id
       WHERE de.id = $1`,
      [id],
      client
    );
    return result.rows[0] || null;
  }

  async getProofByDrawEntryId(drawEntryId: string, client?: PoolClient): Promise<WinnerProofRow | null> {
    const result = await this.executeQuery<WinnerProofRow>(
      'SELECT id, draw_entry_id, user_id, image_url, image_type, image_size, created_at FROM winner_proofs WHERE draw_entry_id = $1',
      [drawEntryId],
      client
    );
    return result.rows[0] || null;
  }

  async createProof(
    data: { drawEntryId: string; userId: string; imageUrl: string; imageType: string; imageSize: number },
    client?: PoolClient
  ): Promise<WinnerProofRow> {
    const result = await this.executeQuery<WinnerProofRow>(
      `INSERT INTO winner_proofs (draw_entry_id, user_id, image_url, image_type, image_size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, draw_entry_id, user_id, image_url, image_type, image_size, created_at`,
      [data.drawEntryId, data.userId, data.imageUrl, data.imageType, data.imageSize],
      client
    );
    return result.rows[0];
  }

  async approveWinner(drawEntryId: string, adminId?: string, client?: PoolClient): Promise<void> {
    await this.executeQuery(
      `UPDATE draw_entries SET winner_status = 'approved' WHERE id = $1`,
      [drawEntryId],
      client
    );
    await this.executeQuery(
      `UPDATE winner_proofs SET verified_by = $1, verified_at = NOW() WHERE draw_entry_id = $2`,
      [adminId || null, drawEntryId],
      client
    );
  }

  async rejectWinner(drawEntryId: string, reason: string, adminId?: string, client?: PoolClient): Promise<void> {
    await this.executeQuery(
      `UPDATE draw_entries SET winner_status = 'rejected' WHERE id = $1`,
      [drawEntryId],
      client
    );
    await this.executeQuery(
      `UPDATE winner_proofs SET rejection_reason = $1, verified_by = $2, verified_at = NOW() WHERE draw_entry_id = $3`,
      [reason || 'No reason provided', adminId || null, drawEntryId],
      client
    );
  }

  async markPaid(drawEntryId: string, client?: PoolClient): Promise<void> {
    await this.executeQuery(
      `UPDATE draw_entries SET winner_status = 'paid' WHERE id = $1`,
      [drawEntryId],
      client
    );
  }

  async countPaidWinners(client?: PoolClient): Promise<number> {
    const result = await this.executeQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM draw_entries WHERE prize_amount > 0 AND winner_status = 'paid'",
      [],
      client
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}

export const winnerRepository = new WinnerRepository();
