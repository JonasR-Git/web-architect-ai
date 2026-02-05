import { BrainCircuit } from 'lucide-react';
import { ProcessLog } from '@/modules/engineering/components/process-log';
import { LogEntry, TokenStats } from '@/types';

export interface AIAnalysisViewProps {
  currentStep: string;
  logs: LogEntry[];
  tokenStats: TokenStats;
}

/**
 * View shown during AI analysis (parallel critique + migration + components)
 * Displays animated brain icon and live process logs
 */
export function AIAnalysisView({ currentStep, logs, tokenStats }: AIAnalysisViewProps) {
  return (
    <div className="max-w-3xl mx-auto text-center space-y-8 animate-in fade-in zoom-in-95">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
        <BrainCircuit className="w-24 h-24 text-blue-500 animate-pulse relative z-10" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-white">AI Architect Working...</h2>
        <p className="text-gray-400 mt-2">
          Analyzing your site structure and generating modern components. Check the logs below for
          details.
        </p>
        {currentStep && (
          <p className="text-blue-400 mt-2 text-sm font-medium">{currentStep}</p>
        )}
      </div>

      <div className="text-left bg-black/50 rounded-xl border border-white/10 p-6 h-[400px] overflow-hidden relative">
        <ProcessLog logs={logs} isCrawling={true} tokenStats={tokenStats} />
      </div>
    </div>
  );
}
