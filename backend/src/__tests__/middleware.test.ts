jest.mock('../utils/helpers/auth.helper', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(),
}));

jest.mock('../services/supabase.service', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../config/logger.config', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

import { authMiddleware, adminMiddleware, subscriptionMiddleware } from '../middlewares/auth.middleware';
import { verifyToken } from '../utils/helpers/auth.helper';
import { query } from '../services/supabase.service';

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Record<string, any> = {}) {
  return { headers: {}, body: {}, params: {}, user: undefined, ...overrides } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Middleware', () => {
  describe('authMiddleware', () => {
    it('should pass valid token', () => {
      mockVerifyToken.mockReturnValue({ userId: '1', email: 'test@test.com', role: 'user' });

      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
      const res = mockRes();
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({ userId: '1', email: 'test@test.com', role: 'user' });
    });

    it('should reject missing token', () => {
      const req = mockReq({ headers: {} });
      const res = mockRes();
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'No token provided' }));
    });

    it('should reject invalid token', () => {
      mockVerifyToken.mockImplementation(() => { throw new Error('Invalid token'); });

      const req = mockReq({ headers: { authorization: 'Bearer invalid-token' } });
      const res = mockRes();
      const next = jest.fn();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid or expired token' }));
    });
  });

  describe('adminMiddleware', () => {
    it('should pass for admin users', () => {
      const req = mockReq({ user: { userId: '1', email: 'admin@test.com', role: 'admin' } });
      const res = mockRes();
      const next = jest.fn();

      adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject non-admin users', () => {
      const req = mockReq({ user: { userId: '1', email: 'user@test.com', role: 'user' } });
      const res = mockRes();
      const next = jest.fn();

      adminMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Admin access required' }));
    });
  });

  describe('subscriptionMiddleware', () => {
    it('should pass for admin users', async () => {
      const req = mockReq({ user: { userId: '1', email: 'admin@test.com', role: 'admin' } });
      const res = mockRes();
      const next = jest.fn();

      await subscriptionMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should pass for users with active subscription', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ status: 'active' }] } as any);

      const req = mockReq({ user: { userId: '1', email: 'user@test.com', role: 'user' } });
      const res = mockRes();
      const next = jest.fn();

      await subscriptionMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject users without active subscription', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const req = mockReq({ user: { userId: '1', email: 'user@test.com', role: 'user' } });
      const res = mockRes();
      const next = jest.fn();

      await subscriptionMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Active subscription required to access this feature' }));
    });
  });
});
