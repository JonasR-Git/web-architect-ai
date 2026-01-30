'use client';

import { useMemo, useState } from 'react';
import { SiteStructure, SiteNode, ClusterOverrides } from '@/types';
import { ChevronRight, ChevronDown, Globe, FileText, Link as LinkIcon, AlertCircle, CheckCircle2, Info, Image as ImageIcon, Layers, Sparkles, Download, List, Copy, Search, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { AIPreviewView } from './ai-preview-view';
import { groupSimilarPages } from '@/modules/core/utils/grouping';
import { normalizeStructureToConcepts, SemanticMergeMap } from '@/modules/core/utils/normalization';

interface SiteTreeProps {
    structure: SiteStructure | null;
    migrationPlan?: any;
    excludedUrls?: Set<string>;
    onToggleExclusion?: (url: string, excluded: boolean) => void;
    clusterOverrides?: ClusterOverrides;
    onUpdateOverrides?: (overrides: ClusterOverrides) => void;
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

/**
 * Compact the tree by merging nodes that have only one child and no associated SiteNode.
 * Reduces visual depth for linear paths (e.g. /a/b/c becomes "a/b/c").
 */
const compactTree = (node: TreeNode): TreeNode => {
    const childrenKeys = Object.keys(node.children);

    // Recursively compact children first
    childrenKeys.forEach(key => {
        node.children[key] = compactTree(node.children[key]);
    });

    // If this node has exactly one child AND no page data (node is undefined) 
    // AND it's not the root (we want to keep the root anchor)
    if (childrenKeys.length === 1 && !node.node && node.path !== '/') {
        const childKey = childrenKeys[0];
        const child = node.children[childKey];

        // Merge child into current node
        return {
            ...child,
            name: `${node.name}/${child.name}`,
            // path and node already come from child
        };
    }

    return node;
};

// Helper to get all child URLs recursively from a TreeNode
const getAllChildUrls = (item: TreeNode): string[] => {
    let urls: string[] = [];
    if (item.node) urls.push(item.node.url);
    Object.values(item.children).forEach(child => {
        urls = urls.concat(getAllChildUrls(child));
    });
    return urls;
};

const TreeItem = ({
    item,
    depth = 0,
    isRoot = false,
    onSelect,
    isSelected,
    urlToPattern,
    excludedUrls,
    onToggleExclusion,
    onToggleCluster,
    onToggleException,
    forceArchetypes,
    exceptions,
    renames
}: {
    item: TreeNode,
    depth?: number,
    isRoot?: boolean,
    onSelect: (node: SiteNode) => void,
    isSelected: boolean,
    urlToPattern: Record<string, { pattern: string, isClustered: boolean }>,
    excludedUrls?: Set<string>,
    onToggleExclusion?: (urls: string[], excluded: boolean) => void,
    onToggleCluster?: (pattern: string, force: boolean) => void,
    onToggleException?: (url: string, forceUnique: boolean) => void,
    forceArchetypes?: string[],
    exceptions?: string[],
    renames?: Record<string, string>
}) => {
    const [isOpen, setIsOpen] = useState(true); // Default open
    const hasChildren = Object.keys(item.children).length > 0;
    const isFile = !!item.node;

    // Pattern logic for clustering
    const clusterInfo = item.node ? urlToPattern[item.node.url] : null;
    const itemPattern = clusterInfo?.pattern || (item.path === '/' ? '/' : `${item.path}/[item]`);
    const isClustered = clusterInfo?.isClustered;
    // Helper to check if a pattern is forced (handling Full URL vs Path persistence mismatch)
    const checkIsForced = (ptrn: string) => {
        if (!forceArchetypes) return false;
        // Direct match
        if (forceArchetypes.includes(ptrn)) return true;

        // Normalize check (compare pathnames)
        try {
            // If ptrn is a path (starts with /), compare against stored full URLs
            // If ptrn is a URL, compare against stored paths
            return forceArchetypes.some(forced => {
                const p1 = forced.startsWith('http') ? new URL(forced).pathname : forced;
                const p2 = ptrn.startsWith('http') ? new URL(ptrn).pathname : ptrn;
                return p1 === p2;
            });
        } catch (e) { return false; }
    };

    const isManuallyForced = checkIsForced(itemPattern);
    const isException = item.node ? exceptions?.includes(item.node.url) : false;

    // Check if item or sub-items are excluded
    const isExcluded = item.node ? excludedUrls?.has(item.node.url) : false;
    const allChildren = useMemo(() => getAllChildUrls(item), [item]);
    const areAllChildrenExcluded = allChildren.length > 0 && allChildren.every(url => excludedUrls?.has(url));

    // Icon Logic
    const Icon = isRoot ? Globe : (hasChildren ? (isOpen ? ChevronDown : ChevronRight) : FileText);

    return (
        <div className={cn("select-none transition-opacity", (isExcluded || areAllChildrenExcluded) && !isRoot ? "opacity-30 grayscale-[0.5]" : "opacity-100")}>
            <div
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-md transition-all group",
                    isSelected ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-white/5 border border-transparent",
                    depth === 0 ? "mb-1" : ""
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {/* Exclusion Checkbox */}
                {!isRoot && (
                    <div
                        className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors shrink-0",
                            (isExcluded || areAllChildrenExcluded) ? "bg-red-500/20 border-red-500/50" : "bg-white/5 border-white/20 hover:border-blue-500/50"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onToggleExclusion) {
                                onToggleExclusion(allChildren, !(isExcluded || areAllChildrenExcluded));
                            }
                        }}
                    >
                        {(isExcluded || areAllChildrenExcluded) ? (
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-sm" />
                        ) : (
                            <div className="w-1.5 h-1.5 bg-blue-400 opacity-0 group-hover:opacity-40 rounded-sm" />
                        )}
                    </div>
                )}

                {/* Expand/Collapse or Spacer */}
                <div
                    className="w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer"
                    onClick={(e) => {
                        if (hasChildren) setIsOpen(!isOpen);
                    }}
                >
                    {hasChildren && !isRoot && (
                        isOpen ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />
                    )}
                </div>

                {/* Type Icon & Label - Clickable for Selection */}
                <div
                    className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                        if (item.node) onSelect(item.node);
                        else if (hasChildren) setIsOpen(!isOpen);
                    }}
                >
                    <Icon className={cn("w-4 h-4 shrink-0", isRoot ? "text-blue-400" : (isFile ? "text-blue-200/70" : "text-yellow-400/70"))} />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={cn("text-sm font-medium truncate", isRoot ? "text-white" : "text-gray-300")}>
                            {isRoot ? new URL(item.node?.url || 'https://site.com').hostname : item.name}
                        </span>

                        {/* LANGUAGE VARIANTS BADGES */}
                        {item.node?.variants && item.node.variants.length > 0 && (
                            <div className="flex items-center gap-1">
                                {Array.from(new Set(item.node.variants.map(v => v.lang.toUpperCase()))).sort().map(lang => (
                                    <Badge key={lang} variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase border-white/10 text-gray-500 bg-white/5">
                                        {lang}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {(isClustered || isManuallyForced) && (
                                <span className={cn(
                                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-tighter shrink-0 transition-all",
                                    isManuallyForced
                                        ? "bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                                        : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                                )}>
                                    <Layers className="w-2.5 h-2.5" />
                                    {renames?.[itemPattern] || 'Cluster'}
                                </span>
                            )}

                            {isException && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-400 font-mono uppercase tracking-tighter shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Forced Unique
                                </span>
                            )}
                        </div>

                        {/* Manual Actions Row */}
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                            {/* Manual Clustering Action (only if it has children or is clustered/forceable) */}
                            {!isRoot && (onToggleCluster) && (hasChildren || isClustered) && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleCluster(itemPattern, !isManuallyForced);
                                    }}
                                    title={isManuallyForced ? "Remove manual clustering" : "Force this path as Archetype/Cluster"}
                                    className={cn(
                                        "p-1.5 rounded-md border transition-all mr-1",
                                        isManuallyForced
                                            ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:text-purple-400 hover:border-purple-500/30"
                                    )}
                                >
                                    <Sparkles className={cn("w-3 h-3", isManuallyForced && "animate-pulse")} />
                                </button>
                            )}

                            {/* Force Unique (Uncluster) Action - Only for files that ARE clustered */}
                            {item.node && (isClustered || isException) && onToggleException && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleException(item.node!.url, !isException);
                                    }}
                                    title={isException ? "Allowed to cluster" : "Force Unique (Remove from cluster)"}
                                    className={cn(
                                        "p-1.5 rounded-md border transition-all mr-1",
                                        isException
                                            ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:text-amber-400 hover:border-amber-500/30"
                                    )}
                                >
                                    {isException ? <Layers className="w-3 h-3" /> : <div className="relative"><Layers className="w-3 h-3 opacity-50" /><div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full border border-black" /></div>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Meta Stats (Moved to right) */}
                    {item.node && (
                        <div className="flex items-center gap-3 group-hover:text-gray-400 transition-colors mr-2 shrink-0 ml-auto pl-2">
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
                            </div>
                            {item.node.score && item.node.score.issues.length > 0 && (
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
                            )}
                        </div>
                    )}
                </div>
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
                            urlToPattern={urlToPattern}
                            excludedUrls={excludedUrls}
                            onToggleExclusion={onToggleExclusion}
                            onToggleCluster={onToggleCluster}
                            onToggleException={onToggleException}
                            forceArchetypes={forceArchetypes}

                            exceptions={exceptions}
                            renames={renames}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};



interface SiteTreeProps {
    structure: SiteStructure | null;
    semanticMerges?: SemanticMergeMap; // New Prop
    migrationPlan?: any;
    excludedUrls?: Set<string>;
    onToggleExclusion?: (url: string, excluded: boolean) => void;
    clusterOverrides?: ClusterOverrides;
    onUpdateOverrides?: (overrides: ClusterOverrides) => void;
}

export function SiteTree({ structure, semanticMerges, migrationPlan, excludedUrls, onToggleExclusion, clusterOverrides, onUpdateOverrides }: SiteTreeProps) {
    const [selectedNode, setSelectedNode] = useState<SiteNode | null>(null);

    const [viewMode, setViewMode] = useState<'tree' | 'list' | 'preview'>('list');
    const [urlSearch, setUrlSearch] = useState('');

    const { treeRoot, stats, urlToPattern, groups, uniquePages } = useMemo(() => {
        if (!structure) return { treeRoot: null, stats: null, urlToPattern: {}, groups: [], uniquePages: [] };

        // NORMALIZE STRUCTURE FIRST (Concept Mapping) - PASS MERGE MAP
        const normalizedStructure = normalizeStructureToConcepts(structure, semanticMerges);

        const grouped = groupSimilarPages(normalizedStructure, 2, 5, clusterOverrides);
        const root = buildTree(normalizedStructure.nodes);
        return {
            treeRoot: compactTree(root),
            stats: grouped.stats,
            urlToPattern: grouped.urlToPattern,
            groups: grouped.groups,
            uniquePages: grouped.uniquePages
        };
    }, [structure, clusterOverrides]);

    const handleToggleExclusion = (urls: string[], excluded: boolean) => {
        if (!onToggleExclusion) return;
        urls.forEach(url => onToggleExclusion(url, excluded));
    };

    const handleToggleCluster = (pattern: string, force: boolean) => {
        if (!onUpdateOverrides) return;
        const currentForce = clusterOverrides?.forceArchetypes || [];
        const newForce = force
            ? [...currentForce, pattern]
            : currentForce.filter(p => p !== pattern);

        onUpdateOverrides({
            ...clusterOverrides,
            forceArchetypes: Array.from(new Set(newForce))
        });
    };

    const handleToggleException = (url: string, forceUnique: boolean) => {
        if (!onUpdateOverrides) return;
        const currentExceptions = clusterOverrides?.exceptions || [];
        const newExceptions = forceUnique
            ? [...currentExceptions, url]
            : currentExceptions.filter(u => u !== url);

        onUpdateOverrides({
            ...clusterOverrides,
            exceptions: Array.from(new Set(newExceptions))
        });
    };

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
        <div className="flex flex-col gap-6">
            <div className="w-full border border-white/10 rounded-xl bg-[#0f1117] shadow-xl overflow-hidden flex flex-col h-[700px]">
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            Site Structure (Concepts)
                        </h3>
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                            <button
                                onClick={() => setViewMode('tree')}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5",
                                    viewMode === 'tree' ? "bg-blue-500 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <Layers className="w-3 h-3" />
                                Hierarchy
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5",
                                    viewMode === 'list' ? "bg-blue-500 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <List className="w-3 h-3" />
                                Flat List
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1.5",
                                    viewMode === 'preview' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <Zap className="w-3 h-3" />
                                AI Preview
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">

                        {stats && (
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-500 flex items-center gap-1 border-r border-white/10 pr-3">
                                    <Sparkles className="w-3 h-3 text-blue-400" />
                                    {stats.uniquePatterns} Archetypes
                                </span>
                            </div>
                        )}
                        <span className="text-xs font-mono text-white/40">
                            {structure.nodes.length} Pages Found (Raw)
                        </span>
                        <button
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(structure, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `site-structure-${new URL(structure.rootUrl).hostname}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="ml-2 p-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-blue-400"
                            title="Download Raw Structure JSON"
                        >
                            <Download className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {viewMode === 'preview' ? (
                        <AIPreviewView
                            structure={structure}
                            overrides={clusterOverrides || { forceArchetypes: [], ignorePatterns: [], mergeRules: {} }}
                            semanticMerges={semanticMerges}
                        />
                    ) : viewMode === 'tree' ? (
                        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
                                <TreeItem
                                    item={treeRoot}
                                    isRoot={true}
                                    onSelect={setSelectedNode}
                                    isSelected={selectedNode?.url === treeRoot.node?.url}
                                    urlToPattern={urlToPattern}
                                    excludedUrls={excludedUrls}
                                    onToggleExclusion={handleToggleExclusion}
                                    onToggleCluster={handleToggleCluster}
                                    onToggleException={handleToggleException}
                                    forceArchetypes={clusterOverrides?.forceArchetypes}

                                    exceptions={clusterOverrides?.exceptions}
                                    renames={clusterOverrides?.renames}
                                />
                            </div>


                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01] flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search URLs..."
                                        value={urlSearch}
                                        onChange={(e) => setUrlSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-[11px] gap-2 bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all font-bold"
                                    onClick={() => {
                                        const urls = structure.nodes.map(n => n.url).join('\n');
                                        navigator.clipboard.writeText(urls);
                                    }}
                                >
                                    <Copy className="w-3 h-3" />
                                    Copy All
                                </Button>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-4 space-y-4">
                                    {/* 1. Render Clusters (Groups) - NEW DESIGN */}
                                    {groups.map(group => (
                                        <div key={group.pattern} className="border border-purple-500/20 bg-purple-500/5 rounded-md overflow-hidden">
                                            <div className="p-2 border-b border-purple-500/10 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="h-4 w-4 text-purple-400" />
                                                    <span className="font-medium text-sm font-mono text-purple-300">
                                                        {group.label || group.pattern}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs border-purple-500/20 text-purple-300 bg-purple-500/10">
                                                        {group.totalCount} pages
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                                {group.allUrls.map((url, idx) => (
                                                    <div key={url} className={cn(
                                                        "px-3 py-1.5 text-[10px] sm:text-xs text-gray-400 truncate hover:text-white hover:bg-white/5 flex items-center gap-2",
                                                        idx !== group.allUrls.length - 1 && "border-b border-white/5"
                                                    )}>
                                                        <span className="w-1 h-1 rounded-full bg-purple-500/30 shrink-0" />
                                                        {url}

                                                        {/* Variant Indicators for Flat List Group Items if available (requires linking back to nodes) */}
                                                        {/* For now, just listing URLs is standard behavior */}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    {/* 2. Render Unique Pages */}
                                    <div className="space-y-1">
                                        {uniquePages
                                            .filter(n => n.url.toLowerCase().includes(urlSearch.toLowerCase()))
                                            .map((node) => (
                                                <div
                                                    key={node.url}
                                                    className={cn(
                                                        "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm group transition-all",
                                                        selectedNode?.url === node.url ? "bg-muted" : "hover:bg-white/5"
                                                    )}
                                                    onClick={() => setSelectedNode(node)}
                                                >
                                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                                                    <span className="truncate flex-1 font-mono text-xs text-gray-400 group-hover:text-gray-200">{node.url}</span>

                                                    {/* LANGUAGE BADGES IN FLAT LIST */}
                                                    {node.variants && node.variants.length > 0 && (
                                                        <div className="flex items-center gap-1 mr-2">
                                                            {Array.from(new Set(node.variants.map(v => v.lang.toUpperCase()))).sort().map(lang => (
                                                                <Badge key={lang} variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase border-white/10 text-gray-500 bg-white/5">
                                                                    {lang}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <Badge variant="outline" className="text-[10px] h-4 border-white/10 text-gray-500 group-hover:text-gray-400">
                                                        {node.content?.wordCount || 0}w
                                                    </Badge>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
