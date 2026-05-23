# Week 1 Day 5 — IStorageService + SupabaseStorageService + FileModule

## Goal
Implement image upload to Supabase Storage via IStorageService interface. POST /api/v1/file/upload returns imageUrl.

## Context
- Backend infra (Days 1-4) already exists
- Storage must be abstracted via IStorageService (AWS migration strategy)
- Direct `@supabase/supabase-js` SDK calls are only allowed inside the storage module
- Supabase bucket name: "screenshots"
- Follow all CLAUDE.md rules

## Files to Create

### backend/src/module/file/

```
file/
  file.module.ts
  file.controller.ts
  file.service.ts
  dto/
    upload-result.dto.ts
  storage/
    storage.interface.ts
    supabase-storage.service.ts
```

#### storage/storage.interface.ts
```typescript
export interface IStorageService {
  upload(file: Buffer, key: string, mimeType: string): Promise<string>;
  getSignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
```

#### storage/supabase-storage.service.ts
```typescript
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

    if (error) throw new Error(`Signed URL failed: ${error.message}`);
    return data.signedUrl;
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(BUCKET).remove([key]);
    if (error) this.logger.error(`Delete failed: ${error.message}`);
  }
}
```

#### dto/upload-result.dto.ts
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GenericAssignDto } from '@snaptospec/utils';

export class UploadResultDto extends GenericAssignDto<UploadResultDto> {
  @Expose()
  @ApiProperty({ description: 'Public URL of uploaded image in Supabase Storage' })
  imageUrl: string;
}
```

#### file.service.ts
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IStorageService, STORAGE_SERVICE } from './storage/storage.interface';
import { UploadResultDto } from './dto/upload-result.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  async uploadScreenshot(file: Express.Multer.File): Promise<UploadResultDto> {
    const ext = file.originalname.split('.').pop() ?? 'png';
    const key = `screenshots/${uuidv4()}.${ext}`;

    this.logger.log(`Uploading screenshot: ${key}`);
    const imageUrl = await this.storageService.upload(file.buffer, key, file.mimetype);

    return new UploadResultDto({ imageUrl });
  }
}
```

#### file.controller.ts
```typescript
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import { UploadResultDto } from './dto/upload-result.dto';

@ApiTags('File')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadScreenshot(@UploadedFile() file: Express.Multer.File): Promise<UploadResultDto> {
    return this.fileService.uploadScreenshot(file);
  }
}
```

#### file.module.ts
```typescript
import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { SupabaseStorageService } from './storage/supabase-storage.service';
import { STORAGE_SERVICE } from './storage/storage.interface';

@Module({
  controllers: [FileController],
  providers: [
    FileService,
    { provide: STORAGE_SERVICE, useClass: SupabaseStorageService },
  ],
  exports: [FileService],
})
export class FileModule {}
```

## Dependencies to Add to backend/package.json
```json
"@supabase/supabase-js": "^2.39.0",
"@nestjs/platform-express": "^11.0.0",
"multer": "^1.4.5",
"@types/multer": "^1.4.11",
"uuid": "^9.0.0",
"@types/uuid": "^9.0.0"
```

## Completion Criteria
- [ ] `POST /api/v1/file/upload` accepts `multipart/form-data` with field name `file`
- [ ] Returns `{ "imageUrl": "https://..." }` with valid Supabase Storage URL
- [ ] `IStorageService` interface exists with correct methods
- [ ] `SupabaseStorageService` only imports Supabase inside its own file
- [ ] `FileService` injects `IStorageService` via token (not direct class)
- [ ] No `console.log` anywhere

## Commit Message
```
feat: add file upload with Supabase Storage via IStorageService
```

## Forbidden
- Never import `@supabase/supabase-js` outside the storage module
- Never use `@moonward-apps/*` packages
- No `any` type
- No `console.log`
