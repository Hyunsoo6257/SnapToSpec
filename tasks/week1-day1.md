# Week 1 Day 1 — Monorepo Initialization

## Context
- Project name: SnapToSpec
- Reference code: vaulcan-backend, pocket-appraisal-nz-backend (follow patterns only)
- Must follow all rules in CLAUDE.md

## Goal
Initialize the snaptospec/ root monorepo.
Goal is a working skeleton only. No business logic.

## Completion Criteria (all must be met)
- [ ] `npm install` runs without errors from root
- [ ] `npm run lint` runs without errors
- [ ] All files listed below exist

## Files to Create

### Root
```
package.json         # lerna workspace config
lerna.json           # packages: ["frontend", "backend", "packages/*"]
tsconfig.json        # base tsconfig
.prettierrc          # { "singleQuote": true, "trailingComma": "all" }
.commitlintrc.json   # conventional commits
eslint.config.mjs    # same rules as vaulcan-backend
.gitignore
.env.example         # refer to CLAUDE.md environment variables section
```

### backend/
```
package.json         # NestJS 11 dependencies (moonward packages strictly forbidden)
nest-cli.json
tsconfig.json
tsconfig.build.json
src/
  main.ts            # empty bootstrap function only
  app.module.ts      # empty AppModule only
  app.controller.ts
  app.service.ts
```

### frontend/
```
package.json         # Next.js 14
next.config.ts
tsconfig.json
tailwind.config.ts
src/app/
  layout.tsx
  page.tsx           # "Hello SnapToSpec" text only
```

### packages/prisma/
```
package.json
prisma/
  schema.prisma      # use schema from PROJECT_PLAN.md exactly
src/
  index.ts           # PrismaProvider (follow pocket-appraisal pattern)
```

### packages/utils/
```
package.json
src/
  config/
    api-config.service.ts   # follow pocket-appraisal pattern
  index.ts
```

## Reference Files
- pocket-appraisal-nz-backend/packages/utils/src/ (ApiConfigService pattern)
- pocket-appraisal-nz-backend/lerna.json
- vaulcan-backend/eslint.config.mjs
- vaulcan-backend/tsconfig.json

## Forbidden
- Never use @moonward-apps/* packages
- No business logic (skeleton only)
- Never push directly to main branch

## Branch
feat/week1-day1-monorepo-init

## Commit Message
feat: init monorepo structure
