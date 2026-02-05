import { DesignStudio } from '@/modules/design/components/design-studio';
import { DesignConfig, MockupSiteData } from '@/types';

export interface DesignStudioViewProps {
  designConfig: DesignConfig;
  setDesignConfig: (fn: (prev: DesignConfig) => DesignConfig) => void;
  extractedColors?: any;
  siteData?: MockupSiteData;
  onGenerateMockup?: () => void;
  isGenerating?: boolean;
}

/**
 * Design studio view - configure design parameters and generate mockups
 */
export function DesignStudioView({
  designConfig,
  setDesignConfig,
  extractedColors,
  siteData,
  onGenerateMockup,
  isGenerating,
}: DesignStudioViewProps) {
  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="pl-4 border-l-4 border-purple-500">
          <h2 className="text-3xl font-bold text-white mb-2">Design Studio</h2>
          <p className="text-gray-400">Define visual identity and generate an AI mockup preview.</p>
        </div>
      </div>
      <DesignStudio
        config={designConfig}
        setConfig={setDesignConfig}
        extractedColors={extractedColors}
        siteData={siteData}
        onGenerate={onGenerateMockup}
        isGenerating={isGenerating}
      />
    </div>
  );
}
