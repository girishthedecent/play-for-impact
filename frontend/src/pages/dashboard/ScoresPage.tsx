import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Lock, Target, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { scoresService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ScoresSkeleton } from '../../components/ui/Skeleton';
import { ScoreTable } from '../../components/scores/ScoreTable';
import type { Score } from '../../types';

const scoreSchema = z.object({
  stablefordPoints: z
    .number({ invalid_type_error: 'Enter points' })
    .int()
    .min(1, 'Points must be at least 1')
    .max(45, 'Maximum Stableford score is 45'),
  courseName: z.string().min(2, 'Course name must have at least 2 characters').max(255),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
});

type ScoreFormData = z.infer<typeof scoreSchema>;

export default function ScoresPage() {
  const { user } = useAuth();
  const isSubscriber = user?.subscriptionStatus === 'active';

  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addForm = useForm<ScoreFormData>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      stablefordPoints: 36,
      courseName: '',
    },
  });

  const editForm = useForm<ScoreFormData>({ resolver: zodResolver(scoreSchema) });

  const fetchScores = async () => {
    try {
      setError(null);
      const data = await scoresService.getScores();
      setScores(data);
    } catch {
      setError('Failed to load scores from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const onAdd = async (data: ScoreFormData) => {
    try {
      setSubmitting(true);
      setError(null);
      await scoresService.createScore(data);
      await fetchScores();
      setShowAddModal(false);
      addForm.reset({
        date: new Date().toISOString().split('T')[0],
        stablefordPoints: 36,
        courseName: '',
      });
      toast.success('Round logged successfully! Latest 5 scores updated.');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr.response?.data?.error || (err instanceof Error ? err.message : 'Failed to add score');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onEdit = async (data: ScoreFormData) => {
    if (!editingScore) return;
    try {
      setSubmitting(true);
      setError(null);
      await scoresService.updateScore(editingScore.id, data);
      await fetchScores();
      setEditingScore(null);
      editForm.reset();
      toast.success('Score updated successfully');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr.response?.data?.error || (err instanceof Error ? err.message : 'Failed to update score');
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (score: Score) => {
    setEditingScore(score);
    editForm.reset({
      stablefordPoints: score.stablefordPoints,
      courseName: score.courseName,
      date: score.date,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this score? It will be removed from your rolling draw qualification.')) return;
    try {
      setError(null);
      await scoresService.deleteScore(id);
      await fetchScores();
      toast.success('Score removed');
    } catch {
      setError('Failed to delete score');
      toast.error('Failed to delete score');
    }
  };

  if (loading) return <ScoresSkeleton />;

  const rollingCount = Math.min(scores.length, 5);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
              Score Management
            </h1>
            <Badge variant="default" dot>Stableford Points (1–45)</Badge>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Your latest 5 scores automatically form your monthly draw ticket. Newer scores replace the oldest.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          disabled={!isSubscriber}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Log Scorecard</span>
        </Button>
      </div>

      {/* Subscription Lock Banner */}
      {!isSubscriber && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              An active subscription is required to submit scores and enter monthly prize draws.
            </span>
          </div>
          <Link to="/dashboard/subscription" className="font-bold underline text-amber-950 shrink-0">
            View Subscription Plans →
          </Link>
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

      {/* Rule Notice Card */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-800">Rolling 5-Score Draw Engine</div>
          <p className="text-slate-500 leading-relaxed">
            Duplicate scores for the same date are not allowed. You currently have{' '}
            <strong className="text-slate-900 font-mono">{rollingCount} of 5</strong> qualifying scores.
            When you enter a 6th score, your oldest record will cycle out automatically.
          </p>
        </div>
      </div>

      {/* Scorecard Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-bold text-slate-900 text-sm">Active Score History</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              {scores.length} recorded
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScoreTable scores={scores} onDelete={handleDelete} onEdit={handleEditOpen} />
        </CardContent>
      </Card>

      {/* Add Score Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          addForm.reset();
        }}
        title="Submit New Golf Scorecard"
      >
        <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
          <Input
            label="Stableford Points (1 – 45)"
            type="number"
            min={1}
            max={45}
            placeholder="e.g. 36"
            error={addForm.formState.errors.stablefordPoints?.message}
            {...addForm.register('stablefordPoints', { valueAsNumber: true })}
          />

          <Input
            label="Golf Course / Club Name"
            placeholder="e.g. Delhi Golf Club or KGA Bangalore"
            error={addForm.formState.errors.courseName?.message}
            {...addForm.register('courseName')}
          />

          <Input
            label="Date of Round"
            type="date"
            error={addForm.formState.errors.date?.message}
            {...addForm.register('date')}
          />

          <p className="text-xs text-slate-400">
            Note: Winners must provide a screenshot verification of their golf app or club handicap card.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setShowAddModal(false);
                addForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save Score
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Score Modal */}
      <Modal
        isOpen={!!editingScore}
        onClose={() => {
          setEditingScore(null);
          editForm.reset();
        }}
        title="Edit Scorecard Entry"
      >
        <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
          <Input
            label="Stableford Points (1 – 45)"
            type="number"
            min={1}
            max={45}
            error={editForm.formState.errors.stablefordPoints?.message}
            {...editForm.register('stablefordPoints', { valueAsNumber: true })}
          />

          <Input
            label="Golf Course / Club Name"
            error={editForm.formState.errors.courseName?.message}
            {...editForm.register('courseName')}
          />

          <Input
            label="Date of Round"
            type="date"
            error={editForm.formState.errors.date?.message}
            {...editForm.register('date')}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setEditingScore(null);
                editForm.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
