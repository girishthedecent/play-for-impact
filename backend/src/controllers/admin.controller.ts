import { Response, NextFunction } from 'express';
import { adminService } from '../services';
import { sendSuccess } from '../utils/helpers/response.helper';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const analytics = await adminService.getAnalytics();
    sendSuccess(res, analytics);
  } catch (error) { next(error); }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await adminService.getUsers();
    sendSuccess(res, users);
  } catch (error) { next(error); }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const details = await adminService.getUserDetails(id);
    sendSuccess(res, details);
  } catch (error) { next(error); }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { fullName, email, role, subscriptionStatus } = req.body;
    const updated = await adminService.updateUser(req.user?.userId, id, {
      fullName,
      email,
      role,
      subscriptionStatus,
    });
    sendSuccess(res, updated);
  } catch (error) { next(error); }
};

export const updateUserScores = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { stablefordPoints, courseName, date } = req.body;
    const score = await adminService.updateUserScores(id, {
      stablefordPoints,
      courseName,
      date,
    });
    sendSuccess(res, score, 201);
  } catch (error) { next(error); }
};

export const cancelUserSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await adminService.cancelUserSubscription(id);
    sendSuccess(res, { message: 'Subscription cancelled successfully' });
  } catch (error) { next(error); }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    await adminService.deleteUser(id);
    sendSuccess(res, { message: 'User deleted successfully' });
  } catch (error) { next(error); }
};

export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await adminService.getPlatformSettings();
    sendSuccess(res, settings);
  } catch (error) { next(error); }
};

export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      platformName,
      platform_name,
      defaultPrizePoolPercentage,
      default_prize_pool_percentage,
      minimumContributionPercent,
      minimum_contribution_percent,
      maximumScoresPerUser,
      maximum_scores_per_user,
      tier1MatchShare,
      tier1_match_share,
      tier2MatchShare,
      tier2_match_share,
      tier3MatchShare,
      tier3_match_share,
      jackpotRolloverEnabled,
      jackpot_rollover_enabled,
      maintenanceMode,
      maintenance_mode,
      supportEmail,
      support_email
    } = req.body;

    const updated = await adminService.updatePlatformSettings({
      platformName: platformName ?? platform_name,
      defaultPrizePoolPercentage: defaultPrizePoolPercentage ?? default_prize_pool_percentage,
      minimumContributionPercent: minimumContributionPercent ?? minimum_contribution_percent,
      maximumScoresPerUser: maximumScoresPerUser ?? maximum_scores_per_user,
      tier1MatchShare: tier1MatchShare ?? tier1_match_share,
      tier2MatchShare: tier2MatchShare ?? tier2_match_share,
      tier3MatchShare: tier3MatchShare ?? tier3_match_share,
      jackpotRolloverEnabled: jackpotRolloverEnabled ?? jackpot_rollover_enabled,
      maintenanceMode: maintenanceMode ?? maintenance_mode,
      supportEmail: supportEmail ?? support_email,
    });
    sendSuccess(res, updated);
  } catch (error) { next(error); }
};

export const getDrawStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await adminService.getDrawStats();
    sendSuccess(res, stats);
  } catch (error) { next(error); }
};

export const getScoreFrequency = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const frequency = await adminService.getScoreFrequency();
    sendSuccess(res, frequency);
  } catch (error) { next(error); }
};
