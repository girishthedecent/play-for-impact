import { useState, useEffect } from 'react';
import { ArrowUpRight, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { scoresService } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

interface LeaderboardEntry {
  userId: string;
  fullName: string;
  totalPoints: number;
  avgScore: number;
  scoreCount: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      try {
        const data = await scoresService.getLeaderboard();
        if (!cancelled) setLeaderboard(data);
      } catch {
        if (!cancelled) setError('Failed to load leaderboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="h-7 w-7 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs border border-amber-300 shadow-2xs">
            1
          </span>
        );
      case 2:
        return (
          <span className="h-7 w-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-300 shadow-2xs">
            2
          </span>
        );
      case 3:
        return (
          <span className="h-7 w-7 rounded-full bg-amber-800/15 text-amber-900 flex items-center justify-center font-bold text-xs border border-amber-800/30 shadow-2xs">
            3
          </span>
        );
      default:
        return (
          <span className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-xs">
            {rank}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-4">
          <Badge variant="default" dot>Amateur Stableford Rankings</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Player Leaderboard
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Cumulative Stableford points across active player rounds. Updated automatically
            as new cards are verified.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <Card className="text-center py-16 space-y-4">
              <Award className="h-12 w-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <div className="text-base font-semibold text-slate-800">No scorecards recorded yet</div>
                <p className="text-xs text-slate-500">Sign in and submit your first round to take the lead.</p>
              </div>
              <Link to="/register">
                <Button size="sm">Register & Play</Button>
              </Link>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5 w-16 text-center">Rank</th>
                      <th className="py-3.5 px-5">Player Name</th>
                      <th className="py-3.5 px-5 text-right">Rounds</th>
                      <th className="py-3.5 px-5 text-right">Average</th>
                      <th className="py-3.5 px-5 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {leaderboard.map((entry, index) => {
                      const rank = index + 1;
                      const isPodium = rank <= 3;
                      return (
                        <tr
                          key={entry.userId}
                          className={`transition-colors hover:bg-slate-50/70 ${
                            isPodium ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-4 px-5 text-center font-medium">
                            <div className="flex justify-center">{getRankBadge(rank)}</div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span>{entry.fullName}</span>
                              {rank === 1 && (
                                <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                  Leader
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-right text-slate-600 font-medium tabular-nums">
                            {entry.scoreCount}
                          </td>
                          <td className="py-4 px-5 text-right text-slate-600 font-medium tabular-nums">
                            {Number(entry.avgScore).toFixed(1)}
                          </td>
                          <td className="py-4 px-5 text-right font-bold text-slate-900 tabular-nums">
                            {entry.totalPoints}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Quick CTA footer */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-sm font-bold text-slate-900">Want your scores ranked?</div>
              <p className="text-xs text-slate-500">
                Log your weekend rounds to qualify for the monthly draw pool.
              </p>
            </div>
            <Link to="/register">
              <Button size="sm">
                <span>Join Leaderboard</span>
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
