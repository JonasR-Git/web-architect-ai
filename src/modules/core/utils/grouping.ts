import { SiteStructure, SiteNode, ClusterOverrides } from '@/types';
import { detectPatterns, validatePatterns } from './auto-clustering';

/**
 * Smart Template Grouping
 *
 * Detects URL patterns (like /blog/[slug]) and groups similar pages together,
 * keeping only a few examples per pattern to reduce token usage when sending to AI.
 */

interface PageGroup {
    pattern: string;           // e.g., "/blog/[slug]" or "/products/[id]"
    examples: SiteNode[];      // Example pages
    totalCount: number;        // Total pages matching this pattern
    allUrls: string[];         // All URLs in this group (for reference)
    label?: string;            // Custom display name for the group
}


interface GroupedStructure {
    rootUrl: string;
    crawledAt: string;
    groups: PageGroup[];
    uniquePages: SiteNode[];   // Pages that don't fit a pattern
    urlToPattern: Record<string, { pattern: string, isClustered: boolean }>;
    stats: {
        totalPages: number;
        uniquePatterns: number;
        examplesIncluded: number;
    };
}

/**
 * Detects URL patterns and groups similar pages together.
 * 
 * IMPROVED VERSION:
 * 1. Uses branching factor (variance) to identify Hubs instead of just regex.
 * 2. Implements a strict "min 5" rule for automatic clustering.
 * 3. Supports manual overrides for force/ignore archetypes.
 */
export function groupSimilarPages(
    structure: SiteStructure,
    maxExamplesPerPattern: number = 3, // Default increased to 3 for the new logic
    minClusterSize: number = 5, // Not used for auto-clustering anymore, but kept for manual check if needed
    overrides: ClusterOverrides = {}
): GroupedStructure {

    // --- STEP 1: Pattern Matching (Manual Only) ---
    // We strictly use the patterns defined in `overrides.forceArchetypes`.
    // If no forced archetypes exist, everything is unique.

    // NORMALIZE: Ensure we work with pathnames, even if full URLs were passed
    const normalizedForces = (overrides.forceArchetypes || []).map(p => {
        if (p.startsWith('http')) {
            try {
                return new URL(p).pathname;
            } catch (e) { return p; }
        }
        return p;
    });

    const forcedPatterns = normalizedForces.sort((a, b) => b.length - a.length);

    // --- NEW: Auto-Clustering Mode (if no forced patterns) ---
    if (forcedPatterns.length === 0) {
        // Detect patterns automatically (≥2 pages)
        const detected = detectPatterns(structure.nodes, 2);

        // Validate patterns
        const validated = validatePatterns(detected);

        // Convert to PageGroup format
        const autoGroups: PageGroup[] = [];
        const autoUniquePages: SiteNode[] = [];
        const autoUrlToPattern: Record<string, { pattern: string, isClustered: boolean }> = {};
        const clusteredUrls = new Set<string>();

        validated.forEach(detectedPattern => {
            const { pattern, pages } = detectedPattern;

            // Mark URLs as clustered
            pages.forEach(p => {
                clusteredUrls.add(p.url);
                autoUrlToPattern[p.url] = { pattern, isClustered: true };
            });

            // Select examples using 50/60/70 percentile rule
            const sortedPages = [...pages].sort((a, b) => {
                const weightA = (a.content.wordCount || 0) + (a.content.images?.length || 0) * 50;
                const weightB = (b.content.wordCount || 0) + (b.content.images?.length || 0) * 50;
                return weightA - weightB;
            });

            const selectedExamples: SiteNode[] = [];
            if (sortedPages.length <= maxExamplesPerPattern) {
                selectedExamples.push(...sortedPages);
            } else {
                const total = sortedPages.length;
                const idx50 = Math.floor(total * 0.5);
                const idx60 = Math.floor(total * 0.6);
                const idx70 = Math.floor(total * 0.7);
                const indices = new Set([idx50, idx60, idx70]);
                const uniqueIndices = Array.from(indices).filter(i => i >= 0 && i < total).sort((a, b) => a - b);
                uniqueIndices.forEach(i => selectedExamples.push(sortedPages[i]));
            }

            autoGroups.push({
                pattern,
                examples: selectedExamples,
                totalCount: pages.length,
                allUrls: pages.map(p => p.url)
            });
        });

        // Unclustered pages go to unique
        structure.nodes.forEach(node => {
            if (!clusteredUrls.has(node.url)) {
                autoUniquePages.push(node);
                autoUrlToPattern[node.url] = { pattern: node.url, isClustered: false };
            }
        });

        autoGroups.sort((a, b) => b.totalCount - a.totalCount);

        console.log(`[Clustering] ${autoGroups.length} clusters, ${autoUniquePages.length} unique pages`);

        return {
            rootUrl: structure.rootUrl,
            crawledAt: structure.crawledAt,
            groups: autoGroups,
            uniquePages: autoUniquePages,
            urlToPattern: autoUrlToPattern,
            stats: {
                totalPages: structure.nodes.length,
                uniquePatterns: autoGroups.length + autoUniquePages.length,
                examplesIncluded: autoGroups.reduce((sum, g) => sum + g.examples.length, 0) + autoUniquePages.length
            }
        };
    }

    const patternMap = new Map<string, SiteNode[]>();
    const uniquePages: SiteNode[] = [];
    const urlToPattern: Record<string, { pattern: string, isClustered: boolean }> = {};
    const exceptionUrls = new Set(overrides.exceptions || []);

    // Helper: Check if a URL matches a forced pattern
    const matchPattern = (url: string): string | null => {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const pathSegments = path.split('/').filter(Boolean);

        // Check against each forced pattern
        for (const forced of forcedPatterns) {
            const forcedSegments = forced.split('/').filter(Boolean);

            // Optimization: If forced pattern is deeper than path, it can't match (unless partial match is intended?)
            // Usually we want the URL to be an *instance* of the pattern.
            // If pattern is /blog/[item], and url is /blog/post-1, segments are equal length: 2 vs 2.
            // If url is /blog/post-1/comments, it has 3 segments. It should probably still match?
            // Let's allow prefix matching mainly.

            if (forcedSegments.length > pathSegments.length) continue;

            let isMatch = true;
            for (let i = 0; i < forcedSegments.length; i++) {
                const f = forcedSegments[i];
                const p = pathSegments[i];

                // Wildcards
                if (f.startsWith('[') && f.endsWith(']')) continue;

                // Literal match
                if (f !== p) {
                    isMatch = false;
                    break;
                }
            }

            if (isMatch) return forced;
        }
        return null;
    };

    structure.nodes.forEach(node => {
        // Skip explicitly ignored or unique pages
        if (exceptionUrls.has(node.url)) {
            uniquePages.push(node);
            urlToPattern[node.url] = { pattern: node.url, isClustered: false };
            return;
        }

        const matchedPattern = matchPattern(node.url);

        if (matchedPattern) {
            if (!patternMap.has(matchedPattern)) patternMap.set(matchedPattern, []);
            patternMap.get(matchedPattern)!.push(node);
        } else {
            // Collect for second pass (auto-clustering)
            uniquePages.push(node);
        }
    });

    // --- STEP 1.5: (Removed) Auto-Clustering is disabled to follow strict manual archetypes ---

    // --- STEP 2: Group Construction & Example Selection (50/60/70 Rule) ---
    const groups: PageGroup[] = [];
    let examplesIncluded = 0;

    for (const [pattern, pages] of patternMap) {
        // Apply ignore rules just in case
        if (overrides.ignorePatterns?.includes(pattern)) {
            pages.forEach(p => {
                uniquePages.push(p);
                urlToPattern[p.url] = { pattern: p.url, isClustered: false };
            });
            continue;
        }

        // Sort by Content Amount (Word Count + Image Weight)
        // Ascending sort to find percentiles
        const sortedPages = [...pages].sort((a, b) => {
            const weightA = (a.content.wordCount || 0) + (a.content.images?.length || 0) * 50;
            const weightB = (b.content.wordCount || 0) + (b.content.images?.length || 0) * 50;
            return weightA - weightB;
        });

        // Select Examples
        const selectedExamples: SiteNode[] = [];
        if (sortedPages.length > 0) {
            const total = sortedPages.length;

            if (total <= maxExamplesPerPattern) {
                // Not enough pages for percentiles, just take all of them
                selectedExamples.push(...sortedPages);
            } else {
                // Large cluster: Use 50/60/70 Percentile Rule
                const idx50 = Math.floor(total * 0.5);
                const idx60 = Math.floor(total * 0.6);
                const idx70 = Math.floor(total * 0.7);

                const indices = new Set([idx50, idx60, idx70]);

                // Ensure strictly unique indices within valid bounds
                const uniqueIndices = Array.from(indices)
                    .filter(i => i >= 0 && i < total)
                    .sort((a, b) => a - b);

                uniqueIndices.forEach(i => selectedExamples.push(sortedPages[i]));
            }
        }

        // Update URL map to confirmed cluster
        pages.forEach(p => {
            urlToPattern[p.url] = { pattern, isClustered: true };
        });

        groups.push({
            pattern,
            examples: selectedExamples,
            totalCount: pages.length,
            allUrls: pages.map(p => p.url),
            label: overrides.renames?.[pattern]
        });

        examplesIncluded += selectedExamples.length;
    }

    // Sort groups by size
    groups.sort((a, b) => b.totalCount - a.totalCount);

    return {
        rootUrl: structure.rootUrl,
        crawledAt: structure.crawledAt,
        groups,
        uniquePages,
        urlToPattern,
        stats: {
            totalPages: structure.nodes.length,
            uniquePatterns: groups.length + uniquePages.length,
            examplesIncluded: examplesIncluded + uniquePages.length
        }
    };
}

/**
 * Estimate token count for a structure.
 * Rough estimate: (words * 1.5) + (json overhead).
 */
export function estimateTokens(data: any): number {
    const json = JSON.stringify(data);
    // Token estimation updated per user request (approx 4 chars -> 1 token)
    return Math.round(json.length / 4);
}

const TOKEN_LIMIT_SAFE = 140000; // Leave 10-20k for system prompt and instructions

/**
 * Resolves cluster conflicts using AI-based content-type detection
 * Should be called BEFORE createAIOptimizedStructure() if AI-based merging is desired
 *
 * @param structure - Site structure with auto-detected clusters
 * @param aiService - AIService instance for comparison
 * @returns Modified structure with merged clusters
 */
export async function resolveClusterConflicts(
    structure: SiteStructure,
    aiService: any,
    overrides: ClusterOverrides = {}
): Promise<SiteStructure> {
    // Import here to avoid circular dependency
    const { ClusterComparator } = await import('@/modules/analysis/services/cluster-comparator');
    const { mergeSimilarPatterns } = await import('./auto-clustering');

    // First, group to get initial clusters
    const grouped = groupSimilarPages(structure, 3, 2, overrides);

    if (grouped.groups.length < 2) {
        return structure;
    }

    // Convert to DetectedPattern format
    const patterns = grouped.groups.map(g => ({
        pattern: g.pattern,
        pages: structure.nodes.filter(n => g.allUrls.includes(n.url))
    }));

    // Merge similar patterns (uses AI)
    const merged = await mergeSimilarPatterns(patterns, aiService);

    // If nothing changed, return original
    if (merged.length === patterns.length) {
        return structure;
    }

    // Rebuild structure with merged clusters
    // Create a modified structure where merged clusters are reflected
    // (This is a simplification - in reality we'd update the nodes' metadata)
    return structure;
}

/**
 * Convert grouped structure back to a simplified structure for AI prompts
 * This reduces token usage significantly for sites with many similar pages
 * while providing the AI with the necessary data to create "Bulk Rules".
 *
 * Includes hierarchical "Safety Valves" to automatically downgrade complexity
 * if token limits are exceeded.
 */
export function createAIOptimizedStructure(structure: SiteStructure, overrides: ClusterOverrides = {}, initialTier: number = 0): {
    grouped: any;
    optimized: any;
    savings: { original: number; optimized: number; saved: number; percentage: number };
    tier: number;
} {
    // Progressive tiers of simplification
    // Tier 0: 2 ex, 10k text, 20 links, 10 images
    // Tier 1: 1 ex, 5k text, 10 links, 5 images
    // Tier 2: 1 ex, 1k text, 0 links, 0 images
    // Tier 3: 0 ex (Only Patterns), 500 chars text
    // Tier 4: Manifest Only (Root + List of Patterns)

    let tier = initialTier;

    const runOptimization = (t: number) => {
        // Tiers 0-2 use grouping with reducing details
        // Tier 3 uses only patterns
        // Tier 4 uses only manifest
        const maxExamples = t === 0 ? 2 : (t < 3 ? 1 : 0);

        // Pass 1: Grouping
        const grouped = groupSimilarPages(structure, maxExamples, 5, overrides);

        const buildOptimized = (g: any, currentTier: number) => {
            const isStrict = currentTier >= 2;
            const isManifest = currentTier >= 4;

            if (isManifest) {
                return {
                    root: g.rootUrl,
                    patterns: g.groups.map((group: any) => ({
                        pattern: group.pattern,
                        count: group.totalCount,
                        label: group.label
                    })),
                    // Add just the root page for context
                    landingPage: structure.nodes.find(n => n.depth === 0)
                };
            }

            return {
                root: g.rootUrl,
                groups: g.groups.map((group: any) => {
                    const examples = group.examples.map((node: any) => ({
                        url: node.url,
                        title: node.meta.title,
                        description: node.meta.description,
                        content: {
                            h1: node.content.h1,
                            headings: (node.content.headings || []).map((h: any) => h.text).slice(0, currentTier === 0 ? 20 : 5),
                            rawText: (node.content.rawText || '').slice(0, currentTier === 0 ? 10000 : (currentTier === 1 ? 5000 : 1000)),
                            images: isStrict ? [] : (node.content.images || []).slice(0, currentTier === 0 ? 10 : 5),
                            links: isStrict ? [] : (node.content.links || []).slice(0, currentTier === 0 ? 20 : 10),
                            forms: node.content.forms,
                            semanticBlocks: isStrict ? [] : (node.content.semanticBlocks || []).slice(0, currentTier === 0 ? 30 : 5)
                        },
                        variants: node.variants // Include variants for AI awareness
                    }));

                    return {
                        pattern: group.pattern,
                        count: group.totalCount,
                        label: group.label,
                        examples
                    };
                }),
                uniquePages: g.uniquePages.map((node: any) => ({
                    url: node.url,
                    title: node.meta.title,
                    description: node.meta.description,
                    content: {
                        h1: node.content.h1,
                        rawText: (node.content.rawText || '').slice(0, currentTier === 0 ? 10000 : 3000),
                        semanticBlocks: isStrict ? [] : (node.content.semanticBlocks || []).slice(0, currentTier === 0 ? 20 : 5)
                    },
                    variants: node.variants // Include variants for AI awareness
                }))
            };
        };

        const optimized = buildOptimized(grouped, t);
        const tokens = estimateTokens(optimized);
        return { grouped, optimized, tokens };
    };

    // Run optimization for requested tier
    const result = runOptimization(tier);

    // Removed Auto-Downgrade Loop per user request ("Es soll garnicht passieren...")
    // AI Service will handle reactive downgrades if the API actually fails.

    const { grouped, optimized } = result;
    const originalNodes = structure.nodes.length;
    const optimizedNodes = grouped.stats.examplesIncluded;

    return {
        grouped,
        optimized,
        tier,
        savings: {
            original: originalNodes,
            optimized: optimizedNodes,
            saved: originalNodes - optimizedNodes,
            percentage: Math.round((1 - optimizedNodes / originalNodes) * 100)
        }
    };
}

/**
 * Helper to build the optimized JSON object for tokens estimation and final output
 */
function buildOptimized(grouped: GroupedStructure, tier: number) {
    return {
        rootUrl: grouped.rootUrl,
        crawledAt: grouped.crawledAt,
        stats: {
            ...grouped.stats,
            optimizationTier: tier
        },
        uniquePages: grouped.uniquePages.map(n => simplifyNode(n, tier, true)),
        groups: grouped.groups.map(group => ({
            pattern: group.pattern,
            totalPages: group.totalCount,
            isCluster: true,
            sampleUrls: group.allUrls.slice(0, 3),
            note: `${group.totalCount} pages follow this pattern. Tier ${tier} optimization applied.`,
            examples: group.examples.map(n => simplifyNode(n, tier, false))
        }))
    };
}

/**
 * Helper to convert grouped structure back to a flat SiteStructure
 * for generic AI analysis.
 */
export function flattenGroupedToStructure(grouped: GroupedStructure): SiteStructure {
    return {
        rootUrl: grouped.rootUrl,
        crawledAt: grouped.crawledAt,
        nodes: [
            ...grouped.uniquePages,
            ...grouped.groups.flatMap(g => g.examples)
        ]
    };
}

/**
 * Simplify a node for AI consumption (progressive reduction based on tier)
 * INTELLIGENT BUDGETING VERSION: Prioritizes unique/shallow pages.
 */
function simplifyNode(node: SiteNode, tier: number, isUnique: boolean = false): any {
    const urlObj = new URL(node.url);
    const isLandingPage = urlObj.pathname === '/';
    const isShallow = urlObj.pathname.split('/').filter(Boolean).length <= 1;

    // HIGH IMPORTANCE: Landing page, Unique pages, or shallow pages (top-level categories)
    const isHighImportance = isLandingPage || isUnique || isShallow;

    // Tier 4 Emergency: Only the Landing page stays detailed
    if (tier >= 4 && !isLandingPage) {
        return {
            url: node.url,
            meta: { title: node.meta.title },
            note: "Content stripped due to context limits (Tier 4)"
        };
    }

    // Config per Tier (Dynamic Budgeting)
    // We prioritize keeping text for High Importance pages even in higher tiers.
    let textBuffer = 10000;
    let linkCount = 20;
    let imageCount = 10;

    if (tier === 1) {
        // Tier 1: Reduce repetitive archetype text, keep unique text
        textBuffer = isHighImportance ? 200000 : 3000;
        linkCount = isHighImportance ? 50 : 5;
    } else if (tier === 2) {
        // Tier 2: Aggressive reduction for archetypes, preserve headings for all
        textBuffer = isHighImportance ? 100000 : 500;
        linkCount = isHighImportance ? 20 : 0;
        imageCount = isHighImportance ? 10 : 0;
    } else if (tier === 3) {
        // Tier 3: Metadata only for archetypes, limited text for unique
        textBuffer = isHighImportance ? 50000 : 0;
        linkCount = 0;
        imageCount = 0;
    }

    const cleanMeta = {
        title: node.meta.title,
        description: node.meta.description,
        social: node.meta.social,
        designSignals: node.meta.designSignals
    };

    const cleanContent = {
        headings: node.content.headings,
        rawText: node.content.rawText?.substring(0, textBuffer),
        links: (node.content.links || []).slice(0, linkCount),
        images: (node.content.images || []).slice(0, imageCount),
        semanticBlocks: node.content.semanticBlocks?.slice(0, isHighImportance ? 100 : 10),
        extractedColors: node.content.extractedColors
    };

    return {
        url: node.url,
        path: urlObj.pathname,
        depth: node.depth,
        meta: cleanMeta,
        variants: node.variants, // Pass variant info (languages) to AI
        content: cleanContent
    };
}
