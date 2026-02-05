import { useState, useEffect } from 'react';
import { usePersistence } from '@/hooks/use-persistence';
import {
  SiteStructure,
  ClusterOverrides,
  CritiqueResult,
} from '@/types';
import { SemanticMergeMap } from '@/modules/core/utils/normalization';

export interface AnalysisState {
  structure: SiteStructure | null;
  setStructure: (structure: SiteStructure | null | ((prev: SiteStructure | null) => SiteStructure | null)) => void;
  semanticMerges: SemanticMergeMap | undefined;
  setSemanticMerges: (merges: SemanticMergeMap | undefined | ((prev: SemanticMergeMap | undefined) => SemanticMergeMap | undefined)) => void;
  excludedUrls: Set<string>;
  setExcludedUrls: (urls: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  clusterOverrides: ClusterOverrides;
  setClusterOverrides: (overrides: ClusterOverrides | ((prev: ClusterOverrides) => ClusterOverrides)) => void;
  critique: CritiqueResult | null;
  setCritique: (critique: CritiqueResult | null | ((prev: CritiqueResult | null) => CritiqueResult | null)) => void;
}

/**
 * Hook for managing analysis-related state (site structure, crawl data, critique)
 * Includes automatic persistence with 5s debounce for structure
 */
export function useAnalysisState(sessionId: string | null): AnalysisState {
  const [structure, setStructure] = useState<SiteStructure | null>(null);
  const [semanticMerges, setSemanticMerges] = useState<SemanticMergeMap | undefined>(undefined);
  const [excludedUrls, setExcludedUrls] = useState<Set<string>>(new Set());
  const [clusterOverrides, setClusterOverrides] = useState<ClusterOverrides>({
    forceArchetypes: [],
    ignorePatterns: [],
  });
  const [critique, setCritique] = useState<CritiqueResult | null>(null);

  const { saveStructure } = usePersistence();

  // Auto-save structure (5s debounce)
  useEffect(() => {
    if (!structure || !sessionId) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving structure...');
      await saveStructure(sessionId, structure);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [structure, sessionId, saveStructure]);

  return {
    structure,
    setStructure,
    semanticMerges,
    setSemanticMerges,
    excludedUrls,
    setExcludedUrls,
    clusterOverrides,
    setClusterOverrides,
    critique,
    setCritique,
  };
}
