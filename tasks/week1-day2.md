# Week 1 Day 2 — Backend Boilerplate + Frontend Skeleton

## Goal
Create backend NestJS boilerplate with correct global setup, and frontend Next.js skeleton. No business logic.

## Context
- Root config from Day 1 must already exist
- Follow main.ts pattern from CLAUDE.md exactly
- `packages/utils` does NOT exist yet — GenericService will be added on Day 4
- For now, main.ts imports only from @nestjs packages

## Backend Files to Create

```
backend/
├── package.json         # NestJS 11 dependencies (see below)
├── nest-cli.json        # with @nestjs/swagger plugin
├── tsconfig.json        # extends ../tsconfig.json
├── tsconfig.build.json  # excludes test/spec files
└── src/
    ├── main.ts          # full global setup (see CLAUDE.md main.ts pattern)
    ├── app.module.ts    # imports ConfigModule + HealthCheckModule
    ├── open-api.ts      # Swagger setup (disabled in production)
    └── module/
        └── health-check/
            ├── health-check.module.ts
            └── health-check.controller.ts  # GET /health → { status: 'ok' }
```

### backend/package.json key dependencies
```json
{
  "name": "@snaptospec/backend",
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@nestjs/terminus": "^11.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "joi": "^17.13.3",
    "nest-winston": "^1.9.0",
    "winston": "^3.11.0",
    "rxjs": "^7.8.1",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.1",
    "ts-jest": "^29.0.0",
    "jest": "^29.0.0"
  },
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "test": "jest --passWithNoTests"
  }
}
```

### nest-cli.json
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "plugins": ["@nestjs/swagger"]
  }
}
```

### main.ts
Follow the exact pattern from CLAUDE.md "main.ts Global Setup" section.
- Import ConfigService from @nestjs/config
- GlobalExceptionFilter does NOT exist yet — skip it for now, add TODO comment
- ApplicationPort from configService: `Number(configService.get('APPLICATION_PORT') ?? 3000)`

### health-check.controller.ts
```typescript
@Controller('health')
export class HealthCheckController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

## Frontend Files to Create

```
frontend/
├── package.json         # Next.js 14 dependencies
├── next.config.ts
├── tsconfig.json        # Next.js tsconfig
├── tailwind.config.ts
└── src/
    └── app/
        ├── layout.tsx   # root layout with Tailwind
        └── page.tsx     # "Hello SnapToSpec" — h1 only, no other content
```

### frontend/package.json key dependencies
```json
{
  "name": "@snaptospec/frontend",
  "scripts": {
    "start:dev": "next dev -p 3001",
    "build": "next build",
    "test": "jest --passWithNoTests"
  },
  "dependencies": {
    "next": "14.x",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

## Completion Criteria
- [ ] `cd backend && npm run build` succeeds
- [ ] `GET /api/v1/health` returns `{ "status": "ok" }` when server starts
- [ ] `cd frontend && npm run build` succeeds
- [ ] frontend/src/app/page.tsx renders "Hello SnapToSpec"
- [ ] No `@moonward-apps/*` imports anywhere
- [ ] No `console.log` anywhere

## Commit Message
```
feat: add backend boilerplate and frontend skeleton
```

## Forbidden
- No business logic
- Never use `@moonward-apps/*` packages
- No inline styles in frontend
- No `pages/` directory in frontend
