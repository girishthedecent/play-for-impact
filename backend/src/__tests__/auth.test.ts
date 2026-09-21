jest.mock('../services/supabase.service', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../utils/helpers/auth.helper', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(),
}));

jest.mock('../config/logger.config', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

import { register, login, getMe, updateProfile } from '../controllers/auth.controller';
import { query } from '../services/supabase.service';
import { generateToken } from '../utils/helpers/auth.helper';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: Record<string, any> = {}) {
  return { body: {}, params: {}, user: undefined, ...overrides } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Controller', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] } as any)
        .mockResolvedValueOnce({
          rows: [{
            id: '1', email: 'test@test.com', full_name: 'Test User', role: 'user',
            subscription_status: 'inactive', onboarding_completed: false, created_at: new Date().toISOString(),
          }],
        } as any);
      mockGenerateToken.mockReturnValue('test-token');

      const req = mockReq({ body: { email: 'test@test.com', password: 'password123', fullName: 'Test User' } });
      const res = mockRes();
      const next = jest.fn();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: 'test-token' }),
        })
      );
    });

    it('should reject duplicate email', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: '1' }] } as any);

      const req = mockReq({ body: { email: 'existing@test.com', password: 'password123', fullName: 'Test' } });
      const res = mockRes();
      const next = jest.fn();

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email already registered' })
      );
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('password123', 10);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '1', email: 'test@test.com', password_hash: hash, full_name: 'Test User',
          role: 'user', subscription_status: 'inactive', subscription_plan: null,
          selected_charity_id: null, charity_contribution_percent: 10,
          onboarding_completed: false, created_at: new Date().toISOString(),
        }],
      } as any);
      mockGenerateToken.mockReturnValue('test-token');

      const req = mockReq({ body: { email: 'test@test.com', password: 'password123' } });
      const res = mockRes();
      const next = jest.fn();

      await login(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ token: 'test-token' }),
        })
      );
    });

    it('should reject invalid email', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      const req = mockReq({ body: { email: 'wrong@test.com', password: 'password123' } });
      const res = mockRes();
      const next = jest.fn();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid email or password' })
      );
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '1', email: 'test@test.com', full_name: 'Test User', role: 'user',
          subscription_status: 'active', subscription_plan: 'premium',
          selected_charity_id: null, charity_contribution_percent: 10,
          onboarding_completed: true, created_at: new Date().toISOString(),
        }],
      } as any);

      const req = mockReq({ user: { userId: '1', email: 'test@test.com', role: 'user' } });
      const res = mockRes();
      const next = jest.fn();

      await getMe(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ email: 'test@test.com' }),
        })
      );
    });

    it('should reject unauthenticated request', async () => {
      const req = mockReq({ user: undefined });
      const res = mockRes();
      const next = jest.fn();

      await getMe(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Not authenticated' })
      );
    });
  });

  describe('updateProfile', () => {
    it('should update full name', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '1', email: 'test@test.com', full_name: 'Updated Name', role: 'user',
          subscription_status: 'active', subscription_plan: 'premium',
          selected_charity_id: null, charity_contribution_percent: 10,
          onboarding_completed: true, created_at: new Date().toISOString(),
        }],
      } as any);

      const req = mockReq({
        user: { userId: '1', email: 'test@test.com', role: 'user' },
        body: { fullName: 'Updated Name' },
      });
      const res = mockRes();
      const next = jest.fn();

      await updateProfile(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ fullName: 'Updated Name' }),
        })
      );
    });

    it('should reject password change without current password', async () => {
      const req = mockReq({
        user: { userId: '1', email: 'test@test.com', role: 'user' },
        body: { newPassword: 'newpass123' },
      });
      const res = mockRes();
      const next = jest.fn();

      await updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Current password is required' })
      );
    });
  });
});
