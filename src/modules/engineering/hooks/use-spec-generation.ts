import { useCallback } from 'react';
import { toast } from 'sonner';
import { TargetSlot, SiteStructure, MigrationPlan } from '@/types';
import { generatePageSpecsAction, detectDependenciesAction, regeneratePageSpecsAction } from '@/app/actions';
import { enrichTarget } from '@/modules/engineering/services/target-enrichment';
import { ImageValidator } from '@/modules/analysis/services/image-validator';
import { SemanticMergeMap } from '@/modules/core/utils/normalization';

export interface SpecGenerationDependencies {
  structure: SiteStructure | null;
  migrationPlan: MigrationPlan | null;
  semanticMerges: SemanticMergeMap | undefined;
  currentSessionId: string | null;
  pageSpecs: TargetSlot[] | null;
  setPageSpecs: (specs: TargetSlot[] | ((prev: TargetSlot[] | null) => TargetSlot[] | null)) => void;
  setView: (view: any) => void;
  setIsProcessing: (processing: boolean) => void;
  setCurrentStep: (step: string) => void;
  setPagesCompleted: (count: number) => void;
  setTotalPages: (count: number) => void;
  addLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error', meta?: any) => void;
}

export interface SpecGenerationState {
  handleGenerateSpecs: (targets: TargetSlot[]) => Promise<TargetSlot[]>;
}

/**
 * Hook for orchestrating complete page specification generation
 * Includes progressive loading, iterative refinement, and validation
 */
export function useSpecGeneration(deps: SpecGenerationDependencies): SpecGenerationState {
  const {
    structure,
    migrationPlan,
    semanticMerges,
    currentSessionId,
    pageSpecs,
    setPageSpecs,
    setView,
    setIsProcessing,
    setCurrentStep,
    setPagesCompleted,
    setTotalPages,
    addLog,
  } = deps;

  const handleGenerateSpecs = useCallback(async (targets: TargetSlot[]): Promise<TargetSlot[]> => {
    setIsProcessing(true);
    setView('content_review');
    toast.info("Analyzing content & generating drafts...");

    const enrichedTargets = targets.map(t => enrichTarget(t, structure, migrationPlan, targets));

    try {
      setPageSpecs([]);
      const total = enrichedTargets.length;
      setTotalPages(total);
      setPagesCompleted(0);

      for (let i = 0; i < total; i++) {
        const target = enrichedTargets[i];
        setPagesCompleted(i);

        setCurrentStep(`Designing Frame for ${target.path}...`);
        const result = await generatePageSpecsAction([target], structure, currentSessionId || undefined, semanticMerges);

        if (result.success && result.data && result.data[0]) {
          let currentSpec = result.data[0];

          if (currentSpec.sections) {
            currentSpec.sections = currentSpec.sections.map((s: any) => ({
              ...s,
              images: (s.images || [])
                .map((img: any) => {
                  const src = typeof img === 'string' ? img : img.src;
                  if (!src || src.trim() === '') return null;

                  const isLink = src.startsWith('http') || src.startsWith('/') || src.startsWith('./') || src.startsWith('data:');
                  if (!isLink) return null;

                  return { src: src.trim(), status: (img && typeof img === 'object' && img.status) || 'optional' };
                })
                .filter(Boolean)
            }));
          }

          setPageSpecs((prev) => {
            const list = prev || [];
            const existing = list.find((p: any) => p.path === currentSpec.path);
            if (existing) return list.map((p: any) => p.path === currentSpec.path ? currentSpec : p);
            return [...list, currentSpec];
          });

          setCurrentStep(`Searching dependencies for ${target.path}...`);
          try {
            const sitemapPaths = structure?.nodes?.map((n: any) => {
              try { return new URL(n.url).pathname; } catch (e) { return n.url; }
            }).filter(Boolean) || [];
            const sectionHints = currentSpec.sections?.map((s: any) => s.type).join(", ") || "General content";

            const depResult = await detectDependenciesAction(
              currentSpec.path,
              `Frame Design: [${sectionHints}]. What other pages contain context/images for these elements?`,
              sitemapPaths,
              currentSessionId || undefined
            );

            const rawDeps = (depResult.success && depResult.data?.dependencies) || [];
            const newDeps = rawDeps.map((d: any) => typeof d === 'string' ? d : d.path || d.url || d.pathname).filter(Boolean);

            const additionalContext = newDeps.map((depPath: string) => {
              const node = structure?.nodes?.find((n: any) => {
                try { return new URL(n.url).pathname === depPath; } catch (e) { return false; }
              });
              return node ? { path: depPath, content: node.content?.rawText || '' } : null;
            }).filter(Boolean);

            setCurrentStep(`Drafting Copy for ${target.path}...`);

            const primarySourceText = (target as any).sourceDetails?.map((s: any) => s.content).join('\n\n') || '';

            const regResult = await regeneratePageSpecsAction(
              currentSpec,
              primarySourceText,
              additionalContext,
              sitemapPaths,
              "Initial Generation: Filling architecture frame with source content and context.",
              currentSessionId || undefined
            );

            if (regResult.success && regResult.data) {
              const normalizedData = { ...regResult.data };
              if (normalizedData.sections) {
                normalizedData.sections = normalizedData.sections.map((s: any) => ({
                  ...s,
                  images: (s.images || [])
                    .map((img: any) => {
                      const src = typeof img === 'string' ? img : img.src;
                      return src && src.trim() !== '' ? { src: src, status: img.status || 'optional' } : null;
                    })
                    .filter(Boolean)
                }));
              }
              currentSpec = {
                ...normalizedData,
                sourceDetails: target.sourceDetails,
                logos: target.logos,
                dependencies: newDeps,
                dependencies_detected: true,
                lastGeneratedAt: Date.now()
              };

              if (!currentSpec.sections || currentSpec.sections.length === 0) {
                console.warn(`[Iteration Loop] Target ${target.path} returned no sections. Keeping frame.`);
                currentSpec.sections = result.data[0].sections || [];
              }

              setPageSpecs(prev => {
                const list = prev || [];
                const existing = list.find(p => p.path === currentSpec.path);
                if (existing) return list.map(p => p.path === currentSpec.path ? currentSpec : p);
                return [...list, currentSpec];
              });
            }
          } catch (loopError) {
            console.error(`Refinement error for ${target.path}`, loopError);
          }
        }
      }

      setPagesCompleted(total);

      if (structure && pageSpecs) {
        const inventory = ImageValidator.buildAssetInventory(structure);
        const imageValidation = ImageValidator.validatePageSpecImages(pageSpecs, inventory);

        if (!imageValidation.isValid) {
          toast.warning(`${imageValidation.invalidImages.length} Bilder nicht im Inventar gefunden`);
          console.warn('Image validation issues:', {
            invalidImages: imageValidation.invalidImages,
            warnings: imageValidation.warnings
          });
          console.log(ImageValidator.generateValidationReport(imageValidation));
        }
      }

      toast.success("All drafts generated successfully!");
      return pageSpecs || targets;

    } catch (e) {
      toast.error("Failed to generate strategy");
      setView('ai_result');
      return targets;
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  }, [structure, migrationPlan, semanticMerges, currentSessionId, pageSpecs, setPageSpecs, setView, setIsProcessing, setCurrentStep, setPagesCompleted, setTotalPages, addLog]);

  return {
    handleGenerateSpecs,
  };
}
