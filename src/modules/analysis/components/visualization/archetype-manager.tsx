'use client';

import { useState } from 'react';
import { Layers, ChevronRight, X, ArrowRight, MousePointer2, Settings2, Trash2, Pin, Check, Combine, Pencil, Bot, Zap, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { createAIOptimizedStructure, estimateTokens } from '@/modules/core/utils/grouping';
import { SiteStructure, ClusterOverrides } from '@/types';

interface ArchetypeManagerProps {
    structure?: SiteStructure;
    groups: any[];
    uniquePages: any[];
    overrides: ClusterOverrides;
    onUpdateOverrides: (overrides: ClusterOverrides) => void;
    onClose: () => void;
}

export function ArchetypeManager({ structure, groups, uniquePages, overrides, onUpdateOverrides, onClose }: ArchetypeManagerProps) {
    const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(new Set());
    const [renamingPattern, setRenamingPattern] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const toggleSelection = (pattern: string) => {
        const next = new Set(selectedPatterns);
        if (next.has(pattern)) next.delete(pattern);
        else next.add(pattern);
        setSelectedPatterns(next);
    };

    // Calculate merge intent
    const selectionList = Array.from(selectedPatterns);
    const targetPattern = selectionList[0];
    const sourcePatterns = selectionList.slice(1);

    const handleMergeSelected = () => {
        if (selectedPatterns.size < 2) return;

        const patterns = Array.from(selectedPatterns);
        const target = patterns[0]; // Merge into the first one
        const sources = patterns.slice(1);

        const nextMergeRules = { ...(overrides.mergeRules || {}) };
        sources.forEach(src => {
            nextMergeRules[src] = target;
        });

        onUpdateOverrides({
            ...overrides,
            mergeRules: nextMergeRules
        });
        setSelectedPatterns(new Set());
    };

    const handleAddIgnore = (pattern: string) => {
        onUpdateOverrides({
            ...overrides,
            ignorePatterns: [...(overrides.ignorePatterns || []), pattern]
        });
    };

    const handleRemoveIgnore = (pattern: string) => {
        onUpdateOverrides({
            ...overrides,
            ignorePatterns: (overrides.ignorePatterns || []).filter(p => p !== pattern)
        });
    };

    const handleRemoveForce = (pattern: string) => {
        onUpdateOverrides({
            ...overrides,
            forceArchetypes: (overrides.forceArchetypes || []).filter(p => p !== pattern)
        });
    };

    const handleRemoveMerge = (source: string) => {
        const nextMergeRules = { ...(overrides.mergeRules || {}) };
        delete nextMergeRules[source];
        onUpdateOverrides({
            ...overrides,
            mergeRules: nextMergeRules
        });
    };

    const handleStartRename = (pattern: string, currentName?: string) => {
        setRenamingPattern(pattern);
        setRenameValue(currentName || ''); // Pre-fill with existing custom name or empty
    };

    const handleSaveRename = () => {
        if (!renamingPattern) return;
        const nextRenames = { ...(overrides.renames || {}) };

        if (renameValue && renameValue.trim().length > 0) {
            nextRenames[renamingPattern] = renameValue.trim();
        } else {
            delete nextRenames[renamingPattern];
        }

        onUpdateOverrides({
            ...overrides,
            renames: nextRenames
        });
        setRenamingPattern(null);
    };

    const handleCancelRename = () => {
        setRenamingPattern(null);
        setRenameValue('');
    };

    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

    // Calculate AI Preview Data
    const aiPreviewData = viewMode === 'preview' && structure ? createAIOptimizedStructure(structure, overrides, 0) : null;
    const estimatedTokens = aiPreviewData ? estimateTokens(aiPreviewData.optimized) : 0;

    return (
        <div className="flex flex-col h-full bg-[#0f1117] border-l border-white/10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Archetype Manager</h3>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/10">
                    <button
                        onClick={() => setViewMode('editor')}
                        className={cn(
                            "px-3 py-1 text-[10px] font-medium rounded-md transition-all",
                            viewMode === 'editor' ? "bg-purple-500/20 text-purple-300 shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={cn(
                            "px-3 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1.5",
                            viewMode === 'preview' ? "bg-blue-500/20 text-blue-300 shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        <Bot className="w-3 h-3" />
                        AI Preview
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {viewMode === 'editor' && selectedPatterns.size >= 2 && (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                            <span className="text-[10px] text-gray-500 font-mono hidden xl:block">
                                {sourcePatterns.length} sources <ArrowRight className="w-3 h-3 inline mx-1" /> {targetPattern?.slice(0, 15)}...
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                                onClick={handleMergeSelected}
                            >
                                <Combine className="w-3 h-3" />
                                Merge
                            </Button>
                        </div>
                    )}
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md text-gray-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                {viewMode === 'editor' ? (
                    <div className="p-5 space-y-8">
                        {/* Active Clusters Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Active Archetypes ({groups.length})</h4>
                            </div>

                            <div className="space-y-2">
                                {groups.map((group) => {
                                    const isSelected = selectedPatterns.has(group.pattern);
                                    const isTarget = group.pattern === targetPattern;
                                    const isSource = sourcePatterns.includes(group.pattern);

                                    return (
                                        <div
                                            key={group.pattern}
                                            className={cn(
                                                "p-3 rounded-lg border transition-all group cursor-pointer relative",
                                                isSelected
                                                    ? (isTarget ? "bg-blue-500/20 border-blue-500/50" : "bg-blue-500/5 border-blue-500/20")
                                                    : "border-white/5 bg-white/[0.01] hover:border-white/10"
                                            )}
                                            onClick={() => toggleSelection(group.pattern)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={cn(
                                                            "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                                                            isSelected
                                                                ? (isTarget ? "bg-blue-500 border-blue-400" : "bg-blue-500/20 border-blue-500/40")
                                                                : "border-white/20"
                                                        )}>
                                                            {isTarget && <Pin className="w-2.5 h-2.5 text-white fill-current" />}
                                                            {isSource && <ArrowRight className="w-2.5 h-2.5 text-blue-300" />}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            {renamingPattern === group.pattern ? (
                                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        value={renameValue}
                                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleSaveRename();
                                                                            if (e.key === 'Escape') handleCancelRename();
                                                                        }}
                                                                        placeholder="Enter name (e.g. News Hub)"
                                                                        className="h-6 text-xs bg-black/20 border border-blue-500/50 rounded px-2 text-white focus:outline-none focus:border-blue-400 w-full min-w-[150px]"
                                                                    />
                                                                    <button onClick={handleSaveRename} className="p-1 text-green-400 hover:bg-green-500/20 rounded">
                                                                        <Check className="w-3 h-3" />
                                                                    </button>
                                                                    <button onClick={handleCancelRename} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <span className={cn(
                                                                        "text-xs font-mono truncate transition-colors",
                                                                        isTarget ? "text-white font-bold" : (isSource ? "text-blue-300" : "text-gray-400"),
                                                                        overrides.renames?.[group.pattern] && "text-purple-300 font-semibold"
                                                                    )}>
                                                                        {overrides.renames?.[group.pattern] || group.pattern}
                                                                    </span>
                                                                    {overrides.renames?.[group.pattern] && (
                                                                        <span className="text-[9px] text-gray-600 block truncate font-mono">
                                                                            {group.pattern}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                        {isTarget && selectedPatterns.size > 1 && (
                                                            <span className="text-[9px] bg-blue-500 px-1.5 rounded text-white font-bold">TARGET</span>
                                                        )}
                                                        {isSource && (
                                                            <span className="text-[9px] text-blue-400/50 italic">will merge into target</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 pl-6">{group.totalCount} pages match this pattern</p>
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartRename(group.pattern, overrides.renames?.[group.pattern]);
                                                        }}
                                                        className="p-1.5 hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 rounded-md transition-colors"
                                                        title="Rename Cluster"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddIgnore(group.pattern);
                                                        }}
                                                        className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-md transition-colors"
                                                        title="Break Cluster (Explode to individual pages)"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Manual Overrides Section */}
                        {(((overrides.ignorePatterns?.length || 0) > 0) ||
                            ((overrides.forceArchetypes?.length || 0) > 0) ||
                            (overrides.mergeRules && Object.keys(overrides.mergeRules).length > 0)) && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Manual Rules</h4>

                                    {/* Merge Rules */}
                                    {overrides.mergeRules && Object.entries(overrides.mergeRules).map(([source, target]) => (
                                        <div key={`merge-${source}`} className="flex items-center justify-between p-2 rounded bg-blue-500/5 border border-blue-500/10">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Combine className="w-3 h-3 text-blue-400" />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[9px] font-mono text-blue-400/60 truncate italic">{source}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <ArrowRight className="w-2.5 h-2.5 text-blue-500/40" />
                                                        <span className="text-[10px] font-mono text-blue-300 truncate">{target}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveMerge(source)} className="text-gray-500 hover:text-white p-1">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {overrides.ignorePatterns?.map(pattern => (
                                        <div key={`ignore-${pattern}`} className="flex items-center justify-between p-2 rounded bg-rose-500/5 border border-rose-500/10">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <X className="w-3 h-3 text-rose-400" />
                                                <span className="text-[10px] font-mono text-rose-300 truncate">Ignored: {pattern}</span>
                                            </div>
                                            <button onClick={() => handleRemoveIgnore(pattern)} className="text-gray-500 hover:text-white p-1">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {overrides.forceArchetypes?.map(pattern => (
                                        <div key={`force-${pattern}`} className="flex items-center justify-between p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <Pin className="w-3 h-3 text-emerald-400" />
                                                <span className="text-[10px] font-mono text-emerald-300 truncate">Forced: {pattern}</span>
                                            </div>
                                            <button onClick={() => handleRemoveForce(pattern)} className="text-gray-500 hover:text-white p-1">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                        {/* Tip Section */}
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <div className="flex gap-3">
                                <MousePointer2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[11px] font-medium text-blue-300">Clustering Tip</p>
                                    <p className="text-[10px] text-blue-400/70 leading-relaxed">
                                        Use multi-select and <span className="text-blue-300 font-bold">Merge</span> to combine similar archetypes (e.g., German/English versions) into a single template for analysis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 space-y-8">
                        {/* Token Estimate */}
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-blue-300 flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                    AI Payload Estimate
                                </h4>
                                <span className={cn(
                                    "text-xs font-mono font-bold",
                                    estimatedTokens > 150000 ? "text-red-400" : "text-emerald-400"
                                )}>
                                    ~{estimatedTokens.toLocaleString()} tokens
                                </span>
                            </div>
                            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-500", estimatedTokens > 150000 ? "bg-red-500" : "bg-emerald-500")}
                                    style={{ width: `${Math.min((estimatedTokens / 150000) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">
                                This reflects the **exact JSON structure** (Tier 0) that will be sent to the AI for migration planning.
                            </p>
                        </div>

                        {/* Clusters List */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2">
                                <Layers className="w-3 h-3" />
                                Structure Archetypes ({aiPreviewData?.optimized.groups.length})
                            </h4>
                            {aiPreviewData?.optimized.groups.map((group: any) => (
                                <div key={group.pattern} className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {group.label ? (
                                                <span className="text-xs font-bold text-purple-300">{group.label}</span>
                                            ) : (
                                                <span className="text-xs font-mono text-gray-400">{group.pattern}</span>
                                            )}
                                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-gray-500">
                                                {group.count} pages
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pl-2 border-l border-white/10">
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Sent Examples ({group.examples.length})</p>
                                        {group.examples.map((ex: any) => (
                                            <div key={ex.url} className="flex items-center gap-2 text-[10px] text-gray-400 font-mono truncate">
                                                <FileText className="w-3 h-3 text-blue-500/50 shrink-0" />
                                                {new URL(ex.url).pathname}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Unique Pages List */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2">
                                <FileText className="w-3 h-3" />
                                Unique Pages ({aiPreviewData?.optimized.unique.length})
                            </h4>
                            <div className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden">
                                {aiPreviewData?.optimized.unique.map((page: any, idx: number) => (
                                    <div key={page.url} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0 text-[10px] text-gray-400 font-mono hover:bg-white/5 transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shrink-0" />
                                        <span className="truncate">{new URL(page.url).pathname}</span>
                                        {page.content.rawText && (
                                            <span className="ml-auto text-gray-600">{(page.content.rawText.length / 3).toFixed(0)} toks</span>
                                        )}
                                    </div>
                                ))}
                                {aiPreviewData?.optimized.unique.length === 0 && (
                                    <div className="p-4 text-center text-[10px] text-gray-600 italic">
                                        No unique pages (everything is clustered)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
