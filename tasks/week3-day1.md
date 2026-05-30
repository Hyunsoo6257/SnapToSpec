# Week 3 Day 1 — Next.js Setup + Types + API Client

## Goal
Initialize the Next.js frontend properly: App Router, Tailwind, TypeScript types for spec data, and API client functions.

## Context
- Frontend skeleton (package.json, layout.tsx, page.tsx "Hello SnapToSpec") from Week 1 Day 2 exists
- Backend is fully ready at http://localhost:3000
- Today: set up the foundational layer the rest of the frontend builds on
- Follow all CLAUDE.md rules (App Router only, Tailwind only, 'use client' only when necessary)

## Files to Create/Update

### frontend/src/types/spec.ts
Copy the types from `backend/src/types/spec.types.ts`:
```typescript
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

### frontend/src/lib/api.ts
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export async function uploadScreenshot(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/file/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message ?? 'Upload failed');
  }

  return res.json();
}

export async function extractSpec(imageUrl: string): Promise<SpecResult> {
  const res = await fetch(`${API_BASE}/spec/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Extraction failed' }));
    throw new Error(error.message ?? 'Extraction failed');
  }

  return res.json();
}
```

### frontend/src/lib/canvas.ts (utility stubs for later)
```typescript
// Stub implementations — filled in on Day 4 and Day 5

export function sampleColorFromImage(
  imageElement: HTMLImageElement,
  x: number,
  y: number,
): string {
  // TODO Day 4: Canvas API color sampling
  return '#000000';
}

export async function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  // TODO Day 5: Canvas.toBlob for clipboard/download
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
}
```

### Update frontend/src/app/page.tsx
Replace "Hello SnapToSpec" with a minimal landing page structure:
```tsx
// Server component — no 'use client'
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">SnapToSpec</h1>
      <p className="text-gray-500 mb-8">Convert screenshots to UI specs</p>
      <Link
        href="/editor"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
      >
        Get Started
      </Link>
    </main>
  );
}
```

### Create frontend/src/app/editor/page.tsx (placeholder)
```tsx
export default function EditorPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900">Editor</h1>
      <p className="text-gray-500 mt-2">Upload component coming in Day 2</p>
    </main>
  );
}
```

### Add environment variable
Create `frontend/.env.local.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Completion Criteria
- [ ] `npm run build` in frontend succeeds
- [ ] `npm run start:dev` in frontend runs on port 3001
- [ ] `frontend/src/types/spec.ts` exports SpecElement, SpecResult, SpecStyles, SpecElementType
- [ ] `frontend/src/lib/api.ts` exports `uploadScreenshot` and `extractSpec` functions
- [ ] `frontend/src/lib/canvas.ts` exports stub functions
- [ ] Home page renders with "SnapToSpec" heading and "Get Started" link
- [ ] No inline styles (Tailwind only)
- [ ] No `pages/` directory

## Commit Message
```
feat: setup Next.js frontend with types and API client
```

## Forbidden
- No inline styles (Tailwind only)
- No `pages/` directory
- No `any` type
- Never add `'use client'` to page.tsx unless genuinely needed (today it's not needed)
