export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'user' | 'admin';
  subscription_status: 'inactive' | 'active' | 'cancelled' | 'expired';
  subscription_plan: string | null;
  selected_charity_id: string | null;
  charity_contribution_percent: number;
  onboarding_completed: boolean;
  created_at: string;
}

export interface ScoreRow {
  id: string;
  user_id: string;
  stableford_points: number;
  course_name: string;
  date: string;
  created_at: string;
}

export interface CharityRow {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  image_url: string | null;
  total_raised: number | string;
  is_active: boolean;
  created_at: string;
}

export interface DonationRow {
  id: string;
  user_id: string;
  charity_id: string;
  draw_entry_id?: string | null;
  amount: number | string;
  created_at: string;
  full_name?: string;
}

export interface DrawRow {
  id: string;
  draw_date: string;
  winning_numbers: number[] | null;
  prize_pool: number | string;
  jackpot_rollover: number | string;
  status: 'pending' | 'active' | 'completed';
  algorithm?: 'random' | 'weighted';
  created_at: string;
}

export interface DrawEntryRow {
  id: string;
  draw_id: string;
  user_id: string;
  entry_numbers: number[];
  match_count: number;
  prize_amount: number | string;
  winner_status: 'pending' | 'approved' | 'rejected' | 'paid' | 'ineligible';
  created_at: string;
  draw_date?: string;
  winning_numbers?: number[];
  draw_status?: string;
  full_name?: string;
  email?: string;
}

export interface WinnerProofRow {
  id: string;
  draw_entry_id: string;
  user_id: string;
  image_url: string;
  image_type: string | null;
  image_size: number | null;
  rejection_reason?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  amount: number | string;
  renewal_date: string;
  billing_period?: string;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PlatformSettingsRow {
  id: string;
  platform_name: string;
  default_prize_pool_percentage: string | number;
  minimum_contribution_percent: number;
  maximum_scores_per_user: number;
  tier1_match_share: string | number;
  tier2_match_share: string | number;
  tier3_match_share: string | number;
  jackpot_rollover_enabled: boolean;
  maintenance_mode: boolean;
  support_email: string;
  updated_at: string;
}

export interface LeaderboardRow {
  user_id: string;
  full_name: string;
  total_points: number;
  avg_score: number;
  score_count: number;
}
