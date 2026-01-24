'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Merge, Trash2, CornerDownRight, AlertCircle } from 'lucide-react';

interface PageMapping {
    old_url: string;
    new_path: string;
    action: 'keep' | 'merge' | 'redirect' | 'delete';
    reason?: string;
    merged_with?: string | null;
}

interface PageMappingTableProps {
    mapping: PageMapping[];
}

const actionConfig = {
    keep: {
        label: 'Beibehalten',
        icon: Check,
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        textColor: 'text-emerald-400',
        badgeColor: 'bg-emerald-500/20 text-emerald-400',
    },
    merge: {
        label: 'Zusammengeführt',
        icon: Merge,
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        textColor: 'text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-400',
    },
    redirect: {
        label: 'Umgeleitet',
        icon: CornerDownRight,
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-400',
        badgeColor: 'bg-blue-500/20 text-blue-400',
    },
    delete: {
        label: 'Entfernt',
        icon: Trash2,
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/20',
        textColor: 'text-rose-400',
        badgeColor: 'bg-rose-500/20 text-rose-400',
    },
};

export function PageMappingTable({ mapping }: PageMappingTableProps) {
    // Group merged pages by their target
    const groupedMapping = useMemo(() => {
        const groups: { target: string; items: PageMapping[]; action: string }[] = [];
        const processed = new Set<number>();

        mapping.forEach((item, index) => {
            if (processed.has(index)) return;

            if (item.action === 'merge' && item.merged_with) {
                // Find all pages that merge to the same target
                const mergeGroup = mapping.filter(
                    (m, i) =>
                        m.action === 'merge' &&
                        (m.new_path === item.new_path || m.merged_with === item.merged_with)
                );
                mergeGroup.forEach((_, i) => {
                    const originalIndex = mapping.findIndex(m => m === mergeGroup[i]);
                    processed.add(originalIndex);
                });
                groups.push({
                    target: item.new_path,
                    items: mergeGroup,
                    action: 'merge',
                });
            } else {
                processed.add(index);
                groups.push({
                    target: item.new_path,
                    items: [item],
                    action: item.action,
                });
            }
        });

        return groups;
    }, [mapping]);

    // Count by action
    const stats = useMemo(() => {
        const counts = { keep: 0, merge: 0, redirect: 0, delete: 0 };
        mapping.forEach(m => {
            if (counts[m.action] !== undefined) counts[m.action]++;
        });
        return counts;
    }, [mapping]);

    if (!mapping || mapping.length === 0) {
        return (
            <div className="border border-white/10 rounded-xl bg-[#0f1117] p-8 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400 text-sm">Keine Page-Mapping-Daten verfügbar</p>
            </div>
        );
    }

    return (
        <div className="border border-white/10 rounded-xl bg-[#0f1117] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-white/80">Page Migration Mapping</h3>
                    <span className="text-xs font-mono text-white/40">{mapping.length} Seiten</span>
                </div>
                <div className="flex items-center gap-2">
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

            {/* Mapping List */}
            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto custom-scrollbar">
                {groupedMapping.map((group, groupIndex) => {
                    const config = actionConfig[group.action as keyof typeof actionConfig];
                    const Icon = config.icon;
                    const isMergeGroup = group.items.length > 1;

                    return (
                        <div
                            key={groupIndex}
                            className={cn(
                                "p-3 transition-colors hover:bg-white/[0.02]",
                                isMergeGroup && config.bgColor
                            )}
                        >
                            {/* Merge Group Header */}
                            {isMergeGroup && (
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
                                    <Icon className={cn("w-4 h-4", config.textColor)} />
                                    <span className={cn("text-xs font-semibold", config.textColor)}>
                                        {group.items.length} Seiten zusammengeführt zu
                                    </span>
                                    <code className="text-xs text-white font-mono bg-white/10 px-2 py-0.5 rounded">
                                        {group.target}
                                    </code>
                                </div>
                            )}

                            {/* Items */}
                            <div className={cn("space-y-2", isMergeGroup && "pl-6")}>
                                {group.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-start gap-3">
                                        {!isMergeGroup && (
                                            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.textColor)} />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <code className="text-xs text-gray-400 font-mono break-all">
                                                    {item.old_url}
                                                </code>

                                                {item.action !== 'delete' && (
                                                    <>
                                                        <ArrowRight className="w-3 h-3 text-gray-600 shrink-0" />
                                                        <code className={cn(
                                                            "text-xs font-mono",
                                                            config.textColor
                                                        )}>
                                                            {item.new_path}
                                                        </code>
                                                    </>
                                                )}

                                                {!isMergeGroup && (
                                                    <span className={cn(
                                                        "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0",
                                                        config.badgeColor
                                                    )}>
                                                        {config.label}
                                                    </span>
                                                )}
                                            </div>

                                            {item.reason && (
                                                <p className="text-[11px] text-gray-500 mt-1 italic">
                                                    "{item.reason}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Shared reason for merge groups */}
                            {isMergeGroup && group.items[0]?.reason && (
                                <p className="text-[11px] text-gray-500 mt-2 pl-6 italic border-t border-white/5 pt-2">
                                    "{group.items[0].reason}"
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
