# Week 2 Day 5 — Backend Polish + CORS + Frontend Preparation

## Goal
Polish the backend for frontend integration: CORS configured correctly, response DTOs consistent, error messages human-readable, and types exported for frontend use.

## Context
- Full backend pipeline (upload + extract) works after Days 1-4
- Today: prepare for frontend to call these APIs
- Ensure CORS allows `http://localhost:3001` (frontend dev port)
- Create shared types that frontend can import

## Tasks

### 1. Verify CORS Configuration

In `main.ts`, confirm CORS is set correctly:
```typescript
app.enableCors({
  origin: configService.getOrThrow<string>('ALLOWED_CORS_ORIGIN').split(','),
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
});
```

`.env` should have `ALLOWED_CORS_ORIGIN=http://localhost:3001`

### 2. Create Shared Types File

Create `backend/src/types/spec.types.ts` with TypeScript interfaces:
```typescript
// These match the DTO structure exactly
// Frontend will copy/import these types
export type SpecElementType = 'button' | 'text' | 'input' | 'image' | 'card' | 'container' | 'icon' | 'divider';

export interface SpecStyles {
  backgroundColor: string | null;
  color: string | null;
  fontSize: string | null;
  fontWeight: string | null;
  borderRadius: string | null;
  padding: string | null;
  margin: string | null;
  border: string | null;
  gap: string | null;
}

export interface SpecElement {
  id: string;
  type: SpecElementType;
  label: string | null;
  position: { x: number; y: number; width: number; height: number };
  styles: SpecStyles;
}

export interface SpecResult {
  elements: SpecElement[];
}
```

### 3. Consistent Error Response Format

Ensure `GlobalExceptionFilter` always returns this shape:
```json
{
  "statusCode": 400,
  "message": "Human readable description"
}
```
No stack traces in production (check NODE_ENV).

### 4. Add FileModule CORS for multipart

Verify that `POST /file/upload` works from a browser with `Content-Type: multipart/form-data`.
Test with curl:
```bash
curl -X POST http://localhost:3000/api/v1/file/upload \
  -F "file=@/path/to/test.png" \
  -H "Origin: http://localhost:3001"
```
Should return `{ "imageUrl": "..." }` with 200 status.

### 5. Final API Smoke Test

Before committing, verify all endpoints:
```
GET  /api/v1/health              → 200 { status: 'ok' }
POST /api/v1/file/upload         → 200 { imageUrl: '...' }
POST /api/v1/spec/extract        → 200 { elements: [...] }
GET  /api/swagger                → 200 (HTML, Swagger UI)
```

### 6. Update .env.example

Ensure `.env.example` is up to date with all required variables:
```
NODE_ENV=development
DATABASE_URL=
APPLICATION_PORT=3000
PROJECT_NAME=snaptospec
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ALLOWED_CORS_ORIGIN=http://localhost:3001
FRONTEND_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
```

> **Deployment note:** When deploying to Vercel, set `NEXT_PUBLIC_API_URL` to your Railway backend URL
> (e.g. `https://your-app.railway.app`) in the Vercel dashboard → Settings → Environment Variables.
> Also add it as a GitHub Secret `NEXT_PUBLIC_API_URL` if your CI builds the frontend.

## Completion Criteria
- [ ] All 4 smoke test endpoints return correct responses
- [ ] CORS allows requests from `http://localhost:3001`
- [ ] `backend/src/types/spec.types.ts` exists with correct TypeScript interfaces
- [ ] Error responses follow `{ statusCode, message }` format
- [ ] `.env.example` is complete and up to date

## Commit Message
```
chore: polish backend for frontend integration
```

## Forbidden
- No `any` type
- No `console.log`
- No stack traces in production error responses
- Never use `@moonward-apps/*` packages
