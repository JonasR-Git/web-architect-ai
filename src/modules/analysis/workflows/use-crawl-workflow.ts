import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { SiteStructure, CrawlStats } from '@/types';
import { groupSimilarPages } from '@/modules/core/utils/grouping';

export interface CrawlWorkflowDependencies {
  url: string;
  setStructure: (structure: SiteStructure | null) => void;
  setSemanticMerges: (merges: any) => void;
  setDesignConfig: (config: any) => void;
  setView: (view: any) => void;
  setIsProcessing: (processing: boolean) => void;
  setCurrentStep: (step: string) => void;
  addLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error', meta?: any) => void;
  clearLogs: () => void;
}

export interface CrawlWorkflowState {
  crawlStats: CrawlStats | null;
  startCrawl: () => Promise<void>;
}

/**
 * Hook for orchestrating the crawl workflow
 * Handles EventSource connection, real-time progress updates, design detection
 */
export function useCrawlWorkflow(deps: CrawlWorkflowDependencies): CrawlWorkflowState {
  const [crawlStats, setCrawlStats] = useState<CrawlStats | null>(null);

  const {
    url,
    setStructure,
    setSemanticMerges,
    setDesignConfig,
    setView,
    setIsProcessing,
    setCurrentStep,
    addLog,
    clearLogs,
  } = deps;

  const startCrawl = useCallback(async () => {
    if (!url) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsProcessing(true);
    clearLogs();
    setCurrentStep('Crawling site structure...');
    setCrawlStats({
      processed: 0,
      found: 0,
      currentUrl: 'Initializing...',
      queueLength: 0,
      activeWorkers: 0,
    });
    setStructure(null);

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
            activeWorkers: d.activeWorkers,
          });
        });

        es.addEventListener('complete', (e: any) => {
          const d = JSON.parse(e.data);
          const pageCount = d.nodes ? d.nodes.length : 0;
          const root = d.nodes && d.nodes.length > 0 ? d.nodes[0] : {};
          console.log(
            `--- CRAWL COMPLETE: ${pageCount} pages found. Title: ${
              root?.meta?.title || 'Unknown'
            } ---`
          );
          es.close();
          resolve(d);
        });

        es.addEventListener('error', (e: any) => {
          es.close();
          const d = e.data ? JSON.parse(e.data) : { message: 'Connection lost' };
          reject(new Error(d.message));
        });
      });

      setStructure(structure);
      if ((structure as any).semanticMerges) {
        setSemanticMerges((structure as any).semanticMerges);
      }
      setCrawlStats(null);
      addLog(`CRAWLER: Indexing complete. Found ${structure.nodes.length} pages.`, 'success');
      toast.success('Crawl Complete');

      // --- DESIGN DETECTIVE: Auto-populate from Signals ---
      if (structure.nodes.length > 0 && structure.nodes[0].meta?.designSignals) {
        const d = structure.nodes[0].meta.designSignals;

        setDesignConfig((prev: any) => {
          let styleId = prev.styleIds[0];
          if (d.hasGlass) styleId = 'glassmorphism';
          else if (d.hasHardShadows) styleId = 'brutalist';

          let roundness: any = 'default';
          if (d.roundingMode === 'sharp') roundness = 'sharp';
          else if (d.roundingMode === 'full') roundness = 'full';
          else if (d.roundingMode === 'soft') roundness = 'soft';

          return {
            ...prev,
            styleIds: [styleId as any],
            roundness,
            typography:
              d.typography === 'serif' ? 'classic' : d.typography === 'mono' ? 'tech' : 'modern',
            dna: {
              spacing: d.spacing,
              shadows: d.hasHardShadows ? 'hard' : 'soft',
              borderRadius: d.roundingMode,
              typographyScale: 'ratio-1.25',
              glassmorphism: d.hasGlass,
              microInteractions: d.animationLevel === 'high' ? ['hover-lift'] : [],
            },
          };
        });
        addLog(
          `🧬 DESIGN DNA: Auto-detected ${
            d.hasGlass ? 'Glassmorphism' : d.hasHardShadows ? 'Brutalism' : 'Standard'
          } style.`,
          'success'
        );
      }

      // Log pattern discovery summary
      const grouped = groupSimilarPages(structure, 2);
      addLog(
        `✨ PATTERN DISCOVERY: Found ${grouped.stats.uniquePatterns} unique page archetypes across ${structure.nodes.length} pages.`,
        'info'
      );
      if (grouped.groups.length > 0) {
        const topPatterns = grouped.groups
          .slice(0, 3)
          .map((g) => `"${g.pattern}" (${g.totalCount} pages)`)
          .join(', ');
        addLog(`💡 Major categories detected: ${topPatterns}...`, 'info');
      }

      // Move to next step
      setView('crawl_result');
    } catch (e: any) {
      addLog(`FATAL: ${e.message}`, 'error');
      toast.error('Crawl failed');
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  }, [
    url,
    setStructure,
    setSemanticMerges,
    setDesignConfig,
    setView,
    setIsProcessing,
    setCurrentStep,
    addLog,
    clearLogs,
  ]);

  return {
    crawlStats,
    startCrawl,
  };
}
