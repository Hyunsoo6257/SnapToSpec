# Week 1 Day 4 — Backend Global Infrastructure

## Goal
Add global exception filter, logger middleware, Joi config validation, Swagger setup, and winston logger to the backend.

## Context
- Backend skeleton (Day 2) and packages/utils (Day 3) already exist
- These are shared infra used by all modules
- After this day, backend should be production-ready in terms of observability and error handling
- Follow all CLAUDE.md rules

## Files to Create

### backend/src/shared/

```
shared/
  config-schema-validation/
    index.ts
  filter/
    global-exception.filter.ts
  middleware/
    logger.middleware.ts
  decorator/
    exception-response.decorator.ts
```

#### shared/config-schema-validation/index.ts
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
      // DATABASE_URL optional in MVP (stateless, no DB used)
      DATABASE_URL: Joi.string().optional(),
    });
  }
}
```

#### shared/filter/global-exception.filter.ts
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
      message = typeof response === 'string' ? response : (response as any).message;
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

    httpAdapter.reply(ctx.getResponse(), { statusCode: httpStatus, message }, httpStatus);
  }
}
```

#### shared/middleware/logger.middleware.ts
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

#### shared/decorator/exception-response.decorator.ts
```typescript
import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export const ExceptionResponse = (...statuses: number[]) => {
  const decorators = statuses.map((status) => ApiResponse({ status }));
  return applyDecorators(...decorators);
};
```

### backend/src/open-api.ts
```typescript
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiConfigService } from '@snaptospec/utils';

export class OpenApi {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  handler(app: INestApplication): void {
    if (this.apiConfigService.isProd) return;

    const config = new DocumentBuilder()
      .setTitle('SnapToSpec API')
      .setDescription('UI spec extraction API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/swagger', app, document);
  }
}
```

### backend/src/winston-logger.ts
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

## Update backend/src/main.ts
Now that GlobalExceptionFilter and WinstonLogger exist, update main.ts to use them:
- Import and use `WinstonLogger.getLogger()`
- Import `HttpAdapterHost` from `@nestjs/core` and inject it before registering the filter:
  ```typescript
  import { HttpAdapterHost } from '@nestjs/core';
  // ...
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));
  ```
  Do NOT call `new GlobalExceptionFilter()` without the argument — the constructor requires it.
- Import ConfigSchemaValidation and add to ConfigModule in app.module.ts
- Import and apply `LoggerMiddleware` in AppModule

## Update backend/src/app.module.ts
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

## Completion Criteria
- [ ] `GlobalExceptionFilter` exists and is applied globally in main.ts
- [ ] `LoggerMiddleware` logs all requests (visible in console when server starts)
- [ ] `ConfigSchemaValidation` validates env vars — server refuses to start if ANTHROPIC_API_KEY is missing
- [ ] `WinstonLogger` is used as app logger (not default NestJS logger)
- [ ] Swagger available at `/api/swagger` when NODE_ENV=development
- [ ] No `console.log` anywhere

## Commit Message
```
feat: add global exception filter, logger middleware, config validation, swagger
```

## Forbidden
- Never use `@moonward-apps/*` packages
- No `any` type
- No `console.log`
