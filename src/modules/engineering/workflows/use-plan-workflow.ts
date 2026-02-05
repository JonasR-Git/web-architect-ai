import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  SiteStructure,
  StackConfig,
  DesignConfig,
  ComponentSpecification,
  MigrationPlan,
  TargetSlot,
  FinalOutput,
} from '@/types';
import {
  generateComponentLibraryAction,
  downloadImagesAction,
  generateImplementationPlanAction,
} from '@/app/actions';
import { SemanticMergeMap } from '@/modules/core/utils/normalization';

export interface PlanWorkflowDependencies {
  structure: SiteStructure | null;
  migrationPlan: MigrationPlan | null;
  componentSpec: ComponentSpecification | null;
  critique: any;
  userInstructions: string;
  semanticMerges: SemanticMergeMap | undefined;
  setComponentSpec: (spec: ComponentSpecification | null) => void;
  setDesignConfig: (config: DesignConfig | ((prev: DesignConfig) => DesignConfig)) => void;
  setDownloadedAssets: (assets: any) => void;
  setFinalOutput: (output: FinalOutput | null) => void;
  setView: (view: any) => void;
  setIsProcessing: (processing: boolean) => void;
  setCurrentStep: (step: string) => void;
  addLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error', meta?: any) => void;
}

export interface PlanWorkflowState {
  generatePlan: (
    config: StackConfig,
    designOverride?: DesignConfig,
    specsOverride?: TargetSlot[]
  ) => Promise<void>;
}

/**
 * Hook for orchestrating final implementation plan generation
 * Handles component spec generation, asset downloads, and plan creation
 */
export function usePlanWorkflow(deps: PlanWorkflowDependencies): PlanWorkflowState {
  const {
    structure,
    migrationPlan,
    componentSpec,
    critique,
    userInstructions,
    semanticMerges,
    setComponentSpec,
    setDesignConfig,
    setDownloadedAssets,
    setFinalOutput,
    setView,
    setIsProcessing,
    setCurrentStep,
    addLog,
  } = deps;

  const generatePlan = useCallback(
    async (
      config: StackConfig,
      designOverride?: DesignConfig,
      specsOverride?: TargetSlot[]
    ) => {
      setIsProcessing(true);
      setCurrentStep('Refining Implementation Strategy...');
      addLog(`USER: Configuring ${config.framework.toUpperCase()} stack...`);

      try {
        // Reuse existing component spec if available, otherwise generate
        let currentSpec = componentSpec;
        if (!currentSpec) {
          addLog('GEMINI: Extracting Component Pattern Library...');
          const compRes = await generateComponentLibraryAction(
            migrationPlan,
            structure,
            userInstructions,
            config,
            critique,
            {},
            semanticMerges
          );
          if (!compRes.success)
            addLog(
              `AI WARNING: Component extraction failed (${compRes.error}). Using fallback data.`,
              'warning'
            );
          currentSpec = compRes.data;
          setComponentSpec(currentSpec);

          // Auto-detect style from AI analysis
          if (currentSpec?.design_system?.detected_style_preset) {
            const detectedStyle = currentSpec.design_system.detected_style_preset;
            const validStyles = [
              'modern',
              'minimalist',
              'glassmorphism',
              'brutalist',
              'luxury',
              'playful',
              'cyberpunk',
              'nature',
              'corporate',
              'retro',
            ];
            if (validStyles.includes(detectedStyle)) {
              setDesignConfig((prev) => ({
                ...prev,
                styleIds: [detectedStyle as any],
              }));
              addLog(
                `AI: Auto-detected style "${detectedStyle}" based on site analysis.`,
                'success'
              );
            }
          }

          // Auto-detect roundness
          if (currentSpec?.design_system?.roundness) {
            const r = currentSpec.design_system.roundness;
            if (['sharp', 'default', 'full'].includes(r)) {
              setDesignConfig((prev) => ({
                ...prev,
                roundness: r as any,
              }));
            }
          }
        }

        // Download Images
        let assetMap: Record<string, string> | undefined = undefined;

        const imageUrls =
          structure?.nodes.flatMap((n) => n.content.images.map((img) => img.src)) || [];
        const uniqueUrls = Array.from(new Set(imageUrls)).filter((u) => u.startsWith('http'));

        if (uniqueUrls.length > 0) {
          addLog(`ASSETS: Found ${uniqueUrls.length} images. Downloading...`);
          const dlRes = await downloadImagesAction(uniqueUrls);
          if (dlRes.success && dlRes.data) {
            setDownloadedAssets(dlRes.data);
            assetMap = dlRes.data.map;
            addLog(
              `ASSETS: Successfully downloaded ${Object.keys(dlRes.data.images).length} images.`,
              'success'
            );
          } else {
            addLog(`ASSETS: Download failed or partial.`, 'warning');
          }
        }

        // Run implementation planning
        if (!currentSpec) {
          throw new Error('Component pattern library is missing. Analysis may have failed.');
        }

        const res = await generateImplementationPlanAction(
          currentSpec as ComponentSpecification,
          config,
          userInstructions,
          assetMap,
          designOverride,
          specsOverride || [],
          migrationPlan
        );

        if (!res.success)
          addLog(
            `AI WARNING: Plan generation failed (${res.error}). Using fallback data.`,
            'warning'
          );
        setFinalOutput({ spec: null, implPlan: res.data as any });
        addLog('SUCCESS: Final Implementation Plan generated successfully.', 'success');
        setView('final_plan');
      } catch (e: any) {
        addLog(`PLAN ERROR: ${e.message}`, 'error');
        toast.error('Plan generation failed');
      } finally {
        setIsProcessing(false);
        setCurrentStep('');
      }
    },
    [
      structure,
      migrationPlan,
      componentSpec,
      critique,
      userInstructions,
      semanticMerges,
      setComponentSpec,
      setDesignConfig,
      setDownloadedAssets,
      setFinalOutput,
      setView,
      setIsProcessing,
      setCurrentStep,
      addLog,
    ]
  );

  return {
    generatePlan,
  };
}
