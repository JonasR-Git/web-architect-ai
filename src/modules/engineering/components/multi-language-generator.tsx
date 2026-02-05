/**
 * Multi-Language Generator UI
 *
 * UI for detecting and generating multi-language content
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Globe,
  Download,
  Copy,
  Check,
  Languages,
  FileCode,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { SiteStructure } from '@/types';
import { useMultiLanguage } from '../hooks/use-multi-language';
import { toast } from 'sonner';

interface MultiLanguageGeneratorProps {
  structure: SiteStructure;
}

export function MultiLanguageGenerator({ structure }: MultiLanguageGeneratorProps) {
  const {
    isGenerating,
    multiLangContent,
    error,
    detectLanguages,
    generateContent,
    downloadLanguageSwitcher,
    downloadI18nConfig,
    copyLanguageSwitcher,
    copyI18nConfig,
  } = useMultiLanguage();

  const [detectedLanguages, setDetectedLanguages] = useState<any[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Detect languages on mount
  useEffect(() => {
    const detected = detectLanguages(structure);
    setDetectedLanguages(detected);

    // Auto-select ONLY detected languages (not all available languages)
    const detectedCodes = detected.map((d) => d.code);
    setSelectedLanguages(new Set(detectedCodes));
  }, [structure]);

  const handleGenerate = async () => {
    if (selectedLanguages.size === 0) {
      toast.error('Please select at least one language');
      return;
    }

    try {
      await generateContent(structure, Array.from(selectedLanguages));
      setHasGenerated(true);
      toast.success(`Multi-language content generated for ${selectedLanguages.size} languages`);
    } catch (err) {
      toast.error('Failed to generate multi-language content');
      console.error(err);
    }
  };

  const toggleLanguage = (langCode: string) => {
    const next = new Set(selectedLanguages);
    if (next.has(langCode)) {
      next.delete(langCode);
    } else {
      next.add(langCode);
    }
    setSelectedLanguages(next);
  };

  const handleDownloadSwitcher = () => {
    downloadLanguageSwitcher(Array.from(selectedLanguages));
    toast.success('Language switcher component downloaded');
  };

  const handleDownloadI18n = () => {
    const defaultLang = detectedLanguages.find((d) => d.isDefault)?.code || 'en';
    downloadI18nConfig(Array.from(selectedLanguages), defaultLang);
    toast.success('i18n configuration downloaded');
  };

  const handleCopySwitcher = async () => {
    try {
      await copyLanguageSwitcher(Array.from(selectedLanguages));
      setCopiedItem('switcher');
      toast.success('Language switcher copied to clipboard');
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCopyI18n = async () => {
    try {
      const defaultLang = detectedLanguages.find((d) => d.isDefault)?.code || 'en';
      await copyI18nConfig(Array.from(selectedLanguages), defaultLang);
      setCopiedItem('i18n');
      toast.success('i18n config copied to clipboard');
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Languages className="w-5 h-5 text-blue-400" />
          Multi-Language Content
        </h3>
        <p className="text-sm text-gray-400">
          Detected languages are auto-selected. Add more languages if needed.
        </p>
      </div>

      {/* Detected Languages */}
      {detectedLanguages.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">
              Detected Languages
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {detectedLanguages.map((lang) => (
              <div
                key={lang.code}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg"
              >
                <span className="text-2xl">{getFlagEmoji(lang.code)}</span>
                <div>
                  <div className="text-sm font-medium text-white">
                    {lang.name}
                    {lang.isDefault && (
                      <span className="ml-2 text-xs text-emerald-400">(Primary)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {lang.pages.length} pages ({lang.percentage.toFixed(0)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Selection */}
      <div className="space-y-4">
        {/* Detected Languages (auto-selected) */}
        {detectedLanguages.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">
              Selected Languages
            </label>
            <div className="grid grid-cols-2 gap-3">
              {detectedLanguages.map((lang) => (
                <div
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-purple-500/20 border-purple-500/50 cursor-pointer transition-all hover:bg-purple-500/30"
                >
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded border-2 bg-purple-500 border-purple-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </div>

                  <span className="text-2xl">{getFlagEmoji(lang.code)}</span>

                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {lang.name}
                    </div>
                    <div className="text-xs text-emerald-400">
                      {lang.isDefault ? 'Primary' : 'Detected'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Languages (optional) */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-3 block">
            Add More Languages (Optional)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {availableLanguages
              .filter((lang) => !detectedLanguages.some((d) => d.code === lang.code))
              .map((lang) => {
                const isSelected = selectedLanguages.has(lang.code);

                return (
                  <div
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          ${
                            isSelected
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-600'
                          }
                        `}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                    </div>

                    <span className="text-2xl">{getFlagEmoji(lang.code)}</span>

                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {lang.name}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {!hasGenerated ? (
        /* Generate Button */
        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedLanguages.size === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Languages className="w-4 h-4" />
          {isGenerating
            ? 'Generating...'
            : `Generate Content for ${selectedLanguages.size} ${selectedLanguages.size === 1 ? 'Language' : 'Languages'}`}
        </button>
      ) : (
        <>
          {/* Cultural Adaptations */}
          {multiLangContent && (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-300">
                Cultural Adaptations & SEO Recommendations
              </div>

              {multiLangContent.adaptations.map((adaptation) => {
                const isExpanded = expandedLang === adaptation.targetLanguage;
                const lang = availableLanguages.find(
                  (l) => l.code === adaptation.targetLanguage
                );

                return (
                  <div
                    key={adaptation.targetLanguage}
                    className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                  >
                    {/* Header */}
                    <button
                      onClick={() =>
                        setExpandedLang(isExpanded ? null : adaptation.targetLanguage)
                      }
                      className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-all"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}

                      <span className="text-2xl">{getFlagEmoji(adaptation.targetLanguage)}</span>

                      <span className="text-sm font-semibold text-white">
                        {lang?.name || adaptation.targetLanguage}
                      </span>

                      <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                        <span>
                          {adaptation.culturalNotes.length} cultural notes
                        </span>
                        <span>·</span>
                        <span>
                          {adaptation.seoRecommendations.length} SEO tips
                        </span>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-4">
                        {/* Cultural Notes */}
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Cultural Considerations
                          </div>
                          <ul className="space-y-1.5">
                            {adaptation.culturalNotes.map((note, index) => (
                              <li
                                key={index}
                                className="text-xs text-gray-300 flex items-start gap-2"
                              >
                                <span className="text-purple-400 mt-0.5">•</span>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Content Adjustments */}
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            Content Adjustments
                          </div>
                          <ul className="space-y-1.5">
                            {adaptation.contentAdjustments.map((adjustment, index) => (
                              <li
                                key={index}
                                className="text-xs text-gray-300 flex items-start gap-2"
                              >
                                <span className="text-blue-400 mt-0.5">•</span>
                                <span>{adjustment}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* SEO Recommendations */}
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                            SEO Recommendations
                          </div>
                          <ul className="space-y-1.5">
                            {adaptation.seoRecommendations.map((rec, index) => (
                              <li
                                key={index}
                                className="text-xs text-gray-300 flex items-start gap-2"
                              >
                                <span className="text-emerald-400 mt-0.5">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Download Components */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-300">
              i18n Implementation
            </div>

            {/* Language Switcher */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">
                    Language Switcher Component
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySwitcher}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                    title="Copy to clipboard"
                  >
                    {copiedItem === 'switcher' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={handleDownloadSwitcher}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                    title="Download component"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Ready-to-use React component for language switching
              </p>
            </div>

            {/* i18n Config */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-white">
                    Next.js i18n Configuration
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyI18n}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                    title="Copy to clipboard"
                  >
                    {copiedItem === 'i18n' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={handleDownloadI18n}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                    title="Download config"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Configuration for Next.js Pages Router or App Router
              </p>
            </div>
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Get flag emoji for language code
 */
function getFlagEmoji(langCode: string): string {
  const flags: Record<string, string> = {
    en: '🇬🇧',
    de: '🇩🇪',
    fr: '🇫🇷',
    es: '🇪🇸',
    it: '🇮🇹',
    pt: '🇵🇹',
    nl: '🇳🇱',
    pl: '🇵🇱',
  };
  return flags[langCode] || '🌐';
}
