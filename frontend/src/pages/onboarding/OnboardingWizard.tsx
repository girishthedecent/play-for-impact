import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Heart, ArrowRight, ArrowLeft, Check, Search, ShieldCheck, Target, CheckCircle2, Info, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { charitiesService, paymentsService, authService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import type { Charity } from '../../types';

export default function OnboardingWizard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';

  const [step, setStep] = useState(1);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCharityId, setSelectedCharityId] = useState<string>(user?.selectedCharityId || '');
  const [contributionPercent, setContributionPercent] = useState<number>(user?.charityContributionPercent || 10);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'vip'>(
    (user?.subscriptionPlan as 'basic' | 'premium' | 'vip') || 'basic'
  );
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCharities, setLoadingCharities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the user already completed onboarding or has an active subscription, send them to dashboard unless specifically editing
  useEffect(() => {
    const isSetupComplete = Boolean(user?.onboardingCompleted || user?.subscriptionStatus === 'active');
    if (isSetupComplete && !isEditing) {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.onboardingCompleted, user?.subscriptionStatus, isEditing, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCharities() {
      try {
        setLoadingCharities(true);
        const data = await charitiesService.getCharities();
        if (!cancelled) {
          setCharities(data);
          // If no charity selected yet, default to first available
          if (!selectedCharityId && data.length > 0) {
            setSelectedCharityId(user?.selectedCharityId || data[0].id);
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load charities. Please refresh the page.');
      } finally {
        if (!cancelled) setLoadingCharities(false);
      }
    }

    fetchCharities();
    return () => { cancelled = true; };
  }, [user?.selectedCharityId, selectedCharityId]);

  const filteredCharities = useMemo(() => {
    if (!searchQuery.trim()) return charities;
    const q = searchQuery.toLowerCase();
    return charities.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [charities, searchQuery]);

  const selectedCharity = useMemo(() => {
    return charities.find(c => c.id === selectedCharityId);
  }, [charities, selectedCharityId]);

  const plans: {
    id: 'basic' | 'premium' | 'vip';
    name: string;
    tagline: string;
    monthlyPrice: number;
    yearlyPrice: number;
    yearlyMonthly: number;
    features: string[];
    popular: boolean;
  }[] = [
    {
      id: 'basic',
      name: 'Basic Club',
      tagline: 'Ideal for social golfers tracking handicap',
      monthlyPrice: 799,
      yearlyPrice: 7670,
      yearlyMonthly: 639,
      features: [
        '5 score submissions / month',
        'Official Monthly Draw ticket',
        'Direct charity contribution',
        'Personal handicap analytics',
      ],
      popular: false,
    },
    {
      id: 'premium',
      name: 'Eagle Circle',
      tagline: 'Most popular for regular weekend tournament players',
      monthlyPrice: 1499,
      yearlyPrice: 14390,
      yearlyMonthly: 1199,
      features: [
        'All Basic features',
        'Priority draw entry validation',
        'Handicap trend analytics',
        'Double charity contribution match option',
        'Quarterly impact reports',
      ],
      popular: true,
    },
    {
      id: 'vip',
      name: 'Champions Guild',
      tagline: 'For competitive golfers and dedicated philanthropists',
      monthlyPrice: 2999,
      yearlyPrice: 28790,
      yearlyMonthly: 2399,
      features: [
        'All Premium features',
        'VIP leaderboard badge',
        'Direct connection to charity trustees',
        'Invitational annual charity tournament access',
        'Comprehensive 80G tax benefit receipt',
      ],
      popular: false,
    },
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[0];
  const monthlyCost = billingPeriod === 'yearly' ? currentPlan.yearlyMonthly : currentPlan.monthlyPrice;
  const charityAmount = Math.round((monthlyCost * contributionPercent) / 100);

  const handleComplete = async () => {
    if (!selectedCharityId) {
      toast.error('Please select a beneficiary charity');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // 1. Save charity choice and contribution percent
      await charitiesService.selectCharity(selectedCharityId, contributionPercent);

      // 2. Create checkout session (or direct mock activation)
      const planId = billingPeriod === 'yearly' ? `${selectedPlan}_yearly` : selectedPlan;
      const result = await paymentsService.createCheckoutSession(planId);

      // 3. Refresh auth user from API to guarantee latest DB status
      try {
        const freshUser = await authService.getMe();
        updateUser(freshUser);
      } catch {
        if (user) {
          updateUser({
            ...user,
            selectedCharityId,
            charityContributionPercent: contributionPercent,
            subscriptionPlan: selectedPlan,
            onboardingCompleted: true,
          });
        }
      }

      // Check if this was a mock/internal redirection vs external Stripe checkout
      const isInternalRedirect =
        !result.url ||
        result.url.includes('/dashboard/subscription') ||
        result.url.includes(window.location.host);

      if (isInternalRedirect) {
        toast.success(
          user?.onboardingCompleted
            ? 'Preferences updated successfully!'
            : 'Setup complete! Welcome to Play for Impact.'
        );
        navigate('/dashboard', { replace: true });
      } else {
        // Real external Stripe checkout page
        window.location.href = result.url;
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr.response?.data?.error || 'Failed to complete setup. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { num: 1, title: 'Charity', desc: 'Select cause' },
    { num: 2, title: 'Impact', desc: 'Contribution %' },
    { num: 3, title: 'Plan', desc: 'Choose tier' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold tracking-wide uppercase mb-3 border border-emerald-200/80">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Player Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {user?.onboardingCompleted ? 'Update Your Preferences' : 'Welcome to Play for Impact'}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-lg mx-auto">
            Set up your beneficiary charity, choose your contribution percentage, and pick your monthly draw membership.
          </p>
        </div>

        {/* Notice for already completed user */}
        {user?.onboardingCompleted && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-3 shadow-xs">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">You have already completed onboarding.</span> Feel free to review or update your charity and membership preferences here, or return to your{' '}
              <Link to="/dashboard" className="underline font-semibold hover:text-emerald-950">
                Dashboard &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Step Progress Indicator */}
        <div className="mb-10 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-300 -z-0"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((s) => {
              const isPassed = s.num < step;
              const isCurrent = s.num === step;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num < step || user?.onboardingCompleted) {
                      setStep(s.num);
                    }
                  }}
                  className={`flex flex-col items-center group relative z-10 focus:outline-hidden ${
                    s.num <= step || user?.onboardingCompleted ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                        : 'bg-white border-2 border-slate-200 text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="h-5 w-5" /> : s.num}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-semibold ${isCurrent ? 'text-[#0F5132]' : 'text-slate-700'}`}>
                      {s.title}
                    </div>
                    <div className="hidden sm:block text-[11px] text-slate-400">{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs font-semibold underline hover:text-red-900">
              Dismiss
            </button>
          </div>
        )}

        {/* STEP 1: CHOOSE CHARITY */}
        {step === 1 && (
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#EBF7EE] flex items-center justify-center text-[#0F5132]">
                    <Heart className="h-6 w-6 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Choose Your Charity</h2>
                    <p className="text-slate-500 text-sm">Select the verified organisation you want your golf scores to support.</p>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search charities..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600/15 focus:border-emerald-600"
                  />
                </div>
              </div>

              {loadingCharities ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredCharities.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">No charities found matching "{searchQuery}"</p>
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="mt-2 text-xs">
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 mb-8">
                  {filteredCharities.map((charity) => {
                    const isSelected = selectedCharityId === charity.id;
                    return (
                      <div
                        key={charity.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCharityId(charity.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedCharityId(charity.id); }}
                        className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all duration-150 relative cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/15 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900 text-base">{charity.name}</h3>
                              {charity.website && (
                                <a
                                  href={charity.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-slate-400 hover:text-emerald-700 underline"
                                >
                                  Website
                                </a>
                              )}
                            </div>
                            <p className="text-slate-600 text-sm mt-1 leading-relaxed">{charity.description}</p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-end pt-6 border-t border-slate-100">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedCharityId}
                >
                  Continue to Impact
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: SET CONTRIBUTION PERCENTAGE */}
        {step === 2 && (
          <Card className="border border-slate-200/90 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200/80">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Set Your Contribution</h2>
                  <p className="text-slate-500 text-sm">
                    Choose what share of your monthly membership goes directly to {selectedCharity?.name || 'charity'}.
                  </p>
                </div>
              </div>

              {/* Interactive Contribution Section */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-6 mb-6">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Charity Allocation</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Minimum 10% per platform charter</span>
                  </div>
                  <div className="text-3xl font-bold font-mono text-emerald-700">
                    {contributionPercent}%
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={contributionPercent}
                  onChange={(e) => setContributionPercent(parseInt(e.target.value, 10))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                  <span>10% (Charity Standard)</span>
                  <span>50%</span>
                  <span>100% (Full Impact)</span>
                </div>

                {/* Quick Selection Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-6">
                  {[10, 25, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setContributionPercent(pct)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        contributionPercent === pct
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pct === 10 ? '10% (Default)' : pct === 100 ? '100% (Hero)' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Impact Breakdown Card */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5 mb-8">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Your Real-Time Impact Estimate
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Based on your current plan choice, approximately{' '}
                  <span className="font-bold text-emerald-700 font-mono">₹{charityAmount}</span> each month will be sent directly to{' '}
                  <strong className="text-slate-900">{selectedCharity?.name || 'your chosen charity'}</strong> to fund vital community work.
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setStep(1)} className="text-slate-600">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                >
                  Continue to Membership
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: SELECT PLAN & COMPLETE */}
        {step === 3 && (
          <Card className="border border-slate-200/90 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200/80">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Select Your Membership</h2>
                    <p className="text-slate-500 text-sm">Every plan includes entry into our verified monthly cash draw.</p>
                  </div>
                </div>

                {/* Monthly / Yearly Switch */}
                <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      billingPeriod === 'monthly'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('yearly')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      billingPeriod === 'yearly'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>Annual</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      billingPeriod === 'yearly' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Tier Cards Grid */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const price = billingPeriod === 'yearly' ? plan.yearlyMonthly : plan.monthlyPrice;
                  return (
                    <div
                      key={plan.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedPlan(plan.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPlan(plan.id); }}
                      className={`text-left p-5 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-600/15 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          Most Popular
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>

                        <p className="text-slate-500 text-xs mb-4 min-h-[32px] leading-relaxed">{plan.tagline}</p>

                        <div className="mb-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold font-mono text-slate-900">₹{price}</span>
                            <span className="text-xs text-slate-500">/mo</span>
                          </div>
                          {billingPeriod === 'yearly' && (
                            <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
                              Billed ₹{plan.yearlyPrice} annually
                            </span>
                          )}
                        </div>

                        <ul className="space-y-2 pt-4 border-t border-slate-100 text-xs text-slate-600 mb-4">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary pill */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Beneficiary: <strong className="text-slate-900">{selectedCharity?.name}</strong> ({contributionPercent}% allocation)
                  <span className="mx-2 text-slate-300">|</span>
                  Plan: <strong className="text-slate-900">{currentPlan.name}</strong> (₹{billingPeriod === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice}/{billingPeriod === 'yearly' ? 'yr' : 'mo'})
                </div>
                <div className="text-xs font-semibold text-emerald-700">
                  ₹{charityAmount} goes to charity
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-600">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  loading={saving}
                  size="lg"
                  className="px-8"
                >
                  {user?.onboardingCompleted ? 'Save Preferences' : 'Complete Setup & Join'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
