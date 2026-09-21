import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { AdminLayout } from './pages/admin/AdminLayout';

// Public pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import LeaderboardPage from './pages/public/LeaderboardPage';
import CharitiesPage from './pages/public/CharitiesPage';
import NotFoundPage from './pages/public/NotFoundPage';

// Onboarding
import OnboardingWizard from './pages/onboarding/OnboardingWizard';

// Dashboard pages
import OverviewPage from './pages/dashboard/OverviewPage';
import ScoresPage from './pages/dashboard/ScoresPage';
import MyCharityPage from './pages/dashboard/MyCharityPage';
import DrawsPage from './pages/dashboard/DrawsPage';
import WinningsPage from './pages/dashboard/WinningsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import SubscriptionPage from './pages/dashboard/SubscriptionPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageCharitiesPage from './pages/admin/ManageCharitiesPage';
import ManageDrawsPage from './pages/admin/ManageDrawsPage';
import ManageWinnersPage from './pages/admin/ManageWinnersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/charities" element={<CharitiesPage />} />
          </Route>

          {/* Protected routes - require auth */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="scores" element={<ScoresPage />} />
              <Route path="charity" element={<MyCharityPage />} />
              <Route path="draws" element={<DrawsPage />} />
              <Route path="winnings" element={<WinningsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<ManageUsersPage />} />
              <Route path="charities" element={<ManageCharitiesPage />} />
              <Route path="draws" element={<ManageDrawsPage />} />
              <Route path="winners" element={<ManageWinnersPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
