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

import { getScores, createScore, deleteScore, getLeaderboard } from '../controllers/scores.controller';
import { query, getClient } from '../services/supabase.service';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetClient = getClient as jest.MockedFunction<typeof getClient>;

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Record<string, any> = {}) {
  return { body: {}, params: {}, user: undefined, ...overrides } as any;
}

function mockClient() {
  return { query: jest.fn(), release: jest.fn() } as any;
}

beforeEach(() => jest.clearAllMocks());

describe('Scores Controller', () => {
  describe('getScores', () => {
    it('should return user scores', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '1', stableford_points: 30, course_name: 'Test Course', date: '2024-01-01', created_at: '2024-01-01' }],
      } as any);

      const req = mockReq({ user: { userId: 'user1', email: 'test@test.com', role: 'user' } });
      const res = mockRes();
      const next = jest.fn();

      await getScores(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should reject unauthenticated request', async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();
      const next = jest.fn();

      await getScores(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authenticated' }));
    });
  });

  describe('createScore', () => {
    it('should create a new score within rolling limit', async () => {
      const client = mockClient();
      mockGetClient.mockResolvedValue(client);
      client.query
        .mockResolvedValueOnce({})                                  // BEGIN
        .mockResolvedValueOnce({ rows: [] })                        // no duplicate date
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })         // score count < 5
        .mockResolvedValueOnce({ rows: [{ id: '1', stableford_points: 30, course_name: 'Test', date: '2024-01-01', created_at: '2024-01-01' }] }); // INSERT

      const req = mockReq({
        user: { userId: 'user1', email: 'test@test.com', role: 'user' },
        body: { stablefordPoints: 30, courseName: 'Test', date: '2024-01-01' },
      });
      const res = mockRes();
      const next = jest.fn();

      await createScore(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(client.query).toHaveBeenCalledWith('BEGIN');
      expect(client.query).toHaveBeenCalledWith('COMMIT');
      expect(client.release).toHaveBeenCalled();
    });

    it('should reject duplicate date', async () => {
      const client = mockClient();
      mockGetClient.mockResolvedValue(client);
      client.query
        .mockResolvedValueOnce({})              // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: '1' }] }); // duplicate found

      const req = mockReq({
        user: { userId: 'user1', email: 'test@test.com', role: 'user' },
        body: { stablefordPoints: 30, courseName: 'Test', date: '2024-01-01' },
      });
      const res = mockRes();
      const next = jest.fn();

      await createScore(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'You already have a score for this date' }));
      expect(client.release).toHaveBeenCalled();
    });

    it('should enforce rolling 5-score limit', async () => {
      const client = mockClient();
      mockGetClient.mockResolvedValue(client);
      client.query
        .mockResolvedValueOnce({})                     // BEGIN
        .mockResolvedValueOnce({ rows: [] })           // no duplicate
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // at limit
        .mockResolvedValueOnce({ rows: [{ id: 'oldest' }] }) // oldest score
        .mockResolvedValueOnce({})                     // DELETE
        .mockResolvedValueOnce({ rows: [{ id: '1', stableford_points: 30, course_name: 'Test', date: '2024-01-01', created_at: '2024-01-01' }] }); // INSERT

      const req = mockReq({
        user: { userId: 'user1', email: 'test@test.com', role: 'user' },
        body: { stablefordPoints: 30, courseName: 'Test', date: '2024-01-01' },
      });
      const res = mockRes();
      const next = jest.fn();

      await createScore(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(client.query).toHaveBeenCalledWith('DELETE FROM scores WHERE id = $1', ['oldest']);
    });
  });

  describe('deleteScore', () => {
    it('should delete own score', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: '1' }] } as any)
        .mockResolvedValueOnce({} as any);

      const req = mockReq({ user: { userId: 'user1', email: 'test@test.com', role: 'user' }, params: { id: '1' } });
      const res = mockRes();
      const next = jest.fn();

      await deleteScore(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should reject deleting non-existent score', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const req = mockReq({ user: { userId: 'user1', email: 'test@test.com', role: 'user' }, params: { id: '999' } });
      const res = mockRes();
      const next = jest.fn();

      await deleteScore(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Score not found' }));
    });
  });

  describe('getLeaderboard', () => {
    it('should return top scorers', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ user_id: '1', full_name: 'Top Player', total_points: 150, avg_score: '30.0', score_count: 5 }],
      } as any);

      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();

      await getLeaderboard(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
