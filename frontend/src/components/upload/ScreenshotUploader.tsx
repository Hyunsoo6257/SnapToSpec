'use client';

import { useState, useCallback } from 'react';
import { uploadScreenshot } from '@/lib/api';
import { resizeImageIfNeeded } from '@/lib/canvas';

interface Props {
  onUploadComplete: (imageUrl: string, file: File) => void;
}

export function ScreenshotUploader({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, etc.)');
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const resized = await resizeImageIfNeeded(file);
        const { imageUrl } = await uploadScreenshot(resized);
        onUploadComplete(imageUrl, resized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={[
        'border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-gray-400',
      ].join(' ')}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id="screenshot-input"
      />
      <label htmlFor="screenshot-input" className="cursor-pointer">
        {isUploading ? (
          <p className="text-gray-500">Uploading...</p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-700">
              Drop your screenshot here
            </p>
            <p className="text-sm text-gray-400 mt-2">
              or click to select a file
            </p>
          </>
        )}
      </label>
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
    </div>
  );
}
