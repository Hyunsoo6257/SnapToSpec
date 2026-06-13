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

  const startColorPick = useCallback(
    (onColorPicked: (color: string) => void) => {
      setIsPickingColor(true);
      callbackRef.current = onColorPicked;
    },
    [],
  );

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!isPickingColor || !callbackRef.current || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const color = sampleColorFromImage(imageRef.current, x, y);
      callbackRef.current(color);
      callbackRef.current = null;
      setIsPickingColor(false);
    },
    [isPickingColor],
  );

  return { isPickingColor, startColorPick, handleImageClick, imageRef };
}
