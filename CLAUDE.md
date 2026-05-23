# CLAUDE.md — SnapToSpec

## Project Overview
A tool that converts design screenshots into UI spec JSON to provide accurate input for Claude Code.
Extracts px, color, and spacing precisely so humans can review/edit before passing to code generation.

## Monorepo Structure
- `frontend/`: Next.js 14 App Router (TypeScript)
- `backend/`: NestJS 11 (TypeScript)
- `packages/prisma/`: Prisma ORM (PostgreSQL / Supabase)
- `packages/utils/`: Shared ApiConfigService

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
- All Services must extend `GenericService`
- Request flow: `Controller → Service → Pipe`
- Business validation in Pipe, DB logic in Service

### DTO Rules
- Input: `class-validator` decorators required
- Output: `class-transformer` + `@Exclude()` / `@Expose()`
- File naming: `request.dto.ts` / `result.dto.ts` / `payload.dto.ts`

### Configuration
- Environment variables: must be validated via `ConfigSchemaValidation` (Joi)
- Global prefix: `/api/v1`
- Swagger: `/api/swagger` (NODE_ENV !== production)
- CORS: controlled via `ALLOWED_CORS_ORIGIN` env var

## Frontend Architecture Rules
- Use App Router only (`pages/` directory is forbidden)
- Server components first, use `'use client'` only when necessary
- Color extraction must use Canvas API (never AI estimation)
- Use Tailwind CSS only (no inline styles)

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
- Never use `any` type (use unknown or generics)
- Never use `console.log` (use NestJS Logger)
- Never call storage directly bypassing IStorageService interface

## Moonward Package Replacements
| Original (moonward) | Replacement |
|---|---|
| `nestjs-logger-middleware` | `src/shared/middleware/logger.middleware.ts` |
| `aws-ses` | `@aws-sdk/client-ses` |
| `aws-url-presigner` | `@aws-sdk/s3-request-presigner` |
| `nestjs-pagination` | `nestjs-paginate` |
| `nestjs-stripe` | `stripe` npm package |
| `nestjs-keycloak` | `passport-jwt` + `@nestjs/jwt` |

## Branch Strategy
- `main`: production (manual merge only, weekly)
- `dev`: always latest (Review Agent merges daily)
- `feat/*`: Feature Agent work branches
- `fix/*`: Bug Agent work branches

## Current Development Phase
Phase 1 (Week 1-4): Core feature prototype
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
