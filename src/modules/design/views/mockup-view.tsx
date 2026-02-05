import { MockupPreview } from '@/modules/design/components/mockup-preview';
import { SiteStructure, DesignConfig, StackConfig, TargetSlot, MockupVariant } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export interface MockupViewProps {
  structure: SiteStructure | null;
  designConfig: DesignConfig;
  stackConfig: StackConfig;
  pageSpecs: TargetSlot[] | null;
  isGenerating: boolean;
  error: string | null;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  onViewModeChange: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  onVariantChange: (id: string) => void;
  onRegenerateMockup: (withFeedback?: boolean) => Promise<void>;
  onConfirmSelection: (variant: MockupVariant) => void;
  onBack: () => void;
  onUpdateDesignConfig: (config: DesignConfig | ((prev: DesignConfig) => DesignConfig)) => void;
  addLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error', meta?: any) => void;
}

/**
 * Mockup view - preview and select from generated HTML mockup variants
 */
export function MockupView({
  structure,
  designConfig,
  stackConfig,
  pageSpecs,
  isGenerating,
  error,
  viewMode,
  onViewModeChange,
  onVariantChange,
  onRegenerateMockup,
  onConfirmSelection,
  onBack,
  onUpdateDesignConfig,
  addLog,
}: MockupViewProps) {
  const variants = designConfig.mockupVariants || [];
  const activeVariantId = designConfig.activeVariantId || variants[0]?.id;
  const activeVariant = variants.find((v) => v.id === activeVariantId);

  return (
    <div className="h-full flex flex-col animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Mockup Preview</h2>
          <p className="text-sm text-gray-400">
            Review generated variants and select your preferred design
          </p>
        </div>
        <Button
          onClick={onBack}
          variant="outline"
          className="border-white/10 hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Studio
        </Button>
      </div>

      {/* Mockup Preview */}
      <div className="flex-1 min-h-0">
        <MockupPreview
          variants={variants}
          activeVariantId={activeVariantId}
          html={activeVariant?.html || designConfig.mockupHtml}
          isLoading={isGenerating}
          error={error || undefined}
          viewMode={viewMode}
          onVariantChange={(id) => {
            const target = variants.find((v) => v.id === id);
            if (target) {
              onUpdateDesignConfig((prev) => ({
                ...prev,
                activeVariantId: id,
                mockupHtml: target.html,
              }));
              onVariantChange(id);
            }
          }}
          onSelectionConfirm={(variant) => {
            onUpdateDesignConfig((prev) => ({
              ...prev,
              mockupHtml: variant.html,
            }));
            onConfirmSelection(variant);
          }}
          onImageSwap={(oldSrc, newSrc) => {
            // Swap image in active mockup HTML
            const currentHtml = designConfig.mockupHtml || '';
            const updatedHtml = currentHtml.split(oldSrc).join(newSrc);

            // Also update active variant if exists
            const updatedVariants = (designConfig.mockupVariants || []).map((v) =>
              v.id === activeVariantId ? { ...v, html: v.html.split(oldSrc).join(newSrc) } : v
            );

            onUpdateDesignConfig((prev) => ({
              ...prev,
              mockupHtml: updatedHtml,
              mockupVariants: updatedVariants,
            }));
            addLog('DESIGN: Swapped image directly in mockup.', 'info');
          }}
          allImages={
            structure?.nodes?.flatMap((n) =>
              (n.content?.images || []).map((img: any) => ({
                ...img,
                sourceUrl: n.url,
                sourceTitle: n.meta?.title || n.url,
              }))
            ) || []
          }
        />
      </div>
    </div>
  );
}
