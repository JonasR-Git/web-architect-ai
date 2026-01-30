
import { Zap, Layers, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createAIOptimizedStructure, estimateTokens } from '@/modules/core/utils/grouping';
import { normalizeStructureToConcepts, SemanticMergeMap } from '@/modules/core/utils/normalization';
import { SiteStructure, SiteNode, ClusterOverrides } from '@/types';

interface AIPreviewViewProps {
    structure: SiteStructure;
    overrides: ClusterOverrides;
    semanticMerges?: SemanticMergeMap;
}

export function AIPreviewView({ structure, overrides, semanticMerges }: AIPreviewViewProps) {
    // NORMALIZE FOR AI ANALYIS (Same as Tree View)
    const normalizedStructure = structure ? normalizeStructureToConcepts(structure, semanticMerges) : null;

    // Calculate AI Preview Data (Tier 0 by default) based on NORMALIZED structure
    const aiPreviewData = normalizedStructure ? createAIOptimizedStructure(normalizedStructure, overrides, 0) : null;
    const estimatedTokens = aiPreviewData ? estimateTokens(aiPreviewData.optimized) : 0;

    if (!aiPreviewData) return null;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1117] relative min-h-0 h-full">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-8">
                <div className="max-w-4xl mx-auto w-full space-y-8">

                    {/* Header / Token Estimate */}
                    <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                    AI Context Payload
                                </h4>
                                <p className="text-[11px] text-purple-400/60 mt-0.5">
                                    This is the exact structured data sent to the AI for migration planning.
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    "text-lg font-mono font-bold block",
                                    estimatedTokens > 150000 ? "text-red-400" : "text-emerald-400"
                                )}>
                                    ~{estimatedTokens.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">TOKENS</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mb-2">
                            <div
                                className={cn("h-full transition-all duration-500", estimatedTokens > 150000 ? "bg-red-500" : "bg-emerald-500")}
                                style={{ width: `${Math.min((estimatedTokens / 150000) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Scout Strategy Overview */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <h4 className="text-xs uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Distributed Scout Strategy
                            </h4>
                            <span className="text-[10px] text-purple-400 font-mono">
                                {aiPreviewData.optimized.groups.length + Math.ceil(aiPreviewData.optimized.uniquePages.length / 15)} Passes Planned
                            </span>
                        </div>

                        {/* Archetype Passes */}
                        {aiPreviewData.optimized.groups.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Archetype Passes</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {aiPreviewData.grouped.groups.map((group: any) => (
                                        <div key={group.pattern} className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-4 hover:border-purple-500/30 transition-colors group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                                <Zap className="w-8 h-8 text-purple-500 -mr-2 -mt-2 rotate-12" />
                                            </div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-sm font-bold text-purple-300 truncate">
                                                    {group.label || group.pattern}
                                                </span>
                                                <span className="text-[10px] bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded text-purple-200 shrink-0">
                                                    High-Res Scout
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 ml-1">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-gray-500">Total Group Size:</span>
                                                    <span className="text-gray-300 font-mono">{group.totalCount} pages</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <span className="text-gray-500">Scout Coverage:</span>
                                                    <span className="text-emerald-400 font-mono">{group.examples.length} examples</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Unique Pages Passes */}
                        {aiPreviewData.optimized.uniquePages.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">Unique Pages Passes</p>
                                <div className="bg-white/[0.02] border border-white/5 rounded-xl divide-y divide-white/5">
                                    {(() => {
                                        const chunks = [];
                                        const chunkSize = 15;
                                        for (let i = 0; i < aiPreviewData.optimized.uniquePages.length; i += chunkSize) {
                                            chunks.push(aiPreviewData.optimized.uniquePages.slice(i, i + chunkSize));
                                        }
                                        return chunks.map((chunk, idx) => (
                                            <div key={idx} className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                                        <span className="text-xs font-bold text-gray-300">Unique Scout Pass #{idx + 1}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-gray-500">{chunk.length} pages</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                                                    {chunk.map((page: any) => (
                                                        <div key={page.url} className="text-[10px] text-gray-500 font-mono truncate hover:text-gray-300 transition-colors cursor-default" title={page.url}>
                                                            {new URL(page.url).pathname}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-gray-600">
                                <p className="text-sm">No unique pages found.</p>
                                <p className="text-xs mt-1">All pages are covered by archetype scouts.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
