# Week 1 Day 3 — packages/prisma + packages/utils

## Goal
Set up shared packages: Prisma (future-ready, not used in MVP) and utils (GenericAssignDto, ApiConfigService, GenericService).

## Context
- Root config (Day 1) and backend/frontend skeleton (Day 2) already exist
- packages/prisma: set up for future use — no models in MVP, just datasource + generator
- packages/utils: company-standard shared utilities, imported by backend
- GenericService goes in packages/utils (imports PrismaProvider from packages/prisma)
- Follow all CLAUDE.md rules

## Files to Create

### packages/prisma/
```
package.json
prisma/
  schema.prisma      # datasource + generator only (no models in MVP)
src/
  index.ts           # exports PrismaProvider, PrismaConnection
  prisma-provider.ts
  prisma-connection.ts
```

#### packages/prisma/package.json
```json
{
  "name": "@snaptospec/prisma",
  "version": "1.0.0",
  "main": "src/index.ts",
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate:dev": "prisma migrate dev",
    "prisma:migrate:prod": "prisma migrate deploy"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

#### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// No models in MVP — stateless architecture
// Models will be added when DB persistence is needed
```

#### src/prisma-provider.ts (singleton pattern)
```typescript
import PrismaConnection from './prisma-connection';

export default abstract class PrismaProvider {
  private static prismaConnection: PrismaConnection;

  static getConnection(): PrismaConnection {
    if (!this.prismaConnection) {
      this.prismaConnection = new PrismaConnection();
    }
    return this.prismaConnection;
  }
}
```

#### src/prisma-connection.ts
```typescript
import { PrismaClient } from '@prisma/client';
import { Logger, OnModuleInit, INestApplication } from '@nestjs/common';

export default class PrismaConnection extends PrismaClient implements OnModuleInit {
  private logger = new Logger('DATABASE');

  constructor() {
    super({
      log: [{ emit: 'event', level: 'query' }],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

---

### packages/utils/

```
package.json
src/
  config/
    api-config.service.ts
  dto/
    generic-assign.dto.ts
  generic-service/
    index.ts
  index.ts
```

#### packages/utils/package.json
```json
{
  "name": "@snaptospec/utils",
  "version": "1.0.0",
  "main": "src/index.ts",
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@snaptospec/prisma": "*"
  }
}
```

#### src/dto/generic-assign.dto.ts
```typescript
export abstract class GenericAssignDto<T> {
  constructor(data: T) {
    Object.assign(this, data);
  }
}
```

#### src/config/api-config.service.ts
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.configService.getOrThrow<string>('NODE_ENV') === 'development';
  }

  get isProd(): boolean {
    return this.configService.getOrThrow<string>('NODE_ENV') === 'production';
  }

  get applicationPort(): number {
    return Number(this.configService.get('APPLICATION_PORT') ?? 3000);
  }

  get projectName(): string {
    return this.configService.getOrThrow<string>('PROJECT_NAME');
  }

  get frontendBaseUrl(): string {
    return this.configService.getOrThrow<string>('FRONTEND_BASE_URL');
  }
}
```

#### src/generic-service/index.ts
```typescript
import { Injectable } from '@nestjs/common';
import PrismaProvider from '@snaptospec/prisma/src/prisma-provider';
import PrismaConnection from '@snaptospec/prisma/src/prisma-connection';

@Injectable()
export default abstract class GenericService {
  protected readonly prisma: PrismaConnection = PrismaProvider.getConnection();
}
```

#### src/index.ts
```typescript
export { ApiConfigService } from './config/api-config.service';
export { GenericAssignDto } from './dto/generic-assign.dto';
export { default as GenericService } from './generic-service';
```

## Completion Criteria
- [ ] `packages/prisma/prisma/schema.prisma` exists with datasource + generator
- [ ] `packages/utils/src/dto/generic-assign.dto.ts` exports `GenericAssignDto<T>`
- [ ] `packages/utils/src/config/api-config.service.ts` exports `ApiConfigService`
- [ ] `packages/utils/src/generic-service/index.ts` exports `GenericService`
- [ ] `packages/utils/src/index.ts` exports all three
- [ ] No `@moonward-apps/*` imports

## Commit Message
```
feat: add packages/prisma and packages/utils
```

## Forbidden
- Never use `@moonward-apps/*` packages
- No business logic
- No `any` type
