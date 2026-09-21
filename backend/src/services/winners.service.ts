import {
  winnerRepository,
  drawRepository,
  WinnerProofRow,
  WinnerDetail,
} from '../repositories';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors/app.error';
import logger from '../config/logger.config';
import { storageService } from './storage.service';

export class WinnersService {
  async getUserWinnings(userId: string): Promise<WinnerDetail[]> {
    return winnerRepository.getMyWinnings(userId);
  }

  async getAllWinners(): Promise<WinnerDetail[]> {
    return winnerRepository.getAllWinners();
  }

  async getWinnerById(id: string): Promise<WinnerDetail> {
    const winner = await winnerRepository.getWinnerById(id);
    if (!winner) {
      throw new NotFoundError('Winner not found');
    }
    return winner;
  }

  async uploadProof(
    userId: string,
    entryId: string,
    file?: Express.Multer.File
  ): Promise<WinnerProofRow> {
    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestError('Only JPEG and PNG images are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestError('File size must be under 5MB');
    }

    const entry = await drawRepository.findEntryById(entryId);
    if (!entry) throw new NotFoundError('Draw entry not found');
    if (entry.user_id !== userId) throw new ForbiddenError('Not authorized');
    if (parseFloat(String(entry.prize_amount)) <= 0) throw new BadRequestError('No prize to claim');
    if (entry.winner_status !== 'pending') throw new BadRequestError('Winner status is not pending');

    const existingProof = await winnerRepository.getProofByDrawEntryId(entryId);
    if (existingProof) throw new BadRequestError('Proof already uploaded');

    const imageUrl = await storageService.uploadWinnerProof(file);
    const imageType = file.mimetype === 'image/png' ? 'png' : 'jpeg';

    const proof = await winnerRepository.createProof({
      drawEntryId: entryId,
      userId,
      imageUrl,
      imageType,
      imageSize: file.size,
    });

    logger.info(`Winner proof uploaded for entry ${entryId}: ${file.originalname} (${file.size} bytes)`);
    return proof;
  }

  async approveWinner(adminId: string | undefined, entryId: string): Promise<void> {
    const entry = await drawRepository.findEntryById(entryId);
    if (!entry) throw new NotFoundError('Winner not found');
    if (entry.winner_status !== 'pending') throw new BadRequestError('Winner status is not pending');

    const proof = await winnerRepository.getProofByDrawEntryId(entryId);
    if (!proof) throw new BadRequestError('Cannot approve winner without proof upload');

    await winnerRepository.approveWinner(entryId, adminId);
    logger.info(`Winner ${entryId} approved by admin ${adminId}`);
  }

  async rejectWinner(adminId: string | undefined, entryId: string, reason?: string): Promise<void> {
    const entry = await drawRepository.findEntryById(entryId);
    if (!entry) throw new NotFoundError('Winner not found');
    if (entry.winner_status !== 'pending') throw new BadRequestError('Winner status is not pending');

    await winnerRepository.rejectWinner(entryId, reason || 'No reason provided', adminId);
    logger.info(`Winner ${entryId} rejected by admin ${adminId}`);
  }

  async markPaid(adminId: string | undefined, entryId: string): Promise<void> {
    const entry = await drawRepository.findEntryById(entryId);
    if (!entry) throw new NotFoundError('Winner not found');
    if (entry.winner_status !== 'approved') throw new BadRequestError('Winner status is not approved');

    await winnerRepository.markPaid(entryId);
    logger.info(`Winner ${entryId} marked as paid by admin ${adminId}`);
  }
}

export const winnersService = new WinnersService();
