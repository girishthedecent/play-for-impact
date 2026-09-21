import { charityRepository, userRepository, CharityRow, DonationRow } from '../repositories';
import { NotFoundError, BadRequestError } from '../utils/errors/app.error';

export class CharitiesService {
  async getCharities(): Promise<CharityRow[]> {
    return charityRepository.findAll(true);
  }

  async getCharityById(id: string): Promise<CharityRow> {
    const charity = await charityRepository.findById(id);
    if (!charity) {
      throw new NotFoundError('Charity not found');
    }
    return charity;
  }

  async getCharityStats(id: string): Promise<{
    charity: { id: string; name: string; total_raised: number | string };
    donationCount: number;
    recentDonations: Array<{ amount: number; created_at: string }>;
  }> {
    const charity = await charityRepository.findById(id);
    if (!charity) {
      throw new NotFoundError('Charity not found');
    }

    const donationCount = await charityRepository.countDonations(id);
    const recentDonations = await charityRepository.getRecentDonations(id, 5);

    return {
      charity: {
        id: charity.id,
        name: charity.name,
        total_raised: charity.total_raised,
      },
      donationCount,
      recentDonations,
    };
  }

  async selectCharity(userId: string, charityId: string, contributionPercent: number): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const charity = await charityRepository.findById(charityId, true);
    if (!charity) {
      throw new NotFoundError('Charity not found or inactive');
    }

    await userRepository.updateCharityPreferences(userId, charityId, contributionPercent);
  }

  async createCharity(data: {
    name: string;
    description?: string | null;
    website?: string | null;
    imageUrl?: string | null;
  }): Promise<CharityRow> {
    return charityRepository.create({
      name: data.name,
      description: data.description || null,
      website: data.website || null,
      imageUrl: data.imageUrl || null,
    });
  }

  async updateCharity(
    id: string,
    data: {
      name?: string;
      description?: string;
      website?: string;
      imageUrl?: string;
      isActive?: boolean;
    }
  ): Promise<CharityRow> {
    const updated = await charityRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError('Charity not found');
    }
    return updated;
  }

  async deleteCharity(id: string): Promise<void> {
    const success = await charityRepository.deactivate(id);
    if (!success) {
      throw new NotFoundError('Charity not found');
    }
  }

  async donateToCharity(userId: string, charityId: string, amount: number): Promise<DonationRow> {
    const donationAmount = parseFloat(String(amount));
    if (!donationAmount || donationAmount < 10) {
      throw new BadRequestError('Minimum donation amount is ₹10');
    }

    const charity = await charityRepository.findById(charityId, true);
    if (!charity) {
      throw new NotFoundError('Charity not found');
    }

    const donation = await charityRepository.recordDonation({
      userId,
      charityId,
      amount: donationAmount,
    });

    return donation || {
      id: '',
      user_id: userId,
      charity_id: charityId,
      amount: donationAmount,
      created_at: new Date().toISOString(),
    };
  }
}

export const charitiesService = new CharitiesService();
