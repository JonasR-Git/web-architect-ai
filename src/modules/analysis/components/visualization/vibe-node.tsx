import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Globe, FileText, Anchor, Image as ImageIcon, Server, Smartphone, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'landing': return <Globe className="w-4 h-4 text-blue-400" />;
        case 'page': return <FileText className="w-4 h-4 text-purple-400" />;
        case 'resource': return <ImageIcon className="w-4 h-4 text-emerald-400" />;
        default: return <Anchor className="w-4 h-4 text-gray-400" />;
    }
};

export const VibeNode = memo(({ data, selected }: NodeProps) => {
    const { label, details, status } = data as any;
    const isLanding = details?.type === 'landing';

    return (
        <div className={cn(
            "relative min-w-[200px] px-4 py-3 rounded-xl transition-all duration-300",
            "bg-black/40 backdrop-blur-md border border-white/10 shadow-xl",
            "group hover:border-blue-500/50 hover:shadow-blue-500/10",
            selected ? "border-blue-500 shadow-blue-500/20 ring-1 ring-blue-500/50" : "",
            isLanding ? "min-w-[240px]" : ""
        )}>
            {/* Connection Handles */}
            <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 !h-2 border-none" />
            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2 border-none" />

            {/* Header / Title */}
            <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br border border-white/5",
                    isLanding ? "from-blue-600/20 to-purple-600/20" : "from-gray-800 to-gray-900"
                )}>
                    {getTypeIcon(details?.type || 'page')}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white/90 truncate" title={label as string}>
                        {label as string}
                    </h3>
                    <p className="text-[10px] text-white/50 font-mono truncate">
                        {details?.url ? new URL(details.url).hostname : ''}
                    </p>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/5">
                <div className="text-center p-1 rounded hover:bg-white/5">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Words</div>
                    <div className="text-xs font-mono text-white/80">{details?.wordCount || 0}</div>
                </div>
                <div className="text-center p-1 rounded hover:bg-white/5">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Links</div>
                    <div className="text-xs font-mono text-white/80">{details?.internalLinks?.length || 0}</div>
                </div>
                <div className="text-center p-1 rounded hover:bg-white/5">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Type</div>
                    <div className="text-xs font-semibold text-blue-400">{details?.type?.slice(0, 4) || 'PAGE'}</div>
                </div>
            </div>

            {/* Status Indicator (if analysis is done) */}
            {status && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-black" />
            )}
        </div>
    );
});

VibeNode.displayName = 'VibeNode';
