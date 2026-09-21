import { useState, useEffect } from 'react';
import { Gift, CheckCircle, XCircle, Clock, Image } from 'lucide-react';
import { toast } from 'sonner';
import { winnersService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ScoresSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Winner } from '../../types';

export default function WinningsPage() {
  const [winnings, setWinnings] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchWinnings() {
      try {
        const data = await winnersService.getMyWinnings();
        if (!cancelled) setWinnings(data);
      } catch {
        if (!cancelled) setError('Failed to load winnings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWinnings();
    return () => { cancelled = true; };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPEG and PNG images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be under 5MB');
      return;
    }

    try {
      setUploadError(null);
      setUploadingId(id);
      await winnersService.uploadProof(id, file);
      const data = await winnersService.getMyWinnings();
      setWinnings(data);
      toast.success('Proof uploaded successfully');
    } catch {
      setUploadError('Failed to upload proof');
    } finally {
      setUploadingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) return <ScoresSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">My Winnings</h1>
        <p className="text-text-muted mt-1">Track your prize history and proof submissions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {uploadError}
          <button onClick={() => setUploadError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {winnings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Gift className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold text-text mb-2">No winnings yet</h2>
            <p className="text-text-muted">Keep playing to win in future draws</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {winnings.map((winner) => (
            <Card key={winner.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm text-text-muted">{formatDate(winner.drawDate)}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium text-text">Prize Winner</span>
                      <Badge variant={winner.winnerStatus === 'paid' ? 'success' : winner.winnerStatus === 'approved' ? 'info' : 'default'}>
                        {winner.winnerStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-text-muted">Prize</div>
                    <div className="text-lg font-bold text-primary">{formatCurrency(winner.prizeAmount)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm mb-4">
                  <span className="text-text-muted">Matches:</span>
                  <span className="font-medium text-text">{winner.matchCount} of 5</span>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(winner.winnerStatus)}
                      <span className="text-sm text-text">
                        {winner.winnerStatus === 'approved' && 'Proof approved'}
                        {winner.winnerStatus === 'rejected' && 'Proof rejected'}
                        {winner.winnerStatus === 'paid' && 'Prize paid'}
                        {winner.winnerStatus === 'pending' && winner.imageUrl && 'Proof uploaded — awaiting review'}
                        {winner.winnerStatus === 'pending' && !winner.imageUrl && 'Proof required'}
                      </span>
                    </div>
                    {winner.winnerStatus === 'pending' && !winner.imageUrl && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          disabled={uploadingId === winner.id}
                          onChange={(e) => handleFileSelect(e, winner.id)}
                        />
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium ${
                          uploadingId === winner.id
                            ? 'bg-gray-100 text-text-muted cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary-hover cursor-pointer'
                        }`}>
                          {uploadingId === winner.id ? (
                            <><div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                          ) : (
                            <><Image className="h-4 w-4" /> Upload Proof</>
                          )}
                        </span>
                      </label>
                    )}
                  </div>
                  {winner.rejectionReason && (
                    <div className="mt-2 text-sm text-red-600">
                      Reason: {winner.rejectionReason}
                    </div>
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
