'use client';

import { useCallback, useState } from 'react';
import { renderOverlayToCanvas, exportCanvasToBlob } from '@/lib/canvas';
import type { SpecResult } from '@/types/spec';

export function useSpecExport(
  imageUrl: string | null,
  spec: SpecResult | null,
) {
  const [isExporting, setIsExporting] = useState(false);

  const copyToClipboard = useCallback(async () => {
    if (!imageUrl || !spec) return;
    setIsExporting(true);
    try {
      const canvas = await renderOverlayToCanvas(imageUrl, spec);
      const blob = await exportCanvasToBlob(canvas);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      alert('Copied to clipboard! Paste into claude.ai');
    } catch {
      alert('Copy failed. Try download instead.');
    } finally {
      setIsExporting(false);
    }
  }, [imageUrl, spec]);

  const downloadImage = useCallback(async () => {
    if (!imageUrl || !spec) return;
    setIsExporting(true);
    try {
      const canvas = await renderOverlayToCanvas(imageUrl, spec);
      const blob = await exportCanvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snaptospec-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed.');
    } finally {
      setIsExporting(false);
    }
  }, [imageUrl, spec]);

  return { copyToClipboard, downloadImage, isExporting };
}
