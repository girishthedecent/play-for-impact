import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Heart,
  Trophy,
  Gift,
  User,
  CreditCard,
  Users,
  Settings,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../context/SidebarContext';
import { cn } from '../../utils/cn';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
}

const userLinks: SidebarLink[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/scores', label: 'My Scores', icon: Target },
  { to: '/dashboard/charity', label: 'My Charity', icon: Heart },
  { to: '/dashboard/draws', label: 'Draw History', icon: Trophy },
  { to: '/dashboard/winnings', label: 'My Winnings', icon: Gift },
  { to: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
  { to: '/dashboard/profile', label: 'Account Profile', icon: User },
];

const adminLinks: SidebarLink[] = [
  { to: '/admin', label: 'Overview', icon: BarChart3, exact: true },
  { to: '/admin/users', label: 'Player Accounts', icon: Users },
  { to: '/admin/charities', label: 'Charity Partners', icon: Heart },
  { to: '/admin/draws', label: 'Monthly Draws', icon: Trophy },
  { to: '/admin/winners', label: 'Winner Review', icon: Gift },
  { to: '/admin/settings', label: 'Platform Settings', icon: Settings },
];

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const { open, close } = useSidebar();

  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          'bg-white border-r border-slate-200/80 min-h-[calc(100vh-3.5rem)] flex flex-col justify-between shrink-0',
          'fixed md:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out',
          'pt-14 md:pt-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Mobile close button */}
        <button
          onClick={close}
          className="md:hidden absolute top-3 right-3 p-1.5 rounded-md hover:bg-slate-100 text-slate-500 z-10"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-3.5 space-y-4">
          {/* Context Tag */}
          <div className="px-3 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Admin Control</span>
                </>
              ) : (
                <span>Player Portal</span>
              )}
            </div>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={close}
                  className={cn(
                    'group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon
                      size={17}
                      className={cn(
                        'transition-colors',
                        isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />
                    <span>{link.label}</span>
                  </div>
                  {isActive && (
                    <ChevronRight size={14} className="text-emerald-600/70" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Subscription Quick Info Footer */}
        {!isAdmin && (
          <div className="p-4 m-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Plan Status</span>
              <span
                className={cn(
                  'font-bold capitalize',
                  user?.subscriptionStatus === 'active' ? 'text-emerald-700' : 'text-slate-600'
                )}
              >
                {user?.subscriptionStatus || 'Inactive'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              100% of draw contributions aid partner Indian non-profits.
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
