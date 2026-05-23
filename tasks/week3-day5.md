# Week 3 Day 5 — Copy Image + Download + Full E2E

## Goal
Implement "Copy Image" (clipboard) and "Download" buttons. Render the final annotated image using Canvas, not SVG. Complete the full end-to-end flow and verify everything works.

## Context
- All components exist from Days 1-4
- Today: the overlay SVG needs to be merged with the original image into a single PNG for export
- Copy → `navigator.clipboard.write()` with ClipboardItem (PNG blob)
- Download → `<a download>` with blob URL
- Final E2E manual test of the complete flow

## Files to Update

### frontend/src/lib/canvas.ts — Add renderOverlayToCanvas

```typescript
/**
 * Renders the original screenshot + spec annotations onto a Canvas element.
 * Used for Copy Image and Download — produces a single annotated PNG.
 */
export async function renderOverlayToCanvas(
  imageUrl: string,
  spec: SpecResult,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Draw annotations for each element
      for (const element of spec.elements) {
        const { x, y, width, height } = element.position;

        // Bounding box
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);

        // Element ID
        ctx.fillStyle = '#3B82F6';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(element.id, x + 2, y - 5 < 0 ? y + 12 : y - 5);

        // Key style values
        const keyStyles = ['backgroundColor', 'color', 'fontSize', 'padding', 'borderRadius'] as const;
        keyStyles.forEach((field, i) => {
          const value = element.styles[field];
          const isNull = value === null;
          ctx.fillStyle = isNull ? '#EF4444' : '#1F2937';
          ctx.font = '10px monospace';
          ctx.fillText(
            `${field}: ${isNull ? '?' : value}`,
            x + width + 8,
            y + 14 + i * 14,
          );
        });
      }

      resolve(canvas);
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageUrl;
  });
}
```

### frontend/src/hooks/useSpecExport.ts
```typescript
'use client';

import { useCallback, useState } from 'react';
import { renderOverlayToCanvas, exportCanvasToBlob } from '@/lib/canvas';
import type { SpecResult } from '@/types/spec';

export function useSpecExport(imageUrl: string | null, spec: SpecResult | null) {
  const [isExporting, setIsExporting] = useState(false);

  const copyToClipboard = useCallback(async () => {
    if (!imageUrl || !spec) return;
    setIsExporting(true);
    try {
      const canvas = await renderOverlayToCanvas(imageUrl, spec);
      const blob = await exportCanvasToBlob(canvas);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      alert('Copied to clipboard! Paste into claude.ai');
    } catch (err) {
      alert('Copy failed. Try download instead.');
    } finally {
      setIsExporting(false);
    }
  }, [imageUrl, spec]);

  const downloadImage = useCallback(async () => {
    if (!imageUrl || !spec) return;
    setIsExporting(true);
    try {
      const canvas = await renderOverlayToCanvas(imageUrl, spec);
      const blob = await exportCanvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snaptospec-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed.');
    } finally {
      setIsExporting(false);
    }
  }, [imageUrl, spec]);

  return { copyToClipboard, downloadImage, isExporting };
}
```

### Update editor/page.tsx — Add Export Buttons

Add below the SpecOverlay:
```tsx
import { useSpecExport } from '@/hooks/useSpecExport';

// Inside EditorPage:
const { copyToClipboard, downloadImage, isExporting } = useSpecExport(imageUrl, spec);

// In JSX, below SpecOverlay:
{spec && imageUrl && (
  <div className="mt-6 flex gap-4">
    <button
      onClick={copyToClipboard}
      disabled={isExporting}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
    >
      {isExporting ? 'Processing...' : 'Copy Image'}
    </button>
    <button
      onClick={downloadImage}
      disabled={isExporting}
      className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
    >
      Download PNG
    </button>
    <button
      onClick={() => { setImageUrl(null); setSpec(null); }}
      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
    >
      Start Over
    </button>
  </div>
)}
```

## Final E2E Manual Test (must pass before committing)

```
FULL E2E TEST RESULTS:

1. Open http://localhost:3001
   ✅/❌ Landing page loads with "SnapToSpec" and "Get Started"

2. Click "Get Started" → /editor page
   ✅/❌ Drag-and-drop zone visible

3. Drop a PNG screenshot
   ✅/❌ Uploads → "Analyzing screenshot with Claude..." shown
   ✅/❌ Spec overlay appears with bounding boxes and labels

4. Verify overlay content
   ✅/❌ Bounding boxes visible on screenshot elements
   ✅/❌ Element IDs shown (e.g. "btn-primary")
   ✅/❌ Style values shown (fontSize, padding etc.)
   ✅/❌ null values shown in red

5. Click a red null value
   ✅/❌ ValueEditor popover opens
   ✅/❌ Type a value + Enter → overlay updates

6. Click a color field → click 🎨 → click on image
   ✅/❌ Cursor changes to crosshair
   ✅/❌ Color from image fills the input

7. Click "Copy Image"
   ✅/❌ Success message appears
   ✅/❌ Paste in image viewer → annotated PNG visible

8. Click "Download PNG"
   ✅/❌ File downloads as "snaptospec-[timestamp].png"
   ✅/❌ File opens and shows annotated screenshot
```

## Completion Criteria
- [ ] All 8 E2E test steps pass
- [ ] "Copy Image" → clipboard contains annotated PNG
- [ ] "Download PNG" → downloads annotated PNG file
- [ ] "Start Over" → clears state and shows upload zone again
- [ ] No `any` type anywhere
- [ ] `npm run build` succeeds
- [ ] `npm test` exits 0

## Commit Message
```
feat: add copy image and download, complete full E2E flow
```

## Forbidden
- No inline styles (except dynamic colors in canvas — acceptable)
- No `any` type
- No `pages/` directory
