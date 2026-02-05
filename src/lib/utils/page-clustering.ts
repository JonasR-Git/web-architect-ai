/**
 * Page Clustering Utilities
 *
 * Manages which pages should be clustered automatically vs kept standalone.
 * Pages marked as standalone will NOT be merged with similar pages.
 */

import { SiteNode } from '@/types';

export interface ClusterExclusion {
  url: string;
  reason?: string; // Why was this page excluded from clustering?
  timestamp: number;
}

export interface ClusteringOptions {
  excludedUrls?: string[]; // URLs to exclude from clustering
  respectManualFlags?: boolean; // Respect SiteNode.excludeFromClustering flag
  minSimilarityThreshold?: number; // 0-100, pages below this won't cluster
}

/**
 * Mark a page as standalone (exclude from automatic clustering)
 */
export function markPageAsStandalone(
  nodes: SiteNode[],
  pageUrl: string,
  reason?: string
): SiteNode[] {
  return nodes.map(node => {
    if (normalizeUrl(node.url) === normalizeUrl(pageUrl)) {
      return {
        ...node,
        excludeFromClustering: true,
        clusterExclusionReason: reason || 'Manually marked as standalone',
        clusterExclusionTimestamp: Date.now()
      };
    }
    return node;
  });
}

/**
 * Remove standalone flag from a page (allow clustering again)
 */
export function allowPageClustering(
  nodes: SiteNode[],
  pageUrl: string
): SiteNode[] {
  return nodes.map(node => {
    if (normalizeUrl(node.url) === normalizeUrl(pageUrl)) {
      const updated = { ...node };
      delete updated.excludeFromClustering;
      delete updated.clusterExclusionReason;
      delete updated.clusterExclusionTimestamp;
      return updated;
    }
    return node;
  });
}

/**
 * Get all pages that are marked as standalone
 */
export function getStandalonePages(nodes: SiteNode[]): SiteNode[] {
  return nodes.filter(node => node.excludeFromClustering === true);
}

/**
 * Filter out pages that should be excluded from clustering
 */
export function filterClusterablePages(
  nodes: SiteNode[],
  options?: ClusteringOptions
): { clusterable: SiteNode[]; excluded: SiteNode[] } {
  const clusterable: SiteNode[] = [];
  const excluded: SiteNode[] = [];

  const excludedUrls = new Set(
    (options?.excludedUrls || []).map(normalizeUrl)
  );

  for (const node of nodes) {
    const normalized = normalizeUrl(node.url);

    // Check if manually flagged for exclusion
    if (options?.respectManualFlags && node.excludeFromClustering) {
      excluded.push(node);
      continue;
    }

    // Check if in excluded URLs list
    if (excludedUrls.has(normalized)) {
      excluded.push(node);
      continue;
    }

    // Otherwise, it's clusterable
    clusterable.push(node);
  }

  return { clusterable, excluded };
}

/**
 * Bulk mark multiple pages as standalone
 */
export function markPagesAsStandalone(
  nodes: SiteNode[],
  pageUrls: string[],
  reason?: string
): SiteNode[] {
  const urlSet = new Set(pageUrls.map(normalizeUrl));

  return nodes.map(node => {
    if (urlSet.has(normalizeUrl(node.url))) {
      return {
        ...node,
        excludeFromClustering: true,
        clusterExclusionReason: reason || 'Manually marked as standalone',
        clusterExclusionTimestamp: Date.now()
      };
    }
    return node;
  });
}

/**
 * Load exclusions from migration-mapping.json
 */
export function loadStandaloneFromMigrationMapping(
  nodes: SiteNode[],
  mappingPath: string = '/migration-mapping.json'
): SiteNode[] {
  try {
    // In browser environment, would need to fetch this
    // For now, this is a placeholder for server-side usage
    console.warn('loadStandaloneFromMigrationMapping: Not implemented for client-side');
    return nodes;
  } catch (error) {
    console.error('Failed to load migration mapping:', error);
    return nodes;
  }
}

/**
 * Apply standalone rules from migration mapping data
 */
export function applyMigrationMappingRules(
  nodes: SiteNode[],
  mapping: Array<{
    old_url: string;
    standalone?: boolean;
    excludeFromClustering?: boolean;
    description?: string;
  }>
): SiteNode[] {
  const standaloneUrls = new Map<string, string>(); // url -> reason

  for (const entry of mapping) {
    if (entry.standalone || entry.excludeFromClustering) {
      standaloneUrls.set(
        normalizeUrl(entry.old_url),
        entry.description || 'Marked as standalone in migration mapping'
      );
    }
  }

  return nodes.map(node => {
    const normalized = normalizeUrl(node.url);
    if (standaloneUrls.has(normalized)) {
      return {
        ...node,
        excludeFromClustering: true,
        clusterExclusionReason: standaloneUrls.get(normalized),
        clusterExclusionTimestamp: Date.now()
      };
    }
    return node;
  });
}

/**
 * Export standalone pages to migration mapping format
 */
export function exportStandalonePagesToMappingFormat(
  nodes: SiteNode[]
): Array<{
  old_url: string;
  new_path: string;
  action: 'keep';
  type: 'page';
  standalone: true;
  description?: string;
}> {
  const standalonePages = getStandalonePages(nodes);

  return standalonePages.map(node => ({
    old_url: node.url,
    new_path: node.url, // Keep same path by default
    action: 'keep' as const,
    type: 'page' as const,
    standalone: true,
    description: node.clusterExclusionReason
  }));
}

/**
 * Get clustering statistics
 */
export function getClusteringStats(nodes: SiteNode[]): {
  total: number;
  clusterable: number;
  excluded: number;
  exclusionReasons: Record<string, number>;
} {
  const excluded = getStandalonePages(nodes);
  const reasonCounts: Record<string, number> = {};

  for (const node of excluded) {
    const reason = node.clusterExclusionReason || 'Unknown';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  }

  return {
    total: nodes.length,
    clusterable: nodes.length - excluded.length,
    excluded: excluded.length,
    exclusionReasons: reasonCounts
  };
}

/**
 * Normalize URL for comparison (lowercase, no trailing slash, no hash/query)
 */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url, 'http://dummy.com');
    u.hash = '';
    u.search = '';
    let path = u.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return (u.origin === 'http://dummy.com' ? '' : u.origin) + path.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Check if a page should be excluded from clustering
 */
export function shouldExcludeFromClustering(
  node: SiteNode,
  options?: ClusteringOptions
): boolean {
  // Check manual flag
  if (options?.respectManualFlags && node.excludeFromClustering) {
    return true;
  }

  // Check excluded URLs list
  if (options?.excludedUrls) {
    const normalized = normalizeUrl(node.url);
    if (options.excludedUrls.some(url => normalizeUrl(url) === normalized)) {
      return true;
    }
  }

  return false;
}
