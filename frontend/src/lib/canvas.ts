// Stub implementations — filled in on Day 4 and Day 5

export function sampleColorFromImage(
  _imageElement: HTMLImageElement,
  _x: number,
  _y: number,
): string {
  // TODO Day 4: Canvas API color sampling
  return '#000000';
}

export async function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  // TODO Day 5: Canvas.toBlob for clipboard/download
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), 'image/png'),
  );
}
