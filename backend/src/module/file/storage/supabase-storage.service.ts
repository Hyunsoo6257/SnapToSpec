import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { IStorageService } from './storage.interface';

const BUCKET = 'screenshots';

@Injectable()
export class SupabaseStorageService implements IStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async upload(file: Buffer, key: string, mimeType: string): Promise<string> {
    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(key, file, { contentType: mimeType, upsert: true });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data } = this.client.storage.from(BUCKET).getPublicUrl(key);
    return data.publicUrl;
  }

  async getSignedUrl(key: string): Promise<string> {
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(key, 3600);

    if (error) {
      this.logger.error(`Signed URL failed: ${error.message}`);
      throw new Error(`Signed URL failed: ${error.message}`);
    }
    return data.signedUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(BUCKET).remove([key]);
    if (error) {
      this.logger.error(`Delete failed: ${error.message}`);
    }
  }
}
