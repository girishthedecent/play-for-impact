import { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { SubscriptionRow } from './types';

export class SubscriptionRepository extends BaseRepository {
  async findByUserId(userId: string, client?: PoolClient): Promise<SubscriptionRow | null> {
    const result = await this.executeQuery<SubscriptionRow>(
      `SELECT id, user_id, plan_type, status, amount, renewal_date, billing_period,
              stripe_subscription_id, stripe_customer_id, created_at
       FROM subscriptions WHERE user_id = $1`,
      [userId],
      client
    );
    return result.rows[0] || null;
  }

  async findActiveOrPendingByUserId(userId: string, client?: PoolClient): Promise<SubscriptionRow | null> {
    const result = await this.executeQuery<SubscriptionRow>(
      `SELECT id, user_id, plan_type, status, amount, renewal_date, billing_period,
              stripe_subscription_id, stripe_customer_id
       FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'pending')`,
      [userId],
      client
    );
    return result.rows[0] || null;
  }

  async findByStripeSubscriptionId(stripeSubId: string, client?: PoolClient): Promise<SubscriptionRow | null> {
    const result = await this.executeQuery<SubscriptionRow>(
      `SELECT id, user_id, plan_type, status, amount, renewal_date, billing_period,
              stripe_subscription_id, stripe_customer_id
       FROM subscriptions WHERE stripe_subscription_id = $1`,
      [stripeSubId],
      client
    );
    return result.rows[0] || null;
  }

  async upsertSubscription(
    data: {
      userId: string;
      planType: string;
      status: string;
      amount: number;
      interval: string;
      billingPeriod?: string;
      stripeSubscriptionId?: string | null;
      stripeCustomerId?: string | null;
    },
    client?: PoolClient
  ): Promise<void> {
    await this.executeQuery(
      `INSERT INTO subscriptions (user_id, plan_type, status, amount, renewal_date, stripe_subscription_id, stripe_customer_id, billing_period)
       VALUES ($1, $2, $3, $4, CURRENT_DATE + INTERVAL '${data.interval}', $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         plan_type = $2, status = $3, amount = $4,
         renewal_date = CURRENT_DATE + INTERVAL '${data.interval}',
         stripe_subscription_id = COALESCE($5, subscriptions.stripe_subscription_id),
         stripe_customer_id = COALESCE($6, subscriptions.stripe_customer_id),
         billing_period = $7`,
      [
        data.userId,
        data.planType,
        data.status,
        data.amount,
        data.stripeSubscriptionId || null,
        data.stripeCustomerId || null,
        data.billingPeriod || 'monthly',
      ],
      client
    );
  }

  async updateStatusByUserId(
    userId: string,
    status: string,
    stripeSubscriptionId?: string | null,
    planType?: string,
    client?: PoolClient
  ): Promise<number> {
    let sql = 'UPDATE subscriptions SET status = $2';
    const params: unknown[] = [userId, status];

    if (stripeSubscriptionId) {
      params.push(stripeSubscriptionId);
      sql += `, stripe_subscription_id = $${params.length}`;
    }

    if (planType) {
      params.push(planType);
      sql += `, plan_type = $${params.length}`;
    }

    sql += ' WHERE user_id = $1';

    const result = await this.executeQuery(sql, params, client);
    return result.rowCount ?? 0;
  }

  async updateStatusByStripeId(stripeSubId: string, status: string, client?: PoolClient): Promise<void> {
    await this.executeQuery(
      `UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2`,
      [status, stripeSubId],
      client
    );
  }

  async countActive(client?: PoolClient): Promise<number> {
    const result = await this.executeQuery<{ count: string }>(
      "SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'",
      [],
      client
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async getTotalActiveRevenue(client?: PoolClient): Promise<number> {
    const result = await this.executeQuery<{ total: string }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM subscriptions WHERE status = 'active'",
      [],
      client
    );
    return parseFloat(result.rows[0]?.total || '0');
  }

  async expirePastDueSubscriptions(client?: PoolClient): Promise<Array<{ id: string; user_id: string }>> {
    const result = await this.executeQuery<{ id: string; user_id: string }>(
      `UPDATE subscriptions
       SET status = 'expired'
       WHERE status = 'active'
         AND renewal_date IS NOT NULL
         AND renewal_date < NOW()
       RETURNING id, user_id`,
      [],
      client
    );
    return result.rows;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
