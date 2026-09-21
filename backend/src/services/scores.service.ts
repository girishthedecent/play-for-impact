import { scoreRepository, ScoreRow, LeaderboardRow } from '../repositories';
import { getClient } from './supabase.service';
import { BadRequestError, NotFoundError } from '../utils/errors/app.error';

const MAX_SCORES_PER_USER = 5;

export class ScoresService {
  async getUserScores(userId: string): Promise<ScoreRow[]> {
    return scoreRepository.findByUser(userId);
  }

  async createScore(
    userId: string,
    data: { stablefordPoints: number; courseName: string; date: string }
  ): Promise<ScoreRow> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const existingScore = await scoreRepository.findByUserAndDate(userId, data.date, undefined, client);
      if (existingScore) {
        await client.query('ROLLBACK');
        throw new BadRequestError('You already have a score for this date');
      }

      const count = await scoreRepository.countByUser(userId, client);

      // Enforce rolling 5-score limit by evicting the oldest score
      if (count >= MAX_SCORES_PER_USER) {
        const oldestScore = await scoreRepository.getOldestByUser(userId, client);
        if (oldestScore) {
          await scoreRepository.delete(oldestScore.id, undefined, client);
        }
      }

      const newScore = await scoreRepository.create(
        {
          userId,
          stablefordPoints: data.stablefordPoints,
          courseName: data.courseName,
          date: data.date,
        },
        client
      );

      await client.query('COMMIT');
      return newScore;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateScore(
    userId: string,
    scoreId: string,
    data: { stablefordPoints?: number; courseName?: string; date?: string }
  ): Promise<ScoreRow> {
    const existingScore = await scoreRepository.findByIdAndUser(scoreId, userId);
    if (!existingScore) {
      throw new NotFoundError('Score not found');
    }

    if (data.date) {
      const dateConflict = await scoreRepository.findByUserAndDate(userId, data.date, scoreId);
      if (dateConflict) {
        throw new BadRequestError('You already have a score for this date');
      }
    }

    const updated = await scoreRepository.update(scoreId, userId, data);
    if (!updated) {
      throw new NotFoundError('Score not found');
    }
    return updated;
  }

  async deleteScore(userId: string, scoreId: string): Promise<void> {
    const existingScore = await scoreRepository.findByIdAndUser(scoreId, userId);
    if (!existingScore) {
      throw new NotFoundError('Score not found');
    }

    await scoreRepository.delete(scoreId, userId);
  }

  async getLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
    return scoreRepository.getLeaderboard(limit);
  }
}

export const scoresService = new ScoresService();
