import { Module } from '@nestjs/common';

import { FileController } from './file.controller';
import { FileService } from './file.service';
import { STORAGE_SERVICE } from './storage/storage.interface';
import { SupabaseStorageService } from './storage/supabase-storage.service';

@Module({
  controllers: [FileController],
  providers: [
    FileService,
    { provide: STORAGE_SERVICE, useClass: SupabaseStorageService },
  ],
  exports: [FileService],
})
export class FileModule {}
