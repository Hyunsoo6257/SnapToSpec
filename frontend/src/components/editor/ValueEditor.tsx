'use client';

import type { SpecElement } from '@/types/spec';

interface Props {
  element: SpecElement;
  field: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

// TODO Day 4: Full implementation with color picker for color fields
export function ValueEditorPopover({ element, field, onSave, onClose }: Props) {
  const currentValue = (element.styles as unknown as Record<string, string | null>)[field];

  return (
    <div className="absolute top-0 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
      <p className="text-sm font-medium text-gray-700 mb-2">
        {element.id} › {field}
      </p>
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
