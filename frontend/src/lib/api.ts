import type { SpecResult } from '@/types/spec';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export async function uploadScreenshot(
  file: File,
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/file/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message ?? 'Upload failed');
  }

  return res.json();
}

export async function extractSpec(imageUrl: string): Promise<SpecResult> {
  const res = await fetch(`${API_BASE}/spec/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: 'Extraction failed' }));
    throw new Error(error.message ?? 'Extraction failed');
  }

  return res.json();
}
