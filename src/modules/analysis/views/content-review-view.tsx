import { ContentReviewEditor } from '@/modules/analysis/components/visualization/content-review-editor';
import { TargetSlot } from '@/modules/analysis/components/visualization/dual-panel-mapper';
import { SiteStructure, Progress } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';

export interface ContentReviewViewProps {
  structure: SiteStructure | null;
  pageSpecs: TargetSlot[] | null;
  contentOptProgress: Progress | null;
  onUpdateSpecs: (specs: TargetSlot[]) => void;
  onApprove: () => void;
  onBack: () => void;
}

/**
 * Content review view - edit page specifications before design
 */
export function ContentReviewView({
  structure,
  pageSpecs,
  contentOptProgress,
  onUpdateSpecs,
  onApprove,
  onBack,
}: ContentReviewViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Content Strategy Review</h2>
          <p className="text-sm text-gray-400 mt-1">
            Review and refine the generated content structure for each page
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/10 hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blueprint
          </Button>
          <Button
            onClick={onApprove}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve & Continue
          </Button>
        </div>
      </div>

      {contentOptProgress && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-blue-300 font-medium">Generating page specifications...</span>
            <span className="text-blue-400 font-mono">
              {contentOptProgress.current}/{contentOptProgress.total}
            </span>
          </div>
          <div className="h-2 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{
                width: `${(contentOptProgress.current / contentOptProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <ContentReviewEditor
        targets={pageSpecs || []}
        structure={structure}
        onUpdate={onUpdateSpecs}
        onApprove={onApprove}
        onBack={onBack}
      />
    </div>
  );
}
