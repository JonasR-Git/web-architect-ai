import { useMemo } from 'react';
import { SiteStructure } from '@/types';
import { normalizeStructureToConcepts, SemanticMergeMap } from '@/modules/core/utils/normalization';

/**
 * Hook for normalized and filtered structure
 * Combines normalization with exclude URL filtering
 * Prevents duplicate normalization calls in mappingSources and mappingTargets
 */
export function useNormalizedStructure(
  structure: SiteStructure | null,
  semanticMerges: SemanticMergeMap | undefined,
  excludedUrls: Set<string>
) {
  return useMemo(() => {
    if (!structure) return null;

    // Normalize structure
    const normalized = normalizeStructureToConcepts(structure, semanticMerges);

    // Filter out excluded URLs if needed
    if (excludedUrls.size === 0) return normalized;

    return {
      ...normalized,
      nodes: normalized.nodes.filter((n: any) => !excludedUrls.has(n.url)),
    };
  }, [structure, semanticMerges, excludedUrls]);
}
