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

import { getCharities, getCharityById, selectCharity, donateToCharity } from '../controllers/charities.controller';
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

describe('Charities Controller', () => {
  describe('getCharities', () => {
    it('should return active charities', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '1', name: 'Cancer Research', description: 'Fighting cancer', website: null, image_url: null, total_raised: 5000, is_active: true, created_at: '2024-01-01' }],
      } as any);

      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      await getCharities(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getCharityById', () => {
    it('should return a charity by id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '1', name: 'Cancer Research', description: 'Fighting cancer', website: null, image_url: null, total_raised: 5000, is_active: true, created_at: '2024-01-01' }],
      } as any);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      const next = jest.fn();

      await getCharityById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 for non-existent charity', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const req = mockReq({ params: { id: 'nonexistent' } });
      const res = mockRes();
      const next = jest.fn();

      await getCharityById(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Charity not found' }));
    });
  });

  describe('selectCharity', () => {
    it('should select a charity', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ onboarding_completed: false, selected_charity_id: null }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: '1' }] } as any)
        .mockResolvedValueOnce({} as any);

      const req = mockReq({
        user: { userId: 'u1', email: 'test@test.com', role: 'user' },
        body: { charityId: '1', contributionPercent: 25 },
      });
      const res = mockRes();
      const next = jest.fn();

      await selectCharity(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should reject inactive charity', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ onboarding_completed: false }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      const req = mockReq({
        user: { userId: 'u1', email: 'test@test.com', role: 'user' },
        body: { charityId: 'inactive', contributionPercent: 25 },
      });
      const res = mockRes();
      const next = jest.fn();

      await selectCharity(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Charity not found or inactive' }));
    });
  });

  describe('donateToCharity', () => {
    it('should record a donation', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: '1' }] } as any)
        .mockResolvedValueOnce({} as any);

      const req = mockReq({
        user: { userId: 'u1', email: 'test@test.com', role: 'user' },
        params: { id: '1' },
        body: { amount: 100 },
      });
      const res = mockRes();
      const next = jest.fn();

      await donateToCharity(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject donation below minimum', async () => {
      const req = mockReq({
        user: { userId: 'u1', email: 'test@test.com', role: 'user' },
        params: { id: '1' },
        body: { amount: 5 },
      });
      const res = mockRes();
      const next = jest.fn();

      await donateToCharity(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Minimum donation amount is ₹10' }));
    });
  });
});
