'use client';

import { DesignConfig } from '@/types';
import { DESIGN_PRESETS, DesignStyle } from '@/modules/design/data/design-presets';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Wand2, RefreshCw, Palette, ChevronRight, ChevronLeft, Sparkles, Eye, Skull } from 'lucide-react';
// Note: Mockup generation is handled by page.tsx via the onGenerate prop
import { MockupSiteData } from '@/types';
import { ArchetypeSelector } from './archetype-selector';
import { DesignLevelSelector, type DesignLevel } from './design-level-selector';

interface DesignStudioProps {
    config: DesignConfig;
    setConfig: (fn: (prev: DesignConfig) => DesignConfig) => void;
    extractedColors?: {
        dominant?: string[];
        background?: string | string[];
        text?: string | string[];
        primary?: string;
        secondary?: string;
        accent?: string;
        _raw?: { backgrounds: string[], texts: string[] };
    };
    siteData?: MockupSiteData;
    onNext?: () => void;
    onBack?: () => void;
    onGenerate?: () => void;
    isGenerating?: boolean;
    embedded?: boolean;
}

export function DesignStudio({ config, setConfig, extractedColors, siteData, onNext, onBack, onGenerate, isGenerating = false, embedded = false }: DesignStudioProps) {
    const updateColor = (key: keyof typeof config.colors, value: string) => {
        setConfig(prev => ({
            ...prev,
            colors: { ...prev.colors, [key]: value }
        }));
    };

    const applyExtractedPalette = () => {
        if (!extractedColors) return;

        // 1. Try Semantic Colors
        if (extractedColors.primary) {
            setConfig(prev => ({
                ...prev,
                colors: {
                    primary: extractedColors.primary || '#3b82f6',
                    secondary: extractedColors.secondary || '#64748b',
                    background: (typeof extractedColors.background === 'string' ? extractedColors.background : extractedColors.background?.[0]) || '#ffffff',
                    text: (typeof extractedColors.text === 'string' ? extractedColors.text : extractedColors.text?.[0]) || '#0f172a',
                    accent: extractedColors.accent || '#f59e0b'
                }
            }));
            return;
        }

        // 2. Fallback: Legacy Arrays
        if (extractedColors.dominant && Array.isArray(extractedColors.dominant)) {
            const dom = extractedColors.dominant;
            const bg = Array.isArray(extractedColors.background) ? extractedColors.background : [];
            const txt = Array.isArray(extractedColors.text) ? extractedColors.text : [];

            setConfig(prev => ({
                ...prev,
                colors: {
                    primary: dom[0] || '#3b82f6',
                    secondary: dom[1] || '#64748b',
                    background: bg[0] || '#ffffff',
                    text: txt[0] || '#0f172a',
                    accent: dom[2] || '#f59e0b'
                }
            }));
        }
    };

    return (
        <div className={cn(
            "animate-in fade-in slide-in-from-right-8",
            embedded ? "pb-4" : "pb-20"
        )}>
            {/* Centered Single Layout */}
            <div className="max-w-[1440px] mx-auto space-y-8">

                {/* Settings Panel */}
                <div className="space-y-6">

                    {/* DESIGN LEVEL SELECTOR */}
                    <section className="space-y-3">
                        <DesignLevelSelector
                            selected={config.designLevel || 'standard'}
                            onChange={(level: DesignLevel) =>
                                setConfig((prev) => ({
                                    ...prev,
                                    designLevel: level,
                                }))
                            }
                        />
                    </section>

                    {/* ARCHETYPE SELECTOR (for all levels) */}
                    <section className="space-y-3">
                        <ArchetypeSelector
                            selected={config.selectedArchetype}
                            designLevel={config.designLevel || 'standard'}
                            onChange={(archetypeId) =>
                                setConfig((prev) => ({
                                    ...prev,
                                    selectedArchetype: archetypeId,
                                }))
                            }
                        />
                    </section>

                            {/* COLORS */}
                            <section className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-pink-400" />
                                        Color Palette
                                    </h3>
                                    {extractedColors && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={applyExtractedPalette}
                                            className="text-[10px] h-6 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                        >
                                            <RefreshCw className="w-3 h-3 mr-1" /> Apply Extracted
                                        </Button>
                                    )}
                                </div>
                                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-3 grid grid-cols-5 gap-3">
                                    {Object.entries(config.colors).map(([key, value]) => (
                                        <div key={key} className="space-y-1">
                                            <label className="text-[10px] text-gray-500 capitalize">{key}</label>
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="w-6 h-6 rounded-full border border-white/10 shadow-inner flex-shrink-0"
                                                    style={{ backgroundColor: value }}
                                                />
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => updateColor(key as any, e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 text-[10px] text-white font-mono focus:border-purple-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                    {/* DESIGN PROMPT */}
                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-amber-400" />
                            Design Instructions
                        </h3>
                        <textarea
                            value={config.customInstructions}
                            onChange={(e) => setConfig(p => ({ ...p, customInstructions: e.target.value }))}
                            placeholder="e.g. 'Apple-style minimalism, glassmorphism effects, subtle gradients...'"
                            className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-purple-500 focus:outline-none resize-none"
                        />
                    </section>

                    {/* GENERATE BUTTON */}
                    <Button
                        onClick={onGenerate}
                        disabled={isGenerating || !config.selectedArchetype}
                        className="w-full h-12 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-red-900/30"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating Ultra-Extreme Mockup (5 stages)...
                            </>
                        ) : !config.selectedArchetype ? (
                            <>
                                <Skull className="w-4 h-4 mr-2" />
                                Select an Archetype First
                            </>
                        ) : (
                            <>
                                <Skull className="w-4 h-4 mr-2" />
                                💀 Generate 3 Ultra-Extreme Mockups (5-Stage)
                            </>
                        )}
                    </Button>

                    {/* View/Next Button */}
                    {config.mockupHtml && !isGenerating && (
                        <Button
                            onClick={onNext}
                            className="w-full h-12 bg-white text-black hover:bg-gray-200 font-semibold shadow-xl hover:scale-105 transition-all mt-4"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View Full Preview
                        </Button>
                    )}
                </div>
            </div>

            {/* NAVIGATION (Only show if not embedded) */}
            {!embedded && onBack && onNext && (
                <div className="flex justify-between pt-8 mt-8 border-t border-white/10">
                    <Button onClick={onBack} variant="outline" className="bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Blueprint
                    </Button>
                    <Button
                        onClick={onNext}
                        disabled={!config.mockupHtml}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 shadow-lg"
                    >
                        {config.mockupHtml ? 'Proceed with this Design' : 'Generate a Mockup First'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            )}
        </div>
    );
}
