# CLAUDE.md — SnapToSpec

## Project Overview
A tool that converts design screenshots into spec overlay images for accurate UI development with Claude.
Upload a screenshot → Claude extracts specs → overlay image shows px/colors/spacing → human clicks to correct values → copy to clipboard or download → paste into claude.ai for accurate UI generation.

## Monorepo Structure
- `frontend/`: Next.js 14 App Router (TypeScript)
- `backend/`: NestJS 11 (TypeScript)
- `packages/prisma/`: Prisma ORM (PostgreSQL / Supabase)
- `packages/utils/`: Shared utilities (ApiConfigService, GenericAssignDto, GenericService)

## Commands
```bash
npm run start:dev           # Start all dev servers (run from root)
npm run build               # Build all workspaces
npm test                    # Run all tests
npm run lint                # ESLint + spell check
npm run prisma:generate     # Must run after any schema change
npm run prisma:migrate:dev  # Create new migration
npm run prisma:migrate:prod # Apply migrations in production
```

## Backend Architecture Rules

### Module Pattern
- All Services must extend `GenericService` (from `packages/utils`)
- Guards that need DB access must also extend `GenericService`
- Request flow: `Controller → Service → Pipe`
- Business validation in Pipe, DB logic in Service
- Services used by other modules must be listed in `exports` array of their module

### DTO Rules
- Input: `class-validator` decorators required
- Output: `class-transformer` + `@Exclude()` / `@Expose()`
- All DTOs must extend `GenericAssignDto<T>` (from `packages/utils`)
- File structure per module:
  ```
  module/dto/
    base.dto.ts          # common fields + validation decorators
    create.dto.ts        # PickType/OmitType(BaseDto, [...])
    update.dto.ts        # PartialType(CreateDto)
    payload.dto.ts       # DB relations included, static include getter
    list/
      request.dto.ts
      result.dto.ts
  ```
- PayloadDto must define static include getter using `Prisma.validator<>()`:
  ```typescript
  static get include() {
    return Prisma.validator<Prisma.ModelInclude>()({ relation: true });
  }
  // Usage in service: prisma.model.findUnique({ include: ModelPayloadDto.include })
  ```

### Logger Rules
- Every service must declare: `private readonly logger = new Logger(ServiceName.name);`
- Use `this.logger.log()`, `this.logger.error()`, `this.logger.warn()`
- `console.log` is absolutely forbidden

### main.ts Global Setup (must follow this exact pattern)
```typescript
const app = await NestFactory.create(AppModule, { rawBody: true });
app.enableCors({
  origin: configService.getOrThrow<string>('ALLOWED_CORS_ORIGIN').split(','),
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
});
app.setGlobalPrefix('api/v1')
  .useGlobalPipes(new ValidationPipe({ transform: true, forbidNonWhitelisted: true, whitelist: true }))
  .useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
  .useGlobalFilters(new GlobalExceptionFilter());
process.on('SIGTERM', async () => { await app.close(); });
```

### Configuration
- Environment variables: must be validated via `ConfigSchemaValidation` (Joi)
- Global prefix: `/api/v1`
- Swagger: `/api/swagger` (NODE_ENV !== production)
- CORS: controlled via `ALLOWED_CORS_ORIGIN` env var (comma-separated for multiple origins)

### Custom Decorators
- Extract request data via `createParamDecorator`:
  ```typescript
  export const GetUser = createParamDecorator((_, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest().user
  );
  ```

### Prisma Transactions
```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.model.create({ ... });
  await tx.other.update({ ... });
});
```

### Global Exception Filter
Must implement `GlobalExceptionFilter` at `src/shared/filter/global-exception.filter.ts`:
- `PrismaClientKnownRequestError` P2002 → `ConflictException`
- `PrismaClientKnownRequestError` P2025 → `NotFoundException`
- `PrismaClientValidationError` → `BadRequestException`
- All others → re-throw

### nest-cli.json — Swagger plugin required
```json
{ "compilerOptions": { "deleteOutDir": true, "plugins": ["@nestjs/swagger"] } }
```

## Frontend Architecture Rules
- Use App Router only (`pages/` directory is forbidden)
- Server components first, use `'use client'` only when necessary
- Color extraction must use Canvas API (never AI estimation)
- Use Tailwind CSS only (no inline styles)
- Overlay image rendering: display annotated image with click-to-edit values

## AWS Migration Strategy
Storage must always be accessed through IStorageService interface.
Direct Supabase Storage SDK calls outside the service module are forbidden.
```typescript
// Correct
constructor(private readonly storageService: IStorageService) {}
await this.storageService.upload(file, key);

// Forbidden
import { createClient } from '@supabase/supabase-js'; // direct call outside module
```

## Commit Convention
```
feat: add new feature
fix: bug fix
chore: package or config changes
refactor: code improvement without behavior change
docs: documentation update
test: add or update tests
```

## Absolute Rules (Never Violate)
- Never push directly to `main` branch (always use PR)
- Never commit `.env` file
- Never use `@moonward-apps/*` packages (no access rights)
- Never use `any` type (use `unknown` or generics)
- Never use `console.log` (use NestJS Logger)
- Never call storage directly bypassing IStorageService interface
- Never inline styles in frontend (Tailwind only)
- Never use `pages/` directory in frontend

## Moonward Package Replacements
| Original (moonward) | Replacement |
|---|---|
| `nestjs-logger-middleware` | `src/shared/middleware/logger.middleware.ts` (custom) |
| `aws-ses` | `@aws-sdk/client-ses` |
| `aws-url-presigner` | `@aws-sdk/s3-request-presigner` |
| `nestjs-pagination` | `nestjs-paginate` |
| `nestjs-stripe` | `stripe` npm package |
| `nestjs-keycloak` | `passport-jwt` + `@nestjs/jwt` |
| `GenericAssignDto<T>` | `packages/utils/src/dto/generic-assign.dto.ts` (custom) |
| `ExceptionsMiddleware` | `src/shared/filter/global-exception.filter.ts` (custom) |
| `WinstonLogger` / logger setup | `nest-winston` package |
| `ResultPaginationDto` | `nestjs-paginate` built-in types |
| `@Validator.IsULID()` etc. | `class-validator` built-ins (`@IsUUID()`, `@IsEmail()` etc.) |

## Branch Strategy
- `main`: production (manual merge only, weekly)
- `dev`: always latest (Review Agent merges daily)
- `feat/*`: Feature Agent work branches
- `fix/*`: Bug Agent work branches

## Current Development Phase
Phase 1 (Week 1-3): Core feature prototype
- Auth: not implemented (will add later using passport-jwt pattern)
- Stripe: not implemented (will add later)
- Image storage: Supabase Storage (will migrate to AWS S3 later)
- Deployment: Railway + Vercel (will migrate to AWS later)

## Environment Variables
```
NODE_ENV=development
DATABASE_URL=                     # Supabase PostgreSQL
APPLICATION_PORT=3000
PROJECT_NAME=snaptospec
ANTHROPIC_API_KEY=                # Claude API
SUPABASE_URL=                     # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key
ALLOWED_CORS_ORIGIN=http://localhost:3001
FRONTEND_BASE_URL=http://localhost:3001
```
