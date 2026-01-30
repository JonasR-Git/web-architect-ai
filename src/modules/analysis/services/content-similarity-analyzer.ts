import type { SiteNode, SiteStructure, ClusterSpec } from '@/types';

/**
 * Content Similarity Analyzer
 *
 * Analyzes content similarity between clusters to determine if they should be merged.
 * Uses content properties instead of URL patterns.
 */

export interface ClusterProfile {
    clusterId: string;
    pattern: string;
    contentSignature: {
        avgWordCount: number;
        avgImageCount: number;
        avgFormCount: number;
        hasSchema: boolean;
        topKeywords: string[];
        topicVector: number[];
    };
    metadata: {
        totalPages: number;
        publicationDensity: 'high' | 'medium' | 'low';
        contentType: 'article' | 'service' | 'product' | 'landing' | 'mixed';
    };
}

export interface MergeRecommendation {
    cluster1Id: string;
    cluster2Id: string;
    similarityScore: number; // 0-100
    shouldMerge: boolean;
    reason: string;
    suggestedTag1: string;
    suggestedTag2: string;
}

export class ContentSimilarityAnalyzer {
    /**
     * Analyzes a cluster and creates a content profile
     */
    static analyzeCluster(
        cluster: ClusterSpec,
        structure: SiteStructure
    ): ClusterProfile {
        const pages = cluster.instances.map(inst =>
            structure.nodes.find(n => n.url === inst.url)
        ).filter((n): n is SiteNode => n !== undefined);

        if (pages.length === 0) {
            return this.emptyProfile(cluster.id, cluster.pattern);
        }

        // Calculate averages
        const avgWordCount = pages.reduce((sum, p) => sum + (p.content.wordCount || 0), 0) / pages.length;
        const avgImageCount = pages.reduce((sum, p) => sum + (p.content.images?.length || 0), 0) / pages.length;
        const avgFormCount = pages.reduce((sum, p) => sum + (p.content.forms?.length || 0), 0) / pages.length;
        const hasSchema = pages.some(p => (p.meta.schemaMarkup?.length || 0) > 0);

        // Extract keywords from titles and h1s
        const allText = pages.flatMap(p => [
            p.meta.title || '',
            p.content.h1 || '',
            ...p.content.headings?.map(h => h.text) || []
        ]).join(' ').toLowerCase();

        const topKeywords = this.extractTopKeywords(allText, 10);
        const topicVector = this.createTopicVector(topKeywords);

        // Determine content type
        const contentType = this.inferContentType(pages);

        // Publication density (pages per pattern depth)
        const publicationDensity = pages.length > 50 ? 'high' : pages.length > 20 ? 'medium' : 'low';

        return {
            clusterId: cluster.id,
            pattern: cluster.pattern,
            contentSignature: {
                avgWordCount,
                avgImageCount,
                avgFormCount,
                hasSchema,
                topKeywords,
                topicVector
            },
            metadata: {
                totalPages: pages.length,
                publicationDensity,
                contentType
            }
        };
    }

    /**
     * Compares two clusters and determines if they should be merged
     */
    static compareClusters(
        profile1: ClusterProfile,
        profile2: ClusterProfile
    ): MergeRecommendation {
        let score = 0;
        const reasons: string[] = [];

        // 1. Word Count Similarity (0-25 points)
        const wcDiff = Math.abs(profile1.contentSignature.avgWordCount - profile2.contentSignature.avgWordCount);
        const wcMax = Math.max(profile1.contentSignature.avgWordCount, profile2.contentSignature.avgWordCount);
        const wcSimilarity = wcMax > 0 ? 1 - (wcDiff / wcMax) : 1;

        if (wcSimilarity > 0.7) {
            score += Math.round(wcSimilarity * 25);
            reasons.push(`Ähnliche Textlänge: ${Math.round(profile1.contentSignature.avgWordCount)} vs ${Math.round(profile2.contentSignature.avgWordCount)} Wörter`);
        }

        // 2. Image Count Similarity (0-15 points)
        const imgDiff = Math.abs(profile1.contentSignature.avgImageCount - profile2.contentSignature.avgImageCount);
        const imgMax = Math.max(profile1.contentSignature.avgImageCount, profile2.contentSignature.avgImageCount);
        const imgSimilarity = imgMax > 0 ? 1 - (imgDiff / imgMax) : 1;

        if (imgSimilarity > 0.7) {
            score += Math.round(imgSimilarity * 15);
            reasons.push(`Ähnliche Bildanzahl: ${profile1.contentSignature.avgImageCount.toFixed(1)} vs ${profile2.contentSignature.avgImageCount.toFixed(1)}`);
        }

        // 3. Topic/Keyword Overlap (0-40 points)
        const keywordOverlap = this.calculateKeywordOverlap(
            profile1.contentSignature.topKeywords,
            profile2.contentSignature.topKeywords
        );

        if (keywordOverlap > 0.3) {
            score += Math.round(keywordOverlap * 40);
            reasons.push(`Thematische Überschneidung: ${Math.round(keywordOverlap * 100)}%`);
        }

        // 4. Content Type Match (0-20 points)
        if (profile1.metadata.contentType === profile2.metadata.contentType) {
            score += 20;
            reasons.push(`Gleicher Content-Typ: ${profile1.metadata.contentType}`);
        }

        // Generate tags from pattern
        const tag1 = this.extractTagFromPattern(profile1.pattern);
        const tag2 = this.extractTagFromPattern(profile2.pattern);

        const shouldMerge = score >= 60;

        return {
            cluster1Id: profile1.clusterId,
            cluster2Id: profile2.clusterId,
            similarityScore: score,
            shouldMerge,
            reason: shouldMerge
                ? `Ähnlicher Content (Score: ${score}/100): ${reasons.join(', ')}`
                : `Unterschiedlicher Content (Score: ${score}/100)`,
            suggestedTag1: tag1,
            suggestedTag2: tag2
        };
    }

    /**
     * Analyzes all clusters and generates merge recommendations
     */
    static analyzeClusters(
        clusters: ClusterSpec[],
        structure: SiteStructure,
        cohesionThreshold: number = 65 // Minimum average similarity for a merge group
    ): {
        profiles: ClusterProfile[];
        recommendations: MergeRecommendation[];
        mergeGroups: Map<string, string[]>; // target -> [source cluster IDs]
        allSimilarities: Map<string, number>; // "id1-id2" -> score
    } {
        // Create profiles
        const profiles = clusters.map(c => this.analyzeCluster(c, structure));

        // Compare all pairs and store ALL similarities
        const recommendations: MergeRecommendation[] = [];
        const allSimilarities = new Map<string, number>();

        for (let i = 0; i < profiles.length; i++) {
            for (let j = i + 1; j < profiles.length; j++) {
                const rec = this.compareClusters(profiles[i], profiles[j]);

                // Store similarity for later cohesion check
                const key = `${profiles[i].clusterId}-${profiles[j].clusterId}`;
                allSimilarities.set(key, rec.similarityScore);

                if (rec.shouldMerge) {
                    recommendations.push(rec);
                }
            }
        }

        // Build merge groups with cohesion check
        const mergeGroups = this.buildMergeGroupsWithCohesion(
            recommendations,
            profiles,
            allSimilarities,
            cohesionThreshold
        );

        return { profiles, recommendations, mergeGroups, allSimilarities };
    }

    /**
     * Enriches migration plan with content-based tags
     */
    static enrichMigrationPlanWithTags(
        migrationPlan: any,
        clusters: ClusterSpec[],
        structure: SiteStructure,
        cohesionThreshold: number = 65
    ): any {
        const analysis = this.analyzeClusters(clusters, structure, cohesionThreshold);

        // Add tags to page_mapping entries
        const enrichedPageMapping = migrationPlan.page_mapping?.map((mapping: any) => {
            // Find which cluster this page belongs to
            const cluster = clusters.find(c =>
                c.instances.some(inst => inst.url === mapping.old_url) ||
                mapping.old_url.includes(c.pattern.replace('[item]', '').replace('[slug]', ''))
            );

            if (cluster) {
                const profile = analysis.profiles.find(p => p.clusterId === cluster.id);
                const tag = profile ? this.extractTagFromPattern(profile.pattern) : null;

                return {
                    ...mapping,
                    originalCategory: tag,
                    contentType: profile?.metadata.contentType
                };
            }

            return mapping;
        }) || [];

        // Add metadata about merge groups
        const mergeGroupsArray = Array.from(analysis.mergeGroups.entries()).map(([target, sources]) => ({
            targetHub: target,
            mergedCategories: sources.map(sourceId => {
                const profile = analysis.profiles.find(p => p.clusterId === sourceId);
                return this.extractTagFromPattern(profile?.pattern || sourceId);
            }),
            recommendation: analysis.recommendations.find(r =>
                sources.includes(r.cluster1Id) || sources.includes(r.cluster2Id)
            )
        }));

        return {
            ...migrationPlan,
            page_mapping: enrichedPageMapping,
            contentAnalysis: {
                clusterProfiles: analysis.profiles,
                mergeRecommendations: analysis.recommendations,
                mergeGroups: mergeGroupsArray
            }
        };
    }

    // ========== Helper Methods ==========

    private static emptyProfile(id: string, pattern: string): ClusterProfile {
        return {
            clusterId: id,
            pattern,
            contentSignature: {
                avgWordCount: 0,
                avgImageCount: 0,
                avgFormCount: 0,
                hasSchema: false,
                topKeywords: [],
                topicVector: []
            },
            metadata: {
                totalPages: 0,
                publicationDensity: 'low',
                contentType: 'mixed'
            }
        };
    }

    private static extractTopKeywords(text: string, limit: number): string[] {
        // Remove common stopwords
        const stopwords = new Set([
            'der', 'die', 'das', 'und', 'oder', 'aber', 'für', 'mit', 'auf', 'bei', 'von', 'zu', 'im', 'am',
            'the', 'and', 'or', 'but', 'for', 'with', 'on', 'at', 'from', 'to', 'in', 'a', 'an', 'is', 'are'
        ]);

        // Tokenize and count
        const words = text
            .split(/\s+/)
            .map(w => w.replace(/[^a-zäöüß]/gi, '').toLowerCase())
            .filter(w => w.length > 3 && !stopwords.has(w));

        const counts = new Map<string, number>();
        words.forEach(w => counts.set(w, (counts.get(w) || 0) + 1));

        // Sort by frequency
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word]) => word);
    }

    private static createTopicVector(keywords: string[]): number[] {
        // Simple bag-of-words vector (for future cosine similarity)
        // In production: Use actual embeddings (OpenAI, sentence-transformers)
        return keywords.map((_, i) => i / keywords.length);
    }

    private static inferContentType(pages: SiteNode[]): 'article' | 'service' | 'product' | 'landing' | 'mixed' {
        const hasLongText = pages.some(p => (p.content.wordCount || 0) > 500);
        const hasForms = pages.some(p => (p.content.forms?.length || 0) > 0);
        const hasProducts = pages.some(p => p.type === 'product');
        const isArticle = pages.some(p => p.type === 'blog_post');

        if (isArticle || hasLongText) return 'article';
        if (hasProducts) return 'product';
        if (hasForms) return 'service';
        if (pages.every(p => p.depth === 0)) return 'landing';
        return 'mixed';
    }

    private static calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);
        const intersection = new Set([...set1].filter(k => set2.has(k)));
        const union = new Set([...set1, ...set2]);

        return union.size > 0 ? intersection.size / union.size : 0;
    }

    private static extractTagFromPattern(pattern: string): string {
        // Extract meaningful tag from pattern
        // /blog/[item] → 'blog'
        // /news/[slug] → 'news'
        // /services/seo → 'seo'

        const segments = pattern.split('/').filter(Boolean);
        const firstSegment = segments[0] || 'general';

        // Remove wildcards
        return firstSegment.replace(/\[.*?\]/g, '').trim() || 'general';
    }

    /**
     * Builds merge groups with cohesion check to prevent weak transitive merges
     */
    private static buildMergeGroupsWithCohesion(
        recommendations: MergeRecommendation[],
        profiles: ClusterProfile[],
        allSimilarities: Map<string, number>,
        cohesionThreshold: number
    ): Map<string, string[]> {
        const groups = new Map<string, Set<string>>();

        // Build initial groups (direct recommendations only)
        recommendations.forEach(rec => {
            const existing1 = Array.from(groups.entries()).find(([_, members]) =>
                members.has(rec.cluster1Id)
            );
            const existing2 = Array.from(groups.entries()).find(([_, members]) =>
                members.has(rec.cluster2Id)
            );

            if (existing1 && existing2 && existing1[0] !== existing2[0]) {
                // Before merging two groups, check cohesion
                const combined = new Set([...existing1[1], ...existing2[1]]);
                const cohesion = this.calculateGroupCohesion(combined, allSimilarities);

                if (cohesion >= cohesionThreshold) {
                    // Merge two existing groups
                    existing2[1].forEach(id => existing1[1].add(id));
                    groups.delete(existing2[0]);
                    console.log(`   ✅ Merging groups (cohesion: ${cohesion.toFixed(1)}%)`);
                } else {
                    // Keep separate
                    console.log(`   ❌ Groups too different (cohesion: ${cohesion.toFixed(1)}% < ${cohesionThreshold}%)`);
                }
            } else if (existing1) {
                existing1[1].add(rec.cluster2Id);
            } else if (existing2) {
                existing2[1].add(rec.cluster1Id);
            } else {
                // Create new group
                const groupId = `group-${groups.size}`;
                groups.set(groupId, new Set([rec.cluster1Id, rec.cluster2Id]));
            }
        });

        // Convert to Map<string, string[]>
        const result = new Map<string, string[]>();
        groups.forEach((members, groupId) => {
            result.set(groupId, Array.from(members));
        });

        return result;
    }

    /**
     * Calculates average pairwise similarity within a group
     */
    private static calculateGroupCohesion(
        members: Set<string>,
        allSimilarities: Map<string, number>
    ): number {
        const memberArray = Array.from(members);

        if (memberArray.length < 2) return 100; // Single member = perfect cohesion

        let totalSimilarity = 0;
        let pairCount = 0;

        for (let i = 0; i < memberArray.length; i++) {
            for (let j = i + 1; j < memberArray.length; j++) {
                const key1 = `${memberArray[i]}-${memberArray[j]}`;
                const key2 = `${memberArray[j]}-${memberArray[i]}`;

                const similarity = allSimilarities.get(key1) || allSimilarities.get(key2) || 0;
                totalSimilarity += similarity;
                pairCount++;
            }
        }

        return pairCount > 0 ? totalSimilarity / pairCount : 0;
    }

    private static buildMergeGroups(
        recommendations: MergeRecommendation[],
        profiles: ClusterProfile[]
    ): Map<string, string[]> {
        const groups = new Map<string, Set<string>>();

        // Build connected components
        recommendations.forEach(rec => {
            const existing1 = Array.from(groups.entries()).find(([_, members]) =>
                members.has(rec.cluster1Id)
            );
            const existing2 = Array.from(groups.entries()).find(([_, members]) =>
                members.has(rec.cluster2Id)
            );

            if (existing1 && existing2 && existing1[0] !== existing2[0]) {
                // Merge two existing groups
                existing2[1].forEach(id => existing1[1].add(id));
                groups.delete(existing2[0]);
            } else if (existing1) {
                existing1[1].add(rec.cluster2Id);
            } else if (existing2) {
                existing2[1].add(rec.cluster1Id);
            } else {
                // Create new group
                const groupId = `group-${groups.size}`;
                groups.set(groupId, new Set([rec.cluster1Id, rec.cluster2Id]));
            }
        });

        // Convert to Map<string, string[]>
        const result = new Map<string, string[]>();
        groups.forEach((members, groupId) => {
            result.set(groupId, Array.from(members));
        });

        return result;
    }
}
