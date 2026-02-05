import { Button } from '@/components/ui/button';
import { PlanViewer } from '@/modules/engineering/components/plan-viewer';
import { DesignSystemExport } from '@/modules/design/components/design-system-export';
import { ComponentLibraryGenerator } from '@/modules/engineering/components/component-library-generator';
import { MultiLanguageGenerator } from '@/modules/engineering/components/multi-language-generator';
import { ContentOptimizerPanel } from '@/modules/engineering/components/content-optimizer-panel';
import { Download } from 'lucide-react';
import { FinalOutput, Progress, DesignConfig, SiteStructure } from '@/types';

export interface FinalPlanViewProps {
  finalOutput: FinalOutput | null;
  pageSpecsCount: number;
  contentOptProgress: Progress | null;
  isProcessing: boolean;
  designConfig: DesignConfig | null;
  mockupHtml: string | null;
  structure: SiteStructure | null;
  onZipDownload: () => Promise<void>;
}

/**
 * Final plan view - displays implementation plan and ZIP download
 */
export function FinalPlanView({
  finalOutput,
  pageSpecsCount,
  contentOptProgress,
  isProcessing,
  designConfig,
  mockupHtml,
  structure,
  onZipDownload,
}: FinalPlanViewProps) {
  if (!finalOutput) return null;

  // Get sample content for optimizer (from first page spec or mockup)
  const sampleContent = mockupHtml?.substring(0, 5000) || '';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <PlanViewer spec={finalOutput.spec} plan={finalOutput.implPlan as any} />

      {/* Export Tools Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Design System Export */}
        {designConfig && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <DesignSystemExport designConfig={designConfig} />
          </div>
        )}

        {/* Component Library Generator */}
        {mockupHtml && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <ComponentLibraryGenerator mockupHtml={mockupHtml} />
          </div>
        )}

        {/* Multi-Language Generator */}
        {structure && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <MultiLanguageGenerator structure={structure} />
          </div>
        )}

        {/* Content Optimizer */}
        {sampleContent && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <ContentOptimizerPanel
              content={sampleContent}
              context={{
                targetAudience: 'general',
                targetWordCount: 800,
              }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {contentOptProgress && (
          <div className="w-full max-w-md bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Optimizing content...</span>
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

        <Button
          onClick={onZipDownload}
          disabled={isProcessing || pageSpecsCount === 0}
          className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Project ZIP ({pageSpecsCount} pages)
        </Button>
      </div>
    </div>
  );
}
