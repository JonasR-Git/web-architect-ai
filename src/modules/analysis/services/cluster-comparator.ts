import {
    SiteNode,
    ContentProfile,
    ClusterForComparison,
    ClusterConflict,
    ClusterComparisonResult
} from '@/types';

/**
 * ClusterComparator - Content-Type Detection Service
 *
 * Analyzes clusters to determine if they represent the same or different content types.
 * Uses AI-based comparison of content profiles to make intelligent merge/split decisions.
 *
 * Use Cases:
 * - Detect if /blog/tag/[tag] and /blog/[article] should be merged or kept separate
 * - Identify taxonomy pages vs. article pages
 * - Find conflicting patterns that need resolution
 */
export class ClusterComparator {
    /**
     * Configuration thresholds for heuristic comparison
     * Adjust these to make comparison more/less strict
     */
    private static readonly HEURISTIC_THRESHOLDS = {
        /** Pages differ by >10x word count → definitely different */
        WORD_COUNT_RATIO_MAX: 10,
        /** Pages differ by >5x links → likely different (taxonomy vs article) */
        LINK_COUNT_RATIO_MAX: 5,
        /** <30% difference in metrics = similar */
        SIMILARITY_THRESHOLD: 0.3,
    };

    /**
     * Extracts simplified content profiles from cluster instances
     * Uses 60th percentile selection strategy for representative samples
     *
     * @param instances - Array of SiteNode instances from a cluster
     * @param limit - Max number of profiles to extract (default: 5)
     * @returns Array of ContentProfile objects
     */
    static extractContentProfiles(
        instances: SiteNode[],
        limit: number = 5
    ): ContentProfile[] {
        if (instances.length === 0) return [];

        // Sort by content weight (word count + image weight)
        // This helps identify "representative" pages, not outliers
        const sorted = [...instances].sort((a, b) => {
            const weightA = (a.content?.wordCount || 0) + (a.content?.images?.length || 0) * 50;
            const weightB = (b.content?.wordCount || 0) + (b.content?.images?.length || 0) * 50;
            return weightB - weightA;
        });

        // Select middle samples (30th-70th percentile)
        // Avoids both outliers (too short/long pages)
        const startIndex = Math.floor(sorted.length * 0.3);
        const endIndex = Math.min(sorted.length, startIndex + limit);
        const selected = sorted.slice(startIndex, endIndex);

        return selected.map(node => this.nodeToContentProfile(node));
    }

    /**
     * Converts a SiteNode to a simplified ContentProfile
     */
    private static nodeToContentProfile(node: SiteNode): ContentProfile {
        return {
            url: node.url,
            title: node.meta?.title || '',
            wordCount: node.content?.wordCount || 0,
            headings: (node.content?.headings || []).map(h => h.text),
            linkCount: node.content?.links?.length || 0,
            schemaTypes: node.meta?.schemaMarkup || [],
            imageCount: node.content?.images?.length || 0,
            hasForm: (node.content?.forms?.length || 0) > 0,
            contentSample: (node.content?.rawText || '').substring(0, 500)
        };
    }

    /**
     * Finds conflicting clusters that may need content-type comparison
     *
     * Conflicts are detected when:
     * 1. Same base path (e.g., /blog/tag/[tag] vs /blog/[article])
     * 2. Overlapping URL patterns
     * 3. Similar but not identical patterns
     *
     * @param clusters - Array of cluster objects
     * @returns Array of detected conflicts
     */
    static findConflictingClusters(
        clusters: ClusterForComparison[]
    ): ClusterConflict[] {
        const conflicts: ClusterConflict[] = [];

        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const clusterA = clusters[i];
                const clusterB = clusters[j];

                const conflict = this.detectConflict(clusterA, clusterB);
                if (conflict) {
                    conflicts.push(conflict);
                }
            }
        }

        return conflicts;
    }

    /**
     * Detects if two clusters are in conflict
     */
    private static detectConflict(
        clusterA: ClusterForComparison,
        clusterB: ClusterForComparison
    ): ClusterConflict | null {
        const patternA = clusterA.pattern;
        const patternB = clusterB.pattern;

        // Normalize patterns for comparison
        const normalizePattern = (p: string) => {
            try {
                const url = new URL(p, 'http://dummy.com');
                return url.pathname;
            } catch {
                return p;
            }
        };

        const pathA = normalizePattern(patternA);
        const pathB = normalizePattern(patternB);

        // CONFLICT TYPE 1: Same base path
        // Example: /blog/tag/[tag] vs /blog/[article]
        const segmentsA = pathA.split('/').filter(Boolean);
        const segmentsB = pathB.split('/').filter(Boolean);

        // Check if one pattern is a sub-pattern of the other
        const minLength = Math.min(segmentsA.length, segmentsB.length);
        let commonSegments = 0;

        for (let i = 0; i < minLength; i++) {
            const segA = segmentsA[i];
            const segB = segmentsB[i];

            // Ignore dynamic segments in comparison
            if (segA.startsWith('[') || segB.startsWith('[')) continue;

            if (segA === segB) {
                commonSegments++;
            } else {
                break;
            }
        }

        // If patterns share base path but differ in depth → conflict
        if (commonSegments >= 1 && segmentsA.length !== segmentsB.length) {
            return {
                clusterA,
                clusterB,
                conflictType: 'same_base_path',
                severity: 'high'
            };
        }

        // CONFLICT TYPE 2: Similar patterns (same depth, different segments)
        // Example: /blog/tag/[tag] vs /blog/category/[cat]
        if (segmentsA.length === segmentsB.length && commonSegments >= 1) {
            // Count non-matching segments
            let differences = 0;
            for (let i = 0; i < segmentsA.length; i++) {
                if (segmentsA[i] !== segmentsB[i] &&
                    !segmentsA[i].startsWith('[') &&
                    !segmentsB[i].startsWith('[')) {
                    differences++;
                }
            }

            if (differences === 1) {
                return {
                    clusterA,
                    clusterB,
                    conflictType: 'similar_pattern',
                    severity: 'medium'
                };
            }
        }

        // CONFLICT TYPE 3: Overlapping URLs (rare, but possible)
        const urlsA = new Set(clusterA.instances.map(n => n.url));
        const urlsB = new Set(clusterB.instances.map(n => n.url));
        const intersection = [...urlsA].filter(url => urlsB.has(url));

        if (intersection.length > 0) {
            return {
                clusterA,
                clusterB,
                conflictType: 'overlapping_urls',
                severity: 'high'
            };
        }

        return null;
    }

    /**
     * Prepares cluster data for AI comparison
     * Extracts content profiles from instances
     *
     * @returns Object with extracted profiles
     */
    static prepareForComparison(
        clusterA: ClusterForComparison,
        clusterB: ClusterForComparison
    ): {
        profilesA: ContentProfile[];
        profilesB: ContentProfile[];
    } {
        // Extract profiles (or use pre-cached if available)
        const profilesA = clusterA.sampleProfiles ||
            this.extractContentProfiles(clusterA.instances, 5);
        const profilesB = clusterB.sampleProfiles ||
            this.extractContentProfiles(clusterB.instances, 5);

        return { profilesA, profilesB };
    }

    /**
     * Performs a quick heuristic comparison without AI
     * Useful for filtering before expensive AI calls
     *
     * @returns { shouldCompareWithAI: boolean, quickDecision?: string }
     */
    static quickHeuristicCheck(
        profilesA: ContentProfile[],
        profilesB: ContentProfile[]
    ): { shouldCompareWithAI: boolean; quickDecision?: 'DEFINITELY_SAME' | 'DEFINITELY_DIFFERENT' } {
        if (profilesA.length === 0 || profilesB.length === 0) {
            return { shouldCompareWithAI: false };
        }

        // Calculate averages
        const avgA = this.calculateAverageProfile(profilesA);
        const avgB = this.calculateAverageProfile(profilesB);

        // RULE 1: Word count variance > threshold → Definitely different
        const wordCountRatio = Math.max(avgA.wordCount, avgB.wordCount) /
            Math.max(Math.min(avgA.wordCount, avgB.wordCount), 1);

        if (wordCountRatio > this.HEURISTIC_THRESHOLDS.WORD_COUNT_RATIO_MAX) {
            return {
                shouldCompareWithAI: false,
                quickDecision: 'DEFINITELY_DIFFERENT'
            };
        }

        // RULE 2: Link count variance > threshold → Likely different (taxonomy vs article)
        const linkCountRatio = Math.max(avgA.linkCount, avgB.linkCount) /
            Math.max(Math.min(avgA.linkCount, avgB.linkCount), 1);

        if (linkCountRatio > this.HEURISTIC_THRESHOLDS.LINK_COUNT_RATIO_MAX) {
            return {
                shouldCompareWithAI: false,
                quickDecision: 'DEFINITELY_DIFFERENT'
            };
        }

        // RULE 3: Schema types completely different → Definitely different
        const schemaA = new Set(avgA.schemaTypes);
        const schemaB = new Set(avgB.schemaTypes);
        const schemaIntersection = [...schemaA].filter(s => schemaB.has(s));

        if (schemaA.size > 0 && schemaB.size > 0 && schemaIntersection.length === 0) {
            // No common schema types
            const hasArticleA = avgA.schemaTypes.some(s => s.includes('Article'));
            const hasArticleB = avgB.schemaTypes.some(s => s.includes('Article'));
            const hasCollectionA = avgA.schemaTypes.some(s => s.includes('Collection') || s.includes('ItemList'));
            const hasCollectionB = avgB.schemaTypes.some(s => s.includes('Collection') || s.includes('ItemList'));

            if ((hasArticleA && hasCollectionB) || (hasArticleB && hasCollectionA)) {
                return {
                    shouldCompareWithAI: false,
                    quickDecision: 'DEFINITELY_DIFFERENT'
                };
            }
        }

        // RULE 4: Very similar metrics → Likely same
        const threshold = this.HEURISTIC_THRESHOLDS.SIMILARITY_THRESHOLD;
        const wordCountSimilar = Math.abs(avgA.wordCount - avgB.wordCount) / Math.max(avgA.wordCount, avgB.wordCount, 1) < threshold;
        const linkCountSimilar = Math.abs(avgA.linkCount - avgB.linkCount) / Math.max(avgA.linkCount, avgB.linkCount, 1) < threshold;
        const imageCountSimilar = Math.abs(avgA.imageCount - avgB.imageCount) / Math.max(avgA.imageCount, avgB.imageCount, 1) < threshold;

        if (wordCountSimilar && linkCountSimilar && imageCountSimilar && schemaIntersection.length > 0) {
            return {
                shouldCompareWithAI: false,
                quickDecision: 'DEFINITELY_SAME'
            };
        }

        // Edge case → Use AI
        return { shouldCompareWithAI: true };
    }

    /**
     * Calculates average profile from multiple samples
     */
    private static calculateAverageProfile(profiles: ContentProfile[]): {
        wordCount: number;
        linkCount: number;
        imageCount: number;
        schemaTypes: string[];
    } {
        const sum = profiles.reduce((acc, p) => ({
            wordCount: acc.wordCount + p.wordCount,
            linkCount: acc.linkCount + p.linkCount,
            imageCount: acc.imageCount + p.imageCount
        }), { wordCount: 0, linkCount: 0, imageCount: 0 });

        const allSchemas = profiles.flatMap(p => p.schemaTypes);
        const uniqueSchemas = [...new Set(allSchemas)];

        return {
            wordCount: Math.round(sum.wordCount / profiles.length),
            linkCount: Math.round(sum.linkCount / profiles.length),
            imageCount: Math.round(sum.imageCount / profiles.length),
            schemaTypes: uniqueSchemas
        };
    }

    /**
     * Batch comparison of multiple cluster pairs
     * Processes comparisons in parallel with concurrency limit
     *
     * NEW: Supports timeout per comparison
     * NEW: Supports progress callback for UI updates
     *
     * @param conflicts - Array of cluster conflicts to resolve
     * @param aiService - AIService instance for comparison
     * @param maxConcurrency - Max parallel comparisons (default: 3)
     * @param options - Optional configuration
     * @param options.timeout - Timeout per comparison in ms (default: 30000)
     * @param options.onProgress - Progress callback (completed, total)
     * @returns Map of comparison results
     */
    static async batchCompare(
        conflicts: ClusterConflict[],
        aiService: any,
        maxConcurrency: number = 3,
        options?: {
            timeout?: number;
            onProgress?: (completed: number, total: number) => void;
        }
    ): Promise<Map<string, ClusterComparisonResult>> {
        const timeout = options?.timeout || 30000; // 30s default timeout
        const onProgress = options?.onProgress;
        const results = new Map<string, ClusterComparisonResult>();

        // Validate AI service
        if (!aiService || typeof aiService.compareClusterContentTypes !== 'function') {
            console.warn('⚠️ [Batch Comparison] Invalid or missing AI service - using heuristic-only mode');
            // Process all conflicts with heuristics only
            for (const conflict of conflicts) {
                const { profilesA, profilesB } = this.prepareForComparison(
                    conflict.clusterA,
                    conflict.clusterB
                );
                const heuristic = this.quickHeuristicCheck(profilesA, profilesB);
                const key = this.makeComparisonKey(conflict.clusterA.pattern, conflict.clusterB.pattern);
                results.set(key, this.createFallbackResult(heuristic.quickDecision || 'KEEP_SEPARATE'));
            }
            return results;
        }

        // Filter conflicts that can be decided heuristically
        const needsAI: ClusterConflict[] = [];
        const quickDecisions: { conflict: ClusterConflict; decision: string }[] = [];

        for (const conflict of conflicts) {
            const { profilesA, profilesB } = this.prepareForComparison(
                conflict.clusterA,
                conflict.clusterB
            );

            // Quick heuristic check
            const heuristic = this.quickHeuristicCheck(profilesA, profilesB);

            if (heuristic.quickDecision) {
                quickDecisions.push({
                    conflict,
                    decision: heuristic.quickDecision
                });
                continue;
            }

            if (heuristic.shouldCompareWithAI) {
                needsAI.push(conflict);
            }
        }

        console.log(`📊 [Batch Comparison] ${conflicts.length} conflicts → ${quickDecisions.length} heuristic, ${needsAI.length} need AI`);

        // Track progress
        let completed = 0;
        const total = needsAI.length;

        // Process quick decisions
        quickDecisions.forEach(({ conflict, decision }) => {
            const key = this.makeComparisonKey(conflict.clusterA.pattern, conflict.clusterB.pattern);
            const fakeResult: ClusterComparisonResult = {
                decision: decision === 'DEFINITELY_SAME' ? 'SAME_TYPE' : 'DIFFERENT_TYPE',
                confidence: 95,
                cluster_a_type: decision === 'DEFINITELY_SAME' ? 'similar' : 'type_a',
                cluster_b_type: decision === 'DEFINITELY_SAME' ? 'similar' : 'type_b',
                evidence: {
                    similarities: decision === 'DEFINITELY_SAME' ? ['Heuristic match'] : [],
                    differences: decision === 'DEFINITELY_DIFFERENT' ? ['Heuristic mismatch'] : []
                },
                recommendation: decision === 'DEFINITELY_SAME' ? 'MERGE' : 'KEEP_SEPARATE',
                reasoning: `Heuristic decision: ${decision}`
            };
            results.set(key, fakeResult);
        });

        // Process AI comparisons in batches with timeout
        for (let i = 0; i < needsAI.length; i += maxConcurrency) {
            const batch = needsAI.slice(i, i + maxConcurrency);

            const batchPromises = batch.map(async (conflict) => {
                try {
                    const { profilesA, profilesB } = this.prepareForComparison(
                        conflict.clusterA,
                        conflict.clusterB
                    );

                    // Wrap AI call in timeout promise
                    const result = await Promise.race([
                        aiService.compareClusterContentTypes(
                            { pattern: conflict.clusterA.pattern, samples: profilesA },
                            { pattern: conflict.clusterB.pattern, samples: profilesB }
                        ),
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Comparison timeout')), timeout)
                        )
                    ]);

                    const key = this.makeComparisonKey(conflict.clusterA.pattern, conflict.clusterB.pattern);

                    // Update progress
                    completed++;
                    if (onProgress) {
                        onProgress(completed, total);
                    }

                    return { key, result };
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(
                        `❌ [Batch Comparison] ${errorMessage} - ${conflict.clusterA.pattern} vs ${conflict.clusterB.pattern}`
                    );

                    // Fallback to heuristic decision
                    const { profilesA, profilesB } = this.prepareForComparison(
                        conflict.clusterA,
                        conflict.clusterB
                    );
                    const heuristic = this.quickHeuristicCheck(profilesA, profilesB);
                    const key = this.makeComparisonKey(conflict.clusterA.pattern, conflict.clusterB.pattern);
                    const fallbackResult = this.createFallbackResult(heuristic.quickDecision || 'KEEP_SEPARATE');

                    // Update progress
                    completed++;
                    if (onProgress) {
                        onProgress(completed, total);
                    }

                    return { key, result: fallbackResult };
                }
            });

            const batchResults = await Promise.all(batchPromises);

            batchResults.forEach(item => {
                if (item) {
                    results.set(item.key, item.result);
                }
            });
        }

        return results;
    }

    /**
     * Creates a normalized comparison key from two patterns
     */
    private static makeComparisonKey(patternA: string, patternB: string): string {
        const [p1, p2] = [patternA, patternB].sort();
        return `${p1}|||${p2}`;
    }

    /**
     * Creates a fallback result for heuristic-only decisions or error cases
     */
    private static createFallbackResult(decision: string): ClusterComparisonResult {
        const isSame = decision === 'DEFINITELY_SAME';
        return {
            decision: isSame ? 'SAME_TYPE' : 'DIFFERENT_TYPE',
            confidence: 80,
            cluster_a_type: isSame ? 'similar' : 'type_a',
            cluster_b_type: isSame ? 'similar' : 'type_b',
            evidence: {
                similarities: isSame ? ['Heuristic match'] : [],
                differences: !isSame ? ['Heuristic mismatch'] : []
            },
            recommendation: isSame ? 'MERGE' : 'KEEP_SEPARATE',
            reasoning: `Fallback decision: ${decision}`
        };
    }
}
