jest.mock('../services/supabase.service', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../utils/helpers/auth.helper', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(),
}));

jest.mock('../config/logger.config', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
}));

import { getDraws, getMyDraws, createDraw } from '../controllers/draws.controller';
import { query } from '../services/supabase.service';

const mockQuery = query as jest.MockedFunction<typeof query>;

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Record<string, any> = {}) {
  return { body: {}, params: {}, user: undefined, ...overrides } as any;
}

beforeEach(() => jest.clearAllMocks());

describe('Draws Controller', () => {
  describe('getDraws', () => {
    it('should return completed draws', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '1', draw_date: '2024-01-31', winning_numbers: [1, 5, 10, 20, 30], prize_pool: 10000, jackpot_rollover: 0, status: 'completed', created_at: '2024-01-31' }],
      } as any);

      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      await getDraws(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getMyDraws', () => {
    it('should return user draw entries', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '1', draw_id: 'd1', user_id: 'u1', entry_numbers: [1, 5, 10, 20, 30], match_count: 3, prize_amount: 500, winner_status: 'pending', draw_date: '2024-01-31', winning_numbers: [1, 5, 10, 15, 20], draw_status: 'completed' }],
      } as any);

      const req = mockReq({ user: { userId: 'u1', email: 'test@test.com', role: 'user' } });
      const res = mockRes();
      const next = jest.fn();

      await getMyDraws(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('createDraw', () => {
    it('should create a draw with auto-calculated prize pool', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({ rows: [{ total: '50000' }] } as any)
        .mockResolvedValueOnce({ rows: [{ jackpot_rollover: '2000' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: '1', draw_date: '2024-02-29', prize_pool: 30000, jackpot_rollover: 2000, status: 'pending', created_at: '2024-02-29' }] } as any);

      const req = mockReq({
        user: { userId: 'admin1', email: 'admin@test.com', role: 'admin' },
        body: { drawDate: '2024-02-29' },
      });
      const res = mockRes();
      const next = jest.fn();

      await createDraw(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject duplicate draw date', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing' }] } as any);

      const req = mockReq({
        user: { userId: 'admin1', email: 'admin@test.com', role: 'admin' },
        body: { drawDate: '2024-01-31' },
      });
      const res = mockRes();
      const next = jest.fn();

      await createDraw(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Draw already exists for this date' }));
    });
  });
});
