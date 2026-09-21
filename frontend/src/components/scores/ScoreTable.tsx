import { Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import type { Score } from '../../types';

interface ScoreTableProps {
  scores: Score[];
  onDelete?: (id: string) => void;
  onEdit?: (score: Score) => void;
}

export function ScoreTable({ scores, onDelete, onEdit }: ScoreTableProps) {
  if (scores.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-xs">
        No golf scores recorded yet. Add your first round scorecard to qualify for the draw!
      </div>
    );
  }

  const hasActions = onDelete || onEdit;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200/80 bg-slate-50/60 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-5">Date</th>
            <th className="py-3 px-5">Golf Club / Course</th>
            <th className="py-3 px-5 text-right">Points</th>
            {hasActions && (
              <th className="py-3 px-5 text-right w-24">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {scores.map((score, index) => {
            const isLatestFive = index < 5;
            return (
              <tr
                key={score.id}
                className="hover:bg-slate-50/60 transition-colors"
              >
                <td className="py-3.5 px-5 text-xs text-slate-600 font-medium whitespace-nowrap">
                  {formatDate(score.date)}
                </td>
                <td className="py-3.5 px-5 text-sm text-slate-900 font-semibold">
                  <div className="flex items-center gap-2">
                    <span>{score.courseName}</span>
                    {isLatestFive && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                        Active Draw
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <span className="inline-flex items-center justify-center min-w-[2.25rem] h-7 px-2 rounded-md bg-slate-100 text-slate-900 font-mono font-bold text-xs border border-slate-200/70">
                    {score.stablefordPoints}
                  </span>
                </td>
                {hasActions && (
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(score)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Edit scorecard"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(score.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete scorecard"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
