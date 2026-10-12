import { describe, expect, it, vi } from 'vitest';

import type {
    ClusterComparisonResult,
    ClusterConflict,
    ClusterForComparison,
    ContentProfile,
    SiteNode,
} from '@/types';

import { ClusterComparator } from '../cluster-comparator';

interface NodeOptions {
    url?: string;
    title?: string;
    wordCount?: number;
    linkCount?: number;
    imageCount?: number;
    schemaTypes?: string[];
    headings?: string[];
    rawText?: string;
}

function createNode({
    url = 'https://example.com/page',
    title = 'Example page',
    wordCount = 500,
    linkCount = 0,
    imageCount = 0,
    schemaTypes = [],
    headings = [],
    rawText = '',
}: NodeOptions = {}): SiteNode {
    return {
        url,
        depth: 1,
        type: 'other',
        meta: {
            title,
            description: 'Example description',
            social: {},
            schemaMarkup: schemaTypes,
            geoSignals: {
                hasCitations: false,
                hasEvidence: false,
                hasAuthorInfo: false,
            },
        },
        content: {
            h1: title,
            headings: headings.map((text, index) => ({ level: index + 1, text })),
            wordCount,
            images: Array.from({ length: imageCount }, (_, index) => ({
                alt: `Image ${index + 1}`,
                src: `https://example.com/image-${index + 1}.jpg`,
            })),
            links: Array.from({ length: linkCount }, (_, index) => ({
                href: `/link-${index + 1}`,
                text: `Link ${index + 1}`,
                type: 'internal' as const,
                role: 'content' as const,
                roleConfidence: 100,
                isButton: false,
                opensInNewTab: false,
                isDownload: false,
            })),
            forms: [],
            landmarks: [],
            hasSkipLink: false,
            hasLegalAccessibilityLink: false,
            rawText,
        },
        tech: {
            detectedFrameworks: [],
            duplicateIds: [],
        },
    };
}

function createProfile(overrides: Partial<ContentProfile> = {}): ContentProfile {
    return {
        url: 'https://example.com/page',
        title: 'Example page',
        wordCount: 500,
        headings: [],
        linkCount: 5,
        schemaTypes: [],
        imageCount: 2,
        hasForm: false,
        ...overrides,
    };
}

function createCluster(pattern: string, profiles: ContentProfile[]): ClusterForComparison {
    return {
        pattern,
        instances: [],
        sampleProfiles: profiles,
    };
}

describe('ClusterComparator', () => {
    it('extracts bounded content profiles without mutating the source order', () => {
        const nodes = [
            createNode({ url: 'https://example.com/short', wordCount: 100 }),
            createNode({
                url: 'https://example.com/article',
                title: 'Article',
                wordCount: 900,
                linkCount: 3,
                imageCount: 2,
                schemaTypes: ['Article'],
                headings: ['Article', 'Details'],
                rawText: 'A'.repeat(600),
            }),
            createNode({ url: 'https://example.com/long', wordCount: 1_500 }),
        ];
        const originalOrder = nodes.map((node) => node.url);

        const profiles = ClusterComparator.extractContentProfiles(nodes, 2);

        expect(profiles).toHaveLength(2);
        expect(nodes.map((node) => node.url)).toEqual(originalOrder);
        expect(profiles).toContainEqual(expect.objectContaining({
            url: 'https://example.com/article',
            title: 'Article',
            linkCount: 3,
            imageCount: 2,
            schemaTypes: ['Article'],
            headings: ['Article', 'Details'],
            contentSample: 'A'.repeat(500),
        }));
    });

    it('detects conflicts by URL hierarchy, pattern similarity and URL overlap', () => {
        const basePathConflict = ClusterComparator.findConflictingClusters([
            { pattern: '/blog/tag/[tag]', instances: [createNode()] },
            { pattern: '/blog/[article]', instances: [createNode()] },
        ]);
        const similarPatternConflict = ClusterComparator.findConflictingClusters([
            { pattern: '/blog/tag/[tag]', instances: [createNode()] },
            { pattern: '/blog/category/[category]', instances: [createNode()] },
        ]);
        const overlappingUrlConflict = ClusterComparator.findConflictingClusters([
            { pattern: '/articles/[slug]', instances: [createNode({ url: 'https://example.com/shared' })] },
            { pattern: '/stories/[slug]', instances: [createNode({ url: 'https://example.com/shared' })] },
        ]);

        expect(basePathConflict[0]).toMatchObject({ conflictType: 'same_base_path', severity: 'high' });
        expect(similarPatternConflict[0]).toMatchObject({ conflictType: 'similar_pattern', severity: 'medium' });
        expect(overlappingUrlConflict[0]).toMatchObject({ conflictType: 'overlapping_urls', severity: 'high' });
    });

    it('does not invent conflicts for unrelated cluster patterns', () => {
        const conflicts = ClusterComparator.findConflictingClusters([
            { pattern: '/blog/[slug]', instances: [createNode({ url: 'https://example.com/blog/post' })] },
            { pattern: '/products/[id]', instances: [createNode({ url: 'https://example.com/products/1' })] },
        ]);

        expect(conflicts).toEqual([]);
    });

    it.each([
        {
            name: 'large word-count differences',
            a: createProfile({ wordCount: 100 }),
            b: createProfile({ wordCount: 1_100 }),
            expected: 'DEFINITELY_DIFFERENT',
        },
        {
            name: 'article versus collection schemas',
            a: createProfile({ schemaTypes: ['Article'] }),
            b: createProfile({ schemaTypes: ['CollectionPage'] }),
            expected: 'DEFINITELY_DIFFERENT',
        },
        {
            name: 'matching metrics and schema',
            a: createProfile({ wordCount: 500, linkCount: 10, imageCount: 4, schemaTypes: ['Article'] }),
            b: createProfile({ wordCount: 520, linkCount: 11, imageCount: 4, schemaTypes: ['Article'] }),
            expected: 'DEFINITELY_SAME',
        },
    ])('resolves $name without an AI call', ({ a, b, expected }) => {
        expect(ClusterComparator.quickHeuristicCheck([a], [b])).toEqual({
            shouldCompareWithAI: false,
            quickDecision: expected,
        });
    });

    it('escalates ambiguous comparisons and skips empty comparisons', () => {
        const ambiguous = ClusterComparator.quickHeuristicCheck(
            [createProfile({ wordCount: 800, linkCount: 10, imageCount: 3 })],
            [createProfile({ wordCount: 1_200, linkCount: 8, imageCount: 5 })],
        );

        expect(ambiguous).toEqual({ shouldCompareWithAI: true });
        expect(ClusterComparator.quickHeuristicCheck([], [createProfile()])).toEqual({
            shouldCompareWithAI: false,
        });
    });

    it('uses supplied profiles instead of rebuilding them from instances', () => {
        const profiles = [createProfile({ title: 'Precomputed profile' })];

        const prepared = ClusterComparator.prepareForComparison(
            { pattern: '/a/[slug]', instances: [], sampleProfiles: profiles },
            { pattern: '/b/[slug]', instances: [createNode()] },
        );

        expect(prepared.profilesA).toBe(profiles);
        expect(prepared.profilesB).toHaveLength(1);
    });

    it('keeps deterministic decisions local and delegates only ambiguous conflicts', async () => {
        const deterministic: ClusterConflict = {
            clusterA: createCluster('/short/[slug]', [createProfile({ wordCount: 100 })]),
            clusterB: createCluster('/long/[slug]', [createProfile({ wordCount: 2_000 })]),
            conflictType: 'overlapping_urls',
            severity: 'high',
        };
        const ambiguous: ClusterConflict = {
            clusterA: createCluster('/news/[slug]', [createProfile({ wordCount: 800, linkCount: 10, imageCount: 3 })]),
            clusterB: createCluster('/insights/[slug]', [createProfile({ wordCount: 1_200, linkCount: 8, imageCount: 5 })]),
            conflictType: 'overlapping_urls',
            severity: 'high',
        };
        const aiResult: ClusterComparisonResult = {
            decision: 'SAME_TYPE',
            confidence: 87,
            cluster_a_type: 'editorial',
            cluster_b_type: 'editorial',
            evidence: { similarities: ['Editorial structure'], differences: [] },
            recommendation: 'MERGE',
            reasoning: 'Both clusters represent editorial detail pages.',
        };
        const compareClusterContentTypes = vi.fn().mockResolvedValue(aiResult);
        const onProgress = vi.fn();

        const results = await ClusterComparator.batchCompare(
            [deterministic, ambiguous],
            { compareClusterContentTypes },
            2,
            { onProgress },
        );

        expect(compareClusterContentTypes).toHaveBeenCalledOnce();
        expect(onProgress).toHaveBeenCalledWith(1, 1);
        expect(results).toHaveLength(2);
        expect([...results.values()]).toContainEqual(aiResult);
        expect([...results.values()]).toContainEqual(expect.objectContaining({
            recommendation: 'KEEP_SEPARATE',
            reasoning: 'Heuristic decision: DEFINITELY_DIFFERENT',
        }));
    });
});
