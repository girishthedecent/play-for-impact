import { useState, useEffect } from 'react';
import { Trophy, Plus, Play, Send, Eye } from 'lucide-react';
import { adminService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ScoresSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Draw } from '../../types';

export default function ManageDrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState('');
  const [createPrizePool, setCreatePrizePool] = useState('1000');
  const [creating, setCreating] = useState(false);

  // Simulate confirm
  const [simulateId, setSimulateId] = useState<string | null>(null);
  const [simulateAlgorithm, setSimulateAlgorithm] = useState<'random' | 'weighted'>('random');
  const [simulating, setSimulating] = useState(false);
  const [simulateResult, setSimulateResult] = useState<{ drawId: string; winningNumbers: number[]; algorithm: string } | null>(null);

  // Publish confirm
  const [publishId, setPublishId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    totalEntrants: number;
    winners5Match: number;
    winners4Match: number;
    winners3Match: number;
    newRollover: number;
  } | null>(null);

  // View detail
  const [viewingDraw, setViewingDraw] = useState<Draw | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDraws() {
      try {
        const data = await adminService.getDrawStats();
        if (!cancelled) setDraws(data.recentDraws);
      } catch {
        if (!cancelled) setError('Failed to load draws');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDraws();
    return () => { cancelled = true; };
  }, []);

  const refreshDraws = async () => {
    const data = await adminService.getDrawStats();
    setDraws(data.recentDraws);
  };

  const handleCreate = async () => {
    if (!createDate) return;
    try {
      setCreating(true);
      setError(null);
      await adminService.createDraw(createDate, parseFloat(createPrizePool) || 1000);
      setShowCreateModal(false);
      setCreateDate('');
      setCreatePrizePool('1000');
      setSuccess('Draw created successfully');
      await refreshDraws();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Failed to create draw');
    } finally {
      setCreating(false);
    }
  };

  const handleSimulate = async () => {
    if (!simulateId) return;
    try {
      setSimulating(true);
      setError(null);
      const result = await adminService.simulateDraw(simulateId, simulateAlgorithm);
      setSimulateResult(result);
      setSimulateId(null);
      await refreshDraws();
    } catch {
      setError('Failed to simulate draw');
    } finally {
      setSimulating(false);
    }
  };

  const handlePublish = async () => {
    if (!publishId) return;
    try {
      setPublishing(true);
      setError(null);
      const result = await adminService.publishDraw(publishId);
      setPublishResult(result);
      setPublishId(null);
      await refreshDraws();
      setTimeout(() => setPublishResult(null), 5000);
    } catch {
      setError('Failed to publish draw');
    } finally {
      setPublishing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'active':
        return <Badge variant="info">Active</Badge>;
      default:
        return <Badge variant="default">Pending</Badge>;
    }
  };

  // Default draw date = first of next month
  const getNextMonthFirst = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
  };

  if (loading) return <ScoresSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Manage Draws</h1>
          <p className="text-text-muted mt-1">Create, simulate, and publish monthly draws</p>
        </div>
        <Button onClick={() => { setCreateDate(getNextMonthFirst()); setShowCreateModal(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Draw
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}

      {/* Publish result banner */}
      {publishResult && (
        <div className="bg-primary-pale border border-primary/20 rounded-md p-4">
          <h3 className="font-medium text-primary mb-2">Draw Published!</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-text-muted">Entrants</div>
              <div className="font-bold text-text">{publishResult.totalEntrants}</div>
            </div>
            <div>
              <div className="text-text-muted">5-Match</div>
              <div className="font-bold text-text">{publishResult.winners5Match}</div>
            </div>
            <div>
              <div className="text-text-muted">4-Match</div>
              <div className="font-bold text-text">{publishResult.winners4Match}</div>
            </div>
            <div>
              <div className="text-text-muted">3-Match</div>
              <div className="font-bold text-text">{publishResult.winners3Match}</div>
            </div>
            <div>
              <div className="text-text-muted">New Rollover</div>
              <div className="font-bold text-primary">{formatCurrency(publishResult.newRollover)}</div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-medium text-text">Draw History</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {draws.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No draws created yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Draw Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Prize Pool</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Rollover</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Winning Numbers</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((draw) => (
                    <tr key={draw.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-text">{formatDate(draw.drawDate)}</td>
                      <td className="py-3 px-4">{getStatusBadge(draw.status)}</td>
                      <td className="py-3 px-4 text-sm text-text text-right">{formatCurrency(draw.prizePool)}</td>
                      <td className="py-3 px-4 text-sm text-text text-right">{formatCurrency(draw.jackpotRollover)}</td>
                      <td className="py-3 px-4 text-sm text-text text-right">
                        {draw.winningNumbers?.length > 0
                          ? draw.winningNumbers.join(', ')
                          : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {draw.status === 'pending' && (!draw.winningNumbers || draw.winningNumbers.length === 0) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSimulateId(draw.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Simulate
                            </Button>
                          )}
                          {draw.status === 'pending' && draw.winningNumbers && draw.winningNumbers.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPublishId(draw.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Publish
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingDraw(draw)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Draw Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Draw">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Draw Date</label>
            <Input
              type="date"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Prize Pool (₹)</label>
            <Input
              type="number"
              value={createPrizePool}
              onChange={(e) => setCreatePrizePool(e.target.value)}
              min="0"
              step="100"
            />
            <p className="text-xs text-text-muted mt-1">
              Leave at 1000 to use auto-calculation based on active subscriber revenue.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create Draw</Button>
          </div>
        </div>
      </Modal>

      {/* Simulate Confirm Modal */}
      <Modal isOpen={!!simulateId} onClose={() => setSimulateId(null)} title="Simulate Draw">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            This will generate 5 random winning numbers for this draw. You can review before publishing.
          </p>
          <div className="space-y-3">
            <div className="text-sm font-medium text-text">Draw Algorithm</div>
            <div className="grid grid-cols-2 gap-3">
              {(['random', 'weighted'] as const).map(algo => (
                <button
                  key={algo}
                  type="button"
                  onClick={() => setSimulateAlgorithm(algo)}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    simulateAlgorithm === algo
                      ? 'border-primary bg-primary-pale'
                      : 'border-border hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-text capitalize">{algo}</div>
                  <div className="text-xs text-text-muted mt-1">
                    {algo === 'random'
                      ? 'Standard lottery-style random draw'
                      : 'Numbers weighted by score frequency across all players'}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSimulateId(null)}>Cancel</Button>
            <Button onClick={handleSimulate} loading={simulating}>
              <Play className="h-4 w-4 mr-1" />
              Generate Numbers
            </Button>
          </div>
        </div>
      </Modal>

      {/* Simulate Result Modal */}
      <Modal isOpen={!!simulateResult} onClose={() => setSimulateResult(null)} title="Winning Numbers Generated">
        {simulateResult && (
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {simulateResult.winningNumbers.map((num, i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
                  {num}
                </div>
              ))}
            </div>
            {simulateResult?.algorithm && (
              <p className="text-xs text-text-muted text-center mt-2">
                Algorithm: <span className="font-medium capitalize">{simulateResult.algorithm}</span>
              </p>
            )}
            <p className="text-sm text-text-muted text-center">
              Review these numbers. When ready, click Publish to match against all entries.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setSimulateResult(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Publish Confirm Modal */}
      <Modal isOpen={!!publishId} onClose={() => setPublishId(null)} title="Publish Draw">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            This will match all subscriber entries against the winning numbers, calculate prizes, and distribute winnings. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPublishId(null)}>Cancel</Button>
            <Button onClick={handlePublish} loading={publishing}>
              <Send className="h-4 w-4 mr-1" />
              Publish Draw
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Draw Modal */}
      <Modal isOpen={!!viewingDraw} onClose={() => setViewingDraw(null)} title={`Draw — ${viewingDraw ? formatDate(viewingDraw.drawDate) : ''}`}>
        {viewingDraw && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-text-muted">Status</div>
                <div>{getStatusBadge(viewingDraw.status)}</div>
              </div>
              <div>
                <div className="text-text-muted">Prize Pool</div>
                <div className="font-bold text-text">{formatCurrency(viewingDraw.prizePool)}</div>
              </div>
              <div>
                <div className="text-text-muted">Rollover</div>
                <div className="font-bold text-text">{formatCurrency(viewingDraw.jackpotRollover)}</div>
              </div>
              <div>
                <div className="text-text-muted">Winning Numbers</div>
                <div className="flex gap-1 mt-1">
                  {viewingDraw.winningNumbers?.length > 0
                    ? viewingDraw.winningNumbers.map((n, i) => (
                        <span key={i} className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                          {n}
                        </span>
                      ))
                    : <span className="text-text-muted">Not yet simulated</span>
                  }
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setViewingDraw(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
