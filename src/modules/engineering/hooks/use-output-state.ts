import { useState, useEffect } from 'react';
import { usePersistence } from '@/hooks/use-persistence';
import { FinalOutput, Progress } from '@/types';
import { OptimizedPageData } from '@/lib/zip';

export interface OutputState {
  finalOutput: FinalOutput | null;
  setFinalOutput: (output: FinalOutput | null | ((prev: FinalOutput | null) => FinalOutput | null)) => void;
  optimizedContent: Map<string, OptimizedPageData>;
  setOptimizedContent: (content: Map<string, OptimizedPageData> | ((prev: Map<string, OptimizedPageData>) => Map<string, OptimizedPageData>)) => void;
  contentOptProgress: Progress | null;
  setContentOptProgress: (progress: Progress | null | ((prev: Progress | null) => Progress | null)) => void;
}

/**
 * Hook for managing engineering output state (final output, optimized content)
 * Includes automatic persistence with 5s debounce
 */
export function useOutputState(sessionId: string | null): OutputState {
  const [finalOutput, setFinalOutput] = useState<FinalOutput | null>(null);
  const [optimizedContent, setOptimizedContent] = useState<Map<string, OptimizedPageData>>(
    new Map()
  );
  const [contentOptProgress, setContentOptProgress] = useState<Progress | null>(null);

  const { saveSpecs } = usePersistence();

  // Auto-save final output (5s debounce)
  useEffect(() => {
    if (!finalOutput || !sessionId) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving final output...');
      await saveSpecs(sessionId, { finalOutput });
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [finalOutput, sessionId, saveSpecs]);

  return {
    finalOutput,
    setFinalOutput,
    optimizedContent,
    setOptimizedContent,
    contentOptProgress,
    setContentOptProgress,
  };
}
