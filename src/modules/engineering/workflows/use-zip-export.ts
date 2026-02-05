import { useCallback } from 'react';
import { toast } from 'sonner';
import { FinalOutput, TargetSlot, MigrationPlan, DesignConfig } from '@/types';
import {
  generateProjectZip,
  downloadBlob,
  pageDataToMarkdown,
  ContentFile,
  OptimizedPageData,
} from '@/lib/zip';

export interface ZipExportDependencies {
  finalOutput: FinalOutput | null;
  pageSpecs: TargetSlot[] | null;
  downloadedAssets: any;
  designConfig: DesignConfig;
  migrationPlan: MigrationPlan | null;
  addLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error', meta?: any) => void;
}

export interface ZipExportState {
  handleZipDownload: () => Promise<void>;
}

/**
 * Helper function to generate implementation plan markdown
 */
function generateImplementationPlanMarkdown(implPlan: any): string {
  // This is a simplified version - you may want to extract this from PlanViewer
  if (typeof implPlan === 'string') return implPlan;

  let markdown = '# Implementation Plan\n\n';

  if (implPlan.phases) {
    markdown += '## Phases\n\n';
    implPlan.phases.forEach((phase: any, i: number) => {
      markdown += `### ${i + 1}. ${phase.name}\n\n`;
      markdown += `${phase.description}\n\n`;
      if (phase.tasks && phase.tasks.length > 0) {
        markdown += '**Tasks:**\n';
        phase.tasks.forEach((task: string) => {
          markdown += `- ${task}\n`;
        });
        markdown += '\n';
      }
    });
  }

  if (implPlan.dependencies && implPlan.dependencies.length > 0) {
    markdown += '## Dependencies\n\n';
    implPlan.dependencies.forEach((dep: string) => {
      markdown += `- ${dep}\n`;
    });
    markdown += '\n';
  }

  return markdown;
}

/**
 * Hook for orchestrating ZIP export
 * Generates project ZIP with plan, content files, and assets
 */
export function useZipExport(deps: ZipExportDependencies): ZipExportState {
  const { finalOutput, pageSpecs, downloadedAssets, designConfig, migrationPlan, addLog } = deps;

  const handleZipDownload = useCallback(async () => {
    if (!finalOutput?.implPlan) {
      toast.error('No implementation plan available');
      return;
    }

    addLog('EXPORT: Generating ZIP file...');
    toast.loading('Generating ZIP...', { id: 'zip' });

    try {
      // Generate Implementation Plan Markdown
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
          ((spec as any).logos || []).forEach((img: any) => usedImageUrls.add(img.src));
        });

        pageSpecs.forEach((spec) => {
          const path = spec.path;
          const optimizedData: OptimizedPageData = {
            page_title: spec.path,
            meta_description: spec.description || '',
            h1: spec.sections?.find((s) => s.type === 'hero')?.headline || '',
            url: (spec as any).sourceDetails?.[0]?.url,
            language: (spec as any).language || (spec as any).sourceDetails?.[0]?.meta?.lang,
            canonical: (spec as any).canonical,
            hreflangs: (spec as any).hreflangs,
            keywords: [],
            sections: (spec.sections || []).map((s, idx) => ({
              id: `section-${idx}`,
              component: s.type,
              heading: (s as any).headline || (s as any).title || '',
              content: s.content || '',
              image_suggestions: (s.images || []).map((img: any) => ({
                src: img.src,
                status: img.status,
                localPath: downloadedAssets?.map[img.src],
              })),
            })),
          };

          contentFiles.push({
            path,
            content: pageDataToMarkdown(path, optimizedData),
          });
        });
      }

      // Filter assets to only include used ones
      const filteredImages: Record<string, string> = {};
      const filteredMap: Record<string, string> = {};

      if (downloadedAssets?.map) {
        Object.entries(downloadedAssets.map).forEach(([url, filename]) => {
          if (usedImageUrls.has(url)) {
            filteredMap[url] = filename as string;
            if (downloadedAssets.images[filename as string]) {
              filteredImages[filename as string] = downloadedAssets.images[filename as string];
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

      toast.success('ZIP downloaded!', { id: 'zip' });
      addLog('EXPORT: ZIP file generated successfully.', 'success');
    } catch (e: any) {
      toast.error('ZIP generation failed', { id: 'zip' });
      addLog(`EXPORT ERROR: ${e.message}`, 'error');
    }
  }, [finalOutput, pageSpecs, downloadedAssets, designConfig, migrationPlan, addLog]);

  return {
    handleZipDownload,
  };
}
