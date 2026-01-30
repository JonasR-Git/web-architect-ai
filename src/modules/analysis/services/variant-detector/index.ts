import type { SiteStructure, SiteNode, VariantDetectionConfig, VariantDetectionResult } from '@/types';
import { HeuristicVariantDetector } from './heuristic';
import { StructuralVariantDetector } from './structural';
import { AIVariantDetector } from './ai';

/**
 * Main Orchestrator for Language Variant Detection
 *
 * Implements a 3-level cascaded detection system:
 * 1. Level 1: Heuristics (fast, 80-85% accuracy)
 * 2. Level 2: Structural Analysis (medium, 90-95% accuracy)
 * 3. Level 3: AI-Powered (slow, 99% accuracy)
 *
 * Only proceeds to next level if previous levels are inconclusive.
 */

const DEFAULT_CONFIG: VariantDetectionConfig = {
    enableHeuristic: true,
    enableStructural: true,
    enableAI: true,
    heuristicThreshold: 80,    // Auto-confirm if heuristic ≥ 80
    structuralThreshold: 85,   // Auto-confirm if heuristic + structural ≥ 85
    aiThreshold: 80,           // AI must be ≥ 80 to confirm
    batchSize: 10
};

interface CandidatePair {
    node1: SiteNode;
    node2: SiteNode;
    heuristicScore: number;
    structuralScore?: number;
    totalScore: number;
}

export class LanguageVariantDetector {
    /**
     * Main detection function
     * Returns a map of URL -> Variant URLs
     */
    static async detectVariants(
        structure: SiteStructure,
        config: Partial<VariantDetectionConfig> = {}
    ): Promise<Map<string, string[]>> {
        const cfg: VariantDetectionConfig = { ...DEFAULT_CONFIG, ...config };
        const nodes = structure.nodes;

        console.log(`\n🌍 Language Variant Detection Started`);
        console.log(`   Total Pages: ${nodes.length}`);
        console.log(`   Config: Heuristic=${cfg.enableHeuristic}, Structural=${cfg.enableStructural}, AI=${cfg.enableAI}`);

        // STEP 1: Generate candidate pairs (different languages only)
        const candidatePairs = this.generateCandidatePairs(nodes);
        console.log(`   Candidate Pairs: ${candidatePairs.length}`);

        if (candidatePairs.length === 0) {
            console.log(`   ℹ️  No cross-language pairs found.`);
            return new Map();
        }

        // STEP 2: Level 1 - Heuristic Detection (Fast Filter)
        console.log(`\n📊 Level 1: Heuristic Detection`);
        const level1Results = this.runHeuristicDetection(candidatePairs, cfg);

        // Auto-confirm high-confidence matches
        const level1Confirmed = level1Results.filter(r => r.totalScore >= cfg.heuristicThreshold);
        const level1NeedMore = level1Results.filter(
            r => r.totalScore < cfg.heuristicThreshold && r.totalScore >= 50
        );

        console.log(`   ✅ Auto-Confirmed: ${level1Confirmed.length} pairs (≥${cfg.heuristicThreshold})`);
        console.log(`   ⏭️  Need More Analysis: ${level1NeedMore.length} pairs`);

        // STEP 3: Level 2 - Structural Analysis (Medium)
        let level2Confirmed: CandidatePair[] = [];
        let level2NeedAI: CandidatePair[] = [];

        if (cfg.enableStructural && level1NeedMore.length > 0) {
            console.log(`\n🏗️  Level 2: Structural Analysis`);
            const level2Results = this.runStructuralDetection(level1NeedMore, cfg);

            level2Confirmed = level2Results.filter(r => r.totalScore >= cfg.structuralThreshold);
            level2NeedAI = level2Results.filter(
                r => r.totalScore < cfg.structuralThreshold && r.totalScore >= 60
            );

            console.log(`   ✅ Auto-Confirmed: ${level2Confirmed.length} pairs (≥${cfg.structuralThreshold})`);
            console.log(`   🤖 Need AI Analysis: ${level2NeedAI.length} pairs`);
        }

        // STEP 4: Level 3 - AI Analysis (Slow, High Accuracy)
        let level3Confirmed: VariantDetectionResult[] = [];

        if (cfg.enableAI && level2NeedAI.length > 0) {
            console.log(`\n🤖 Level 3: AI-Powered Detection`);

            try {
                const aiResults = await AIVariantDetector.detectVariants(
                    level2NeedAI.map(p => ({
                        node1: p.node1,
                        node2: p.node2,
                        heuristicScore: p.totalScore
                    })),
                    cfg.batchSize
                );

                level3Confirmed = aiResults.filter(
                    r => r.isVariant && r.confidence >= cfg.aiThreshold
                );

                console.log(`   ✅ AI Confirmed: ${level3Confirmed.length} pairs (≥${cfg.aiThreshold}% confidence)`);
            } catch (error) {
                console.error(`   ❌ AI Detection failed:`, error);
            }
        }

        // STEP 5: Combine all confirmed matches
        const allConfirmed = [
            ...level1Confirmed.map(p => ({ node1Url: p.node1.url, node2Url: p.node2.url })),
            ...level2Confirmed.map(p => ({ node1Url: p.node1.url, node2Url: p.node2.url })),
            ...level3Confirmed.map(r => ({ node1Url: r.node1Url, node2Url: r.node2Url }))
        ];

        console.log(`\n✅ Total Variants Detected: ${allConfirmed.length} pairs`);

        // Build variant map
        const variantMap = this.buildVariantMap(allConfirmed);

        console.log(`   Variant Groups: ${variantMap.size}`);

        return variantMap;
    }

    /**
     * Apply detected variants to the structure
     * Updates the `variants` field on each node
     */
    static applyVariants(structure: SiteStructure, variantMap: Map<string, string[]>): SiteStructure {
        const updatedNodes = structure.nodes.map(node => {
            const variants = variantMap.get(node.url) || [];

            if (variants.length === 0) {
                return node;
            }

            // Build variant objects with lang codes
            const variantObjects = variants.map(variantUrl => {
                const variantNode = structure.nodes.find(n => n.url === variantUrl);
                return {
                    url: variantUrl,
                    lang: variantNode?.meta.lang || 'unknown'
                };
            });

            return {
                ...node,
                variants: variantObjects
            };
        });

        return {
            ...structure,
            nodes: updatedNodes
        };
    }

    // ========== Helper Methods ==========

    private static generateCandidatePairs(nodes: SiteNode[]): Array<[SiteNode, SiteNode]> {
        const pairs: Array<[SiteNode, SiteNode]> = [];

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const lang1 = nodes[i].meta.lang;
                const lang2 = nodes[j].meta.lang;

                // Only consider pairs with different languages
                if (lang1 && lang2 && lang1 !== lang2) {
                    pairs.push([nodes[i], nodes[j]]);
                }
            }
        }

        return pairs;
    }

    private static runHeuristicDetection(
        pairs: Array<[SiteNode, SiteNode]>,
        config: VariantDetectionConfig
    ): CandidatePair[] {
        return pairs.map(([node1, node2]) => {
            const result = HeuristicVariantDetector.detect(
                node1,
                node2,
                config.customTranslations
            );

            return {
                node1,
                node2,
                heuristicScore: result.score,
                totalScore: result.score
            };
        });
    }

    private static runStructuralDetection(
        candidates: CandidatePair[],
        config: VariantDetectionConfig
    ): CandidatePair[] {
        return candidates.map(candidate => {
            const result = StructuralVariantDetector.detect(
                candidate.node1,
                candidate.node2
            );

            return {
                ...candidate,
                structuralScore: result.score,
                totalScore: candidate.heuristicScore + result.score
            };
        });
    }

    private static buildVariantMap(
        confirmedPairs: Array<{ node1Url: string; node2Url: string }>
    ): Map<string, string[]> {
        // Build a graph of connections
        const connections = new Map<string, Set<string>>();

        confirmedPairs.forEach(({ node1Url, node2Url }) => {
            if (!connections.has(node1Url)) {
                connections.set(node1Url, new Set());
            }
            if (!connections.has(node2Url)) {
                connections.set(node2Url, new Set());
            }

            connections.get(node1Url)!.add(node2Url);
            connections.get(node2Url)!.add(node1Url);
        });

        // For each URL, list all connected URLs (transitive)
        const variantMap = new Map<string, string[]>();

        connections.forEach((connectedUrls, url) => {
            // Get all transitively connected URLs
            const allVariants = this.getTransitiveConnections(url, connections);
            variantMap.set(url, Array.from(allVariants));
        });

        return variantMap;
    }

    private static getTransitiveConnections(
        startUrl: string,
        connections: Map<string, Set<string>>
    ): Set<string> {
        const visited = new Set<string>();
        const queue = [startUrl];

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (visited.has(current)) continue;
            visited.add(current);

            const neighbors = connections.get(current) || new Set();
            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            });
        }

        // Remove the start URL itself
        visited.delete(startUrl);

        return visited;
    }
}

// Export individual detectors for advanced usage
export { HeuristicVariantDetector } from './heuristic';
export { StructuralVariantDetector } from './structural';
export { AIVariantDetector } from './ai';
