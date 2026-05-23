# Week 3 Day 2 — ScreenshotUploader Component + Upload Flow

## Goal
Build the ScreenshotUploader component and wire it to the upload API. User drops or selects an image → it uploads to backend → imageUrl is stored in state.

## Context
- Frontend types and API client from Day 1 exist
- This component lives on the editor page
- After upload, the editor page needs the imageUrl to proceed to spec extraction
- `'use client'` required (file drop events, state)
- Tailwind only, no inline styles

## Files to Create/Update

### frontend/src/components/upload/ScreenshotUploader.tsx
```tsx
'use client';

import { useState, useCallback } from 'react';
import { uploadScreenshot } from '@/lib/api';

interface Props {
  onUploadComplete: (imageUrl: string, file: File) => void;
}

export function ScreenshotUploader({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const { imageUrl } = await uploadScreenshot(file);
      onUploadComplete(imageUrl, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={[
        'border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400',
      ].join(' ')}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id="screenshot-input"
      />
      <label htmlFor="screenshot-input" className="cursor-pointer">
        {isUploading ? (
          <p className="text-gray-500">Uploading...</p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-700">Drop your screenshot here</p>
            <p className="text-sm text-gray-400 mt-2">or click to select a file</p>
          </>
        )}
      </label>
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

### Update frontend/src/app/editor/page.tsx
```tsx
'use client';

import { useState } from 'react';
import { ScreenshotUploader } from '@/components/upload/ScreenshotUploader';
import { extractSpec } from '@/lib/api';
import type { SpecResult } from '@/types/spec';

export default function EditorPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [spec, setSpec] = useState<SpecResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = async (url: string, file: File) => {
    setImageUrl(url);
    setImageFile(file);
    setIsExtracting(true);
    setError(null);

    try {
      const result = await extractSpec(url);
      setSpec(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Spec extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">SnapToSpec Editor</h1>

      {!imageUrl && (
        <ScreenshotUploader onUploadComplete={handleUploadComplete} />
      )}

      {isExtracting && (
        <div className="mt-8 text-center text-gray-500">
          Analyzing screenshot with Claude...
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {spec && imageUrl && (
        <div className="mt-8">
          <p className="text-green-600 font-medium">
            ✓ Extracted {spec.elements.length} elements — overlay coming in Day 3
          </p>
          <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-64">
            {JSON.stringify(spec, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
```

## Completion Criteria
- [ ] Drag & drop a PNG → uploads to backend → `imageUrl` received
- [ ] After upload, automatically calls `extractSpec(imageUrl)` → shows raw JSON spec
- [ ] If upload fails → shows error message (not crash)
- [ ] If extraction fails → shows error message (not crash)
- [ ] Loading states visible during upload and extraction
- [ ] No inline styles (Tailwind only)
- [ ] `'use client'` only on components that need it (editor page, ScreenshotUploader)

## Commit Message
```
feat: add ScreenshotUploader and upload-to-extract flow
```

## Forbidden
- No inline styles
- No `any` type
- No `pages/` directory
