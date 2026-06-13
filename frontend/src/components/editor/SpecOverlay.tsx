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
  const [selectedElement, setSelectedElement] = useState<SpecElement | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const { isPickingColor, startColorPick, handleImageClick, imageRef } = useCanvasColor();

  return (
    <div className="relative inline-block">
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
            isHovered={hoveredId === element.id}
            onMouseEnter={() => setHoveredId(element.id)}
            onMouseLeave={() => setHoveredId(null)}
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
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  element: SpecElement;
  onLabelClick: (field: string) => void;
  imageSize: { width: number; height: number };
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { x, y, width, height } = element.position;
  const labelX = x + width + 8 + 120 > imageSize.width ? x - 130 : x + width + 8;

  return (
    <g
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* Bounding box — always visible, brightens on hover */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isHovered ? 'rgba(59,130,246,0.08)' : 'none'}
        stroke="#3B82F6"
        strokeWidth={isHovered ? 2 : 1}
        strokeDasharray="4 2"
        strokeOpacity={isHovered ? 1 : 0.4}
      />

      {/* Labels — only visible on hover */}
      {isHovered && (
        <>
          {/* Element ID */}
          <text
            x={x + 2}
            y={y - 4}
            fontSize={10}
            fill="#3B82F6"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {element.id}
          </text>

          {/* Label background for readability */}
          <rect
            x={labelX - 2}
            y={y + 2}
            width={128}
            height={KEY_STYLES.length * 14 + 4}
            fill="rgba(255,255,255,0.9)"
            rx={3}
          />

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
                onClick={() => onLabelClick(field)}
              >
                {field}: {isNull ? '?' : value}
              </text>
            );
          })}
        </>
      )}
    </g>
  );
}
