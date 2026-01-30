import type { SiteNode } from '@/types';

/**
 * Level 2: Structural Variant Detection
 *
 * Deeper content analysis without AI.
 * Target: 90-95% accuracy, ~50ms per pair
 */
export class StructuralVariantDetector {
    /**
     * Compares heading structure between two pages
     * Returns confidence score 0-40
     */
    static compareHeadingStructure(
        node1: SiteNode,
        node2: SiteNode
    ): { score: number; reasons: string[] } {
        const reasons: string[] = [];
        let score = 0;

        const headings1 = node1.content.headings || [];
        const headings2 = node2.content.headings || [];

        // Get heading level counts (h1, h2, h3, etc.)
        const levels1 = this.getHeadingLevelCounts(headings1);
        const levels2 = this.getHeadingLevelCounts(headings2);

        // Exact structure match?
        if (JSON.stringify(levels1) === JSON.stringify(levels2)) {
            score += 40;
            reasons.push(`Identical heading structure: ${JSON.stringify(levels1)}`);
            return { score, reasons };
        }

        // Similar structure (±1 heading per level)?
        const similarity = this.calculateStructureSimilarity(levels1, levels2);

        if (similarity > 0.8) {
            score += Math.round(similarity * 40);
            reasons.push(`Similar heading structure: ${Math.round(similarity * 100)}% match`);
        }

        return { score, reasons };
    }

    /**
     * Compares Schema.org markup between two pages
     * Returns confidence score 0-30
     */
    static compareSchemaMarkup(
        node1: SiteNode,
        node2: SiteNode
    ): { score: number; reasons: string[] } {
        const reasons: string[] = [];
        let score = 0;

        const schema1 = node1.meta.schemaMarkup || [];
        const schema2 = node2.meta.schemaMarkup || [];

        if (schema1.length === 0 && schema2.length === 0) {
            return { score: 0, reasons: ['No schema markup on either page'] };
        }

        // Extract schema types (e.g., "Organization", "Product", "Article")
        const types1 = schema1.map(s => this.extractSchemaType(s)).filter(Boolean);
        const types2 = schema2.map(s => this.extractSchemaType(s)).filter(Boolean);

        if (types1.length === 0 || types2.length === 0) {
            return { score: 0, reasons: ['Could not parse schema types'] };
        }

        // Calculate Jaccard similarity
        const intersection = types1.filter(t => types2.includes(t));
        const union = new Set([...types1, ...types2]);
        const similarity = intersection.length / union.size;

        if (similarity === 1.0) {
            score += 30;
            reasons.push(`Identical schema types: [${types1.join(', ')}]`);
        } else if (similarity > 0.5) {
            score += Math.round(similarity * 30);
            reasons.push(`Similar schema types: ${Math.round(similarity * 100)}% overlap`);
        }

        return { score, reasons };
    }

    /**
     * Compares navigation structure (link fingerprint)
     * Returns confidence score 0-30
     */
    static compareNavigation(
        node1: SiteNode,
        node2: SiteNode
    ): { score: number; reasons: string[] } {
        const reasons: string[] = [];
        let score = 0;

        // Extract navigation links from landmarks
        const nav1 = this.extractNavigationLinks(node1);
        const nav2 = this.extractNavigationLinks(node2);

        if (nav1.length === 0 || nav2.length === 0) {
            return { score: 0, reasons: ['No navigation detected'] };
        }

        // Exact same number of nav links?
        if (nav1.length === nav2.length && nav1.length > 5) {
            score += 30;
            reasons.push(`Identical navigation size: ${nav1.length} links`);
            return { score, reasons };
        }

        // Similar count (±2)?
        const diff = Math.abs(nav1.length - nav2.length);

        if (diff <= 2 && nav1.length > 5) {
            score += 20;
            reasons.push(`Similar navigation size: ${nav1.length} vs ${nav2.length} links`);
        } else if (diff <= 4) {
            score += 10;
            reasons.push(`Moderately similar navigation: ${nav1.length} vs ${nav2.length} links`);
        }

        return { score, reasons };
    }

    /**
     * Combined structural check
     */
    static detect(
        node1: SiteNode,
        node2: SiteNode
    ): { score: number; reasons: string[] } {
        const headingResult = this.compareHeadingStructure(node1, node2);
        const schemaResult = this.compareSchemaMarkup(node1, node2);
        const navResult = this.compareNavigation(node1, node2);

        return {
            score: headingResult.score + schemaResult.score + navResult.score,
            reasons: [...headingResult.reasons, ...schemaResult.reasons, ...navResult.reasons]
        };
    }

    // ========== Helper Methods ==========

    private static getHeadingLevelCounts(headings: { level: number; text: string }[]): Record<number, number> {
        const counts: Record<number, number> = {};

        headings.forEach(h => {
            counts[h.level] = (counts[h.level] || 0) + 1;
        });

        return counts;
    }

    private static calculateStructureSimilarity(
        levels1: Record<number, number>,
        levels2: Record<number, number>
    ): number {
        const allLevels = new Set([
            ...Object.keys(levels1).map(Number),
            ...Object.keys(levels2).map(Number)
        ]);

        let totalDiff = 0;
        let maxCount = 0;

        allLevels.forEach(level => {
            const count1 = levels1[level] || 0;
            const count2 = levels2[level] || 0;
            totalDiff += Math.abs(count1 - count2);
            maxCount += Math.max(count1, count2);
        });

        if (maxCount === 0) return 0;

        return 1 - (totalDiff / maxCount);
    }

    private static extractSchemaType(schemaString: string): string | null {
        try {
            // Schema markup is stored as JSON string
            const schema = JSON.parse(schemaString);

            if (typeof schema === 'object' && schema !== null) {
                // Extract @type field
                if (schema['@type']) {
                    return Array.isArray(schema['@type'])
                        ? schema['@type'][0]
                        : schema['@type'];
                }
            }

            return null;
        } catch {
            // Fallback: Try regex extraction
            const typeMatch = schemaString.match(/"@type"\s*:\s*"([^"]+)"/);
            return typeMatch ? typeMatch[1] : null;
        }
    }

    private static extractNavigationLinks(node: SiteNode): string[] {
        const links = node.content.links || [];
        const landmarks = node.content.landmarks || [];

        // Heuristic: Navigation is usually in <nav>, <header>, or <footer> landmarks
        const hasNavLandmark = landmarks.some(l =>
            l.tag === 'nav' || l.role === 'navigation' || l.tag === 'header'
        );

        if (!hasNavLandmark) {
            // Fallback: Use all links (less reliable)
            return links.map(l => l.href);
        }

        // Better heuristic: Links in header/nav are navigation
        // Since we don't store landmark-specific links, we use a heuristic:
        // Navigation links are usually at the top of the link list
        // and have short, meaningful text

        const navLinks = links
            .filter(l => {
                const text = l.text || '';
                const href = l.href || '';

                // Filter criteria for navigation links:
                // 1. Short text (< 50 chars)
                // 2. Internal links (same domain or relative)
                // 3. Not empty text

                return (
                    text.length > 0 &&
                    text.length < 50 &&
                    (href.startsWith('/') || href.includes(node.url.split('/')[2]))
                );
            })
            .slice(0, 20); // Take first 20 as navigation

        return navLinks.map(l => l.href);
    }
}
