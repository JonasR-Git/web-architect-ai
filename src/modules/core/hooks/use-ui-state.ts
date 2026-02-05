import { useState, useEffect } from 'react';
import { usePersistence } from '@/hooks/use-persistence';

export type ViewMode =
  | 'home'
  | 'crawl_result'
  | 'ai_analysis'
  | 'ai_result'
  | 'content_review'
  | 'design_studio'
  | 'mockup_view'
  | 'final_plan';

export type BlueprintTab = 'overview' | 'mapping' | 'components';

export interface UIState {
  view: ViewMode;
  setView: (view: ViewMode) => void;
  blueprintTab: BlueprintTab;
  setBlueprintTab: (tab: BlueprintTab) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  currentStep: string;
  setCurrentStep: (step: string) => void;
  pagesCompleted: number;
  setPagesCompleted: (count: number) => void;
  totalPages: number;
  setTotalPages: (count: number) => void;
}

/**
 * Hook for managing UI state (view mode, processing state, progress tracking)
 * Includes automatic persistence with 8s debounce
 */
export function useUIState(sessionId: string | null): UIState {
  const [view, setView] = useState<ViewMode>('home');
  const [blueprintTab, setBlueprintTab] = useState<BlueprintTab>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [pagesCompleted, setPagesCompleted] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const { saveState } = usePersistence();

  // Auto-save UI state (8s debounce for UI changes)
  useEffect(() => {
    if (!sessionId || isProcessing) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving UI state...');
      await saveState(sessionId, {
        currentView: view,
        blueprintTab,
      });
    }, 8000);

    return () => clearTimeout(timeoutId);
  }, [view, blueprintTab, sessionId, isProcessing, saveState]);

  return {
    view,
    setView,
    blueprintTab,
    setBlueprintTab,
    isProcessing,
    setIsProcessing,
    currentStep,
    setCurrentStep,
    pagesCompleted,
    setPagesCompleted,
    totalPages,
    setTotalPages,
  };
}
