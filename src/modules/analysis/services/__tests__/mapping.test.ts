import { describe, expect, it } from 'vitest';

import type { MigrationPlan, SourcePage, TargetSlot, UnmappedSource } from '@/types';

import { MappingValidator } from '../mapping-validator';
import { reconstructTargets } from '@/modules/engineering/hooks/use-target-reconstruction';
import {
    MAPPING_ACTIONS,
    normalizeMappingAction,
    normalizePatternMappingAction,
} from '../../utils/mapping-actions';
import {
    buildIdLookup,
    normalizeUrlForMatching,
    resolveSourceId,
} from '../../utils/mapping-ids';

function createTarget(overrides: Partial<TargetSlot> = {}): TargetSlot {
    return {
        id: 'target-home',
        path: '/',
        label: 'Home',
        action: 'keep',
        sourceIds: [],
        ...overrides,
    };
}

describe('mapping identity resolution', () => {
    it('normalizes full URLs and path-only input consistently', () => {
        expect(normalizeUrlForMatching('https://example.com/Blog/Post/')).toBe('/blog/post');
        expect(normalizeUrlForMatching('/Blog/Post/')).toBe('/blog/post');
        expect(normalizeUrlForMatching('https://example.com/')).toBe('/');
    });

    it('resolves known pages and cluster members before falling back to patterns', () => {
        const lookup = buildIdLookup(
            [{
                pattern: '/blog/[slug]',
                allUrls: ['https://example.com/blog/existing'],
            }],
            [{ url: 'https://example.com/about' }],
        );

        expect(resolveSourceId('https://example.com/blog/existing', lookup)).toBe('/blog/[slug]');
        expect(resolveSourceId('https://example.com/ABOUT/', lookup)).toBe('page-https://example.com/about');
        expect(resolveSourceId('/blog/new-article', lookup)).toBe('/blog/[slug]');
        expect(resolveSourceId('/blog/archive/2026', lookup)).toBeNull();
    });
});

describe('mapping action normalization', () => {
    it('accepts split for page mappings and rejects it for atomic cluster mappings', () => {
        expect(MAPPING_ACTIONS).toContain('split');
        expect(normalizeMappingAction('split')).toBe('split');
        expect(normalizeMappingAction('unsupported')).toBe('redirect');
        expect(normalizePatternMappingAction('split')).toBe('redirect');
    });

    it('preserves split when reconstructing an existing sitemap target', () => {
        const plan: MigrationPlan = {
            rationale: 'Split a dense login page into focused destinations.',
            sitemap: [{ path: '/auth/login', label: 'Login', type: 'page' }],
            page_mapping: [{
                old_url: 'https://example.com/login',
                new_path: '/auth/login',
                action: 'split',
            }],
        };

        expect(reconstructTargets(plan)).toContainEqual(expect.objectContaining({
            path: '/auth/login',
            action: 'split',
            sourceIds: ['source-0'],
        }));
    });
});

describe('MappingValidator', () => {
    it('reports incomplete coverage and duplicate assignments', () => {
        const sources: SourcePage[] = [
            { id: 'home', url: 'https://example.com/', type: 'page' },
            { id: 'article', url: '/blog/[slug]', type: 'cluster', count: 12 },
            { id: 'pricing', url: 'https://example.com/pricing', type: 'page' },
        ];
        const targets = [
            createTarget({ id: 'target-home', sourceIds: ['home', 'article'] }),
            createTarget({ id: 'target-blog', path: '/blog/[slug]', sourceIds: ['article'] }),
        ];

        const result = MappingValidator.validate(sources, targets);

        expect(result).toMatchObject({
            isComplete: false,
            coveragePercentage: 67,
            totalSources: 3,
            mappedSources: 2,
        });
        expect(result.unmappedSources).toEqual([
            expect.objectContaining({ id: 'pricing', suggestedTarget: '/pricing' }),
        ]);
        expect(result.duplicateTargets).toEqual([
            expect.objectContaining({ sourceIds: ['article'], duplicateCount: 2 }),
        ]);
    });

    it('allows one source to feed multiple targets when every assignment is an intentional split', () => {
        const sources: SourcePage[] = [{
            id: 'guide',
            url: 'https://example.com/guide',
            type: 'page',
        }];
        const targets = [
            createTarget({ id: 'target-guide-a', path: '/guide/start', action: 'split', sourceIds: ['guide'] }),
            createTarget({ id: 'target-guide-b', path: '/guide/reference', action: 'split', sourceIds: ['guide'] }),
        ];

        const result = MappingValidator.validate(sources, targets);

        expect(result.isComplete).toBe(true);
        expect(result.duplicateTargets).toEqual([]);
    });

    it('reuses an existing target for the same normalized path', () => {
        const unmapped: UnmappedSource[] = [{
            id: 'blog-source',
            url: 'https://example.com/Blog/',
            type: 'page',
        }];
        const existing = [createTarget({
            id: 'target-blog',
            path: '/blog',
            action: 'redirect',
        })];

        expect(MappingValidator.generateAutoMappingSuggestions(unmapped, existing)).toEqual([{
            sourceId: 'blog-source',
            suggestedPath: '/blog',
            action: 'redirect',
            reason: 'Assigned to existing target /blog',
            existingTargetId: 'target-blog',
        }]);
    });

    it('preserves a split action when reusing an existing target', () => {
        const unmapped: UnmappedSource[] = [{
            id: 'guide-source',
            url: 'https://example.com/guide/',
            type: 'page',
        }];
        const existing = [createTarget({
            id: 'target-guide',
            path: '/guide',
            action: 'split',
        })];

        expect(MappingValidator.generateAutoMappingSuggestions(unmapped, existing)).toEqual([{
            sourceId: 'guide-source',
            suggestedPath: '/guide',
            action: 'split',
            reason: 'Assigned to existing target /guide',
            existingTargetId: 'target-guide',
        }]);
    });

    it('preserves a cluster pattern when no target exists', () => {
        const unmapped: UnmappedSource[] = [{
            id: 'cluster-blog',
            url: '/blog/[slug]',
            type: 'cluster',
            count: 18,
        }];

        expect(MappingValidator.generateAutoMappingSuggestions(unmapped, [])).toEqual([{
            sourceId: 'cluster-blog',
            suggestedPath: '/blog/[slug]',
            action: 'keep',
            reason: 'Cluster pattern for 18 pages',
        }]);
    });
});
