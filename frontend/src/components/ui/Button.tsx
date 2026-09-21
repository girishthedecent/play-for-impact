import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const variants = {
    primary:
      'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs hover:shadow-sm focus-visible:ring-emerald-500/30 border border-emerald-700/30',
    secondary:
      'bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-xs focus-visible:ring-slate-300',
    outline:
      'border border-slate-200/90 bg-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus-visible:ring-emerald-500/20',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus-visible:ring-slate-300',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 shadow-xs focus-visible:ring-rose-500/20 border border-rose-700/30',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs font-medium gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-sm font-medium gap-2 rounded-lg',
    lg: 'h-11 px-5 text-sm font-semibold gap-2.5 rounded-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-0.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
