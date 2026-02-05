import { useState, useEffect } from 'react';
import { usePersistence } from '@/hooks/use-persistence';
import { DesignConfig, StackConfig, DownloadedAssets, CustomAsset } from '@/types';
import { DESIGN_PRESETS } from '@/modules/design/data/design-presets';

export interface DesignState {
  designConfig: DesignConfig;
  setDesignConfig: (config: DesignConfig | ((prev: DesignConfig) => DesignConfig)) => void;
  stackConfig: StackConfig;
  setStackConfig: (config: StackConfig | ((prev: StackConfig) => StackConfig)) => void;
  downloadedAssets: DownloadedAssets | null;
  setDownloadedAssets: (assets: DownloadedAssets | null) => void;
  customAssets: CustomAsset[];
  setCustomAssets: (assets: CustomAsset[] | ((prev: CustomAsset[]) => CustomAsset[])) => void;
}

/**
 * Hook for managing design-related state (design config, stack config, assets)
 * Includes automatic persistence with 5s debounce
 */
export function useDesignState(sessionId: string | null): DesignState {
  const [designConfig, setDesignConfig] = useState<DesignConfig>({
    styleIds: [DESIGN_PRESETS[0].id],
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      background: '#ffffff',
      text: '#0f172a',
      accent: '#f59e0b',
    },
    theme: 'system',
    roundness: 'default',
    typography: 'modern',
    creativity: 'balanced',
    creativeFocus: [],
    customInstructions: '',
    aiGeneratedInstructions: '',
  });

  const [stackConfig, setStackConfig] = useState<StackConfig>({
    framework: 'nextjs',
    css: 'tailwind',
    uiLibrary: 'shadcn',
    cms: 'none',
    database: 'none',
    auth: 'none',
    deployment: 'vercel',
  });

  const [downloadedAssets, setDownloadedAssets] = useState<DownloadedAssets | null>(null);
  const [customAssets, setCustomAssets] = useState<CustomAsset[]>([]);

  const { saveDesign } = usePersistence();

  // Auto-save design config and stack config (5s debounce)
  useEffect(() => {
    if (!sessionId) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving design config...');
      await saveDesign(sessionId, { designConfig, stackConfig });
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [designConfig, stackConfig, sessionId, saveDesign]);

  return {
    designConfig,
    setDesignConfig,
    stackConfig,
    setStackConfig,
    downloadedAssets,
    setDownloadedAssets,
    customAssets,
    setCustomAssets,
  };
}
