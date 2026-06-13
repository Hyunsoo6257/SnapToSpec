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
  const currentValue = (
    element.styles as unknown as Record<string, string | null>
  )[field];
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
        <p className="text-sm font-medium text-gray-700">
          {element.id} › {field}
        </p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xs"
        >
          ✕
        </button>
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

      <p className="text-xs text-gray-400 mt-2">
        Enter to save · Escape to cancel
      </p>

      <button
        onClick={() => onSave(inputValue)}
        className="mt-2 w-full py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  );
}
