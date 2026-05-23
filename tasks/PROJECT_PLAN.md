# SnapToSpec — Full Project Plan

## Overview
A tool that converts design screenshots into accurate UI spec JSON.
Improves the quality of input passed to Claude Code to eliminate px/color errors.

---

## 1. Monorepo File Structure

```
snaptospec/
├── CLAUDE.md
├── PROJECT_PLAN.md
├── package.json                       # Lerna workspace
├── lerna.json
├── tsconfig.json
├── .prettierrc
├── .commitlintrc.json
├── eslint.config.mjs
├── .env
├── .env.example
├── .gitignore
│
├── frontend/                          # Next.js 14 (App Router)
│   ├── CLAUDE.md
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx               # Landing (screenshot upload)
│       │   ├── editor/
│       │   │   └── page.tsx           # Spec editor (core screen)
│       │   └── result/
│       │       └── page.tsx           # Final spec JSON + export
│       ├── components/
│       │   ├── upload/
│       │   │   └── ScreenshotUploader.tsx
│       │   ├── editor/
│       │   │   ├── AnnotationCanvas.tsx   # Screenshot overlay
│       │   │   ├── SpecPanel.tsx          # Right-side spec edit panel
│       │   │   └── ElementCard.tsx        # Per-element card
│       │   └── ui/
│       ├── hooks/
│       │   ├── useCanvasColor.ts      # Canvas API color extraction
│       │   └── useSpecExtraction.ts   # Claude API call
│       ├── lib/
│       │   ├── api.ts
│       │   └── canvas.ts
│       └── types/
│           └── spec.ts
│
├── backend/                           # NestJS 11
│   ├── CLAUDE.md
│   ├── package.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── app.controller.ts
│       ├── app.service.ts
│       ├── open-api.ts
│       ├── winston-logger.ts
│       ├── shared/
│       │   ├── generic-service/
│       │   │   └── index.ts           # GenericService (Prisma injection)
│       │   ├── config-schema-validation/
│       │   │   └── index.ts           # Joi env validation
│       │   ├── exception-handler/
│       │   │   └── prisma-exception-handler/
│       │   ├── decorator/
│       │   │   ├── get-user.decorator.ts
│       │   │   └── exception-response.decorator.ts
│       │   ├── middleware/
│       │   │   └── logger.middleware.ts   # moonward replacement
│       │   ├── pipes/
│       │   │   └── check-exist.pipe.ts
│       │   └── dto/
│       │       └── error-response/
│       └── module/
│           ├── health-check/
│           ├── spec-extraction/       # Core — Claude API call
│           │   ├── spec-extraction.module.ts
│           │   ├── spec-extraction.controller.ts
│           │   ├── spec-extraction.service.ts
│           │   └── dto/
│           │       ├── extract-request.dto.ts
│           │       └── extract-result.dto.ts
│           ├── spec-session/          # Session save/edit
│           │   ├── spec-session.module.ts
│           │   ├── spec-session.controller.ts
│           │   ├── spec-session.service.ts
│           │   └── dto/
│           ├── file/                  # Image upload (Supabase Storage → S3 later)
│           │   ├── file.module.ts
│           │   ├── file.controller.ts
│           │   └── file.service.ts    # Abstracted via IStorageService interface
│           └── code-export/           # Spec JSON → Claude Code prompt
│               ├── code-export.module.ts
│               ├── code-export.service.ts
│               └── dto/
│
└── packages/
    ├── prisma/                        # Prisma (PostgreSQL / Supabase)
    │   ├── package.json
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   └── migrations/
    │   └── src/
    │       └── index.ts               # PrismaProvider
    └── utils/
        ├── package.json
        └── src/
            ├── config/
            │   └── api-config.service.ts
            └── index.ts
```

---

## 2. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model SpecSession {
  id              String        @id @default(cuid())
  screenshotUrl   String
  rawSpec         Json          // Original spec extracted by Claude
  editedSpec      Json?         // Human-edited version
  exportedPrompt  String?       // Final prompt to pass to Claude Code
  status          SessionStatus @default(EXTRACTING)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum SessionStatus {
  EXTRACTING
  REVIEWING
  EXPORTED
}
```

---

## 3. AWS Migration Strategy

Designed with interfaces so Supabase → AWS migration requires minimal code changes.

```typescript
// shared/storage/storage.interface.ts
export interface IStorageService {
  upload(file: Buffer, key: string): Promise<string>;
  getSignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

// Now: SupabaseStorageService implements IStorageService
// Later: S3StorageService implements IStorageService
// → Only swap the provider in file.module.ts
```

---

## 4. Agent Task Plan (4-week prototype)

### Checkpoint Criteria (human must verify)

```
End of Week 1 → npm run start:dev works + Supabase connected + /api/v1/health responds
End of Week 2 → Screenshot upload → Claude API → JSON returned (CORE: do not proceed to Week 3 if this fails)
End of Week 3 → Spec overlay displayed in browser + Canvas color extraction works
End of Week 4 → Full flow works end-to-end (upload → spec → edit → export)
```

---

### Feature Agent Tasks (runs at 9am KST weekdays)

#### Week 1 — Project Foundation
```
Day 1: Monorepo init (lerna, tsconfig, eslint, prettier, commitlint)
Day 2: GitHub Actions setup (3 workflow files + dev branch creation)
Day 3: NestJS backend boilerplate (main.ts, app.module, GlobalPipe, CORS, Swagger)
Day 4: packages/prisma setup (schema.prisma, PrismaProvider, Supabase connection)
Day 5: packages/utils ApiConfigService + Joi ConfigSchemaValidation + shared/ (GenericService, LoggerMiddleware, PrismaExceptionHandler)
```

#### Week 2 — File Upload + Core Spec Extraction
```
Day 1: IStorageService interface + SupabaseStorageService implementation
Day 2: file module (image upload endpoint)
Day 3: spec-extraction module skeleton (Controller, Service, DTO)
Day 4: Claude API integration (image → spec JSON extraction)
       ⚠️ Prompt requires human tuning — agent writes draft, human reviews
Day 5: spec-session module (session CRUD) + unit tests
```

#### Week 3 — Frontend
```
Day 1: Next.js init (App Router, Tailwind, folder structure)
Day 2: ScreenshotUploader component + API client (lib/api.ts)
Day 3: Upload → backend E2E connection
Day 4: AnnotationCanvas base (image rendering + Canvas API color extraction)
Day 5: Spec overlay display (visualize Claude extraction results)
```

#### Week 4 — Editor Complete + Export (Prototype Done)
```
Day 1: SpecPanel right-side edit panel + ElementCard
Day 2: Click-to-edit interface for element values
Day 3: code-export module (spec JSON → Claude Code prompt)
Day 4: Result page (display final prompt + copy button)
Day 5: Full flow E2E test + bug fixes
```

---

### Bug Agent Tasks (runs at 2pm KST weekdays)
```
Daily checklist:
- Scan for TypeScript any type usage
- Fix ESLint warnings
- Detect missing error handling
- Remove unused imports/variables
- Detect Prisma N+1 queries
- Check for missing DTO validation
- Check for unvalidated environment variables
- Check for console.log usage
- Check for moonward package imports
```

### Review Agent Tasks (runs at 6pm KST weekdays)
```
Daily checklist:
- Verify CLAUDE.md rule compliance
- Auto-create PRs for feat/* and fix/* branches
- Verify tests pass
- Merge passing branches into dev
- Every Friday: create dev → main PR (human merges manually)
```

---

## 5. GitHub Actions Schedule

```yaml
# feature-agent.yml
schedule: '0 0 * * 1-5'   # 9am KST weekdays (UTC 0)

# bug-agent.yml
schedule: '0 5 * * 1-5'   # 2pm KST weekdays (UTC 5)

# review-agent.yml
schedule: '0 9 * * 1-5'   # 6pm KST weekdays (UTC 9)
```

---

## 6. Branch Strategy

```
main    → production (human merges manually, weekly)
dev     → always latest (Review Agent merges daily)
feat/*  → Feature Agent work
fix/*   → Bug Agent work
```

---

## 7. Tech Stack

| Layer | Current | After AWS Migration |
|---|---|---|
| Frontend | Next.js 14 + Vercel | Same |
| Backend | NestJS 11 + Railway | AWS ECS or EC2 |
| Database | Supabase PostgreSQL | AWS RDS PostgreSQL |
| Image Storage | Supabase Storage | AWS S3 + CloudFront |
| Email | AWS SES | Same |
| Scheduler | GitHub Actions cron | Same or EventBridge |
| AI | Claude API (claude-sonnet-4-5) | Same |
| Color Extraction | Canvas API (browser) | Same |

---

## 8. Spec Extraction Prompt (starting point for Week 2 Day 4)

### System Prompt
```
You only speak JSON. Do not write text that isn't JSON.
You are a UI spec extractor. Analyze the screenshot and return
every visible UI element with exact specs.
```

### User Prompt
```
Analyze this UI screenshot and extract all elements.
Return ONLY this JSON structure, nothing else:

{
  "elements": [
    {
      "id": "unique-id",
      "type": "button|text|input|image|card|container|...",
      "label": "visible text if any",
      "position": { "x": 0, "y": 0, "width": 0, "height": 0 },
      "styles": {
        "backgroundColor": "#HEX or transparent",
        "color": "#HEX",
        "fontSize": "Npx",
        "fontWeight": "400|500|600|700",
        "borderRadius": "Npx",
        "padding": "top right bottom left",
        "margin": "top right bottom left",
        "border": "width style color or none",
        "gap": "Npx or null"
      }
    }
  ]
}

Rules:
- All colors must be exact HEX codes
- All sizes in px
- If unsure about a value, write null (never guess)
- Position values are relative to image top-left corner
```

### Key Principles
- The `null` rule is most important — write null if unsure, never estimate
- null values are filled by human using Canvas API (pixel picker)
- Set temperature to 0.2 or below (keeps output consistent)
- Cropping to individual elements before sending improves accuracy
