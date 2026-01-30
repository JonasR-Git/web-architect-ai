import { SiteStructure, SiteNode, ClusterForComparison } from '@/types';
import { ClusterComparator } from '@/modules/analysis/services/cluster-comparator';
import { LanguageDetector } from '@/modules/analysis/services/language-detector';

/**
 * Auto-Clustering Utility
 *
 * Detects URL patterns and groups structurally similar pages into clusters.
 *
 * Algorithm (3 phases):
 *
 * Phase 1 — SIBLING DETECTION
 *   Group pages by their language-agnostic parent path.
 *   If a parent has >= minClusterSize children → /parent/[slug] cluster.
 *   This is the primary detection mechanism and catches ALL slug formats
 *   (hyphenated, single-word, numeric, etc.)
 *
 * Phase 2 — VALIDATION
 *   Remove weak clusters: check parent-path cohesion & content variance.
 *   Flag outliers (pages whose word count is >5x the cluster median).
 *
 * Phase 3 — CONFLICT RESOLUTION (optional, with AI)
 *   Merge sibling patterns that represent the same content type.
 *   E.g. /blog/tag/[slug] + /blog/category/[slug] → one taxonomy cluster.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
    /** Clusters with >= this many pages skip validation */
    LARGE_CLUSTER_THRESHOLD: 10,
    /** Max allowed parent-path mismatch ratio before a cluster is rejected */
    MAX_MISMATCH_RATIO: 0.2,
    /** AI merge confidence threshold (0-100) */
    MIN_MERGE_CONFIDENCE: 70,
    /** If a page's word count differs from cluster median by this factor, flag it */
    OUTLIER_WORD_COUNT_FACTOR: 8,
    /** Minimum depth (segments) for a page to be eligible for auto-clustering.
     *  depth=1 means top-level pages like /about or /contact are never auto-clustered. */
    MIN_DEPTH_FOR_CLUSTERING: 2,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DetectedPattern {
    pattern: string;
    pages: SiteNode[];
    /** Pages whose word count deviates significantly from the cluster median */
    outlierUrls?: string[];
}

// ---------------------------------------------------------------------------
// Phase 1 — Pattern Detection
// ---------------------------------------------------------------------------

/**
 * Detects URL patterns using sibling-aware grouping.
 *
 * Language-aware: /de/blog/post + /en/blog/post both map to /blog/[slug].
 *
 * @param nodes — All crawled pages
 * @param minClusterSize — Minimum siblings needed to form a cluster (default: 2)
 */
export function detectPatterns(
    nodes: SiteNode[],
    minClusterSize: number = 2
): DetectedPattern[] {
    // Map every node to its language-agnostic concept path
    const nodeInfo = new Map<string, { conceptPath: string; segments: string[] }>();

    for (const node of nodes) {
        try {
            const conceptPath = LanguageDetector.extractConceptPath(node.url);
            const segments = conceptPath.split('/').filter(Boolean);
            nodeInfo.set(node.url, { conceptPath, segments });
        } catch {
            // Invalid URL — skip
        }
    }

    // Group by parent path (only pages with depth >= MIN_DEPTH_FOR_CLUSTERING)
    const parentGroups = new Map<string, SiteNode[]>();

    for (const node of nodes) {
        const info = nodeInfo.get(node.url);
        if (!info || info.segments.length < CONFIG.MIN_DEPTH_FOR_CLUSTERING) continue;

        const parentPath = '/' + info.segments.slice(0, -1).join('/');

        if (!parentGroups.has(parentPath)) {
            parentGroups.set(parentPath, []);
        }
        parentGroups.get(parentPath)!.push(node);
    }

    // Convert qualifying parent groups to patterns
    const patterns: DetectedPattern[] = [];

    for (const [parentPath, children] of parentGroups) {
        if (children.length >= minClusterSize) {
            patterns.push({
                pattern: parentPath + '/[slug]',
                pages: children,
            });
        }
    }

    // Sort by size (largest first)
    patterns.sort((a, b) => b.pages.length - a.pages.length);

    return patterns;
}

// ---------------------------------------------------------------------------
// Phase 2 — Validation
// ---------------------------------------------------------------------------

/**
 * Validates clusters by checking:
 * 1. Parent-path cohesion (all URLs must share the expected parent)
 * 2. Content variance (flag outliers with extremely different word count)
 *
 * Large clusters (>= LARGE_CLUSTER_THRESHOLD) always pass.
 */
export function validatePatterns(patterns: DetectedPattern[]): DetectedPattern[] {
    return patterns.filter(p => {
        // Large clusters are always valid
        if (p.pages.length >= CONFIG.LARGE_CLUSTER_THRESHOLD) {
            p.outlierUrls = detectOutliers(p.pages);
            return true;
        }

        // Check parent-path cohesion
        const expectedParent = p.pattern.replace(/\/\[slug\]$/, '');
        let mismatchCount = 0;

        for (const node of p.pages) {
            try {
                const conceptPath = LanguageDetector.extractConceptPath(node.url);
                const segments = conceptPath.split('/').filter(Boolean);
                const parentPath = '/' + segments.slice(0, -1).join('/');
                if (parentPath !== expectedParent) mismatchCount++;
            } catch {
                mismatchCount++;
            }
        }

        if (mismatchCount / p.pages.length > CONFIG.MAX_MISMATCH_RATIO) {
            return false;
        }

        // Detect outliers (informational, doesn't reject the cluster)
        p.outlierUrls = detectOutliers(p.pages);

        return true;
    });
}

/**
 * Finds pages in a cluster whose word count deviates significantly from the median.
 * These are flagged but NOT removed — the AI can decide what to do with them.
 */
function detectOutliers(pages: SiteNode[]): string[] {
    if (pages.length < 3) return [];

    const wordCounts = pages
        .map(p => p.content?.wordCount || 0)
        .sort((a, b) => a - b);

    const median = wordCounts[Math.floor(wordCounts.length / 2)];
    if (median === 0) return [];

    return pages
        .filter(p => {
            const wc = p.content?.wordCount || 0;
            const ratio = wc > median ? wc / median : median / Math.max(wc, 1);
            return ratio > CONFIG.OUTLIER_WORD_COUNT_FACTOR;
        })
        .map(p => p.url);
}

// ---------------------------------------------------------------------------
// Phase 3 — Conflict Resolution (AI-assisted merge)
// ---------------------------------------------------------------------------

/**
 * Merges sibling patterns that represent the same content type.
 *
 * Example: /blog/tag/[slug] + /blog/category/[slug]
 * → If AI says they're the same type → merge into one cluster.
 *
 * Without an AI service, patterns are kept as-is.
 */
export async function mergeSimilarPatterns(
    patterns: DetectedPattern[],
    aiService?: any
): Promise<DetectedPattern[]> {
    if (!aiService) return patterns;

    const clusters: ClusterForComparison[] = patterns.map(p => ({
        pattern: p.pattern,
        instances: p.pages,
        sampleProfiles: ClusterComparator.extractContentProfiles(p.pages, 5)
    }));

    const conflicts = ClusterComparator.findConflictingClusters(clusters);
    if (conflicts.length === 0) return patterns;

    const comparisonResults = await ClusterComparator.batchCompare(conflicts, aiService, 3);

    const mergedPatterns = [...patterns];
    const toRemove = new Set<string>();

    for (const conflict of conflicts) {
        const key = [conflict.clusterA.pattern, conflict.clusterB.pattern].sort().join('|||');
        const result = comparisonResults.get(key);

        if (result?.recommendation === 'MERGE' && result.confidence > CONFIG.MIN_MERGE_CONFIDENCE) {
            const patternA = mergedPatterns.find(p => p.pattern === conflict.clusterA.pattern);
            const patternB = mergedPatterns.find(p => p.pattern === conflict.clusterB.pattern);

            if (patternA && patternB && !toRemove.has(conflict.clusterB.pattern)) {
                patternA.pages.push(...patternB.pages);
                toRemove.add(conflict.clusterB.pattern);
            }
        }
    }

    return mergedPatterns.filter(p => !toRemove.has(p.pattern));
}

// ---------------------------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------------------------

/**
 * Full auto-clustering pipeline: detect → validate → merge.
 *
 * @param structure — Crawled site structure
 * @param aiService — Optional AI service for conflict resolution
 * @param onProgress — Optional progress callback for UI updates
 */
export async function performAutoClustering(
    structure: SiteStructure,
    aiService?: any,
    onProgress?: (step: string, progress: number) => void
): Promise<DetectedPattern[]> {
    onProgress?.('Detecting patterns', 0);
    const detected = detectPatterns(structure.nodes, 2);

    onProgress?.('Validating patterns', 33);
    const validated = validatePatterns(detected);

    onProgress?.('Merging similar patterns', 66);
    const merged = await mergeSimilarPatterns(validated, aiService);

    onProgress?.('Completed', 100);
    return merged;
}
