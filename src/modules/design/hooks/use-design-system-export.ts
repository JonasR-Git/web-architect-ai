/**
 * Design System Export Hook
 *
 * Provides methods to export design tokens in various formats
 */

import { useState } from 'react';
import type { DesignConfig } from '@/types';
import {
  extractDesignTokens,
  exportToCSSVariables,
  exportToTailwindConfig,
  exportToFigmaTokens,
  type DesignTokens,
  type ExportOptions,
} from '../services/design-system-export';

export type ExportFormat = 'css' | 'tailwind' | 'figma' | 'all';

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  content: string;
  size: number;
}

export function useDesignSystemExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Export design system in specified format(s)
   */
  const exportDesignSystem = async (
    config: DesignConfig,
    format: ExportFormat = 'all',
    options: ExportOptions = {}
  ): Promise<ExportResult[]> => {
    setIsExporting(true);
    setError(null);

    try {
      const tokens = extractDesignTokens(config);
      const results: ExportResult[] = [];

      if (format === 'css' || format === 'all') {
        const content = exportToCSSVariables(tokens, options);
        results.push({
          format: 'css',
          filename: 'design-tokens.css',
          content,
          size: new Blob([content]).size,
        });
      }

      if (format === 'tailwind' || format === 'all') {
        const content = exportToTailwindConfig(tokens, options);
        results.push({
          format: 'tailwind',
          filename: 'tailwind.config.js',
          content,
          size: new Blob([content]).size,
        });
      }

      if (format === 'figma' || format === 'all') {
        const content = exportToFigmaTokens(tokens, options);
        results.push({
          format: 'figma',
          filename: 'figma-tokens.json',
          content,
          size: new Blob([content]).size,
        });
      }

      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Download design tokens as files
   */
  const downloadDesignTokens = async (
    config: DesignConfig,
    format: ExportFormat = 'all',
    options: ExportOptions = {}
  ): Promise<void> => {
    const results = await exportDesignSystem(config, format, options);

    results.forEach((result) => {
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  /**
   * Copy design tokens to clipboard
   */
  const copyToClipboard = async (
    config: DesignConfig,
    format: ExportFormat = 'css',
    options: ExportOptions = {}
  ): Promise<void> => {
    const results = await exportDesignSystem(config, format, options);

    if (results.length === 0) {
      throw new Error('No content to copy');
    }

    // If multiple formats, copy all concatenated
    const content = results.map((r) => r.content).join('\n\n');

    await navigator.clipboard.writeText(content);
  };

  /**
   * Get preview of tokens (for UI display)
   */
  const getTokensPreview = (config: DesignConfig): DesignTokens => {
    return extractDesignTokens(config);
  };

  return {
    isExporting,
    error,
    exportDesignSystem,
    downloadDesignTokens,
    copyToClipboard,
    getTokensPreview,
  };
}
