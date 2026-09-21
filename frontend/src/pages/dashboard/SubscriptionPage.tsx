import { useState, useEffect } from 'react';
import { Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatDate';

export default function SubscriptionPage() {
  const { updateUser } = useAuth();
  const { subscription, subscribe, cancel, confirmAfterCheckout } = useSubscription();
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');

    if (success === 'true' && sessionId) {
      setConfirming(true);
      confirmAfterCheckout(sessionId)
        .then(async () => {
          try {
            const fresh = await authService.getMe();
            updateUser(fresh);
          } catch {
            // ignore
          }
          toast.success('Subscription activated successfully!');
        })
        .finally(() => {
          setConfirming(false);
          setSearchParams({});
        });
      return;
    }

    if (searchParams.get('canceled') === 'true') {
      setSearchParams({});
    }
  }, [searchParams]);

  const handleSubscribe = async (planType: string) => {
    try {
      setError(null);
      setProcessing(true);
      toast.success('Redirecting to checkout session...');
      const planId = billingPeriod === 'yearly' ? `${planType}_yearly` : planType;
      await subscribe(planId);
    } catch {
      setError('Failed to initiate subscription checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? Your entries in the current month draw will remain valid.')) return;
    try {
      setError(null);
      setProcessing(true);
      await cancel();
      toast.success('Subscription cancelled successfully');
    } catch {
      setError('Failed to cancel subscription');
      toast.error('Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      monthlyPrice: '799',
      yearlyPrice: '7,670',
      yearlyMonthlyEquivalent: '639',
      description: 'Ideal for weekend golfers seeking monthly draw entry and direct charity giving.',
      features: [
        '5 Stableford score submissions',
        'Automatic entry in monthly draw',
        'Direct chosen charity allocation (min 10%)',
        'Draw entry match verification',
      ],
      highlighted: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      monthlyPrice: '1499',
      yearlyPrice: '14,390',
      yearlyMonthlyEquivalent: '1,199',
      description: 'Our most popular membership offering amplified prize pool allocation and priority verification.',
      features: [
        'Everything in Basic',
        'Priority winner proof processing',
        'Increased charity remit power',
        'Dedicated member support channel',
      ],
      highlighted: true,
    },
    {
      id: 'vip',
      name: 'VIP Impact',
      monthlyPrice: '2499',
      yearlyPrice: '23,990',
      yearlyMonthlyEquivalent: '1,999',
      description: 'Maximum contribution power for dedicated club golfers supporting verified Indian causes.',
      features: [
        'Everything in Premium',
        'Maximum charity allocation power',
        'Expedited payout verification',
        'Invitations to annual charity golf events',
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
            Membership & Subscriptions
          </h1>
          <Badge variant="default" dot>Secure PCI-DSS</Badge>
        </div>
        <p className="text-slate-500 text-xs mt-1">
          Monthly and annual membership options. Every plan guarantees automatic recurring donations to your selected charity.
        </p>
      </div>

      {confirming && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Confirming your subscription payment with Stripe...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Current Active Plan Card */}
      {subscription && subscription.status === 'active' && (
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span className="font-bold text-slate-900 text-sm">Active Membership</span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Selected Tier</span>
                <span className="text-sm font-bold text-slate-900 capitalize">
                  {subscription.planType} Plan
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Billing Period</span>
                <span className="text-sm font-bold text-slate-900 capitalize">
                  {subscription.billingPeriod || 'Monthly'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Fee Amount</span>
                <span className="text-sm font-bold text-slate-900 tabular-nums">
                  ₹{Number(subscription.amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Next Renewal</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatDate(subscription.renewalDate)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                You can switch tiers or cancel your recurring renewal anytime.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={processing}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              >
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-2">
        <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              billingPeriod === 'yearly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
              Save 20%
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-400">
          {billingPeriod === 'yearly'
            ? '✓ Annual plans billed once yearly with 2 months free equivalent.'
            : '✓ Cancel or change plans anytime with no long-term lock-in.'}
        </p>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrent = subscription?.status === 'active' && subscription?.planType === plan.id;
          const displayPrice = billingPeriod === 'yearly' ? plan.yearlyMonthlyEquivalent : plan.monthlyPrice;
          const totalYearly = plan.yearlyPrice;

          return (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between transition-all duration-150 ${
                plan.highlighted
                  ? 'border-primary ring-1 ring-primary/30 shadow-sm'
                  : 'hover:border-slate-300'
              }`}
            >
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-slate-900 text-lg">{plan.name}</h3>
                    <p className="text-xs text-slate-500 leading-tight">{plan.description}</p>
                  </div>
                  {plan.highlighted && (
                    <Badge variant="default" className="text-[10px]">Most Popular</Badge>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-display font-bold text-slate-900 tabular-nums">
                      ₹{displayPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Billed annually at ₹{totalYearly}/yr
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 leading-normal">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className="p-6 pt-0">
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processing || isCurrent}
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                >
                  {isCurrent ? 'Current Plan' : `Select ${plan.name}`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
