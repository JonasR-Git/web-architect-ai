'use client';

import { useMemo, useState } from 'react';
import { SiteStructure, SiteNode } from '@/types';
import { ChevronRight, ChevronDown, Globe, FileText, Link as LinkIcon, AlertCircle, CheckCircle2, Info, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SiteTreeProps {
    structure: SiteStructure | null;
    migrationPlan?: any;
}

interface TreeNode {
    name: string;
    path: string;
    node?: SiteNode;
    children: Record<string, TreeNode>;
}

// Helper to build tree from flat list of URLs
const buildTree = (nodes: SiteNode[]): TreeNode => {
    const root: TreeNode = { name: 'root', path: '/', children: {} };

    nodes.forEach(node => {
        try {
            const urlObj = new URL(node.url);
            const pathParts = urlObj.pathname.split('/').filter(p => p);

            let current = root;

            // Handle Landing Page (root)
            if (pathParts.length === 0) {
                current.node = node;
                return;
            }

            pathParts.forEach((part, index) => {
                if (!current.children[part]) {
                    current.children[part] = {
                        name: part,
                        path: '/' + pathParts.slice(0, index + 1).join('/'),
                        children: {}
                    };
                }
                current = current.children[part];
                // Assign node data to the leaf/folder if it matches
                if (index === pathParts.length - 1) {
                    current.node = node;
                }
            });
        } catch (e) {
            // Fallback for invalid URLs
            console.warn('Invalid URL in tree builder:', node.url);
        }
    });

    return root;
};

const TreeItem = ({
    item,
    depth = 0,
    isRoot = false,
    onSelect,
    isSelected
}: {
    item: TreeNode,
    depth?: number,
    isRoot?: boolean,
    onSelect: (node: SiteNode) => void,
    isSelected: boolean
}) => {
    const [isOpen, setIsOpen] = useState(true); // Default open
    const hasChildren = Object.keys(item.children).length > 0;
    const isFile = !!item.node;

    // Icon Logic
    const Icon = isRoot ? Globe : (hasChildren ? (isOpen ? ChevronDown : ChevronRight) : FileText);
    const statusColor = item.node ? 'text-emerald-400' : 'text-gray-400';

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-md transition-all cursor-pointer group",
                    isSelected ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-white/5 border border-transparent",
                    depth === 0 ? "mb-1" : ""
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={(e) => {
                    if (item.node) {
                        onSelect(item.node);
                    } else if (hasChildren) {
                        setIsOpen(!isOpen);
                    }
                }}
            >
                {/* Expand/Collapse or Spacer */}
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {hasChildren && !isRoot && (
                        isOpen ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />
                    )}
                </div>

                {/* Type Icon */}
                <Icon className={cn("w-4 h-4 shrink-0", isRoot ? "text-blue-400" : (isFile ? "text-blue-200/70" : "text-yellow-400/70"))} />

                {/* Label */}
                <span className={cn("text-sm font-medium truncate flex-1", isRoot ? "text-white" : "text-gray-300")}>
                    {isRoot ? new URL(item.node?.url || 'https://site.com').hostname : item.name}
                </span>

                {/* Meta Stats (only for actual files) */}
                {item.node && (
                    <div className="flex items-center gap-3 group-hover:text-gray-400 transition-colors mr-2">
                        {item.node.score && (
                            <div className="flex items-center gap-2 mr-1">
                                <span title="Images Found" className="flex items-center gap-1 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                    <ImageIcon className="w-3 h-3 text-purple-400" />
                                    <span className="text-[10px] font-mono font-bold text-purple-300">
                                        {item.node.content.images?.length || 0}
                                    </span>
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-gray-600">
                            <span title="Word Count" className="flex items-center gap-1">
                                {item.node.content.wordCount} words
                            </span>
                            {item.node.content.links && (
                                <span title="Internal Links" className="flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" /> {item.node.content.links.length}
                                </span>
                            )}
                        </div>
                        {item.node.score && item.node.score.issues.length > 0 ? (
                            <div title={
                                item.node.score.issues
                                    .map(i => `[${i.category}] ${i.severity}: ${i.message}`)
                                    .join('\n')
                            }>
                                {item.node.score.issues.some(i => i.severity === 'CRITICAL') ? (
                                    <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse" />
                                ) : (
                                    <AlertCircle className="w-3 h-3 text-yellow-400/70" />
                                )}
                            </div>
                        ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                        )}
                    </div>
                )}
            </div>

            {isOpen && hasChildren && (
                <div>
                    {Object.values(item.children).map((child) => (
                        <TreeItem
                            key={child.path}
                            item={child}
                            depth={depth + 1}
                            onSelect={onSelect}
                            isSelected={isSelected && item.path === child.path}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export function SiteTree({ structure, migrationPlan }: SiteTreeProps) {
    const [selectedNode, setSelectedNode] = useState<SiteNode | null>(null);

    const treeRoot = useMemo(() => {
        if (!structure) return null;
        return buildTree(structure.nodes);
    }, [structure]);

    if (!structure || !treeRoot) {
        return (
            <div className="w-full h-[400px] border border-white/10 rounded-xl bg-[#0f1117] flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>No structure data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 w-full border border-white/10 rounded-xl bg-[#0f1117] shadow-xl overflow-hidden flex flex-col h-[650px]">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-500" />
                        Site Structure
                    </h3>
                    <span className="text-xs font-mono text-white/40">
                        {structure.nodes.length} Pages Found
                    </span>
                </div>

                {/* Tree Content */}
                <div className="flex-1 w-full p-2 overflow-y-auto custom-scrollbar">
                    <TreeItem
                        item={treeRoot}
                        isRoot={true}
                        onSelect={setSelectedNode}
                        isSelected={selectedNode?.url === treeRoot.node?.url}
                    />
                </div>
            </div>

            {/* Selection Panel */}
            <div className="lg:col-span-1 border border-white/10 rounded-xl bg-[#0f1117] shadow-xl overflow-hidden flex flex-col h-[650px]">
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] shrink-0">
                    <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-400" />
                        Audit Details
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-5">
                        {selectedNode ? (
                            <div className="space-y-8 pb-10">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                        <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                        Current Page
                                    </h4>
                                    <p className="text-[11px] text-blue-400 font-mono break-all leading-relaxed bg-blue-500/5 p-2.5 rounded border border-blue-500/10">
                                        {selectedNode.url}
                                    </p>
                                </div>

                                {selectedNode.score && (
                                    <>
                                        <div className="space-y-5">
                                            <h4 className="text-xs font-semibold text-white/70 border-b border-white/5 pb-2 flex justify-between items-center">
                                                <span>SEO Scoring</span>
                                                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">{selectedNode.score.seo}/100</span>
                                            </h4>
                                            {selectedNode.score.breakdown?.seo.map(item => (
                                                <div key={item.label} className="space-y-1.5 group/item relative">
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-400 group-hover/item:text-blue-400 transition-colors flex items-center gap-1.5">
                                                            {item.label}
                                                            <Info className="w-3 h-3 text-blue-500/40 group-hover/item:text-blue-400 transition-colors" />
                                                        </span>
                                                        <span className="text-white font-mono">{item.score}/{item.max}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 transition-all shadow-[0_0_8px_rgba(59,130,246,0.3)]" style={{ width: `${(item.score / item.max) * 100}%` }} />
                                                    </div>

                                                    {/* Custom Tooltip */}
                                                    <div className="absolute left-0 -top-2 -translate-y-full w-48 p-2 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-50 opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all duration-200 transform scale-95 group-hover/item:scale-100">
                                                        <p className="text-[10px] text-gray-300 leading-normal">{item.details || 'No details available'}</p>
                                                        <div className="absolute bottom-0 left-4 translate-y-1/2 w-2 h-2 bg-gray-900 border-r border-b border-white/10 rotate-45" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-5">
                                            <h4 className="text-xs font-semibold text-white/70 border-b border-white/5 pb-2 flex justify-between items-center">
                                                <span>Accessibility (BFSG)</span>
                                                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">{selectedNode.score.accessibility}/100</span>
                                            </h4>
                                            {selectedNode.score.breakdown?.accessibility.map(item => (
                                                <div key={item.label} className="space-y-1.5 group/item relative">
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-400 group-hover/item:text-emerald-400 transition-colors flex items-center gap-1.5">
                                                            {item.label}
                                                            <Info className="w-3 h-3 text-emerald-500/40 group-hover/item:text-emerald-400 transition-colors" />
                                                        </span>
                                                        <span className="text-white font-mono">{item.score}/{item.max}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 transition-all shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{ width: `${(item.score / item.max) * 100}%` }} />
                                                    </div>

                                                    {/* Custom Tooltip */}
                                                    <div className="absolute left-0 -top-2 -translate-y-full w-48 p-2 bg-gray-900 border border-white/10 rounded-lg shadow-2xl z-50 opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all duration-200 transform scale-95 group-hover/item:scale-100">
                                                        <p className="text-[10px] text-gray-300 leading-normal">{item.details || 'No details available'}</p>
                                                        <div className="absolute bottom-0 left-4 translate-y-1/2 w-2 h-2 bg-gray-900 border-r border-b border-white/10 rotate-45" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-semibold text-white/70 border-b border-white/5 pb-2">Detected Issues</h4>
                                            <div className="space-y-2.5">
                                                {selectedNode.score.issues && selectedNode.score.issues.length > 0 ? (
                                                    selectedNode.score.issues.map((issue, idx) => (
                                                        <div key={idx} className={cn(
                                                            "p-3 rounded-lg border text-[11px] leading-relaxed break-words whitespace-normal shadow-sm group/issue transition-all hover:border-white/20",
                                                            issue.severity === 'CRITICAL' ? "bg-rose-500/[0.04] border-rose-500/20 text-rose-200" :
                                                                issue.severity === 'WARNING' ? "bg-yellow-500/[0.04] border-yellow-500/20 text-yellow-200" :
                                                                    "bg-white/[0.02] border-white/10 text-gray-300"
                                                        )}>
                                                            <div className="flex gap-2.5">
                                                                <span className={cn(
                                                                    "font-bold uppercase text-[9px] px-1.5 py-0.5 rounded h-fit mt-0.5 shrink-0 shadow-sm",
                                                                    issue.severity === 'CRITICAL' ? "bg-rose-500/20 text-rose-400" :
                                                                        issue.severity === 'WARNING' ? "bg-yellow-500/20 text-yellow-500" : "bg-white/10 text-gray-400"
                                                                )}>
                                                                    {issue.category}
                                                                </span>
                                                                <span className="flex-1">{issue.message}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/80 italic text-[11px]">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        No issues found for this page.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-20">
                                <FileText className="w-16 h-16 mb-4" />
                                <p className="text-sm font-medium">Click a page in the structure<br />to see full audit details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
