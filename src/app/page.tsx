'use client';

// All React hooks moved to dedicated state management hooks
import { AppHeader } from '@/modules/core/components/app-header';
import { SiteStructure, SiteNode, LinkAnalysis, DesignConfig, MigrationPlan, ComponentSpecification, PageMapping } from '@/types';
import { DesignStudio } from '@/modules/design/components/design-studio';
import { MockupPreview } from '@/modules/design/components/mockup-preview';
import { AIClassificationModal } from '@/modules/analysis/components/ai-classification-modal';
import { selectImagesForMockup } from '@/lib/utils/image-selection';
import { mergeSpecsIntoMigrationPlan } from '@/modules/analysis/services/content-approval';
// ImageForClassification and ClassificationResult types are inferred from hook
import { Toaster, toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { generatePageSpecsAction } from '@/app/actions';
import type { SourcePage, TargetSlot } from '@/types';
import { usePersistence } from '@/hooks/use-persistence';
// SemanticMergeMap type is inferred from useAnalysisState hook
import { ContentReviewEditor } from '@/modules/analysis/components/visualization/content-review-editor';

// Views
import { AIAnalysisView } from '@/modules/analysis/views/ai-analysis-view';
import { HomeView } from '@/modules/core/views/home-view';
import { BlueprintView } from '@/modules/analysis/views/blueprint-view';
import { ContentReviewView } from '@/modules/analysis/views/content-review-view';
import { DesignStudioView } from '@/modules/design/views/design-studio-view';
import { MockupView } from '@/modules/design/views/mockup-view';
import { FinalPlanView } from '@/modules/engineering/views/final-plan-view';
import { CrawlResultView } from '@/modules/analysis/views/crawl-result-view';

// Workflows
import { useCrawlWorkflow } from '@/modules/analysis/workflows/use-crawl-workflow';
import { useAIAnalysisWorkflow } from '@/modules/analysis/workflows/use-ai-analysis-workflow';
import { useMockupWorkflow } from '@/modules/design/workflows/use-mockup-workflow';
import { usePlanWorkflow } from '@/modules/engineering/workflows/use-plan-workflow';
import { useZipExport } from '@/modules/engineering/workflows/use-zip-export';

// State Hooks
import { useLogging } from '@/modules/core/hooks/use-logging';
import { useUIState, ViewMode } from '@/modules/core/hooks/use-ui-state';
import { useProjectConfig } from '@/modules/core/hooks/use-project-config';
import { useAnalysisState } from '@/modules/analysis/hooks/use-analysis-state';
import { useMigrationState } from '@/modules/analysis/hooks/use-migration-state';
import { useDesignState } from '@/modules/design/hooks/use-design-state';
import { useMockupState } from '@/modules/design/hooks/use-mockup-state';
import { useOutputState } from '@/modules/engineering/hooks/use-output-state';
import { useNormalizedStructure } from '@/modules/core/hooks/use-normalized-structure';
import { useMappingData } from '@/modules/analysis/hooks/use-mapping-data';
import { useSpecGeneration } from '@/modules/engineering/hooks/use-spec-generation';
import { useClassificationModal } from '@/modules/design/hooks/use-classification-modal';
import { useTargetReconstruction } from '@/modules/engineering/hooks/use-target-reconstruction';
import { useSessionLoader } from '@/modules/core/hooks/use-session-loader';

export default function Home() {
  const {
    sessions,
    currentSessionId,
    lastSaved,
    isSaving,
    saveSession,
    loadSession,
    deleteSession,
    refreshSessions,
    isLoading,
    saveState,
    saveStructure,
    saveMigration,
    saveSpecs,
    saveDesign
  } = usePersistence();

  const {
    view,
    setView,
    blueprintTab,
    setBlueprintTab,
    isProcessing,
    setIsProcessing,
    currentStep,
    setCurrentStep,
    pagesCompleted,
    setPagesCompleted,
    totalPages,
    setTotalPages,
  } = useUIState(currentSessionId);
  const { url, setUrl, userInstructions, setUserInstructions } = useProjectConfig();

  const {
    structure,
    setStructure,
    semanticMerges,
    setSemanticMerges,
    excludedUrls,
    setExcludedUrls,
    clusterOverrides,
    setClusterOverrides,
    critique,
    setCritique,
  } = useAnalysisState(currentSessionId);

  const {
    migrationPlan,
    setMigrationPlan,
    pageSpecs,
    setPageSpecs,
    componentSpec,
    setComponentSpec,
  } = useMigrationState(currentSessionId);

  const {
    designConfig,
    setDesignConfig,
    stackConfig,
    setStackConfig,
    downloadedAssets,
    setDownloadedAssets,
    customAssets,
    setCustomAssets,
  } = useDesignState(currentSessionId);

  const {
    isGenerating: isGeneratingMockup,
    setIsGenerating: setIsGeneratingMockup,
    error: mockupError,
    setError: setMockupError,
    viewMode: mockupViewMode,
    setViewMode: setMockupViewMode,
  } = useMockupState();

  const { logs, tokenStats, addLog, clearLogs } = useLogging({
    isGeneratingMockup,
    isProcessing,
    view,
  });

  const {
    finalOutput,
    setFinalOutput,
    optimizedContent,
    setOptimizedContent,
    contentOptProgress,
    setContentOptProgress,
  } = useOutputState(currentSessionId);

  const normalizedStructure = useNormalizedStructure(structure, semanticMerges, excludedUrls);

  const {
    modalState: aiClassificationModal,
    isClassifying,
    setIsClassifying,
    openModal: openClassificationModal,
    handleApprove: handleClassificationApprove,
    handleSkip: handleClassificationSkip,
  } = useClassificationModal();

  const { handleGenerateSpecs } = useSpecGeneration({
    structure,
    migrationPlan,
    semanticMerges,
    currentSessionId,
    pageSpecs,
    setPageSpecs,
    setView,
    setIsProcessing,
    setCurrentStep,
    setPagesCompleted,
    setTotalPages,
    addLog,
  });

  const { mappingSources, mappingTargets } = useMappingData(
    normalizedStructure,
    migrationPlan,
    clusterOverrides
  );

  const reconstructedTargets = useTargetReconstruction(migrationPlan);

  const { loadSessionData } = useSessionLoader(currentSessionId);

  // --- AUTO-SAVE ---
  // Auto-save is now handled by individual State Hooks (useUIState, useAnalysisState, etc.)
  // Each hook includes built-in debouncing (5-8s) and granular saves
  // No need for manual useEffect blocks here anymore!

  // Handle Load Session
  const handleLoadSession = async (id: string) => {
    const data = await loadSession(id);
    if (!data) return;
    await loadSessionData(data);
  };

  // addLog is now provided by useLogging() hook

  // Workflow Hooks (Phase 1 Integration)
  const { crawlStats, startCrawl } = useCrawlWorkflow({
    url,
    setStructure,
    setSemanticMerges,
    setDesignConfig,
    setView,
    setIsProcessing,
    setCurrentStep,
    addLog,
    clearLogs,
  });

  const { runAnalysis: runAIAnalysis } = useAIAnalysisWorkflow({
    structure,
    excludedUrls,
    userInstructions,
    clusterOverrides,
    semanticMerges,
    stackConfig,
    setCritique,
    setMigrationPlan,
    setComponentSpec,
    setView,
    setIsProcessing,
    setCurrentStep,
    addLog,
  });

  const { generateMockup: handleMockupGeneration } = useMockupWorkflow({
    structure,
    designConfig,
    componentSpec,
    pageSpecs,
    setDesignConfig,
    setView,
    setIsGenerating: setIsGeneratingMockup,
    setError: setMockupError,
    addLog,
  });

  const { generatePlan: handleConfigSubmit } = usePlanWorkflow({
    structure,
    migrationPlan,
    componentSpec,
    critique,
    userInstructions,
    semanticMerges,
    setComponentSpec,
    setDesignConfig,
    setDownloadedAssets,
    setFinalOutput,
    setView,
    setIsProcessing,
    setCurrentStep,
    addLog,
  });

  const { handleZipDownload } = useZipExport({
    finalOutput,
    pageSpecs,
    downloadedAssets,
    designConfig,
    migrationPlan,
    addLog,
  });

  // --- Step 5: Config & Plan ---
  // (Replaced with usePlanWorkflow hook above)

  // --- Progress Messages ---
  // (Now handled by useLogging hook with progressConfig)

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">
      <Toaster position="top-right" theme="dark" />

      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <AppHeader
        currentView={view}
        structure={structure}
        migrationPlan={migrationPlan}
        pageSpecs={pageSpecs}
        designConfig={designConfig}
        finalOutput={finalOutput}
        onNavigate={setView}
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-8 flex-1 w-full">

        {/* VIEW: HOME + CRAWLING (Combined per user request: "HOME / CRAWLING") */}
        {(view === 'home') && (
          <HomeView
            url={url}
            setUrl={setUrl}
            isProcessing={isProcessing}
            crawlStats={crawlStats}
            logs={logs}
            tokenStats={tokenStats}
            currentStep={currentStep}
            sessions={sessions}
            onStartCrawl={startCrawl}
            onLoadSession={handleLoadSession}
            isLoading={isLoading}
          />
        )}

        {/* VIEW: CRAWL RESULT */}
        {view === 'crawl_result' && structure && (
          <CrawlResultView
            structure={structure}
            semanticMerges={semanticMerges}
            excludedUrls={excludedUrls}
            clusterOverrides={clusterOverrides}
            userInstructions={userInstructions}
            isProcessing={isProcessing}
            onToggleExclusion={(url, excluded) => {
              setExcludedUrls(prev => {
                const next = new Set(prev);
                if (excluded) next.add(url);
                else next.delete(url);
                return next;
              });
            }}
            onUpdateOverrides={setClusterOverrides}
            onUpdateInstructions={setUserInstructions}
            onStartAnalysis={runAIAnalysis}
          />
        )}

        {/* VIEW: AI ANALYSIS (Processing State) */}
        {view === 'ai_analysis' && (
          <AIAnalysisView
            currentStep={currentStep}
            logs={logs}
            tokenStats={tokenStats}
          />
        )}

        {/* VIEW: AI RESULT (Blueprint) */}
        {view === 'ai_result' && migrationPlan && (
          <BlueprintView
            structure={structure}
            migrationPlan={migrationPlan}
            componentSpec={componentSpec}
            critique={critique}
            mappingSources={mappingSources}
            mappingTargets={mappingTargets}
            blueprintTab={blueprintTab}
            pageSpecs={pageSpecs}
            reconstructedTargets={reconstructedTargets}
            isProcessing={isProcessing}
            onTabChange={setBlueprintTab}
            onGenerateSpecs={handleGenerateSpecs}
            onNavigateToContentReview={() => setView('content_review')}
            onSaveMappingChanges={(newPageMapping, newPatternMapping) => {
              setMigrationPlan((prev: MigrationPlan | null) => prev ? ({
                ...prev,
                page_mapping: newPageMapping,
                pattern_mapping: newPatternMapping
              }) : null);
            }}
          />
        )}




        {/* VIEW: CONTENT REVIEW */}
        {view === 'content_review' && pageSpecs && (
          <ContentReviewEditor
            targets={pageSpecs}
            clusters={migrationPlan?.clusters}
            structure={structure}
            onBack={() => setView('ai_result')}
            onUpdate={(updated) => setPageSpecs(updated)}
            onUpdateClusters={(updatedClusters) => {
              setMigrationPlan((prev: MigrationPlan | null) => prev ? { ...prev, clusters: updatedClusters } : null);
            }}
            isGenerating={isProcessing && pagesCompleted < totalPages}
            currentProgress={pagesCompleted}
            totalProgress={totalPages}
            currentStep={currentStep}
            onApprove={() => {
              if (!migrationPlan || !pageSpecs) return;

              const updated = mergeSpecsIntoMigrationPlan(migrationPlan, pageSpecs);
              setMigrationPlan(updated);
              toast.success("Content Strategy Approved!");
              setView('design_studio');
            }}
            sessionId={currentSessionId || undefined}
            allImages={structure?.nodes?.flatMap(n => (n.content?.images || []).map(img => ({
              ...img,
              sourceUrl: n.url,
              sourceTitle: n.meta?.title || n.url
            }))) || []}
            customAssets={customAssets}
            onUpload={(newAsset) => setCustomAssets(prev => [newAsset, ...prev])}
          />
        )}

        {/* VIEW: DESIGN STUDIO */}
        {view === 'design_studio' && (
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
              extractedColors={structure?.nodes[0]?.content?.extractedColors}
              siteData={structure?.nodes[0] ? {
                siteName: structure.nodes[0].meta?.title?.split('|')[0]?.trim() ||
                  structure.nodes[0].meta?.title?.split('-')[0]?.trim(),
                h1: structure.nodes[0].content?.h1,
                headings: structure.nodes[0].content?.headings,
                navigation: structure.nodes[0].content?.links
                  ?.filter((l: LinkAnalysis) => l.type === 'internal' || l.text)
                  ?.filter((l: LinkAnalysis) => l.text && l.text.length < 30)
                  ?.slice(0, 10)
                  ?.map((l: LinkAnalysis) => ({ text: l.text, href: l.href })),
                // Context-Aware Image Selection based on componentSpec
                images: (() => {
                  const allImages: Array<{
                    src: string;
                    alt: string;
                    context?: string;
                    isLogo?: boolean;
                    logoProb?: number;
                    role?: string;
                    roleConfidence?: number;
                    componentHint?: string;
                    groupId?: string;
                    sourcePage?: string;
                  }> = [];
                  const seenSrcs = new Set<string>();
                  structure?.nodes?.forEach((node: SiteNode) => {
                    node.content?.images?.forEach(img => {
                      if (img.src && !seenSrcs.has(img.src)) {
                        seenSrcs.add(img.src);
                        allImages.push({
                          src: img.src, alt: img.alt, context: img.context,
                          isLogo: img.isLogo, logoProb: img.logoProb, role: img.role,
                          roleConfidence: img.roleConfidence,
                          componentHint: img.componentHint ?? undefined,
                          groupId: img.groupId ?? undefined,
                          sourcePage: node.url ? new URL(node.url).pathname : undefined
                        });
                      }
                    });
                  });

                  // Context-Awareness
                  const homePath = structure.nodes[0] ? new URL(structure.nodes[0].url).pathname : '/';
                  const homeSpec = pageSpecs?.find((p: TargetSlot) => p.path === homePath || p.path === '/' || p.path === '/home');
                  const prioritizedPaths = homeSpec?.dependencies || [];

                  const { selectedImages } = selectImagesForMockup(allImages, componentSpec as any, prioritizedPaths);
                  return selectedImages;
                })(),
                // plannedContent removed to fix type error
                rawText: structure.nodes[0].content?.rawText?.substring(0, 50000),
                forms: structure.nodes[0].content?.forms,
                meta: {
                  title: structure.nodes[0].meta?.title,
                  description: structure.nodes[0].meta?.description,
                  designSignals: structure.nodes[0].meta?.designSignals,
                  // Convert imageComponentSummary objects to strings for AI
                  imageComponentSummary: structure.nodes[0].meta?.imageComponentSummary?.map(s =>
                    `${s.groupId}: ${s.imageCount} images, role: ${s.role}`
                  )
                },
                assignedLogos: pageSpecs?.find(s => s.type === 'layout')?.logos || [],
                extractedColors: (() => {
                  const colors = structure.nodes[0].content?.extractedColors;
                  if (!colors) return undefined;

                  const colorList: { color: string; usage?: string }[] = [];

                  // Handle new semantic format
                  if (typeof colors.primary === 'string' || typeof colors.background === 'string') {
                    if (colors.primary) colorList.push({ color: colors.primary, usage: 'primary' });
                    if (colors.accent) colorList.push({ color: colors.accent, usage: 'accent' });
                    if (colors.secondary) colorList.push({ color: colors.secondary, usage: 'secondary' });
                    if (typeof colors.background === 'string') colorList.push({ color: colors.background, usage: 'background' });
                    if (typeof colors.text === 'string') colorList.push({ color: colors.text, usage: 'text' });
                  }

                  // Handle legacy/fallback arrays if nothing was added
                  if (colorList.length === 0) {
                    if (colors.dominant && Array.isArray(colors.dominant)) {
                      colors.dominant.forEach((c: string) => colorList.push({ color: c, usage: 'primary/accent' }));
                    }
                    if (colors.background && Array.isArray(colors.background)) {
                      colors.background.forEach((c: string) => colorList.push({ color: c, usage: 'background' }));
                    }
                    if (colors.text && Array.isArray(colors.text)) {
                      colors.text.forEach((c: string) => colorList.push({ color: c, usage: 'text' }));
                    }
                  }

                  return colorList.length > 0 ? colorList : undefined;
                })(),
                // Image-based color palette (brand, hero, overall)
                designSystemColors: structure.nodes[0]?.content?.designSystemColors,
                // Blueprint analysis data for smart optimization
                plannedContent: (() => {
                  const homePath = structure.nodes[0] ? new URL(structure.nodes[0].url).pathname : '/';
                  const match = pageSpecs?.find((p: TargetSlot) => p.path === homePath || p.path === '/' || p.path === '/home');
                  if (!match) return undefined;
                  return {
                    description: match.description,
                    content_goals: match.content_goals,
                    sections: match.sections?.map(s => ({
                      type: s.type,
                      headline: s.headline,
                      content: s.content
                    }))
                  };
                })(),
                componentSpec: componentSpec || undefined,
                migrationPlan: migrationPlan ? {
                  rationale: migrationPlan.rationale,
                  sitemap: migrationPlan.sitemap
                } : undefined
              } : undefined}
              onNext={() => setView('mockup_view')} // Go to Preview instead of Config
              onBack={() => setView('ai_result')}
              onGenerate={handleMockupGeneration}
              isGenerating={isGeneratingMockup}
            />
          </div>
        )}

        {/* VIEW: MOCKUP PREVIEW (Full Screen) */}
        {/* VIEW: MOCKUP PREVIEW (Full Screen) */}
        {view === 'mockup_view' && (
          <div className="max-w-[1440px] mx-auto animate-in fade-in zoom-in-95 h-[calc(100vh-140px)] flex flex-col relative">
            {/* Header Area */}
            <div className="flex-shrink-0 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    Mockup Preview
                    {(() => {
                      const active = (designConfig.mockupVariants || []).find(v => v.id === designConfig.activeVariantId)
                        || (designConfig.mockupHistory || []).find(v => v.id === designConfig.activeVariantId);
                      const iter = active?.iteration || designConfig.mockupIteration || 1;
                      if (iter > 1 || active) {
                        return (
                          <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Iteration {iter}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </h2>
                  <p className="text-gray-400 text-sm">Review the AI-generated design. Give feedback to improve or finalize the planning.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* View Toggles */}
                <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
                  {(['desktop', 'tablet', 'mobile'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMockupViewMode(m)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded transition-all capitalize",
                        mockupViewMode === m ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setView('design_studio')}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20"
                >
                  Back to Studio
                </Button>

                <Button
                  onClick={() => {
                    const activeVariantId = designConfig.activeVariantId;
                    const variants = designConfig.mockupVariants || [];
                    const history = designConfig.mockupHistory || [];

                    const activeVariant = variants.find(v => v.id === activeVariantId)
                      || history.find(v => v.id === activeVariantId)
                      || (variants.length > 0 ? variants[0] : null);

                    if (activeVariant) {
                      const newDesignConfig: DesignConfig = {
                        ...designConfig,
                        mockupHtml: activeVariant.html,
                        activeVariantId: activeVariant.id,
                        mockupIteration: activeVariant.iteration // Sync iteration to historical one if selected
                      };
                      handleConfigSubmit(stackConfig, newDesignConfig, pageSpecs || []);
                    } else {
                      handleConfigSubmit(stackConfig);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg"
                >
                  Mit Mockup Plan generieren <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden rounded-xl border border-white/10 bg-[#050505] shadow-2xl">
              {/* Mockup Preview - Scrollable Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="absolute inset-x-0 min-h-full">
                  <MockupPreview
                    variants={designConfig.mockupVariants}
                    activeVariantId={designConfig.activeVariantId}
                    mockupHistory={designConfig.mockupHistory}
                    onVariantChange={(id) => {
                      setDesignConfig(prev => {
                        const target = (prev.mockupVariants || []).find(v => v.id === id)
                          || (prev.mockupHistory || []).find(v => v.id === id);
                        return {
                          ...prev,
                          activeVariantId: id,
                          mockupHtml: target?.html || prev.mockupHtml // Sync HTML immediately on click
                        };
                      });
                    }}
                    html={designConfig.mockupHtml}
                    isLoading={isGeneratingMockup}
                    error={mockupError || undefined}
                    viewMode={mockupViewMode}
                    colors={designConfig.colors}
                    onColorChange={(key, val) => setDesignConfig(prev => ({
                      ...prev,
                      colors: { ...prev.colors, [key]: val }
                    }))}
                    onSelectionConfirm={(variant) => {
                      // Lock in the choice and proceed to master plan
                      const newDesignConfig: DesignConfig = {
                        ...designConfig,
                        mockupHtml: variant.html, // Current selected becomes the "main" one
                        mockupHistory: [...(designConfig.mockupHistory || [])],
                        mockupVariants: [],
                        activeVariantId: undefined
                      };

                      if (designConfig.mockupVariants) {
                        newDesignConfig.mockupHistory?.push(...designConfig.mockupVariants);
                      }

                      setDesignConfig(newDesignConfig);

                      addLog(`DESIGN: Mockup selected. Transitioning to final implementation phase.`, 'success');
                      handleConfigSubmit(stackConfig, newDesignConfig, pageSpecs || []); // Proceed to plan generation with correct design
                    }}
                    allImages={structure?.nodes?.flatMap(n => n.content.images || []) || []}
                    onImageSwap={(oldSrc, newSrc) => {
                      setDesignConfig(prev => {
                        const currentHtml = prev.mockupHtml || '';
                        const updatedHtml = currentHtml.split(oldSrc).join(newSrc);

                        // Also update active variant if exists
                        const updatedVariants = (prev.mockupVariants || []).map(v =>
                          v.id === prev.activeVariantId ? { ...v, html: v.html.split(oldSrc).join(newSrc) } : v
                        );

                        return {
                          ...prev,
                          mockupHtml: updatedHtml,
                          mockupVariants: updatedVariants
                        };
                      });
                      addLog(`DESIGN: Swapped image directly in mockup.`, 'info');
                    }}
                  />
                </div>
              </div>

              {/* Feedback Footer - Sticky/Fixed at Bottom of container */}

            </div>
          </div>
        )}

        {view === 'final_plan' && finalOutput && (
          <FinalPlanView
            finalOutput={finalOutput}
            contentOptProgress={contentOptProgress}
            pageSpecsCount={pageSpecs?.length || 0}
            isProcessing={isProcessing}
            designConfig={designConfig}
            mockupHtml={designConfig?.mockupHtml || null}
            structure={structure}
            onZipDownload={handleZipDownload}
          />
        )}

      </div>

      {/* AI Classification Approval Modal */}
      <AIClassificationModal
        isOpen={aiClassificationModal.isOpen}
        onClose={handleClassificationSkip}
        onApprove={async () => {
          setIsClassifying(true);
          try {
            const { classifyImagesAction } = await import('./actions');
            const result = await classifyImagesAction(
              aiClassificationModal.images.map(img => ({
                src: img.src,
                alt: img.alt,
                context: img.context
              })),
              { forceClassify: true }
            );

            if (result.success && result.data && 'classifications' in result.data) {
              addLog(`AI classified ${result.data.classifications.length} images`, 'success');
              toast.success(`Classified ${result.data.classifications.length} images with AI`);
              handleClassificationApprove(result.data.classifications);
            }
          } catch (error: any) {
            addLog(`AI classification failed: ${error.message}`, 'error');
            toast.error('AI classification failed');
          } finally {
            setIsClassifying(false);
          }
        }}
        onSkip={() => {
          addLog('Skipped AI image classification', 'info');
          toast.info('Proceeding without AI classification');
          handleClassificationSkip();
        }}
        imageCount={aiClassificationModal.imageCount}
        tokenEstimate={aiClassificationModal.tokenEstimate}
        estimatedCost={aiClassificationModal.estimatedCost}
        isClassifying={isClassifying}
      />
    </main >
  );
}
