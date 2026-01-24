'use client';

import { DesignConfig } from '@/types';
import { DESIGN_PRESETS, DesignStyle } from '@/modules/design/data/design-presets';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Wand2, RefreshCw, Palette, Type, Layout, Check, ChevronRight, ChevronLeft, Moon, Sun, Circle, Hexagon, Square, Sparkles, Eye, Play, Loader2, Zap, Flame, Film, Cpu, Crown, Sprout } from 'lucide-react';
// Note: Mockup generation is handled by page.tsx via the onGenerate prop
import { toast } from 'sonner';
import { MockupSiteData } from '@/types';

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

// Typography options with preview fonts
const TYPOGRAPHY_OPTIONS = [
    { value: 'modern', label: 'Modern', font: 'Inter, system-ui, sans-serif', preview: 'Aa' },
    { value: 'classic', label: 'Classic', font: 'Georgia, Times New Roman, serif', preview: 'Aa' },
    { value: 'tech', label: 'Tech', font: 'JetBrains Mono, Consolas, monospace', preview: 'Aa' },
    { value: 'humanist', label: 'Humanist', font: 'Nunito, Open Sans, sans-serif', preview: 'Aa' },
];

// Static Preview Component - Shows live preview of settings before AI generation
function StaticPreview({ config }: { config: DesignConfig }) {
    const getRoundnessClass = () => {
        switch (config.roundness) {
            case 'sharp': return 'rounded-none';
            case 'full': return 'rounded-full';
            default: return 'rounded-xl';
        }
    };

    const getTypographyFont = () => {
        const typo = TYPOGRAPHY_OPTIONS.find(t => t.value === config.typography);
        return typo?.font || 'Inter, system-ui, sans-serif';
    };

    // Automatic color palettes based on theme
    const lightPalette = {
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#64748b',
        border: '#e2e8f0',
        pattern: '#e2e8f0'
    };

    const darkPalette = {
        background: '#0a0a0f',
        surface: '#111118',
        text: '#f1f5f9',
        textMuted: '#94a3b8',
        border: '#1e293b',
        pattern: config.colors.primary
    };

    // Select palette based on theme
    const palette = config.theme === 'dark' ? darkPalette : lightPalette;

    const selectedStyles = config.styleIds.map(id =>
        DESIGN_PRESETS.find(p => p.id === id)?.name || id
    ).join(', ') || 'Modern';

    return (
        <div
            className={cn("min-h-[400px] flex flex-col relative overflow-hidden transition-all duration-300")}
            style={{
                backgroundColor: palette.background,
                fontFamily: getTypographyFont()
            }}
        >
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `radial-gradient(${palette.pattern} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Header Area */}
            <div
                className={cn("p-4 border-b flex items-center justify-between relative z-10")}
                style={{ borderColor: palette.border }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className={cn("w-8 h-8 flex items-center justify-center", getRoundnessClass())}
                        style={{ backgroundColor: config.colors.primary }}
                    >
                        <span className="text-white text-sm font-bold">W</span>
                    </div>
                    <span className="font-semibold text-sm" style={{ color: palette.text }}>
                        Website
                    </span>
                </div>
                <div className="flex gap-3">
                    {['Home', 'About', 'Contact'].map(item => (
                        <span key={item} className="text-xs" style={{ color: palette.textMuted }}>
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10 gap-4">
                <h1 className="text-2xl font-bold" style={{ color: palette.text }}>
                    Welcome to Your Site
                </h1>
                <p className="text-sm max-w-xs" style={{ color: palette.textMuted }}>
                    This is a live preview of your design settings.
                </p>
                <button
                    className={cn("px-6 py-2 text-sm font-medium shadow-lg transition-all", getRoundnessClass())}
                    style={{ backgroundColor: config.colors.primary, color: '#fff' }}
                >
                    Call to Action
                </button>
            </div>

            {/* Footer with style info */}
            <div
                className="p-3 text-center border-t relative z-10"
                style={{ borderColor: palette.border }}
            >
                <span className="text-[10px] uppercase tracking-wider" style={{ color: palette.textMuted }}>
                    {selectedStyles} • {config.theme === 'dark' ? 'Dunkel' : 'Hell'} • {config.roundness}
                </span>
            </div>
        </div>
    );
}

export function DesignStudio({ config, setConfig, extractedColors, siteData, onNext, onBack, onGenerate, isGenerating = false, embedded = false }: DesignStudioProps) {
    const [styleUrl, setStyleUrl] = useState('');
    const [isExtractingStyle, setIsExtractingStyle] = useState(false);
    const [inputColors, setInputColors] = useState('');
    const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);

    const handleGeneratePalette = async () => {
        if (!inputColors) return toast.error("Please enter at least one color (e.g. #3b82f6)");
        setIsGeneratingPalette(true);
        try {
            const colors = inputColors.split(',').map(c => c.trim()).filter(c => c);
            const { generateDesignPaletteAction } = await import('@/app/actions');
            const res = await generateDesignPaletteAction(colors, config.customInstructions);

            if (res.success && res.data) {
                const d = res.data;
                setConfig(prev => ({
                    ...prev,
                    colors: d.colors,
                    typography: ['modern', 'classic', 'tech', 'humanist'].includes(d.typography.style) ? d.typography.style : 'modern',
                }));
                toast.success(`Generated! Suggested Fonts: ${d.typography.headline} + ${d.typography.body}`);
            } else {
                toast.error("Failed to generate palette");
            }
        } catch (e) {
            toast.error("Error generating palette");
        } finally {
            setIsGeneratingPalette(false);
        }
    };

    const handleExtractStyle = async () => {
        if (!styleUrl) return toast.error("Please enter a URL");
        setIsExtractingStyle(true);
        try {
            const { extractStyleAction } = await import('@/app/actions');
            const res = await extractStyleAction(styleUrl);

            if (res.success && res.data) {
                const style = res.data;
                console.log('Extracted Style:', style);

                setConfig(prev => ({
                    ...prev,
                    colors: style.colors || prev.colors,
                    roundness: style.roundness || prev.roundness,
                    typography: style.typography || prev.typography,
                    theme: style.theme || prev.theme,
                    styleIds: style.style_tags && Array.isArray(style.style_tags) ? style.style_tags : prev.styleIds,
                    customInstructions: (prev.customInstructions ? prev.customInstructions + '\n\n' : '') +
                        (style.replication_strategy ? `REPLICATION STRATEGY: ${style.replication_strategy}` : `Match vibe: ${style.vibe_description}`)
                }));
                toast.success(`Style extracted from ${new URL(styleUrl).hostname}`);
            } else {
                toast.error("Failed to extract style");
            }
        } catch (e) {
            toast.error("Error extracting style");
        } finally {
            setIsExtractingStyle(false);
        }
    };

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
    const toggleStyle = (id: DesignStyle) => {
        config.styleIds.includes(id)
            ? setConfig(prev => ({ ...prev, styleIds: prev.styleIds.filter(s => s !== id) }))
            : setConfig(prev => ({ ...prev, styleIds: [...prev.styleIds, id] }));
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

                    {/* UNLEASHED MODE TOGGLE - EXPLICITLY RE-RENDERED */}
                    <section className="space-y-3 block relative z-50">
                        <div className={cn(
                            "border rounded-xl p-4 transition-all duration-300 relative overflow-hidden",
                            config.unleashedMode !== 'off'
                                ? "bg-gradient-to-r from-orange-950/40 to-red-950/40 border-orange-500/50 shadow-lg shadow-orange-900/20"
                                : "bg-white/5 border-white/10"
                        )}>
                            {/* Background Effects for Active Mode */}
                            {config.unleashedMode !== 'off' && (
                                <div className="absolute inset-0 z-0 pointer-events-none">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/10 blur-[40px] rounded-full" />
                                </div>
                            )}

                            <div className="relative z-10">
                                <h4 className={cn(
                                    "text-sm font-bold flex items-center gap-2 mb-2",
                                    config.unleashedMode !== 'off' ? "text-orange-300" : "text-gray-300"
                                )}>
                                    <Flame className={cn("w-4 h-4", config.unleashedMode !== 'off' && "text-orange-500 animate-pulse")} />
                                    Unleashed Mode
                                </h4>
                                <p className="text-[10px] text-gray-400 mb-4 max-w-[90%]">
                                    Override all safety protocols. AI has maximum creative freedom.
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setConfig(p => ({ ...p, unleashedMode: 'off' }))}
                                        className={cn(
                                            "py-2 px-3 rounded-lg text-xs font-semibold transition-all border",
                                            config.unleashedMode === 'off'
                                                ? "bg-gray-700/50 border-gray-500 text-white"
                                                : "bg-black/20 border-transparent text-gray-500 hover:bg-black/40"
                                        )}
                                    >
                                        OFF
                                    </button>
                                    <button
                                        onClick={() => setConfig(p => ({ ...p, unleashedMode: 'on-with-colors' }))}
                                        className={cn(
                                            "py-2 px-3 rounded-lg text-xs font-semibold transition-all border flex flex-col items-center gap-0.5",
                                            config.unleashedMode === 'on-with-colors'
                                                ? "bg-orange-500/20 border-orange-500 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                                : "bg-black/20 border-transparent text-gray-500 hover:bg-orange-900/20 hover:text-orange-400"
                                        )}
                                    >
                                        <span>ON (Keep Colors)</span>
                                    </button>
                                    <button
                                        onClick={() => setConfig(p => ({ ...p, unleashedMode: 'on' }))}
                                        className={cn(
                                            "py-2 px-3 rounded-lg text-xs font-semibold transition-all border",
                                            config.unleashedMode === 'on'
                                                ? "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse-slow"
                                                : "bg-black/20 border-transparent text-gray-500 hover:bg-red-900/20 hover:text-red-400"
                                        )}
                                    >
                                        ON (TOTAL CHAOS)
                                    </button>
                                </div>

                                {/* ARCHETYPE SELECTOR (Only when Unleashed is ON) */}
                                {config.unleashedMode !== 'off' && (
                                    <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 fade-in">
                                        <h5 className="text-[11px] font-semibold text-orange-200/80 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                            <Wand2 className="w-3 h-3" />
                                            Select Unleashed Flavor
                                        </h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'chaos', label: 'Chaos Engine', icon: Zap, desc: 'Break grids, overlap, clashing colors.' },
                                                { id: 'cinematic', label: 'Cinematic', icon: Film, desc: 'Atmospheric depth, parallax, spotlight.' },
                                                { id: 'hightech', label: 'Cyber / HUD', icon: Cpu, desc: 'Glass, data-overlays, neon grids.' },
                                                { id: 'luxury', label: 'Editorial', icon: Crown, desc: 'Massive type, minimal, high-fashion.' },
                                                { id: 'swiss', label: 'Swiss Digital', icon: Layout, desc: 'Mathematical grid, bold, red/black/white.' },
                                                { id: 'neobrutalist', label: 'Neo-Brutal', icon: Square, desc: 'Thick borders, hard shadows, raw vibe.' },
                                                { id: 'vaporwave', label: 'Vaporwave', icon: Flame, desc: '80s aesthetics, neon pink, dreamlike.' },
                                                { id: 'mirage', label: 'Mirage', icon: Sparkles, desc: 'Ethereal glass, borderless, deep blur.' },
                                                { id: 'acid', label: 'Acid Chrome', icon: Zap, desc: 'Liquid metal, Y2K iridescence, warped.' },
                                                { id: 'solar', label: 'Solar Red', icon: Zap, desc: 'Thermal vision, high contrast, red-shift.' },
                                                { id: 'windows95', label: 'Retro OS', icon: Cpu, desc: 'Win95 style, beveled, teal desktop.' },
                                                { id: 'organic', label: 'Bio-Organic', icon: Sprout, desc: 'Fluid blobs, earthy, soft shadows.' }
                                            ].map((arch) => (
                                                <button
                                                    key={arch.id}
                                                    onClick={() => setConfig(p => ({ ...p, unleashedArchetype: arch.id as any }))}
                                                    className={cn(
                                                        "p-2 rounded-lg border text-left transition-all relative overflow-hidden group",
                                                        (config.unleashedArchetype || 'chaos') === arch.id
                                                            ? "bg-orange-500/20 border-orange-500 text-white shadow-[inset_0_0_10px_rgba(249,115,22,0.2)]"
                                                            : "bg-black/40 border-white/5 hover:border-orange-500/30 text-gray-400 hover:text-gray-200"
                                                    )}
                                                >
                                                    <div className="relative z-10 flex items-start gap-2">
                                                        <arch.icon className={cn(
                                                            "w-4 h-4 mt-0.5 shrink-0 transition-colors",
                                                            (config.unleashedArchetype || 'chaos') === arch.id ? "text-orange-400" : "text-gray-600 group-hover:text-orange-400"
                                                        )} />
                                                        <div>
                                                            <div className="text-xs font-bold">{arch.label}</div>
                                                            <div className="text-[9px] opacity-70 leading-tight mt-0.5">{arch.desc}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {config.unleashedMode === 'off' && (
                        <>
                            {/* STYLE GRID with Visual Hints */}
                            <section className="space-y-3">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Layout className="w-4 h-4 text-purple-400" />
                                    Core Aesthetics
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                    {DESIGN_PRESETS.map((style) => {
                                        const isSelected = config.styleIds.includes(style.id);
                                        return (
                                            <button
                                                key={style.id}
                                                onClick={() => toggleStyle(style.id)}
                                                className={cn(
                                                    "relative p-3 rounded-lg border text-left transition-all hover:border-purple-500/50 group",
                                                    isSelected
                                                        ? "bg-purple-500/20 border-purple-500 ring-1 ring-purple-500/50"
                                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{style.icon}</span>
                                                    <div className="flex-1">
                                                        <span className="font-medium text-xs text-white block">{style.name}</span>
                                                        <span className="text-[9px] text-gray-500 line-clamp-1">{style.description}</span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* STYLE REFERENCE */}
                            <section className="space-y-3">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-400" />
                                    Style Reference
                                </h3>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            value={styleUrl}
                                            onChange={(e) => setStyleUrl(e.target.value)}
                                            placeholder="https://example-style.com"
                                            className="flex-1 bg-[#0A0A0A] border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleExtractStyle}
                                            disabled={isExtractingStyle || !styleUrl}
                                            className="h-8 text-[10px] bg-white/10 hover:bg-white/20"
                                        >
                                            {isExtractingStyle ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Extract"}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        Paste a URL to extract its colors, typography, and vibe.
                                    </p>
                                </div>
                            </section>

                            {/* THEME & ROUNDNESS */}
                            <section className="grid grid-cols-2 gap-4">
                                {/* Theme - Light/Dark with Preview */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-500">Theme</label>
                                    <div className="flex gap-2">
                                        {(['light', 'dark'] as const).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setConfig(p => ({ ...p, theme: t }))}
                                                className={cn(
                                                    "flex-1 p-3 rounded-lg border transition-all flex flex-col items-center gap-2",
                                                    config.theme === t
                                                        ? "bg-purple-500/20 border-purple-500 ring-1 ring-purple-500/50"
                                                        : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                {/* Mini Preview */}
                                                <div
                                                    className={cn(
                                                        "w-full h-10 rounded-md flex items-center justify-center border",
                                                        t === 'light' ? "bg-white border-gray-200" : "bg-gray-900 border-gray-700"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-6 h-2 rounded-full",
                                                        t === 'light' ? "bg-gray-800" : "bg-white"
                                                    )} />
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    {t === 'light' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                                                    <span className={config.theme === t ? "text-white" : "text-gray-400"}>
                                                        {t === 'light' ? 'Hell' : 'Dunkel'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Roundness with Visual Preview */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                        <Circle className="w-3 h-3" /> Roundness
                                    </label>
                                    <div className="flex gap-2">
                                        {[
                                            { val: 'sharp', label: 'Eckig', radius: 'rounded-none' },
                                            { val: 'default', label: 'Normal', radius: 'rounded-lg' },
                                            { val: 'full', label: 'Weich', radius: 'rounded-2xl' }
                                        ].map((item) => (
                                            <button
                                                key={item.val}
                                                onClick={() => setConfig(p => ({ ...p, roundness: item.val as any }))}
                                                className={cn(
                                                    "flex-1 p-2 rounded-lg border flex flex-col items-center gap-1.5 transition-all",
                                                    config.roundness === item.val
                                                        ? "bg-purple-500/20 border-purple-500 text-purple-300"
                                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                                )}
                                            >
                                                {/* Visual Preview of Roundness */}
                                                <div
                                                    className={cn("w-8 h-8 bg-purple-500/50 border border-purple-400", item.radius)}
                                                />
                                                <span className="text-[9px]">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            {/* CREATIVITY & FOCUS */}
                            <section className="space-y-3">


                                {!config.unleashedMode && (
                                    <>
                                        <section className="space-y-2">
                                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <Zap className="w-3 h-3 text-amber-400" /> Creativity Level
                                            </label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[
                                                    { val: 'standard', label: 'Standard', desc: 'Clean & Safe' },
                                                    { val: 'balanced', label: 'Balanced', desc: 'Modern mix' },
                                                    { val: 'high', label: 'High', desc: 'Bold choices' },
                                                    { val: 'experimental', label: 'Extreme', desc: 'Unique layouts' }
                                                ].map((item) => (
                                                    <button
                                                        key={item.val}
                                                        onClick={() => setConfig(p => ({ ...p, creativity: item.val as any }))}
                                                        className={cn(
                                                            "p-2 rounded-lg border flex flex-col items-center gap-1 transition-all",
                                                            (config.creativity || 'balanced') === item.val
                                                                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                                                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <span className="text-[10px] font-semibold">{item.label}</span>
                                                        <span className="text-[8px] opacity-60">{item.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="space-y-2">
                                            <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                                <Layout className="w-3 h-3" /> Creative Focus Areas
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {['header', 'footer', 'navigation', 'layout', 'typography'].map((area) => {
                                                    const isSelected = (config.creativeFocus || []).includes(area as any);
                                                    return (
                                                        <button
                                                            key={area}
                                                            onClick={() => setConfig(p => {
                                                                const current = p.creativeFocus || [];
                                                                return {
                                                                    ...p,
                                                                    creativeFocus: isSelected
                                                                        ? current.filter(c => c !== area)
                                                                        : [...current, area as any]
                                                                };
                                                            })}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-full border text-[10px] font-medium transition-all flex items-center gap-1.5",
                                                                isSelected
                                                                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                                                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                                            )}
                                                        >
                                                            {isSelected && <Check className="w-2.5 h-2.5" />}
                                                            <span className="capitalize">{area}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[9px] text-gray-600">
                                                Select areas where AI should break conventions (e.g. asymmetrical headers, side navigation, oversized typography).
                                            </p>
                                        </section>
                                    </>
                                )}
                            </section>

                            {/* TYPOGRAPHY with Font Preview */}
                            <section className="space-y-3">
                                <h3 className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                                    <Type className="w-3 h-3" /> Typography
                                </h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {TYPOGRAPHY_OPTIONS.map((typo) => (
                                        <button
                                            key={typo.value}
                                            onClick={() => setConfig(p => ({ ...p, typography: typo.value as any }))}
                                            className={cn(
                                                "p-3 rounded-lg border flex flex-col items-center gap-2 transition-all",
                                                config.typography === typo.value
                                                    ? "bg-purple-500/20 border-purple-500 ring-1 ring-purple-500/50"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            {/* Font Preview */}
                                            <span
                                                className="text-2xl text-white"
                                                style={{ fontFamily: typo.font }}
                                            >
                                                {typo.preview}
                                            </span>
                                            <span className={cn(
                                                "text-[10px]",
                                                config.typography === typo.value ? "text-purple-300" : "text-gray-500"
                                            )}>
                                                {typo.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {config.unleashedMode !== 'on' && (
                        <>
                            {/* COLORS */}
                            <section className="space-y-3">
                                {/* SMART GENERATOR */}
                                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-purple-500/20 rounded-xl p-3 mb-4">
                                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-2 mb-2">
                                        <Sparkles className="w-3 h-3" /> Smart Palette Generator
                                    </h4>
                                    <div className="flex gap-2">
                                        <input
                                            value={inputColors}
                                            onChange={(e) => setInputColors(e.target.value)}
                                            placeholder="e.g. #000000, #ff0000"
                                            className="flex-1 bg-[#0A0A0A] border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleGeneratePalette}
                                            disabled={isGeneratingPalette || !inputColors}
                                            className="h-8 text-[10px] bg-purple-600 hover:bg-purple-500 text-white"
                                        >
                                            {isGeneratingPalette ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Auto-Generate"}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Enter 1-3 base colors. AI will generate the rest + matching fonts.
                                    </p>
                                </div>

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
                        </>
                    )}

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
                        disabled={isGenerating}
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-900/30"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating Mockup...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate AI Mockup
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
