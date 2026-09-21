import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { formatDate, formatDateShort } from '../utils/formatDate';

describe('formatCurrency', () => {
  it('should format valid amount', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1');
    expect(result).toContain('000');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toBeDefined();
  });

  it('should handle null', () => {
    const result = formatCurrency(null);
    expect(result).toBeDefined();
  });

  it('should handle undefined', () => {
    const result = formatCurrency(undefined);
    expect(result).toBeDefined();
  });
});

describe('formatNumber', () => {
  it('should format valid number', () => {
    const result = formatNumber(1234);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });

  it('should handle null', () => {
    const result = formatNumber(null);
    expect(result).toBeDefined();
  });
});

describe('formatDate', () => {
  it('should format valid date string', () => {
    const result = formatDate('2024-01-15');
    expect(result).toBeDefined();
    expect(result).not.toBe('Invalid Date');
  });

  it('should return "—" for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('should return "—" for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('should return "—" for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatDateShort', () => {
  it('should format valid date string', () => {
    const result = formatDateShort('2024-01-15');
    expect(result).toBeDefined();
  });

  it('should return "—" for null', () => {
    expect(formatDateShort(null)).toBe('—');
  });
});
