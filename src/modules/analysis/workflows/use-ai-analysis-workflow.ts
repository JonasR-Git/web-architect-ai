import { useCallback } from 'react';
import { toast } from 'sonner';
import { SiteStructure, ClusterOverrides, StackConfig } from '@/types';
import { SemanticMergeMap } from '@/modules/core/utils/normalization';
import {
  generateCritiqueAction,
  generateMigrationAction,
  generateComponentLibraryAction,
} from '@/app/actions';

export interface AIAnalysisWorkflowDependencies {
  structure: SiteStructure | null;
  excludedUrls: Set<string>;
  userInstructions: string;
  clusterOverrides: ClusterOverrides;
  semanticMerges: SemanticMergeMap | undefined;
  stackConfig: StackConfig;
  setCritique: (critique: any) => void;
  setMigrationPlan: (plan: any) => void;
  setComponentSpec: (spec: any) => void;
  setView: (view: any) => void;
  setIsProcessing: (processing: boolean) => void;
  setCurrentStep: (step: string) => void;
  addLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error', meta?: any) => void;
}

export interface AIAnalysisWorkflowState {
  runAnalysis: () => Promise<void>;
}

/**
 * Hook for orchestrating the AI analysis workflow
 * Runs parallel critique + migration, then sequential component extraction
 */
export function useAIAnalysisWorkflow(
  deps: AIAnalysisWorkflowDependencies
): AIAnalysisWorkflowState {
  const {
    structure,
    excludedUrls,
    userInstructions,
    clusterOverrides,
    semanticMerges,
    stackConfig,
    setCritique,
    setMigrationPlan,
    setComponentSpec,
    setView,
    setIsProcessing,
    setCurrentStep,
    addLog,
  } = deps;

  const runAnalysis = useCallback(async () => {
    if (!structure) return;

    // Filter out excluded URLs
    const filteredStructure = {
      ...structure,
      nodes: structure.nodes.filter((n) => !excludedUrls.has(n.url)),
    };

    const excludedCount = structure.nodes.length - filteredStructure.nodes.length;
    if (excludedCount > 0) {
      addLog(`PRUNING: ${excludedCount} pages excluded from analysis by user.`, 'info');
    }

    setIsProcessing(true);
    setView('ai_analysis');
    addLog('--- STARTING AI ANALYSIS ---');

    try {
      // === RUN CRITIQUE + MIGRATION IN PARALLEL ===
      setCurrentStep('Analyzing Structure & Strategy...');
      addLog('AI: Running Audit & Migration in parallel...', 'info');

      // Build parallel promises
      const auditPromise = generateCritiqueAction(
        filteredStructure,
        userInstructions,
        clusterOverrides,
        semanticMerges
      );
      const migrationPromise = generateMigrationAction(
        filteredStructure,
        userInstructions,
        clusterOverrides,
        semanticMerges
      );

      // Wait for all parallel requests
      const [auditRes, migRes] = await Promise.all([auditPromise, migrationPromise]);

      // Process Audit result
      if (!auditRes.success)
        addLog(
          `AI WARNING: Audit failed (${auditRes.error}). Using fallback data.`,
          'warning'
        );
      setCritique(auditRes.data);
      const auditMeta = auditRes.data?._meta;
      addLog(`AI [${auditMeta?.model || 'unknown'}]: Audit complete.`, 'success', auditMeta);

      // Process Migration result
      if (!migRes.success)
        addLog(
          `AI WARNING: Migration failed (${migRes.error}). Using fallback data.`,
          'warning'
        );
      setMigrationPlan(migRes.data);
      const migMeta = (migRes.data as any)?._meta;
      addLog(
        `AI [${migMeta?.model || 'unknown'}]: Migration strategy ready.`,
        'success',
        migMeta
      );

      // COMPONENTS (depends on migRes.data and auditRes.data, so must run after)
      setCurrentStep('Extracting Component Library...');
      addLog('AI: Extracting Component Pattern Library...');
      const compRes = await generateComponentLibraryAction(
        migRes.data,
        structure,
        userInstructions,
        stackConfig,
        auditRes.data,
        clusterOverrides,
        semanticMerges
      );
      if (!compRes.success)
        addLog(
          `AI WARNING: Component extraction failed (${compRes.error}). Using fallback data.`,
          'warning'
        );
      setComponentSpec(compRes.data);
      const compMeta = compRes.data?._meta;
      addLog(`AI [${compMeta?.model || 'unknown'}]: Components defined.`, 'success', compMeta);

      toast.success('AI Analysis Complete');
      setView('ai_result');
    } catch (e: any) {
      addLog(`AI ERROR: ${e.message}`, 'error');
      toast.error('AI Analysis failed');
      // Stay on analysis view so they can see logs or retry
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  }, [
    structure,
    excludedUrls,
    userInstructions,
    clusterOverrides,
    semanticMerges,
    stackConfig,
    setCritique,
    setMigrationPlan,
    setComponentSpec,
    setView,
    setIsProcessing,
    setCurrentStep,
    addLog,
  ]);

  return {
    runAnalysis,
  };
}
