'use client';

import { useEffect, useState } from 'react';
import { ScreenshotUploader } from '@/components/upload/ScreenshotUploader';
import { SpecOverlay } from '@/components/editor/SpecOverlay';
import { extractSpec } from '@/lib/api';
import { useSpecExport } from '@/hooks/useSpecExport';
import type { SpecResult } from '@/types/spec';

const STORAGE_KEY = 'snaptospec_session';

interface SavedSession {
  imageUrl: string;
  spec: SpecResult;
}

export default function EditorPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [spec, setSpec] = useState<SpecResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const { copyToClipboard, downloadImage, isExporting } = useSpecExport(imageUrl, spec);

  // Restore session from localStorage on mount
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

  const runExtraction = async (url: string) => {
    setPendingUrl(url);
    setIsExtracting(true);
    setError(null);
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

  const handleStartOver = () => {
    setImageUrl(null);
    setSpec(null);
    setError(null);
    setPendingUrl(null);
    localStorage.removeItem(STORAGE_KEY);
  };

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
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            )}
            <button
              onClick={handleStartOver}
              className="px-4 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-100"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {spec && imageUrl && (
        <div className="mt-8">
          <p className="text-green-600 font-medium mb-4">
            ✓ Extracted {spec.elements.length} elements — hover over elements to see specs
          </p>
          <SpecOverlay
            imageUrl={imageUrl}
            spec={spec}
            onElementUpdate={handleElementUpdate}
          />

          <div className="mt-6 flex gap-4">
            <button
              onClick={copyToClipboard}
              disabled={isExporting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isExporting ? 'Processing...' : 'Copy Image'}
            </button>
            <button
              onClick={downloadImage}
              disabled={isExporting}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              Download PNG
            </button>
            <button
              onClick={handleStartOver}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
