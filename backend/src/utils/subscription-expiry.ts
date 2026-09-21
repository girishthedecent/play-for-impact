import { subscriptionRepository, userRepository } from '../repositories';
import logger from '../config/logger.config';

/**
 * Checks for subscriptions past their renewal date and marks them expired.
 * Runs on a timer (every 60 minutes). Also updates the users table to reflect
 * the lapsed status so the frontend and subscription middleware pick it up.
 */
export async function expireSubscriptions(): Promise<void> {
  try {
    const expiredList = await subscriptionRepository.expirePastDueSubscriptions();

    if (expiredList.length > 0) {
      logger.info(`Expired ${expiredList.length} subscription(s)`);

      // Sync users.subscription_status for the expired subscriptions
      for (const row of expiredList) {
        await userRepository.updateSubscription(row.user_id, 'expired');
      }
    }
  } catch (error) {
    logger.error('Failed to expire subscriptions:', error);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startSubscriptionExpiryJob(intervalMs = 60 * 60 * 1000): void {
  if (intervalId) return; // already running
  // Run once on startup, then on interval
  expireSubscriptions();
  intervalId = setInterval(expireSubscriptions, intervalMs);
  logger.info(`Subscription expiry job started (interval: ${intervalMs}ms)`);
}

export function stopSubscriptionExpiryJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Subscription expiry job stopped');
  }
}
