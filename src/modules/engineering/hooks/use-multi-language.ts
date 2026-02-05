/**
 * Multi-Language Hook
 *
 * Manages multi-language content generation
 */

import { useState } from 'react';
import type { SiteStructure, TargetSlot } from '@/types';
import {
  detectSiteLanguages,
  generateMultiLanguageContent,
  createMultiLanguagePageSpecs,
  generateLanguageSwitcher,
  generateI18nConfig,
  type LanguageDetection,
  type MultiLanguageContent,
} from '../services/multi-language-generator';

export function useMultiLanguage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [multiLangContent, setMultiLangContent] = useState<MultiLanguageContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Detect languages in site structure
   */
  const detectLanguages = (structure: SiteStructure): LanguageDetection[] => {
    try {
      return detectSiteLanguages(structure);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Detection failed';
      setError(message);
      return [];
    }
  };

  /**
   * Generate multi-language content
   */
  const generateContent = async (
    structure: SiteStructure,
    targetLanguages: string[]
  ): Promise<MultiLanguageContent> => {
    setIsGenerating(true);
    setError(null);

    try {
      const content = await generateMultiLanguageContent(structure, targetLanguages);
      setMultiLangContent(content);
      return content;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Create language-specific page specs
   */
  const createLanguageSpecs = (
    baseSpecs: TargetSlot[],
    languages: string[]
  ): TargetSlot[] => {
    return createMultiLanguagePageSpecs(baseSpecs, languages);
  };

  /**
   * Download language switcher component
   */
  const downloadLanguageSwitcher = (languages: string[]): void => {
    const code = generateLanguageSwitcher(languages);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LanguageSwitcher.tsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Download i18n config
   */
  const downloadI18nConfig = (languages: string[], defaultLanguage: string): void => {
    const code = generateI18nConfig(languages, defaultLanguage);
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'i18n-config.js';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Copy language switcher to clipboard
   */
  const copyLanguageSwitcher = async (languages: string[]): Promise<void> => {
    const code = generateLanguageSwitcher(languages);
    await navigator.clipboard.writeText(code);
  };

  /**
   * Copy i18n config to clipboard
   */
  const copyI18nConfig = async (
    languages: string[],
    defaultLanguage: string
  ): Promise<void> => {
    const code = generateI18nConfig(languages, defaultLanguage);
    await navigator.clipboard.writeText(code);
  };

  return {
    isGenerating,
    multiLangContent,
    error,
    detectLanguages,
    generateContent,
    createLanguageSpecs,
    downloadLanguageSwitcher,
    downloadI18nConfig,
    copyLanguageSwitcher,
    copyI18nConfig,
  };
}
