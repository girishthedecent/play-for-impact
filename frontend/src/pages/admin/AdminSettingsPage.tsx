import { useState, useEffect } from 'react';
import {
  Save,
  ShieldAlert,
  Trophy,
  Heart,
  Sliders,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { adminService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { PlatformSettings } from '../../types';

const settingsSchema = z
  .object({
    platformName: z.string().min(2, 'Platform name must have at least 2 characters').max(100),
    supportEmail: z.string().email('Please enter a valid support email address'),
    defaultPrizePoolPercentage: z
      .number({ invalid_type_error: 'Must be a number' })
      .min(10, 'Minimum prize pool is 10%')
      .max(90, 'Maximum prize pool is 90%'),
    minimumContributionPercent: z
      .number({ invalid_type_error: 'Must be an integer' })
      .int()
      .min(10, 'Minimum mandatory contribution is 10%')
      .max(50, 'Cannot exceed 50% mandatory minimum'),
    maximumScoresPerUser: z
      .number({ invalid_type_error: 'Must be an integer' })
      .int()
      .min(3, 'Minimum 3 scores')
      .max(10, 'Maximum 10 scores (default 5)'),
    tier1MatchShare: z.number().min(1).max(100),
    tier2MatchShare: z.number().min(1).max(100),
    tier3MatchShare: z.number().min(1).max(100),
    jackpotRolloverEnabled: z.boolean(),
    maintenanceMode: z.boolean(),
  })
  .refine(
    (data) => {
      const sum = Math.round((data.tier1MatchShare + data.tier2MatchShare + data.tier3MatchShare) * 10) / 10;
      return sum === 100;
    },
    {
      message: 'The sum of Match tier prize shares (Tier 1 + Tier 2 + Tier 3) must equal exactly 100%',
      path: ['tier1MatchShare'],
    }
  );

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      platformName: 'Play for Impact',
      supportEmail: 'support@playforimpact.in',
      defaultPrizePoolPercentage: 60,
      minimumContributionPercent: 10,
      maximumScoresPerUser: 5,
      tier1MatchShare: 40,
      tier2MatchShare: 35,
      tier3MatchShare: 25,
      jackpotRolloverEnabled: true,
      maintenanceMode: false,
    },
  });

  const tier1 = watch('tier1MatchShare') || 0;
  const tier2 = watch('tier2MatchShare') || 0;
  const tier3 = watch('tier3MatchShare') || 0;
  const totalTierSum = Math.round((Number(tier1) + Number(tier2) + Number(tier3)) * 10) / 10;
  const maintenanceModeActive = watch('maintenanceMode');
  const rolloverActive = watch('jackpotRolloverEnabled');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: PlatformSettings = await adminService.getSettings();
      if (data) {
        reset({
          platformName: data.platformName || 'Play for Impact',
          supportEmail: data.supportEmail || 'support@playforimpact.in',
          defaultPrizePoolPercentage: data.defaultPrizePoolPercentage ?? 60,
          minimumContributionPercent: data.minimumContributionPercent ?? 10,
          maximumScoresPerUser: data.maximumScoresPerUser ?? 5,
          tier1MatchShare: data.tier1MatchShare ?? 40,
          tier2MatchShare: data.tier2MatchShare ?? 35,
          tier3MatchShare: data.tier3MatchShare ?? 25,
          jackpotRolloverEnabled: data.jackpotRolloverEnabled ?? true,
          maintenanceMode: data.maintenanceMode ?? false,
        });
        if (data.updatedAt) {
          setLastUpdated(new Date(data.updatedAt).toLocaleString());
        }
      }
    } catch {
      setError('Unable to load current settings from server. Displaying defaults.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const onSubmit = async (values: SettingsFormData) => {
    try {
      setError(null);
      const updated = await adminService.updateSettings(values);
      setSuccess(true);
      toast.success('Platform settings saved successfully to database');
      if (updated?.updatedAt) {
        setLastUpdated(new Date(updated.updatedAt).toLocaleString());
      }
      reset(values);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr.response?.data?.error || 'Failed to persist settings. Please check your inputs.';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleResetToSystemDefaults = () => {
    setValue('platformName', 'Play for Impact', { shouldDirty: true });
    setValue('supportEmail', 'support@playforimpact.in', { shouldDirty: true });
    setValue('defaultPrizePoolPercentage', 60, { shouldDirty: true });
    setValue('minimumContributionPercent', 10, { shouldDirty: true });
    setValue('maximumScoresPerUser', 5, { shouldDirty: true });
    setValue('tier1MatchShare', 40, { shouldDirty: true });
    setValue('tier2MatchShare', 35, { shouldDirty: true });
    setValue('tier3MatchShare', 25, { shouldDirty: true });
    setValue('jackpotRolloverEnabled', true, { shouldDirty: true });
    setValue('maintenanceMode', false, { shouldDirty: true });
    toast.info('Form fields reset to platform specification defaults. Click "Save Settings" to apply.');
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
            <Badge variant="default" dot>System Config</Badge>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Configure system-wide parameters, prize distribution rules, and operational safeguards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetToSystemDefaults} type="button">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Reset System Defaults
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs underline font-medium ml-4">
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <span>All platform settings updated and persisted successfully to the database.</span>
          </div>
          {lastUpdated && <span className="text-xs text-green-700">Updated: {lastUpdated}</span>}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: General Platform Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <Sliders className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display font-bold text-text text-lg">General Platform Branding</h2>
                <p className="text-xs text-text-muted">Public portal identity and direct support contact</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Platform Name"
                  placeholder="e.g. Play for Impact"
                  error={errors.platformName?.message}
                  {...register('platformName')}
                />
                <p className="text-xs text-text-muted mt-1">Displayed across user header and notification emails.</p>
              </div>

              <div>
                <Input
                  label="Support Email"
                  type="email"
                  placeholder="support@playforimpact.in"
                  error={errors.supportEmail?.message}
                  {...register('supportEmail')}
                />
                <p className="text-xs text-text-muted mt-1">Recipient for winner queries and subscription help.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Financial & Draw Pool Parameters */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Trophy className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Prize Pool & Draw Engine</h2>
                  <p className="text-xs text-slate-500">Official draw engine rules & allocation percentages</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div>
                <Input
                  label="Default Prize Pool % of Subscriptions"
                  type="number"
                  min={10}
                  max={90}
                  error={errors.defaultPrizePoolPercentage?.message}
                  {...register('defaultPrizePoolPercentage', { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Portion of subscriber revenue automatically allocated to monthly draw prize pools.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-950 flex items-center gap-1.5">
                    Jackpot Rollover Rule
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register('jackpotRolloverEnabled')}
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <p className="text-xs text-amber-800">
                  {rolloverActive
                    ? '✓ Enabled: When a 5-match jackpot is not won, the 40% pool carries forward into the subsequent draw.'
                    : '✗ Disabled: Unclaimed 5-match funds will not automatically roll over.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <Heart className="h-5 w-5 text-rose-500" />
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Scoring & Charity Rules</h2>
                  <p className="text-xs text-slate-500">Charity floor & rolling handicap requirements</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div>
                <Input
                  label="Minimum Charity Contribution %"
                  type="number"
                  min={10}
                  max={50}
                  error={errors.minimumContributionPercent?.message}
                  {...register('minimumContributionPercent', { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enforced mandatory floor for signup onboarding (standard minimum is 10%).
                </p>
              </div>

              <div>
                <Input
                  label="Rolling Scores Per Player"
                  type="number"
                  min={3}
                  max={10}
                  error={errors.maximumScoresPerUser?.message}
                  {...register('maximumScoresPerUser', { valueAsNumber: true })}
                />
                <p className="text-xs text-slate-500 mt-1">
                  The latest Stableford scores evaluated for draw entry (Standard format is 5).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Prize Tier Split Matrix */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Prize Tier Allocation Matrix</h2>
                  <p className="text-xs text-slate-500">
                    Exact pool distribution percentage per winning match level (Standard: 40% / 35% / 25%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-text-muted">Total Sum:</span>
                <span
                  className={`text-sm font-bold px-2 py-0.5 rounded ${
                    totalTierSum === 100
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {totalTierSum}% / 100%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {errors.tier1MatchShare && (
              <p className="text-red-600 text-xs mb-3 font-medium bg-red-50 p-2.5 rounded border border-red-200">
                {errors.tier1MatchShare.message}
              </p>
            )}

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-border bg-surface hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-primary">Tier 1 · Jackpot</span>
                  <Badge variant="default">5-Match</Badge>
                </div>
                <Input
                  label="Pool Share (%)"
                  type="number"
                  step="0.5"
                  min={0}
                  max={100}
                  error={errors.tier1MatchShare?.message}
                  {...register('tier1MatchShare', { valueAsNumber: true })}
                />
                <p className="text-xs text-text-muted mt-2">
                  Carries over if unclaimed. Default: <strong>40%</strong>
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-surface hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-text">Tier 2</span>
                  <Badge variant="default">4-Match</Badge>
                </div>
                <Input
                  label="Pool Share (%)"
                  type="number"
                  step="0.5"
                  min={0}
                  max={100}
                  error={errors.tier2MatchShare?.message}
                  {...register('tier2MatchShare', { valueAsNumber: true })}
                />
                <p className="text-xs text-text-muted mt-2">
                  Split equally among winners. Default: <strong>35%</strong>
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-surface hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-text">Tier 3</span>
                  <Badge variant="default">3-Match</Badge>
                </div>
                <Input
                  label="Pool Share (%)"
                  type="number"
                  step="0.5"
                  min={0}
                  max={100}
                  error={errors.tier3MatchShare?.message}
                  {...register('tier3MatchShare', { valueAsNumber: true })}
                />
                <p className="text-xs text-text-muted mt-2">
                  Split equally among winners. Default: <strong>25%</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Operational Safeguards */}
        <Card className={maintenanceModeActive ? 'border-amber-300 bg-amber-50/20' : ''}>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              <div>
                <h2 className="font-display font-bold text-text text-lg">System Guard & Safeguards</h2>
                <p className="text-xs text-text-muted">Platform maintenance and operational safety flags</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-text flex items-center gap-2">
                  Maintenance Mode
                  {maintenanceModeActive && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted max-w-xl">
                  Temporarily display a maintenance banner for non-admin players while performing database updates or major draw calibrations.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...register('maintenanceMode')}
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Info className="h-4 w-4 text-primary" />
            {isDirty ? (
              <span className="text-amber-700 font-medium">You have unsaved changes. Remember to save.</span>
            ) : (
              <span>All settings match saved database state.</span>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={fetchSettings}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-1.5" />
              Save Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
