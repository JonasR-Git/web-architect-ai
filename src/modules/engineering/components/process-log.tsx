'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowRight, Radio, Cpu } from 'lucide-react';

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    meta?: {
        tokensIn?: number;
        tokensOut?: number;
        model?: string;
        duration?: string;
    };
}

interface ProcessLogProps {
    logs: LogEntry[];
    isCrawling: boolean;
    currentStep?: string;
    tokenStats?: {
        totalIn: number;
        totalOut: number;
    };
}

export function ProcessLog({ logs, isCrawling, currentStep, tokenStats }: ProcessLogProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, currentStep]);

    return (
        <div className="w-full border border-white/10 rounded-xl bg-[#050505]/60 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col h-[400px]">
            {/* Header / Current Activity */}
            <div className="flex flex-col border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white/90">Live Activity</span>
                    </div>

                    {/* Token Stats (Mini) */}
                    {tokenStats && (tokenStats.totalIn > 0 || tokenStats.totalOut > 0) && (
                        <div className="hidden sm:flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                            <div className="flex items-center gap-1">
                                <Cpu className="w-3 h-3" />
                                <span>Total: {((tokenStats.totalIn + tokenStats.totalOut) / 1000).toFixed(1)}k tokens</span>
                            </div>
                        </div>
                    )}

                    {isCrawling && (
                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 animate-pulse text-[10px] px-2 py-0.5 h-5">
                            <Radio className="w-3 h-3 mr-1" />
                            LIVE
                        </Badge>
                    )}
                </div>

                {/* Current Active Step Banner */}
                {currentStep && isCrawling && (
                    <div className="px-4 py-2 bg-blue-500/5 border-t border-blue-500/10 flex items-center gap-3">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                        <span className="text-xs font-mono text-blue-200 truncate">
                            {currentStep}...
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4 scrollbar-none">
                <div className="space-y-4">
                    {logs.map((log, index) => {
                        const isLast = index === logs.length - 1;

                        // Determine Icon & Color
                        let Icon = ArrowRight;
                        let iconColor = "text-gray-400";
                        let bgColor = "bg-gray-500/10";
                        let borderColor = "border-transparent";

                        switch (log.type) {
                            case 'success':
                                Icon = CheckCircle2;
                                iconColor = "text-emerald-400";
                                bgColor = "bg-emerald-500/10";
                                borderColor = "border-emerald-500/20";
                                break;
                            case 'warning':
                                Icon = AlertTriangle;
                                iconColor = "text-amber-400";
                                bgColor = "bg-amber-500/10";
                                borderColor = "border-amber-500/20";
                                break;
                            case 'error':
                                Icon = XCircle;
                                iconColor = "text-rose-400";
                                bgColor = "bg-rose-500/10";
                                borderColor = "border-rose-500/20";
                                break;
                            case 'info':
                            default:
                                Icon = ArrowRight;
                                iconColor = "text-blue-400";
                                bgColor = "bg-blue-500/10";
                                borderColor = "border-blue-500/10";
                                break;
                        }

                        return (
                            <div key={log.id} className="relative pl-6 group">
                                {/* Vertical Line Connection */}
                                {!isLast && (
                                    <div className="absolute left-[10px] top-6 bottom-[-24px] w-px bg-white/5 group-hover:bg-white/10 transition-colors" />
                                )}

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-start gap-3">
                                        {/* Icon Bubble */}
                                        <div className={cn(
                                            "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300",
                                            bgColor, borderColor
                                        )}>
                                            <Icon className={cn("w-3 h-3", iconColor)} />
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex flex-col min-w-0 flex-1 pt-0.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm font-medium leading-tight",
                                                    log.type === 'error' ? "text-rose-200" : "text-white/80"
                                                )}>
                                                    {log.message}
                                                </p>
                                                <span className="text-[10px] font-mono text-white/30 whitespace-nowrap pt-0.5">
                                                    {log.timestamp}
                                                </span>
                                            </div>

                                            {/* Meta / Tokens */}
                                            {log.meta && (
                                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                    {log.meta.model && (
                                                        <Badge variant="outline" className="text-[9px] h-4 border-white/10 bg-white/5 text-gray-400">
                                                            {log.meta.model.split('/').pop()}
                                                        </Badge>
                                                    )}
                                                    {log.meta.tokensIn !== undefined && (
                                                        <span className="text-[9px] text-gray-500 font-mono">
                                                            In: {log.meta.tokensIn}
                                                        </span>
                                                    )}
                                                    {log.meta.tokensOut !== undefined && (
                                                        <span className="text-[9px] text-gray-500 font-mono">
                                                            Out: {log.meta.tokensOut}
                                                        </span>
                                                    )}
                                                    {log.meta.duration && (
                                                        <span className="text-[9px] text-gray-500 font-mono">
                                                            {log.meta.duration}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Pending Indicator */}
                    {isCrawling && !currentStep && (
                        <div className="relative pl-6">
                            <div className="absolute left-0 mt-0.5 w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                            </div>
                            <div className="flex flex-col gap-1 pl-3 pt-0.5">
                                <span className="text-sm text-white/40 italic animate-pulse">Processing task...</span>
                            </div>
                        </div>
                    )}

                    {/* Dummy div for scrolling reference */}
                    <div ref={messagesEndRef} className="h-0 w-0" />
                </div>
            </ScrollArea>
        </div>
    );
}
