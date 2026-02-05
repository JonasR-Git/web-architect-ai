/**
 * Component Library Generator UI
 *
 * UI for extracting and downloading React components from mockup HTML
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  Code2,
  FileCode,
  Package,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useComponentLibrary } from '../hooks/use-component-library';
import type { ExtractedComponent } from '../services/component-extractor';
import { toast } from 'sonner';

interface ComponentLibraryGeneratorProps {
  mockupHtml: string;
}

export function ComponentLibraryGenerator({
  mockupHtml,
}: ComponentLibraryGeneratorProps) {
  const {
    isGenerating,
    library,
    error,
    generateFromHTML,
    downloadAsZip,
    downloadComponent,
    copyComponent,
  } = useComponentLibrary();

  const [copiedComponent, setCopiedComponent] = useState<string | null>(null);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(
    new Set()
  );
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    try {
      await generateFromHTML(mockupHtml);
      setHasGenerated(true);
      toast.success('Component library generated successfully');
    } catch (err) {
      toast.error('Failed to generate component library');
      console.error(err);
    }
  };

  const handleDownloadAll = async () => {
    if (!library) return;

    try {
      await downloadAsZip(library);
      toast.success('Component library downloaded');
    } catch (err) {
      toast.error('Failed to download library');
      console.error(err);
    }
  };

  const handleCopyComponent = async (component: ExtractedComponent) => {
    try {
      await copyComponent(component);
      setCopiedComponent(component.name);
      toast.success(`${component.name} copied to clipboard`);

      setTimeout(() => setCopiedComponent(null), 2000);
    } catch (err) {
      toast.error('Failed to copy component');
      console.error(err);
    }
  };

  const toggleExpanded = (componentName: string) => {
    const next = new Set(expandedComponents);
    if (next.has(componentName)) {
      next.delete(componentName);
    } else {
      next.add(componentName);
    }
    setExpandedComponents(next);
  };

  const componentsByCategory: Record<string, ExtractedComponent[]> = {};
  if (library) {
    library.components.forEach((c) => {
      if (!componentsByCategory[c.category]) {
        componentsByCategory[c.category] = [];
      }
      componentsByCategory[c.category].push(c);
    });
  }

  const categoryIcons: Record<string, any> = {
    layout: Package,
    ui: Sparkles,
    content: FileCode,
    form: Code2,
    navigation: FileCode,
  };

  const categoryColors: Record<string, string> = {
    layout: 'text-blue-400',
    ui: 'text-purple-400',
    content: 'text-emerald-400',
    form: 'text-orange-400',
    navigation: 'text-cyan-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Component Library Generator
        </h3>
        <p className="text-sm text-gray-400">
          Extract reusable React components with TypeScript interfaces
        </p>
      </div>

      {!hasGenerated ? (
        /* Generate Button */
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Code2 className="w-4 h-4" />
          {isGenerating ? 'Generating Components...' : 'Generate Component Library'}
        </button>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Components
              </div>
              <div className="text-2xl font-bold text-purple-400">
                {library?.components.length || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">extracted</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Categories
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {Object.keys(componentsByCategory).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">types</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Props
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {library?.components.reduce((sum, c) => sum + c.props.length, 0) || 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">total</div>
            </div>
          </div>

          {/* Component List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Extracted Components
              </label>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm text-gray-300 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download All (.zip)
              </button>
            </div>

            {Object.entries(componentsByCategory).map(([category, components]) => {
              const CategoryIcon = categoryIcons[category] || FileCode;
              const categoryColor = categoryColors[category] || 'text-gray-400';

              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <CategoryIcon className={`w-4 h-4 ${categoryColor}`} />
                    <h4 className="text-sm font-semibold text-white capitalize">
                      {category}
                    </h4>
                    <span className="text-xs text-gray-500">
                      ({components.length})
                    </span>
                  </div>

                  <div className="space-y-2">
                    {components.map((component) => {
                      const isExpanded = expandedComponents.has(component.name);
                      const isCopied = copiedComponent === component.name;

                      return (
                        <div
                          key={component.name}
                          className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                        >
                          {/* Component Header */}
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3 flex-1">
                              <button
                                onClick={() => toggleExpanded(component.name)}
                                className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-all"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-white">
                                  {component.name}
                                </h5>
                                <p className="text-xs text-gray-400">
                                  {component.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span>{component.props.length} props</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleCopyComponent(component)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                                title="Copy component code"
                              >
                                {isCopied ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-400" />
                                )}
                              </button>

                              <button
                                onClick={() => downloadComponent(component)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
                                title="Download component"
                              >
                                <Download className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="border-t border-white/10 p-4 space-y-4">
                              {/* Usage Example */}
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                  Usage
                                </div>
                                <pre className="bg-black/40 rounded-lg p-3 overflow-x-auto">
                                  <code className="text-xs text-gray-300">
                                    {component.usage}
                                  </code>
                                </pre>
                              </div>

                              {/* Props Table */}
                              {component.props.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    Props
                                  </div>
                                  <div className="bg-black/40 rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead className="bg-white/5">
                                        <tr>
                                          <th className="text-left px-3 py-2 text-gray-400 font-medium">
                                            Name
                                          </th>
                                          <th className="text-left px-3 py-2 text-gray-400 font-medium">
                                            Type
                                          </th>
                                          <th className="text-left px-3 py-2 text-gray-400 font-medium">
                                            Required
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {component.props.map((prop) => (
                                          <tr
                                            key={prop.name}
                                            className="border-t border-white/5"
                                          >
                                            <td className="px-3 py-2 text-white font-mono">
                                              {prop.name}
                                            </td>
                                            <td className="px-3 py-2 text-blue-400 font-mono">
                                              {prop.type}
                                            </td>
                                            <td className="px-3 py-2">
                                              {prop.required ? (
                                                <span className="text-red-400">Yes</span>
                                              ) : (
                                                <span className="text-gray-500">No</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Dependencies */}
                              {component.dependencies.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                    Dependencies
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {component.dependencies.map((dep) => (
                                      <span
                                        key={dep}
                                        className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400 font-mono"
                                      >
                                        {dep}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">
              What's included in the library
            </h4>
            <ul className="text-xs text-gray-400 space-y-1.5">
              <li>✓ TypeScript component files (.tsx)</li>
              <li>✓ Props interfaces with JSDoc comments</li>
              <li>✓ Usage examples and documentation</li>
              <li>✓ package.json with dependencies</li>
              <li>✓ README.md with component catalog</li>
            </ul>
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
