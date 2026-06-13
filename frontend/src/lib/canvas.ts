'use client'; // only used in browser

import type { SpecResult } from '@/types/spec';

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
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

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
        const keyStyles = [
          'backgroundColor',
          'color',
          'fontSize',
          'padding',
          'borderRadius',
        ] as const;
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

/**
 * Export a canvas element as a Blob for clipboard copy or download.
 */
export async function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas export failed'));
    }, 'image/png');
  });
}
