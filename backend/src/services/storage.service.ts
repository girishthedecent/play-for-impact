import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { serverConfig } from '../config';
import logger from '../config/logger.config';

class StorageService {
  private supabase: SupabaseClient | null = null;
  private bucketName = 'winner-proofs';

  constructor() {
    if (serverConfig.supabaseUrl && serverConfig.supabaseServiceKey) {
      this.supabase = createClient(serverConfig.supabaseUrl, serverConfig.supabaseServiceKey);
    }
  }

  /**
   * Uploads a winner scorecard proof to Supabase Storage.
   * Returns the permanent public CDN URL for the uploaded file.
   */
  async uploadWinnerProof(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype === 'image/png' ? '.png' : '.jpg');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    if (this.supabase) {
      try {
        const { error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(uniqueName, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (error) {
          logger.error('Supabase storage upload error, falling back to disk:', error);
          throw error;
        }

        const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(uniqueName);
        logger.info(`Winner proof uploaded to Supabase Storage: ${data.publicUrl}`);
        return data.publicUrl;
      } catch (err) {
        logger.warn(`Direct Supabase upload failed, checking disk fallback: ${err}`);
      }
    }

    // Fallback: local disk storage
    const localDir = path.resolve(__dirname, '../../uploads/winner-proofs');
    fs.mkdirSync(localDir, { recursive: true });
    const localPath = path.join(localDir, uniqueName);
    fs.writeFileSync(localPath, file.buffer);
    logger.info(`Winner proof saved to local disk fallback: ${uniqueName}`);
    return `/uploads/winner-proofs/${uniqueName}`;
  }
}

export const storageService = new StorageService();
