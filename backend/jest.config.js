/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/controllers/**/*.ts',
    'src/repositories/**/*.ts',
    'src/middlewares/**/*.ts',
    'src/services/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 30,
      statements: 30,
    },
  },
};
