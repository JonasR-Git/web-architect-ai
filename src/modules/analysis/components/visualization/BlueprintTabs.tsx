'use client';

import { cn } from '@/lib/utils';
import { LayoutDashboard, GitBranch, Box } from 'lucide-react';

export type BlueprintTab = 'overview' | 'mapping' | 'components';

interface BlueprintTabsProps {
    activeTab: BlueprintTab;
    onTabChange: (tab: BlueprintTab) => void;
    mappingCount?: number;
}

const TABS: { id: BlueprintTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'components', label: 'Komponenten', icon: Box },
    { id: 'mapping', label: 'Seitenübertragung', icon: GitBranch },
];

export function BlueprintTabs({ activeTab, onTabChange, mappingCount }: BlueprintTabsProps) {
    return (
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            isActive
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>

                        {/* Badge for mapping count */}
                        {tab.id === 'mapping' && mappingCount !== undefined && mappingCount > 0 && (
                            <span className={cn(
                                "ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                isActive ? "bg-blue-500/30 text-blue-300" : "bg-white/10 text-gray-400"
                            )}>
                                {mappingCount}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
