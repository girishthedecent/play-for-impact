import { Request, Response, NextFunction } from 'express';
import { stripeService } from '../services/stripe.service';
import { subscriptionRepository, userRepository } from '../repositories';
import { sendSuccess } from '../utils/helpers/response.helper';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BadRequestError, ForbiddenError } from '../utils/errors/app.error';
import { serverConfig } from '../config';
import logger from '../config/logger.config';

export const createCheckoutSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { planType } = req.body;

    if (!userId) { next(new ForbiddenError('Not authenticated')); return; }

    const result = await stripeService.createCheckoutSession(userId, planType);

    logger.info(`Subscription created for user ${userId}: ${planType}`);

    sendSuccess(res, {
      sessionId: result.sessionId,
      url: result.url,
      message: 'Checkout session created',
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { next(new ForbiddenError('Not authenticated')); return; }

    await stripeService.cancelSubscription(userId);

    logger.info(`Subscription cancelled for user ${userId}`);

    sendSuccess(res, { message: 'Subscription cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) { next(new ForbiddenError('Not authenticated')); return; }

    const status = await stripeService.getSubscriptionStatus(userId);

    sendSuccess(res, status || { status: 'inactive', planType: null, renewalDate: null });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!serverConfig.stripeWebhookSecret) {
      logger.warn('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured — skipping');
      res.json({ received: true, skipped: true });
      return;
    }

    if (!sig) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: import('stripe').Event;

    try {
      event = stripeService.constructWebhookEvent(
        req.body,
        sig as string,
        serverConfig.stripeWebhookSecret
      );
    } catch (err) {
      logger.error(`Webhook signature verification failed: ${err}`);
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    await stripeService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

export const confirmSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.body;
    if (!userId) { next(new ForbiddenError('Not authenticated')); return; }

    if (!sessionId) {
      next(new BadRequestError('sessionId is required'));
      return;
    }

    if (sessionId.startsWith('mock_session_') || !serverConfig.stripeSecretKey) {
      await userRepository.updateSubscription(userId, 'active', undefined, true);
      await subscriptionRepository.updateStatusByUserId(userId, 'active');
      logger.info(`Mock subscription confirmed for user ${userId}`);
      sendSuccess(res, { status: 'active' });
      return;
    }

    try {
      const session = await stripeService.retrieveCheckoutSession(sessionId);

      if (session.payment_status !== 'paid' || !session.subscription) {
        next(new BadRequestError('Payment not completed'));
        return;
      }

      const subId = session.subscription as string;
      const planType = session.metadata?.planType || 'basic';

      const updatedCount = await subscriptionRepository.updateStatusByUserId(userId, 'active', subId, planType);
      if (updatedCount === 0) {
        await subscriptionRepository.upsertSubscription({
          userId,
          planType,
          status: 'active',
          amount: 0,
          interval: '1 month',
          stripeSubscriptionId: subId,
        });
      }

      await userRepository.updateSubscription(userId, 'active', planType, true);

      logger.info(`Subscription confirmed for user ${userId} via Stripe session`);
      sendSuccess(res, { status: 'active', planType });
    } catch (err) {
      logger.error(`Stripe session verification failed: ${err}`);
      next(new BadRequestError('Failed to verify payment with Stripe'));
    }
  } catch (error) {
    next(error);
  }
};
