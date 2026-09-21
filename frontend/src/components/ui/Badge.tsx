import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
  dot?: boolean;
}

export function Badge({ children, variant = 'default', className, dot = false }: BadgeProps) {
  const variants = {
    default: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/90',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    error: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
  };

  const dotColors = {
    default: 'bg-emerald-500',
    neutral: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    info: 'bg-sky-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-tight select-none',
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}
