import { useCallback } from 'react';
import { ViewMode } from './use-ui-state';
import { useProjectConfig } from './use-project-config';
import { useUIState } from './use-ui-state';
import { useAnalysisState } from '@/modules/analysis/hooks/use-analysis-state';
import { useMigrationState } from '@/modules/analysis/hooks/use-migration-state';
import { useDesignState } from '@/modules/design/hooks/use-design-state';
import { useMockupState } from '@/modules/design/hooks/use-mockup-state';
import { useOutputState } from '@/modules/engineering/hooks/use-output-state';

export interface SavedSession {
  url: string;
  currentView: string;
  structure: any;
  critique: any;
  migrationPlan: any;
  userInstructions?: string;
  stackConfig: any;
  designConfig: any;
  downloadedAssets: any;
  componentSpec: any;
  pageSpecs?: any;
  finalOutput: any;
  customAssets?: any[];
  blueprintTab?: string;
  mockupViewMode?: string;
  excludedUrls?: string[];
  clusterOverrides?: any;
  optimizedContent?: any;
}

/**
 * Hook for loading session data and hydrating all state hooks
 * Centralizes session loading logic that was previously inline
 */
export function useSessionLoader(currentSessionId: string | null) {
  const { setUrl } = useProjectConfig();
  const { setView, setBlueprintTab } = useUIState(currentSessionId);
  const {
    setStructure,
    setCritique,
    setExcludedUrls,
    setClusterOverrides,
  } = useAnalysisState(currentSessionId);
  const {
    setMigrationPlan,
    setPageSpecs,
    setComponentSpec,
  } = useMigrationState(currentSessionId);
  const {
    setStackConfig,
    setDesignConfig,
    setDownloadedAssets,
    setCustomAssets,
  } = useDesignState(currentSessionId);
  const { setViewMode: setMockupViewMode } = useMockupState();
  const {
    setFinalOutput,
    setOptimizedContent,
  } = useOutputState(currentSessionId);

  const { setUserInstructions } = useProjectConfig();

  const loadSessionData = useCallback(async (data: SavedSession) => {
    // Hydrate State
    setUrl(data.url);
    const view = data.currentView === 'config' ? 'mockup_view' : data.currentView as ViewMode;
    setView(view);
    setStructure(data.structure);
    setCritique(data.critique);
    // Note: logs and tokenStats are managed by useLogging hook and will start fresh
    setMigrationPlan(data.migrationPlan);
    setUserInstructions(data.userInstructions || '');
    setStackConfig(data.stackConfig);
    setDesignConfig(data.designConfig);
    setDownloadedAssets(data.downloadedAssets);
    setComponentSpec(data.componentSpec);
    setPageSpecs((data as any).pageSpecs || null);
    setFinalOutput(data.finalOutput);
    setCustomAssets((data as any).customAssets || []);
    setBlueprintTab((data.blueprintTab as any) || 'overview');
    setMockupViewMode((data.mockupViewMode as any) || 'desktop');
    setExcludedUrls(new Set(data.excludedUrls || []));
    if (data.clusterOverrides) {
      setClusterOverrides(data.clusterOverrides);
    } else {
      // Backwards compatibility or default
      setClusterOverrides({ forceArchetypes: [], ignorePatterns: [] });
    }

    if (data.optimizedContent) {
      setOptimizedContent(new Map(data.optimizedContent));
    }
  }, [
    setUrl,
    setView,
    setStructure,
    setCritique,
    setMigrationPlan,
    setUserInstructions,
    setStackConfig,
    setDesignConfig,
    setDownloadedAssets,
    setComponentSpec,
    setPageSpecs,
    setFinalOutput,
    setCustomAssets,
    setBlueprintTab,
    setMockupViewMode,
    setExcludedUrls,
    setClusterOverrides,
    setOptimizedContent,
  ]);

  return { loadSessionData };
}
