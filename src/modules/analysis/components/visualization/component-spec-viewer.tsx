'use client';

import { useState } from 'react';
import { Layers, ChevronDown, ChevronRight, Layout, FormInput, Navigation, MousePointer, Table2, PanelLeft, LayoutGrid, Box, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icons mapping based on group names and common UI categories
const GROUP_ICONS: Record<string, React.ElementType> = {
    'Navigation': Navigation,
    'Forms': FormInput,
    'Formulare': FormInput,
    'Inputs': FormInput,
    'Layout': Layout,
    'Buttons': MousePointer,
    'Interaktion': MousePointer,
    'Data Display': Table2,
    'Tabellen': Table2,
    'Feedback': Box,
    'Content': LayoutGrid,
    'Inhalt': LayoutGrid,
    'Typography': Type,
    'Typografie': Type,
    'Atoms': Box,
    'Molecules': LayoutGrid,
    'Organisms': Layout,
    'Templates': PanelLeft
};

interface PropItem {
    name: string;
    type?: string;
    required?: boolean;
    default?: string | null;
    description?: string;
}

interface ComponentSpec {
    groups: {
        name: string;
        description?: string;
        components: {
            name: string;
            description: string;
            category?: string;
            usage?: string[];
            props?: (string | PropItem)[];
            variants?: { name: string; description: string }[];
            accessibility?: {
                role?: string | null;
                ariaAttributes?: string[];
                keyboardInteraction?: string;
                focusManagement?: string;
            };
            codeExample?: string;
        }[];
    }[];
    design_system?: any;
    patterns?: any[];
}


export function ComponentSpecViewer({ spec, isLoading }: { spec: any, isLoading?: boolean }) {
    // Adapter: Convert new "Library" format (Phase 2) to old "Groups" format for rendering
    const displaySpec = { ...spec };
    if (spec?.library && (!spec.groups || spec.groups.length === 0)) {
        displaySpec.groups = [];
        const { atoms, molecules, organisms } = spec.library;

        if (atoms?.length) {
            displaySpec.groups.push({
                name: 'Atoms',
                description: 'Base shadcn/ui primitives',
                components: atoms.map((c: any) => ({
                    ...c,
                    category: c.shadcn_base,
                    usage: Array.isArray(c.usage) ? c.usage : [c.usage],
                    description: c.description || `Based on ${c.shadcn_base}`
                }))
            });
        }
        if (molecules?.length) {
            displaySpec.groups.push({
                name: 'Molecules',
                description: 'Composite components',
                components: molecules.map((c: any) => ({
                    ...c,
                    category: 'Molecule',
                    usage: Array.isArray(c.usage) ? c.usage : [c.usage],
                    description: c.description
                }))
            });
        }
        if (organisms?.length) {
            displaySpec.groups.push({
                name: 'Organisms',
                description: 'Complex sections',
                components: organisms.map((c: any) => ({
                    ...c,
                    category: 'Organism',
                    usage: Array.isArray(c.usage) ? c.usage : [c.usage],
                    description: c.description
                }))
            });
        }
    }

    const groups = displaySpec.groups;

    if (isLoading && (!groups || groups.length === 0)) {
        return (
            <div className="space-y-4 animate-in fade-in">
                {/* Skeleton Loader for Components */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-white/5 rounded-xl bg-[#0f1117] overflow-hidden">
                        <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
                                <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            {[1, 2].map(j => (
                                <div key={j} className="flex gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
                                        <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div className="text-center text-xs text-blue-400 animate-pulse mt-4">
                    Generiere Komponenten-Spezifikationen...
                </div>
            </div>
        );
    }

    if (!groups || groups.length === 0) {
        return (
            <div className="border border-white/10 rounded-xl bg-[#0f1117] p-8 text-center h-full flex flex-col items-center justify-center">
                <Layers className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Keine Komponenten definiert</h3>
                <p className="text-gray-400 text-sm max-w-md">
                    Die Komponenten-Analyse wurde noch nicht durchgeführt oder hat keine Ergebnisse geliefert.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {groups.map((group: any, idx: number) => (
                <ComponentGroup key={idx} group={group} defaultExpanded={true} />
            ))}
        </div>
    );
}

// Helper to render props (supports both string[] and object[] format)
function renderProp(prop: string | PropItem, idx: number) {
    if (typeof prop === 'string') {
        return (
            <code key={idx} className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20 font-mono">
                {prop}
            </code>
        );
    }

    // Object format with type info
    const isRequired = prop.required;
    return (
        <code
            key={idx}
            className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border font-mono",
                isRequired
                    ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                    : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
            )}
            title={prop.description || `${prop.name}: ${prop.type || 'any'}`}
        >
            {prop.name}{prop.type ? `: ${prop.type}` : ''}{isRequired ? ' *' : ''}
        </code>
    );
}

function ComponentGroup({ group, defaultExpanded = false }: { group: any, defaultExpanded?: boolean }) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    // Try to find icon by exact name or substring match
    const iconName = Object.keys(GROUP_ICONS).find(k => group.name.toLowerCase().includes(k.toLowerCase()));
    const Icon = iconName ? GROUP_ICONS[iconName] : Layers;

    return (
        <div className="border border-white/10 rounded-xl bg-[#0f1117] overflow-hidden transition-all duration-200">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors border-b border-transparent data-[expanded=true]:border-white/5"
                data-expanded={isExpanded}
            >
                <div className="flex items-center gap-3 font-semibold text-white/90">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <span>{group.name}</span>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {group.components?.length || 0}
                    </span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            </button>

            {isExpanded && group.components && (
                <div className="divide-y divide-white/5">
                    {group.components.map((comp: any, idx: number) => (
                        <div key={idx} className="p-4 hover:bg-white/[0.02] transition-colors group">
                            <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
                                <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-mono text-sm font-bold text-emerald-400">
                                            {comp.name}
                                        </h4>
                                        {comp.category && (
                                            <span className="text-[9px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                {comp.category}
                                            </span>
                                        )}
                                        <div className="h-px flex-1 bg-white/5 mx-2 md:hidden"></div>
                                    </div>
                                    <p className="text-gray-400 text-xs leading-relaxed max-w-2xl">
                                        {comp.description}
                                    </p>

                                    {/* Props */}
                                    {comp.props && comp.props.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider py-0.5">Props:</span>
                                            {comp.props.map((prop: string | PropItem, i: number) => renderProp(prop, i))}
                                        </div>
                                    )}

                                    {/* Variants */}
                                    {comp.variants && comp.variants.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider py-0.5">Variants:</span>
                                            {comp.variants.map((v: any, i: number) => (
                                                <span key={i} className="text-[10px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                                                    {v.name || v}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Usage Badge */}
                                {comp.usage && comp.usage.length > 0 && (
                                    <div className="shrink-0 flex flex-col items-end gap-1.5 md:max-w-[200px]">
                                        <span className="text-[10px] text-gray-600 uppercase tracking-wider">Verwendung</span>
                                        <div className="flex flex-wrap gap-1 justify-end">
                                            {comp.usage.map((page: string, i: number) => (
                                                <span key={i} className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5 text-right truncate max-w-full">
                                                    {page}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

