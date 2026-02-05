import { TargetSlot, SiteStructure, MigrationPlan } from '@/types';

/**
 * Service for enriching target slots with source details and content
 * Separates data transformation logic from UI components
 */

export interface EnrichedTarget extends TargetSlot {
  sourceDetails?: Array<{
    url: string;
    title?: string;
    content: string;
    blocks?: any[];
  }>;
}

/**
 * Enriches a layout target with global branding and navigation context
 */
export function enrichLayoutTarget(
  target: TargetSlot,
  structure: SiteStructure | null,
  allTargets: TargetSlot[]
): EnrichedTarget {
  const rawLogos = structure?.nodes?.flatMap(n =>
    n.content?.images?.filter(img => img.isLogo || img.role === 'logo') || []
  ) || [];

  const uniqueLogosMap = new Map<string, any>();
  rawLogos.forEach(img => {
    if (!img.src) return;
    const srcLower = img.src.toLowerCase();

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

    if (isIcon && !img.isLogo) return;

    if (!uniqueLogosMap.has(img.src)) {
      uniqueLogosMap.set(img.src, img);
    }
  });

  const dedupedLogos = Array.from(uniqueLogosMap.values())
    .sort((a, b) => (b.logoProb || 0) - (a.logoProb || 0));

  const headerBlocks = structure?.nodes?.flatMap(n =>
    n.content?.semanticBlocks?.filter((b: any) => b.type === 'header' || b.type === 'nav') || []
  ) || [];

  const footerBlocks = structure?.nodes?.flatMap(n =>
    n.content?.semanticBlocks?.filter((b: any) => b.type === 'footer') || []
  ) || [];

  return {
    ...target,
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
${allTargets.filter(t => t.type !== 'layout').map(t => `- PATH: ${t.path} | LABEL: ${t.label}`).join('\n')}

## SITE METADATA:
Title: ${structure?.nodes?.[0]?.meta?.title || 'Unknown'}
Sample Description: ${structure?.nodes?.[0]?.meta?.description || 'None'}`,
      blocks: [...headerBlocks, ...footerBlocks]
    }]
  };
}

/**
 * Resolves source IDs to actual URLs with reasons
 */
export function resolveSourceUrls(
  sourceIds: string[],
  migrationPlan: MigrationPlan | null
): Array<{ url: string; reason: string }> {
  return sourceIds.flatMap((sId: string) => {
    if (sId.startsWith('source-raw-')) {
      const url = sId.substring(11);
      return [{ url, reason: 'Raw discovered page' }];
    } else if (sId.startsWith('source-')) {
      const idx = parseInt(sId.substring(7));
      const m = migrationPlan?.page_mapping[idx];
      return m ? [{ url: m.old_url, reason: m.reason || 'Mapped page' }] : [];
    } else {
      const cluster = migrationPlan?.clusters?.find((c: any) => c.id === sId || c.pattern === sId);
      return cluster ? cluster.instances.map((inst: any) => ({
        url: inst.url,
        reason: `Member of cluster ${cluster.pattern}`
      })) : [];
    }
  });
}

/**
 * Enriches a page target with source content and context
 */
export function enrichPageTarget(
  target: TargetSlot,
  structure: SiteStructure | null,
  migrationPlan: MigrationPlan | null
): EnrichedTarget {
  const urlList = resolveSourceUrls(target.sourceIds, migrationPlan);

  return {
    ...target,
    sourceDetails: urlList.map(s => {
      const node = structure?.nodes.find((n: any) => n.url === s.url);
      if (!node) return null;

      const rawText = node.content?.rawText || '';
      return {
        url: s.url,
        title: node.meta?.title || s.url,
        content: `## SOURCE REASON:
${s.reason}

## PAGE CONTENT (First 3000 chars):
${rawText.substring(0, 3000)}

## PAGE IMAGES (ALL):
${(node.content?.images || []).map((img: any) =>
  `- SRC: ${img.src} | ALT: ${img.alt || 'None'} | ROLE: ${img.role || 'unknown'}`
).join('\n')}`,
        rawText
      };
    }).filter(Boolean) as any[]
  };
}

/**
 * Main enrichment function - routes to appropriate enricher
 */
export function enrichTarget(
  target: TargetSlot,
  structure: SiteStructure | null,
  migrationPlan: MigrationPlan | null,
  allTargets: TargetSlot[]
): EnrichedTarget {
  if (target.type === 'layout' || target.path === 'layout') {
    return enrichLayoutTarget(target, structure, allTargets);
  }
  return enrichPageTarget(target, structure, migrationPlan);
}
