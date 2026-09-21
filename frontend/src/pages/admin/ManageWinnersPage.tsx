import { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, DollarSign, Eye, ExternalLink, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ScoresSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Winner } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export default function ManageWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reject modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Proof preview modal
  const [previewProof, setPreviewProof] = useState<Winner | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchWinners() {
      try {
        const data = await adminService.getWinners();
        if (!cancelled) setWinners(data);
      } catch {
        if (!cancelled) setError('Failed to load winners');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWinners();
    return () => { cancelled = true; };
  }, []);

  const refresh = async () => {
    const data = await adminService.getWinners();
    setWinners(data);
  };

  const handleApprove = async (id: string) => {
    try {
      setError(null);
      await adminService.approveWinner(id);
      setSuccess('Winner approved');
      await refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to approve winner');
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      setRejecting(true);
      setError(null);
      await adminService.rejectWinner(rejectId, rejectReason || 'No reason provided');
      setRejectId(null);
      setRejectReason('');
      setSuccess('Winner rejected');
      await refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to reject winner');
    } finally {
      setRejecting(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      setError(null);
      await adminService.markWinnerPaid(id);
      setSuccess('Winner marked as paid');
      await refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to mark as paid');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      case 'paid':
        return <Badge variant="info">Paid</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  if (loading) return <ScoresSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Manage Winners</h1>
        <p className="text-text-muted mt-1">Review and manage prize winners</p>
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-medium text-text">Winner Submissions ({winners.length})</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {winners.length === 0 ? (
            <div className="p-8 text-center text-text-muted">No winner submissions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Winner</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Draw Date</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-text-muted">Matches</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Prize</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-text-muted">Proof</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((winner) => (
                    <tr key={winner.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-text">{winner.fullName}</div>
                        <div className="text-xs text-text-muted">{winner.email}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-text-muted">{formatDate(winner.drawDate)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-text">{winner.matchCount}/5</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-text text-right font-bold">
                        {formatCurrency(winner.prizeAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {winner.imageUrl ? (
                          <button
                            onClick={() => {
                              setImageError(false);
                              setPreviewProof(winner);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium bg-primary-pale px-2.5 py-1 rounded-md border border-primary/20"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Proof
                          </button>
                        ) : (
                          <span className="text-xs text-text-muted">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(winner.winnerStatus)}</td>
                      <td className="py-3 px-4 text-right">
                        {winner.winnerStatus === 'pending' && !winner.imageUrl && (
                          <span className="text-xs text-text-muted mr-2">Awaiting proof</span>
                        )}
                        {winner.winnerStatus === 'pending' && winner.imageUrl && (
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleApprove(winner.id)} title="Approve">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setRejectId(winner.id)} title="Reject">
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                        {winner.winnerStatus === 'approved' && (
                          <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(winner.id)} title="Mark Paid">
                            <DollarSign className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proof Preview Modal */}
      <Modal
        isOpen={!!previewProof}
        onClose={() => setPreviewProof(null)}
        title={`Winner Proof - ${previewProof?.fullName}`}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-text-muted">Draw Date:</span>
              <span className="font-medium text-text">{previewProof ? formatDate(previewProof.drawDate) : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Matches:</span>
              <span className="font-medium text-text">{previewProof?.matchCount} / 5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Prize:</span>
              <span className="font-bold text-primary">{previewProof ? formatCurrency(previewProof.prizeAmount) : ''}</span>
            </div>
          </div>

          {previewProof?.imageUrl ? (() => {
            const raw = previewProof.imageUrl;
            const fullUrl = raw.startsWith('http') ? raw : `${API_ORIGIN}${raw.startsWith('/') ? '' : '/'}${raw}`;
            return (
              <div className="border border-border rounded-lg overflow-hidden bg-black/5 flex flex-col items-center justify-center p-3 min-h-48">
                {imageError ? (
                  <div className="text-center p-6 space-y-3">
                    <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                    <div>
                      <p className="text-sm font-medium text-text">Preview could not be displayed directly</p>
                      <p className="text-xs text-text-muted mt-1 max-w-sm">
                        Your browser security settings, Brave shields, or ad-blocker may be blocking cross-origin image previews.
                      </p>
                    </div>
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-colors"
                    >
                      Open image in new tab <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <img
                    src={fullUrl}
                    alt="Winner score card proof"
                    crossOrigin="anonymous"
                    onError={() => setImageError(true)}
                    className="max-h-96 w-auto object-contain rounded"
                  />
                )}
              </div>
            );
          })() : null}

          <div className="flex justify-between items-center pt-2">
            {previewProof?.imageUrl && (() => {
              const raw = previewProof.imageUrl;
              const fullUrl = raw.startsWith('http') ? raw : `${API_ORIGIN}${raw.startsWith('/') ? '' : '/'}${raw}`;
              return (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Open original <ExternalLink className="h-3.5 w-3.5" />
                </a>
              );
            })()}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" onClick={() => setPreviewProof(null)}>Close</Button>
              {previewProof?.winnerStatus === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      const id = previewProof.id;
                      setPreviewProof(null);
                      setRejectId(id);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      const id = previewProof.id;
                      setPreviewProof(null);
                      handleApprove(id);
                    }}
                  >
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectId} onClose={() => { setRejectId(null); setRejectReason(''); }} title="Reject Winner">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Reason (optional)</label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setRejectId(null); setRejectReason(''); }}>Cancel</Button>
            <Button onClick={handleReject} loading={rejecting} className="bg-red-600 hover:bg-red-700 text-white">
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
