import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 rounded',
        className
      )}
    />
  );
}

export function ScoresSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
