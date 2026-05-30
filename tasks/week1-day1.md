# Week 1 Day 1 — Monorepo Root Setup

## Goal
Initialize the monorepo root config files. No application code — skeleton only.

## Context
- Project: SnapToSpec (see CLAUDE.md and PROJECT_PLAN.md)
- Nothing exists except CLAUDE.md, PROJECT_PLAN.md, .github/, tasks/
- Follow all CLAUDE.md rules strictly

## Files to Create

### Root files
```
package.json          # Lerna workspace with npm workspaces
lerna.json            # packages: ["frontend", "backend", "packages/*"]
tsconfig.json         # base TypeScript config (strict mode, emitDecoratorMetadata: true)
.prettierrc           # { "singleQuote": true, "trailingComma": "all" }
.commitlintrc.json    # conventional commits config
eslint.config.mjs     # TypeScript ESLint flat config
.env.example          # all env vars from CLAUDE.md (empty values, with comments)
```

Update `.gitignore` (currently only has `.env`) to also include:
`node_modules/`, `dist/`, `.next/`, `*.log`, `coverage/`

### package.json scripts (root)
```json
{
  "private": true,
  "workspaces": ["frontend", "backend", "packages/*"],
  "scripts": {
    "start:dev": "lerna run start:dev --parallel",
    "build": "lerna run build",
    "test": "lerna run test",
    "lint": "eslint . && cspell \"**/*.{ts,tsx,md}\"",
    "prisma:generate": "lerna run prisma:generate --scope=@snaptospec/prisma",
    "prisma:migrate:dev": "lerna run prisma:migrate:dev --scope=@snaptospec/prisma",
    "prisma:migrate:prod": "lerna run prisma:migrate:prod --scope=@snaptospec/prisma"
  }
}
```

### tsconfig.json (base config)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

### eslint.config.mjs
TypeScript ESLint flat config with these rules:
- `@typescript-eslint/no-explicit-any`: "error"
- `no-console`: "error"
- `@typescript-eslint/no-unused-vars`: ["error", { "ignoreRestSiblings": true }]
- Prettier integration (`eslint-config-prettier`)
- Applies to `**/*.{ts,tsx}` files

### lerna.json
```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "npm",
  "packages": ["frontend", "backend", "packages/*"]
}
```

## Completion Criteria
- [ ] `npm install` runs without errors from root
- [ ] `npm run lint` runs without errors (no TS source files yet, config only)
- [ ] All listed root files exist

## Commit Message
```
chore: init monorepo root config
```

## Forbidden
- No application source code in this task (root config only)
- Never use `@moonward-apps/*` packages
- Never push directly to main branch
- No business logic
