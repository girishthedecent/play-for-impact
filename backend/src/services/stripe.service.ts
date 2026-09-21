import Stripe from 'stripe';
import { serverConfig } from '../config';
import { subscriptionRepository, userRepository } from '../repositories';
import logger from '../config/logger.config';
import { NotFoundError, BadRequestError } from '../utils/errors/app.error';

const PLAN_PRICES: Record<string, number> = {
  basic: 79900,          // ₹799/mo
  basic_yearly: 767000,   // ₹7,670/yr (~₹639/mo)
  premium: 149900,       // ₹1,499/mo
  premium_yearly: 1439000,// ₹14,390/yr (~₹1,199/mo)
  vip: 249900,           // ₹2,499/mo
  vip_yearly: 2399000,    // ₹23,990/yr (~₹1,999/mo)
};

let stripeInstance: Stripe | null = null;

const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!serverConfig.stripeSecretKey) {
      throw new BadRequestError('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(serverConfig.stripeSecretKey);
  }
  return stripeInstance;
};

export const stripeService = {
  isConfigured: (): boolean => {
    return !!serverConfig.stripeSecretKey;
  },

  createCheckoutSession: async (userId: string, planType: string): Promise<{ sessionId: string; url: string }> => {
    const amount = PLAN_PRICES[planType] || PLAN_PRICES.basic;
    
    const isYearly = planType.endsWith('_yearly');
    const basePlan = isYearly ? planType.replace('_yearly', '') : planType;
    const interval = isYearly ? '1 year' : '1 month';
    const billingPeriod = isYearly ? 'yearly' : 'monthly';

    // Mock mode: directly activate subscription when no Stripe key
    if (!serverConfig.stripeSecretKey) {
      const mockSessionId = `mock_session_${Date.now()}`;
      await subscriptionRepository.upsertSubscription({
        userId,
        planType: basePlan,
        status: 'active',
        amount: amount / 100,
        interval,
        billingPeriod,
      });
      await userRepository.updateSubscription(userId, 'active', basePlan, true);
      logger.info(`Mock subscription activated for user ${userId}: ${basePlan}`);
      return { sessionId: mockSessionId, url: `${serverConfig.frontendUrl}/dashboard/subscription?success=true&session_id=${mockSessionId}` };
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    const existingSub = await subscriptionRepository.findByUserId(userId);
    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const user = await userRepository.findById(userId);
      if (!user) throw new NotFoundError('User not found');

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { userId },
      });
      customerId = customer.id;
      logger.info(`Created Stripe customer ${customerId} for user ${userId}`);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: { name: `Play for Impact - ${basePlan.charAt(0).toUpperCase() + basePlan.slice(1)} Plan` },
          unit_amount: amount,
          recurring: { interval: isYearly ? 'year' : 'month' },
        },
        quantity: 1,
      }],
      success_url: `${serverConfig.frontendUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${serverConfig.frontendUrl}/dashboard/subscription?canceled=true`,
      metadata: { userId, planType: basePlan },
    });

    // Create subscription in DB (pending until webhook/session confirmation)
    await subscriptionRepository.upsertSubscription({
      userId,
      planType: basePlan,
      status: 'pending',
      amount: amount / 100,
      interval,
      stripeSubscriptionId: session.subscription as string,
      stripeCustomerId: customerId,
      billingPeriod,
    });

    logger.info(`Checkout session created for user ${userId}: ${session.id}`);

    return {
      sessionId: session.id,
      url: session.url!,
    };
  },

  handleWebhook: async (event: Stripe.Event): Promise<void> => {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        if (!userId || !planType) break;

        if (session.subscription) {
          await subscriptionRepository.updateStatusByStripeId(session.subscription as string, 'active');
        }
        await userRepository.updateSubscription(userId, 'active', planType, true);
        logger.info(`Subscription activated for user ${userId} via webhook`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Event.Data.Object & { parent?: { subscription_details?: { subscription?: string } } };
        const subId = invoice.parent?.subscription_details?.subscription;
        if (!subId) break;
        await subscriptionRepository.updateStatusByStripeId(subId, 'expired');
        logger.warn(`Payment failed for subscription ${subId}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await subscriptionRepository.updateStatusByStripeId(subscription.id, 'cancelled');
        const sub = await subscriptionRepository.findByStripeSubscriptionId(subscription.id);
        if (sub) {
          await userRepository.updateSubscription(sub.user_id, 'cancelled');
        }
        logger.info(`Subscription cancelled via webhook: ${subscription.id}`);
        break;
      }
      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }
  },

  cancelSubscription: async (userId: string): Promise<void> => {
    const sub = await subscriptionRepository.findActiveOrPendingByUserId(userId);

    if (sub && sub.stripe_subscription_id) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        logger.info(`Cancelled Stripe subscription ${sub.stripe_subscription_id}`);
      } catch (err) {
        logger.warn(`Failed to cancel Stripe subscription (may not exist): ${err}`);
      }
    }

    await subscriptionRepository.updateStatusByUserId(userId, 'cancelled');
    await userRepository.updateSubscription(userId, 'cancelled');
  },

  retrieveCheckoutSession: async (sessionId: string): Promise<Stripe.Checkout.Session> => {
    const stripe = getStripe();
    return stripe.checkout.sessions.retrieve(sessionId);
  },

  constructWebhookEvent: (body: Buffer | string, sig: string, webhookSecret: string): Stripe.Event => {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(body, sig, webhookSecret);
  },

  getSubscriptionStatus: async (userId: string): Promise<{ status: string; planType: string; renewalDate: string; amount: number; billingPeriod: string } | null> => {
    const sub = await subscriptionRepository.findByUserId(userId);
    if (!sub) return null;

    return {
      status: sub.status,
      planType: sub.plan_type,
      renewalDate: sub.renewal_date,
      amount: parseFloat(String(sub.amount)) || 0,
      billingPeriod: sub.billing_period || 'monthly',
    };
  },
};
