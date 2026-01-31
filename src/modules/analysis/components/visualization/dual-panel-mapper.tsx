'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    ArrowRight, Check, Merge, Trash2, CornerDownRight, Plus, Save,
    RotateCcw, GripVertical, FileText, FolderOpen, X, Download, Sparkles, Loader2,
    ArrowUpDown, Lock, Layers, Zap, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MappingValidator } from '@/modules/analysis/services/mapping-validator';
import type { MappingValidationResult, SourcePage } from '@/types';
import { ValidationModal } from './validation-modal';

// ============================================================================
// TYPES
// ============================================================================

export interface SectionImage {
    src: string;
    status: 'mandatory' | 'optional';
}

export interface TargetSlot {
    id: string;
    path: string;
    label: string;
    action: 'keep' | 'redirect' | 'merge' | 'delete';
    type?: 'page' | 'layout'; // Page or Global Layout entry
    sourceIds: string[]; // Which sources are connected
    description?: string; // AI generated description/specs
    content_goals?: string[]; // AI generated content goals
    sections?: {
        type: string;
        title: string;
        content_hint: string;
        // Draft Content
        headline?: string;
        content?: string;
        images?: SectionImage[];
    }[];
    logos?: SectionImage[]; // Global assets for layouts
    language?: string; // New: Language variant (e.g. 'de', 'en')
    canonical?: string;
    hreflangs?: { lang: string; url: string }[];
    // Iterative Workflow Fields
    user_prompt?: string;
    dependencies?: string[];
    dependencies_detected?: boolean;
    sourceDetails?: any[]; // Enriched context for regeneration
    previousState?: TargetSlot;
    lastGeneratedAt?: number;
    lastModifiedAt?: number;
}

interface DualPanelMapperProps {
    sources: SourcePage[];
    initialTargets?: TargetSlot[];
    onSave?: (targets: TargetSlot[]) => void;
    onGenerateSpecs?: (targets: TargetSlot[]) => Promise<TargetSlot[]>;
}

// ============================================================================
// ACTION CONFIG
// ============================================================================

const actionConfig = {
    keep: { label: 'Beibehalten', color: 'emerald', icon: Check },
    redirect: { label: 'Umleiten', color: 'blue', icon: CornerDownRight },
    merge: { label: 'Zusammenführen', color: 'amber', icon: Merge },
    delete: { label: 'Löschen', color: 'rose', icon: Trash2 },
};

// ============================================================================
// SHARED STYLES
// ============================================================================

// Unified card style for both panels
const CARD_STYLE = "p-4 rounded-xl border border-white/5 bg-[#111116] transition-all hover:border-white/10 group relative";

// ============================================================================
// DRAGGABLE SOURCE ITEM
// ============================================================================

function DraggableSource({
    source,
    isConnected,
    onHoverChange
}: {
    source: SourcePage;
    isConnected: boolean;
    onHoverChange: (id: string | null) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: source.id,
        data: source,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (

        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onMouseEnter={() => onHoverChange(source.id)}
            onMouseLeave={() => onHoverChange(null)}
            className={cn(
                CARD_STYLE,
                "cursor-grab active:cursor-grabbing w-full flex flex-col justify-center min-h-[100px]",
                isDragging && "opacity-50 scale-95 z-50",
                isConnected
                    ? "bg-[#0A2F1F]/40 border-emerald-500/20" // Connected style
                    : "hover:bg-white/[0.02]"
            )}
        >
            <div className="flex items-start gap-3">
                <GripVertical size={14} className="text-gray-700 mt-1 shrink-0 group-hover:text-gray-500 transition-colors" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {source.type === 'cluster' ? (
                            <Layers size={14} className={isConnected ? "text-emerald-500" : "text-amber-400"} />
                        ) : (
                            <FileText size={14} className={isConnected ? "text-emerald-500" : "text-gray-600"} />
                        )}
                        <code className={cn(
                            "text-xs font-mono truncate block flex-1",
                            isConnected ? "text-emerald-400" : "text-gray-300",
                            source.type === 'cluster' && "text-amber-200"
                        )}>
                            {getPathFromUrl(source.url)}
                        </code>
                        {isConnected && (
                            <Check size={14} className="text-emerald-500 shrink-0" />
                        )}
                    </div>
                    {source.title && (
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed pl-6">{source.title}</p>
                    )}

                    {/* Cluster Badge */}
                    {source.type === 'cluster' && (
                        <div className="pl-6 mt-2">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-medium">
                                <FileText size={10} />
                                {source.count} Seiten
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Indicator Dot Right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

// ============================================================================
// DROPPABLE TARGET SLOT
// ============================================================================

function DroppableTarget({
    target,
    sources,
    onPathChange,
    onActionChange,
    onRemove,
    onDisconnect,
    onHoverChange
}: {
    target: TargetSlot;
    sources: SourcePage[];
    onPathChange: (id: string, path: string) => void;
    onActionChange: (id: string, action: TargetSlot['action']) => void;
    onRemove: (id: string) => void;
    onDisconnect: (targetId: string, sourceId: string) => void;
    onHoverChange: (id: string | null) => void;
}) {
    const { isOver, setNodeRef } = useDroppable({ id: target.id });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(target.path);
    const inputRef = useRef<HTMLInputElement>(null);

    const connectedSources = sources.filter(s => target.sourceIds.includes(s.id));
    const config = actionConfig[target.action];
    const ActionIcon = config.icon;

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        onPathChange(target.id, editValue);
        setIsEditing(false);
    };

    const cycleAction = () => {
        const actions: TargetSlot['action'][] = ['keep', 'redirect', 'merge', 'delete'];
        const idx = actions.indexOf(target.action);
        onActionChange(target.id, actions[(idx + 1) % actions.length]);
    };

    return (
        <div
            ref={setNodeRef}
            onMouseEnter={() => onHoverChange(target.id)}
            onMouseLeave={() => onHoverChange(null)}
            className={cn(
                CARD_STYLE,
                "flex flex-col min-h-[100px] border-dashed", // Use dashed for drop targets
                isOver
                    ? "border-purple-500 bg-purple-500/10 scale-[1.01] shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]"
                    : target.type === 'layout' || target.path === 'layout'
                        ? "border-purple-500/40 bg-purple-500/5"
                        : connectedSources.length > 0
                            ? `border-${config.color}-500/30 bg-${config.color}-500/5`
                            : "border-white/10"
            )}
        >
            {/* Hover Indicator Dot Left */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-3 mb-3">
                {/* Action Badge */}
                <button
                    onClick={cycleAction}
                    className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1.5 transition-all shadow-sm",
                        (target.type === 'layout' || target.path === 'layout')
                            ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30"
                            : `bg-${config.color}-500/10 text-${config.color}-400 hover:bg-${config.color}-500/20 ring-1 ring-${config.color}-500/20`
                    )}
                    title="Klicken zum Ändern"
                >
                    <ActionIcon size={12} />
                    {(target.type === 'layout' || target.path === 'layout') ? "Global Layout" : config.label}
                </button>

                {/* Path Input/Display */}
                {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                        <Input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') { setIsEditing(false); setEditValue(target.path); }
                            }}
                            className="h-7 text-sm font-mono bg-black/50 border-white/20 flex-1"
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/20" onClick={handleSave}>
                            <Check size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => { setIsEditing(false); setEditValue(target.path); }}>
                            <X size={14} />
                        </Button>
                    </div>
                ) : (
                    <code
                        onClick={() => setIsEditing(true)}
                        className={cn(
                            "flex-1 text-sm font-mono px-2 py-0.5 rounded cursor-pointer transition-all",
                            `text-${config.color}-200 hover:bg-white/5 hover:text-white`
                        )}
                        title="Klicken zum Bearbeiten"
                    >
                        {target.path || '/...'}
                    </code>
                )}

                {/* Delete Button */}
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-full"
                    onClick={() => onRemove(target.id)}
                >
                    <Trash2 size={12} />
                </Button>
            </div>

            {/* Description (AI Generated) */}
            {target.description && (
                <div className="mb-3 px-3 py-2 bg-black/20 rounded border border-white/5 text-xs text-gray-400 italic">
                    <div className="flex items-start gap-2">
                        <Sparkles size={10} className="text-purple-400 mt-0.5 shrink-0" />
                        <span>{target.description}</span>
                    </div>
                </div>
            )}

            {/* Connected Sources */}
            <div className="space-y-1.5 flex-1">
                {connectedSources.length > 0 ? (
                    connectedSources.map(source => (
                        <div key={source.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-black/20 border border-white/5 text-[11px] text-gray-400 group/item">
                            <CornerDownRight size={10} className="text-gray-600" />
                            <span className="font-mono truncate flex-1 text-gray-300">
                                {getPathFromUrl(source.url)}
                            </span>
                            <button
                                onClick={() => onDisconnect(target.id, source.id)}
                                className="opacity-0 group-hover/item:opacity-100 text-gray-600 hover:text-red-400 transition-opacity p-1"
                                title="Verbindung trennen"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className={cn(
                        "h-full min-h-[40px] border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center text-[10px] text-gray-600 transition-colors",
                        isOver ? "bg-purple-500/5 border-purple-500/20" : ""
                    )}>
                        {isOver ? "Hier ablegen..." : "Quellseiten hierhin ziehen"}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// SVG CONNECTIONS OVERLAY
// ============================================================================

function ConnectionLines({
    sources,
    targets,
    sourceRefs,
    targetRefs,
    containerRef,
    hoveredItem
}: {
    sources: any[];
    targets: any[];
    sourceRefs: any;
    targetRefs: any;
    containerRef: any;
    hoveredItem: any;
}) {
    const [, forceUpdate] = useState({});

    // Update lines on any change/scroll/resize
    useEffect(() => {
        const handleUpdate = () => forceUpdate({});
        const panels = containerRef.current?.querySelectorAll('.overflow-y-auto');
        panels?.forEach((p: any) => p.addEventListener('scroll', handleUpdate));
        window.addEventListener('resize', handleUpdate);

        let rafId: number;
        const loop = () => {
            handleUpdate();
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);

        return () => {
            panels?.forEach((p: any) => p.removeEventListener('scroll', handleUpdate));
            window.removeEventListener('resize', handleUpdate);
            cancelAnimationFrame(rafId);
        };
    }, [sources, targets, containerRef]);

    if (!containerRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const paths: any[] = [];

    const colors = ['emerald', 'blue', 'amber', 'rose'];

    targets.forEach(target => {
        const targetEl = targetRefs.current.get(target.id);
        if (!targetEl) return;

        const targetRect = targetEl.getBoundingClientRect();

        // Raw Target Y
        let rawTargetY = targetRect.top + targetRect.height / 2 - containerRect.top;
        const targetX = targetRect.left - containerRect.left;

        // Clamp
        const margin = 50;
        const isTargetVisible = rawTargetY > -margin && rawTargetY < containerRect.height + margin;
        const clampedTargetY = Math.max(-margin, Math.min(containerRect.height + margin, rawTargetY));

        const config = actionConfig[target.action as keyof typeof actionConfig];

        target.sourceIds.forEach((sourceId: any) => {
            const sourceEl = sourceRefs.current.get(sourceId);
            if (!sourceEl) return;

            const sourceRect = sourceEl.getBoundingClientRect();

            // Raw Source Y
            let rawSourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
            const sourceX = sourceRect.right - containerRect.left;

            // Clamp Source
            const isSourceVisible = rawSourceY > -margin && rawSourceY < containerRect.height + margin;
            const clampedSourceY = Math.max(-margin, Math.min(containerRect.height + margin, rawSourceY));

            if (rawTargetY < -margin && rawSourceY < -margin) return;
            if (rawTargetY > containerRect.height + margin && rawSourceY > containerRect.height + margin) return;

            // Interaction
            const isRelated = hoveredItem === sourceId || hoveredItem === target.id;
            const isFaded = hoveredItem && !isRelated;
            const strokeWidth = isRelated ? 2.5 : 1.5;
            const opacity = isFaded ? 0.1 : (isRelated ? 1 : 0.4);

            // Curve
            const dist = Math.abs(targetX - sourceX);
            const cpOffset = Math.max(dist * 0.5, 80);

            const d = `M ${sourceX} ${clampedSourceY} 
                       C ${sourceX + cpOffset} ${clampedSourceY}, 
                         ${targetX - cpOffset} ${clampedTargetY}, 
                         ${targetX} ${clampedTargetY}`;

            paths.push(
                <g key={`${sourceId}-${target.id}`} style={{ opacity, transition: 'opacity 0.3s ease' }}>
                    {/* Shadow */}
                    {isRelated && (
                        <path
                            d={d}
                            fill="none"
                            stroke={`var(--color-${config.color}-500)`}
                            strokeWidth={strokeWidth + 4}
                            strokeOpacity="0.15"
                            strokeLinecap="round"
                        />
                    )}
                    {/* Main */}
                    <path
                        d={d}
                        fill="none"
                        stroke={`var(--color-${config.color}-500)`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={isRelated ? "none" : "4 4"}
                        markerEnd={(isTargetVisible && isRelated) ? `url(#arrow-${config.color})` : undefined}
                        className={cn(
                            !isRelated && "animate-[dash_60s_linear_infinite]"
                        )}
                    />
                </g>
            );
        });
    });

    return (
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10 overflow-visible">
            <defs>
                {colors.map(color => (
                    <marker
                        key={color}
                        id={`arrow-${color}`}
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={`var(--color-${color}-500)`} />
                    </marker>
                ))}
            </defs>
            {paths}
        </svg>
    );
}

const getPathFromUrl = (url: string) => {
    if (!url) return '/';
    try {
        // If it starts with /, it's already a path
        if (url.startsWith('/')) return url;
        return new URL(url).pathname;
    } catch {
        return url; // Fallback to original string if parsing fails
    }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DualPanelMapper({ sources, initialTargets, onSave, onGenerateSpecs }: DualPanelMapperProps) {
    const [targets, setTargets] = useState<TargetSlot[]>(initialTargets || []);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isStrictMode, setIsStrictMode] = useState(false);
    const [validationResult, setValidationResult] = useState<MappingValidationResult | null>(null);
    const [showValidationModal, setShowValidationModal] = useState(false);

    // Sync with external updates (e.g., session loading, navigation)
    useEffect(() => {
        if (initialTargets) {
            setTargets(initialTargets);
            setHasChanges(false); // Reset changes flag when loading new data
        }
    }, [initialTargets]);

    // Real-time validation
    useEffect(() => {
        const result = MappingValidator.validate(sources, targets);
        setValidationResult(result);
    }, [sources, targets]);

    // Initial Audit to fix incorrect statuses
    useEffect(() => {
        setTargets(prev => prev.map(t => {
            // 1. Force Merge if multiple sources (and not explicitly deleted)
            if (t.sourceIds.length > 1 && t.action !== 'delete' && t.action !== 'merge') {
                return { ...t, action: 'merge' };
            }

            // 2. Check Redirect vs Keep for single source
            if (t.sourceIds.length === 1 && t.action !== 'delete') {
                const source = sources.find(s => s.id === t.sourceIds[0]);
                if (source) {
                    const sPath = getPathFromUrl(source.url);
                    const tPath = getPathFromUrl(t.path);
                    const match = sPath === tPath;

                    if (match && t.action !== 'keep') return { ...t, action: 'keep' };
                    if (!match && t.action === 'keep') return { ...t, action: 'redirect' };
                }
            }
            return t;
        }));
    }, [sources]); // Run when sources match

    const handleToggleStrict = () => {
        const newStrict = !isStrictMode;
        setIsStrictMode(newStrict);

        if (newStrict) {
            // Enforce Strict Mode: Set path = source.url for non-merge/delete items
            setTargets(prev => prev.map(t => {
                // Ignore empty targets
                if (t.sourceIds.length === 0) return t;

                // 1. Force Merge if multiple sources (unless explicitly deleted)
                if (t.sourceIds.length > 1 && t.action !== 'delete') {
                    return t.action !== 'merge' ? { ...t, action: 'merge' } : t;
                }

                // 2. Force Keep for Single Source (unless explicitly deleted)
                if (t.sourceIds.length === 1 && t.action !== 'delete') {
                    const source = sources.find(s => s.id === t.sourceIds[0]);
                    if (source) {
                        // Strict: Path MUST match Source -> Keep
                        return { ...t, path: getPathFromUrl(source.url), action: 'keep' };
                    }
                }
                return t;
            }));
            setHasChanges(true);
        }
    };

    // Refs for connection lines
    const containerRef = useRef<HTMLDivElement>(null);
    const sourceRefs = useRef<Map<string, HTMLElement>>(new Map());
    const targetRefs = useRef<Map<string, HTMLElement>>(new Map());

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    // Track which sources are connected
    const connectedSourceIds = useMemo(() => {
        const ids = new Set<string>();
        targets.forEach(t => t.sourceIds.forEach(id => ids.add(id)));
        return ids;
    }, [targets]);

    // Count unconnected sources
    const unconnectedCount = sources.length - connectedSourceIds.size;

    // Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const sourceId = active.id as string;
        const targetId = over.id as string;

        // Add to target AND Remove from others (Exclusive Mapping)
        setTargets(prev => prev.map(t => {
            // Remove from existing if present
            const cleanSourceIds = t.sourceIds.filter(id => id !== sourceId);

            if (t.id === targetId) {
                // Add to new (if not present)
                const newSourceIds = [...cleanSourceIds, sourceId];

                // --- AUTO-DETECT ACTION LOGIC ---
                let newAction: TargetSlot['action'] = t.action;

                if (newSourceIds.length > 1) {
                    newAction = 'merge';
                } else if (newSourceIds.length === 1) {
                    // Find actual source object to compare URL
                    const sourceObj = sources.find(s => s.id === newSourceIds[0]);
                    const sourcePath = getPathFromUrl(sourceObj?.url || '');
                    const targetPath = getPathFromUrl(t.path);

                    // Simple path comparison (ignoring locale prefixes if needed, but strict for now)
                    // If target path is effectively same as source path -> keep
                    // Else -> redirect/rename
                    if (sourcePath === targetPath) {
                        newAction = 'keep';
                    } else {
                        newAction = 'redirect'; // Renamed
                    }
                }

                return { ...t, sourceIds: newSourceIds, action: newAction };
            }

            // Update action for the target we REMOVED from? 
            // Optional: If we removed the last source, what happens? 
            // Current logic leaves it as is, which is safer than potentially flipping it to 'delete' automatically.
            return { ...t, sourceIds: cleanSourceIds };
        }));
        setHasChanges(true);
    };

    const handleGenerate = async () => {
        if (!onGenerateSpecs) return;
        setIsGenerating(true);
        try {
            const updatedTargets = await onGenerateSpecs(targets);
            setTargets(updatedTargets);
            setHasChanges(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-Align Logic
    const handleAutoAlign = useCallback(() => {
        setTargets(prev => {
            const sorted = [...prev].sort((a, b) => {
                const getSourceIndex = (t: TargetSlot) => {
                    if (t.sourceIds.length === 0) return 99999;
                    // Find the average or min index of connected sources
                    // Using Min Index ensures the target moves to the level of its highest connected source
                    const indices = t.sourceIds.map(id => sources.findIndex(s => s.id === id)).filter(i => i !== -1);
                    return indices.length > 0 ? Math.min(...indices) : 99999;
                };
                return getSourceIndex(a) - getSourceIndex(b);
            });
            return sorted;
        });
        setHasChanges(true);
    }, [sources]);

    const handleAddTarget = useCallback(() => {
        const newTarget: TargetSlot = {
            id: `target-${Date.now()}`,
            path: '/neue-seite',
            label: 'Neue Seite',
            action: 'redirect',
            sourceIds: [],
        };
        setTargets(prev => [...prev, newTarget]);
        setHasChanges(true);
    }, []);

    const handlePathChange = useCallback((id: string, path: string) => {
        setTargets(prev => prev.map(t => {
            if (t.id !== id) return t;

            // Recalculate Action based on NEW path
            let newAction = t.action;
            // Only recalculate if currently 'keep' or 'redirect', don't override 'merge' or 'delete' unless necessary
            // Actually, if we rename a 'merge', it stays 'merge'? Yes.
            // But if we rename a 'keep', it might become 'redirect'.

            if (t.sourceIds.length === 1) {
                const sourceObj = sources.find(s => s.id === t.sourceIds[0]);
                const sourcePath = getPathFromUrl(sourceObj?.url || '');
                const targetPath = getPathFromUrl(path);

                if (sourcePath === targetPath) {
                    newAction = 'keep';
                } else {
                    newAction = 'redirect';
                }
            }

            return { ...t, path, action: newAction };
        }));
        setHasChanges(true);
    }, [sources]);

    const handleActionChange = useCallback((id: string, action: TargetSlot['action']) => {
        setTargets(prev => prev.map(t => t.id === id ? { ...t, action } : t));
        setHasChanges(true);
    }, []);

    const handleRemoveTarget = useCallback((id: string) => {
        setTargets(prev => prev.filter(t => t.id !== id));
        setHasChanges(true);
    }, []);

    const handleDisconnect = useCallback((targetId: string, sourceId: string) => {
        setTargets(prev => prev.map(t =>
            t.id === targetId
                ? { ...t, sourceIds: t.sourceIds.filter(id => id !== sourceId) }
                : t
        ));
        setHasChanges(true);
    }, []);

    const handleSave = useCallback(() => {
        // Check validation before saving
        if (validationResult && !validationResult.isComplete) {
            setShowValidationModal(true);
            return;
        }
        onSave?.(targets);
        setHasChanges(false);
    }, [targets, onSave, validationResult]);

    const handleForceSave = useCallback(() => {
        onSave?.(targets);
        setHasChanges(false);
        setShowValidationModal(false);
    }, [targets, onSave]);

    const handleAutoMapRemaining = useCallback(() => {
        if (!validationResult) return;

        const suggestions = MappingValidator.generateAutoMappingSuggestions(
            validationResult.unmappedSources,
            targets
        );

        // Separate: assign to existing targets vs create new targets
        const assignToExisting = suggestions.filter(s => s.existingTargetId);
        const createNew = suggestions.filter(s => !s.existingTargetId);

        setTargets(prev => {
            let updated = [...prev];

            // Add sources to existing targets
            assignToExisting.forEach(sug => {
                const idx = updated.findIndex(t => t.id === sug.existingTargetId);
                if (idx >= 0 && !updated[idx].sourceIds.includes(sug.sourceId)) {
                    updated[idx] = {
                        ...updated[idx],
                        sourceIds: [...updated[idx].sourceIds, sug.sourceId]
                    };
                }
            });

            // Create new targets for unmatched sources
            const newTargets: TargetSlot[] = createNew.map(sug => ({
                id: `target-auto-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                path: sug.suggestedPath,
                label: sug.suggestedPath,
                action: sug.action,
                sourceIds: [sug.sourceId],
                description: sug.reason,
                type: 'page'
            }));

            return [...updated, ...newTargets];
        });
        setHasChanges(true);
    }, [validationResult, targets]);

    const handleReset = useCallback(() => {
        setTargets(initialTargets || []);
        setHasChanges(false);
    }, [initialTargets]);

    const handleExport = useCallback(() => {
        const mapping = targets.flatMap(t =>
            t.sourceIds.map(sId => {
                const source = sources.find(s => s.id === sId);
                return {
                    old_url: source?.url,
                    new_path: t.path,
                    action: t.action,
                    type: t.type,
                    description: t.description,
                    content_goals: t.content_goals
                };
            })
        );
        const blob = new Blob([JSON.stringify({ mapping }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'migration-mapping.json';
        a.click();
    }, [targets, sources]);

    const handleDownloadSources = useCallback(() => {
        const data = sources.map(s => ({
            id: s.id,
            url: s.url,
            title: s.title,
            type: s.type,
            count: s.count,
            mapped: connectedSourceIds.has(s.id)
        }));
        const blob = new Blob([JSON.stringify({ sources: data, total: data.length }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'source-pages.json';
        a.click();
    }, [sources, connectedSourceIds]);

    const handleDownloadTargets = useCallback(() => {
        const data = targets.map(t => ({
            id: t.id,
            path: t.path,
            action: t.action,
            type: t.type,
            description: t.description,
            sourceCount: t.sourceIds.length,
            sources: t.sourceIds.map(sId => {
                const src = sources.find(s => s.id === sId);
                return src ? { id: src.id, url: src.url, title: src.title } : { id: sId };
            })
        }));
        const blob = new Blob([JSON.stringify({ targets: data, total: data.length }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'target-pages.json';
        a.click();
    }, [targets, sources]);

    const activeSource = activeId ? sources.find(s => s.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div ref={containerRef} className="border border-white/10 rounded-xl bg-[#030304] overflow-hidden h-full flex flex-col relative select-none">
                {/* SVG Connections - Absolute Overlay */}
                <ConnectionLines
                    sources={sources}
                    targets={targets}
                    sourceRefs={sourceRefs}
                    targetRefs={targetRefs}
                    containerRef={containerRef}
                    hoveredItem={hoveredItem}
                />

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-[#030304] flex items-center justify-between z-30 relative shadow-md">
                    <div className="flex items-center gap-4">
                        <h3 className="text-base font-bold text-white tracking-tight">Seiten-Migration & Planung</h3>
                        <div className="h-4 w-px bg-white/10" />

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3">
                            <div className="w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all",
                                        validationResult?.isComplete ? "bg-emerald-500" : "bg-amber-500"
                                    )}
                                    style={{ width: `${validationResult?.coveragePercentage || 0}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono text-gray-500">
                                {validationResult?.mappedSources || 0} / {validationResult?.totalSources || 0}
                            </span>
                            {validationResult?.isComplete ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                                validationResult && validationResult.unmappedSources.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                                        {validationResult.unmappedSources.length} OFFEN
                                    </span>
                                )
                            )}
                        </div>

                        {hasChanges && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/20 animate-pulse">
                                Änderungen aktiv
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleToggleStrict}
                            title={isStrictMode ? "Strikt-Modus deaktivieren" : "Strikt-Modus aktivieren (Erzwingt identische URLs)"}
                            className={cn(
                                "h-8 px-2 text-xs mr-1 transition-all border",
                                isStrictMode
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                    : "text-gray-400 border-transparent hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Lock size={14} className={cn("mr-1.5", isStrictMode && "fill-current")} />
                            {isStrictMode ? "Strikt" : "Flexibel"}
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleAutoAlign}
                            title="Ziele nach Quellen anordnen (Auto-Align)"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white mr-1"
                        >
                            <ArrowUpDown size={14} />
                        </Button>

                        {onGenerateSpecs && (
                            <Button
                                size="sm"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="h-8 text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 mr-2"
                            >
                                {isGenerating ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-2" />}
                                AI Plan Generieren
                            </Button>
                        )}

                        {/* Auto-Map Button */}
                        {validationResult && !validationResult.isComplete && (
                            <Button
                                size="sm"
                                onClick={handleAutoMapRemaining}
                                className="h-8 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 mr-2"
                            >
                                <Zap size={14} className="mr-2" />
                                Auto-Map ({validationResult.unmappedSources.length})
                            </Button>
                        )}

                        <Button size="sm" variant="ghost" onClick={handleExport} className="h-8 text-xs text-gray-400">
                            <Download size={14} className="mr-2" /> Export
                        </Button>

                        {hasChanges && (
                            <>
                                <Button size="sm" variant="ghost" onClick={handleReset} className="h-8 text-xs text-gray-400">
                                    <RotateCcw size={14} className="mr-2" /> Reset
                                </Button>
                                <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 font-semibold shadow-lg shadow-emerald-900/20">
                                    <Save size={14} className="mr-2" /> Speichern
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-hidden z-20 relative bg-[url('/grid-pattern.svg')] bg-[length:20px_20px]">

                    {/* LEFT: Source Pages */}
                    <div className="flex flex-col bg-[#050508] border border-white/5 rounded-xl overflow-hidden z-20 shadow-lg">
                        <div className="px-5 py-3 border-b border-white/5 bg-[#030304]/80 backdrop-blur-sm z-30">
                            <h4 className="h-7 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                                <span className="flex items-center gap-2"><FolderOpen size={14} /> Quellseiten (Ist-Zustand)</span>
                                <div className="flex items-center gap-2">
                                    {unconnectedCount > 0 && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white">
                                            {unconnectedCount} offen
                                        </span>
                                    )}
                                    <button onClick={handleDownloadSources} className="text-gray-500 hover:text-white transition-colors" title="Quellseiten herunterladen">
                                        <Download size={12} />
                                    </button>
                                </div>
                            </h4>
                        </div>
                        <div className="flex-1 p-5 space-y-3 overflow-y-auto custom-scrollbar">
                            {sources.map(source => (
                                <div key={source.id} ref={el => { if (el) sourceRefs.current.set(source.id, el); else sourceRefs.current.delete(source.id); }}>
                                    <DraggableSource
                                        source={source}
                                        isConnected={connectedSourceIds.has(source.id)}
                                        onHoverChange={setHoveredItem}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Target Structure */}
                    <div className="flex flex-col bg-[#050508] border border-white/5 rounded-xl overflow-hidden z-20 shadow-lg">
                        <div className="px-5 py-3 border-b border-white/5 bg-[#030304]/80 backdrop-blur-sm z-30">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} /> Zielstruktur (Soll-Zustand)
                                    <button onClick={handleDownloadTargets} className="text-gray-500 hover:text-white transition-colors" title="Zielseiten herunterladen">
                                        <Download size={12} />
                                    </button>
                                </h4>
                                <Button size="sm" variant="ghost" onClick={handleAddTarget} className="h-7 text-xs text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                                    <Plus size={14} className="mr-1.5" /> Neues Ziel
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar relative">
                            {targets.map(target => (
                                <div key={target.id} ref={el => { if (el) targetRefs.current.set(target.id, el); else targetRefs.current.delete(target.id); }}>
                                    <DroppableTarget
                                        target={target}
                                        sources={sources}
                                        onPathChange={handlePathChange}
                                        onActionChange={handleActionChange}
                                        onRemove={handleRemoveTarget}
                                        onDisconnect={handleDisconnect}
                                        onHoverChange={setHoveredItem}
                                    />
                                </div>
                            ))}

                            {targets.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-xl m-4">
                                    <p className="text-sm text-gray-500 mb-4">Noch keine Zielseiten definiert.</p>
                                    <Button size="sm" variant="outline" onClick={handleAddTarget}>
                                        <Plus size={14} className="mr-2" /> Starten
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {activeSource && (
                    <div className="p-3 rounded-lg bg-[#111116] border border-emerald-500/50 shadow-2xl w-[300px] cursor-grabbing">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <FileText size={14} />
                            <code className="text-xs font-mono font-bold">
                                {getPathFromUrl(activeSource.url)}
                            </code>
                        </div>
                    </div>
                )}
            </DragOverlay>

            {/* Validation Modal */}
            {validationResult && (
                <ValidationModal
                    isOpen={showValidationModal}
                    validation={validationResult}
                    onClose={() => setShowValidationModal(false)}
                    onAutoFix={() => {
                        handleAutoMapRemaining();
                        setShowValidationModal(false);
                    }}
                    onForceSave={handleForceSave}
                />
            )}
        </DndContext>
    );
}
