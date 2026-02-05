import { useCallback } from 'react';
import { toast } from 'sonner';
import { SiteStructure, DesignConfig, ComponentSpecification, MockupVariant, TargetSlot } from '@/types';
import { generateUltraExtremeMockupAction } from '@/app/actions';

export interface MockupWorkflowDependencies {
  structure: SiteStructure | null;
  designConfig: DesignConfig;
  componentSpec: ComponentSpecification | null;
  pageSpecs: TargetSlot[] | null;
  setDesignConfig: (config: DesignConfig | ((prev: DesignConfig) => DesignConfig)) => void;
  setView: (view: any) => void;
  setIsGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  addLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error', meta?: any) => void;
}

export interface MockupWorkflowState {
  generateMockup: (withFeedback?: boolean) => Promise<void>;
}

/**
 * Hook for orchestrating mockup generation workflow
 * Generates 5 parallel variants with completely different approaches
 */
export function useMockupWorkflow(deps: MockupWorkflowDependencies): MockupWorkflowState {
  const {
    structure,
    designConfig,
    componentSpec,
    pageSpecs,
    setDesignConfig,
    setView,
    setIsGenerating,
    setError,
    addLog,
  } = deps;

  const generateMockup = useCallback(
    async (withFeedback?: boolean) => {
      setIsGenerating(true);
      setError(null);
      setView('mockup_view');

      const currentIteration = withFeedback ? (designConfig.mockupIteration || 1) + 1 : 1;
      addLog(`DESIGN: Generating 5 Mockup Variants (Iteration ${currentIteration})...`, 'info');

      try {
        // Prepare site data for formatting
        const rootNode = structure?.nodes[0];
        const siteDataForMockup = rootNode
          ? {
              siteName:
                rootNode.meta?.title?.split('|')[0]?.trim() ||
                rootNode.meta?.title?.split('-')[0]?.trim(),
              h1: rootNode.content?.h1,
              headings: rootNode.content?.headings,
              navigation: rootNode.content?.links
                ?.filter((l: any) => l.isInternal || l.text)
                ?.filter((l: any) => l.text && l.text.length < 30)
                ?.slice(0, 10)
                ?.map((l: any) => ({ text: l.text, href: l.href })),
              images: (() => {
                const allImages: any[] = [];
                const seenSrcs = new Set<string>();
                structure?.nodes?.forEach((node: any) => {
                  node.content?.images?.forEach((img: any) => {
                    if (img.src && !seenSrcs.has(img.src)) {
                      seenSrcs.add(img.src);
                      allImages.push({
                        src: img.src,
                        alt: img.alt,
                        context: img.context,
                        isLogo: img.isLogo,
                        logoProb: img.logoProb,
                        role: img.role,
                        roleConfidence: img.roleConfidence,
                        componentHint: img.componentHint ?? undefined,
                        groupId: img.groupId ?? undefined,
                        sourcePage: node.url,
                        colorAnalysis: img.colorAnalysis ?? undefined, // Positional colors for harmonious designs
                      });
                    }
                  });
                });
                const { selectImagesForMockup } = require('@/lib/utils/image-selection');
                const selectionResult = selectImagesForMockup(allImages, componentSpec);
                return selectionResult.selectedImages;
              })(),
              rawText: rootNode.content?.rawText?.substring(0, 1000),
              forms: rootNode.content?.forms,
              meta: {
                title: rootNode.meta?.title,
                description: rootNode.meta?.description,
                designSignals: rootNode.meta?.designSignals,
                imageComponentSummary: rootNode.meta?.imageComponentSummary?.map(
                  (s: any) => `${s.groupId}: ${s.imageCount} images, role: ${s.role}`
                ),
              },
              assignedLogos: (pageSpecs?.find((s) => s.type === 'layout') as any)?.logos || [],
              extractedColors: (() => {
                const colors = rootNode.content?.extractedColors;
                if (!colors) return undefined;
                const colorList: { color: string; usage?: string }[] = [];
                if (
                  typeof colors.primary === 'string' ||
                  typeof colors.background === 'string'
                ) {
                  if (colors.primary) colorList.push({ color: colors.primary, usage: 'primary' });
                  if (colors.accent) colorList.push({ color: colors.accent, usage: 'accent' });
                  if (colors.secondary)
                    colorList.push({ color: colors.secondary, usage: 'secondary' });
                  if (typeof colors.background === 'string')
                    colorList.push({ color: colors.background, usage: 'background' });
                  if (typeof colors.text === 'string')
                    colorList.push({ color: colors.text, usage: 'text' });
                }
                return colorList.length > 0 ? colorList : undefined;
              })(),
              // Image-based color palette (brand, hero, overall) for harmonious designs
              designSystemColors: rootNode.content?.designSystemColors,
              plannedContent: (() => {
                const homePath = rootNode ? new URL(rootNode.url).pathname : '/';
                const match: any = pageSpecs?.find(
                  (p: any) => p.path === homePath || p.path === '/' || p.path === '/home'
                );
                if (!match) return undefined;
                return {
                  description: match.description,
                  content_goals: match.content_goals,
                  sections: match.sections?.map((s: any) => ({
                    type: s.type,
                    headline: s.headline,
                    content: s.content,
                    images: s.images,
                  })),
                };
              })(),
              componentSpec: componentSpec || undefined,
            }
          : undefined;

        // --- ALWAYS USE 5-STAGE ULTRA-EXTREME GENERATION ---
        // All mockups now use ultra-extreme 5-stage generation (Foundation → Archetype → Experimental Push → Critique → Polish)

        // Validate archetype selection
        if (!designConfig.selectedArchetype) {
          setError('Please select an ultra-extreme archetype before generating mockups.');
          toast.error('No archetype selected');
          addLog('DESIGN ERROR: No archetype selected', 'error');
          setIsGenerating(false);
          return;
        }

        const archetypeLabel = designConfig.selectedArchetype;
        const presetLabel = designConfig.stylePreset && designConfig.stylePreset !== 'custom'
          ? `${designConfig.stylePreset} preset + ${archetypeLabel} archetype`
          : `${archetypeLabel} archetype`;

        addLog(
          `DESIGN: Ultra-Extreme 5-Stage Generation (${presetLabel})...`,
          'info'
        );

        // Create page spec for ultra-extreme generation
        const homePath = rootNode ? new URL(rootNode.url).pathname : '/';
        const homePageSpec =
          pageSpecs?.find((p) => p.path === homePath || p.path === '/' || p.path === '/home') || {
            id: 'home',
            label: 'Home',
            path: '/',
            type: 'page' as const,
            action: 'create',
            sourceIds: [],
            sections: [],
          };

        // Generate 5 completely different variants in PARALLEL (2-3 min total)
        // Each variant gets a unique "variation seed" to ensure completely different approaches
        const startTime = Date.now();
        addLog(`🚀 Starting PARALLEL generation of 5 variants at ${new Date().toISOString()}`, 'info');

        const ultraExtremePromises = [1, 2, 3, 4, 5].map(async (id) => {
          const variantStartTime = Date.now();
          try {
            addLog(`Variant ${id}/5 - STARTED at +${Date.now() - startTime}ms`, 'info');

            const result = await generateUltraExtremeMockupAction(
              designConfig,
              componentSpec || { components: [], relationships: [] },
              homePageSpec,
              siteDataForMockup, // FIXED: Pass homepage data (siteName, h1, nav, images, etc.)
              id // Pass variation seed to ensure completely different layouts
            );

            const variantDuration = Date.now() - variantStartTime;

            if (result.success && result.data) {
              addLog(
                `Variant ${id}/5 - COMPLETED at +${Date.now() - startTime}ms (took ${Math.round(variantDuration / 1000)}s) - Score: ${result.data.critique?.overall_score || 'N/A'}/100`,
                'success'
              );
              return {
                success: true,
                data: result.data.html,
                critique: result.data.critique,
              };
            } else {
              throw new Error(result.error || 'Unknown error');
            }
          } catch (e: any) {
            addLog(`Variant ${id}/5 - FAILED at +${Date.now() - startTime}ms: ${e.message}`, 'error');
            return { success: false, error: e.message };
          }
        });

        // PARALLEL execution - all 5 variants generated simultaneously
        addLog(`⏳ Waiting for all 5 variants to complete...`, 'info');
        const ultraExtremeResults = await Promise.all(ultraExtremePromises);
        const totalDuration = Date.now() - startTime;
        addLog(`✅ All variants completed in ${Math.round(totalDuration / 1000)}s total`, 'success');
        const successfulVariants: MockupVariant[] = ultraExtremeResults
          .filter((r) => r.success && r.data)
          .map((r, i) => ({
            id: `ultra-extreme-${currentIteration}-${i + 1}`,
            html: r.data as string,
            iteration: currentIteration,
            timestamp: Date.now(),
            archetype: designConfig.selectedArchetype,
            isPremium: true, // All ultra-extreme variants are premium
            generationStages: 5, // Always 5 stages
            critique: r.critique,
          }));

        if (successfulVariants.length > 0) {
          setDesignConfig((prev) => {
            const newHistory = [...(prev.mockupHistory || [])];
            if (prev.mockupVariants && prev.mockupVariants.length > 0) {
              newHistory.push(...prev.mockupVariants);
            }

            return {
              ...prev,
              mockupVariants: successfulVariants,
              activeVariantId: successfulVariants[0].id,
              mockupHistory: newHistory,
              mockupIteration: currentIteration,
              mockupHtml: successfulVariants[0].html,
            };
          });
          toast.success(`${successfulVariants.length} Varianten erstellt!`);
          addLog(
            `DESIGN: Generation complete (${successfulVariants.length}/5 successful, 5-stage process).`,
            'success'
          );
        } else {
          const errorMsg =
            ultraExtremeResults.find((r) => !r.success)?.error || 'Failed to generate any variants';
          setError(errorMsg);
          toast.error('Ultra-extreme mockup generation failed');
          addLog(`DESIGN ERROR: ${errorMsg}`, 'error');
        }

        setIsGenerating(false);
      } catch (e: any) {
        setError(e.message);
        toast.error('Error generating premium mockup');
        addLog(`DESIGN ERROR: ${e.message}`, 'error');
        setIsGenerating(false);
      }
    },
    [
      structure,
      designConfig,
      componentSpec,
      pageSpecs,
      setDesignConfig,
      setView,
      setIsGenerating,
      setError,
      addLog,
    ]
  );

  return {
    generateMockup,
  };
}

