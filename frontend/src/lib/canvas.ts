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
