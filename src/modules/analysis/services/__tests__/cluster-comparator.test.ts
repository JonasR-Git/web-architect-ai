import { ClusterComparator } from '../cluster-comparator';
import { SiteNode, ContentProfile, ClusterForComparison } from '@/types';

describe('ClusterComparator', () => {
    // Mock SiteNode factory
    const createMockNode = (overrides: Partial<SiteNode> = {}): SiteNode => ({
        url: 'https://example.com/test',
        depth: 1,
        type: 'other',
        meta: {
            title: 'Test Page',
            description: 'Test description',
            social: {},
            schemaMarkup: [],
            geoSignals: {
                hasCitations: false,
                hasEvidence: false,
                hasAuthorInfo: false
            }
        },
        content: {
            h1: 'Test H1',
            headings: [],
            wordCount: 500,
            images: [],
            links: [],
            forms: [],
            landmarks: [],
            hasSkipLink: false,
            hasLegalAccessibilityLink: false
        },
        tech: {
            detectedFrameworks: [],
            duplicateIds: []
        },
        ...overrides
    });

    describe('extractContentProfiles', () => {
        it('should extract content profiles from nodes', () => {
            const nodes: SiteNode[] = [
                createMockNode({
                    url: 'https://example.com/page1',
                    content: {
                        ...createMockNode().content,
                        wordCount: 1000,
                        headings: [{ level: 1, text: 'Title 1' }, { level: 2, text: 'Subtitle 1' }],
                        links: [{ text: 'Link 1', href: '/link1' }]
                    },
                    meta: {
                        ...createMockNode().meta,
                        schemaMarkup: ['Article']
                    }
                }),
                createMockNode({
                    url: 'https://example.com/page2',
                    content: {
                        ...createMockNode().content,
                        wordCount: 1500,
                        headings: [{ level: 1, text: 'Title 2' }]
                    }
                })
            ];

            const profiles = ClusterComparator.extractContentProfiles(nodes, 5);

            expect(profiles).toHaveLength(2);
            expect(profiles[0]).toMatchObject({
                url: expect.stringContaining('example.com'),
                wordCount: expect.any(Number),
                headings: expect.any(Array),
                linkCount: expect.any(Number),
                schemaTypes: expect.any(Array),
                imageCount: expect.any(Number),
                hasForm: expect.any(Boolean)
            });
        });

        it('should limit profiles to specified number', () => {
            const nodes = Array.from({ length: 10 }, (_, i) =>
                createMockNode({ url: `https://example.com/page${i}` })
            );

            const profiles = ClusterComparator.extractContentProfiles(nodes, 3);

            expect(profiles.length).toBeLessThanOrEqual(3);
        });

        it('should return empty array for empty input', () => {
            const profiles = ClusterComparator.extractContentProfiles([]);
            expect(profiles).toEqual([]);
        });
    });

    describe('findConflictingClusters', () => {
        it('should detect same_base_path conflicts', () => {
            const clusters: ClusterForComparison[] = [
                {
                    pattern: '/blog/tag/[tag]',
                    instances: [createMockNode({ url: 'https://example.com/blog/tag/tech' })]
                },
                {
                    pattern: '/blog/[article]',
                    instances: [createMockNode({ url: 'https://example.com/blog/my-article' })]
                }
            ];

            const conflicts = ClusterComparator.findConflictingClusters(clusters);

            expect(conflicts.length).toBeGreaterThan(0);
            expect(conflicts[0].conflictType).toBe('same_base_path');
        });

        it('should detect similar_pattern conflicts', () => {
            const clusters: ClusterForComparison[] = [
                {
                    pattern: '/blog/tag/[tag]',
                    instances: [createMockNode()]
                },
                {
                    pattern: '/blog/category/[cat]',
                    instances: [createMockNode()]
                }
            ];

            const conflicts = ClusterComparator.findConflictingClusters(clusters);

            expect(conflicts.length).toBeGreaterThan(0);
            expect(conflicts[0].conflictType).toBe('similar_pattern');
        });

        it('should return empty array when no conflicts', () => {
            const clusters: ClusterForComparison[] = [
                {
                    pattern: '/blog/[slug]',
                    instances: [createMockNode()]
                },
                {
                    pattern: '/products/[id]',
                    instances: [createMockNode()]
                }
            ];

            const conflicts = ClusterComparator.findConflictingClusters(clusters);

            expect(conflicts).toEqual([]);
        });
    });

    describe('quickHeuristicCheck', () => {
        it('should detect DEFINITELY_DIFFERENT for high word count variance', () => {
            const profilesA: ContentProfile[] = [{
                url: 'test',
                title: 'Tag Page',
                wordCount: 200,
                headings: ['Tags'],
                linkCount: 20,
                schemaTypes: ['CollectionPage'],
                imageCount: 0,
                hasForm: false
            }];

            const profilesB: ContentProfile[] = [{
                url: 'test',
                title: 'Article',
                wordCount: 2500,
                headings: ['Intro', 'Body', 'Conclusion'],
                linkCount: 5,
                schemaTypes: ['Article'],
                imageCount: 8,
                hasForm: false
            }];

            const result = ClusterComparator.quickHeuristicCheck(profilesA, profilesB);

            expect(result.shouldCompareWithAI).toBe(false);
            expect(result.quickDecision).toBe('DEFINITELY_DIFFERENT');
        });

        it('should detect DEFINITELY_SAME for very similar metrics', () => {
            const profilesA: ContentProfile[] = [{
                url: 'test',
                title: 'Tag Page',
                wordCount: 300,
                headings: ['Tags'],
                linkCount: 20,
                schemaTypes: ['CollectionPage'],
                imageCount: 1,
                hasForm: false
            }];

            const profilesB: ContentProfile[] = [{
                url: 'test',
                title: 'Category Page',
                wordCount: 310,
                headings: ['Categories'],
                linkCount: 22,
                schemaTypes: ['CollectionPage'],
                imageCount: 1,
                hasForm: false
            }];

            const result = ClusterComparator.quickHeuristicCheck(profilesA, profilesB);

            expect(result.shouldCompareWithAI).toBe(false);
            expect(result.quickDecision).toBe('DEFINITELY_SAME');
        });

        it('should recommend AI comparison for edge cases', () => {
            const profilesA: ContentProfile[] = [{
                url: 'test',
                title: 'Page A',
                wordCount: 800,
                headings: [],
                linkCount: 10,
                schemaTypes: [],
                imageCount: 3,
                hasForm: false
            }];

            const profilesB: ContentProfile[] = [{
                url: 'test',
                title: 'Page B',
                wordCount: 1200,
                headings: [],
                linkCount: 8,
                schemaTypes: [],
                imageCount: 5,
                hasForm: true
            }];

            const result = ClusterComparator.quickHeuristicCheck(profilesA, profilesB);

            expect(result.shouldCompareWithAI).toBe(true);
        });
    });

    describe('caching', () => {
        beforeEach(() => {
            ClusterComparator.clearCache();
        });

        it('should cache comparison results', () => {
            const result: any = {
                decision: 'SAME_TYPE',
                confidence: 85,
                cluster_a_type: 'taxonomy',
                cluster_b_type: 'taxonomy',
                evidence: { similarities: [], differences: [] },
                recommendation: 'MERGE',
                reasoning: 'Test'
            };

            ClusterComparator.cacheComparison('/blog/tag/[tag]', '/blog/category/[cat]', result);

            const cached = ClusterComparator.getCachedComparison('/blog/tag/[tag]', '/blog/category/[cat]');

            expect(cached).toEqual(result);
        });

        it('should return null for non-existent cache entries', () => {
            const cached = ClusterComparator.getCachedComparison('/foo/[bar]', '/baz/[qux]');
            expect(cached).toBeNull();
        });

        it('should normalize pattern order in cache key', () => {
            const result: any = {
                decision: 'DIFFERENT_TYPE',
                confidence: 90,
                cluster_a_type: 'article',
                cluster_b_type: 'taxonomy',
                evidence: { similarities: [], differences: [] },
                recommendation: 'KEEP_SEPARATE',
                reasoning: 'Test'
            };

            ClusterComparator.cacheComparison('/blog/tag/[tag]', '/blog/[article]', result);

            // Should work regardless of order
            const cached1 = ClusterComparator.getCachedComparison('/blog/tag/[tag]', '/blog/[article]');
            const cached2 = ClusterComparator.getCachedComparison('/blog/[article]', '/blog/tag/[tag]');

            expect(cached1).toEqual(result);
            expect(cached2).toEqual(result);
        });

        it('should clear cache', () => {
            const result: any = {
                decision: 'SAME_TYPE',
                confidence: 80,
                cluster_a_type: 'test',
                cluster_b_type: 'test',
                evidence: { similarities: [], differences: [] },
                recommendation: 'MERGE',
                reasoning: 'Test'
            };

            ClusterComparator.cacheComparison('/test/[a]', '/test/[b]', result);
            expect(ClusterComparator.getCachedComparison('/test/[a]', '/test/[b]')).not.toBeNull();

            ClusterComparator.clearCache();
            expect(ClusterComparator.getCachedComparison('/test/[a]', '/test/[b]')).toBeNull();
        });

        it('should provide cache statistics', () => {
            const result: any = {
                decision: 'SAME_TYPE',
                confidence: 80,
                cluster_a_type: 'test',
                cluster_b_type: 'test',
                evidence: { similarities: [], differences: [] },
                recommendation: 'MERGE',
                reasoning: 'Test'
            };

            ClusterComparator.cacheComparison('/test/[a]', '/test/[b]', result);
            ClusterComparator.cacheComparison('/test/[c]', '/test/[d]', result);

            const stats = ClusterComparator.getCacheStats();

            expect(stats.size).toBe(2);
            expect(stats.entries.length).toBe(2);
        });
    });

    describe('prepareForComparison', () => {
        it('should extract profiles and check cache', () => {
            const clusterA: ClusterForComparison = {
                pattern: '/blog/tag/[tag]',
                instances: [createMockNode()]
            };

            const clusterB: ClusterForComparison = {
                pattern: '/blog/[article]',
                instances: [createMockNode()]
            };

            const prepared = ClusterComparator.prepareForComparison(clusterA, clusterB);

            expect(prepared.profilesA).toBeDefined();
            expect(prepared.profilesB).toBeDefined();
            expect(prepared.cachedResult).toBeNull(); // No cache yet
        });

        it('should use cached profiles if available', () => {
            const sampleProfiles: ContentProfile[] = [{
                url: 'test',
                title: 'test',
                wordCount: 100,
                headings: [],
                linkCount: 0,
                schemaTypes: [],
                imageCount: 0,
                hasForm: false
            }];

            const clusterA: ClusterForComparison = {
                pattern: '/test/[a]',
                instances: [],
                sampleProfiles
            };

            const clusterB: ClusterForComparison = {
                pattern: '/test/[b]',
                instances: []
            };

            const prepared = ClusterComparator.prepareForComparison(clusterA, clusterB);

            expect(prepared.profilesA).toEqual(sampleProfiles);
        });
    });
});
