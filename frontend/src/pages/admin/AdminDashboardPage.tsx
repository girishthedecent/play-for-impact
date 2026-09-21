import { useState, useEffect } from 'react';
import { Users, CreditCard, Heart, Trophy, DollarSign, Clock, AlertCircle, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { Analytics } from '../../types';

interface ScoreFreq {
  stableford_points: number;
  count: string;
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pendingWinners, setPendingWinners] = useState(0);
  const [recentDraws, setRecentDraws] = useState<{ id: string; drawDate: string; status: string; prizePool: number }[]>([]);
  const [scoreFreq, setScoreFreq] = useState<ScoreFreq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      try {
        const [analyticsData, drawStatsData, winnersData, freqData] = await Promise.allSettled([
          adminService.getAnalytics(),
          adminService.getDrawStats(),
          adminService.getWinners(),
          adminService.getScoreFrequency(),
        ]);

        if (cancelled) return;

        if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
        if (drawStatsData.status === 'fulfilled') {
          setRecentDraws(drawStatsData.value.recentDraws.slice(0, 5).map(d => ({
            id: d.id,
            drawDate: d.drawDate,
            status: d.status,
            prizePool: d.prizePool,
          })));
        }
        if (winnersData.status === 'fulfilled') {
          const pending = winnersData.value.filter(w => w.winnerStatus === 'pending').length;
          setPendingWinners(pending);
        }
        if (freqData.status === 'fulfilled') {
          setScoreFreq(freqData.value);
        }
      } catch {
        if (!cancelled) setError('Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stats = analytics ? [
    { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'text-blue-500' },
    { label: 'Active Subscriptions', value: analytics.activeSubscriptions, icon: CreditCard, color: 'text-green-500' },
    { label: 'Total Donations', value: formatCurrency(analytics.totalDonations), icon: Heart, color: 'text-red-500' },
    { label: 'Active Prize Pool', value: formatCurrency(analytics.totalPrizePool || 0), icon: Trophy, color: 'text-amber-500' },
    { label: 'Monthly Revenue', value: formatCurrency(analytics.totalRevenue || 0), icon: DollarSign, color: 'text-green-600' },
    { label: 'Completed Draws', value: analytics.totalDraws, icon: Trophy, color: 'text-yellow-500' },
    { label: 'Prizes Paid', value: analytics.totalWinners, icon: DollarSign, color: 'text-purple-500' },
  ] : [];

  const maxFreq = Math.max(...scoreFreq.map(f => parseInt(String(f.count), 10)), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Admin Dashboard</h1>
        <p className="text-text-muted mt-1">Platform overview and statistics</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <div className="text-xl font-bold text-text">{stat.value}</div>
                  <div className="text-xs text-text-muted">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text">Recent Draws</h3>
              <Link to="/admin/draws" className="text-sm text-primary hover:text-primary-hover">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentDraws.length === 0 ? (
              <p className="text-sm text-text-muted">No draws yet</p>
            ) : (
              <div className="space-y-3">
                {recentDraws.map((draw) => (
                  <div key={draw.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-text-muted" />
                      <span className="text-text">{formatDate(draw.drawDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted">{formatCurrency(draw.prizePool)}</span>
                      <Badge variant={draw.status === 'completed' ? 'success' : draw.status === 'active' ? 'info' : 'default'}>
                        {draw.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text">Pending Actions</h3>
              <Link to="/admin/winners" className="text-sm text-primary hover:text-primary-hover">Manage</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingWinners > 0 ? (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-medium text-amber-800">{pendingWinners} winner{pendingWinners !== 1 ? 's' : ''} awaiting review</div>
                    <div className="text-xs text-amber-600">Review proof submissions</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div className="text-sm text-green-700">No pending winner verifications</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Frequency Chart */}
      {scoreFreq.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-text">Score Frequency Distribution</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-40">
              {scoreFreq.map((f) => {
                const count = parseInt(String(f.count), 10);
                return (
                  <div key={f.stableford_points} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-text-muted">{count}</span>
                    <div
                      className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-all"
                      style={{ height: `${(count / maxFreq) * 100}%` }}
                    />
                    <span className="text-[9px] text-text-muted">{f.stableford_points}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-center text-xs text-text-muted">
              Stableford Points (1-45) vs Submission Count
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
