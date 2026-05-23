# SnapToSpec — Project Plan

## Overview
A tool that converts design screenshots into spec overlay images for accurate UI development.

**Problem:** AI (Claude) makes px/color mistakes when reading design files. Correcting each one manually is tedious.

**Solution:**
1. Upload screenshot → backend stores in Supabase Storage → returns imageUrl
2. Claude Vision API analyzes imageUrl → returns JSON spec (internal only, not shown to user)
3. Frontend renders Canvas/SVG overlay: bounding boxes + element IDs + CSS values + null highlights
4. User clicks values to correct them; Canvas API samples colors from original image for null colors
5. Click "Copy Image" (Canvas.toBlob → clipboard) or "Download" → paste into claude.ai

**Architecture:** Stateless. No database in MVP. Browser state only.

**Target users:** Designers doing UI development with Claude (non-developers using claude.ai web)

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
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx               # Landing (screenshot upload)
│       │   └── editor/
│       │       └── page.tsx           # Spec editor (overlay + edit)
│       ├── components/
│       │   ├── upload/
│       │   │   └── ScreenshotUploader.tsx   # drag & drop upload
│       │   └── editor/
│       │       ├── SpecOverlay.tsx    # Canvas/SVG overlay (bounding boxes + labels)
│       │       └── ValueEditor.tsx    # Click-to-edit popover
│       ├── hooks/
│       │   ├── useCanvasColor.ts      # Canvas API: sample color from original image
│       │   └── useSpecExtraction.ts   # API call hook
│       ├── lib/
│       │   ├── api.ts                 # Backend API client
│       │   └── canvas.ts              # Canvas export (toBlob for copy/download)
│       └── types/
│           └── spec.ts                # SpecElement, SpecStyles types
│
├── backend/                           # NestJS 11 (stateless)
│   ├── package.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── src/
│       ├── main.ts                    # global setup (see CLAUDE.md)
│       ├── app.module.ts
│       ├── open-api.ts                # Swagger (non-prod only)
│       ├── winston-logger.ts
│       ├── shared/
│       │   ├── config-schema-validation/
│       │   │   └── index.ts           # Joi env validation
│       │   ├── filter/
│       │   │   └── global-exception.filter.ts
│       │   ├── middleware/
│       │   │   └── logger.middleware.ts
│       │   └── decorator/
│       │       └── exception-response.decorator.ts
│       └── module/
│           ├── health-check/
│           │   ├── health-check.module.ts
│           │   └── health-check.controller.ts   # GET /health → { status: 'ok' }
│           ├── file/                  # Image upload → Supabase Storage
│           │   ├── file.module.ts
│           │   ├── file.controller.ts  # POST /file/upload → { imageUrl }
│           │   ├── file.service.ts
│           │   └── storage/
│           │       ├── storage.interface.ts    # IStorageService
│           │       └── supabase-storage.service.ts
│           └── spec-extraction/       # Claude API → JSON spec
│               ├── spec-extraction.module.ts
│               ├── spec-extraction.controller.ts  # POST /spec/extract
│               ├── spec-extraction.service.ts
│               └── dto/
│                   ├── base.dto.ts
│                   ├── extract-request.dto.ts    # { imageUrl: string }
│                   └── extract-result.dto.ts     # { elements: SpecElement[] }
│
└── packages/
    ├── prisma/                        # Prisma setup (future use, not used in MVP)
    │   ├── package.json
    │   ├── prisma/
    │   │   └── schema.prisma          # empty schema (datasource + generator only)
    │   └── src/
    │       ├── index.ts
    │       ├── prisma-provider.ts     # singleton
    │       └── prisma-connection.ts   # extends PrismaClient, query logging in dev
    └── utils/
        ├── package.json
        └── src/
            ├── config/
            │   └── api-config.service.ts   # isDevelopment, applicationPort, etc.
            ├── dto/
            │   └── generic-assign.dto.ts   # abstract class GenericAssignDto<T>
            ├── generic-service/
            │   └── index.ts               # abstract GenericService (Prisma access)
            └── index.ts
```

---

## 2. Spec JSON Structure (returned by /spec/extract)

```typescript
// types/spec.ts (shared between frontend and backend)
interface SpecElement {
  id: string;           // e.g. "btn-primary", "text-heading"
  type: 'button' | 'text' | 'input' | 'image' | 'card' | 'container' | 'icon' | 'divider';
  label: string | null; // visible text
  position: { x: number; y: number; width: number; height: number }; // px from top-left
  styles: {
    backgroundColor: string | null;  // #HEX or 'transparent' or null
    color: string | null;            // #HEX or null
    fontSize: string | null;         // "16px" or null
    fontWeight: string | null;       // "400"|"500"|"600"|"700" or null
    borderRadius: string | null;     // "8px" or null
    padding: string | null;          // "12px 24px 12px 24px" or null
    margin: string | null;           // "0px 0px 16px 0px" or null
    border: string | null;           // "1px solid #E5E7EB" or "none" or null
    gap: string | null;              // "8px" or null
  };
}

interface SpecResult {
  elements: SpecElement[];
}
```

---

## 3. Storage Interface (AWS Migration Ready)

```typescript
export interface IStorageService {
  upload(file: Buffer, key: string, mimeType: string): Promise<string>;
  getSignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
// Supabase bucket: "screenshots"
// Now: SupabaseStorageService
// Later: S3StorageService (swap in file.module.ts only)
```

---

## 4. Spec Extraction Prompt

### System Prompt
```
You only speak JSON. Do not write text that is not JSON.
You are a UI spec extractor. Analyze the screenshot and return every visible UI element with exact specs.
```

### User Prompt
```
Analyze this UI screenshot and extract all visible elements.
Return ONLY this JSON:

{
  "elements": [
    {
      "id": "unique-slug-id",
      "type": "button|text|input|image|card|container|icon|divider",
      "label": "visible text or null",
      "position": { "x": 0, "y": 0, "width": 0, "height": 0 },
      "styles": {
        "backgroundColor": "#HEX or transparent or null",
        "color": "#HEX or null",
        "fontSize": "Npx or null",
        "fontWeight": "400|500|600|700|800 or null",
        "borderRadius": "Npx or null",
        "padding": "Npx Npx Npx Npx or null",
        "margin": "Npx Npx Npx Npx or null",
        "border": "Npx solid #HEX or none or null",
        "gap": "Npx or null"
      }
    }
  ]
}

Rules:
- All colors must be exact HEX codes. If unsure → null (never guess)
- All sizes in px
- Position values relative to image top-left
- Use null for any value you are not certain about
```

**Key:** null values are filled by human via Canvas API color picker in browser.
Temperature: 0.2 or below.

---

## 5. Frontend Overlay Rendering

Canvas/SVG overlay renders on top of the original screenshot image in the browser.
Each element shows:
- **Bounding box**: colored border around element boundaries
- **Element ID**: label in top-left corner of bounding box
- **CSS values**: key specs shown as callout labels (fontSize, padding, color, etc.)
- **Null highlight**: null values highlighted in red so user knows what to fix
- **Click-to-edit**: clicking any label opens an inline input to update the value
- **Canvas API color**: when clicking a null color, opens a color picker that samples from original image

Export: `canvas.toBlob()` → clipboard (`navigator.clipboard.write()`) or `<a download>` for file save.

---

## 6. Agent Task Schedule

### Start: May 24, 2026 (Brisbane AEST). Runs daily including weekends.

```
Week 1 (May 24-28) — Infrastructure
Day 1 May 24: Monorepo root (package.json, lerna, tsconfig, eslint, .env.example)
Day 2 May 25: Backend boilerplate (main.ts, AppModule, HealthModule) + Frontend skeleton
Day 3 May 26: packages/prisma + packages/utils (GenericAssignDto, ApiConfigService, GenericService)
Day 4 May 27: Backend global infra (GlobalExceptionFilter, LoggerMiddleware, ConfigSchemaValidation, open-api)
Day 5 May 28: IStorageService + SupabaseStorageService + FileModule

Week 2 (May 29-Jun 2) — Core Feature
Day 1 May 29: SpecExtractionModule skeleton (controller, service, DTOs)
Day 2 May 30: Claude API integration (SpecExtractionService.extract())
Day 3 May 31: Prompt tuning + error handling
Day 4 Jun 1:  E2E: upload image → extract → verify JSON response
Day 5 Jun 2:  Polish + manual testing

Week 3 (Jun 3-7) — Frontend
Day 1 Jun 3:  Next.js setup (App Router, Tailwind, types/spec.ts, lib/api.ts)
Day 2 Jun 4:  ScreenshotUploader + upload flow
Day 3 Jun 5:  Canvas/SVG overlay rendering (bounding boxes, labels, CSS values, null highlights)
Day 4 Jun 6:  Click-to-edit + Canvas API color extraction
Day 5 Jun 7:  Copy Image + Download + full E2E
```

### Checkpoints (human must verify before next week)
```
End of Week 1 (May 28): npm run start:dev works + /api/v1/health → 200 + POST /file/upload works
End of Week 2 (Jun 2):  POST /api/v1/spec/extract → returns valid JSON spec (CRITICAL)
End of Week 3 (Jun 7):  Full flow: upload → overlay → edit → copy/download
```

---

## 7. GitHub Actions Schedule (Brisbane AEST = UTC+10)

```yaml
feature-agent.yml: "0 23 * * *"   # 9am Brisbane (UTC+10 = 23:00 UTC prev day)
bug-agent.yml:     "0 4 * * *"    # 2pm Brisbane (UTC+10 = 04:00 UTC)
review-agent.yml:  "0 8 * * *"    # 6pm Brisbane (UTC+10 = 08:00 UTC)
# All run every day including weekends
```

---

## 8. Monitoring

Review Agent creates a PR for each feat/* branch after the Feature Agent runs.
Check GitHub PRs daily at 6pm Brisbane to see what was completed.
Each PR description includes a summary of what was implemented.

---

## 9. Tech Stack

| Layer | Current | After AWS Migration |
|---|---|---|
| Frontend | Next.js 14 + Vercel | Same |
| Backend | NestJS 11 + Railway | AWS ECS/EC2 |
| Image Storage | Supabase Storage | AWS S3 + CloudFront |
| DB | — (stateless MVP) | AWS RDS PostgreSQL |
| AI | Claude API claude-sonnet-4-6 | Same |
| Overlay Rendering | Browser Canvas/SVG | Same |
| Color Extraction | Canvas API (browser) | Same |
