/**
 * Premium Mockup Generation Hook
 *
 * Orchestrates 3-stage generation process with AI
 */

import { useState } from 'react';
import type { DesignConfig, ComponentSpecification, TargetSlot } from '@/types';
import {
  generateStage1Prompt,
  generateStage2Prompt,
  generateStage3Prompt,
  parseStage3Response,
  type MockupGenerationStages,
  type DesignCritique,
} from '../services/premium-mockup-generator';

export interface PremiumMockupState {
  isGenerating: boolean;
  currentStage: 1 | 2 | 3 | null;
  stages: Partial<MockupGenerationStages>;
  critique: DesignCritique | null;
  finalHtml: string | null;
  error: string | null;
}

export function usePremiumMockup() {
  const [state, setState] = useState<PremiumMockupState>({
    isGenerating: false,
    currentStage: null,
    stages: {},
    critique: null,
    finalHtml: null,
    error: null,
  });

  /**
   * Generate premium mockup through 3 stages
   */
  const generatePremiumMockup = async (
    config: DesignConfig,
    componentSpec: ComponentSpecification,
    pageSpec: TargetSlot,
    aiService: any // AI service to call
  ): Promise<string> => {
    setState(prev => ({
      ...prev,
      isGenerating: true,
      currentStage: 1,
      error: null,
    }));

    try {
      // === STAGE 1: Layout & Structure ===
      console.log('[Premium Mockup] Stage 1: Generating layout & structure...');

      const stage1Prompt = generateStage1Prompt(config, componentSpec, pageSpec);

      const stage1Response = await aiService.generateMockup({
        prompt: stage1Prompt,
        designConfig: config,
      });

      const stage1Html = stage1Response.html || stage1Response;

      setState(prev => ({
        ...prev,
        currentStage: 2,
        stages: { ...prev.stages, stage1_structure: stage1Html },
      }));

      console.log('[Premium Mockup] Stage 1 complete. Moving to Stage 2...');

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // === STAGE 2: Visual Refinement ===
      console.log('[Premium Mockup] Stage 2: Refining visuals...');

      const stage2Prompt = generateStage2Prompt(config, stage1Html);

      const stage2Response = await aiService.generateMockup({
        prompt: stage2Prompt,
        designConfig: config,
      });

      const stage2Html = stage2Response.html || stage2Response;

      setState(prev => ({
        ...prev,
        currentStage: 3,
        stages: { ...prev.stages, stage2_refined: stage2Html },
      }));

      console.log('[Premium Mockup] Stage 2 complete. Moving to Stage 3...');

      await new Promise(resolve => setTimeout(resolve, 500));

      // === STAGE 3: Critique & Polish ===
      console.log('[Premium Mockup] Stage 3: Self-critique & polish...');

      const stage3Prompt = generateStage3Prompt(config, stage2Html);

      const stage3Response = await aiService.generateMockup({
        prompt: stage3Prompt,
        designConfig: config,
      });

      const stage3Text = stage3Response.html || stage3Response;
      const { critique, html: stage3Html } = parseStage3Response(stage3Text);

      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentStage: null,
        stages: {
          ...prev.stages,
          stage3_polished: stage3Html,
        },
        critique,
        finalHtml: stage3Html,
      }));

      console.log('[Premium Mockup] All stages complete!');
      console.log('[Premium Mockup] Design Score:', critique.overall_score);
      console.log('[Premium Mockup] Strengths:', critique.strengths);
      console.log('[Premium Mockup] Improvements:', critique.improvements);

      return stage3Html;

    } catch (error) {
      console.error('[Premium Mockup] Generation failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Generation failed';

      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentStage: null,
        error: errorMessage,
      }));

      throw error;
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setState({
      isGenerating: false,
      currentStage: null,
      stages: {},
      critique: null,
      finalHtml: null,
      error: null,
    });
  };

  /**
   * Get stage progress (0-100%)
   */
  const getProgress = (): number => {
    if (!state.isGenerating) return 0;
    if (state.currentStage === 1) return 33;
    if (state.currentStage === 2) return 66;
    if (state.currentStage === 3) return 90;
    return 100;
  };

  return {
    state,
    generatePremiumMockup,
    reset,
    getProgress,
  };
}
