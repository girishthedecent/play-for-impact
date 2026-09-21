import { useState } from 'react';
import { User, Mail, Calendar, Heart, Shield, CreditCard, Pencil, Save, X, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { formatDate } from '../../utils/formatDate';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);
      const updates: { fullName?: string; email?: string; currentPassword?: string; newPassword?: string } = {};
      if (fullName !== user.fullName) updates.fullName = fullName;
      if (email !== user.email) updates.email = email;
      if (newPassword) {
        updates.currentPassword = currentPassword;
        updates.newPassword = newPassword;
      }
      if (Object.keys(updates).length === 0) {
        setEditing(false);
        return;
      }
      const updated = await authService.updateProfile(updates);
      updateUser(updated);
      toast.success('Profile updated');
      setEditing(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to update profile';
      setError(msg || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFullName(user.fullName);
    setEmail(user.email);
    setCurrentPassword('');
    setNewPassword('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Profile</h1>
          <p className="text-text-muted mt-1">Your account information</p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary-pale flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-text">{user.fullName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                  {user.role === 'admin' ? <Shield className="h-3 w-3 mr-1 inline" /> : null}
                  {user.role}
                </Badge>
                {user.subscriptionStatus === 'active' && (
                  <Badge variant="success">Active Subscriber</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-border">
              <User className="h-5 w-5 text-text-muted mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-muted">Full Name</div>
                {editing ? (
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <div className="text-text mt-1">{user.fullName}</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-border">
              <Mail className="h-5 w-5 text-text-muted mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-muted">Email Address</div>
                {editing ? (
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <div className="text-text mt-1">{user.email}</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-border">
              <Calendar className="h-5 w-5 text-text-muted mt-0.5" />
              <div>
                <div className="text-sm font-medium text-text-muted">Member Since</div>
                <div className="text-text mt-1">{formatDate(user.createdAt)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-border">
              <CreditCard className="h-5 w-5 text-text-muted mt-0.5" />
              <div>
                <div className="text-sm font-medium text-text-muted">Subscription Plan</div>
                <div className="text-text mt-1 capitalize">
                  {user.subscriptionPlan ? `${user.subscriptionPlan} Plan` : 'No active plan'}
                </div>
                <div className="mt-2">
                  <Badge variant={
                    user.subscriptionStatus === 'active' ? 'success' :
                    user.subscriptionStatus === 'cancelled' ? 'default' : 'default'
                  }>
                    {user.subscriptionStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-border">
              <Heart className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-text-muted">Charity Contribution</div>
                <div className="text-text mt-1">
                  {user.charityContributionPercent
                    ? `${user.charityContributionPercent}% of prize winnings`
                    : 'Not configured'}
                </div>
                {user.selectedCharityId && (
                  <div className="text-sm text-text-muted mt-1">
                    Charity ID: {user.selectedCharityId}
                  </div>
                )}
              </div>
            </div>
          </div>

          {editing && (
            <div className="p-4 rounded-lg bg-gray-50 border border-border space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
                <Lock className="h-4 w-4" />
                Change Password (optional)
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
