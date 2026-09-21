import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CircleDot, LogOut, User, Menu, X, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/charities', label: 'Charities' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/80 transition-transform group-hover:scale-105 shadow-2xs">
                <CircleDot className="h-4 w-4 text-emerald-700" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                Play for Impact
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-slate-900 bg-slate-100 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                  <Button variant="outline" size="sm">
                    <span>{user.role === 'admin' ? 'Admin Portal' : 'My Dashboard'}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 ml-1 opacity-70" />
                  </Button>
                </Link>

                <div className="h-4 w-px bg-slate-200" />

                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/80 shadow-2xs">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>{user.fullName}</span>
                </div>

                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-slate-700">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    Start Playing
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-1.5 text-xs text-slate-500">
                  Signed in as <strong className="text-slate-800">{user.fullName}</strong>
                </div>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    {user.role === 'admin' ? 'Admin Portal' : 'My Dashboard'}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">
                    Join Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
