/**
 * Content Optimizer Hook
 *
 * Manages content optimization and analysis
 */

import { useState } from 'react';
import {
  analyzeContent,
  generateOptimizationPrompt,
  type ContentAnalysis,
  type OptimizedContent,
} from '../services/content-optimizer';

export function useContentOptimizer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [optimized, setOptimized] = useState<OptimizedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analyze content
   */
  const analyze = (
    content: string,
    context?: {
      targetKeywords?: string[];
      targetWordCount?: number;
      targetAudience?: 'general' | 'professional' | 'technical';
    }
  ): ContentAnalysis => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = analyzeContent(content, context);
      setAnalysis(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Generate optimization prompt (for manual AI use)
   */
  const getOptimizationPrompt = (content: string): string => {
    if (!analysis) {
      throw new Error('Please analyze content first');
    }
    return generateOptimizationPrompt(content, analysis);
  };

  /**
   * Clear analysis
   */
  const clear = () => {
    setAnalysis(null);
    setOptimized(null);
    setError(null);
  };

  return {
    isAnalyzing,
    isOptimizing,
    analysis,
    optimized,
    error,
    analyze,
    getOptimizationPrompt,
    clear,
  };
}
