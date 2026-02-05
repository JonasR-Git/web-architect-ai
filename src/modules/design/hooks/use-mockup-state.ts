import { useState } from 'react';

export interface MockupState {
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  setViewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
}

/**
 * Hook for managing mockup generation state
 */
export function useMockupState(): MockupState {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  return {
    isGenerating,
    setIsGenerating,
    error,
    setError,
    viewMode,
    setViewMode,
  };
}
