'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    ArrowRight, Check, Merge, Trash2, CornerDownRight, AlertCircle,
    Edit2, Save, X, Plus, RotateCcw, GripVertical, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ============================================================================
// TYPES
// ============================================================================

export interface PageMapping {
    old_url: string;
    new_path: string;
    action: 'keep' | 'merge' | 'redirect' | 'delete';
    reason?: string;
    merged_with?: string | null;
}

interface InteractivePageMappingTableProps {
    mapping: PageMapping[];
    onMappingChange?: (newMapping: PageMapping[]) => void;
    readOnly?: boolean;
}

// ============================================================================
// ACTION CONFIG
// ============================================================================

const actionConfig = {
    keep: {
        label: 'Beibehalten',
        icon: Check,
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        textColor: 'text-emerald-400',
        badgeColor: 'bg-emerald-500/20 text-emerald-400',
        hoverBg: 'hover:bg-emerald-500/20',
    },
    merge: {
        label: 'Zusammenführen',
        icon: Merge,
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        textColor: 'text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-400',
        hoverBg: 'hover:bg-amber-500/20',
    },
    redirect: {
        label: 'Umleiten',
        icon: CornerDownRight,
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-400',
        badgeColor: 'bg-blue-500/20 text-blue-400',
        hoverBg: 'hover:bg-blue-500/20',
    },
    delete: {
        label: 'Löschen',
        icon: Trash2,
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        textColor: 'text-rose-400',
        badgeColor: 'bg-rose-500/20 text-rose-400',
        hoverBg: 'hover:bg-rose-500/20',
    },
};

const actionOrder: (keyof typeof actionConfig)[] = ['keep', 'redirect', 'merge', 'delete'];

// ============================================================================
// SINGLE ROW COMPONENT
// ============================================================================

interface MappingRowProps {
    item: PageMapping;
    index: number;
    onUpdate: (index: number, updated: PageMapping) => void;
    onDelete: (index: number) => void;
    readOnly: boolean;
}

function MappingRow({ item, index, onUpdate, onDelete, readOnly }: MappingRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<PageMapping>(item);

    const config = actionConfig[item.action];
    const Icon = config.icon;

    const handleSave = useCallback(() => {
        onUpdate(index, editData);
        setIsEditing(false);
    }, [index, editData, onUpdate]);

    const handleCancel = useCallback(() => {
        setEditData(item);
        setIsEditing(false);
    }, [item]);

    const cycleAction = useCallback(() => {
        if (readOnly) return;
        const currentIndex = actionOrder.indexOf(item.action);
        const nextIndex = (currentIndex + 1) % actionOrder.length;
        onUpdate(index, { ...item, action: actionOrder[nextIndex] });
    }, [item, index, onUpdate, readOnly]);

    // EDITING MODE
    if (isEditing) {
        return (
            <div className={cn(
                "p-4 border-l-4 transition-all",
                "bg-blue-500/10 border-blue-500"
            )}>
                <div className="space-y-3">
                    {/* Old URL (readonly) */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20">Alt:</span>
                        <code className="text-xs text-gray-400 font-mono flex-1 bg-black/20 px-2 py-1 rounded">
                            {item.old_url}
                        </code>
                    </div>

                    {/* New Path (editable) */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20">Neu:</span>
                        <Input
                            value={editData.new_path}
                            onChange={(e) => setEditData({ ...editData, new_path: e.target.value })}
                            className="flex-1 h-8 text-xs font-mono bg-black/30 border-white/10"
                            placeholder="/neue-url"
                        />
                    </div>

                    {/* Action Selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20">Aktion:</span>
                        <div className="flex gap-1">
                            {actionOrder.map((action) => {
                                const cfg = actionConfig[action];
                                const ActionIcon = cfg.icon;
                                return (
                                    <button
                                        key={action}
                                        onClick={() => setEditData({ ...editData, action })}
                                        className={cn(
                                            "px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-all border",
                                            editData.action === action
                                                ? `${cfg.badgeColor} border-current`
                                                : "bg-white/5 border-white/10 text-gray-500 hover:bg-white/10"
                                        )}
                                    >
                                        <ActionIcon size={10} />
                                        {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reason (editable) */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-20">Notiz:</span>
                        <Input
                            value={editData.reason || ''}
                            onChange={(e) => setEditData({ ...editData, reason: e.target.value })}
                            className="flex-1 h-8 text-xs bg-black/30 border-white/10"
                            placeholder="Optionale Begründung..."
                        />
                    </div>

                    {/* Merge Target (if merge action) */}
                    {editData.action === 'merge' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-20">Ziel:</span>
                            <Input
                                value={editData.merged_with || ''}
                                onChange={(e) => setEditData({ ...editData, merged_with: e.target.value })}
                                className="flex-1 h-8 text-xs font-mono bg-black/30 border-white/10"
                                placeholder="/ziel-seite"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs">
                            <X size={12} className="mr-1" /> Abbrechen
                        </Button>
                        <Button size="sm" onClick={handleSave} className="h-7 text-xs bg-blue-600 hover:bg-blue-500">
                            <Save size={12} className="mr-1" /> Speichern
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // DISPLAY MODE
    return (
        <div className={cn(
            "group p-3 transition-all hover:bg-white/[0.02] border-l-4",
            config.borderColor
        )}>
            <div className="flex items-start gap-3">
                {/* Drag Handle (future) */}
                {!readOnly && (
                    <GripVertical
                        size={14}
                        className="text-gray-600 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                )}

                {/* Icon */}
                <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.textColor)} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Old URL */}
                        <code className="text-xs text-gray-400 font-mono break-all">
                            {item.old_url}
                        </code>

                        {item.action !== 'delete' && (
                            <>
                                <ArrowRight className="w-3 h-3 text-gray-600 shrink-0" />
                                {/* New Path - Clickable for inline edit */}
                                <code
                                    className={cn(
                                        "text-xs font-mono px-1 rounded cursor-pointer transition-all",
                                        config.textColor,
                                        !readOnly && "hover:bg-white/10 hover:ring-1 hover:ring-white/20"
                                    )}
                                    onClick={() => !readOnly && setIsEditing(true)}
                                    title={readOnly ? undefined : "Klicken zum Bearbeiten"}
                                >
                                    {item.new_path}
                                </code>
                            </>
                        )}

                        {/* Action Badge - Clickable to cycle */}
                        <button
                            onClick={cycleAction}
                            disabled={readOnly}
                            className={cn(
                                "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 transition-all",
                                config.badgeColor,
                                !readOnly && "cursor-pointer hover:ring-1 hover:ring-white/30"
                            )}
                            title={readOnly ? undefined : "Klicken zum Ändern"}
                        >
                            {config.label}
                        </button>
                    </div>

                    {/* Reason */}
                    {item.reason && (
                        <p className="text-[11px] text-gray-500 mt-1 italic">
                            "{item.reason}"
                        </p>
                    )}
                </div>

                {/* Edit/Delete Buttons */}
                {!readOnly && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-gray-400 hover:text-white"
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit2 size={12} />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => onDelete(index)}
                        >
                            <Trash2 size={12} />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InteractivePageMappingTable({
    mapping: initialMapping,
    onMappingChange,
    readOnly = false
}: InteractivePageMappingTableProps) {
    const [mapping, setMapping] = useState<PageMapping[]>(initialMapping);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync with external updates (e.g., session loading, navigation)
    useEffect(() => {
        if (initialMapping) {
            setMapping(initialMapping);
            setHasChanges(false);
        }
    }, [initialMapping]);

    // Stats
    const stats = useMemo(() => {
        const counts = { keep: 0, merge: 0, redirect: 0, delete: 0 };
        mapping.forEach(m => {
            if (counts[m.action] !== undefined) counts[m.action]++;
        });
        return counts;
    }, [mapping]);

    // Handlers
    const handleUpdate = useCallback((index: number, updated: PageMapping) => {
        const newMapping = [...mapping];
        newMapping[index] = updated;
        setMapping(newMapping);
        setHasChanges(true);
    }, [mapping]);

    const handleDelete = useCallback((index: number) => {
        const newMapping = mapping.filter((_, i) => i !== index);
        setMapping(newMapping);
        setHasChanges(true);
    }, [mapping]);

    const handleAdd = useCallback(() => {
        const newItem: PageMapping = {
            old_url: 'https://example.com/neue-seite',
            new_path: '/neue-seite',
            action: 'keep',
            reason: 'Manuell hinzugefügt'
        };
        setMapping([...mapping, newItem]);
        setHasChanges(true);
    }, [mapping]);

    const handleSaveAll = useCallback(() => {
        onMappingChange?.(mapping);
        setHasChanges(false);
    }, [mapping, onMappingChange]);

    const handleReset = useCallback(() => {
        setMapping(initialMapping);
        setHasChanges(false);
    }, [initialMapping]);

    const handleExport = useCallback(() => {
        // Generate redirect rules
        const redirects = mapping
            .filter(m => m.action === 'redirect' || m.action === 'keep')
            .map(m => {
                // Extract path - handle both full URLs and relative paths
                let oldPath: string;
                try {
                    // Try to parse as URL (e.g., "https://example.com/blog")
                    oldPath = new URL(m.old_url).pathname;
                } catch {
                    // If it fails, assume it's already a path (e.g., "/blog")
                    oldPath = m.old_url.startsWith('/') ? m.old_url : `/${m.old_url}`;
                }
                return { source: oldPath, destination: m.new_path, permanent: true };
            });

        const exportData = {
            mappings: mapping,
            redirects,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'migration-mapping.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [mapping]);

    if (!mapping || mapping.length === 0) {
        return (
            <div className="border border-white/10 rounded-xl bg-[#0f1117] p-8 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400 text-sm">Keine Page-Mapping-Daten verfügbar</p>
                {!readOnly && (
                    <Button size="sm" onClick={handleAdd} className="mt-4">
                        <Plus size={14} className="mr-2" /> Erste Seite hinzufügen
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="border border-white/10 rounded-xl bg-[#0f1117] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-white/80">Page Migration Mapping</h3>
                    <span className="text-xs font-mono text-white/40">{mapping.length} Seiten</span>
                    {hasChanges && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 animate-pulse">
                            Ungespeichert
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(stats).map(([action, count]) => {
                        if (count === 0) return null;
                        const config = actionConfig[action as keyof typeof actionConfig];
                        return (
                            <span
                                key={action}
                                className={cn(
                                    "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                                    config.badgeColor
                                )}
                            >
                                {count} {config.label}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Action Bar (if editable) */}
            {!readOnly && (
                <div className="px-4 py-2 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={handleAdd} className="h-7 text-xs">
                            <Plus size={12} className="mr-1" /> Seite hinzufügen
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleExport} className="h-7 text-xs">
                            <Download size={12} className="mr-1" /> Export
                        </Button>
                    </div>

                    {hasChanges && (
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={handleReset} className="h-7 text-xs text-gray-400">
                                <RotateCcw size={12} className="mr-1" /> Zurücksetzen
                            </Button>
                            <Button size="sm" onClick={handleSaveAll} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500">
                                <Save size={12} className="mr-1" /> Alle speichern
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Mapping List */}
            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                {mapping.map((item, index) => (
                    <MappingRow
                        key={`${item.old_url}-${index}`}
                        item={item}
                        index={index}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        readOnly={readOnly}
                    />
                ))}
            </div>

            {/* Help Text */}
            {!readOnly && (
                <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01]">
                    <p className="text-[10px] text-gray-500">
                        💡 <strong>Tipp:</strong> Klicke auf die neue URL oder den Status-Badge um schnell zu bearbeiten.
                        Für detaillierte Änderungen nutze das Edit-Icon.
                    </p>
                </div>
            )}
        </div>
    );
}

// Re-export original for backward compatibility
export { PageMappingTable } from './page-mapping-table';
