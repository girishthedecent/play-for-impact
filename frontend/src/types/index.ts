export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: unknown;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  subscriptionStatus: 'inactive' | 'active' | 'cancelled' | 'expired';
  subscriptionPlan?: 'basic' | 'premium' | 'vip';
  selectedCharityId?: string;
  charityContributionPercent?: number;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Score {
  id: string;
  stablefordPoints: number;
  courseName: string;
  date: string;
  createdAt: string;
}

export interface CreateScoreRequest {
  stablefordPoints: number;
  courseName: string;
  date: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  website: string;
  imageUrl: string;
  totalRaised: number;
  isActive: boolean;
  createdAt: string;
}

export interface CharityStats {
  charity: Charity;
  donationCount: number;
  recentDonations: Donation[];
}

export interface Donation {
  amount: number;
  createdAt: string;
  fullName?: string;
}

export interface Draw {
  id: string;
  drawDate: string;
  winningNumbers: number[];
  prizePool: number;
  jackpotRollover: number;
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
}

export interface DrawEntry {
  id: string;
  drawId: string;
  userId: string;
  entryNumbers: number[];
  matchCount: number;
  prizeAmount: number;
  winnerStatus: 'pending' | 'approved' | 'rejected' | 'paid' | 'ineligible';
  drawDate: string;
  winningNumbers: number[];
  fullName?: string;
}

export interface Winner {
  id: string;
  matchCount: number;
  prizeAmount: number;
  winnerStatus: string;
  drawDate: string;
  winningNumbers: number[];
  fullName: string;
  email: string;
  imageUrl?: string;
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface Subscription {
  id: string;
  planType: 'basic' | 'premium' | 'vip';
  status: string;
  amount: number;
  renewalDate: string;
  billingPeriod?: 'monthly' | 'yearly';
}

export interface Analytics {
  totalUsers: number;
  activeSubscriptions: number;
  totalDonations: number;
  totalDraws: number;
  totalWinners: number;
  totalPrizePool?: number;
  totalRevenue?: number;
  totalCharityContributions?: number;
}

export interface PlatformSettings {
  platformName: string;
  defaultPrizePoolPercentage: number;
  minimumContributionPercent: number;
  maximumScoresPerUser: number;
  tier1MatchShare?: number;
  tier2MatchShare?: number;
  tier3MatchShare?: number;
  jackpotRolloverEnabled?: boolean;
  maintenanceMode?: boolean;
  supportEmail?: string;
  updatedAt?: string;
}
