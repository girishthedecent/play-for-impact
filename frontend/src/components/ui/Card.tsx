import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className, elevated = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/90 rounded-xl transition-all duration-200',
        elevated
          ? 'shadow-sm hover:shadow hover:border-slate-300'
          : 'shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-xl', className)}>
      {children}
    </div>
  );
}
