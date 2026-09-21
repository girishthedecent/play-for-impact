import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
          onClick={onClose}
        />
        <div
          className={cn(
            'relative bg-white rounded-2xl shadow-xl border border-slate-200/80 max-w-md w-full p-6 z-10 animate-in zoom-in-95 duration-150',
            className
          )}
        >
          {title && (
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
