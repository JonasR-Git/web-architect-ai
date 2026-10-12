import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProcessLog } from '@/modules/engineering/components/process-log';
import { RefreshCw, ArrowRight, Search, History, FolderOpen } from 'lucide-react';
import { LogEntry, TokenStats, CrawlStats } from '@/types';

export interface SessionSummary {
  id: string;
  name: string;
  lastModified: number;
  preview: string;
}

export interface HomeViewProps {
  url: string;
  setUrl: (url: string) => void;
  isProcessing: boolean;
  crawlStats: CrawlStats | null;
  logs: LogEntry[];
  tokenStats: TokenStats;
  currentStep: string;
  sessions: SessionSummary[];
  isLoading: boolean;
  onStartCrawl: () => void;
  onLoadSession: (id: string) => void;
}

/**
 * Home view - URL input, session management, crawl stats
 */
export function HomeView({
  url,
  setUrl,
  isProcessing,
  crawlStats,
  logs,
  tokenStats,
  currentStep,
  sessions,
  isLoading,
  onStartCrawl,
  onLoadSession,
}: HomeViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      <div className="lg:col-span-5 flex flex-col justify-center items-center">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold text-white">
              Web Architect AI
            </h1>
            <p className="text-zinc-400 text-sm">A local workbench for website migration.</p>
            <p className="text-zinc-400 text-sm leading-relaxed">Explore the source, review the blueprint and turn approved decisions into page specifications and design drafts.</p>
            <Link href="/demo" className="inline-block text-sm text-blue-300 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-300">Take the two-minute project tour</Link>
          </div>

          {/* Input Card */}
          <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl space-y-4">
            <div className="space-y-2">
              <label htmlFor="website-url" className="text-xs font-semibold text-zinc-400 ml-1">
                Target Website URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="website-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm placeholder:text-zinc-700"
                  onKeyDown={(e) => e.key === 'Enter' && !isProcessing && url && onStartCrawl()}
                />
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
              </div>
            </div>

            <Button
              onClick={onStartCrawl}
              disabled={!url || isProcessing}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Initializing Agent...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Start Architecture Analysis <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>

          {/* Recent Sessions List */}
          {sessions.length > 0 && !isProcessing && (
            <div className="space-y-3 animate-in fade-in delay-200">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 px-2">
                <History className="w-3 h-3" />
                RECENT PROJECTS
              </div>
              <div className="grid gap-2">
                {sessions.slice(0, 3).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => onLoadSession(session.id)}
                    disabled={isLoading}
                    className="group relative flex items-center justify-between p-3 w-full bg-zinc-900/30 border border-white/5 hover:border-blue-500/30 hover:bg-zinc-900/60 rounded-xl transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:text-blue-300">
                        <FolderOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
                          {session.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>{new Date(session.lastModified).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{session.preview}</span>
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-blue-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-7">
        {/* Stats & Logs */}
        <div className="flex flex-col gap-5">
          {isProcessing && crawlStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                <div className="text-2xl font-bold text-blue-400 font-mono">
                  {crawlStats.processed}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  Processed
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                <div className="text-2xl font-bold text-purple-400 font-mono">
                  {crawlStats.found}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  Discovered
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  {crawlStats.queueLength}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  Queue
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md col-span-1 md:col-span-1">
                <div className="text-2xl font-bold text-orange-400 font-mono">
                  {crawlStats.activeWorkers || 1}
                  <span className="text-sm opacity-50 ml-1">threads</span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                  Active
                </div>
              </div>
              <div className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
                <span className="text-xs font-mono text-gray-400 truncate flex-1">
                  {crawlStats.currentUrl}
                </span>
              </div>
            </div>
          )}
          <ProcessLog
            logs={logs}
            isCrawling={isProcessing}
            currentStep={currentStep}
            tokenStats={tokenStats}
          />
        </div>
      </div>
    </div>
  );
}
