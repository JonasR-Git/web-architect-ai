'use client';

import { useState } from 'react';
import { ClusterSpec, ClusterComponentSpec, PageInstance, ComponentDefinition } from '@/types';
import { generateClusterComponentsAction, mapClusterInstancesAction } from '@/app/actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    Layers,
    Table,
    ChevronRight,
    Loader2,
    CheckCircle2,
    FileJson,
    Eye,
    X,
    Plus,
    Trash2,
    Settings2,
    Database,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClusterReviewCardProps {
    cluster: ClusterSpec;
    structure: any;
    onUpdate: (updated: ClusterSpec) => void;
}

export function ClusterReviewCard({ cluster, structure, onUpdate }: ClusterReviewCardProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isMapping, setIsMapping] = useState(false);
    const [mappingProgress, setMappingProgress] = useState(0);
    const [view, setView] = useState<'summary' | 'library' | 'instances'>('summary');
    const [selectedInstance, setSelectedInstance] = useState<PageInstance | null>(null);

    // Phase 1: Component Discovery
    const handleDiscoverComponents = async () => {
        setIsAnalyzing(true);
        try {
            // Select 5 diverse samples from instances
            const samples = cluster.instances.slice(0, 5).map(inst => {
                const node = structure.nodes.find((n: any) => n.url === inst.url);
                return { url: inst.url, html: node?.content?.rawText || '' };
            });

            const res = await generateClusterComponentsAction(samples, cluster.id);
            if (res.success && res.data) {
                onUpdate({
                    ...cluster,
                    componentSpec: res.data
                });
                setView('library');
                toast.success("Component Library Generated!");
            } else {
                toast.error("Discovery failed: " + res.error);
            }
        } catch (e) {
            toast.error("Error analyzing cluster");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Phase 2: Batch Mapping
    const handleMapAllInstances = async () => {
        if (!cluster.componentSpec) return;
        setIsMapping(true);
        setMappingProgress(0);

        const updatedInstances = [...cluster.instances];
        const total = updatedInstances.length;

        try {
            for (let i = 0; i < total; i++) {
                const inst = updatedInstances[i];
                if (inst.status === 'mapped') continue;

                setMappingProgress(Math.round(((i + 1) / total) * 100));

                const node = structure.nodes.find((n: any) => n.url === inst.url);
                const res = await mapClusterInstancesAction(
                    node?.content?.rawText || '',
                    inst.url,
                    cluster.componentSpec
                );

                if (res.success) {
                    updatedInstances[i] = {
                        ...inst,
                        contentData: res.data,
                        status: 'mapped'
                    };
                }
            }

            onUpdate({ ...cluster, instances: updatedInstances });
            toast.success(`Successfully mapped ${total} instances!`);
            setView('instances');
        } catch (e) {
            toast.error("Batch mapping interrupted");
        } finally {
            setIsMapping(false);
        }
    };

    const realMappedCount = cluster.instances.filter(i => i.status === 'mapped').length;

    return (
        <Card className="bg-[#0A0A0B] border-white/10 overflow-hidden shadow-2xl transition-all">
            {/* Header: Identity */}
            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <Layers size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white leading-tight">Cluster: {cluster.pattern}</h3>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {cluster.instances.length} Pages
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Automated Content Extraction & Component Modeling</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                    <TabButton active={view === 'summary'} onClick={() => setView('summary')} icon={<Settings2 size={12} />} label="Briefing" />
                    <TabButton active={view === 'library'} onClick={() => setView('library')} icon={<Database size={12} />} label="Library" disabled={!cluster.componentSpec} />
                    <TabButton active={view === 'instances'} onClick={() => setView('instances')} icon={<Table size={12} />} label="Instances" disabled={!cluster.componentSpec} />
                </div>
            </div>

            <div className="p-6">
                {/* VIEW: SUMMARY / DISCOVERY */}
                {view === 'summary' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cluster Strategy</h4>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    This cluster contains similarly structured pages. Instead of manual design, we define a shared
                                    <strong> Component Library</strong> and map all content into a structured JSON schema.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-xs text-gray-400">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        <span>Sampling 5 diverse instances (~50k tokens)</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-gray-400">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        <span>Automatic prop detection (Text, Images, Dates)</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-xs text-gray-400">
                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                        <span>Ready for Headless CMS Export</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex flex-col justify-center items-center p-8 bg-white/5 rounded-xl border border-white/10 border-dashed">
                                {!cluster.componentSpec ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                                            <Sparkles className="text-purple-400" size={32} />
                                        </div>
                                        <Button
                                            onClick={handleDiscoverComponents}
                                            disabled={isAnalyzing}
                                            className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20"
                                        >
                                            {isAnalyzing ? (
                                                <><Loader2 size={16} className="mr-2 animate-spin" /> Analyzing Samples...</>
                                            ) : (
                                                <><Sparkles size={16} className="mr-2" /> Start Analysis (Phase 1)</>
                                            )}
                                        </Button>
                                        <p className="text-[10px] text-gray-600 mt-4 text-center">
                                            AI will examine {Math.min(cluster.instances.length, 5)} pages to build the Content Schema.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 text-emerald-500 font-bold">
                                            {cluster.componentSpec.components.length}
                                        </div>
                                        <div className="text-center mb-4">
                                            <div className="text-sm font-bold text-white">Library Ready</div>
                                            <div className="text-xs text-gray-500">Union Set of components detected.</div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => setView('library')}
                                            className="border-white/10 hover:bg-white/5"
                                        >
                                            Review Library <ChevronRight size={14} className="ml-1" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: LIBRARY EDITOR */}
                {view === 'library' && cluster.componentSpec && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Component Library (Schema)</h4>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-8 text-[10px] border-white/10 hover:bg-white/5">
                                    <Plus size={12} className="mr-1" /> Add Component
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleMapAllInstances}
                                    disabled={isMapping}
                                    className="h-8 text-[10px] bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                                >
                                    {isMapping ? (
                                        <><Loader2 size={12} className="mr-1 animate-spin" /> Mapping {mappingProgress}%</>
                                    ) : (
                                        <><ArrowRight size={12} className="mr-1" /> Map All Instances (Phase 2)</>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cluster.componentSpec.components.map((comp, idx) => (
                                <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{comp.name}</div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1 text-gray-500 hover:text-white"><Settings2 size={12} /></button>
                                            <button className="p-1 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 line-clamp-2 mb-4 leading-relaxed">{comp.description}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {comp.props.map((p, pIdx) => (
                                            <span key={pIdx} className="text-[8px] font-mono bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
                                                {p.name}: {p.type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW: INSTANCE TABLE */}
                {view === 'instances' && (
                    <div className="animate-in fade-in">
                        {/* Table Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Instance Browser</h4>
                                <p className="text-[10px] text-gray-600 mt-1">{realMappedCount} of {cluster.instances.length} pages structured.</p>
                            </div>
                            <Button size="sm" variant="outline" className="h-8 text-[10px] border-white/10 text-emerald-400">
                                <FileJson size={12} className="mr-1" /> Export Cluster (JSON)
                            </Button>
                        </div>

                        {/* The List (Simplified Table) */}
                        <div className="space-y-2">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-5">Target Path</div>
                                <div className="col-span-2">Word Count</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                                {cluster.instances.map((inst, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.05] transition-colors items-center">
                                        <div className="col-span-1 text-[10px] text-gray-600 text-center font-mono">{idx + 1}</div>
                                        <div className="col-span-5 text-sm font-mono text-gray-300 truncate" title={inst.url}>{new URL(inst.url).pathname}</div>
                                        <div className="col-span-2 text-xs text-gray-500">{inst.wordCount} words</div>
                                        <div className="col-span-2">
                                            <span className={cn(
                                                "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                                                inst.status === 'mapped' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                            )}>
                                                {inst.status === 'mapped' ? 'STRUCTURED' : 'PENDING'}
                                            </span>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <button
                                                className="p-1.5 text-gray-500 hover:text-white transition-colors"
                                                disabled={inst.status !== 'mapped'}
                                                onClick={() => setSelectedInstance(inst)}
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar (Global Mapping) */}
            {isMapping && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${mappingProgress}%` }}
                    />
                </div>
            )}

            {/* Instance Data Viewer Modal */}
            {selectedInstance && (
                <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl animate-in fade-in flex items-center justify-center p-8">
                    <div className="bg-[#0D0D12] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <FileJson className="text-blue-400" />
                                    Structured Content: {new URL(selectedInstance.url).pathname}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Verification of AI-mapped components and props.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedInstance(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-black/40 font-mono text-sm custom-scrollbar">
                            <pre className="text-blue-300">
                                {JSON.stringify(selectedInstance.contentData, null, 2)}
                            </pre>
                        </div>

                        <div className="p-4 border-t border-white/5 bg-white/5 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                className="border-white/10 hover:bg-white/5"
                                onClick={() => setSelectedInstance(null)}
                            >
                                Close
                            </Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-500">
                                <CheckCircle2 size={16} className="mr-2" /> Approve Mapping
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

function TabButton({ active, onClick, icon, label, disabled }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1.5 transition-all",
                active
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
