# Catch-up 3 — SpecOverlay + ValueEditor + Canvas Export

## Goal
Complete Week 3 Day 3, Day 4, and Day 5 in a single session.
Build the full visual overlay pipeline: SVG spec overlay → click-to-edit values → Canvas color extraction → Copy/Download annotated PNG.

## Context
- Editor page exists with upload → spec extraction → raw JSON display
- Replace the raw JSON with a visual overlay (SVG over image)
- Add click-to-edit for spec values
- Canvas API for color sampling (CLAUDE.md absolute rule: never AI estimation)
- Copy/Download the annotated image as PNG

## Part 1 — SVG Spec Overlay (week3-day3)

### frontend/src/components/editor/SpecOverlay.tsx
```tsx
'use client';

import { useState } from 'react';
import type { SpecElement, SpecResult } from '@/types/spec';
import { ValueEditorPopover } from './ValueEditor';
import { useCanvasColor } from '@/hooks/useCanvasColor';

interface Props {
  imageUrl: string;
  spec: SpecResult;
  onElementUpdate: (id: string, field: string, value: string) => void;
}

export function SpecOverlay({ imageUrl, spec, onElementUpdate }: Props) {
  const [selectedElement, setSelectedElement] = useState<SpecElement | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const { isPickingColor, startColorPick, handleImageClick, imageRef } = useCanvasColor();

  return (
    <div className="relative inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Screenshot"
        className={`block max-w-full${isPickingColor ? ' cursor-crosshair' : ''}`}
        onLoad={(e) => setImageSize({
          width: e.currentTarget.naturalWidth,
          height: e.currentTarget.naturalHeight,
        })}
        onClick={handleImageClick}
      />

      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
        preserveAspectRatio="none"
      >
        {spec.elements.map((element) => (
          <ElementAnnotation
            key={element.id}
            element={element}
            imageSize={imageSize}
            onLabelClick={(field) => {
              setSelectedElement(element);
              setEditField(field);
            }}
          />
        ))}
      </svg>

      {selectedElement && editField && (
        <ValueEditorPopover
          element={selectedElement}
          field={editField}
          isPickingColor={isPickingColor}
          onSave={(value) => {
            onElementUpdate(selectedElement.id, editField, value);
            setSelectedElement(null);
            setEditField(null);
          }}
          onStartColorPick={startColorPick}
          onClose={() => {
            setSelectedElement(null);
            setEditField(null);
          }}
        />
      )}
    </div>
  );
}

const KEY_STYLES = ['backgroundColor', 'color', 'fontSize', 'padding', 'borderRadius'] as const;

function ElementAnnotation({
  element,
  onLabelClick,
  imageSize,
}: {
  element: SpecElement;
  onLabelClick: (field: string) => void;
  imageSize: { width: number; height: number };
}) {
  const { x, y, width, height } = element.position;
  const labelX = x + width + 8 + 120 > imageSize.width ? x - 130 : x + width + 8;

  return (
    <g style={{ pointerEvents: 'all' }}>
      <rect
        x={x} y={y} width={width} height={height}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2}
        strokeDasharray="4 2"
      />
      <text x={x + 2} y={y - 4} fontSize={10} fill="#3B82F6" fontFamily="monospace">
        {element.id}
      </text>
      {KEY_STYLES.map((field, i) => {
        const value = element.styles[field];
        const isNull = value === null;
        return (
          <text
            key={field}
            x={labelX}
            y={y + 14 + i * 14}
            fontSize={10}
            fill={isNull ? '#EF4444' : '#374151'}
            fontFamily="monospace"
            className="cursor-pointer"
            onClick={() => onLabelClick(field)}
          >
            {field}: {isNull ? '?' : value}
          </text>
        );
      })}
    </g>
  );
}
```

### frontend/src/components/editor/ValueEditor.tsx
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

  return (
    <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20 w-64">
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
            onClick={() => onStartColorPick((color) => setInputValue(color))}
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

## Part 2 — Canvas API Color Extraction (week3-day4)

### frontend/src/lib/canvas.ts (replace stubs with real implementation)
```typescript
import type { SpecResult } from '@/types/spec';

export function sampleColorFromImage(
  imgElement: HTMLImageElement,
  clickX: number,
  clickY: number,
): string {
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

export async function exportCanvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, 'image/png');
  });
}

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

      ctx.drawImage(img, 0, 0);

      const KEY_STYLES = ['backgroundColor', 'color', 'fontSize', 'padding', 'borderRadius'] as const;

      for (const element of spec.elements) {
        const { x, y, width, height } = element.position;

        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);

        ctx.fillStyle = '#3B82F6';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(element.id, x + 2, y - 5 < 0 ? y + 12 : y - 5);

        KEY_STYLES.forEach((field, i) => {
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

## Part 3 — Copy Image + Download + Export (week3-day5)

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
    } catch {
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
    } catch {
      alert('Download failed.');
    } finally {
      setIsExporting(false);
    }
  }, [imageUrl, spec]);

  return { copyToClipboard, downloadImage, isExporting };
}
```

### Update frontend/src/app/editor/page.tsx — full replacement
Replace the entire file with:
```tsx
'use client';

import { useState } from 'react';
import { ScreenshotUploader } from '@/components/upload/ScreenshotUploader';
import { SpecOverlay } from '@/components/editor/SpecOverlay';
import { extractSpec } from '@/lib/api';
import { useSpecExport } from '@/hooks/useSpecExport';
import type { SpecResult } from '@/types/spec';

export default function EditorPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [spec, setSpec] = useState<SpecResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copyToClipboard, downloadImage, isExporting } = useSpecExport(imageUrl, spec);

  const handleUploadComplete = async (url: string) => {
    setImageUrl(url);
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

  const handleElementUpdate = (id: string, field: string, value: string) => {
    setSpec((prev) =>
      prev
        ? {
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === id ? { ...el, styles: { ...el.styles, [field]: value } } : el,
            ),
          }
        : null,
    );
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
        <>
          <SpecOverlay
            imageUrl={imageUrl}
            spec={spec}
            onElementUpdate={handleElementUpdate}
          />
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
        </>
      )}
    </main>
  );
}
```

## Completion Criteria
- [ ] Upload a screenshot → see SVG overlay with bounding boxes on top of image
- [ ] Each element shows its ID label and key style values
- [ ] null values appear in red
- [ ] Clicking a style label opens ValueEditor popover
- [ ] Editing a value and pressing Enter updates the spec state and re-renders overlay
- [ ] Clicking 🎨 on a color field → cursor changes to crosshair → clicking image samples pixel color
- [ ] "Copy Image" → clipboard contains annotated PNG
- [ ] "Download PNG" → downloads annotated PNG file
- [ ] "Start Over" → clears state and shows upload zone
- [ ] No `any` type anywhere
- [ ] `npm run build` succeeds

## Commit Message
```
feat: add spec overlay, canvas color extraction, and copy/download export
```

## Forbidden
- No `any` type
- No `pages/` directory
- No inline styles (except dynamic color preview in ValueEditor — acceptable)
- Canvas API only in browser-side code (hooks/lib, not server components)
