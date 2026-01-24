
import { SiteStructure, SiteNode } from '@/types';

export function optimizeStructureForAI(structure: SiteStructure): SiteStructure {
    if (structure.nodes.length < 50) return structure; // No optimization needed for small sites

    const nodes = structure.nodes;
    const groups: Record<string, SiteNode[]> = {};
    const singles: SiteNode[] = [];

    // Simple clustering by first directory segment
    nodes.forEach(node => {
        try {
            const url = new URL(node.url);
            const pathParts = url.pathname.split('/').filter(p => p);

            // Root or simple pages
            if (pathParts.length <= 1) {
                singles.push(node);
                return;
            }

            // Group by first segment (e.g. "blog", "products", "events")
            const segment = pathParts[0];
            if (!groups[segment]) groups[segment] = [];
            groups[segment].push(node);
        } catch {
            singles.push(node);
        }
    });

    const optimizedNodes: SiteNode[] = [...singles];

    // Process groups
    Object.entries(groups).forEach(([segment, groupNodes]) => {
        if (groupNodes.length < 5) {
            // Keep small groups as is
            optimizedNodes.push(...groupNodes);
        } else {
            // Collapse large groups
            // Keep first 3 + last 1 as samples
            const samples = groupNodes.slice(0, 3);
            samples.push(groupNodes[groupNodes.length - 1]);

            // Add a "virtual" summary node that describes the hidden pages
            const summaryNode: SiteNode = {
                url: `${structure.rootUrl}/${segment}/[...${groupNodes.length - 4} more pages]`,
                depth: 2,
                type: 'other',
                meta: {
                    title: `${segment} (Cluster)`,
                    description: `Group of ${groupNodes.length} pages`,
                    social: {},
                    schemaMarkup: [],
                    geoSignals: {
                        hasCitations: false,
                        hasEvidence: false,
                        hasAuthorInfo: false
                    }
                },
                content: {
                    h1: `Group: ${segment}`,
                    headings: [],
                    wordCount: 0,
                    images: [],
                    links: [],
                    forms: [],
                    landmarks: [],
                    hasSkipLink: false,
                    hasLegalAccessibilityLink: false,
                    rawText: `This represents a group of ${groupNodes.length} pages in the '${segment}' section. Samples: ${groupNodes.map(n => n.url).slice(0, 3).join(', ')}...`
                },
                tech: {
                    detectedFrameworks: [],
                    duplicateIds: []
                }
            };

            optimizedNodes.push(...samples);
            optimizedNodes.push(summaryNode);
        }
    });

    // Log found groups summary (not full JSON)
    const groupSummary = Object.entries(groups)
        .filter(([, nodes]) => nodes.length >= 5)
        .map(([segment, nodes]) => `${segment} (${nodes.length} pages)`)
        .join(', ');

    if (groupSummary) {
        console.log(`[StructureOptimizer] Groups found: ${groupSummary}`);
    }
    console.log(`[StructureOptimizer] Optimized: ${nodes.length} → ${optimizedNodes.length} nodes`);

    return {
        ...structure,
        nodes: optimizedNodes
    };
}
