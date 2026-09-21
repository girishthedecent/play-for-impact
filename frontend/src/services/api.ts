import axios from 'axios';
import type { ApiResponse, User, Score, CreateScoreRequest, Charity, Draw, DrawEntry, Winner, Subscription, Analytics, PlatformSettings } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1';

// Raw DB response shapes (snake_case from backend)
interface RawScore {
  id: string;
  stableford_points: number;
  course_name: string;
  date: string;
  created_at: string;
}

interface RawCharity {
  id: string;
  name: string;
  description: string;
  website: string;
  image_url: string;
  total_raised: string | number;
  is_active: boolean;
  created_at: string;
}

interface RawUser {
  id: string;
  email: string;
  full_name?: string;
  fullName?: string;
  role: 'user' | 'admin';
  subscription_status?: 'inactive' | 'active' | 'cancelled' | 'expired';
  subscriptionStatus?: 'inactive' | 'active' | 'cancelled' | 'expired';
  subscription_plan?: 'basic' | 'premium' | 'vip';
  subscriptionPlan?: 'basic' | 'premium' | 'vip';
  selected_charity_id?: string | null;
  selectedCharityId?: string | null;
  charity_contribution_percent?: number;
  charityContributionPercent?: number;
  onboarding_completed?: boolean;
  onboardingCompleted?: boolean;
  created_at?: string;
  createdAt?: string;
}

interface RawDraw {
  id: string;
  draw_date: string;
  winning_numbers: number[];
  prize_pool: string | number;
  jackpot_rollover: string | number;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
}

interface RawDrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  entry_numbers: number[];
  match_count: number;
  prize_amount: string | number;
  winner_status: 'pending' | 'approved' | 'rejected' | 'paid' | 'ineligible';
  draw_date: string;
  winning_numbers: number[];
  full_name?: string;
}

interface RawWinner {
  id: string;
  match_count: number;
  prize_amount: string | number;
  winner_status: string;
  draw_date: string;
  winning_numbers: number[];
  full_name: string;
  email: string;
  image_url?: string;
  rejection_reason?: string;
  verified_at?: string;
}

interface RawSubscription {
  id: string;
  plan_type: 'basic' | 'premium' | 'vip';
  status: string;
  amount: string | number;
  renewal_date: string;
}

// Mappers: convert snake_case DB rows to camelCase frontend types
function mapScore(raw: RawScore): Score {
  return {
    id: raw.id,
    stablefordPoints: raw.stableford_points,
    courseName: raw.course_name,
    date: raw.date,
    createdAt: raw.created_at,
  };
}

function mapCharity(raw: RawCharity): Charity {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    website: raw.website,
    imageUrl: raw.image_url,
    totalRaised: parseFloat(String(raw.total_raised)) || 0,
    isActive: raw.is_active,
    createdAt: raw.created_at,
  };
}

function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.fullName ?? raw.full_name ?? '',
    role: raw.role,
    subscriptionStatus: (raw.subscriptionStatus ?? raw.subscription_status ?? 'inactive') as 'inactive' | 'active' | 'cancelled' | 'expired',
    subscriptionPlan: (raw.subscriptionPlan ?? raw.subscription_plan) as 'basic' | 'premium' | 'vip' | undefined,
    selectedCharityId: raw.selectedCharityId ?? raw.selected_charity_id ?? undefined,
    charityContributionPercent: raw.charityContributionPercent ?? raw.charity_contribution_percent ?? 10,
    onboardingCompleted: Boolean(raw.onboardingCompleted ?? raw.onboarding_completed),
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

function mapDraw(raw: RawDraw): Draw {
  return {
    id: raw.id,
    drawDate: raw.draw_date,
    winningNumbers: raw.winning_numbers || [],
    prizePool: parseFloat(String(raw.prize_pool)) || 0,
    jackpotRollover: parseFloat(String(raw.jackpot_rollover)) || 0,
    status: raw.status,
    createdAt: raw.created_at,
  };
}

function mapDrawEntry(raw: RawDrawEntry): DrawEntry {
  return {
    id: raw.id,
    drawId: raw.draw_id,
    userId: raw.user_id,
    entryNumbers: raw.entry_numbers || [],
    matchCount: raw.match_count,
    prizeAmount: parseFloat(String(raw.prize_amount)) || 0,
    winnerStatus: raw.winner_status,
    drawDate: raw.draw_date,
    winningNumbers: raw.winning_numbers || [],
    fullName: raw.full_name,
  };
}

function mapWinner(raw: RawWinner): Winner {
  return {
    id: raw.id,
    matchCount: raw.match_count,
    prizeAmount: parseFloat(String(raw.prize_amount)) || 0,
    winnerStatus: raw.winner_status,
    drawDate: raw.draw_date,
    winningNumbers: raw.winning_numbers || [],
    fullName: raw.full_name,
    email: raw.email,
    imageUrl: raw.image_url,
    rejectionReason: raw.rejection_reason,
    verifiedAt: raw.verified_at,
  };
}

function mapSubscription(raw: RawSubscription): Subscription {
  return {
    id: raw.id,
    planType: raw.plan_type,
    status: raw.status,
    amount: parseFloat(String(raw.amount)) || 0,
    renewalDate: raw.renewal_date,
  };
}

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — clear token and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(email: string, password: string, fullName: string) {
    const response = await API.post<ApiResponse<{ user: RawUser; token: string }>>('/auth/register', {
      email,
      password,
      fullName,
    });
    const raw = response.data.data;
    return { user: mapUser(raw.user), token: raw.token };
  },

  async login(email: string, password: string) {
    const response = await API.post<ApiResponse<{ user: RawUser; token: string }>>('/auth/login', {
      email,
      password,
    });
    const raw = response.data.data;
    return { user: mapUser(raw.user), token: raw.token };
  },

  async getMe() {
    const response = await API.get<ApiResponse<RawUser>>('/auth/me');
    return mapUser(response.data.data);
  },

  async updateProfile(data: { fullName?: string; email?: string; currentPassword?: string; newPassword?: string }) {
    const response = await API.put<ApiResponse<RawUser>>('/auth/profile', data);
    return mapUser(response.data.data);
  },
};

export const scoresService = {
  async getScores() {
    const response = await API.get<ApiResponse<RawScore[]>>('/scores');
    return response.data.data.map(mapScore);
  },

  async createScore(data: CreateScoreRequest) {
    const response = await API.post<ApiResponse<RawScore>>('/scores', data);
    return mapScore(response.data.data);
  },

  async updateScore(id: string, data: Partial<CreateScoreRequest>) {
    const response = await API.put<ApiResponse<RawScore>>(`/scores/${id}`, data);
    return mapScore(response.data.data);
  },

  async deleteScore(id: string) {
    const response = await API.delete<ApiResponse<{ message: string }>>(`/scores/${id}`);
    return response.data.data;
  },

  async getLeaderboard() {
    const response = await API.get<ApiResponse<{
      user_id: string;
      full_name: string;
      total_points: number;
      avg_score: string;
      score_count: number;
    }[]>>('/scores/leaderboard');
    return response.data.data.map((entry) => ({
      userId: entry.user_id,
      fullName: entry.full_name,
      totalPoints: entry.total_points,
      avgScore: parseFloat(String(entry.avg_score)),
      scoreCount: entry.score_count,
    }));
  },
};

export const charitiesService = {
  async getCharities() {
    const response = await API.get<ApiResponse<RawCharity[]>>('/charities');
    return response.data.data.map(mapCharity);
  },

  async getCharityById(id: string) {
    const response = await API.get<ApiResponse<RawCharity>>(`/charities/${id}`);
    return mapCharity(response.data.data);
  },

  async getCharityStats(id: string) {
    const response = await API.get<ApiResponse<{
      charity: RawCharity;
      donationCount: number;
      recentDonations: { amount: number; created_at: string }[];
    }>>(`/charities/${id}/stats`);
    const raw = response.data.data;
    return {
      charity: mapCharity(raw.charity),
      donationCount: raw.donationCount,
      recentDonations: (raw.recentDonations || []).map((d) => ({
        amount: d.amount,
        createdAt: d.created_at,
      })),
    };
  },

  async selectCharity(charityId: string, contributionPercent: number) {
    const response = await API.put<ApiResponse<{ message: string }>>('/charities/select', {
      charityId,
      contributionPercent,
    });
    return response.data.data;
  },

  async donate(charityId: string, amount: number) {
    const response = await API.post<ApiResponse<{ message: string }>>(`/charities/${charityId}/donate`, { amount });
    return response.data.data;
  },
};

export const drawsService = {
  async getMyDraws() {
    const response = await API.get<ApiResponse<RawDrawEntry[]>>('/draws/my');
    return response.data.data.map(mapDrawEntry);
  },

  async getUpcomingDraws() {
    const response = await API.get<ApiResponse<RawDraw[]>>('/draws');
    return response.data.data.map(mapDraw);
  },

  async getDrawById(id: string) {
    const response = await API.get<ApiResponse<{ draw: RawDraw; entries: RawDrawEntry[] }>>(`/draws/${id}`);
    const raw = response.data.data;
    return { draw: mapDraw(raw.draw), entries: raw.entries.map(mapDrawEntry) };
  },
};

export const paymentsService = {
  async createCheckoutSession(planType: string) {
    const response = await API.post<ApiResponse<{ sessionId: string; url: string }>>(
      '/payments/create-checkout-session',
      { planType }
    );
    return response.data.data;
  },

  async cancelSubscription() {
    const response = await API.post<ApiResponse<{ message: string }>>('/payments/cancel');
    return response.data.data;
  },

  async getPaymentStatus() {
    const response = await API.get<ApiResponse<{ status: string; planType: string | null; renewalDate: string | null; amount?: number; billingPeriod?: string }>>(
      '/payments/status'
    );
    return response.data.data;
  },

  async confirmSubscription(sessionId: string) {
    const response = await API.post<ApiResponse<{ status: string; planType?: string }>>(
      '/payments/confirm',
      { sessionId }
    );
    return response.data.data;
  },
};

export const winnersService = {
  async getMyWinnings() {
    const response = await API.get<ApiResponse<RawWinner[]>>('/winners/me');
    return response.data.data.map(mapWinner);
  },

  async uploadProof(drawEntryId: string, file: File) {
    const formData = new FormData();
    formData.append('proof', file);
    const response = await API.post<ApiResponse<{ id: string; imageUrl: string }>>(
      `/winners/${drawEntryId}/upload-proof`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },
};

export const adminService = {
  async getAnalytics() {
    const response = await API.get<ApiResponse<Analytics>>('/admin/analytics');
    return response.data.data;
  },

  async getSettings(): Promise<PlatformSettings> {
    const response = await API.get<ApiResponse<PlatformSettings>>('/admin/settings');
    return response.data.data;
  },

  async updateSettings(data: Partial<PlatformSettings>) {
    const response = await API.put<ApiResponse<PlatformSettings>>('/admin/settings', data);
    return response.data.data;
  },

  async getUsers() {
    const response = await API.get<ApiResponse<RawUser[]>>('/admin/users');
    return response.data.data.map(mapUser);
  },

  async getUserDetail(id: string) {
    const response = await API.get<ApiResponse<{ user: RawUser; scores: RawScore[]; subscription: RawSubscription | null }>>(`/admin/users/${id}`);
    const raw = response.data.data;
    return {
      user: mapUser(raw.user),
      scores: (raw.scores || []).map(mapScore),
      subscription: raw.subscription ? mapSubscription(raw.subscription) : null,
    };
  },

  async updateUser(id: string, data: Partial<User>) {
    const response = await API.put<ApiResponse<RawUser>>(`/admin/users/${id}`, data);
    return mapUser(response.data.data);
  },

  async updateUserRole(id: string, role: string) {
    const response = await API.put<ApiResponse<RawUser>>(`/admin/users/${id}`, { role });
    return mapUser(response.data.data);
  },

  async deleteUser(id: string) {
    const response = await API.delete<ApiResponse<{ message: string }>>(`/admin/users/${id}`);
    return response.data.data;
  },

  async cancelUserSubscription(id: string) {
    const response = await API.post<ApiResponse<{ message: string }>>(`/admin/users/${id}/cancel-subscription`);
    return response.data.data;
  },

  async getDrawStats() {
    const response = await API.get<ApiResponse<{ recentDraws: RawDraw[]; totalPrizePool: number }>>('/admin/draw-stats');
    const raw = response.data.data;
    return {
      recentDraws: (raw.recentDraws || []).map(mapDraw),
      totalPrizePool: raw.totalPrizePool,
    };
  },

  async createDraw(drawDate: string, prizePool: number) {
    const response = await API.post<ApiResponse<RawDraw>>('/draws/create', { drawDate, prizePool });
    return mapDraw(response.data.data);
  },

  async simulateDraw(drawId: string, algorithm: 'random' | 'weighted' = 'random') {
    const response = await API.post<ApiResponse<{ drawId: string; winningNumbers: number[]; algorithm: string; message: string }>>(`/draws/${drawId}/simulate`, { algorithm });
    return response.data.data;
  },

  async publishDraw(drawId: string) {
    const response = await API.post<ApiResponse<{
      drawId: string;
      totalEntrants: number;
      winners5Match: number;
      winners4Match: number;
      winners3Match: number;
      newRollover: number;
      message: string;
    }>>(`/draws/${drawId}/publish`);
    return response.data.data;
  },

  async getScoreFrequency() {
    const response = await API.get<ApiResponse<{ stableford_points: number; count: string }[]>>('/admin/score-frequency');
    return response.data.data;
  },

  async getWinners() {
    const response = await API.get<ApiResponse<RawWinner[]>>('/winners');
    return response.data.data.map(mapWinner);
  },

  async approveWinner(id: string) {
    const response = await API.post<ApiResponse<{ message: string }>>(`/winners/${id}/approve`);
    return response.data.data;
  },

  async rejectWinner(id: string, reason: string) {
    const response = await API.post<ApiResponse<{ message: string }>>(`/winners/${id}/reject`, { reason });
    return response.data.data;
  },

  async markWinnerPaid(id: string) {
    const response = await API.post<ApiResponse<{ message: string }>>(`/winners/${id}/mark-paid`);
    return response.data.data;
  },

  async createCharity(data: { name: string; description: string; website?: string; imageUrl?: string }) {
    const response = await API.post<ApiResponse<RawCharity>>('/charities', data);
    return mapCharity(response.data.data);
  },

  async updateCharity(id: string, data: Partial<Charity>) {
    const response = await API.put<ApiResponse<RawCharity>>(`/charities/${id}`, data);
    return mapCharity(response.data.data);
  },

  async deleteCharity(id: string) {
    const response = await API.delete<ApiResponse<{ message: string }>>(`/charities/${id}`);
    return response.data.data;
  },
};

export default API;
