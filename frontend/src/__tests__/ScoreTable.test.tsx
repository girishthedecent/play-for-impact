import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreTable } from '../components/scores/ScoreTable';
import type { Score } from '../types';

const mockScores: Score[] = [
  { id: '1', stablefordPoints: 30, courseName: 'Royal Links', date: '2024-01-15', createdAt: '2024-01-15' },
  { id: '2', stablefordPoints: 25, courseName: 'Park Course', date: '2024-01-10', createdAt: '2024-01-10' },
];

describe('ScoreTable', () => {
  it('should render scores', () => {
    render(
      <ScoreTable
        scores={mockScores}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Royal Links')).toBeDefined();
    expect(screen.getByText('Park Course')).toBeDefined();
  });

  it('should render empty state', () => {
    render(
      <ScoreTable
        scores={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/no golf scores recorded/i)).toBeDefined();
  });

  it('should show Active Draw badge for latest 5', () => {
    render(
      <ScoreTable
        scores={mockScores}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getAllByText('Active Draw').length).toBeGreaterThan(0);
  });
});
