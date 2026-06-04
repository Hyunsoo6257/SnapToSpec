'use client';

import { useState } from 'react';
import { ScreenshotUploader } from '@/components/upload/ScreenshotUploader';
import { SpecOverlay } from '@/components/editor/SpecOverlay';
import { extractSpec } from '@/lib/api';
import type { SpecResult } from '@/types/spec';

export default function EditorPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [, setImageFile] = useState<File | null>(null);
  const [spec, setSpec] = useState<SpecResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = async (url: string, file: File) => {
    setImageUrl(url);
    setImageFile(file);
    setIsExtracting(true);
    setError(null);

    try {
      const result = await extractSpec(url);
      setSpec(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Spec extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        SnapToSpec Editor
      </h1>

      {!imageUrl && (
        <ScreenshotUploader onUploadComplete={handleUploadComplete} />
      )}

      {isExtracting && (
        <div className="mt-8 text-center text-gray-500">
          Analyzing screenshot with Claude...
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {spec && imageUrl && (
        <div className="mt-8">
          <p className="text-green-600 font-medium mb-4">
            ✓ Extracted {spec.elements.length} elements
          </p>
          <SpecOverlay
            imageUrl={imageUrl}
            spec={spec}
            onElementUpdate={(id, field, value) => {
              setSpec((prev) =>
                prev
                  ? {
                      ...prev,
                      elements: prev.elements.map((el) =>
                        el.id === id
                          ? {
                              ...el,
                              styles: { ...el.styles, [field]: value },
                            }
                          : el,
                      ),
                    }
                  : null,
              );
            }}
          />
        </div>
      )}
    </main>
  );
}
