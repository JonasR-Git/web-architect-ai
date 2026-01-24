import { SiteStructure, SiteNode } from '@/types';

/**
 * Smart Template Grouping
 * 
 * Detects URL patterns (like /blog/[slug]) and groups similar pages together,
 * keeping only a few examples per pattern to reduce token usage when sending to AI.
 */

interface PageGroup {
    pattern: string;           // e.g., "/blog/[slug]" or "/products/[id]"
    examples: SiteNode[];      // 2 example pages
    totalCount: number;        // Total pages matching this pattern
    allUrls: string[];         // All URLs in this group (for reference)
}

interface GroupedStructure {
    rootUrl: string;
    crawledAt: string;
    groups: PageGroup[];
    uniquePages: SiteNode[];   // Pages that don't fit a pattern
    stats: {
        totalPages: number;
        uniquePatterns: number;
        examplesIncluded: number;
    };
}

/**
 * Extract a pattern from a URL path by detecting dynamic segments
 * like slugs, IDs, dates, etc.
 */
function extractPattern(url: string): string {
    try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean);

        const patternSegments = segments.map((segment, index) => {
            // Detect numeric IDs
            if (/^\d+$/.test(segment)) {
                return '[id]';
            }

            // Detect UUIDs
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
                return '[uuid]';
            }

            // Detect date patterns (YYYY-MM-DD, YYYY/MM/DD, etc.)
            if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(segment)) {
                return '[date]';
            }

            // Detect year-month patterns
            if (/^\d{4}[-/]\d{2}$/.test(segment)) {
                return '[year-month]';
            }

            // Detect pure year
            if (/^(19|20)\d{2}$/.test(segment)) {
                return '[year]';
            }

            // Detect slugs (lowercase with hyphens, longer than 20 chars or contains numbers mixed with letters)
            if (
                (segment.includes('-') && segment.length > 20) ||
                (/[a-z]/.test(segment) && /\d/.test(segment) && segment.includes('-'))
            ) {
                return '[slug]';
            }

            // Detect typical blog post slugs (multiple hyphens, typical slug pattern)
            if (/^[a-z0-9]+(-[a-z0-9]+){2,}$/.test(segment)) {
                return '[slug]';
            }

            // Keep static segments as-is
            return segment;
        });

        return '/' + patternSegments.join('/');
    } catch {
        return url;
    }
}

/**
 * Group pages by their URL pattern and return only examples
 */
export function groupSimilarPages(
    structure: SiteStructure,
    maxExamplesPerPattern: number = 2
): GroupedStructure {
    const patternMap = new Map<string, SiteNode[]>();

    // Group pages by pattern
    for (const node of structure.nodes) {
        const pattern = extractPattern(node.url);

        if (!patternMap.has(pattern)) {
            patternMap.set(pattern, []);
        }
        patternMap.get(pattern)!.push(node);
    }

    const groups: PageGroup[] = [];
    const uniquePages: SiteNode[] = [];
    let examplesIncluded = 0;

    for (const [pattern, pages] of patternMap) {
        if (pages.length === 1) {
            // Single page - not a pattern, keep as unique
            uniquePages.push(pages[0]);
            examplesIncluded++;
        } else {
            // Multiple pages with same pattern - group them
            const examples = pages.slice(0, maxExamplesPerPattern);
            examplesIncluded += examples.length;

            groups.push({
                pattern,
                examples,
                totalCount: pages.length,
                allUrls: pages.map(p => p.url)
            });
        }
    }

    // Sort groups by count (largest first)
    groups.sort((a, b) => b.totalCount - a.totalCount);

    return {
        rootUrl: structure.rootUrl,
        crawledAt: structure.crawledAt,
        groups,
        uniquePages,
        stats: {
            totalPages: structure.nodes.length,
            uniquePatterns: groups.length + uniquePages.length,
            examplesIncluded
        }
    };
}

/**
 * Convert grouped structure back to a simplified structure for AI prompts
 * This reduces token usage significantly for sites with many similar pages
 */
export function createAIOptimizedStructure(structure: SiteStructure): {
    optimized: any;
    savings: { original: number; optimized: number; saved: number; percentage: number };
} {
    const grouped = groupSimilarPages(structure, 2);

    // Create optimized structure for AI
    const optimized = {
        rootUrl: grouped.rootUrl,
        crawledAt: grouped.crawledAt,
        stats: grouped.stats,

        // Unique pages (no pattern detected)
        uniquePages: grouped.uniquePages.map(simplifyNode),

        // Grouped patterns with examples
        pagePatterns: grouped.groups.map(group => ({
            pattern: group.pattern,
            totalPages: group.totalCount,
            note: `${group.totalCount} pages follow this pattern. Only ${group.examples.length} examples shown.`,
            examples: group.examples.map(simplifyNode)
        }))
    };

    // Calculate savings
    const originalNodes = structure.nodes.length;
    const optimizedNodes = grouped.stats.examplesIncluded;

    // Log group patterns found (not full JSON)
    const patternSummary = grouped.groups
        .map(g => `${g.pattern} (${g.totalCount} pages)`)
        .join(', ');

    if (patternSummary) {
        console.log(`[AIGrouping] Patterns found: ${patternSummary}`);
    }
    console.log(`[AIGrouping] Token optimization: ${originalNodes} → ${optimizedNodes} nodes (${grouped.stats.uniquePatterns} unique patterns)`);

    return {
        optimized,
        savings: {
            original: originalNodes,
            optimized: optimizedNodes,
            saved: originalNodes - optimizedNodes,
            percentage: Math.round((1 - optimizedNodes / originalNodes) * 100)
        }
    };
}

/**
 * Simplify a node for AI consumption (remove heavy data)
 */
function simplifyNode(node: SiteNode): any {
    return {
        url: node.url,
        path: new URL(node.url).pathname,
        depth: node.depth,
        meta: node.meta,
        score: node.score,
        content: {
            headings: node.content.headings,
            // Limit text significantly less (User approved up to 150k tokens)
            rawText: node.content.rawText?.substring(0, 50000),
            links: node.content.links.slice(0, 50),
            images: node.content.images.slice(0, 20),
        }
    };
}
