# Catch-up 1 — Backend Global Infrastructure + File Upload

## Goal
Complete Week 1 Day 4 and Week 1 Day 5 in a single session.
Backend must be production-ready in terms of observability, error handling, and file upload.

## Context
- Backend skeleton (main.ts, AppModule, HealthModule) exists from week1-day2
- packages/utils (ApiConfigService, GenericAssignDto, GenericService) exists from week1-day3
- Follow all CLAUDE.md rules strictly

---

## Part 1: Backend Global Infrastructure (Week 1 Day 4)

### Files to Create

#### backend/src/shared/config-schema-validation/index.ts
```typescript
import * as Joi from 'joi';

export default abstract class ConfigSchemaValidation {
  static get validationSchema() {
    return Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'production')
        .default('development'),
      APPLICATION_PORT: Joi.number().default(3000),
      PROJECT_NAME: Joi.string().required(),
      ANTHROPIC_API_KEY: Joi.string().required(),
      SUPABASE_URL: Joi.string().uri().required(),
      SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
      ALLOWED_CORS_ORIGIN: Joi.string().required(),
      FRONTEND_BASE_URL: Joi.string().uri().required(),
      DATABASE_URL: Joi.string().optional(),
    });
  }
}
```

#### backend/src/shared/filter/global-exception.filter.ts
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === 'string'
          ? response
          : (response as { message: string }).message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        httpStatus = HttpStatus.CONFLICT;
        message = 'Duplicate entry';
      } else if (exception.code === 'P2025') {
        httpStatus = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
    } else {
      this.logger.error('Unhandled exception', exception as Error);
    }

    httpAdapter.reply(
      ctx.getResponse(),
      { statusCode: httpStatus, message },
      httpStatus,
    );
  }
}
```

#### backend/src/shared/middleware/logger.middleware.ts
```typescript
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      this.logger.log(`${method} ${originalUrl} ${statusCode} ${duration}ms`);
    });

    next();
  }
}
```

#### backend/src/shared/decorator/exception-response.decorator.ts
```typescript
import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ExceptionResponse = (...statuses: number[]) => {
  const decorators = statuses.map((status) => ApiResponse({ status }));
  return applyDecorators(...decorators);
};
```

#### backend/src/winston-logger.ts
```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { LoggerService } from '@nestjs/common';

export default abstract class WinstonLogger {
  static getLogger(): LoggerService {
    return WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `[${timestamp}] [${context ?? 'App'}] ${level}: ${message}`;
            }),
          ),
        }),
      ],
    });
  }
}
```

### Update backend/src/main.ts
- Import `WinstonLogger` and use as app logger: `NestFactory.create(AppModule, { rawBody: true, logger: WinstonLogger.getLogger() })`
- Import `HttpAdapterHost` from `@nestjs/core`
- Inject and register GlobalExceptionFilter:
  ```typescript
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));
  ```
- Full pattern must match CLAUDE.md exactly (CORS, ValidationPipe, ClassSerializerInterceptor, global prefix)

### Update backend/src/app.module.ts
```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import ConfigSchemaValidation from './shared/config-schema-validation';
import { LoggerMiddleware } from './shared/middleware/logger.middleware';
import { HealthCheckModule } from './module/health-check/health-check.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: ConfigSchemaValidation.validationSchema,
      envFilePath: path.join(__dirname, '..', '..', '.env'),
    }),
    HealthCheckModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

### Dependencies to add to backend/package.json
```json
"nest-winston": "^1.9.4",
"winston": "^3.11.0",
"joi": "^17.12.0"
```

---

## Part 2: File Upload with Supabase Storage (Week 1 Day 5)

### Files to Create

#### backend/src/module/file/storage/storage.interface.ts
```typescript
export interface IStorageService {
  upload(file: Buffer, key: string, mimeType: string): Promise<string>;
  getSignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
```

#### backend/src/module/file/storage/supabase-storage.service.ts
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

#### backend/src/module/file/dto/upload-result.dto.ts
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

#### backend/src/module/file/file.service.ts
```typescript
import { Injectable, Logger, Inject } from '@nestjs/common';
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
    const imageUrl = await this.storageService.upload(
      file.buffer,
      key,
      file.mimetype,
    );

    return new UploadResultDto({ imageUrl });
  }
}
```

#### backend/src/module/file/file.controller.ts
```typescript
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { FileService } from './file.service';
import { UploadResultDto } from './dto/upload-result.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@ApiTags('File')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
        else
          cb(
            new BadRequestException(
              'Only JPEG, PNG, and WebP images are allowed',
            ),
            false,
          );
      },
    }),
  )
  uploadScreenshot(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResultDto> {
    return this.fileService.uploadScreenshot(file);
  }
}
```

#### backend/src/module/file/file.module.ts
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

### Register FileModule in app.module.ts
Add `FileModule` to the `imports` array in AppModule.

### Dependencies to add to backend/package.json
```json
"@supabase/supabase-js": "^2.39.0",
"@nestjs/platform-express": "^11.0.0",
"multer": "^1.4.5-lts.1",
"@types/multer": "^1.4.11",
"uuid": "^9.0.0",
"@types/uuid": "^9.0.0"
```

---

## Completion Criteria
- [ ] `GlobalExceptionFilter` registered globally in main.ts using `app.get(HttpAdapterHost)`
- [ ] `LoggerMiddleware` logs all requests (method, url, status, duration)
- [ ] `ConfigSchemaValidation` validates env vars — server refuses to start if ANTHROPIC_API_KEY is missing
- [ ] `WinstonLogger` used as app logger in NestFactory.create()
- [ ] Swagger available at `/api/swagger` when NODE_ENV=development
- [ ] `POST /api/v1/file/upload` accepts multipart/form-data with field `file`
- [ ] Upload endpoint uses `memoryStorage()` (file.buffer is available)
- [ ] File size limit: 10MB; allowed types: JPEG, PNG, WebP only
- [ ] `IStorageService` interface with `STORAGE_SERVICE` token exists
- [ ] `SupabaseStorageService` is the only file that imports `@supabase/supabase-js`
- [ ] `FileService` injects `IStorageService` via token, not direct class
- [ ] No `console.log` anywhere — use `this.logger` only

## Commit Message
```
feat: add global infra, exception filter, logger, config validation, and file upload
```

## Forbidden
- Never use `@moonward-apps/*` packages
- Never import `@supabase/supabase-js` outside the storage module
- No `any` type
- No `console.log`
