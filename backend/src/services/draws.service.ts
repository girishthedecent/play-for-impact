import {
  drawRepository,
  scoreRepository,
  subscriptionRepository,
  charityRepository,
  platformSettingsRepository,
  DrawRow,
  DrawEntryRow,
} from '../repositories';
import { getClient } from './supabase.service';
import { NotFoundError, BadRequestError } from '../utils/errors/app.error';

export interface PublishDrawResult {
  drawId: string;
  totalEntrants: number;
  winners5Match: number;
  winners4Match: number;
  winners3Match: number;
  newRollover: number;
  message: string;
}

export class DrawsService {
  async getAllDraws(): Promise<DrawRow[]> {
    return drawRepository.findAll();
  }

  async getCompletedDraws(): Promise<DrawRow[]> {
    return drawRepository.findAll('completed');
  }

  async getUserDrawEntries(userId: string): Promise<DrawEntryRow[]> {
    return drawRepository.getUserEntries(userId);
  }

  async getDrawDetails(drawId: string, role?: string): Promise<{ draw: DrawRow; entries: DrawEntryRow[] }> {
    const draw = await drawRepository.findById(drawId);
    if (!draw) {
      throw new NotFoundError('Draw not found');
    }

    if (draw.status !== 'completed' && role !== 'admin') {
      throw new NotFoundError('Draw not found');
    }

    const entries = await drawRepository.getDrawEntries(drawId, true);
    return { draw, entries };
  }

  async createDraw(data: {
    drawDate: string;
    prizePool?: number;
    jackpotRollover?: number;
  }): Promise<DrawRow & { calculatedFromSubscribers: boolean }> {
    const existingDraw = await drawRepository.findByDate(data.drawDate);
    if (existingDraw) {
      throw new BadRequestError('Draw already exists for this date');
    }

    let calculatedPrizePool = data.prizePool;
    const isAutoCalculated = !calculatedPrizePool || calculatedPrizePool === 0;

    // Auto-calculate prize pool: 60% of active subscription revenue, minimum ₹1,000
    if (isAutoCalculated) {
      const totalRevenue = await subscriptionRepository.getTotalActiveRevenue();
      calculatedPrizePool = Math.round(totalRevenue * 0.6 * 100) / 100;
      if (calculatedPrizePool < 1000) calculatedPrizePool = 1000;
    }

    // Carry forward rollover from last completed draw if not explicitly provided
    const rollover = data.jackpotRollover ?? (await drawRepository.getLatestCompletedRollover());

    const created = await drawRepository.create({
      drawDate: data.drawDate,
      prizePool: calculatedPrizePool!,
      jackpotRollover: rollover,
      status: 'pending',
    });

    return { ...created, calculatedFromSubscribers: isAutoCalculated };
  }

  generateWinningNumbers(): number[] {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!numbers.includes(num)) numbers.push(num);
    }
    return numbers.sort((a, b) => a - b);
  }

  generateWeightedNumbers(scoreFrequency: { stableford_points: number; count: number }[]): number[] {
    const pool: number[] = [];

    // All numbers 1-45 appear at least once
    for (let i = 1; i <= 45; i++) {
      pool.push(i);
    }

    // Add extra proportional weight for frequently submitted scores
    for (const freq of scoreFrequency) {
      const extra = Math.floor(parseInt(String(freq.count), 10) * 2);
      for (let i = 0; i < extra; i++) {
        pool.push(freq.stableford_points);
      }
    }

    const numbers: number[] = [];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (const n of shuffled) {
      if (!numbers.includes(n)) {
        numbers.push(n);
        if (numbers.length === 5) break;
      }
    }

    return numbers.sort((a, b) => a - b);
  }

  calculateMatches(entryNumbers: number[], winningNumbers: number[]): number {
    const entrySet = new Set(entryNumbers);
    let matches = 0;
    for (const num of winningNumbers) {
      if (entrySet.has(num)) matches++;
    }
    return matches;
  }

  async simulateDraw(
    drawId: string,
    algorithm: 'random' | 'weighted' = 'random'
  ): Promise<{ drawId: string; winningNumbers: number[]; algorithm: string; message: string }> {
    const draw = await drawRepository.findById(drawId);
    if (!draw) throw new NotFoundError('Draw not found');
    if (draw.status !== 'pending') throw new BadRequestError('Draw is not in pending status');
    if (draw.winning_numbers && draw.winning_numbers.length > 0) {
      throw new BadRequestError('Draw already simulated. Publish or create a new draw.');
    }

    let winningNumbers: number[];

    if (algorithm === 'weighted') {
      const freqResult = await scoreRepository.getScoreFrequency();
      winningNumbers = this.generateWeightedNumbers(
        freqResult.map(r => ({ stableford_points: r.stableford_points, count: parseInt(r.count, 10) }))
      );
    } else {
      winningNumbers = this.generateWinningNumbers();
    }

    await drawRepository.updateWinningNumbers(drawId, winningNumbers, algorithm);

    return {
      drawId,
      winningNumbers,
      algorithm,
      message: `Draw simulated using ${algorithm} algorithm. Review before publishing.`,
    };
  }

  async publishDraw(drawId: string): Promise<PublishDrawResult> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const draw = await drawRepository.findByIdForUpdate(drawId, client);
      if (!draw) {
        await client.query('ROLLBACK');
        throw new NotFoundError('Draw not found');
      }
      if (draw.status !== 'pending') {
        await client.query('ROLLBACK');
        throw new BadRequestError('Draw is not in pending status');
      }
      if (!draw.winning_numbers) {
        await client.query('ROLLBACK');
        throw new BadRequestError('Draw must be simulated before publishing');
      }

      const winningNumbers = draw.winning_numbers;
      const prizePool = parseFloat(String(draw.prize_pool));
      const previousRollover = parseFloat(String(draw.jackpot_rollover));

      // Fetch active, onboarded subscribers
      const subscribersResult = await client.query<{
        id: string;
        selected_charity_id: string | null;
        charity_contribution_percent: number;
      }>(
        `SELECT u.id, u.selected_charity_id, u.charity_contribution_percent
         FROM users u JOIN subscriptions s ON u.id = s.user_id
         WHERE s.status = 'active' AND u.onboarding_completed = true`
      );
      const subscribers = subscribersResult.rows;

      // Ranked scores (up to 5 per subscriber)
      const allScores = await scoreRepository.getRankedScoresForUsers(
        subscribers.map(s => s.id),
        5,
        client
      );

      const scoresByUser = new Map<string, number[]>();
      for (const row of allScores) {
        const existing = scoresByUser.get(row.user_id) || [];
        existing.push(row.stableford_points);
        scoresByUser.set(row.user_id, existing);
      }

      let total5Match = 0;
      let total4Match = 0;
      let total3Match = 0;

      const entriesToInsert: Array<{
        drawId: string;
        userId: string;
        entryNumbers: number[];
        matchCount: number;
        prizeAmount: number;
        winnerStatus: 'pending' | 'approved' | 'rejected' | 'paid' | 'ineligible';
      }> = [];

      for (const subscriber of subscribers) {
        const userScores = scoresByUser.get(subscriber.id) || [];

        if (userScores.length < 5) {
          entriesToInsert.push({
            drawId,
            userId: subscriber.id,
            entryNumbers: [0, 0, 0, 0, 0],
            matchCount: 0,
            prizeAmount: 0,
            winnerStatus: 'ineligible',
          });
          continue;
        }

        const matchCount = this.calculateMatches(userScores, winningNumbers);
        if (matchCount === 5) total5Match++;
        else if (matchCount === 4) total4Match++;
        else if (matchCount === 3) total3Match++;

        entriesToInsert.push({
          drawId,
          userId: subscriber.id,
          entryNumbers: userScores,
          matchCount,
          prizeAmount: 0,
          winnerStatus: 'pending',
        });
      }

      await drawRepository.batchInsertEntries(entriesToInsert, client);

      // Prize pool distribution from platform settings
      const totalPrizePool = prizePool + previousRollover;
      const settings = await platformSettingsRepository.getSettings(client);

      const tier1Share = settings ? parseFloat(String(settings.tier1_match_share)) / 100 : 0.40;
      const tier2Share = settings ? parseFloat(String(settings.tier2_match_share)) / 100 : 0.35;
      const tier3Share = settings ? parseFloat(String(settings.tier3_match_share)) / 100 : 0.25;
      const rolloverEnabled = settings ? settings.jackpot_rollover_enabled : true;

      const prize5Match = totalPrizePool * tier1Share;
      const prize4Match = totalPrizePool * tier2Share;
      const prize3Match = totalPrizePool * tier3Share;
      let newRollover = 0;

      if (total5Match > 0) {
        const perWinner = prize5Match / total5Match;
        await drawRepository.updatePrizeForMatchCount(drawId, 5, perWinner, client);
      } else if (rolloverEnabled) {
        newRollover += prize5Match;
      }

      if (total4Match > 0) {
        const perWinner = prize4Match / total4Match;
        await drawRepository.updatePrizeForMatchCount(drawId, 4, perWinner, client);
      }

      if (total3Match > 0) {
        const perWinner = prize3Match / total3Match;
        await drawRepository.updatePrizeForMatchCount(drawId, 3, perWinner, client);
      }

      await drawRepository.updateStatusAndRollover(drawId, 'completed', newRollover, client);

      // Create donations for winners with designated charities
      const winners = await drawRepository.getWinnersWithCharity(drawId, client);

      for (const winner of winners) {
        const donationAmount = winner.prize_amount * (winner.charity_contribution_percent / 100);
        if (donationAmount > 0 && winner.selected_charity_id) {
          await charityRepository.recordDonation(
            {
              userId: winner.user_id,
              charityId: winner.selected_charity_id,
              amount: donationAmount,
              drawEntryId: winner.id,
            },
            client
          );
        }
      }

      await client.query('COMMIT');

      return {
        drawId,
        totalEntrants: subscribers.length,
        winners5Match: total5Match,
        winners4Match: total4Match,
        winners3Match: total3Match,
        newRollover,
        message: 'Draw published successfully',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUpcomingDraws(): Promise<DrawRow[]> {
    return drawRepository.findUpcoming();
  }
}

export const drawsService = new DrawsService();
