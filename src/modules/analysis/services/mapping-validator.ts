import {
    SourcePage,
    TargetSlot,
    MappingValidationResult,
    UnmappedSource,
    DuplicateTarget,
    PatternCoverageIssue,
    AutoMappingSuggestion,
    MigrationPlan
} from '@/types';

/**
 * Mapping Validation Service
 *
 * Validates page mapping coverage, ensuring all non-excluded sources
 * are mapped to targets. Provides auto-mapping suggestions.
 */
export class MappingValidator {
    /**
     * Main validation function
     *
     * IMPORTANT: Only validates NON-excluded sources. The coverage formula is:
     * coverage = mappedSources / totalSources
     *
     * @param sources - All source pages (clusters and unique pages)
     * @param targets - All target slots
     * @param migrationPlan - Optional migration plan for pattern coverage check
     */
    static validate(
        sources: SourcePage[],
        targets: TargetSlot[],
        migrationPlan?: MigrationPlan
    ): MappingValidationResult {
        // Build set of all mapped source IDs
        const mappedSourceIds = new Set<string>();
        targets.forEach(target => {
            target.sourceIds.forEach(sourceId => {
                mappedSourceIds.add(sourceId);
            });
        });

        // Find unmapped sources
        const unmappedSources: UnmappedSource[] = sources
            .filter(source => !mappedSourceIds.has(source.id))
            .map(source => {
                // Generate suggested target path
                const suggestedTarget = this.suggestTargetPath(source, targets);

                return {
                    id: source.id,
                    url: source.url,
                    title: source.title,
                    type: source.type || 'page',
                    count: source.count,
                    suggestedTarget
                };
            });

        // Find empty targets (targets without sources)
        const emptyTargets: TargetSlot[] = targets.filter(
            target => !target.sourceIds || target.sourceIds.length === 0
        );

        // Find duplicate targets (same source mapped to multiple targets)
        const duplicateTargets: DuplicateTarget[] = this.findDuplicateTargets(targets);

        // Validate pattern coverage if migration plan provided
        const patternCoverageIssues: PatternCoverageIssue[] = migrationPlan
            ? this.validatePatternCoverage(sources, targets, migrationPlan)
            : [];

        // Calculate coverage
        const totalSources = sources.length;
        const mappedSources = totalSources - unmappedSources.length;
        const coveragePercentage = totalSources > 0
            ? Math.round((mappedSources / totalSources) * 100)
            : 100;

        return {
            isComplete: unmappedSources.length === 0,
            coveragePercentage,
            totalSources,
            mappedSources,
            unmappedSources,
            emptyTargets,
            duplicateTargets,
            patternCoverageIssues
        };
    }

    /**
     * Validates that AI-generated pattern mappings match actual clusters
     */
    static validatePatternCoverage(
        sources: SourcePage[],
        targets: TargetSlot[],
        migrationPlan: MigrationPlan
    ): PatternCoverageIssue[] {
        const issues: PatternCoverageIssue[] = [];

        // Get all cluster sources
        const clusterSources = sources.filter(s => s.type === 'cluster');

        // For each cluster, check if all instances are mapped
        clusterSources.forEach(cluster => {
            // Find targets that map this cluster
            const mappingTargets = targets.filter(t =>
                t.sourceIds.includes(cluster.id)
            );

            if (mappingTargets.length === 0) {
                issues.push({
                    pattern: cluster.url, // cluster.url is the pattern
                    expectedCount: cluster.count || 0,
                    mappedCount: 0,
                    unmappedUrls: [cluster.url]
                });
            }
        });

        return issues;
    }

    /**
     * Suggests a target path for an unmapped source.
     * If the path already exists as a target, returns the existing path
     * (the caller should assign to the existing target, not create a new one).
     */
    static suggestTargetPath(
        source: SourcePage,
        existingTargets: TargetSlot[]
    ): string {
        try {
            // For clusters, suggest pattern-based path
            if (source.type === 'cluster') {
                return source.url;
            }

            // For pages, normalize URL to a clean path
            const urlObj = new URL(source.url);
            let path = urlObj.pathname;

            // Remove trailing slash except for root
            if (path !== '/' && path.endsWith('/')) {
                path = path.slice(0, -1);
            }

            return path;
        } catch {
            return source.url;
        }
    }

    /**
     * Generates automatic mapping suggestions for unmapped sources.
     *
     * Key improvement: If a source's natural path matches an existing target,
     * assign the source to that target instead of creating a duplicate with "-2" suffix.
     */
    static generateAutoMappingSuggestions(
        unmappedSources: UnmappedSource[],
        existingTargets: TargetSlot[]
    ): AutoMappingSuggestion[] {
        // Build lookup of existing target paths (normalized)
        const targetByPath = new Map<string, TargetSlot>();
        existingTargets.forEach(t => {
            if (t.action === 'delete') return;
            const normalized = t.path.replace(/\/$/, '').toLowerCase() || '/';
            targetByPath.set(normalized, t);
        });

        return unmappedSources.map(source => {
            // Determine the natural path for this source
            let naturalPath: string;
            if (source.type === 'cluster') {
                naturalPath = source.url; // Pattern like /blog/[slug]
            } else {
                try {
                    const urlObj = new URL(source.url);
                    naturalPath = urlObj.pathname;
                    if (naturalPath !== '/' && naturalPath.endsWith('/')) {
                        naturalPath = naturalPath.slice(0, -1);
                    }
                } catch {
                    naturalPath = source.url;
                }
            }

            const normalizedPath = naturalPath.replace(/\/$/, '').toLowerCase() || '/';

            // Check if an existing target already covers this path
            const existingTarget = targetByPath.get(normalizedPath);
            if (existingTarget && existingTarget.action !== 'delete') {
                return {
                    sourceId: source.id,
                    suggestedPath: existingTarget.path,
                    action: existingTarget.action,
                    reason: `Assigned to existing target ${existingTarget.path}`,
                    existingTargetId: existingTarget.id
                };
            }

            // Check for similar targets (high path similarity)
            const similarTarget = existingTargets.find(t =>
                t.action !== 'delete' && this.pathSimilarity(naturalPath, t.path) > 0.8
            );
            if (similarTarget) {
                return {
                    sourceId: source.id,
                    suggestedPath: similarTarget.path,
                    action: 'merge' as const,
                    reason: `Similar to existing target ${similarTarget.path}`,
                    existingTargetId: similarTarget.id
                };
            }

            // No match found — create a new target
            const action = 'keep' as const;
            let reason = `Auto-mapped from ${source.url}`;

            if (source.type === 'cluster') {
                reason = `Cluster pattern for ${source.count || 0} pages`;
            }

            return {
                sourceId: source.id,
                suggestedPath: naturalPath,
                action,
                reason
            };
        });
    }

    /**
     * Finds duplicate targets (sources mapped to multiple targets)
     */
    private static findDuplicateTargets(targets: TargetSlot[]): DuplicateTarget[] {
        const sourceIdToTargets = new Map<string, TargetSlot[]>();

        // Build map of sourceId -> targetIds
        targets.forEach(target => {
            target.sourceIds.forEach(sourceId => {
                if (!sourceIdToTargets.has(sourceId)) {
                    sourceIdToTargets.set(sourceId, []);
                }
                sourceIdToTargets.get(sourceId)!.push(target);
            });
        });

        // Find duplicates
        const duplicates: DuplicateTarget[] = [];
        sourceIdToTargets.forEach((sourceTargets, sourceId) => {
            const isIntentionalSplit = sourceTargets.length > 1
                && sourceTargets.every(target => target.action === 'split');

            if (sourceTargets.length > 1 && !isIntentionalSplit) {
                // Get first target for reporting
                const firstTarget = sourceTargets[0];
                if (firstTarget) {
                    duplicates.push({
                        targetId: firstTarget.id,
                        targetPath: firstTarget.path,
                        sourceIds: [sourceId],
                        duplicateCount: sourceTargets.length
                    });
                }
            }
        });

        return duplicates;
    }

    /**
     * Calculates path similarity (0-1) using Levenshtein distance
     */
    private static pathSimilarity(path1: string, path2: string): number {
        const distance = this.levenshteinDistance(
            path1.toLowerCase(),
            path2.toLowerCase()
        );
        const maxLength = Math.max(path1.length, path2.length);
        return maxLength > 0 ? 1 - distance / maxLength : 1;
    }

    /**
     * Levenshtein distance algorithm
     */
    private static levenshteinDistance(str1: string, str2: string): number {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix: number[][] = [];

        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return matrix[len1][len2];
    }
}
