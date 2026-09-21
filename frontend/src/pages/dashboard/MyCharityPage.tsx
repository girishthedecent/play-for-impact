import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ExternalLink, Settings2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { charitiesService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Charity, CharityStats } from '../../types';

export default function MyCharityPage() {
  const { user } = useAuth();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [stats, setStats] = useState<CharityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCharity() {
      if (!user?.selectedCharityId) {
        setLoading(false);
        return;
      }

      try {
        const [charityData, statsData] = await Promise.all([
          charitiesService.getCharityById(user.selectedCharityId),
          charitiesService.getCharityStats(user.selectedCharityId),
        ]);
        if (!cancelled) {
          setCharity(charityData);
          setStats(statsData);
        }
      } catch {
        if (!cancelled) setError('Failed to load charity details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCharity();
    return () => { cancelled = true; };
  }, [user?.selectedCharityId]);

  const handleDonate = async () => {
    const amount = parseFloat(donationAmount);
    if (!amount || amount < 10) { setDonationError('Minimum donation is ₹10'); return; }
    if (!charity) return;
    try {
      setDonating(true);
      setDonationError(null);
      await charitiesService.donate(charity.id, amount);
      setDonationSuccess(true);
      setDonationAmount('');
      setTimeout(() => setDonationSuccess(false), 5000);
    } catch {
      setDonationError('Failed to process donation. Please try again.');
    } finally {
      setDonating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">My Charity</h1>
          <p className="text-text-muted mt-1">The organisation you're supporting</p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#0F5132] flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">No Charity Selected</h2>
        <p className="text-slate-600 max-w-md mx-auto mb-6 text-sm">
          Choose a verified partner charity to receive a portion of your subscription and any draw winnings you choose to donate.
        </p>
        <Link to="/onboarding">
          <Button className="bg-[#0F5132] hover:bg-[#0A3622] text-white">
            Choose Your Charity
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">My Charity</h1>
          <p className="text-text-muted mt-1">The organisation you're supporting</p>
        </div>
        <Link to="/onboarding">
          <Button variant="outline" size="sm" className="flex items-center gap-2 border-slate-300">
            <Settings2 className="w-4 h-4 text-slate-600" />
            Adjust Charity or %
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-bold text-text">{charity.name}</h2>
              <p className="text-text-muted mt-2">{charity.description}</p>
            </div>
            {charity.website && (
              <a
                href={charity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-hover"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div>
              <div className="text-sm text-text-muted">Your Contribution</div>
              <div className="text-2xl font-bold text-primary">{user?.charityContributionPercent || 0}%</div>
            </div>
            <div>
              <div className="text-sm text-text-muted">Total Raised</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(charity.totalRaised)}</div>
            </div>
            <div>
              <div className="text-sm text-text-muted">Total Donations</div>
              <div className="text-2xl font-bold text-primary">{stats?.donationCount || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats?.recentDonations && stats.recentDonations.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-text mb-4">Recent Donations</h3>
            <div className="space-y-3">
              {stats.recentDonations.map((donation, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-text">Anonymous donor</span>
                  <span className="font-medium text-primary">{formatCurrency(donation.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display font-bold text-text mb-2">Make an additional donation</h3>
          <p className="text-sm text-text-muted mb-4">
            Support {charity.name} with a one-off donation, independent of your subscription.
          </p>
          
          {donationSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4">
              Thank you! Your donation of ₹{donationAmount} has been recorded.
            </div>
          )}
          {donationError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
              {donationError}
            </div>
          )}
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">₹</span>
              <input
                type="number"
                min="10"
                step="10"
                placeholder="100.00"
                value={donationAmount}
                onChange={e => setDonationAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-border rounded-md bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <Button onClick={handleDonate} disabled={donating || !donationAmount}>
              {donating ? 'Processing...' : 'Donate'}
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2">Minimum donation: ₹10</p>
        </CardContent>
      </Card>
    </div>
  );
}
