// Mock database queries
jest.mock('../services/supabase.service', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

// Mock auth helper
jest.mock('../utils/helpers/auth.helper', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(),
}));

// Mock logger
jest.mock('../config/logger.config', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
