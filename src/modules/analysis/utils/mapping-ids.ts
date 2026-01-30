/**
 * Consistent ID generation and matching for page mapping
 *
 * This module provides utilities to resolve source IDs from URLs,
 * ensuring proper mapping between old pages and new pages in the
 * Blueprint "Seitenübertragung" (Page Mapping) feature.
 */

export interface IdLookup {
    urlToSourceId: Map<string, string>;
    patternToSourceId: Map<string, string>;
}

/**
 * Normalize URL for consistent matching
 *
 * Removes trailing slashes, lowercases paths, and handles both
 * full URLs and pathname-only inputs.
 */
export function normalizeUrlForMatching(url: string): string {
    try {
        const urlObj = new URL(url);
        // Remove trailing slash, lowercase path
        const path = urlObj.pathname.replace(/\/$/, '') || '/';
        return path.toLowerCase();
    } catch {
        // If not a valid URL, treat as path
        return url.replace(/\/$/, '').toLowerCase() || '/';
    }
}

/**
 * Build lookup maps for efficient source ID resolution
 *
 * Creates two maps:
 * 1. urlToSourceId: Direct URL -> Source ID mapping (includes all cluster members)
 * 2. patternToSourceId: Pattern -> Source ID mapping (for pattern matching)
 *
 * This ensures that both individual pages and cluster members can be resolved.
 */
export function buildIdLookup(
    groups: any[],
    uniquePages: any[]
): IdLookup {
    const urlToSourceId = new Map<string, string>();
    const patternToSourceId = new Map<string, string>();

    // Register clusters
    groups.forEach((group) => {
        const clusterId = group.pattern;
        patternToSourceId.set(group.pattern, clusterId);

        // Register ALL URLs in cluster
        group.allUrls.forEach((url: string) => {
            const normalized = normalizeUrlForMatching(url);
            urlToSourceId.set(normalized, clusterId);
            urlToSourceId.set(url, clusterId); // Also keep original
        });
    });

    // Register unique pages
    uniquePages.forEach((node) => {
        const pageId = `page-${node.url}`;
        const normalized = normalizeUrlForMatching(node.url);
        urlToSourceId.set(normalized, pageId);
        urlToSourceId.set(node.url, pageId); // Also keep original
    });

    return { urlToSourceId, patternToSourceId };
}

/**
 * Resolve source ID from URL with proper matching logic
 *
 * Tries in order:
 * 1. Exact match (original URL)
 * 2. Normalized match (lowercase, no trailing slash)
 * 3. Pattern matching (for cluster patterns like /blog/[slug])
 *
 * Returns null if no match is found.
 */
export function resolveSourceId(
    url: string,
    lookup: IdLookup
): string | null {
    const { urlToSourceId, patternToSourceId } = lookup;

    // Try exact match (original URL)
    if (urlToSourceId.has(url)) {
        return urlToSourceId.get(url)!;
    }

    // Try normalized match
    const normalized = normalizeUrlForMatching(url);
    if (urlToSourceId.has(normalized)) {
        return urlToSourceId.get(normalized)!;
    }

    // Try pattern matching for clusters (e.g., /blog/[slug])
    for (const [pattern, sourceId] of patternToSourceId) {
        if (matchesPattern(normalized, pattern)) {
            return sourceId;
        }
    }

    return null;
}

/**
 * Check if a URL matches a pattern like /blog/[slug]
 *
 * Uses exact segment-based matching:
 * - /blog/post-1 matches /blog/[slug]
 * - /blog/post-1 does NOT match /blog-archive/[slug]
 * - Segments must match count and literal parts exactly
 */
function matchesPattern(path: string, pattern: string): boolean {
    const pathSegments = path.split('/').filter(Boolean);
    const patternSegments = pattern.split('/').filter(Boolean);

    if (pathSegments.length !== patternSegments.length) {
        return false;
    }

    for (let i = 0; i < patternSegments.length; i++) {
        const patternSeg = patternSegments[i];
        const pathSeg = pathSegments[i];

        // Wildcard segment matches anything
        if (patternSeg.startsWith('[') && patternSeg.endsWith(']')) {
            continue;
        }

        // Literal segment must match exactly
        if (patternSeg !== pathSeg) {
            return false;
        }
    }

    return true;
}
