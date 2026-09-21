jest.mock('../services/supabase.service', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

import { query } from '../services/supabase.service';
import {
  userRepository,
  scoreRepository,
  charityRepository,
  drawRepository,
  winnerRepository,
  subscriptionRepository,
  platformSettingsRepository,
} from '../repositories';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Repository Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UserRepository', () => {
    it('findById should return user or null', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'test@example.com' }] } as any);
      const user = await userRepository.findById('u1');
      expect(user?.id).toBe('u1');
      expect(mockQuery).toHaveBeenCalled();

      mockQuery.mockResolvedValueOnce({ rows: [] } as any);
      const nullUser = await userRepository.findById('u2');
      expect(nullUser).toBeNull();
    });

    it('findByEmail should return user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'test@example.com' }] } as any);
      const user = await userRepository.findByEmail('test@example.com');
      expect(user?.email).toBe('test@example.com');
    });

    it('create should insert and return new user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u1', email: 'new@example.com', full_name: 'New User', role: 'user' }],
      } as any);
      const user = await userRepository.create({
        email: 'new@example.com',
        passwordHash: 'hash123',
        fullName: 'New User',
      });
      expect(user.id).toBe('u1');
      expect(user.full_name).toBe('New User');
    });

    it('updateProfile should update user fields', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u1', full_name: 'Updated Name', email: 'updated@example.com' }],
      } as any);
      const user = await userRepository.updateProfile('u1', {
        fullName: 'Updated Name',
        email: 'updated@example.com',
      });
      expect(user?.full_name).toBe('Updated Name');
    });

    it('updateSubscription should update subscription status and plan', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u1', subscription_status: 'active', subscription_plan: 'premium' }],
      } as any);
      const user = await userRepository.updateSubscription('u1', 'active', 'premium', true);
      expect(user?.subscription_status).toBe('active');
    });

    it('count should return count of users', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '42' }] } as any);
      const count = await userRepository.count({ role: 'user' });
      expect(count).toBe(42);
    });
  });

  describe('ScoreRepository', () => {
    it('findByUser should return scores for user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 's1', user_id: 'u1', stableford_points: 38 }],
      } as any);
      const scores = await scoreRepository.findByUser('u1');
      expect(scores.length).toBe(1);
      expect(scores[0].stableford_points).toBe(38);
    });

    it('countByUser should return total score count', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] } as any);
      const count = await scoreRepository.countByUser('u1');
      expect(count).toBe(5);
    });

    it('create should insert and return new score', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 's1', stableford_points: 40, course_name: 'Augusta', date: '2026-09-20' }],
      } as any);
      const score = await scoreRepository.create({
        userId: 'u1',
        stablefordPoints: 40,
        courseName: 'Augusta',
        date: '2026-09-20',
      });
      expect(score.stableford_points).toBe(40);
    });

    it('getLeaderboard should return top players', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ user_id: 'u1', full_name: 'Player One', total_points: 150 }],
      } as any);
      const leaderboard = await scoreRepository.getLeaderboard(10);
      expect(leaderboard[0].total_points).toBe(150);
    });
  });

  describe('CharityRepository', () => {
    it('findAll should return charities list', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'c1', name: 'Goonj', is_active: true }],
      } as any);
      const charities = await charityRepository.findAll(true);
      expect(charities[0].name).toBe('Goonj');
    });

    it('recordDonation should record donation successfully', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'd1', user_id: 'u1', charity_id: 'c1', amount: 500 }],
      } as any);
      const donation = await charityRepository.recordDonation({
        userId: 'u1',
        charityId: 'c1',
        amount: 500,
      });
      expect(donation.amount).toBe(500);
    });

    it('getTotalDonationsSum should return total donation amount', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: '125000.50' }] } as any);
      const total = await charityRepository.getTotalDonationsSum();
      expect(total).toBe(125000.5);
    });
  });

  describe('DrawRepository', () => {
    it('findAll should return completed draws', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'dr1', draw_date: '2026-09-01', status: 'completed' }],
      } as any);
      const draws = await drawRepository.findAll('completed');
      expect(draws[0].id).toBe('dr1');
    });

    it('create should insert new draw', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'dr2', draw_date: '2026-10-01', prize_pool: 5000, jackpot_rollover: 1000 }],
      } as any);
      const draw = await drawRepository.create({
        drawDate: '2026-10-01',
        prizePool: 5000,
        jackpotRollover: 1000,
      });
      expect(draw.id).toBe('dr2');
    });

    it('countCompleted should return count', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '12' }] } as any);
      const count = await drawRepository.countCompleted();
      expect(count).toBe(12);
    });
  });

  describe('WinnerRepository', () => {
    it('getAllWinners should return winners list', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'w1', match_count: 5, prize_amount: 10000 }],
      } as any);
      const winners = await winnerRepository.getAllWinners();
      expect(winners[0].match_count).toBe(5);
    });

    it('countPaidWinners should return total paid winners', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '8' }] } as any);
      const count = await winnerRepository.countPaidWinners();
      expect(count).toBe(8);
    });
  });

  describe('SubscriptionRepository', () => {
    it('findByUserId should return user subscription', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'sub1', user_id: 'u1', status: 'active', plan_type: 'vip' }],
      } as any);
      const sub = await subscriptionRepository.findByUserId('u1');
      expect(sub?.status).toBe('active');
    });

    it('countActive should return active subscriber count', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '25' }] } as any);
      const count = await subscriptionRepository.countActive();
      expect(count).toBe(25);
    });

    it('getTotalActiveRevenue should return total revenue', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: '37475.00' }] } as any);
      const revenue = await subscriptionRepository.getTotalActiveRevenue();
      expect(revenue).toBe(37475);
    });
  });

  describe('PlatformSettingsRepository', () => {
    it('getSettings should return platform settings', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'default', platform_name: 'Digital Heroes Golf' }],
      } as any);
      const settings = await platformSettingsRepository.getSettings();
      expect(settings?.platform_name).toBe('Digital Heroes Golf');
    });
  });
});
