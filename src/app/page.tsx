'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ProcessLog } from '@/modules/engineering/components/process-log';
import { SiteTree } from '@/modules/analysis/components/visualization/site-tree';
import { ConfigForm } from '@/modules/design/components/config-form';
import { PlanViewer } from '@/modules/engineering/components/plan-viewer';
import { SiteStructure, StackConfig, DesignConfig, MockupVariant, MigrationPlan, ComponentSpecification, ClusterOverrides } from '@/types';
import { DesignStudio } from '@/modules/design/components/design-studio';
import { MockupPreview } from '@/modules/design/components/mockup-preview';
import { AIClassificationModal } from '@/modules/analysis/components/ai-classification-modal';

import { generateCritiqueAction, generateMigrationAction, generateComponentLibraryAction, generateImplementationPlanAction, optimizePageContentAction, downloadImagesAction, generateVisualMockupAction, detectDependenciesAction, regeneratePageSpecsAction } from './actions';
import { normalizeUrlToConcept } from '@/modules/core/utils/normalization';
import { ImageValidator } from '@/modules/analysis/services/image-validator';
import { Toaster, toast } from 'sonner';
import { Terminal, ArrowRight, Play, RefreshCw, Layers, Zap, Hexagon, Code2, Search, BrainCircuit, LayoutTemplate, Download, Palette, Eye, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MigrationEditor } from '@/modules/analysis/components/visualization/migration-editor';
import { DualPanelMapper } from '@/modules/analysis/components/visualization/dual-panel-mapper';
import { BlueprintTabs, BlueprintTab } from '@/modules/analysis/components/visualization/BlueprintTabs';
import { ComponentSpecViewer } from '@/modules/analysis/components/visualization/component-spec-viewer';
import { UserInstructionsInput } from '@/modules/analysis/components/user-instructions-input';
import { BFSGAuditViewer } from '@/modules/analysis/components/visualization/bfsg-audit-viewer';
import { generateProjectZip, downloadBlob, pageDataToMarkdown, OptimizedPageData, ContentFile } from '@/lib/zip';
import { generatePageSpecsAction } from '@/app/actions';
import { TargetSlot } from '@/modules/analysis/components/visualization/dual-panel-mapper';
import type { SourcePage } from '@/types';
import { DESIGN_PRESETS, DesignStyle } from '@/modules/design/data/design-presets';
import { usePersistence } from '@/hooks/use-persistence';
import { Save, FolderOpen, History, Clock } from 'lucide-react';
import { groupSimilarPages } from '@/modules/core/utils/grouping';
import { SemanticMergeMap } from '@/modules/core/utils/normalization';



type CrawlStats = {
  processed: number;
  found: number;
  currentUrl: string;
  queueLength: number;
  activeWorkers?: number;
};

// Granular Steps as requested
import { ContentReviewEditor } from '@/modules/analysis/components/visualization/content-review-editor';

type ViewMode = 'home' | 'crawl_result' | 'ai_analysis' | 'ai_result' | 'content_review' | 'design_studio' | 'mockup_view' | 'final_plan';

export default function Home() {
  const [pageSpecs, setPageSpecs] = useState<TargetSlot[] | null>(null);
  const [url, setUrl] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [view, setView] = useState<ViewMode>('home');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pagesCompleted, setPagesCompleted] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [tokenStats, setTokenStats] = useState<{ totalIn: number, totalOut: number }>({ totalIn: 0, totalOut: 0 });

  // Data State
  const [structure, setStructure] = useState<SiteStructure | null>(null);
  const [semanticMerges, setSemanticMerges] = useState<SemanticMergeMap | undefined>(undefined);
  const [excludedUrls, setExcludedUrls] = useState<Set<string>>(new Set());
  const [clusterOverrides, setClusterOverrides] = useState<ClusterOverrides>({
    forceArchetypes: [],
    ignorePatterns: []
  });
  const [critique, setCritique] = useState<any>(null);
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(null);
  const [componentSpec, setComponentSpec] = useState<ComponentSpecification | null>(null);
  const [finalOutput, setFinalOutput] = useState<{ spec: any, implPlan: any } | null>(null);
  const [crawlStats, setCrawlStats] = useState<CrawlStats | null>(null);
  const [customAssets, setCustomAssets] = useState<any[]>([]);
  const [blueprintTab, setBlueprintTab] = useState<BlueprintTab>('overview');
  const [optimizedContent, setOptimizedContent] = useState<Map<string, OptimizedPageData>>(new Map());
  const [contentOptProgress, setContentOptProgress] = useState<{ current: number, total: number } | null>(null);
  const [userInstructions, setUserInstructions] = useState<string>('');
  const [stackConfig, setStackConfig] = useState<StackConfig>({
    framework: 'nextjs',
    css: 'tailwind',
    uiLibrary: 'shadcn',
    cms: 'none',
    database: 'none',
    auth: 'none',
    deployment: 'vercel',
  });

  const [downloadedAssets, setDownloadedAssets] = useState<{ images: Record<string, string>, map: Record<string, string> } | null>(null);
  const [designConfig, setDesignConfig] = useState<DesignConfig>({
    styleIds: [DESIGN_PRESETS[0].id],
    colors: { primary: '#3b82f6', secondary: '#64748b', background: '#ffffff', text: '#0f172a', accent: '#f59e0b' },
    theme: 'system',
    roundness: 'default',
    typography: 'modern',
    creativity: 'balanced',
    creativeFocus: [],
    unleashedMode: 'off',
    customInstructions: '',
    aiGeneratedInstructions: ''
  });

  const [mockupViewMode, setMockupViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [mockupError, setMockupError] = useState<string | null>(null);

  // AI Classification Modal State
  const [aiClassificationModal, setAIClassificationModal] = useState<{
    isOpen: boolean;
    imageCount: number;
    tokenEstimate: number;
    estimatedCost: number;
    images: any[];
    onComplete?: (classifications: any[]) => void;
  }>({
    isOpen: false,
    imageCount: 0,
    tokenEstimate: 0,
    estimatedCost: 0,
    images: []
  });
  const [isClassifying, setIsClassifying] = useState(false);

  // Persistence Hook
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
    // Granular saves
    saveState,
    saveStructure,
    saveMigration,
    saveSpecs,
    saveDesign
  } = usePersistence();

  // --- Mapping Data Preparation (for Blueprint Tab) ---
  const mappingSources = useMemo(() => {
    if (!structure) return [];

    const { normalizeStructureToConcepts } = require('@/modules/core/utils/normalization');
    const normalizedStructure = normalizeStructureToConcepts(structure, semanticMerges);

    // Filter out excluded URLs BEFORE clustering
    const filteredStructure = excludedUrls.size > 0
      ? { ...normalizedStructure, nodes: normalizedStructure.nodes.filter((n: any) => !excludedUrls.has(n.url)) }
      : normalizedStructure;

    const grouped = groupSimilarPages(filteredStructure, 2, 5, clusterOverrides);

    const sources: SourcePage[] = [];

    // Add Clusters
    grouped.groups.forEach((group: any) => {
      sources.push({
        id: group.pattern,
        url: group.pattern,
        title: `Cluster: ${group.pattern}`,
        type: 'cluster',
        count: group.totalCount
      });
    });

    // Add Unique Pages
    grouped.uniquePages.forEach((node: any) => {
      sources.push({
        id: `page-${node.url}`,
        url: node.url,
        title: node.meta?.title || node.title || node.url,
        type: 'page'
      });
    });

    return sources;
  }, [structure, semanticMerges, clusterOverrides, excludedUrls]);

  const mappingTargets = useMemo(() => {
    if (!structure || !migrationPlan) return [];

    const { normalizeStructureToConcepts } = require('@/modules/core/utils/normalization');
    const { buildIdLookup, resolveSourceId } = require('@/modules/analysis/utils/mapping-ids');

    const normalizedStructure = normalizeStructureToConcepts(structure, semanticMerges);

    // Filter out excluded URLs BEFORE clustering (same as mappingSources)
    const filteredStructure = excludedUrls.size > 0
      ? { ...normalizedStructure, nodes: normalizedStructure.nodes.filter((n: any) => !excludedUrls.has(n.url)) }
      : normalizedStructure;

    const grouped = groupSimilarPages(filteredStructure, 2, 5, clusterOverrides);

    // Build efficient lookup with ALL cluster member URLs
    const lookup = buildIdLookup(grouped.groups, grouped.uniquePages);

    // Helper: Normalize path to prevent duplicates (/insights vs /insights/)
    const normalizePath = (path: string): string => {
      if (!path || path === '/') return '/';
      // Remove trailing slash, except for root
      return path.replace(/\/$/, '');
    };

    const targetMap = new Map<string, any>();

    // Helper: resolve -2/-3 suffixed paths to base path if it exists
    const resolveDeduplicatedKey = (rawKey: string): string => {
      // Check if this is a -N suffixed duplicate (e.g., /blog-2, /services-2, /-2)
      const suffixMatch = rawKey.match(/^(.+)-(\d+)$/);
      if (suffixMatch) {
        const basePath = suffixMatch[1];
        // If the base path exists in the target map, use that instead
        if (targetMap.has(basePath)) return basePath;
      }
      return rawKey;
    };

    // 1. Add Global Layout Target
    targetMap.set('layout', {
      id: 'target-layout',
      path: 'layout',
      label: 'layout',
      type: 'layout',
      action: 'keep',
      sourceIds: [],
    });

    // 2. Add from sitemap FIRST (creates architectural targets as foundation)
    migrationPlan.sitemap?.forEach((s: any) => {
      const rawPath = s.path;
      if (!rawPath) return;

      const key = normalizePath(rawPath);

      if (!targetMap.has(key)) {
        targetMap.set(key, {
          id: `target-${key}`,
          path: key,
          label: s.label || key,
          type: s.type || 'page',
          action: 'keep',
          sourceIds: [],
        });
      }
    });

    // 3. Process pattern_mapping (Cluster -> Target mappings)
    migrationPlan.pattern_mapping?.forEach((pm: any) => {
      const rawPath = pm.target_base;
      if (!rawPath) return;

      const key = normalizePath(rawPath);
      const sourceId = resolveSourceId(pm.pattern, lookup);

      if (!targetMap.has(key)) {
        targetMap.set(key, {
          id: `target-${key}`,
          path: key,
          label: key,
          type: pm.type || 'page',
          action: pm.action || 'redirect',
          sourceIds: sourceId ? [sourceId] : [],
          description: pm.reason
        });
      } else if (sourceId) {
        const target = targetMap.get(key)!;
        if (!target.sourceIds.includes(sourceId)) {
          target.sourceIds.push(sourceId);
        }
      }
    });

    // 4. Process page_mapping (Individual page mappings)
    migrationPlan.page_mapping?.forEach((m: any) => {
      const rawPath = m.new_path || m.old_url;
      if (!rawPath) return;

      let key = normalizePath(rawPath);
      const sourceId = m.old_url ? resolveSourceId(m.old_url, lookup) : null;

      // Resolve -2 suffixed duplicates to base path (e.g., /blog-2 → /blog)
      key = resolveDeduplicatedKey(key);

      if (!targetMap.has(key)) {
        targetMap.set(key, {
          id: `target-${key}`,
          path: key,
          label: key,
          type: m.type || 'page',
          action: m.action || 'keep',
          sourceIds: sourceId ? [sourceId] : [],
          description: m.reason || m.description
        });
      } else if (sourceId) {
        const target = targetMap.get(key)!;
        if (!target.sourceIds.includes(sourceId)) {
          target.sourceIds.push(sourceId);
        }
      }
    });

    return Array.from(targetMap.values());
  }, [structure, semanticMerges, clusterOverrides, migrationPlan, excludedUrls]);

  // --- GRANULAR AUTO-SAVE SYSTEM (Phase 1 Optimization) ---
  // Separate saves for different data types = massive performance boost
  // UI changes (100 bytes) no longer trigger full session save (20 MB)

  // 1. UI State Save (FAST - ~100 bytes, 8s debounce)
  useEffect(() => {
    if (!currentSessionId || isProcessing) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving UI state...');
      await saveState(currentSessionId, {
        currentView: view,
        blueprintTab,
        mockupViewMode
      });
    }, 8000); // Long debounce for UI changes

    return () => clearTimeout(timeoutId);
  }, [view, blueprintTab, mockupViewMode, currentSessionId, isProcessing]);

  // 2. Structure Save (MEDIUM - ~2-10 MB, 5s debounce)
  useEffect(() => {
    if (!structure || !currentSessionId || isProcessing) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving structure...');
      await saveStructure(currentSessionId, structure);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [structure, currentSessionId, isProcessing]);

  // 3. Migration Plan Save (MEDIUM - ~1-5 MB, 5s debounce)
  useEffect(() => {
    if (!migrationPlan || !currentSessionId || isProcessing) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving migration plan...');
      await saveMigration(currentSessionId, migrationPlan);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [migrationPlan, currentSessionId, isProcessing]);

  // 4. Specs Save (MEDIUM - ~1-10 MB, 5s debounce)
  useEffect(() => {
    if (!currentSessionId || isProcessing) return;
    if (!pageSpecs && !componentSpec && !finalOutput) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving specs...');
      await saveSpecs(currentSessionId, {
        pageSpecs: pageSpecs || undefined,
        componentSpec: componentSpec || undefined,
        finalOutput: finalOutput || undefined
      });
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [pageSpecs, componentSpec, finalOutput, currentSessionId, isProcessing]);

  // 5. Design Config Save (SMALL - ~100-500 KB, 5s debounce)
  useEffect(() => {
    if (!currentSessionId || isProcessing) return;

    const timeoutId = setTimeout(async () => {
      console.log('[Auto-Save] Saving design config...');
      await saveDesign(currentSessionId, {
        designConfig,
        stackConfig
      });
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [designConfig, stackConfig, currentSessionId, isProcessing]);

  // 6. Fallback: Full Session Save (LEGACY - for remaining data)
  // Only runs when meta data changes (logs, assets, etc.)
  const lastFullSaveRef = useRef<string>('');
  useEffect(() => {
    if (!structure || !currentSessionId || isProcessing) return;

    const timeoutId = setTimeout(async () => {
      // Hash of meta data
      const metaHash = JSON.stringify({
        logs: logs.length,
        customAssets: customAssets?.length,
        downloadedAssets: Object.keys(downloadedAssets?.images || {}).length,
        excludedUrls: Array.from(excludedUrls).length,
        optimizedContent: optimizedContent.size,
        url, userInstructions
      });

      if (metaHash === lastFullSaveRef.current) return;
      lastFullSaveRef.current = metaHash;

      console.log('[Auto-Save] Saving meta data (full save)...');
      const cleanedData = await saveSession({
        id: currentSessionId,
        name: new URL(url).hostname || 'Untitled Project',
        url,
        currentView: view,
        structure,
        critique,
        crawlStats: null,
        logs,
        migrationPlan,
        userInstructions,
        stackConfig,
        designConfig,
        downloadedAssets,
        pageSpecs,
        componentSpec,
        finalOutput,
        excludedUrls: Array.from(excludedUrls),
        optimizedContent: Array.from(optimizedContent.entries()),
        tokenStats,
        customAssets,
        blueprintTab,
        mockupViewMode,
        clusterOverrides
      });

      // Update local state with cleaned URLs (assets)
      if (cleanedData) {
        if (cleanedData.customAssets) setCustomAssets(cleanedData.customAssets);
        if (cleanedData.downloadedAssets) setDownloadedAssets(cleanedData.downloadedAssets);
      }
    }, 10000); // Longest debounce for full saves

    return () => clearTimeout(timeoutId);
  }, [
    logs, customAssets, downloadedAssets, excludedUrls, optimizedContent,
    url, userInstructions, currentSessionId, isProcessing
  ]);

  // Handle Load Session
  const handleLoadSession = async (id: string) => {
    const data = await loadSession(id);
    if (!data) return;

    // Hydrate State
    setUrl(data.url);
    const view = data.currentView === 'config' ? 'mockup_view' : data.currentView as ViewMode;
    setView(view);
    setStructure(data.structure);
    setCritique(data.critique);
    setLogs(data.logs || []);
    setMigrationPlan(data.migrationPlan);
    setUserInstructions(data.userInstructions || '');
    setStackConfig(data.stackConfig);
    setDesignConfig(data.designConfig);
    setDownloadedAssets(data.downloadedAssets);
    setComponentSpec(data.componentSpec);
    setPageSpecs((data as any).pageSpecs || null);
    setFinalOutput(data.finalOutput);
    setTokenStats(data.tokenStats || { totalIn: 0, totalOut: 0 });
    setCustomAssets((data as any).customAssets || []);
    setBlueprintTab((data.blueprintTab as any) || 'overview');
    setMockupViewMode((data.mockupViewMode as any) || 'desktop');
    setExcludedUrls(new Set(data.excludedUrls || []));
    if (data.clusterOverrides) {
      setClusterOverrides(data.clusterOverrides);
    } else {
      // Backwards compatibility or default
      setClusterOverrides({ forceArchetypes: [], ignorePatterns: [] });
    }

    if (data.optimizedContent) {
      setOptimizedContent(new Map(data.optimizedContent));
    }
  };


  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', meta?: any) => {
    setLogs(prev => [...prev, { id: Math.random().toString(), timestamp: new Date().toLocaleTimeString(), message, type, meta }]);
    if (meta && (meta.tokensIn || meta.tokensOut)) {
      setTokenStats(prev => ({
        totalIn: prev.totalIn + (meta.tokensIn || 0),
        totalOut: prev.totalOut + (meta.tokensOut || 0)
      }));
    }
  };

  // --- Step 1: Crawling ---
  const startCrawl = async () => {
    if (!url) return toast.error("Please enter a valid URL");

    setIsProcessing(true);
    setLogs([]); // Reset logs for fresh start
    setTokenStats({ totalIn: 0, totalOut: 0 });
    setCurrentStep('Crawling site structure...');
    setCrawlStats({ processed: 0, found: 0, currentUrl: 'Initializing...', queueLength: 0, activeWorkers: 0 });
    setStructure(null);

    // We stay on 'home' but show the processing state
    try {
      addLog(`INIT: Connecting to ${url}...`);

      const structure = await new Promise<SiteStructure>((resolve, reject) => {
        const es = new EventSource(`/api/crawl?url=${encodeURIComponent(url)}`);

        es.addEventListener('log', (e: any) => {
          const d = JSON.parse(e.data);
          addLog(d.message, d.type);
        });

        es.addEventListener('progress', (e: any) => {
          const d = JSON.parse(e.data);
          setCrawlStats({
            processed: d.processed,
            found: d.found,
            currentUrl: d.url,
            queueLength: d.queueLength,
            activeWorkers: d.activeWorkers
          });
        });

        es.addEventListener('complete', (e: any) => {
          const d = JSON.parse(e.data);
          const pageCount = d.nodes ? d.nodes.length : 0;
          const root = d.nodes && d.nodes.length > 0 ? d.nodes[0] : {};
          console.log(`--- CRAWL COMPLETE: ${pageCount} pages found. Title: ${root?.meta?.title || 'Unknown'} ---`);
          es.close();
          resolve(d);
        });

        es.addEventListener('error', (e: any) => {
          es.close();
          const d = e.data ? JSON.parse(e.data) : { message: "Connection lost" };
          reject(new Error(d.message));
        });
      });

      setStructure(structure);
      if ((structure as any).semanticMerges) {
        setSemanticMerges((structure as any).semanticMerges);
      }
      setCrawlStats(null);
      addLog(`CRAWLER: Indexing complete. Found ${structure.nodes.length} pages.`, 'success');
      toast.success("Crawl Complete");

      // --- DESIGN DETECTIVE: Auto-populate from Signals ---
      if (structure.nodes.length > 0 && structure.nodes[0].meta?.designSignals) {
        const d = structure.nodes[0].meta.designSignals;

        setDesignConfig(prev => {
          let styleId = prev.styleIds[0];
          if (d.hasGlass) styleId = 'glassmorphism';
          else if (d.hasHardShadows) styleId = 'brutalist'; // align with preset id

          let roundness: any = 'default';
          if (d.roundingMode === 'sharp') roundness = 'sharp';
          else if (d.roundingMode === 'full') roundness = 'full';
          else if (d.roundingMode === 'soft') roundness = 'soft';

          return {
            ...prev,
            styleIds: [styleId as any],
            roundness,
            typography: d.typography === 'serif' ? 'classic' : (d.typography === 'mono' ? 'tech' : 'modern'),
            dna: {
              spacing: d.spacing,
              shadows: d.hasHardShadows ? 'hard' : 'soft',
              borderRadius: d.roundingMode,
              typographyScale: 'ratio-1.25',
              glassmorphism: d.hasGlass,
              microInteractions: d.animationLevel === 'high' ? ['hover-lift'] : []
            }
          };
        });
        addLog(`🧬 DESIGN DNA: Auto-detected ${d.hasGlass ? 'Glassmorphism' : (d.hasHardShadows ? 'Brutalism' : 'Standard')} style.`, 'success');
      }
      // Log pattern discovery summary
      const grouped = groupSimilarPages(structure, 2);
      addLog(`✨ PATTERN DISCOVERY: Found ${grouped.stats.uniquePatterns} unique page archetypes across ${structure.nodes.length} pages.`, 'info');
      if (grouped.groups.length > 0) {
        const topPatterns = grouped.groups.slice(0, 3).map(g => `"${g.pattern}" (${g.totalCount} pages)`).join(', ');
        addLog(`💡 Major categories detected: ${topPatterns}...`, 'info');
      }

      // Move to next step
      setView('crawl_result');

    } catch (e: any) {
      addLog(`FATAL: ${e.message}`, 'error');
      toast.error("Crawl failed");
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  // --- Step 3: AI Analysis ---
  const runAIAnalysis = async () => {
    if (!structure) return;

    // --- Filtered Structure based on User Exclusions ---
    const filteredStructure = {
      ...structure,
      nodes: structure.nodes.filter(n => !excludedUrls.has(n.url))
    };

    const excludedCount = structure.nodes.length - filteredStructure.nodes.length;
    if (excludedCount > 0) {
      addLog(`PRUNING: ${excludedCount} pages excluded from analysis by user.`, 'info');
    }

    setIsProcessing(true);
    setView('ai_analysis');
    addLog('--- STARTING AI ANALYSIS ---');

    try {
      // === RUN CRITIQUE + MIGRATION IN PARALLEL ===
      setCurrentStep('Analyzing Structure & Strategy...');
      addLog('AI: Running Audit & Migration in parallel...', 'info');

      // Build parallel promises
      const auditPromise = generateCritiqueAction(filteredStructure, userInstructions, clusterOverrides, semanticMerges);
      const migrationPromise = generateMigrationAction(filteredStructure, userInstructions, clusterOverrides, semanticMerges);

      // Wait for all parallel requests
      const [auditRes, migRes] = await Promise.all([
        auditPromise,
        migrationPromise
      ]);

      // Process Audit result
      if (!auditRes.success) addLog(`AI WARNING: Audit failed (${auditRes.error}). Using fallback data.`, 'warning');
      setCritique(auditRes.data);
      const auditMeta = auditRes.data?._meta;
      addLog(`AI [${auditMeta?.model || 'unknown'}]: Audit complete.`, 'success', auditMeta);

      // Process Migration result
      if (!migRes.success) addLog(`AI WARNING: Migration failed (${migRes.error}). Using fallback data.`, 'warning');
      setMigrationPlan(migRes.data);
      const migMeta = (migRes.data as any)?._meta;
      addLog(`AI [${migMeta?.model || 'unknown'}]: Migration strategy ready.`, 'success', migMeta);

      // COMPONENTS (depends on migRes.data and auditRes.data, so must run after)
      setCurrentStep('Extracting Component Library...');
      addLog('AI: Extracting Component Pattern Library...');
      const compRes = await generateComponentLibraryAction(migRes.data, structure, userInstructions, stackConfig, auditRes.data, clusterOverrides, semanticMerges);
      if (!compRes.success) addLog(`AI WARNING: Component extraction failed (${compRes.error}). Using fallback data.`, 'warning');
      setComponentSpec(compRes.data);
      const compMeta = compRes.data?._meta;
      addLog(`AI [${compMeta?.model || 'unknown'}]: Components defined.`, 'success', compMeta);

      toast.success("AI Analysis Complete");
      setView('ai_result');

    } catch (e: any) {
      addLog(`AI ERROR: ${e.message}`, 'error');
      toast.error("AI Analysis failed");
      // Stay on analysis view so they can see logs or retry
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  // --- Step 5: Config & Plan ---
  const handleConfigSubmit = async (config: StackConfig, designOverride?: DesignConfig, specsOverride?: TargetSlot[]) => {
    setIsProcessing(true);
    setCurrentStep('Refining Implementation Strategy...');
    addLog(`USER: Configuring ${config.framework.toUpperCase()} stack...`);

    const activeDesign = designOverride || designConfig;
    const activeSpecs = specsOverride || pageSpecs;

    try {
      // Reuse existing component spec if available, otherwise generate
      let currentSpec = componentSpec;
      if (!currentSpec) {
        addLog('GEMINI: Extracting Component Pattern Library...');
        const compRes = await generateComponentLibraryAction(migrationPlan, structure, userInstructions, config, critique, {}, semanticMerges);
        if (!compRes.success) addLog(`AI WARNING: Component extraction failed (${compRes.error}). Using fallback data.`, 'warning');
        currentSpec = compRes.data;
        setComponentSpec(currentSpec);

        // Auto-detect style from AI analysis
        if (currentSpec?.design_system?.detected_style_preset) {
          const detectedStyle = currentSpec.design_system.detected_style_preset;
          // Verify if it's a valid style ID (simple check or cast)
          const validStyles = ['modern', 'minimalist', 'glassmorphism', 'brutalist', 'luxury', 'playful', 'cyberpunk', 'nature', 'corporate', 'retro'];
          if (validStyles.includes(detectedStyle)) {
            setDesignConfig(prev => ({
              ...prev,
              styleIds: [detectedStyle as any]
            }));
            addLog(`AI: Auto-detected style "${detectedStyle}" based on site analysis.`, 'success');
          }
        }

        // Auto-detect roundness
        if (currentSpec?.design_system?.roundness) {
          const r = currentSpec.design_system.roundness;
          if (['sharp', 'default', 'full'].includes(r)) {
            setDesignConfig(prev => ({
              ...prev,
              roundness: r as any
            }));
          }
        }
      }

      // 2. Download Images
      let assetMap: Record<string, string> | undefined = undefined;

      const imageUrls = structure?.nodes.flatMap(n => n.content.images.map(img => img.src)) || [];
      const uniqueUrls = Array.from(new Set(imageUrls)).filter(u => u.startsWith('http'));

      if (uniqueUrls.length > 0) {
        addLog(`ASSETS: Found ${uniqueUrls.length} images. Downloading...`);
        const dlRes = await downloadImagesAction(uniqueUrls);
        if (dlRes.success && dlRes.data) {
          setDownloadedAssets(dlRes.data);
          assetMap = dlRes.data.map;
          addLog(`ASSETS: Successfully downloaded ${Object.keys(dlRes.data.images).length} images.`, 'success');
        } else {
          addLog(`ASSETS: Download failed or partial.`, 'warning');
        }
      }

      // Run implementation planning
      if (!currentSpec) {
        throw new Error('Component pattern library is missing. Analysis may have failed.');
      }

      const res = await generateImplementationPlanAction(
        currentSpec as ComponentSpecification,
        config,
        userInstructions,
        assetMap,
        activeDesign,
        activeSpecs || [],
        migrationPlan
      );

      if (!res.success) addLog(`AI WARNING: Plan generation failed (${res.error}). Using fallback data.`, 'warning');
      // res.data is the implementation plan (string or object depending on mock/real)
      setFinalOutput({ spec: null, implPlan: res.data });
      addLog('SUCCESS: Final Implementation Plan generated successfully.', 'success');

      setView('final_plan');
    } catch (e: any) {
      addLog(`generation failed: ${e.message}`, 'error');
      toast.error("Plan generation failed");
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };



  // --- Mockup Generation (Lifted State) ---
  const handleMockupGeneration = async (withFeedback?: boolean) => {
    setIsGeneratingMockup(true);
    setMockupError(null);
    setView('mockup_view'); // Immediate redirect to preview

    const currentIteration = withFeedback ? (designConfig.mockupIteration || 1) + 1 : 1;
    addLog(`DESIGN: Generating 3 Mockup Variants (Iteration ${currentIteration})...`, 'info');

    try {
      // Prepare site data for formatting - include Smart Image Intelligence data
      const rootNode = structure?.nodes[0];
      const siteDataForMockup = rootNode ? {
        siteName: rootNode.meta?.title?.split('|')[0]?.trim() || rootNode.meta?.title?.split('-')[0]?.trim(),
        h1: rootNode.content?.h1,
        headings: rootNode.content?.headings,
        navigation: rootNode.content?.links
          ?.filter((l: any) => l.isInternal || l.text)
          ?.filter((l: any) => l.text && l.text.length < 30)
          ?.slice(0, 10)
          ?.map((l: any) => ({ text: l.text, href: l.href })),
        // Context-Aware Image Selection
        images: (() => {
          const allImages: any[] = [];
          const seenSrcs = new Set<string>();
          structure?.nodes?.forEach((node: any) => {
            node.content?.images?.forEach((img: any) => {
              if (img.src && !seenSrcs.has(img.src)) {
                seenSrcs.add(img.src);
                allImages.push({
                  src: img.src,
                  alt: img.alt,
                  context: img.context,
                  isLogo: img.isLogo,
                  logoProb: img.logoProb,
                  role: img.role,
                  roleConfidence: img.roleConfidence,
                  componentHint: img.componentHint ?? undefined,
                  groupId: img.groupId ?? undefined,
                  sourcePage: node.url
                });
              }
            });
          });
          const { selectImagesForMockup } = require('@/lib/utils/image-selection');
          const selectionResult = selectImagesForMockup(allImages, componentSpec);
          return selectionResult.selectedImages;
        })(),
        rawText: rootNode.content?.rawText?.substring(0, 1000),
        forms: rootNode.content?.forms,
        meta: {
          title: rootNode.meta?.title,
          description: rootNode.meta?.description,
          designSignals: rootNode.meta?.designSignals,
          imageComponentSummary: rootNode.meta?.imageComponentSummary?.map((s: any) =>
            `${s.groupId}: ${s.imageCount} images, role: ${s.role}`
          )
        },
        assignedLogos: pageSpecs?.find(s => s.type === 'layout')?.logos || [],
        extractedColors: (() => {
          const colors = rootNode.content?.extractedColors;
          if (!colors) return undefined;
          const colorList: { color: string; usage?: string }[] = [];
          if (typeof colors.primary === 'string' || typeof colors.background === 'string') {
            if (colors.primary) colorList.push({ color: colors.primary, usage: 'primary' });
            if (colors.accent) colorList.push({ color: colors.accent, usage: 'accent' });
            if (colors.secondary) colorList.push({ color: colors.secondary, usage: 'secondary' });
            if (typeof colors.background === 'string') colorList.push({ color: colors.background, usage: 'background' });
            if (typeof colors.text === 'string') colorList.push({ color: colors.text, usage: 'text' });
          }
          return colorList.length > 0 ? colorList : undefined;
        })(),
        plannedContent: (() => {
          const homePath = rootNode ? new URL(rootNode.url).pathname : '/';
          const match = pageSpecs?.find((p: any) => p.path === homePath || p.path === '/' || p.path === '/home');
          if (!match) return undefined;
          return {
            description: match.description,
            content_goals: match.content_goals,
            sections: match.sections?.map(s => ({
              type: s.type,
              headline: s.headline,
              content: s.content,
              images: s.images
            }))
          };
        })(),
        componentSpec: componentSpec || undefined
      } : undefined;

      // --- Parallel Generation (5 Variants synced with Design Studio) ---
      const generationPromises = [1, 2, 3, 4, 5].map(id => {
        const selectedStyles = designConfig.styleIds || [];
        let variantStyleIds = [...selectedStyles];
        let structuralSeed = "";

        // Distribution Logic based on selected styles
        if (selectedStyles.length >= 2) {
          // Scenario A: Multiple styles - distribute focus
          if (id === 1) {
            // Variant 1: All selected (Balanced Mix)
            variantStyleIds = [...selectedStyles];
            structuralSeed = "Create a balanced fusion of all selected styles.";
          } else if (id <= selectedStyles.length + 1) {
            // Variant 2, 3...: Focus on individual styles from selection
            const focusStyleIdx = (id - 2) % selectedStyles.length;
            variantStyleIds = [selectedStyles[focusStyleIdx]];
            structuralSeed = `Strongly emphasize the "${selectedStyles[focusStyleIdx]}" style parameters.`;
          } else {
            // Remaining variants: Experimental mix
            structuralSeed = "Try an experimental structural approach, blending styles in a unique way.";
          }
        } else {
          // Scenario B: Single or no style - vary the structure/vibe
          const seeds = [
            "Master Reference: Follow the selected style strictly with a standard professional layout.",
            "Editorial: High-end magazine feel, large type, massive whitespace, artistic alignment.",
            "Bento: Use asymmetrical bento grids, mixed card sizes, and sophisticated depth.",
            "Interactive: Focus on glassmorphism layers, floating elements, and high-tech detail.",
            "Efficient: High-density layouts, clear focal points, and business-focused hierarchy."
          ];
          structuralSeed = seeds[id - 1];
        }

        const configVariant = {
          ...designConfig,
          styleIds: variantStyleIds, // Override with specific focus for this variant
          mockupIteration: currentIteration,
          customInstructions: id === 1
            ? designConfig.customInstructions
            : `${designConfig.customInstructions} (${structuralSeed})`
        };
        return generateVisualMockupAction(configVariant as any, configVariant.customInstructions || undefined, siteDataForMockup);
      });

      const initialResults = await Promise.all(generationPromises);
      const successfulVariants: MockupVariant[] = initialResults
        .filter(r => r.success && r.data)
        .map((r, i) => ({
          id: `variant-${currentIteration}-${i + 1}`,
          html: r.data as string,
          iteration: currentIteration,
          timestamp: Date.now(),
          archetype: designConfig.unleashedArchetype
        }));

      if (successfulVariants.length > 0) {
        setDesignConfig(prev => {
          // Move current variants to history if they exist
          const newHistory = [...(prev.mockupHistory || [])];
          if (prev.mockupVariants && prev.mockupVariants.length > 0) {
            newHistory.push(...prev.mockupVariants);
          }

          return {
            ...prev,
            mockupVariants: successfulVariants,
            activeVariantId: successfulVariants[0].id,
            mockupHistory: newHistory,
            mockupIteration: currentIteration,
            // Legacy field support
            mockupHtml: successfulVariants[0].html
          };
        });
        toast.success(`${successfulVariants.length} Varianten erstellt!`);
        addLog(`DESIGN: Parallel generation complete (${successfulVariants.length}/3 successful).`, 'success');
      } else {
        const errorMsg = initialResults.find(r => !r.success)?.error || "Failed to generate any variants";
        setMockupError(errorMsg);
        toast.error("Mockup generation failed");
        addLog(`DESIGN ERROR: ${errorMsg}`, 'error');
      }
    } catch (e: any) {
      setMockupError(e.message);
      toast.error("Error generating mockup");
      addLog(`DESIGN ERROR: ${e.message}`, 'error');
    } finally {
      setIsGeneratingMockup(false);
    }
  };



  // --- Keep Alive Logger for long AI operations ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const isLongRunning = isGeneratingMockup || (isProcessing && view === 'ai_analysis');

    if (isLongRunning) {
      let elapsed = 0;
      const messages = [
        "AI is analyzing your site structure...",
        "Generating accessibility audit...",
        "Developing migration strategy...",
        "Extracting component patterns...",
        "Processing... larger sites take longer.",
        "Almost there, synthesizing results..."
      ];
      interval = setInterval(() => {
        elapsed += 15;
        const msgIndex = Math.floor(elapsed / 15) % messages.length;
        addLog(`INFO: ${messages[msgIndex]} (${elapsed}s elapsed)`, 'info');
      }, 15000); // 15 seconds
    }
    return () => clearInterval(interval);
  }, [isGeneratingMockup, isProcessing, view]);

  // --- ZIP Download Handler ---
  const handleZipDownload = async () => {
    if (!finalOutput?.implPlan) {
      toast.error("No implementation plan available");
      return;
    }

    addLog('EXPORT: Generating ZIP file...');
    toast.loading("Generating ZIP...", { id: 'zip' });

    try {
      // Generate Implementation Plan Markdown (reuse PlanViewer's logic)
      const planMd = generateImplementationPlanMarkdown(finalOutput.implPlan);

      // Convert reviewed pageSpecs to files
      const contentFiles: ContentFile[] = [];
      const usedImageUrls = new Set<string>();

      if (pageSpecs) {
        // Collect used URLs for filtering
        pageSpecs.forEach((spec) => {
          spec.sections?.forEach((s: any) => {
            s.images?.forEach((img: any) => usedImageUrls.add(img.src));
          });
          spec.logos?.forEach((img: any) => usedImageUrls.add(img.src));
        });

        pageSpecs.forEach((spec) => {
          const path = spec.path;
          const optimizedData: OptimizedPageData = {
            page_title: spec.path,
            meta_description: spec.description || '',
            h1: spec.sections?.find(s => s.type === 'hero')?.headline || '',
            url: spec.sourceDetails?.[0]?.url, // Pass original URL for MD export
            language: spec.language || spec.sourceDetails?.[0]?.meta?.lang, // Pass extracted language
            canonical: spec.canonical,
            hreflangs: spec.hreflangs,
            keywords: [],
            sections: (spec.sections || []).map((s, idx) => ({
              id: `section-${idx}`,
              component: s.type,
              heading: s.headline || s.title || '',
              content: s.content || '',
              image_suggestions: (s.images || []).map((img: any) => ({
                src: img.src,
                status: img.status,
                localPath: downloadedAssets?.map[img.src]
              }))
            }))
          };

          contentFiles.push({
            path,
            content: pageDataToMarkdown(path, optimizedData)
          });
        });
      }

      // Filter assets to only include used ones
      const filteredImages: Record<string, string> = {};
      const filteredMap: Record<string, string> = {};

      if (downloadedAssets?.map) {
        Object.entries(downloadedAssets.map).forEach(([url, filename]) => {
          if (usedImageUrls.has(url)) {
            filteredMap[url] = filename;
            if (downloadedAssets.images[filename]) {
              filteredImages[filename] = downloadedAssets.images[filename];
            }
          }
        });
      }

      const blob = await generateProjectZip(
        planMd,
        contentFiles,
        filteredImages,
        filteredMap,
        designConfig.mockupHtml || undefined,
        migrationPlan?.clusters
      );
      downloadBlob(blob, 'web-architect-export.zip');

      toast.success("ZIP downloaded!", { id: 'zip' });
      addLog('EXPORT: ZIP file generated successfully.', 'success');
    } catch (e: any) {
      toast.error("ZIP generation failed", { id: 'zip' });
      addLog(`EXPORT ERROR: ${e.message}`, 'error');
    }
  };

  // Refactored Generation Handler
  const handleGenerateSpecs = async (targets: any[]) => {
    setIsProcessing(true);
    setView('content_review'); // Switch to Review View immediately
    toast.info("Analyzing content & generating drafts...");

    // Enrich targets with source details for AI
    const enrichedTargets = targets.map(t => {
      // SPECIAL RULE: Layout target (Global Context Collector)
      if (t.type === 'layout' || t.path === 'layout') {
        const rawLogos = structure?.nodes?.flatMap(n => n.content?.images?.filter(img => img.isLogo || img.role === 'logo') || []) || [];

        // Deduplicate and Filter
        const uniqueLogosMap = new Map<string, any>();
        rawLogos.forEach(img => {
          if (!img.src) return;
          const srcLower = img.src.toLowerCase();
          // Filter out obvious UI icons that aren't usually the main brand logo
          const isIcon = srcLower.includes('menu') ||
            srcLower.includes('close') ||
            srcLower.includes('search') ||
            srcLower.includes('hamburger') ||
            srcLower.includes('burger') ||
            srcLower.includes('icon-') ||
            srcLower.includes('cross') ||
            srcLower.includes('chevron') ||
            srcLower.includes('arrow') ||
            srcLower.includes('social-') ||
            srcLower.includes('facebook') ||
            srcLower.includes('instagram') ||
            srcLower.includes('linkedin');

          if (isIcon && !img.isLogo) return; // Keep if explicitly marked as isLogo but filter if just role=logo and generic name

          if (!uniqueLogosMap.has(img.src)) {
            uniqueLogosMap.set(img.src, img);
          }
        });

        const dedupedLogos = Array.from(uniqueLogosMap.values())
          .sort((a, b) => (b.logoProb || 0) - (a.logoProb || 0));

        const headerBlocks = structure?.nodes?.flatMap(n => n.content?.semanticBlocks?.filter((b: any) => b.type === 'header' || b.type === 'nav') || []) || [];
        const footerBlocks = structure?.nodes?.flatMap(n => n.content?.semanticBlocks?.filter((b: any) => b.type === 'footer') || []) || [];

        return {
          ...t,
          logos: dedupedLogos.map((img: any, i: number) => ({
            src: img.src,
            status: i === 0 ? 'mandatory' : 'optional' as const
          })),
          sourceDetails: [{
            url: 'global-context',
            title: 'Global Layout & Branding DNA',
            content: `## BRAND ASSETS (LOGOS):
${dedupedLogos.map(img => `- SRC: ${img.src} | ALT: ${img.alt || 'None'}`).join('\n')}

## HEADER/NAVIGATION BLOCKS:
${headerBlocks.slice(0, 10).map((b: any) => b.content).join('\n---\n')}

## FOOTER BLOCKS:
${footerBlocks.slice(0, 5).map((b: any) => b.content).join('\n---\n')}

## PLANNED SITEMAP STRUCTURE (NAV TARGETS):
${targets.filter(t => t.type !== 'layout').map(t => `- PATH: ${t.path} | LABEL: ${t.label}`).join('\n')}

## SITE METADATA:
Title: ${structure?.nodes?.[0]?.meta?.title || 'Unknown'}
Sample Description: ${structure?.nodes?.[0]?.meta?.description || 'None'}`,
            blocks: [...headerBlocks, ...footerBlocks]
          }]
        };
      }

      const urlList: { url: string; reason?: string }[] = t.sourceIds.flatMap((sId: string) => {
        if (sId.startsWith('source-raw-')) {
          const url = sId.substring(11);
          return [{ url, reason: 'Raw discovered page' }];
        } else if (sId.startsWith('source-')) {
          const idx = parseInt(sId.substring(7));
          const m = migrationPlan?.page_mapping[idx];
          return m ? [{ url: m.old_url, reason: m.reason }] : [];
        } else {
          // Cluster pattern
          const cluster = migrationPlan?.clusters?.find((c: any) => c.id === sId || c.pattern === sId);
          return cluster ? cluster.instances.map((inst: any) => ({
            url: inst.url,
            reason: `Member of cluster ${cluster.pattern}`
          })) : [];
        }
      });

      return {
        ...t,
        sourceDetails: urlList.map(s => {
          // Find original node to get content
          const node = structure?.nodes.find((n: any) => n.url === s.url);
          if (!node) return null;

          const rawText = node.content?.rawText || '';
          return {
            url: s.url,
            title: s.reason || node.meta?.title,
            // Pass truncated content + Image Metadata to AI
            content: `## SOURCE ASSET INVENTORY (AVAILABLE IMAGES):
${(node.content?.images || []).map((img: any) => `- SRC: ${img.src} | ALT: ${img.alt || 'None'} | ROLE: ${img.role || 'unknown'}`).join('\n')}

## SOURCE TEXT CONTENT:
${rawText.substring(0, 50000)}`,
            // Context-Aware Data Feed
            blocks: node.content?.semanticBlocks || []
          };
        }).filter(Boolean)
      };
    });

    try {
      // 1. Initialize Progressive Loading
      setPageSpecs([]);
      const total = enrichedTargets.length;
      setTotalPages(total);
      setPagesCompleted(0);

      // 2. Sequential Processing Loop: Phase-by-Page
      for (let i = 0; i < total; i++) {
        const target = enrichedTargets[i];
        setPagesCompleted(i);

        // --- STEP 1: FRAME DESIGN (Architecture) ---
        setCurrentStep(`Designing Frame for ${target.path}...`);
        const result = await generatePageSpecsAction([target], structure, currentSessionId || undefined, semanticMerges);

        if (result.success && result.data && result.data[0]) {
          let currentSpec = result.data[0];

          // Normalize initial spec images too
          if (currentSpec.sections) {
            currentSpec.sections = currentSpec.sections.map((s: any) => ({
              ...s,
              images: (s.images || [])
                .map((img: any) => {
                  const src = typeof img === 'string' ? img : img.src;
                  if (!src || src.trim() === '') return null;

                  // Filter out obvious non-URL strings or AI hallucinations
                  const isLink = src.startsWith('http') || src.startsWith('/') || src.startsWith('./') || src.startsWith('data:');
                  if (!isLink) return null;

                  return { src: src.trim(), status: (img && typeof img === 'object' && img.status) || 'optional' };
                })
                .filter(Boolean)
            }));
          }

          // ADD TO UI IMMEDIATELY (Initial Frame)
          setPageSpecs(prev => {
            const list = prev || [];
            const existing = list.find(p => p.path === currentSpec.path);
            if (existing) return list.map(p => p.path === currentSpec.path ? currentSpec : p);
            return [...list, currentSpec];
          });

          // --- STEP 2: CONTEXT COLLECTION (Mining) ---
          setCurrentStep(`Searching dependencies for ${target.path}...`);
          try {
            const sitemapPaths = structure?.nodes?.map((n: any) => {
              try { return new URL(n.url).pathname; } catch (e) { return n.url; }
            }).filter(Boolean) || [];
            const sectionHints = currentSpec.sections?.map((s: any) => s.type).join(", ") || "General content";

            const depResult = await detectDependenciesAction(
              currentSpec.path,
              `Frame Design: [${sectionHints}]. What other pages contain context/images for these elements?`,
              sitemapPaths,
              currentSessionId || undefined
            );

            // Normalize dependencies to string array
            const rawDeps = (depResult.success && depResult.data?.dependencies) || [];
            const newDeps = rawDeps.map((d: any) => typeof d === 'string' ? d : d.path || d.url || d.pathname).filter(Boolean);

            const additionalContext = newDeps.map((depPath: string) => {
              const node = structure?.nodes?.find((n: any) => {
                try { return new URL(n.url).pathname === depPath; } catch (e) { return false; }
              });
              return node ? { path: depPath, content: node.content?.rawText || '' } : null;
            }).filter(Boolean);

            // --- STEP 3: CONTENT GENERATION (Drafting) ---
            setCurrentStep(`Drafting Copy for ${target.path}...`);

            // Gather Primary Context
            const primarySourceText = (target as any).sourceDetails?.map((s: any) => s.content).join('\n\n') || '';

            const regResult = await regeneratePageSpecsAction(
              currentSpec,
              primarySourceText,
              additionalContext,
              sitemapPaths,
              "Initial Generation: Filling architecture frame with source content and context.",
              currentSessionId || undefined
            );

            if (regResult.success && regResult.data) {
              // Normalize images to SectionImage format and FILTER OUT EMPTY STRINGS
              const normalizedData = { ...regResult.data };
              if (normalizedData.sections) {
                normalizedData.sections = normalizedData.sections.map((s: any) => ({
                  ...s,
                  images: (s.images || [])
                    .map((img: any) => {
                      const src = typeof img === 'string' ? img : img.src;
                      return src && src.trim() !== '' ? { src: src, status: img.status || 'optional' } : null;
                    })
                    .filter(Boolean)
                }));
              }
              currentSpec = {
                ...normalizedData,
                sourceDetails: target.sourceDetails, // PRESERVE THIS
                logos: target.logos, // PRESERVE THIS
                dependencies: newDeps,
                dependencies_detected: true,
                lastGeneratedAt: Date.now()
              };

              // VALIDATION: Ensure we have sections. If not, don't overwrite if it was a failure
              if (!currentSpec.sections || currentSpec.sections.length === 0) {
                console.warn(`[Iteration Loop] Target ${target.path} returned no sections. Keeping frame.`);
                currentSpec.sections = result.data[0].sections || [];
              }

              // ONLY NOW: Display the final result in UI
              setPageSpecs(prev => {
                const list = prev || [];
                const existing = list.find(p => p.path === currentSpec.path);
                if (existing) return list.map(p => p.path === currentSpec.path ? currentSpec : p);
                return [...list, currentSpec];
              });
            }
          } catch (loopError) {
            console.error(`Refinement error for ${target.path}`, loopError);
          }
        }
      } // End of for loop

      setPagesCompleted(total);

      // Image validation
      if (structure && pageSpecs) {
        const inventory = ImageValidator.buildAssetInventory(structure);
        const imageValidation = ImageValidator.validatePageSpecImages(pageSpecs, inventory);

        if (!imageValidation.isValid) {
          toast.warning(`${imageValidation.invalidImages.length} Bilder nicht im Inventar gefunden`);
          console.warn('Image validation issues:', {
            invalidImages: imageValidation.invalidImages,
            warnings: imageValidation.warnings
          });

          // Log detailed report to console for debugging
          console.log(ImageValidator.generateValidationReport(imageValidation));
        }
      }

      toast.success("All drafts generated successfully!");
      // BETTER: Reload from what we just set
      return pageSpecs || targets;

    } catch (e) {
      toast.error("Failed to generate strategy");
      setView('ai_result'); // Go back on error
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
    return targets;
  };

  // Helper to generate markdown from plan (supports both old and new formats)
  const generateImplementationPlanMarkdown = (plan: any): string => {
    // If plan is already improved markdown string (from new prompt), return it directly
    if (typeof plan === 'string') {
      return plan;
    }

    let md = `# ${plan.title || 'Technical Implementation Guide'}\n\n`;

    // 1. Analysis Summary
    if (plan.analysis_summary) {
      md += `## 1. Analysis Summary\n\n`;
      if (plan.analysis_summary.entities?.length) {
        md += `### Core Business Entities\n`;
        plan.analysis_summary.entities.forEach((e: any) => {
          md += `\n**${e.name}**\n`;
          if (e.attributes && Array.isArray(e.attributes)) {
            e.attributes.forEach((attr: any) => {
              if (typeof attr === 'string') {
                md += `- ${attr}\n`;
              } else {
                md += `- ${attr.name} (${attr.type || '-'}): ${attr.description || ''}\n`;
              }
            });
          }
        });
        md += `\n`;
      }
      if (plan.analysis_summary.ui_features?.length) {
        md += `### UI Features\n`;
        plan.analysis_summary.ui_features.forEach((f: string) => md += `- ${f}\n`);
        md += `\n`;
      }
      if (plan.analysis_summary.stack_notes) {
        md += `### Stack Notes\n${plan.analysis_summary.stack_notes}\n\n`;
      }
    }

    // 2. File Structure (supports both formats)
    md += `## 2. File Structure\n\n`;
    if (plan.file_structure && typeof plan.file_structure === 'string') {
      md += `\`\`\`\n${plan.file_structure}\n\`\`\`\n\n`;
    } else if (plan.project_structure?.length) {
      plan.project_structure.forEach((f: any) => md += `- \`${f.path}\`: ${f.description}\n`);
      md += `\n`;
    }

    // 3. Content Files
    if (plan.content_files?.length) {
      md += `## 3. Content Files\n\n`;
      plan.content_files.forEach((cf: any) => {
        md += `- **${cf.path}**`;
        if (cf.sections) md += ` - Sections: ${cf.sections.join(', ')}`;
        md += `\n`;
      });
      md += `\n`;
    }

    // 4. Implementation Steps
    const stepsSection = plan.content_files?.length ? '4' : '3';
    md += `## ${stepsSection}. Implementation Steps\n\n`;
    plan.phases?.forEach((phase: any) => {
      md += `### ${phase.title}\n`;
      if (phase.estimated_time) md += `*Estimated: ${phase.estimated_time}*\n`;
      md += `\n`;

      phase.steps?.forEach((step: any) => {
        md += `#### ${step.title}\n`;
        if (step.file_path) md += `**File**: \`${step.file_path}\`\n`;
        if (step.action) md += `**Action**: ${step.action}\n`;
        md += `\n`;

        if (step.instructions?.length) {
          md += `**Instructions**:\n`;
          step.instructions.forEach((inst: string, idx: number) => md += `${idx + 1}. ${inst}\n`);
          md += `\n`;
        }

        if (step.content_reference) {
          md += `**Content Reference**: ${step.content_reference}\n\n`;
        }

        if (step.validation) {
          md += `**Validation**: ${step.validation}\n\n`;
        }

        md += `---\n\n`;
      });
    });

    return md;
  };



  // Helper for Nav
  const NavItem = ({ id, label, icon: Icon, disabled }: any) => (
    <button
      onClick={() => !disabled && setView(id)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all relative rounded-md",
        view === id ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300",
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">
      <Toaster position="top-right" theme="dark" />

      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">WebArchitect <span className="text-blue-500">AI</span></h1>
            </div>
          </div>

          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5 overflow-x-auto max-w-full scrollbar-none">
            <NavItem id="home" label="Start" icon={Zap} />
            <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
            <NavItem id="crawl_result" label="Structure" icon={LayoutTemplate} disabled={!structure} />
            <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
            <NavItem id="ai_analysis" label="Analysis" icon={BrainCircuit} disabled={!structure} />
            <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
            <NavItem id="ai_result" label="Blueprint" icon={Layers} disabled={!migrationPlan} />
            <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
            <NavItem id="content_review" label="Review" icon={FileText} disabled={!pageSpecs} />
            <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
            <NavItem id="design_studio" label="Design" icon={Palette} disabled={!migrationPlan} />
            <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
            <NavItem id="mockup_view" label="Preview" icon={Eye} disabled={!designConfig.mockupHtml} />
            <ArrowRight className="w-3 h-3 text-white/20 mx-1" />
            <NavItem id="final_plan" label="Master Plan" icon={Terminal} disabled={!finalOutput} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-8 flex-1 w-full">

        {/* VIEW: HOME + CRAWLING (Combined per user request: "HOME / CRAWLING") */}
        {(view === 'home') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-5 flex flex-col justify-center items-center">
              <div className="w-full max-w-lg space-y-6">
                <div className="space-y-2 text-center">
                  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 animate-in fade-in slide-in-from-bottom-3">
                    Web Architect AI
                  </h1>
                  <p className="text-zinc-400 text-sm">
                    Autonomous v3.0 Migration Agent
                  </p>
                </div>

                {/* Input Card */}
                <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
                      Target Website URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm placeholder:text-zinc-700"
                        onKeyDown={(e) => e.key === 'Enter' && startCrawl()}
                      />
                      <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-600" />
                    </div>
                  </div>

                  <Button
                    onClick={startCrawl}
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
                          onClick={() => handleLoadSession(session.id)}
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
                      <div className="text-2xl font-bold text-blue-400 font-mono">{crawlStats.processed}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Processed</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                      <div className="text-2xl font-bold text-purple-400 font-mono">{crawlStats.found}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Discovered</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                      <div className="text-2xl font-bold text-emerald-400 font-mono">{crawlStats.queueLength}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Queue</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md col-span-1 md:col-span-1">
                      <div className="text-2xl font-bold text-orange-400 font-mono">{crawlStats.activeWorkers || 1}<span className="text-sm opacity-50 ml-1">threads</span></div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Active</div>
                    </div>
                    <div className="col-span-2 md:col-span-4 bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                      <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
                      <span className="text-xs font-mono text-gray-400 truncate flex-1">{crawlStats.currentUrl}</span>
                    </div>
                  </div>
                )}
                <ProcessLog logs={logs} isCrawling={isProcessing} currentStep={currentStep} tokenStats={tokenStats} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CRAWL RESULT */}
        {view === 'crawl_result' && structure && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4">
            <div className="lg:col-span-5 space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white">Site Map Detected</h2>
                <p className="text-gray-400 mt-2">
                  We found <strong>{structure.nodes.length} pages</strong>. Add your instructions below, then start AI Analysis.
                </p>
              </div>
              {/* Asset Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <div className="text-xl">🖼️</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Detected Assets</div>
                    <div className="text-xs text-gray-500">
                      {new Set(structure.nodes.flatMap(n => n.content.images.map(i => i.src))).size} unique images found
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-400 font-medium">Ready for Extraction</div>
                  <div className="text-[10px] text-gray-600">Will be included in ZIP</div>
                </div>
              </div>

              {/* Design Style Picker */}


              {/* User Instructions Input */}
              <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                <UserInstructionsInput
                  value={userInstructions}
                  onChange={setUserInstructions}
                  disabled={isProcessing}
                />
              </div>

              <Button
                onClick={runAIAnalysis}
                disabled={isProcessing}
                className="w-full h-14 text-lg shadow-lg bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
              >
                <BrainCircuit className="w-5 h-5 mr-2" />
                {isProcessing ? 'Analyzing...' : 'Start AI Analysis'}
              </Button>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-gray-400">
                <p><strong>Next Step:</strong> Gemini will use your instructions to audit pages and design a migration strategy.</p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <SiteTree
                structure={structure}
                semanticMerges={semanticMerges}
                excludedUrls={excludedUrls}
                clusterOverrides={clusterOverrides}
                onToggleExclusion={(url, excluded) => {
                  setExcludedUrls(prev => {
                    const next = new Set(prev);
                    if (excluded) next.add(url);
                    else next.delete(url);
                    return next;
                  });
                }}
                onUpdateOverrides={setClusterOverrides}
              />
            </div>
          </div>
        )}

        {/* VIEW: AI ANALYSIS (Processing State) */}
        {view === 'ai_analysis' && (
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
              <BrainCircuit className="w-24 h-24 text-blue-500 animate-pulse relative z-10" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white">AI Architect Working...</h2>
              <p className="text-gray-400 mt-2">Analyzing your site structure and generating modern components. Check the logs below for details.</p>
            </div>

            <div className="text-left bg-black/50 rounded-xl border border-white/10 p-6 h-[400px] overflow-hidden relative">
              <ProcessLog logs={logs} isCrawling={true} />
              {/* Using isCrawling=true just to keep the auto-scroll behavior active ideally, 
                        though ProcessLog might need check. 'true' usually implies 'active'. */}
            </div>
          </div>
        )}

        {/* VIEW: AI RESULT (Migration Editor + Critique) */}
        {view === 'ai_result' && migrationPlan && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* Header with Tabs */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Proposed Architecture (V3)</h2>
                  <p className="text-gray-400 text-sm">Review and edit the new sitemap structure.</p>
                </div>
                <div className="flex items-center gap-3">
                  {!pageSpecs ? (
                    <Button
                      onClick={() => {
                        if (!migrationPlan?.page_mapping && !migrationPlan?.pattern_mapping) return;

                        // Reconstruct targets structure for the handler
                        const targetMap = new Map<string, any>();

                        // 1. Initialize from sitemap to catch all structural targets (including layout)
                        migrationPlan.sitemap?.forEach(s => {
                          const key = s.path;
                          targetMap.set(key, {
                            id: `target-${key}`,
                            path: s.path,
                            label: s.label || s.path,
                            type: s.type || 'page',
                            action: 'keep', // Default, will be updated by mapping
                            sourceIds: [],
                          });
                        });

                        // 2a. Map sources from pattern_mapping (cluster mappings)
                        migrationPlan.pattern_mapping?.forEach((pm: any) => {
                          const key = pm.target_base;
                          if (!key) return;
                          if (!targetMap.has(key)) {
                            targetMap.set(key, {
                              id: `target-${key}`,
                              path: key,
                              label: key,
                              type: pm.type || 'page',
                              action: pm.action || 'redirect',
                              sourceIds: [],
                            });
                          }
                        });

                        // 2b. Map sources from page_mapping
                        migrationPlan.page_mapping?.forEach((m: any, i: number) => {
                          const key = m.new_path || m.old_url;
                          if (!targetMap.has(key)) {
                            targetMap.set(key, {
                              id: `target-${key}`,
                              path: m.new_path,
                              label: m.new_path,
                              type: m.type || 'page',
                              action: m.action || 'redirect',
                              sourceIds: [],
                            });
                          }
                          const target = targetMap.get(key)!;
                          target.sourceIds.push(`source-${i}`);
                          if (m.action) target.action = m.action;
                          if (m.type) target.type = m.type;
                        });

                        // Pass structure explicitly to ensure fresh state if closure is stale? 
                        // Actually I can't change signature easily if it's typed elsewhere.
                        // Let's find definition first.
                        handleGenerateSpecs(Array.from(targetMap.values()));
                      }}
                      className="bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
                    >
                      <Sparkles size={14} className="mr-2" /> AI Plan Generieren
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setView('content_review')}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg"
                    >
                      Next: Review Content <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Tab Navigation */}
              <BlueprintTabs
                activeTab={blueprintTab}
                onTabChange={setBlueprintTab}
                mappingCount={(migrationPlan.page_mapping?.length || 0) + (migrationPlan.pattern_mapping?.length || 0)}
              />


            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {/* OVERVIEW TAB */}
              {blueprintTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* BFSG Audit Viewer */}
                  {critique && (
                    <BFSGAuditViewer data={critique} />
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-white">{structure?.nodes?.length || 0}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Original Seiten</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-white">{migrationPlan.sitemap?.length || 0}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Neue Struktur</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-emerald-400">
                        {migrationPlan.page_mapping?.filter((m: any) => m.action === 'keep').length || 0}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Beibehalten</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                      <div className="text-2xl font-bold text-amber-400">
                        {migrationPlan.page_mapping?.filter((m: any) => m.action === 'merge' || m.action === 'redirect').length || 0}
                      </div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Geändert</div>
                    </div>
                  </div>

                  {/* Rationale */}
                  {migrationPlan.rationale && (
                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                      <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Migration Strategie</h4>
                      <p className="text-sm text-gray-300 leading-relaxed">{migrationPlan.rationale}</p>
                    </div>
                  )}
                </div>
              )}

              {/* COMPONENTS TAB */}
              {blueprintTab === 'components' && (
                <div className="h-[600px] overflow-y-auto custom-scrollbar animate-in fade-in pr-2">
                  <ComponentSpecViewer spec={componentSpec} isLoading={isProcessing} />
                </div>
              )}

              {/* MAPPING TAB */}
              {blueprintTab === 'mapping' && (
                <div className="animate-in fade-in h-[800px]">
                  {((migrationPlan.page_mapping?.length ?? 0) > 0 || (migrationPlan.pattern_mapping?.length ?? 0) > 0 || mappingSources.length > 0) ? (
                    <DualPanelMapper
                      sources={mappingSources}
                      initialTargets={mappingTargets}

                      onSave={(targets) => {
                        // Expansion Logic: Convert Targets back to full Page mapping
                        // We preserve the layout entries but allow them to be updated if modified in the mapper
                        const newMapping: any[] = [];
                        const userTargets = new Set(targets.map(t => t.id));

                        // Add existing layout entries ONLY if they weren't in the mapper (backup)
                        // but usually they ARE in the mapper now.

                        targets.forEach(t => {
                          t.sourceIds.forEach((sId: string) => {
                            // Is it a cluster?
                            const cluster = migrationPlan.clusters?.find((c: any) => c.pattern === sId);

                            if (cluster) {
                              // EXPAND CLUSTER
                              cluster.instances.forEach((inst: any) => {
                                newMapping.push({
                                  old_url: inst.url,
                                  new_path: t.path,
                                  action: t.action,
                                  type: t.type,
                                  reason: `Part of cluster ${cluster.pattern}`,
                                  description: t.description,
                                  content_goals: t.content_goals
                                });
                              });
                            } else if (sId.startsWith('source-raw-')) {
                              const url = sId.substring(11);
                              newMapping.push({
                                old_url: url,
                                new_path: t.path,
                                action: t.action,
                                type: t.type,
                                reason: 'Manually mapped discovered page',
                                ...(t.description ? { description: t.description, content_goals: t.content_goals } : {})
                              });
                            } else if (sId.startsWith('source-')) {
                              // Single Page
                              const idx = parseInt(sId.substring(7));
                              const original = migrationPlan.page_mapping[idx];
                              if (original) {
                                newMapping.push({
                                  ...original,
                                  new_path: t.path,
                                  action: t.action,
                                  type: t.type,
                                  ...(t.description ? { description: t.description, content_goals: t.content_goals } : {})
                                });
                              }
                            }
                          });
                        });

                        // Also preserve unmapped pages? 
                        // Current logic: If a source is NOT in any target, it's effectively deleted/ignored.
                        // Ideally we should warn or auto-add 'delete' targets for unused sources, but users can drag them to delete.

                        setMigrationPlan((prev: any) => ({ ...prev, page_mapping: newMapping }));
                      }}
                      onGenerateSpecs={handleGenerateSpecs}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Keine Seitenübertragung verfügbar
                    </div>
                  )}
                </div>
              )}


            </div>
          </div>
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

              // Merge specs into migrationPlan
              const updatedMapping = migrationPlan.page_mapping.map((m: any) => {
                const target = pageSpecs.find(t => t.path === (m.new_path || m.old_url));
                if (target) {
                  return {
                    ...m,
                    description: target.description,
                    content_goals: target.content_goals,
                    sections: target.sections
                  };
                }
                return m;
              });

              setMigrationPlan({
                ...migrationPlan,
                page_mapping: updatedMapping
              });
              toast.success("Content Strategy Approved!");
              setView('design_studio');
            }}
            sessionId={currentSessionId || undefined}
            allImages={structure?.nodes?.flatMap(n => (n.content?.images || []).map((img: any) => ({
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
                  ?.filter((l: any) => l.isInternal || l.text)
                  ?.filter((l: any) => l.text && l.text.length < 30)
                  ?.slice(0, 10)
                  ?.map((l: any) => ({ text: l.text, href: l.href })),
                // Context-Aware Image Selection based on componentSpec
                images: (() => {
                  const allImages: any[] = [];
                  const seenSrcs = new Set<string>();
                  structure?.nodes?.forEach((node: any) => {
                    node.content?.images?.forEach((img: any) => {
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
                  const { selectImagesForMockup } = require('@/lib/utils/image-selection');

                  // Context-Awareness
                  const homePath = structure.nodes[0] ? new URL(structure.nodes[0].url).pathname : '/';
                  const homeSpec = pageSpecs?.find((p: any) => p.path === homePath || p.path === '/' || p.path === '/home');
                  const prioritizedPaths = homeSpec?.dependencies || [];

                  const { selectedImages } = selectImagesForMockup(allImages, componentSpec, prioritizedPaths);
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
                  imageComponentSummary: structure.nodes[0].meta?.imageComponentSummary?.map((s: any) =>
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
                // Blueprint analysis data for smart optimization
                plannedContent: (() => {
                  const homePath = structure.nodes[0] ? new URL(structure.nodes[0].url).pathname : '/';
                  const match = pageSpecs?.find((p: any) => p.path === homePath || p.path === '/' || p.path === '/home');
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
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-4">
            <PlanViewer spec={finalOutput.spec} plan={finalOutput.implPlan} />
            <div className="mt-8 flex flex-col items-center gap-4 pb-12">
              {contentOptProgress && (
                <div className="text-sm text-gray-400 animate-pulse">
                  Optimizing content: {contentOptProgress.current}/{contentOptProgress.total} pages...
                </div>
              )}
              <Button
                onClick={handleZipDownload}
                disabled={isProcessing || !pageSpecs || pageSpecs.length === 0}
                className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Project ZIP ({pageSpecs?.length || 0} pages)
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* AI Classification Approval Modal */}
      <AIClassificationModal
        isOpen={aiClassificationModal.isOpen}
        onClose={() => setAIClassificationModal(prev => ({ ...prev, isOpen: false }))}
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
              if (aiClassificationModal.onComplete) {
                aiClassificationModal.onComplete(result.data.classifications);
              }
            }
          } catch (error: any) {
            addLog(`AI classification failed: ${error.message}`, 'error');
            toast.error('AI classification failed');
          } finally {
            setIsClassifying(false);
            setAIClassificationModal(prev => ({ ...prev, isOpen: false }));
          }
        }}
        onSkip={() => {
          addLog('Skipped AI image classification', 'info');
          toast.info('Proceeding without AI classification');
          setAIClassificationModal(prev => ({ ...prev, isOpen: false }));
        }}
        imageCount={aiClassificationModal.imageCount}
        tokenEstimate={aiClassificationModal.tokenEstimate}
        estimatedCost={aiClassificationModal.estimatedCost}
        isClassifying={isClassifying}
      />
    </main >
  );
}
