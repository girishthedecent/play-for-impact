import { useState, useEffect, useCallback } from 'react';
import { paymentsService } from '../services/api';
import type { Subscription } from '../types';

const PLAN_PRICES: Record<string, number> = {
  basic: 799, basic_yearly: 639, premium: 1499, premium_yearly: 1199, vip: 2499, vip_yearly: 1999,
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const status = await paymentsService.getPaymentStatus();
      if (status.status === 'active') {
        const amount = status.amount ?? PLAN_PRICES[status.planType || 'basic'] ?? 0;
        setSubscription({
          id: '',
          planType: (status.planType || 'basic') as 'basic' | 'premium' | 'vip',
          status: status.status,
          amount,
          renewalDate: status.renewalDate || '',
          billingPeriod: (status.billingPeriod as 'monthly' | 'yearly') || 'monthly',
        });
      } else {
        setSubscription(null);
      }
    } catch {
      setError('Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const subscribe = async (planType: string) => {
    try {
      const result = await paymentsService.createCheckoutSession(planType);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      throw new Error('Failed to subscribe');
    }
  };

  const confirmAfterCheckout = async (sessionId: string) => {
    try {
      await paymentsService.confirmSubscription(sessionId);
    } catch {
      // In mock mode, subscription is already activated during createCheckoutSession.
      // The confirm endpoint may fail because there's no real Stripe session.
      // Just re-fetch the subscription status to pick up the activation.
    }
    await fetchSubscription();
  };

  const cancel = async () => {
    try {
      await paymentsService.cancelSubscription();
      setSubscription(null);
    } catch {
      throw new Error('Failed to cancel subscription');
    }
  };

  return { subscription, loading, error, subscribe, cancel, confirmAfterCheckout };
}
