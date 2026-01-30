'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X, AlertTriangle, Zap, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MappingValidationResult } from '@/types';

interface ValidationModalProps {
    isOpen: boolean;
    validation: MappingValidationResult;
    onClose: () => void;
    onAutoFix: () => void;
    onForceSave: () => void;
}

export function ValidationModal({
    isOpen,
    validation,
    onClose,
    onAutoFix,
    onForceSave
}: ValidationModalProps) {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50">
                <div className="bg-[#111116] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-amber-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Unvollständige Zuordnung</h2>
                                <p className="text-sm text-gray-400">
                                    {validation.unmappedSources.length} Quellseite(n) noch nicht zugeordnet
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {/* Coverage Stats */}
                        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">Abdeckung</span>
                                <span className="text-lg font-bold text-white">
                                    {validation.coveragePercentage}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 transition-all"
                                    style={{ width: `${validation.coveragePercentage}%` }}
                                />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                {validation.mappedSources} von {validation.totalSources} Quellen zugeordnet
                            </div>
                        </div>

                        {/* Unmapped Sources List */}
                        {validation.unmappedSources.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    Nicht zugeordnete Quellen
                                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                        {validation.unmappedSources.length}
                                    </span>
                                </h3>
                                <div className="space-y-2">
                                    {validation.unmappedSources.slice(0, 10).map(source => (
                                        <div
                                            key={source.id}
                                            className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-white truncate">
                                                        {source.title || source.url}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                                        {source.url}
                                                    </div>
                                                    {source.suggestedTarget && (
                                                        <div className="text-xs text-blue-400 mt-1">
                                                            Vorgeschlagen: {source.suggestedTarget}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={cn(
                                                    "text-[10px] px-2 py-1 rounded font-bold uppercase",
                                                    source.type === 'cluster'
                                                        ? "bg-purple-500/20 text-purple-400"
                                                        : "bg-blue-500/20 text-blue-400"
                                                )}>
                                                    {source.type === 'cluster' ? `${source.count || 0} Seiten` : 'Einzelseite'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {validation.unmappedSources.length > 10 && (
                                        <div className="text-xs text-center text-gray-500 py-2">
                                            ... und {validation.unmappedSources.length - 10} weitere
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 border-t border-white/5 bg-[#030304] flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white"
                        >
                            Abbrechen
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={onAutoFix}
                                className="bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
                            >
                                <Zap size={14} className="mr-2" />
                                Automatisch zuordnen
                            </Button>
                            <Button
                                onClick={onForceSave}
                                className="bg-emerald-600 hover:bg-emerald-500"
                            >
                                <Save size={14} className="mr-2" />
                                Trotzdem speichern
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
