# Week 3 Day 4 — Canvas API Color Extraction + Full ValueEditor

## Goal
Implement Canvas API color sampling from the original image. When a user clicks a null color value, they can pick the exact color by clicking on the image. Complete the ValueEditor component.

## Context
- SpecOverlay with click-to-edit stub exists from Day 3
- Canvas API must be used for color extraction (CLAUDE.md absolute rule: never AI estimation)
- For non-color fields: simple text input
- For color fields (backgroundColor, color, border): color picker using Canvas API sampling

## Files to Update

### frontend/src/lib/canvas.ts (replace stubs with real implementation)

```typescript
'use client'; // only used in browser

/**
 * Sample the exact pixel color from an image at given coordinates.
 * Used to fill null color values without AI estimation.
 */
export function sampleColorFromImage(
  imgElement: HTMLImageElement,
  clickX: number,
  clickY: number,
): string {
  // Get the ratio between displayed size and natural size
  const scaleX = imgElement.naturalWidth / imgElement.clientWidth;
  const scaleY = imgElement.naturalHeight / imgElement.clientHeight;

  const canvas = document.createElement('canvas');
  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '#000000';

  ctx.drawImage(imgElement, 0, 0);

  const pixelX = Math.round(clickX * scaleX);
  const pixelY = Math.round(clickY * scaleY);
  const pixel = ctx.getImageData(pixelX, pixelY, 1, 1).data;

  const r = pixel[0].toString(16).padStart(2, '0');
  const g = pixel[1].toString(16).padStart(2, '0');
  const b = pixel[2].toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Export a canvas element as a Blob for clipboard copy or download.
 */
export async function exportCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, 'image/png');
  });
}
```

### frontend/src/hooks/useCanvasColor.ts
```typescript
'use client';

import { useCallback, useRef, useState } from 'react';
import { sampleColorFromImage } from '@/lib/canvas';

interface UseCanvasColorReturn {
  isPickingColor: boolean;
  startColorPick: (onColorPicked: (color: string) => void) => void;
  handleImageClick: (e: React.MouseEvent<HTMLImageElement>) => void;
  imageRef: React.RefObject<HTMLImageElement>;
}

export function useCanvasColor(): UseCanvasColorReturn {
  const [isPickingColor, setIsPickingColor] = useState(false);
  const callbackRef = useRef<((color: string) => void) | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const startColorPick = useCallback((onColorPicked: (color: string) => void) => {
    setIsPickingColor(true);
    callbackRef.current = onColorPicked;
  }, []);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!isPickingColor || !callbackRef.current || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const color = sampleColorFromImage(imageRef.current, x, y);
    callbackRef.current(color);
    callbackRef.current = null;
    setIsPickingColor(false);
  }, [isPickingColor]);

  return { isPickingColor, startColorPick, handleImageClick, imageRef };
}
```

### Update frontend/src/components/editor/ValueEditor.tsx (full implementation)

Color fields: `backgroundColor`, `color`, `border`
Non-color fields: `fontSize`, `fontWeight`, `borderRadius`, `padding`, `margin`, `gap`

```tsx
'use client';

import { useState } from 'react';
import type { SpecElement } from '@/types/spec';

const COLOR_FIELDS = ['backgroundColor', 'color', 'border'];

interface Props {
  element: SpecElement;
  field: string;
  isPickingColor: boolean;
  onSave: (value: string) => void;
  onStartColorPick: (callback: (color: string) => void) => void;
  onClose: () => void;
}

export function ValueEditorPopover({
  element,
  field,
  isPickingColor,
  onSave,
  onStartColorPick,
  onClose,
}: Props) {
  const currentValue = (element.styles as Record<string, string | null>)[field];
  const [inputValue, setInputValue] = useState(currentValue ?? '');
  const isColorField = COLOR_FIELDS.includes(field);

  const handlePickColor = () => {
    onStartColorPick((color) => {
      setInputValue(color);
    });
  };

  return (
    <div className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20 w-64">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{element.id} › {field}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isColorField ? '#HEX' : 'e.g. 16px'}
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm font-mono"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(inputValue);
            if (e.key === 'Escape') onClose();
          }}
          autoFocus
        />

        {isColorField && (
          <button
            onClick={handlePickColor}
            title="Pick color from image"
            className={[
              'px-2 py-1 rounded text-xs border',
              isPickingColor
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400',
            ].join(' ')}
          >
            {isPickingColor ? '...' : '🎨'}
          </button>
        )}
      </div>

      {inputValue && isColorField && (
        <div
          className="mt-2 h-6 rounded border border-gray-200"
          style={{ backgroundColor: inputValue }}
        />
      )}

      <p className="text-xs text-gray-400 mt-2">Enter to save · Escape to cancel</p>

      <button
        onClick={() => onSave(inputValue)}
        className="mt-2 w-full py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  );
}
```

**Note:** The color preview div above uses inline `style` — this is an exception because the color is dynamic and cannot be expressed as a Tailwind class. This is acceptable only for dynamic values that cannot be hardcoded.

### Update SpecOverlay to use useCanvasColor hook
- Pass `imageRef` to the `<img>` element
- Handle image click for color picking via `handleImageClick`
- Show cursor crosshair when `isPickingColor` is true
- Pass `isPickingColor` and `onStartColorPick` to `ValueEditorPopover`

## Completion Criteria
- [ ] Clicking a null color field (red "?") opens the ValueEditor
- [ ] Clicking the 🎨 button enters color pick mode (cursor changes)
- [ ] Clicking anywhere on the original image samples the pixel color → fills the input
- [ ] Saving updates the spec state and re-renders the overlay
- [ ] Non-color fields show a simple text input
- [ ] `useCanvasColor` hook is in `src/hooks/` and exported

## Commit Message
```
feat: add Canvas API color extraction and full ValueEditor
```

## Forbidden
- No `any` type
- No `pages/` directory
- Canvas API only in browser-side code (hooks/lib, not server components)
