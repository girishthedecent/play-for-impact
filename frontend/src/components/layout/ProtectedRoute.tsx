import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../ui/Skeleton';

interface ProtectedRouteProps {
  requiredRole?: 'user' | 'admin';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasCheckoutSession = new URLSearchParams(location.search).has('session_id');
  const isSetupComplete = Boolean(user.onboardingCompleted || user.subscriptionStatus === 'active');

  // Redirect to onboarding for users who haven't completed it (unless already on /onboarding or confirming checkout)
  if (!isSetupComplete && user.role !== 'admin' && !requiredRole && location.pathname !== '/onboarding' && !hasCheckoutSession) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
