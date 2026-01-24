'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { TargetSlot, SectionImage } from './dual-panel-mapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Check,
    ChevronLeft,
    Sparkles,
    FileText,
    Plus,
    X,
    ArrowRight,
    Edit3,
    RefreshCw,
    Layout,
    Box,
    Type,
    Image as ImageIcon,
    MessageSquare,
    Video,
    MousePointerClick,
    Menu,
    AlignLeft,
    RotateCcw,
    Loader2,
    BrainCircuit,
    Grid,
    Quote,
    Magnet,
    ImagePlus,
    Star,
    Info,
    CheckCircle2,
    Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { detectDependenciesAction, regeneratePageSpecsAction } from '@/app/actions';
import { SiteStructure } from '@/types';

interface ContentReviewEditorProps {
    targets: TargetSlot[];
    structure: SiteStructure | null; // Needed for access to source content
    onUpdate: (updatedTargets: TargetSlot[]) => void;
    onApprove: () => void;
    onBack: () => void;
    sessionId?: string;
    isGenerating?: boolean;
    currentProgress?: number;
    totalProgress?: number;
    currentStep?: string;
    allImages?: any[];
    customAssets?: any[];
    onUpload?: (asset: any) => void;
}

const SECTION_ICONS: Record<string, any> = {
    hero: Layout,
    text: Type,
    features: Box,
    bento_grid: Grid,
    gallery: ImageIcon,
    testimonials: Quote,
    cta: MousePointerClick,
    form: MessageSquare,
    lead_magnet: Magnet,
    footer_minimal: AlignLeft,
    default: Box
};

export function ContentReviewEditor({
    targets,
    structure,
    onUpdate,
    onApprove,
    onBack,
    sessionId,
    isGenerating,
    currentProgress,
    totalProgress,
    currentStep,
    allImages = [],
    customAssets = [],
    onUpload
}: ContentReviewEditorProps) {
    const [localTargets, setLocalTargets] = useState<TargetSlot[]>(targets);
    const [swappingImage, setSwappingImage] = useState<{ targetId: string, sectionIdx: number } | null>(null);
    const [tempSelectedImages, setTempSelectedImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Deduplication & combined view
    const uniqueCombinedImages = useMemo(() => {
        const combined = [...customAssets, ...allImages];
        const seen = new Set();
        return combined.filter(img => {
            if (!img.src || seen.has(img.src)) return false;
            seen.add(img.src);
            return true;
        });
    }, [allImages, customAssets]);

    // Sync with progressive loading updates
    useEffect(() => {
        setLocalTargets(targets);
    }, [targets]);

    const [regeneratingIds, setRegeneratingIds] = useState<Record<string, boolean>>({});

    // Debounce timer for auto-dependency detection
    const [dependencyTimers, setDependencyTimers] = useState<Record<string, any>>({});

    // Auto-save changes locally
    const updateTarget = (id: string, updates: Partial<TargetSlot>) => {
        const updated = localTargets.map(t => {
            if (t.id === id) {
                // Gating logic: Mark as modified
                return { ...t, ...updates, lastModifiedAt: Date.now() };
            }
            return t;
        });
        setLocalTargets(updated);
        onUpdate(updated);
    };

    // --- ITERATIVE WORKFLOW HANDLERS ---

    const handleUndo = (targetId: string) => {
        const target = localTargets.find(t => t.id === targetId);
        if (target && target.previousState) {
            // Restore previous state but Keep History (allow toggle? No, strictly undo)
            // Actually, we consume the state. To allow redo, we'd need redo stack.
            // Requirement: Single Undo.
            const previous = target.previousState;
            updateTarget(targetId, {
                ...previous,
                previousState: undefined, // Consume undo
                lastModifiedAt: Date.now() // Treat as modification? Or revert timestamp?
            });
            toast.success("Changes undone");
        }
    };

    const handleFieldChange = (targetId: string, field: keyof TargetSlot, value: any) => {
        updateTarget(targetId, { [field]: value });
    };

    const handlePromptChange = (targetId: string, prompt: string) => {
        handleFieldChange(targetId, 'user_prompt', prompt);

        // Auto-detect dependencies on pause
        /*
        if (dependencyTimers[targetId]) clearTimeout(dependencyTimers[targetId]);

        const timer = setTimeout(async () => {
            // Only run if we have a prompt and structure
            const t = localTargets.find(t => t.id === targetId);
            if (!t || !t.user_prompt || !structure) return;

            // Don't re-run if detected recently? (Skipping optimization for now)
            const sitemapPaths = localTargets.map(lt => lt.path);

            // Optimistic UI? Maybe just a small indicator.
            // We won't block UI.
            try {
                const result = await detectDependenciesAction(t.path, t.user_prompt, sitemapPaths, sessionId);
                if (result.success && result.data?.dependencies) {
                    const newDeps = result.data.dependencies;
                    // Merge unique
                    const currentDeps = t.dependencies || [];
                    const merged = Array.from(new Set([...currentDeps, ...newDeps]));

                    if (merged.length !== currentDeps.length) {
                        updateTarget(targetId, { dependencies: merged, dependencies_detected: true });
                        toast.info(`Auto-detected dependencies: ${newDeps.join(', ')}`);
                    }
                }
            } catch (e) { console.error(e); }

        }, 1500); // 1.5s debounce

        setDependencyTimers(prev => ({ ...prev, [targetId]: timer }));
        */
    };

    const handleRegenerate = async (targetId: string) => {
        const target = localTargets.find(t => t.id === targetId);
        if (!target || !structure) return;

        setRegeneratingIds(prev => ({ ...prev, [targetId]: true }));

        try {
            // 1. Prepare Context Sources
            // Primary Source: Derived from sourceIds.
            // Issue: target.sourceIds are IDs like "source-0". We need to find the URL.
            // Since we don't have the original 'sources' array from DualPanelMapper prop here easily,
            // we rely on the fact that `migrationPlan` (which generated sources) is consistent?
            // BETTER: We look up Source Content directly via `structure`.
            // BUT: We need the URL of the source. `target.sourceIds` map to indices?
            // Actually, `TargetSlot` doesn't store source URLs directly by default, only IDs.
            // CRITICAL FIX: We need source URLs in the target.
            // In `page.tsx`, `handleGenerateSpecs` enriched targets with `sourceDetails`.
            // DOES `localTargets` here have `sourceDetails`?
            // Yes, if `page.tsx` passed the result of `generatePageSpecs` back to us.
            // `page.tsx` setPageSpecs(result.data). `result.data` has `sourceDetails`.
            // So `target.sourceDetails` should exist!

            // Wait, I updated `TargetSlot` interface in `dual-panel-mapper.tsx` but did I add `sourceDetails`?
            // I did NOT add `sourceDetails` to the interface in Step 3614.
            // I should add `sourceDetails` to the interface too, or type as `any`.
            // I will cast to `any` for now to avoid blocking, or quickly patch definitions later.

            const tAny = target as any;
            const primarySourceText = tAny.sourceDetails?.map((s: any) => s.content).join('\n\n') || '';

            // Secondary Sources: Look up content for dependencies path
            // We need to map PATH -> CONTENT.
            // structure.nodes have URL. `path` in dependencies is New Path.
            // This is tricky. Dependencies point to NEW pages (e.g. /galerie).
            // But we need content of OLD pages that feed into /galerie.
            // Heuristic: Find a target with path == dep, get its primary sources.

            const secondaryContexts = (target.dependencies || []).map(depPath => {
                // CORRECT LOGIC: Fetch from GLOBAL STRUCTURE (Crawled Data)
                const node = structure?.nodes?.find(n => new URL(n.url).pathname === depPath);
                if (node && node.content) {
                    return {
                        path: depPath,
                        content: node.content.rawText || ''
                    };
                }

                // Fallback: Check local targets if not found in structure (edge case)
                const depTarget = localTargets.find(lt => lt.path === depPath);
                if (depTarget) {
                    const content = (depTarget as any).sourceDetails?.map((s: any) => s.content).join('\n\n') || '';
                    return { path: depPath, content };
                }
                return null;
            }).filter(Boolean) as { path: string, content: string }[];

            const sitemapSummary = localTargets.map(t => t.path);

            // 2. Call AI
            const result = await regeneratePageSpecsAction(
                target,
                primarySourceText,
                secondaryContexts,
                sitemapSummary,
                target.user_prompt || '',
                sessionId
            );

            if (result.success && result.data) {
                // 3. Update State
                updateTarget(targetId, {
                    ...result.data,
                    previousState: target, // Save history
                    lastGeneratedAt: Date.now(),
                    dependencies_detected: false // Reset for next time? Or keep? Keep.
                });
                toast.success("Page regenerated successfully!");
            } else {
                toast.error("Regeneration failed: " + result.error);
            }

        } catch (e) {
            toast.error("Error regenerating page");
        } finally {
            setRegeneratingIds(prev => ({ ...prev, [targetId]: false }));
        }
    };

    const handleGoalChange = (targetId: string, goalIndex: number, value: string) => {
        const updated = localTargets.map(t => {
            if (t.id !== targetId) return t;
            const newGoals = [...(t.content_goals || [])];
            newGoals[goalIndex] = value;
            return { ...t, content_goals: newGoals };
        });
        setLocalTargets(updated);
        onUpdate(updated);
    };

    const addGoal = (targetId: string) => {
        const updated = localTargets.map(t => {
            if (t.id !== targetId) return t;
            return { ...t, content_goals: [...(t.content_goals || []), ""] };
        });
        setLocalTargets(updated);
        onUpdate(updated);
    };

    const removeGoal = (targetId: string, goalIndex: number) => {
        const updated = localTargets.map(t => {
            if (t.id !== targetId) return t;
            const newGoals = [...(t.content_goals || [])];
            newGoals.splice(goalIndex, 1);
            return { ...t, content_goals: newGoals };
        });
        setLocalTargets(updated);
        onUpdate(updated);
    };

    return (
        <div className="max-w-[1440px] mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <FileText className="text-blue-500" />
                        Content & Wireframe Review
                    </h2>
                    <p className="text-gray-400 max-w-2xl">
                        Review the detailed content plan for each page. The AI has analyzed your sources and generated a component structure for the new design.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onBack} className="bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20">
                        <ChevronLeft size={14} className="mr-2" /> Back
                    </Button>
                    <Button
                        onClick={onApprove}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg"
                    >
                        Approve & Plan <ArrowRight size={14} className="ml-2" />
                    </Button>
                </div>
            </div>

            {/* List of Pages */}
            <div className="grid gap-8">
                {localTargets.map((target, index) => (
                    <div
                        key={target.id}
                        className="bg-[#0A0A0B] border border-white/10 rounded-xl overflow-hidden shadow-xl"
                    >
                        {/* Page Header */}
                        <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-mono text-lg font-bold border border-blue-500/20">
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <code className="text-lg font-bold text-white tracking-tight">{target.path}</code>
                                        <div className="flex gap-2">
                                            <span className={cn(
                                                "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border",
                                                target.action === 'keep' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                    target.action === 'merge' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                            )}>
                                                {target.action}
                                            </span>
                                            {target.sections && (
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20">
                                                    {target.sections.length} Components
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 mt-3">
                                        {/* Row 1: Primary Merged Sources */}
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Primary Merged Content:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {(target as any).sourceDetails?.length > 0 ? (
                                                    (target as any).sourceDetails.map((src: any, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 max-w-full truncate" title={src.content?.substring(0, 100)}>
                                                            <ArrowRight className="w-3 h-3 text-gray-500" />
                                                            <span className="truncate max-w-[200px]">{src.path || src.url || src.id || 'Unknown Source'}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-600">
                                                        {target.sourceIds?.length || 0} sources (IDs: {target.sourceIds?.join(', ') || 'None'})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 2: Secondary / dependencies (Context) */}
                                        {target.dependencies && target.dependencies.length > 0 && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-blue-500/80 font-medium uppercase tracking-wider flex items-center gap-1">
                                                    <Sparkles size={8} /> Context / Subsources:
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                    {target.dependencies.map((dep: any, dIdx: number) => {
                                                        const depPath = typeof dep === 'string' ? dep : dep.path || dep.url || `unknown-${dIdx}`;
                                                        const node = structure?.nodes?.find(n => {
                                                            try {
                                                                return new URL(n.url).pathname === depPath;
                                                            } catch (e) {
                                                                return false;
                                                            }
                                                        });
                                                        const imgCount = node?.content?.images?.length || 0;
                                                        const wordCount = node?.content?.rawText?.split(/\s+/)?.length || 0;

                                                        return (
                                                            <div key={`${depPath}-${dIdx}`} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300 transition-colors hover:bg-blue-500/20 cursor-help"
                                                                title={`${imgCount} Images available, ~${wordCount} words of text context.`}>
                                                                <BrainCircuit size={10} />
                                                                <span className="font-mono">{depPath}</span>
                                                                <span className="text-[10px] text-blue-400/60 ml-1">
                                                                    ({imgCount} Imgs)
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div className="flex items-center gap-2">
                                {/* Undo Button */}
                                {target.previousState && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUndo(target.id)}
                                        className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                                        title="Undo last regeneration"
                                    >
                                        <RotateCcw size={14} className="mr-2" /> Undo
                                    </Button>
                                )}

                                {/* Regenerate Button */}
                                <Button
                                    size="sm"
                                    onClick={() => handleRegenerate(target.id)}
                                    disabled={regeneratingIds[target.id]}
                                    className={cn(
                                        "font-medium border border-blue-500/30",
                                        target.lastModifiedAt && (!target.lastGeneratedAt || target.lastModifiedAt > target.lastGeneratedAt)
                                            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 animate-pulse" // Highlight if modified
                                            : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                                    )}
                                >
                                    {regeneratingIds[target.id] ? (
                                        <><Loader2 size={14} className="mr-2 animate-spin" /> Generating...</>
                                    ) : (
                                        <><RefreshCw size={14} className="mr-2" /> Neu Generieren</>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                            {/* LEFT: Strategy & Goals (The "Briefing") */}
                            <div className="md:col-span-4 space-y-6 md:border-r border-b md:border-b-0 border-white/5 md:pr-6 pb-6 md:pb-0">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles size={12} className="text-blue-400" /> Page Strategy
                                    </label>
                                    <Textarea
                                        value={target.description || ''}
                                        onChange={(e) => handleFieldChange(target.id, 'description', e.target.value)}
                                        className="min-h-[120px] bg-black/30 border-white/10 text-sm leading-relaxed text-gray-300 resize-none focus:border-blue-500/50"
                                        placeholder="AI will generate a briefing here..."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                        Content Goals
                                        <Button
                                            onClick={() => addGoal(target.id)}
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 px-2 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                        >
                                            <Plus size={10} className="mr-1" /> Add
                                        </Button>
                                    </label>
                                    <div className="space-y-2">
                                        {target.content_goals && target.content_goals.length > 0 ? (
                                            target.content_goals.map((goal, i) => (
                                                <div key={i} className="flex items-start gap-2 group/goal">
                                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/40 shrink-0" />
                                                    <Input
                                                        value={goal}
                                                        onChange={(e) => handleGoalChange(target.id, i, e.target.value)}
                                                        className="h-7 text-sm bg-transparent border-0 border-b border-white/5 focus:border-blue-500/30 rounded-none px-0 py-1 shadow-none text-gray-300 placeholder:text-gray-700"
                                                    />
                                                    <button
                                                        onClick={() => removeGoal(target.id, i)}
                                                        className="mt-1.5 opacity-0 group-hover/goal:opacity-100 text-gray-600 hover:text-red-400 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-gray-600 text-xs italic">No specific goals set.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-white/5 my-4" />

                                {/* Change Requests & Context */}
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <Edit3 size={12} className="text-orange-400" /> Änderungswünsche (Prompt)
                                    </label>

                                    <Textarea
                                        value={target.user_prompt || ''} // Handle undefined
                                        onChange={(e) => handlePromptChange(target.id, e.target.value)}
                                        className="min-h-[80px] bg-black/30 border-orange-500/20 text-sm focus:border-orange-500/50 text-gray-200 placeholder:text-gray-600"
                                        placeholder="E.g. 'Make it punchier', 'Add Gallery Teaser'..."
                                    />

                                    {/* Detected Dependencies */}
                                    {target.dependencies && target.dependencies.length > 0 && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-bold text-blue-400">
                                                    Detected Context (Auto) 🔮
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {target.dependencies.map((dep: any, dIdx: number) => {
                                                    const depPath = typeof dep === 'string' ? dep : dep.path || dep.url || `unknown-${dIdx}`;
                                                    return (
                                                        <div key={`${depPath}-${dIdx}`} className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                                                            <FileText size={10} />
                                                            {depPath}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>


                            {/* RIGHT: Component Wireframe (The "Blueprint") */}
                            <div className="md:col-span-8 space-y-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Layout size={12} className="text-purple-400" /> Planned Component Structure
                                </label>

                                {
                                    target.sections && target.sections.length > 0 ? (
                                        <div className="space-y-4">
                                            {target.sections.map((section, idx) => {
                                                const Icon = SECTION_ICONS[section.type] || SECTION_ICONS.default;
                                                return (
                                                    <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors group">
                                                        {/* Section Header */}
                                                        <div className="flex items-start gap-3 mb-4">
                                                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 shrink-0">
                                                                <Icon size={16} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                                        {section.type}
                                                                    </span>
                                                                    <h4 className="text-sm font-medium text-gray-200 truncate">
                                                                        {section.title || 'Untitled Section'}
                                                                    </h4>
                                                                </div>
                                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                                    {section.content_hint}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Draft Content Editors */}
                                                        <div className="space-y-3 pl-11">
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Headline Draft</label>
                                                                <Input
                                                                    value={section.headline || ''}
                                                                    onChange={(e) => {
                                                                        // Deep update of sections
                                                                        const newSections = [...(target.sections || [])];
                                                                        newSections[idx] = { ...newSections[idx], headline: e.target.value };
                                                                        updateTarget(target.id, { sections: newSections });
                                                                    }}
                                                                    className="h-8 text-sm bg-black/40 border-white/5 focus:border-blue-500/30 text-white placeholder:text-gray-700"
                                                                    placeholder="Generated headline..."
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Body Copy Draft</label>
                                                                <Textarea
                                                                    value={section.content || ''}
                                                                    onChange={(e) => {
                                                                        const newSections = [...(target.sections || [])];
                                                                        newSections[idx] = { ...newSections[idx], content: e.target.value };
                                                                        updateTarget(target.id, { sections: newSections });
                                                                    }}
                                                                    className="min-h-[80px] text-sm bg-black/40 border-white/5 focus:border-blue-500/30 text-gray-300 placeholder:text-gray-700 resize-y"
                                                                    placeholder="Generated content draft..."
                                                                />
                                                            </div>

                                                            {/* Asset selection row */}
                                                            <div className="pt-2">
                                                                <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block mb-2">Assigned Visuals</label>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {section.images && section.images.length > 0 ? (
                                                                        section.images.map((img, imgIdx) => (
                                                                            <div key={imgIdx} className={cn(
                                                                                "relative group/img w-24 aspect-video rounded-lg overflow-hidden border bg-black/40 transition-all",
                                                                                img.status === 'mandatory' ? "border-amber-500/50 ring-1 ring-amber-500/30" : "border-white/10"
                                                                            )}>
                                                                                <img src={img.src} className="w-full h-full object-cover" alt="" />

                                                                                {/* Status Overlay */}
                                                                                {img.status === 'mandatory' && (
                                                                                    <div className="absolute top-1 left-1 bg-amber-500 text-black p-0.5 rounded shadow-lg z-10">
                                                                                        <Star size={8} fill="currentColor" />
                                                                                    </div>
                                                                                )}

                                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newSections = [...(target.sections || [])];
                                                                                            const newImgs = [...(newSections[idx].images || [])];
                                                                                            newImgs[imgIdx] = {
                                                                                                ...newImgs[imgIdx],
                                                                                                status: newImgs[imgIdx].status === 'mandatory' ? 'optional' : 'mandatory'
                                                                                            };
                                                                                            newSections[idx] = { ...newSections[idx], images: newImgs };
                                                                                            updateTarget(target.id, { sections: newSections });
                                                                                            toast.success(newImgs[imgIdx].status === 'mandatory' ? "Marked as Mandatory" : "Set to Optional");
                                                                                        }}
                                                                                        className={cn(
                                                                                            "p-1 transition-colors",
                                                                                            img.status === 'mandatory' ? "text-amber-400" : "text-gray-400 hover:text-amber-400"
                                                                                        )}
                                                                                        title={img.status === 'mandatory' ? "Make Optional" : "Make Mandatory"}
                                                                                    >
                                                                                        <Star size={14} fill={img.status === 'mandatory' ? "currentColor" : "none"} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newSections = [...(target.sections || [])];
                                                                                            const newImgs = [...(newSections[idx].images || [])];
                                                                                            newImgs.splice(imgIdx, 1);
                                                                                            newSections[idx] = { ...newSections[idx], images: newImgs };
                                                                                            updateTarget(target.id, { sections: newSections });
                                                                                        }}
                                                                                        className="p-1 text-red-400 hover:text-white transition-colors"
                                                                                        title="Remove image"
                                                                                    >
                                                                                        <X size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="text-[10px] text-gray-500 italic py-1 flex items-center gap-1">
                                                                            <Sparkles size={10} className="text-purple-400" />
                                                                            <span>Auto-Mode: AI picks best match</span>
                                                                        </div>
                                                                    )}
                                                                    <button
                                                                        onClick={() => {
                                                                            setSwappingImage({ targetId: target.id, sectionIdx: idx });
                                                                            setTempSelectedImages((section.images || []).map(i => i.src));
                                                                        }}
                                                                        className="w-24 aspect-video rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-600 hover:text-blue-400 hover:border-blue-500/50 transition-all bg-white/5"
                                                                    >
                                                                        <Plus size={14} />
                                                                        <span className="text-[8px] font-bold uppercase mt-1">Add Visual</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center bg-black/20 border border-white/5 rounded-xl border-dashed p-8 text-center">
                                            <Layout className="w-10 h-10 text-gray-700 mb-3" />
                                            <p className="text-sm text-gray-500 font-medium">No component structure generated yet.</p>
                                            <p className="text-xs text-gray-600 mt-1">Click "AI Refine" to generate a detailed wireframe.</p>
                                            <Button size="sm" variant="outline" className="mt-4 border-white/10 hover:bg-white/5 text-gray-400">
                                                Generate Structure
                                            </Button>
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    </div>

                ))}

                {/* LOADING PLACEHOLDER FOR NEXT PAGE */}
                {isGenerating && (
                    <div className="bg-[#0A0A0B]/50 border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4 animate-pulse border-dashed">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20" />
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin relative z-10" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-bold text-white tracking-wide">
                                {currentStep || "Generating next page..."}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                                Status: Page {Math.min((currentProgress || 0) + 1, (totalProgress || 1))} of {totalProgress}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Image Swap Modal / Overlay */}
            {
                swappingImage && (
                    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl animate-in fade-in flex items-center justify-center p-8">
                        <div className="bg-[#0D0D12] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Sparkles className="text-blue-400" /> Choose Section Asset
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">Select an image from the crawled content or upload your own to use in this section.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    const src = event.target?.result as string;
                                                    const newImg = { src, alt: file.name, role: 'uploaded' };
                                                    if (onUpload) onUpload(newImg);
                                                    setTempSelectedImages(prev => [...prev, src]);
                                                    toast.success("Image uploaded and selected!");
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-blue-500/30 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 gap-2"
                                    >
                                        <Upload size={16} />
                                        Upload Image
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setSwappingImage(null)} className="text-gray-400 hover:text-white">
                                        <X size={20} />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {uniqueCombinedImages
                                        .filter(i => i.src && !i.src.includes('logo'))
                                        .map((altImg, idx) => {
                                            const isSelected = tempSelectedImages.includes(altImg.src);
                                            const isUploaded = altImg.role === 'uploaded';
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setTempSelectedImages(prev =>
                                                            prev.includes(altImg.src)
                                                                ? prev.filter(s => s !== altImg.src)
                                                                : [...prev, altImg.src]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "group relative aspect-square bg-white/5 rounded-xl border transition-all hover:scale-[1.02] shadow-lg overflow-hidden",
                                                        isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-white/5 hover:border-white/20"
                                                    )}
                                                >
                                                    <img
                                                        src={altImg.src}
                                                        alt={altImg.alt}
                                                        className={cn(
                                                            "w-full h-full object-cover transition-transform duration-700",
                                                            isSelected ? "scale-105 opacity-60" : "group-hover:scale-110"
                                                        )}
                                                    />

                                                    {/* Uploaded Badge */}
                                                    {isUploaded && (
                                                        <div className="absolute top-2 left-2 bg-blue-500/80 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter z-10">
                                                            Uploaded
                                                        </div>
                                                    )}

                                                    {/* Selection Badge */}
                                                    <div className={cn(
                                                        "absolute inset-0 flex items-center justify-center transition-all",
                                                        isSelected ? "bg-blue-600/20 opacity-100" : "bg-black/40 opacity-0 group-hover:opacity-100"
                                                    )}>
                                                        {isSelected ? (
                                                            <div className="bg-blue-500 text-white p-1.5 rounded-full shadow-lg scale-110">
                                                                <Check size={16} strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-white/90 text-black px-2 py-1 rounded text-[10px] font-bold">SELECT</div>
                                                        )}
                                                    </div>

                                                    {/* Index Ribbon for Multi-select */}
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white/20">
                                                            {tempSelectedImages.indexOf(altImg.src) + 1}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                            <div className="p-4 bg-[#0A0A0E] border-t border-white/5 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    <span className="font-bold text-blue-400">{tempSelectedImages.length}</span> images selected
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setSwappingImage(null)} className="border-white/10 text-gray-400">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            const { targetId, sectionIdx } = swappingImage;
                                            const target = localTargets.find(t => t.id === targetId);
                                            if (target) {
                                                const newSections = [...(target.sections || [])];
                                                const existingImgs = newSections[sectionIdx].images || [];

                                                // Map temp strings to SectionImage objects, preserving mandatory status if already exists
                                                const newImgs: SectionImage[] = tempSelectedImages.map(src => {
                                                    const existing = existingImgs.find(ei => ei.src === src);
                                                    return {
                                                        src,
                                                        status: existing?.status || 'optional'
                                                    };
                                                });

                                                newSections[sectionIdx] = { ...newSections[sectionIdx], images: newImgs };
                                                updateTarget(targetId, { sections: newSections });
                                                toast.success(`${newImgs.length} Visuals assigned to section`);
                                            }
                                            setSwappingImage(null);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-500 text-white min-w-[140px]"
                                    >
                                        Confirm Selection
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
