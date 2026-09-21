import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 tracking-tight">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2 text-sm bg-white border border-slate-200/90 rounded-lg text-slate-900 placeholder:text-slate-400 shadow-xs transition-colors focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-slate-500 leading-normal">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-rose-600 font-medium leading-normal">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
