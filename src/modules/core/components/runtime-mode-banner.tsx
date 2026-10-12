'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function RuntimeModeBanner() {
  const [mode, setMode] = useState<'sample' | 'provider' | 'unknown' | 'unavailable'>('unknown');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/runtime-mode', { cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to read runtime mode');
        return response.json();
      })
      .then((data: { sampleMode: boolean }) => setMode(data.sampleMode ? 'sample' : 'provider'))
      .catch(() => {
        if (!controller.signal.aborted) setMode('unavailable');
      });
    return () => controller.abort();
  }, []);

  const message = mode === 'sample'
    ? 'Sample mode: built-in example responses. These outputs are illustrative.'
    : mode === 'provider'
      ? 'Provider mode: model outputs are drafts for your review.'
      : mode === 'unavailable'
        ? 'Runtime mode unavailable. Check your configuration before relying on outputs.'
        : 'Checking runtime mode. Review generated outputs before using them.';

  return (
    <div role="status" className="bg-slate-950 text-slate-200 border-b border-slate-700 px-6 py-2 text-sm">
      <div className="max-w-[1440px] mx-auto flex flex-wrap justify-between gap-x-5 gap-y-1">
        <span>{message}</span>
        <Link href="/demo" className="text-blue-300 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Project tour</Link>
      </div>
    </div>
  );
}
