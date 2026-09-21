import { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { CharityRow, DonationRow } from './types';

export class CharityRepository extends BaseRepository {
  async findAll(activeOnly = true, client?: PoolClient): Promise<CharityRow[]> {
    let sql = `SELECT id, name, description, website, image_url, total_raised, is_active, created_at
               FROM charities`;
    if (activeOnly) {
      sql += ' WHERE is_active = true';
    }
    sql += ' ORDER BY name ASC';

    const result = await this.executeQuery<CharityRow>(sql, [], client);
    return result.rows;
  }

  async findById(id: string, activeOnly = false, client?: PoolClient): Promise<CharityRow | null> {
    let sql = `SELECT id, name, description, website, image_url, total_raised, is_active, created_at
               FROM charities WHERE id = $1`;
    if (activeOnly) {
      sql += ' AND is_active = true';
    }

    const result = await this.executeQuery<CharityRow>(sql, [id], client);
    return result.rows[0] || null;
  }

  async create(
    data: { name: string; description?: string | null; website?: string | null; imageUrl?: string | null },
    client?: PoolClient
  ): Promise<CharityRow> {
    const result = await this.executeQuery<CharityRow>(
      `INSERT INTO charities (name, description, website, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, website, image_url, total_raised, is_active, created_at`,
      [data.name, data.description || null, data.website || null, data.imageUrl || null],
      client
    );
    return result.rows[0];
  }

  async update(
    id: string,
    data: { name?: string; description?: string; website?: string; imageUrl?: string; isActive?: boolean },
    client?: PoolClient
  ): Promise<CharityRow | null> {
    const result = await this.executeQuery<CharityRow>(
      `UPDATE charities
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           website = COALESCE($3, website),
           image_url = COALESCE($4, image_url),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING id, name, description, website, image_url, total_raised, is_active, created_at`,
      [data.name, data.description, data.website, data.imageUrl, data.isActive, id],
      client
    );
    return result.rows[0] || null;
  }

  async deactivate(id: string, client?: PoolClient): Promise<boolean> {
    const result = await this.executeQuery<CharityRow>(
      'UPDATE charities SET is_active = false WHERE id = $1 RETURNING id',
      [id],
      client
    );
    return (result.rowCount ?? 0) > 0;
  }

  async countDonations(charityId: string, client?: PoolClient): Promise<number> {
    const result = await this.executeQuery<{ count: string }>(
      'SELECT COUNT(*) as count FROM donations WHERE charity_id = $1',
      [charityId],
      client
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async getRecentDonations(
    charityId: string,
    limit = 5,
    client?: PoolClient
  ): Promise<Array<{ amount: number; created_at: string }>> {
    const result = await this.executeQuery<{ amount: number; created_at: string }>(
      `SELECT d.amount, d.created_at
       FROM donations d
       WHERE d.charity_id = $1 ORDER BY d.created_at DESC LIMIT $2`,
      [charityId, limit],
      client
    );
    return result.rows;
  }

  async recordDonation(
    data: { userId: string; charityId: string; amount: number; drawEntryId?: string | null },
    client?: PoolClient
  ): Promise<DonationRow> {
    const result = await this.executeQuery<DonationRow>(
      `INSERT INTO donations (user_id, charity_id, draw_entry_id, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, charity_id, draw_entry_id, amount, created_at`,
      [data.userId, data.charityId, data.drawEntryId || null, data.amount],
      client
    );
    return result.rows?.[0];
  }

  async getTotalDonationsSum(client?: PoolClient): Promise<number> {
    const result = await this.executeQuery<{ total: string }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM donations',
      [],
      client
    );
    return parseFloat(result.rows[0]?.total || '0');
  }
}

export const charityRepository = new CharityRepository();
