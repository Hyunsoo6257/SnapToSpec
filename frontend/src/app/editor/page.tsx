'use client';

import { useEffect, useRef, useState } from 'react';
import { ScreenshotUploader } from '@/components/upload/ScreenshotUploader';
import { SpecOverlay } from '@/components/editor/SpecOverlay';
import { extractSpec } from '@/lib/api';
import { useSpecExport } from '@/hooks/useSpecExport';
import { renderOverlayToCanvas, exportCanvasToBlob } from '@/lib/canvas';
import type { SpecElement, SpecResult, SpecStyles } from '@/types/spec';

const STORAGE_KEY = 'snaptospec_session';

const ALL_STYLES: ReadonlyArray<keyof SpecStyles> = [
  'backgroundColor', 'color', 'fontSize', 'fontWeight',
  'borderRadius', 'padding', 'margin', 'border', 'gap',
];

interface SavedSession {
  imageUrl: string;
  spec: SpecResult;
}

interface HistoryEntry {
  elementId: string;
  field: string;
  previousValue: string | null;
}

export default function EditorPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [spec, setSpec] = useState<SpecResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [showContainers, setShowContainers] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copyPromptDone, setCopyPromptDone] = useState(false);
  const { copyToClipboard, downloadImage, isExporting } = useSpecExport(imageUrl, spec);
  const copyPromptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session: SavedSession = JSON.parse(saved);
        setImageUrl(session.imageUrl);
        setSpec(session.spec);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    return () => { if (copyPromptTimer.current) clearTimeout(copyPromptTimer.current); };
  }, []);

  const runExtraction = async (url: string) => {
    setPendingUrl(url);
    setIsExtracting(true);
    setError(null);
    setHistory([]);
    try {
      const result = await extractSpec(url);
      setSpec(result);
      setImageUrl(url);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ imageUrl: url, spec: result }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Spec extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUploadComplete = async (url: string) => {
    await runExtraction(url);
  };

  const handleRetry = () => {
    if (pendingUrl) runExtraction(pendingUrl);
  };

  const handleElementUpdate = (id: string, field: string, value: string) => {
    setSpec((prev) => {
      if (!prev) return null;
      const element = prev.elements.find((el) => el.id === id);
      const previousValue = element ? (element.styles as unknown as Record<string, string | null>)[field] : null;
      setHistory((h) => [...h, { elementId: id, field, previousValue }]);
      const updated = {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, styles: { ...el.styles, [field]: value } } : el,
        ),
      };
      if (imageUrl) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ imageUrl, spec: updated }));
      }
      return updated;
    });
  };

  const handleUndo = () => {
    const last = history[history.length - 1];
    if (!last) return;
    setSpec((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === last.elementId
            ? { ...el, styles: { ...el.styles, [last.field]: last.previousValue } }
            : el,
        ),
      };
      if (imageUrl) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ imageUrl, spec: updated }));
      }
      return updated;
    });
    setHistory((h) => h.slice(0, -1));
  };

  const handleCopyPrompt = async () => {
    if (!spec || !imageUrl) return;
    const lines = spec.elements
      .filter((el) => el.type !== 'container')
      .map((el) => {
        const styles = ALL_STYLES
          .map((f) => `${f}: ${el.styles[f] ?? 'null'}`)
          .join(', ');
        return `${el.id} (${el.type}): ${styles}`;
      });
    const text = `UI Spec:\n\n${lines.join('\n')}`;

    try {
      const canvas = await renderOverlayToCanvas(imageUrl, spec);
      const blob = await exportCanvasToBlob(canvas);
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'image/png': blob,
        }),
      ]);
    } catch {
      // Fallback: copy text only
      await navigator.clipboard.writeText(text);
    }

    setCopyPromptDone(true);
    copyPromptTimer.current = setTimeout(() => setCopyPromptDone(false), 2000);
  };

  const handleStartOver = () => {
    setImageUrl(null);
    setSpec(null);
    setError(null);
    setPendingUrl(null);
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const visibleElements = spec
    ? showContainers ? spec.elements : spec.elements.filter((el) => el.type !== 'container')
    : [];

  const nullCount = visibleElements.reduce((acc, el) => {
    return acc + ALL_STYLES.filter((f) => el.styles[f] === null).length;
  }, 0);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">SnapToSpec Editor</h1>

      {!imageUrl && !isExtracting && (
        <ScreenshotUploader onUploadComplete={handleUploadComplete} />
      )}

      {isExtracting && (
        <div className="mt-8 text-center text-gray-500">
          Analyzing screenshot with Claude...
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium mb-3">{error}</p>
          <div className="flex gap-3">
            {pendingUrl && (
              <button onClick={handleRetry} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                Retry
              </button>
            )}
            <button onClick={handleStartOver} className="px-4 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-100">
              Start Over
            </button>
          </div>
        </div>
      )}

      {spec && imageUrl && (
        <div className="mt-6">
          {/* Top bar */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <span className="text-sm text-gray-600">
              {visibleElements.length} elements
              {nullCount > 0 && <span className="text-red-500 ml-2">· {nullCount} null</span>}
            </span>

            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showContainers}
                onChange={(e) => setShowContainers(e.target.checked)}
                className="rounded"
              />
              Show containers
            </label>

            <div className="ml-auto flex gap-2 flex-wrap">
              <button
                onClick={handleCopyPrompt}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                {copyPromptDone ? '✓ Copied!' : 'Copy Prompt'}
              </button>
              <button
                onClick={copyToClipboard}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? 'Processing...' : 'Copy Image'}
              </button>
              <button
                onClick={downloadImage}
                disabled={isExporting}
                className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                Download PNG
              </button>
              <button
                onClick={handleStartOver}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Start Over
              </button>
            </div>
          </div>

          <SpecOverlay
            imageUrl={imageUrl}
            spec={spec}
            showContainers={showContainers}
            onElementUpdate={handleElementUpdate}
            onUndo={handleUndo}
            canUndo={history.length > 0}
          />
        </div>
      )}
    </main>
  );
}
