import { useState, useEffect } from 'react';
import { Users, Trash2, Eye } from 'lucide-react';
import { adminService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ScoresSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import type { User, Score, Subscription } from '../../types';

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // View user detail
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<{ user: User; scores: Score[]; subscription: Subscription | null } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const refresh = async () => {
    const data = await adminService.getUsers();
    setUsers(data);
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        await refresh();
      } catch {
        if (!cancelled) setError('Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUsers();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      setError(null);
      await adminService.deleteUser(id);
      setSuccess('User deleted');
      await refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleViewUser = async (id: string) => {
    try {
      setDetailLoading(true);
      setViewingUser(id);
      const data = await adminService.getUserDetail(id);
      setUserDetail(data);
    } catch {
      setError('Failed to load user details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelSubscription = async (id: string) => {
    if (!confirm('Cancel this user\'s subscription?')) return;
    try {
      setError(null);
      await adminService.cancelUserSubscription(id);
      setSuccess('Subscription cancelled');
      await refresh();
      if (viewingUser === id) {
        const data = await adminService.getUserDetail(id);
        setUserDetail(data);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to cancel subscription');
    }
  };

  if (loading) return <ScoresSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text">Manage Users</h1>
        <p className="text-text-muted mt-1">View and manage user accounts</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium text-text">All Users ({users.length})</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-muted">Joined</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-text">{user.fullName}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={user.subscriptionStatus === 'active' ? 'success' : 'default'}>
                        {user.subscriptionStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-muted">{formatDate(user.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewUser(user.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.role !== 'admin' && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      <Modal isOpen={!!viewingUser} onClose={() => { setViewingUser(null); setUserDetail(null); }} title="User Details" className="max-w-lg">
        {detailLoading ? (
          <div className="p-4 text-center text-text-muted">Loading...</div>
        ) : userDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-text-muted">Name</div>
                <div className="font-medium text-text">{userDetail.user.fullName}</div>
              </div>
              <div>
                <div className="text-text-muted">Email</div>
                <div className="font-medium text-text">{userDetail.user.email}</div>
              </div>
              <div>
                <div className="text-text-muted">Role</div>
                <Badge variant={userDetail.user.role === 'admin' ? 'info' : 'default'}>{userDetail.user.role}</Badge>
              </div>
              <div>
                <div className="text-text-muted">Subscription</div>
                <Badge variant={userDetail.user.subscriptionStatus === 'active' ? 'success' : 'default'}>
                  {userDetail.user.subscriptionStatus}
                </Badge>
              </div>
              {userDetail.subscription && (
                <>
                  <div>
                    <div className="text-text-muted">Plan</div>
                    <div className="font-medium text-text capitalize">{userDetail.subscription.planType}</div>
                  </div>
                  <div>
                    <div className="text-text-muted">Amount</div>
                    <div className="font-medium text-text">{formatCurrency(userDetail.subscription.amount)}</div>
                  </div>
                </>
              )}
              <div>
                <div className="text-text-muted">Scores</div>
                <div className="font-medium text-text">{userDetail.scores.length}</div>
              </div>
              <div>
                <div className="text-text-muted">Joined</div>
                <div className="font-medium text-text">{formatDate(userDetail.user.createdAt)}</div>
              </div>
            </div>

            {userDetail.scores.length > 0 && (
              <div>
                <div className="text-sm font-medium text-text mb-2">Recent Scores</div>
                <div className="space-y-1">
                  {userDetail.scores.slice(0, 5).map((score) => (
                    <div key={score.id} className="flex justify-between text-sm">
                      <span className="text-text-muted">{score.courseName} — {formatDate(score.date)}</span>
                      <span className="font-medium text-text">{score.stablefordPoints} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => { setViewingUser(null); setUserDetail(null); }}>
                Close
              </Button>
              {userDetail.user.subscriptionStatus === 'active' && userDetail.user.role !== 'admin' && (
                <Button
                  variant="ghost"
                  onClick={() => handleCancelSubscription(userDetail.user.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
