import { useState, useEffect } from 'react';
import { Trophy, Check } from 'lucide-react';
import { drawsService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoresSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import type { DrawEntry, Draw } from '../../types';

export default function DrawsPage() {
  const [draws, setDraws] = useState<DrawEntry[]>([]);
  const [upcomingDraws, setUpcomingDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDraws() {
      try {
        const [myDrawsRes, upcomingDrawsRes] = await Promise.allSettled([
          drawsService.getMyDraws(),
          drawsService.getUpcomingDraws()
        ]);
        
        if (cancelled) return;
        
        if (myDrawsRes.status === 'fulfilled') {
          setDraws(myDrawsRes.value);
        }
        if (upcomingDrawsRes.status === 'fulfilled') {
          setUpcomingDraws(upcomingDrawsRes.value);
        }
      } catch {
        if (!cancelled) setError('Failed to load draws');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDraws();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <ScoresSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">My Draws</h1>
        <p className="text-text-muted mt-1">Your monthly draw entries and results</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {upcomingDraws.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-display font-bold text-text mb-4">Upcoming Draw</h2>
            {upcomingDraws.slice(0, 1).map((draw) => (
              <div key={draw.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-text">{formatDate(draw.drawDate)}</div>
                    <div className="text-sm text-text-muted mt-1">Prize pool: {formatCurrency(draw.prizePool)}</div>
                  </div>
                  <Badge variant="default">Upcoming</Badge>
                </div>
                {draw.jackpotRollover > 0 && (
                  <div className="text-sm text-primary">
                    Jackpot rollover: {formatCurrency(draw.jackpotRollover)}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {draws.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-text mb-2">No draw entries yet</h2>
            <p className="text-text-muted">Subscribe to start entering monthly draws</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {draws.filter(d => d.winnerStatus !== 'ineligible').map((draw) => (
            <Card key={draw.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-text-muted">{formatDate(draw.drawDate)}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium text-text">Draw Entry</span>
                      <Badge variant={draw.winnerStatus === 'paid' ? 'success' : draw.winnerStatus === 'approved' ? 'info' : 'default'}>
                        {draw.winnerStatus}
                      </Badge>
                    </div>
                  </div>
                  {draw.prizeAmount > 0 && (
                    <div className="text-right">
                      <div className="text-sm text-text-muted">Prize</div>
                      <div className="text-lg font-bold text-primary">{formatCurrency(draw.prizeAmount)}</div>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-text-muted mb-2">Winning Numbers</div>
                    {draw.winningNumbers && draw.winningNumbers.length > 0 ? (
                      <div className="flex gap-2">
                        {draw.winningNumbers.map((num, i) => (
                          <div key={i} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                            {num}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-text-muted">Results pending</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-text-muted mb-2">Your Numbers</div>
                    {draw.entryNumbers && draw.entryNumbers.length > 0 ? (
                      <div className="flex gap-2">
                        {draw.entryNumbers.map((num, i) => {
                          const isMatch = draw.winningNumbers?.includes(num);
                          return (
                            <div
                              key={i}
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                isMatch ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-text-muted'
                              }`}
                            >
                              {num}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-text-muted">Results pending</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="text-text-muted">Matches:</span>
                  <span className="font-medium text-text">{draw.matchCount} of 5</span>
                  {draw.matchCount >= 3 && draw.winnerStatus !== 'rejected' && (
                    <Badge variant="success">
                      <Check className="h-3 w-3 mr-1" /> Winner
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
