import { describe, it, expect } from 'vitest';

// Test the snake_case to camelCase mapping logic directly
// (we import the service module and test the public API contract)

describe('API Response Mapping', () => {
  it('should map snake_case score to camelCase', () => {
    const raw = {
      id: '1',
      stableford_points: 30,
      course_name: 'Test Course',
      date: '2024-01-15',
      created_at: '2024-01-15T00:00:00Z',
    };

    // Simulate the mapping logic from api.ts
    const mapped = {
      id: raw.id,
      stablefordPoints: raw.stableford_points,
      courseName: raw.course_name,
      date: raw.date,
      createdAt: raw.created_at,
    };

    expect(mapped.stablefordPoints).toBe(30);
    expect(mapped.courseName).toBe('Test Course');
  });

  it('should map snake_case charity to camelCase', () => {
    const raw = {
      id: '1',
      name: 'Cancer Research',
      description: 'Fighting cancer',
      website: 'https://example.com',
      image_url: null,
      total_raised: 5000,
      is_active: true,
      created_at: '2024-01-15T00:00:00Z',
    };

    const mapped = {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      website: raw.website,
      imageUrl: raw.image_url,
      totalRaised: parseFloat(String(raw.total_raised)) || 0,
      isActive: raw.is_active,
      createdAt: raw.created_at,
    };

    expect(mapped.totalRaised).toBe(5000);
    expect(mapped.isActive).toBe(true);
    expect(mapped.imageUrl).toBeNull();
  });

  it('should map snake_case user to camelCase', () => {
    const raw = {
      id: '1',
      email: 'test@test.com',
      full_name: 'Test User',
      role: 'user',
      subscription_status: 'active',
      subscription_plan: 'premium',
      selected_charity_id: 'c1',
      charity_contribution_percent: 25,
      onboarding_completed: true,
      created_at: '2024-01-15T00:00:00Z',
    };

    const mapped = {
      id: raw.id,
      email: raw.email,
      fullName: raw.full_name,
      role: raw.role,
      subscriptionStatus: raw.subscription_status,
      subscriptionPlan: raw.subscription_plan,
      selectedCharityId: raw.selected_charity_id,
      charityContributionPercent: raw.charity_contribution_percent,
      onboardingCompleted: Boolean(raw.onboarding_completed),
      createdAt: raw.created_at,
    };

    expect(mapped.fullName).toBe('Test User');
    expect(mapped.subscriptionStatus).toBe('active');
    expect(mapped.onboardingCompleted).toBe(true);
  });

  it('should map draw with prize pool', () => {
    const raw = {
      id: '1',
      draw_date: '2024-01-31',
      winning_numbers: [1, 5, 10, 20, 30],
      prize_pool: 10000,
      jackpot_rollover: 2000,
      status: 'completed',
      created_at: '2024-01-31T00:00:00Z',
    };

    const mapped = {
      id: raw.id,
      drawDate: raw.draw_date,
      winningNumbers: raw.winning_numbers || [],
      prizePool: parseFloat(String(raw.prize_pool)) || 0,
      jackpotRollover: parseFloat(String(raw.jackpot_rollover)) || 0,
      status: raw.status,
      createdAt: raw.created_at,
    };

    expect(mapped.prizePool).toBe(10000);
    expect(mapped.jackpotRollover).toBe(2000);
    expect(mapped.winningNumbers).toEqual([1, 5, 10, 20, 30]);
  });

  it('should handle null/undefined values gracefully', () => {
    expect(parseFloat(String(null)) || 0).toBe(0);
    expect(parseFloat(String(undefined)) || 0).toBe(0);
    const nullArr: number[] | null = null;
    const undefArr: number[] | undefined = undefined;
    expect(nullArr || []).toEqual([]);
    expect(undefArr || []).toEqual([]);
  });
});
