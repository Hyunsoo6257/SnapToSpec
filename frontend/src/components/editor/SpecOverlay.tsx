'use client';

import { useState } from 'react';
import type { SpecElement, SpecResult, SpecStyles } from '@/types/spec';
import { useCanvasColor } from '@/hooks/useCanvasColor';
import { ValueEditorPopover } from './ValueEditor';

interface Props {
  imageUrl: string;
  spec: SpecResult;
  onElementUpdate: (id: string, field: string, value: string) => void;
}

const KEY_STYLES: ReadonlyArray<keyof SpecStyles> = [
  'backgroundColor',
  'color',
  'fontSize',
  'padding',
  'borderRadius',
];

export function SpecOverlay({ imageUrl, spec, onElementUpdate }: Props) {
  const [selectedElement, setSelectedElement] = useState<SpecElement | null>(
    null,
  );
  const [editField, setEditField] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const { isPickingColor, startColorPick, handleImageClick, imageRef } =
    useCanvasColor();

  return (
    <div className="relative inline-block">
      {/* Original screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Screenshot"
        className={`block max-w-full ${isPickingColor ? 'cursor-crosshair' : ''}`}
        onClick={handleImageClick}
        onLoad={(e) =>
          setImageSize({
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight,
          })
        }
      />

      {/* SVG overlay — same dimensions as image */}
      <svg
        className="absolute inset-0 w-full h-full"
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

      {/* Value editor popover */}
      {selectedElement && editField && (
        <ValueEditorPopover
          element={selectedElement}
          field={editField}
          isPickingColor={isPickingColor}
          onStartColorPick={startColorPick}
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

  // Render labels to the right if space allows, otherwise to the left
  const labelX =
    x + width + 8 + 120 > imageSize.width ? x - 130 : x + width + 8;

  return (
    <g>
      {/* Bounding box */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="#3B82F6"
        strokeWidth={2}
        strokeDasharray="4 2"
      />

      {/* Element ID */}
      <text
        x={x + 2}
        y={y - 4}
        fontSize={10}
        fill="#3B82F6"
        fontFamily="monospace"
      >
        {element.id}
      </text>

      {/* Style value labels */}
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
