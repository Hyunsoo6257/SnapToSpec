// Server component — no 'use client'
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">SnapToSpec</h1>
      <p className="text-gray-500 mb-8">Convert screenshots to UI specs</p>
      <Link
        href="/editor"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
      >
        Get Started
      </Link>
    </main>
  );
}
