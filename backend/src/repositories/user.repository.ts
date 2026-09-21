import { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { UserRow } from './types';

export class UserRepository extends BaseRepository {
  async findById(id: string, client?: PoolClient): Promise<UserRow | null> {
    const result = await this.executeQuery<UserRow>(
      `SELECT id, email, password_hash, full_name, role, subscription_status, subscription_plan,
              selected_charity_id, charity_contribution_percent, onboarding_completed, created_at
       FROM users WHERE id = $1`,
      [id],
      client
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string, client?: PoolClient): Promise<UserRow | null> {
    const result = await this.executeQuery<UserRow>(
      `SELECT id, email, password_hash, full_name, role, subscription_status, subscription_plan,
              selected_charity_id, charity_contribution_percent, onboarding_completed, created_at
       FROM users WHERE email = $1`,
      [email],
      client
    );
    return result.rows[0] || null;
  }

  async findByEmailExcludingId(email: string, excludeId: string, client?: PoolClient): Promise<UserRow | null> {
    const result = await this.executeQuery<UserRow>(
      'SELECT id, email FROM users WHERE email = $1 AND id != $2',
      [email, excludeId],
      client
    );
    return result.rows[0] || null;
  }

  async create(
    data: { email: string; passwordHash: string; fullName: string; role?: string },
    client?: PoolClient
  ): Promise<UserRow> {
    const result = await this.executeQuery<UserRow>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, COALESCE($4, 'user'))
       RETURNING id, email, password_hash, full_name, role, subscription_status, subscription_plan,
                 selected_charity_id, charity_contribution_percent, onboarding_completed, created_at`,
      [data.email, data.passwordHash, data.fullName, data.role || 'user'],
      client
    );
    return result.rows?.[0];
  }

  async updateProfile(
    id: string,
    data: { fullName?: string | null; email?: string | null; passwordHash?: string | null },
    client?: PoolClient
  ): Promise<UserRow | null> {
    const result = await this.executeQuery<UserRow>(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           password_hash = COALESCE($3, password_hash)
       WHERE id = $4
       RETURNING id, email, password_hash, full_name, role, subscription_status, subscription_plan,
                 selected_charity_id, charity_contribution_percent, onboarding_completed, created_at`,
      [data.fullName || null, data.email || null, data.passwordHash, id],
      client
    );
    return result.rows[0] || null;
  }

  async updateSubscription(
    id: string,
    status: string,
    plan?: string,
    onboardingCompleted?: boolean,
    client?: PoolClient
  ): Promise<UserRow | null> {
    const fields: string[] = ['subscription_status = $2'];
    const params: unknown[] = [id, status];

    if (plan !== undefined) {
      params.push(plan);
      fields.push(`subscription_plan = $${params.length}`);
    }

    if (onboardingCompleted !== undefined) {
      params.push(onboardingCompleted);
      fields.push(`onboarding_completed = $${params.length}`);
    }

    const result = await this.executeQuery<UserRow>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $1
       RETURNING id, email, password_hash, full_name, role, subscription_status, subscription_plan,
                 selected_charity_id, charity_contribution_percent, onboarding_completed, created_at`,
      params,
      client
    );
    return result.rows[0] || null;
  }

  async updateCharityPreferences(
    id: string,
    charityId: string,
    contributionPercent: number,
    client?: PoolClient
  ): Promise<void> {
    await this.executeQuery(
      `UPDATE users SET selected_charity_id = $1, charity_contribution_percent = $2 WHERE id = $3`,
      [charityId, contributionPercent, id],
      client
    );
  }

  async findAll(
    options?: { role?: string; orderBy?: string },
    client?: PoolClient
  ): Promise<UserRow[]> {
    let sql = `SELECT id, email, full_name, role, subscription_status, subscription_plan,
                      selected_charity_id, charity_contribution_percent, onboarding_completed, created_at
               FROM users`;
    const params: unknown[] = [];

    if (options?.role) {
      params.push(options.role);
      sql += ` WHERE role = $${params.length}`;
    }

    sql += ` ORDER BY created_at ${options?.orderBy === 'ASC' ? 'ASC' : 'DESC'}`;

    const result = await this.executeQuery<UserRow>(sql, params, client);
    return result.rows;
  }

  async updateAdmin(
    id: string,
    data: { fullName?: string; email?: string; role?: string; subscriptionStatus?: string },
    client?: PoolClient
  ): Promise<UserRow | null> {
    const result = await this.executeQuery<UserRow>(
      `UPDATE users
       SET full_name = COALESCE($1, full_name), email = COALESCE($2, email),
           role = COALESCE($3, role), subscription_status = COALESCE($4, subscription_status)
       WHERE id = $5
       RETURNING id, email, password_hash, full_name, role, subscription_status, subscription_plan,
                 selected_charity_id, charity_contribution_percent, onboarding_completed, created_at`,
      [data.fullName, data.email, data.role, data.subscriptionStatus, id],
      client
    );
    return result.rows[0] || null;
  }

  async delete(id: string, client?: PoolClient): Promise<boolean> {
    const result = await this.executeQuery('DELETE FROM users WHERE id = $1', [id], client);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteRelatedData(id: string, client?: PoolClient): Promise<void> {
    await this.executeQuery('DELETE FROM winner_proofs WHERE user_id = $1', [id], client);
    await this.executeQuery('DELETE FROM donations WHERE user_id = $1', [id], client);
    await this.executeQuery('DELETE FROM draw_entries WHERE user_id = $1', [id], client);
    await this.executeQuery('DELETE FROM scores WHERE user_id = $1', [id], client);
    await this.executeQuery('DELETE FROM subscriptions WHERE user_id = $1', [id], client);
  }

  async count(filter?: { role?: string }, client?: PoolClient): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM users';
    const params: unknown[] = [];

    if (filter?.role) {
      params.push(filter.role);
      sql += ` WHERE role = $1`;
    }

    const result = await this.executeQuery<{ count: string }>(sql, params, client);
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}

export const userRepository = new UserRepository();
