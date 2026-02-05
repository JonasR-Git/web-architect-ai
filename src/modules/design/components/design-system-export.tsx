/**
 * Design System Export Component
 *
 * UI for exporting design tokens in multiple formats
 */

'use client';

import { useState } from 'react';
import { Download, Copy, Check, FileCode, Palette, Sparkles } from 'lucide-react';
import type { DesignConfig } from '@/types';
import {
  useDesignSystemExport,
  type ExportFormat,
} from '../hooks/use-design-system-export';
import { toast } from 'sonner';

interface DesignSystemExportProps {
  designConfig: DesignConfig;
}

export function DesignSystemExport({ designConfig }: DesignSystemExportProps) {
  const {
    isExporting,
    error,
    downloadDesignTokens,
    copyToClipboard,
    getTokensPreview,
  } = useDesignSystemExport();

  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(
    new Set(['css', 'tailwind', 'figma'])
  );

  const tokens = getTokensPreview(designConfig);

  const handleDownload = async () => {
    try {
      if (selectedFormats.size === 0) {
        toast.error('Please select at least one format');
        return;
      }

      const format: ExportFormat =
        selectedFormats.size === 3
          ? 'all'
          : (Array.from(selectedFormats)[0] as ExportFormat);

      await downloadDesignTokens(designConfig, format, {
        includeComments: true,
        formatPrettify: true,
      });

      toast.success(
        `Design tokens exported (${selectedFormats.size} ${selectedFormats.size === 1 ? 'file' : 'files'})`
      );
    } catch (err) {
      toast.error('Failed to export design tokens');
      console.error(err);
    }
  };

  const handleCopy = async (format: ExportFormat) => {
    try {
      await copyToClipboard(designConfig, format, {
        includeComments: true,
        formatPrettify: true,
      });

      setCopiedFormat(format);
      toast.success(`${format.toUpperCase()} tokens copied to clipboard`);

      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
      console.error(err);
    }
  };

  const toggleFormat = (format: ExportFormat) => {
    const next = new Set(selectedFormats);
    if (next.has(format)) {
      next.delete(format);
    } else {
      next.add(format);
    }
    setSelectedFormats(next);
  };

  const formatOptions = [
    {
      id: 'css' as ExportFormat,
      name: 'CSS Variables',
      description: 'CSS custom properties for use in any project',
      icon: FileCode,
      example: '--color-primary-500',
    },
    {
      id: 'tailwind' as ExportFormat,
      name: 'Tailwind Config',
      description: 'Tailwind CSS configuration file',
      icon: Palette,
      example: 'tailwind.config.js',
    },
    {
      id: 'figma' as ExportFormat,
      name: 'Figma Tokens',
      description: 'Import into Figma using Tokens Studio plugin',
      icon: Sparkles,
      example: 'figma-tokens.json',
    },
  ];

  const colorCount =
    Object.keys(tokens.colors.primary).length +
    Object.keys(tokens.colors.secondary).length +
    Object.keys(tokens.colors.neutral).length +
    Object.keys(tokens.colors.semantic).length;

  const typographyCount =
    Object.keys(tokens.typography.fontSizes).length +
    Object.keys(tokens.typography.fontWeights).length;

  const spacingCount =
    Object.keys(tokens.spacing).length +
    Object.keys(tokens.borderRadius).length +
    Object.keys(tokens.shadows).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Design System Export
        </h3>
        <p className="text-sm text-gray-400">
          Export your design tokens for use in code or design tools
        </p>
      </div>

      {/* Token Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Colors
          </div>
          <div className="text-2xl font-bold text-purple-400">{colorCount}</div>
          <div className="text-xs text-gray-500 mt-1">tokens</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Typography
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {typographyCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">tokens</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Spacing & More
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {spacingCount}
          </div>
          <div className="text-xs text-gray-500 mt-1">tokens</div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300">
          Select Export Formats
        </label>

        <div className="grid grid-cols-1 gap-3">
          {formatOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedFormats.has(option.id);
            const isCopied = copiedFormat === option.id;

            return (
              <div
                key={option.id}
                className={`
                  relative border rounded-lg p-4 transition-all cursor-pointer
                  ${
                    isSelected
                      ? 'bg-white/10 border-purple-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }
                `}
                onClick={() => toggleFormat(option.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-all
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

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${
                          isSelected
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-white/5 text-gray-500'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-1">
                      {option.name}
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      {option.description}
                    </p>
                    <code className="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">
                      {option.example}
                    </code>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(option.id);
                    }}
                    disabled={isExporting}
                    className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Copy to clipboard"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isExporting || selectedFormats.size === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        {isExporting
          ? 'Exporting...'
          : `Download ${selectedFormats.size === 3 ? 'All' : selectedFormats.size} File${selectedFormats.size === 1 ? '' : 's'}`}
      </button>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">
          How to use exported tokens
        </h4>
        <ul className="text-xs text-gray-400 space-y-1.5">
          <li>
            <strong className="text-gray-300">CSS:</strong> Import in your HTML
            or copy into your stylesheet
          </li>
          <li>
            <strong className="text-gray-300">Tailwind:</strong> Replace or
            extend your existing tailwind.config.js
          </li>
          <li>
            <strong className="text-gray-300">Figma:</strong> Import using
            Tokens Studio plugin for design consistency
          </li>
        </ul>
      </div>
    </div>
  );
}
