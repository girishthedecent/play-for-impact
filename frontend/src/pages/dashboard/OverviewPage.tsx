import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Heart,
  Trophy,
  ArrowRight,
  CreditCard,
  AlertCircle,
  Calendar,
  Award,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import { scoresService, charitiesService, drawsService } from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import type { Score, DrawEntry, Charity } from '../../types';

export default function OverviewPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<Score[]>([]);
  const [charity, setCharity] = useState<Charity | null>(null);
  const [draws, setDraws] = useState<DrawEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [scoresResult, drawsResult] = await Promise.allSettled([
          scoresService.getScores(),
          drawsService.getMyDraws(),
        ]);
        if (cancelled) return;

        if (scoresResult.status === 'fulfilled') setScores(scoresResult.value);
        if (drawsResult.status === 'fulfilled') setDraws(drawsResult.value);

        if (user?.selectedCharityId) {
          try {
            const charityData = await charitiesService.getCharityById(user.selectedCharityId);
            if (!cancelled) setCharity(charityData);
          } catch {
            // Non-fatal
          }
        }

        if (scoresResult.status === 'rejected' && drawsResult.status === 'rejected') {
          if (!cancelled) setError('Failed to load dashboard data');
        }
      } catch {
        if (!cancelled) setError('Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [user?.selectedCharityId]);

  if (loading) return <DashboardSkeleton />;

  const isSubscribed = user?.subscriptionStatus === 'active';
  const totalWinnings = draws.reduce((sum, d) => sum + (Number(d.prizeAmount) || 0), 0);
  const eligibleRounds = Math.min(scores.length, 5);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.fullName?.split(' ')[0]}
            </h1>
            <Badge variant={isSubscribed ? 'success' : 'warning'}>
              {isSubscribed ? 'Active Subscriber' : 'Subscription Inactive'}
            </Badge>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Track your 5-score rolling handicap, verified monthly draws, and recurring charitable impact.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/dashboard/scores">
            <Button size="sm">
              <Target className="h-3.5 w-3.5 mr-1" />
              <span>Log Score</span>
            </Button>
          </Link>
          <Link to="/dashboard/subscription">
            <Button variant="outline" size="sm">
              Manage Plan
            </Button>
          </Link>
        </div>
      </div>

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

      {/* Subscription Callout if inactive */}
      {!isSubscribed && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              Your subscription is inactive. Active subscribers enter monthly draws and donate to their chosen charity automatically.
            </span>
          </div>
          <Link to="/dashboard/subscription" className="shrink-0 font-bold underline text-amber-950">
            Activate Subscription →
          </Link>
        </div>
      )}

      {/* Metric Cards Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:border-slate-300">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Rolling Scores</span>
              <Target className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {eligibleRounds} <span className="text-sm font-normal text-slate-400">/ 5</span>
            </div>
            <p className="text-[11px] text-slate-500">
              {eligibleRounds === 5 ? '✓ Full draw eligibility' : `Need ${5 - eligibleRounds} more round(s)`}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Charity Split</span>
              <Heart className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {user?.charityContributionPercent ?? 10}%
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {charity ? charity.name : 'No charity linked'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Draw Entries</span>
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {draws.length}
            </div>
            <p className="text-[11px] text-slate-500">
              Monthly draws participated
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-300">
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Total Won</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(totalWinnings)}
            </div>
            <p className="text-[11px] text-slate-500">
              Prizes awarded to date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Recent Scores & Active Charity */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent Scores (2 cols) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-slate-900">Rolling Draw Scorecard (Last 5)</h2>
              </div>
              <Link to="/dashboard/scores" className="text-xs font-semibold text-primary hover:underline">
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {scores.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-xs text-slate-500">You haven't entered any golf scores yet.</p>
                <Link to="/dashboard/scores">
                  <Button size="sm">Enter First Score</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {scores.slice(0, 5).map((score, idx) => (
                  <div key={score.id} className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {score.courseName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(score.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {score.stablefordPoints} pts
                      </span>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Stableford
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Charity Partner */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <h2 className="text-sm font-bold text-slate-900">Chosen Charity</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {charity ? (
              <div className="space-y-3">
                <div className="h-11 w-11 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base">
                    {charity.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                    {charity.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Your contribution:</span>
                  <span className="font-bold text-slate-900">
                    {user?.charityContributionPercent ?? 10}% of fee
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-slate-500">No charity selected yet.</p>
                <Link to="/dashboard/charity">
                  <Button variant="outline" size="sm">Select Charity</Button>
                </Link>
              </div>
            )}
          </CardContent>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl">
            <Link
              to="/dashboard/charity"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Charity & Extra Donations</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
