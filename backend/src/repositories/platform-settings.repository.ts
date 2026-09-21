import { PoolClient } from 'pg';
import { BaseRepository } from './base.repository';
import { PlatformSettingsRow } from './types';

export class PlatformSettingsRepository extends BaseRepository {
  async getSettings(client?: PoolClient): Promise<PlatformSettingsRow | null> {
    const result = await this.executeQuery<PlatformSettingsRow>(
      `SELECT * FROM platform_settings WHERE id = 'default' LIMIT 1`,
      [],
      client
    );
    return result.rows[0] || null;
  }

  async initializeDefaultIfMissing(client?: PoolClient): Promise<void> {
    await this.executeQuery(
      `INSERT INTO platform_settings (id) VALUES ('default') ON CONFLICT DO NOTHING`,
      [],
      client
    );
  }

  async updateSettings(
    data: {
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
    },
    client?: PoolClient
  ): Promise<PlatformSettingsRow> {
    const result = await this.executeQuery<PlatformSettingsRow>(
      `UPDATE platform_settings
       SET platform_name = COALESCE($1, platform_name),
           default_prize_pool_percentage = COALESCE($2, default_prize_pool_percentage),
           minimum_contribution_percent = COALESCE($3, minimum_contribution_percent),
           maximum_scores_per_user = COALESCE($4, maximum_scores_per_user),
           tier1_match_share = COALESCE($5, tier1_match_share),
           tier2_match_share = COALESCE($6, tier2_match_share),
           tier3_match_share = COALESCE($7, tier3_match_share),
           jackpot_rollover_enabled = COALESCE($8, jackpot_rollover_enabled),
           maintenance_mode = COALESCE($9, maintenance_mode),
           support_email = COALESCE($10, support_email),
           updated_at = NOW()
       WHERE id = 'default'
       RETURNING *`,
      [
        data.platformName,
        data.defaultPrizePoolPercentage,
        data.minimumContributionPercent,
        data.maximumScoresPerUser,
        data.tier1MatchShare,
        data.tier2MatchShare,
        data.tier3MatchShare,
        data.jackpotRolloverEnabled,
        data.maintenanceMode,
        data.supportEmail,
      ],
      client
    );
    return result.rows[0];
  }
}

export const platformSettingsRepository = new PlatformSettingsRepository();
