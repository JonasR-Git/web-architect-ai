'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const MESSAGES = [
    "Analyzing site structure...",
    "Identifying key components...",
    "Evaluating accessibility compliance...",
    "Mapping user journeys...",
    "Optimizing navigation paths...",
    "Generating architectural blueprint...",
    "Synthesizing design patterns...",
    "Drafting migration strategy...",
    "Finalizing report..."
];

interface KeepAliveLogProps {
    isActive: boolean;
    intervalMs?: number;
    modelName?: string;
}

export function KeepAliveLog({ isActive, intervalMs = 4000, modelName = "AI Model" }: KeepAliveLogProps) {
    const [currentMsgIndex, setCurrentMsgIndex] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setCurrentMsgIndex(0);
            return;
        }

        const timer = setInterval(() => {
            setCurrentMsgIndex(prev => (prev + 1) % MESSAGES.length);
        }, intervalMs);

        return () => clearInterval(timer);
    }, [isActive, intervalMs]);

    if (!isActive) return null;

    return (
        <div className="relative pl-6 animate-pulse">
            <div className="absolute left-0 mt-0.5 w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">
                    <span className="font-semibold text-blue-400">{modelName}</span>: {MESSAGES[currentMsgIndex]}
                </span>
                <span className="text-[10px] text-white/30">
                    Processing... (Keep-alive)
                </span>
            </div>
        </div>
    );
}
