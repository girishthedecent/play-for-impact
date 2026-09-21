import { Link, useNavigate } from 'react-router-dom';
import { CircleDot, LogOut, ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../context/SidebarContext';
import { Button } from '../ui/Button';

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggle } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header className="bg-white border-b border-slate-200/80 h-14 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="md:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1 px-2 rounded-md hover:bg-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Public Site</span>
        </Link>

        <div className="hidden sm:block h-4 w-px bg-slate-200" />

        <Link
          to={isAdmin ? '/admin' : '/dashboard'}
          className="flex items-center gap-2 group"
        >
          <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/80">
            <CircleDot className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              Play for Impact
            </span>
            {isAdmin && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-900 leading-tight">
            {user?.fullName}
          </span>
          <span className="text-[11px] text-slate-500 capitalize">
            {isAdmin ? 'System Administrator' : `${user?.subscriptionPlan || 'Basic'} Member`}
          </span>
        </div>

        <div className="h-7 w-px bg-slate-200 hidden sm:block" />

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600">
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
