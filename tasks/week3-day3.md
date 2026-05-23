# Week 3 Day 3 — Canvas/SVG Spec Overlay

## Goal
Build the SpecOverlay component that renders the original screenshot with spec annotations on top using Canvas/SVG. Shows bounding boxes, element IDs, CSS values, and highlights null values in red.

## Context
- Editor page from Day 2 has the spec JSON and imageUrl in state
- Today: replace the raw JSON pre-block with a visual overlay
- Render with SVG over an img tag (simpler than Canvas for this annotation use case)
- Clicking a value label opens ValueEditor popover (stub today, full in Day 4)

## Files to Create

### frontend/src/components/editor/SpecOverlay.tsx
```tsx
'use client';

import { useState } from 'react';
import type { SpecElement, SpecResult } from '@/types/spec';

interface Props {
  imageUrl: string;
  spec: SpecResult;
  onElementUpdate: (id: string, field: string, value: string) => void;
}

export function SpecOverlay({ imageUrl, spec, onElementUpdate }: Props) {
  const [selectedElement, setSelectedElement] = useState<SpecElement | null>(null);
  const [editField, setEditField] = useState<string | null>(null);

  return (
    <div className="relative inline-block">
      {/* Original screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="Screenshot" className="block max-w-full" />

      {/* SVG overlay — same dimensions as image */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${getImageNaturalWidth(imageUrl)} ${getImageNaturalHeight(imageUrl)}`}
        preserveAspectRatio="none"
      >
        {spec.elements.map((element) => (
          <ElementAnnotation
            key={element.id}
            element={element}
            onLabelClick={(field) => {
              setSelectedElement(element);
              setEditField(field);
            }}
          />
        ))}
      </svg>

      {/* Value editor popover — stub */}
      {selectedElement && editField && (
        <ValueEditorPopover
          element={selectedElement}
          field={editField}
          onSave={(value) => {
            onElementUpdate(selectedElement.id, editField, value);
            setSelectedElement(null);
            setEditField(null);
          }}
          onClose={() => {
            setSelectedElement(null);
            setEditField(null);
          }}
        />
      )}
    </div>
  );
}
```

### SVG annotation per element

Each element should show:
1. **Bounding box**: `<rect>` with blue stroke, no fill (or very light fill)
2. **Element ID label**: small text in top-left corner of bounding box
3. **CSS value labels**: show key style values as small text callouts near the element
   - Non-null values: dark gray text
   - null values: red text with "?" indicator
4. Layout: render style labels to the right or below the bounding box

Key styles to display: `backgroundColor`, `color`, `fontSize`, `padding`, `borderRadius`

```tsx
function ElementAnnotation({ element, onLabelClick }: { element: SpecElement; onLabelClick: (field: string) => void }) {
  const { x, y, width, height } = element.position;

  const keyStyles = ['backgroundColor', 'color', 'fontSize', 'padding', 'borderRadius'] as const;

  return (
    <g>
      {/* Bounding box */}
      <rect
        x={x} y={y} width={width} height={height}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2}
        strokeDasharray="4 2"
      />

      {/* Element ID */}
      <text x={x + 2} y={y - 4} fontSize={10} fill="#3B82F6" fontFamily="monospace">
        {element.id}
      </text>

      {/* Style value labels */}
      {keyStyles.map((field, i) => {
        const value = element.styles[field];
        const isNull = value === null;
        return (
          <text
            key={field}
            x={x + width + 8}
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

### frontend/src/components/editor/ValueEditor.tsx (stub for Day 4)
```tsx
'use client';

interface Props {
  element: SpecElement;
  field: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

// TODO Day 4: Full implementation with color picker for color fields
export function ValueEditorPopover({ element, field, onSave, onClose }: Props) {
  const currentValue = (element.styles as Record<string, string | null>)[field];

  return (
    <div className="absolute top-0 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
      <p className="text-sm font-medium text-gray-700 mb-2">{element.id} › {field}</p>
      <input
        type="text"
        defaultValue={currentValue ?? ''}
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(e.currentTarget.value);
          if (e.key === 'Escape') onClose();
        }}
        autoFocus
      />
      <p className="text-xs text-gray-400 mt-1">Enter to save, Escape to cancel</p>
    </div>
  );
}
```

### Helper: get image dimensions
For the SVG viewBox to match image dimensions, we need to know the image's natural dimensions. Use an `onLoad` event on the img element:
```tsx
// In SpecOverlay: track imageSize state
const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
// <img onLoad={(e) => setImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })} />
```

### Update editor/page.tsx
Replace the raw JSON pre-block with `<SpecOverlay>`:
```tsx
{spec && imageUrl && (
  <SpecOverlay
    imageUrl={imageUrl}
    spec={spec}
    onElementUpdate={(id, field, value) => {
      setSpec(prev => prev ? {
        ...prev,
        elements: prev.elements.map(el =>
          el.id === id
            ? { ...el, styles: { ...el.styles, [field]: value } }
            : el
        ),
      } : null);
    }}
  />
)}
```

## Completion Criteria
- [ ] Upload a screenshot → see the overlay with bounding boxes on top of the image
- [ ] Each element shows its ID label and key style values
- [ ] null values appear in red
- [ ] Clicking a style label opens a text input popover
- [ ] Editing a value and pressing Enter updates the spec state
- [ ] No inline styles (Tailwind only)

## Commit Message
```
feat: add SVG spec overlay with annotations and click-to-edit stub
```

## Forbidden
- No inline styles
- No `any` type
- No `pages/` directory
