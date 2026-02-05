import { Button } from '@/components/ui/button';
import { SiteTree } from '@/modules/analysis/components/visualization/site-tree';
import { UserInstructionsInput } from '@/modules/analysis/components/user-instructions-input';
import { SiteStructure, ClusterOverrides } from '@/types';
import { SemanticMergeMap } from '@/modules/core/utils/normalization';
import { Sparkles } from 'lucide-react';

export interface CrawlResultViewProps {
  structure: SiteStructure;
  semanticMerges: SemanticMergeMap | undefined;
  excludedUrls: Set<string>;
  clusterOverrides: ClusterOverrides;
  userInstructions: string;
  isProcessing: boolean;
  onToggleExclusion: (url: string, excluded: boolean) => void;
  onUpdateOverrides: (overrides: ClusterOverrides) => void;
  onUpdateInstructions: (instructions: string) => void;
  onStartAnalysis: () => void;
}

/**
 * Crawl result view - review site structure, set instructions, start AI analysis
 */
export function CrawlResultView({
  structure,
  semanticMerges,
  excludedUrls,
  clusterOverrides,
  userInstructions,
  isProcessing,
  onToggleExclusion,
  onUpdateOverrides,
  onUpdateInstructions,
  onStartAnalysis,
}: CrawlResultViewProps) {
  const imageCount = structure.nodes.reduce(
    (sum, node) => sum + (node.content?.images?.length || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4">
      <div className="lg:col-span-5 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Site Structure</h2>
          <p className="text-sm text-gray-400">
            Review the discovered architecture. Exclude irrelevant pages or customize clustering.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Pages Discovered</span>
            <span className="text-2xl font-bold text-blue-400 font-mono">
              {structure.nodes.length}
            </span>
          </div>

          {/* Image Stats - show unique vs total */}
          {structure.imageStats ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Unique Images</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  {structure.imageStats.unique}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Total References</span>
                <span className="text-lg font-bold text-purple-400/70 font-mono">
                  {structure.imageStats.total}
                </span>
              </div>
              {structure.imageStats.deduplicationRate > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Dedup Rate</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">
                    {structure.imageStats.deduplicationRate.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total Images</span>
              <span className="text-xl font-bold text-purple-400 font-mono">{imageCount}</span>
            </div>
          )}
        </div>

        <UserInstructionsInput
          value={userInstructions}
          onChange={onUpdateInstructions}
        />

        <Button
          onClick={onStartAnalysis}
          disabled={isProcessing}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start AI Analysis
        </Button>
      </div>

      <div className="lg:col-span-7">
        <SiteTree
          structure={structure}
          semanticMerges={semanticMerges}
          excludedUrls={excludedUrls}
          clusterOverrides={clusterOverrides}
          onToggleExclusion={onToggleExclusion}
          onUpdateOverrides={onUpdateOverrides}
        />
      </div>
    </div>
  );
}
