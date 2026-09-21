import {
  userRepository,
  subscriptionRepository,
  charityRepository,
  drawRepository,
  winnerRepository,
  scoreRepository,
  platformSettingsRepository,
  UserRow,
  ScoreRow,
  SubscriptionRow,
  PlatformSettingsRow,
  DrawRow,
} from '../repositories';
import { getClient } from './supabase.service';
import { stripeService } from './stripe.service';
import { NotFoundError, BadRequestError } from '../utils/errors/app.error';
import logger from '../config/logger.config';

export interface FormattedSettings {
  platformName: string;
  defaultPrizePoolPercentage: number;
  minimumContributionPercent: number;
  maximumScoresPerUser: number;
  tier1MatchShare: number;
  tier2MatchShare: number;
  tier3MatchShare: number;
  jackpotRolloverEnabled: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
  updatedAt: string;
}

export class AdminService {
  mapSettings(row: PlatformSettingsRow): FormattedSettings {
    return {
      platformName: row.platform_name,
      defaultPrizePoolPercentage: parseFloat(String(row.default_prize_pool_percentage)),
      minimumContributionPercent: row.minimum_contribution_percent,
      maximumScoresPerUser: row.maximum_scores_per_user,
      tier1MatchShare: parseFloat(String(row.tier1_match_share)),
      tier2MatchShare: parseFloat(String(row.tier2_match_share)),
      tier3MatchShare: parseFloat(String(row.tier3_match_share)),
      jackpotRolloverEnabled: row.jackpot_rollover_enabled,
      maintenanceMode: row.maintenance_mode,
      supportEmail: row.support_email,
      updatedAt: row.updated_at,
    };
  }

  async getAnalytics(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    totalDonations: number;
    totalDraws: number;
    totalWinners: number;
    totalPrizePool: number;
    totalRevenue: number;
    totalCharityContributions: number;
  }> {
    const totalUsers = await userRepository.count({ role: 'user' });
    const activeSubscriptions = await subscriptionRepository.countActive();
    const totalDonations = await charityRepository.getTotalDonationsSum();
    const totalDraws = await drawRepository.countCompleted();
    const totalWinners = await winnerRepository.countPaidWinners();

    const totalPrizePool = await drawRepository.getTotalPrizePool('pending');
    const totalRevenue = await subscriptionRepository.getTotalActiveRevenue();
    const totalCharityContributions = totalDonations;

    return {
      totalUsers,
      activeSubscriptions,
      totalDonations,
      totalDraws,
      totalWinners,
      totalPrizePool,
      totalRevenue,
      totalCharityContributions,
    };
  }

  async getUsers(): Promise<UserRow[]> {
    return userRepository.findAll({ orderBy: 'DESC' });
  }

  async getUserDetails(userId: string): Promise<{
    user: UserRow;
    scores: ScoreRow[];
    subscription: SubscriptionRow | null;
  }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const scores = await scoreRepository.findByUser(userId);
    const subscription = await subscriptionRepository.findByUserId(userId);

    return { user, scores, subscription };
  }

  async updateUser(
    adminId: string | undefined,
    targetUserId: string,
    data: { fullName?: string; email?: string; role?: string; subscriptionStatus?: string }
  ): Promise<UserRow> {
    // Prevent admin from demoting themselves
    if (adminId === targetUserId && data.role && data.role !== 'admin') {
      throw new BadRequestError('Cannot demote your own admin account');
    }

    try {
      const updated = await userRepository.updateAdmin(targetUserId, data);
      if (!updated) {
        throw new NotFoundError('User not found');
      }
      return updated;
    } catch (error) {
      if ((error as Error).message?.includes('unique constraint')) {
        throw new BadRequestError('Email already in use');
      }
      throw error;
    }
  }

  async updateUserScores(
    userId: string,
    data: { stablefordPoints: number; courseName: string; date: string }
  ): Promise<ScoreRow> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const existingScore = await scoreRepository.findByUserAndDate(userId, data.date);
    if (existingScore) {
      throw new BadRequestError('Score already exists for this date');
    }

    const count = await scoreRepository.countByUser(userId);
    if (count >= 5) {
      const oldest = await scoreRepository.getOldestByUser(userId);
      if (oldest) {
        await scoreRepository.delete(oldest.id);
      }
    }

    return scoreRepository.create({
      userId,
      stablefordPoints: data.stablefordPoints,
      courseName: data.courseName,
      date: data.date,
    });
  }

  async cancelUserSubscription(userId: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const subscription = await subscriptionRepository.findActiveOrPendingByUserId(userId, client);
      if (!subscription) {
        await client.query('ROLLBACK');
        throw new NotFoundError('No active subscription found');
      }

      await subscriptionRepository.updateStatusByUserId(userId, 'cancelled', undefined, undefined, client);
      await userRepository.updateSubscription(userId, 'cancelled', undefined, undefined, client);
      await client.query('COMMIT');

      try {
        await stripeService.cancelSubscription(userId);
      } catch (err) {
        logger.warn(`Stripe cancellation failed for user ${userId} (may be mock mode): ${err}`);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.role === 'admin') {
      throw new BadRequestError('Cannot delete admin users');
    }

    await userRepository.deleteRelatedData(userId);
    await userRepository.delete(userId);
  }

  async getPlatformSettings(): Promise<FormattedSettings> {
    let settings = await platformSettingsRepository.getSettings();
    if (!settings) {
      await platformSettingsRepository.initializeDefaultIfMissing();
      settings = await platformSettingsRepository.getSettings();
    }
    if (!settings) {
      throw new NotFoundError('Platform settings not found');
    }
    return this.mapSettings(settings);
  }

  async updatePlatformSettings(data: {
    platformName?: string;
    defaultPrizePoolPercentage?: number;
    minimumContributionPercent?: number;
    maximumScoresPerUser?: number;
    tier1MatchShare?: number;
    tier2MatchShare?: number;
    tier3MatchShare?: number;
    jackpotRolloverEnabled?: boolean;
    maintenanceMode?: boolean;
    supportEmail?: string;
  }): Promise<FormattedSettings> {
    const updated = await platformSettingsRepository.updateSettings(data);
    return this.mapSettings(updated);
  }

  async getDrawStats(): Promise<{ recentDraws: DrawRow[]; totalPrizePool: number }> {
    const recentDraws = await drawRepository.findRecent(10);
    const totalPrizePool = await drawRepository.getTotalPrizePool();
    return { recentDraws, totalPrizePool };
  }

  async getScoreFrequency(): Promise<Array<{ stableford_points: number; count: string }>> {
    return scoreRepository.getScoreFrequency();
  }
}

export const adminService = new AdminService();
