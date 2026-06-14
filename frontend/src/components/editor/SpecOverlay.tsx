'use client';

import { useRef, useState } from 'react';
import type { SpecElement, SpecResult, SpecStyles } from '@/types/spec';
import { useCanvasColor } from '@/hooks/useCanvasColor';

const KEY_STYLES: ReadonlyArray<keyof SpecStyles> = [
  'backgroundColor',
  'color',
  'fontSize',
  'fontWeight',
  'borderRadius',
  'padding',
  'margin',
  'border',
  'gap',
];

const COLOR_FIELDS = new Set(['backgroundColor', 'color', 'border']);

interface Props {
  imageUrl: string;
  spec: SpecResult;
  showContainers: boolean;
  onElementUpdate: (id: string, field: string, value: string) => void;
  onUndo: () => void;
  canUndo: boolean;
}

export function SpecOverlay({
  imageUrl,
  spec,
  showContainers,
  onElementUpdate,
  onUndo,
  canUndo,
}: Props) {
  const [selectedElement, setSelectedElement] = useState<SpecElement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPickingColor, startColorPick, handleImageClick, imageRef } = useCanvasColor();

  const visibleElements = showContainers
    ? spec.elements
    : spec.elements.filter((el) => el.type !== 'container');

  const nullCount = visibleElements.reduce((acc, el) => {
    return acc + KEY_STYLES.filter((f) => el.styles[f] === null).length;
  }, 0);

  return (
    <div className="flex gap-6 items-start">
      {/* Left: image + overlay */}
      <div>
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-2">
          {nullCount > 0 && (
            <span className="text-xs text-red-500 font-medium">
              {nullCount} null value{nullCount > 1 ? 's' : ''} — click elements to fill
            </span>
          )}
          {nullCount === 0 && (
            <span className="text-xs text-green-600 font-medium">All values filled</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              −
            </button>
            <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Image + SVG overlay */}
        <div
          ref={containerRef}
          className="relative overflow-auto border border-gray-200 rounded-lg"
          style={{ maxWidth: '900px', maxHeight: '70vh' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Screenshot"
            className={isPickingColor ? 'cursor-crosshair' : 'cursor-default'}
            style={{ display: 'block', width: `${imageSize.width * zoom}px`, height: 'auto' }}
            onClick={handleImageClick}
            onLoad={(e) =>
              setImageSize({
                width: e.currentTarget.naturalWidth,
                height: e.currentTarget.naturalHeight,
              })
            }
          />

          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: `${imageSize.width * zoom}px`, height: `${imageSize.height * zoom}px` }}
            viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
            preserveAspectRatio="none"
          >
            {visibleElements.map((element) => (
              <ElementBox
                key={element.id}
                element={element}
                isHovered={hoveredId === element.id}
                isSelected={selectedElement?.id === element.id}
                onMouseEnter={() => setHoveredId(element.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedElement(element)}
              />
            ))}
          </svg>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          Hover to preview · click element to select · {isPickingColor ? '🎨 click image to pick color' : ''}
        </p>
      </div>

      {/* Right: side panel */}
      <div className="w-72 shrink-0">
        {selectedElement ? (
          <SidePanel
            element={selectedElement}
            isPickingColor={isPickingColor}
            canUndo={canUndo}
            onStartColorPick={startColorPick}
            onSave={(field, value) => onElementUpdate(selectedElement.id, field, value)}
            onUndo={onUndo}
            onClose={() => setSelectedElement(null)}
          />
        ) : (
          <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
            Click an element on the image to view and edit its specs
          </div>
        )}
      </div>
    </div>
  );
}

function ElementBox({
  element,
  isHovered,
  isSelected,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  element: SpecElement;
  isHovered: boolean;
  isSelected: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const { x, y, width, height } = element.position;
  const active = isHovered || isSelected;

  return (
    <g
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ pointerEvents: 'all', cursor: 'pointer' }}
    >
      <rect
        x={x} y={y} width={width} height={height}
        fill={isSelected ? 'rgba(59,130,246,0.12)' : active ? 'rgba(59,130,246,0.06)' : 'transparent'}
        stroke={isSelected ? '#2563EB' : active ? '#3B82F6' : 'transparent'}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={isSelected ? 'none' : '4 2'}
      />
      {active && (
        <text x={x + 3} y={y - 4} fontSize={9} fill={isSelected ? '#2563EB' : '#3B82F6'} fontFamily="monospace">
          {element.id}
        </text>
      )}
    </g>
  );
}

function SidePanel({
  element,
  isPickingColor,
  canUndo,
  onStartColorPick,
  onSave,
  onUndo,
  onClose,
}: {
  element: SpecElement;
  isPickingColor: boolean;
  canUndo: boolean;
  onStartColorPick: (cb: (color: string) => void) => void;
  onSave: (field: string, value: string) => void;
  onUndo: () => void;
  onClose: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-800">{element.id}</p>
          <p className="text-xs text-gray-400">{element.type}{element.label ? ` · "${element.label}"` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {canUndo && (
            <button
              onClick={onUndo}
              title="Undo last edit"
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ↩
            </button>
          )}
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-sm">✕</button>
        </div>
      </div>

      <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
        {KEY_STYLES.map((field) => {
          const value = element.styles[field];
          const isNull = value === null;
          const isColor = COLOR_FIELDS.has(field);
          return (
            <FieldRow
              key={field}
              field={field}
              value={value}
              isNull={isNull}
              isColor={isColor}
              isPickingColor={isPickingColor}
              onSave={(v) => onSave(field, v)}
              onStartColorPick={onStartColorPick}
            />
          );
        })}
      </div>
    </div>
  );
}

function FieldRow({
  field,
  value,
  isNull,
  isColor,
  isPickingColor,
  onSave,
  onStartColorPick,
}: {
  field: string;
  value: string | null;
  isNull: boolean;
  isColor: boolean;
  isPickingColor: boolean;
  onSave: (value: string) => void;
  onStartColorPick: (cb: (color: string) => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const commit = () => {
    if (draft.trim()) onSave(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 py-1">
        <span className="text-xs text-gray-400 w-28 shrink-0">{field}</span>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          onBlur={commit}
          className="flex-1 text-xs border border-blue-400 rounded px-1.5 py-0.5 font-mono outline-none"
        />
        {isColor && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onStartColorPick((color) => {
                setDraft(color);
                onSave(color);
                setEditing(false);
              });
            }}
            title="Pick from image"
            className={`text-xs px-1.5 py-0.5 rounded border ${isPickingColor ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
          >
            🎨
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(value ?? ''); setEditing(true); }}
      className="w-full flex items-center gap-1 py-1 px-1 rounded hover:bg-gray-50 text-left group"
    >
      <span className="text-xs text-gray-400 w-28 shrink-0">{field}</span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {isColor && value && (
          <span
            className="w-3 h-3 rounded-sm border border-gray-200 shrink-0"
            style={{ backgroundColor: value }}
          />
        )}
        <span className={`text-xs font-mono truncate ${isNull ? 'text-red-400' : 'text-gray-700'}`}>
          {isNull ? 'null — click to fill' : value}
        </span>
      </div>
    </button>
  );
}
