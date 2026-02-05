'use server';

import { WebCrawler } from '@/modules/analysis/crawler/crawler';
import { AIService } from '@/modules/core/ai-service';
import { SiteStructure, StackConfig, DesignConfig, ComponentSpecification, ClusterOverrides, ClusterSpec, PageInstance } from '@/types';
import { groupSimilarPages } from '@/modules/core/utils/grouping';
import { normalizeUrlToConcept, normalizeStructureToConcepts, SemanticMergeMap } from '@/modules/core/utils/normalization';
import { downloadImageAsBase64 } from '@/lib/image-downloader';
import { STYLE_EXTRACTOR_SYSTEM_PROMPT } from '@/modules/core/prompts/analysis';
import {
    MOCK_SITE_STRUCTURE,
    MOCK_CRITIQUE,
    MOCK_MIGRATION_PLAN,
    MOCK_COMPONENT_SPEC,
    MOCK_IMPLEMENTATION_PLAN,
    MOCK_SPECIFICATION,
    MOCK_OPTIMIZED_CONTENT,
    MOCK_COMPONENT_LIBRARY
} from '@/data/mocks';

// Check environment variable primarily
const USE_MOCK = process.env.USE_MOCK === 'true' || !process.env.OPENROUTER_API_KEY;

export async function startCrawlAction(url: string) {
    console.log(`[CrawlAction] Starting for ${url}. USE_MOCK=${USE_MOCK}`);
    if (USE_MOCK) {
        // Simulate delay for mock activity ONLY if Key is missing or USE_MOCK=true
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, data: MOCK_SITE_STRUCTURE, logs: ['Mock Crawl Started', 'Found 3 pages', 'Crawl Complete'] };
    }

    try {
        const crawler = new WebCrawler({ maxPages: 2500, maxDepth: 10 });
        // Start the crawl processing
        const structure = await crawler.start(url);

        // --- SEMANTIC BRANCH ANALYSIS ---
        // 1. Extract Branch Candidates (Top-level folders)
        const branches: any[] = [];
        const seenPaths = new Set();

        // Language prefixes to skip (they're handled by language normalization, not branch merging)
        const langPrefixes = new Set([
            'de', 'en', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko',
            'ar', 'tr', 'sv', 'no', 'da', 'fi', 'cs', 'hu', 'ro', 'el', 'hr', 'sk',
            'english', 'deutsch', 'german', 'french', 'spanish', 'italian', 'portuguese',
            'dutch', 'polish', 'russian', 'chinese', 'japanese', 'korean',
        ]);

        structure.nodes.forEach(node => {
            try {
                const u = new URL(node.url);
                const path = u.pathname;
                const parts = path.split('/').filter(Boolean);

                // Skip pure language roots (e.g., /en, /de, /english)
                if (parts.length === 1 && langPrefixes.has(parts[0].toLowerCase())) {
                    return;
                }

                // For depth-2 paths under language prefixes (e.g., /en/services),
                // use the non-language part as the branch (e.g., /services)
                let branchParts = parts;
                if (parts.length >= 1 && langPrefixes.has(parts[0].toLowerCase())) {
                    branchParts = parts.slice(1); // Strip language prefix
                }

                if (branchParts.length >= 1 && branchParts.length <= 2) {
                    const branchPath = '/' + branchParts.join('/');
                    if (!seenPaths.has(branchPath)) {
                        seenPaths.add(branchPath);
                        branches.push({
                            id: branchParts.join('-'),
                            path: branchPath,
                            sample: node.url
                        });
                    }
                }
            } catch (e) { }
        });

        // 2. AI Analysis
        let semanticMerges: { merges: any[] } = { merges: [] };
        if (branches.length > 0) {
            console.log(`[BranchAnalysis] Analyzing ${branches.length} potential branches...`);
            const ai = new AIService();
            const rawMerges = await ai.analyzeBranchStructure(branches) as any;

            // Safety: Filter out single-source "renames" and merges where concept equals the only source
            semanticMerges = {
                merges: (rawMerges?.merges || []).filter((m: any) => {
                    if (!m.sources || m.sources.length < 2) {
                        console.log(`[BranchAnalysis] Skipping single-source merge: ${m.concept} <- ${m.sources}`);
                        return false;
                    }
                    return true;
                })
            };
            console.log(`[BranchAnalysis] Found ${semanticMerges.merges.length} valid merges.`);
        }

        return { success: true, data: structure, semanticMerges };
    } catch (error: any) {
        console.error('Crawl Error:', error);
        return { success: false, error: error.message };
    }
}

export async function generateCritiqueAction(structure: SiteStructure, userInstructions?: string, overrides: ClusterOverrides = {}, semanticMerges?: SemanticMergeMap) {
    console.log(`[CritiqueAction] Triggered. USE_MOCK=${USE_MOCK}`);
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true, data: MOCK_CRITIQUE, isMock: true };
    }

    try {
        const ai = new AIService();
        console.log(`[CritiqueAction] Calling Real AI service...`);
        // NORMALIZE STRUCTURE FOR AI
        const normalizedStructure = normalizeStructureToConcepts(structure, semanticMerges);
        const data = await ai.generateCritique(normalizedStructure, userInstructions, overrides);
        return { success: true, data };
    } catch (error: any) {
        console.error('AI Error (Critique):', error);
        return { success: false, data: MOCK_CRITIQUE, error: error.message, isFallback: true };
    }
}

export async function generateMigrationAction(structure: SiteStructure, userInstructions?: string, overrides: ClusterOverrides = {}, semanticMerges?: SemanticMergeMap) {
    console.log(`[MigrationAction] Triggered. USE_MOCK=${USE_MOCK}`);
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, data: MOCK_MIGRATION_PLAN, isMock: true };
    }

    try {
        const ai = new AIService();

        // NORMALIZE STRUCTURE FOR AI
        const normalizedStructure = normalizeStructureToConcepts(structure, semanticMerges);

        // FILTER OUT STANDALONE PAGES (excludeFromClustering = true)
        // These pages should not be clustered automatically
        const { filterClusterablePages } = await import('@/lib/utils/page-clustering');
        const { clusterable, excluded } = filterClusterablePages(normalizedStructure.nodes, {
            respectManualFlags: true
        });

        console.log(`[Clustering] ${clusterable.length} clusterable, ${excluded.length} standalone pages`);

        // Create structure with only clusterable pages for grouping algorithm
        const clusterableStructure = {
            ...normalizedStructure,
            nodes: clusterable
        };

        // Group similar pages (only clusterable pages for the grouping algorithm!)
        const grouped = groupSimilarPages(clusterableStructure, 3, 5, overrides);

        // ============================================================================
        // CREATE CLUSTER METADATA (without modifying original structure)
        // ============================================================================
        // Build a mapping of URL -> Cluster Info for the AI prompt
        const clusterMetadata = {
            clusters: grouped.groups.map(g => ({
                pattern: g.pattern,
                urls: g.allUrls
            })),
            uniquePages: excluded.map(n => n.url)
        };

        console.log(`\n[AI Input] Sending structure + cluster metadata:`);
        console.log(`  📦 Total pages: ${normalizedStructure.nodes.length}`);
        console.log(`  🔗 Clustered: ${clusterMetadata.clusters.reduce((sum, c) => sum + c.urls.length, 0)} pages in ${clusterMetadata.clusters.length} clusters`);
        console.log(`  ⭐ Unique pages: ${clusterMetadata.uniquePages.length}`);
        console.log(`  Clusters:`, clusterMetadata.clusters.map(c => `${c.pattern} (${c.urls.length})`).join(', '));
        console.log('');

        // Pass cluster metadata via overrides so AI knows about clustering
        const aiOverrides = {
            ...overrides,
            // Store cluster info for AI to use
            _clusterMetadata: clusterMetadata
        };

        const data = await ai.generateMigrationPlan(normalizedStructure, userInstructions, aiOverrides, semanticMerges);

        // ENHANCED: Content-based Cluster Analysis
        console.log('📊 [ContentAnalysis] Analyzing cluster similarity...');
        const { ContentSimilarityAnalyzer } = await import('@/modules/analysis/services/content-similarity-analyzer');

        // --- Cluster Data Population for Cluster Component Architecture ---
        // Create clusters from grouped pages (these are only the clusterable pages)
        const clusters: ClusterSpec[] = grouped.groups.map((group, idx) => {
            const instances: PageInstance[] = group.allUrls.map(url => {
                // Find node in normalizedStructure (contains all pages)
                const node = normalizedStructure.nodes.find(n => n.url === url);
                return {
                    url,
                    title: node?.meta?.title || 'Unknown Title',
                    wordCount: node?.content?.wordCount || 0,
                    assetsFound: node?.content?.images?.length || 0,
                    status: 'pending'
                };
            });

            return {
                id: `cluster_${idx}`,
                pattern: group.pattern,
                instances
            };
        });

        // ADD STANDALONE PAGES AS INDIVIDUAL "CLUSTERS"
        // These pages were excluded from clustering but should still appear in the migration plan
        const standaloneClusters: ClusterSpec[] = excluded.map((node, idx) => ({
            id: `standalone_${idx}`,
            pattern: node.url, // Use full URL as pattern for standalone pages
            instances: [{
                url: node.url,
                title: node.meta?.title || 'Unknown Title',
                wordCount: node.content?.wordCount || 0,
                assetsFound: node.content?.images?.length || 0,
                status: 'pending'
            }]
        }));

        // Combine regular clusters with standalone "clusters"
        const allClusters = [...clusters, ...standaloneClusters];

        console.log(`[Clustering] Created ${clusters.length} pattern clusters + ${standaloneClusters.length} standalone pages`);

        // Attach clusters to result
        if (data) {
            (data as any).clusters = allClusters;

            // ENSURE UNIQUE PAGES ARE IN PAGE_MAPPING
            // The AI saw all pages with _isUniquePage flags
            // We verify unique pages are in page_mapping with their full URLs (not clustered)
            if (data.page_mapping && excluded.length > 0) {
                const existingUrls = new Set(data.page_mapping.map(m => m.old_url));
                const missingUniquePages = excluded.filter(node => !existingUrls.has(node.url));

                if (missingUniquePages.length > 0) {
                    console.log(`[Unique Pages] Adding ${missingUniquePages.length} missing unique pages to page_mapping`);

                    const uniquePageMappings = missingUniquePages.map(node => ({
                        old_url: node.url,
                        new_path: node.url, // Keep full URL for unique pages
                        action: 'keep' as const,
                        reason: 'Unique page (excluded from clustering)',
                        description: node.meta?.description || '',
                        type: 'page' as const,
                        content_goals: [] as string[]
                    }));

                    // Add unique page mappings to the page_mapping array
                    data.page_mapping = [
                        ...data.page_mapping,
                        ...uniquePageMappings
                    ];

                    console.log(`[Unique Pages] Added ${uniquePageMappings.length} unique pages to page_mapping`);
                } else {
                    console.log(`[Unique Pages] All ${excluded.length} unique pages already in page_mapping ✓`);
                }
            }

            // Enrich migration plan with content-based tags
            if (allClusters.length > 0) {
                const enrichedData = ContentSimilarityAnalyzer.enrichMigrationPlanWithTags(
                    data,
                    allClusters,
                    normalizedStructure
                );

                // Log merge recommendations
                if (enrichedData.contentAnalysis?.mergeRecommendations) {
                    console.log(`📊 [ContentAnalysis] Found ${enrichedData.contentAnalysis.mergeRecommendations.length} merge recommendations`);
                    enrichedData.contentAnalysis.mergeRecommendations.forEach((rec: any) => {
                        console.log(`   ${rec.shouldMerge ? '✅' : '❌'} ${rec.cluster1Id} + ${rec.cluster2Id}: ${rec.similarityScore}% - ${rec.reason}`);
                    });
                }

                return { success: true, data: enrichedData };
            }
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('AI Error (Migration):', error);
        return { success: false, data: MOCK_MIGRATION_PLAN, error: error.message, isFallback: true };
    }
}

export async function generateComponentLibraryAction(migrationPlan: any, crawledStructure?: any, userInstructions?: string, stackConfig?: any, critique?: any, overrides: ClusterOverrides = {}, semanticMerges?: SemanticMergeMap) {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true, data: MOCK_COMPONENT_SPEC, isMock: true };
    }
    try {
        const ai = new AIService();
        const data = await ai.generateComponentLibrary(migrationPlan, crawledStructure, userInstructions, stackConfig, critique, overrides, semanticMerges);
        return { success: true, data };
    } catch (error: any) {
        console.error('❌ AI Error (Components):', error);
        return {
            success: false,
            data: MOCK_COMPONENT_SPEC,
            error: `AI-Analyse fehlgeschlagen: ${error.message}. Zeige Standard-Komponenten als Fallback.`,
            isFallback: true
        };
    }
}

export async function downloadImagesAction(urls: string[]) {
    if (USE_MOCK) return { success: true, data: { images: {}, map: {} } };

    console.log(`[DownloadAction] MOCK=${USE_MOCK} Downloading ${urls.length} images...`);

    const results: Record<string, string> = {}; // filename -> base64
    const filenames: Record<string, string> = {}; // originalUrl -> filename

    // Limit concurrency to avoid blocking
    const BATCH_SIZE = 5;
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (url) => {
            const asset = await downloadImageAsBase64(url);
            if (asset) {
                // Determine if we should use filename as key or original url
                // Client side helper needs consistent mapping.
                // We'll return (filename -> base64) for zip
                // AND (originalUrl -> filename) for AI/mapping
                results[asset.filename] = asset.base64;
                filenames[url] = asset.filename;
            }
        }));
    }

    return { success: true, data: { images: results, map: filenames } };
}

export async function extractStyleAction(url: string) {
    try {
        // 1. Crawl the single page (shallow)
        const crawler = new WebCrawler({ maxPages: 1, maxDepth: 1 });
        const structure = await crawler.start(url);
        const node = structure.nodes[0];
        const meta = node?.meta || {};
        const title = meta.title || '';
        const description = meta.description || '';
        const pageContent = node?.content?.rawText || '';
        const designSignals = meta.designSignals;

        if (!pageContent) throw new Error("Could not extract content from URL");

        // 2. Analyze with AI (Enriched with Design Gene Sequence)
        const ai = new AIService();

        // 2a. Build Total Visual Anatomy (Vertical Flow + Image Inventory)
        let context = `PAGE_TITLE: ${title}\nPAGE_DESCRIPTION: ${description}\n\n`;

        // Vertical Section Flow
        const blocks = node?.content?.semanticBlocks || [];
        context += `### VERTICAL PAGE ANATOMY (Section Flow):\n`;
        if (blocks.length > 0) {
            blocks.forEach((block, idx) => {
                context += `[SECTION_${idx + 1}: ${block.type.toUpperCase()}]\n`;
                context += `${block.content}\n\n`;
            });
        } else {
            context += `RAW_CONTENT_SAMPLE:\n${pageContent.substring(0, 15000)}\n\n`;
        }

        // Visual Asset Inventory
        const images = node?.content?.images || [];
        if (images.length > 0) {
            context += `### VISUAL ASSET INVENTORY (Images):\n`;
            images.slice(0, 30).forEach((img: any, idx) => {
                const sectionHint = img.context ? `Found in or near: ${img.context}` : '';
                context += `- Image ${idx + 1}: Role=${img.role}, Confidence=${img.roleConfidence}%, ${sectionHint}, Alt="${img.alt || ''}"\n`;
            });
            context += `\n`;
        }

        if (designSignals) {
            context += `### DETECTED CSS SIGNALS (Design Gene Sequencer):
- Glassmorphism: ${designSignals.hasGlass ? 'DETECTED' : 'None'}
- Shadows: ${designSignals.hasHardShadows ? 'HARD/BRUTALIST' : 'Soft'}
- Rounding: ${designSignals.roundingMode}
- Typography: ${designSignals.typography || 'Unknown'}
- Spacing: ${designSignals.spacing || 'Unknown'}
- Animation: ${designSignals.animationLevel || 'Unknown'}
- Buttons: ${designSignals.buttonStyle || 'Unknown'}`;
        }

        const analysis = await ai.analyze(
            [{ role: 'system', content: STYLE_EXTRACTOR_SYSTEM_PROMPT }, { role: 'user', content: context }],
            { jsonMode: true }
        );

        // Merge AI findings with Hard Signals
        if (designSignals && analysis) {
            const currentTags = Array.isArray(analysis.style_tags) ? analysis.style_tags : [];
            if (designSignals.hasGlass) analysis.style_tags = ['glassmorphism', ...currentTags];
            if (designSignals.hasHardShadows) analysis.style_tags = ['brutalist', ...currentTags];
            // Trust CSS over AI for roundness
            if (designSignals.roundingMode === 'sharp') analysis.roundness = 'sharp';
            if (designSignals.roundingMode === 'full') analysis.roundness = 'full';
        }

        return { success: true, data: analysis };

    } catch (error: any) {
        console.error('Style Extraction Error:', error);
        let errorMessage = 'Failed to extract style';
        if (error.message.includes('Timeout')) errorMessage = 'Crawl timed out (the site took too long to respond)';
        if (error.message.includes('extract content')) errorMessage = 'Could not extract content from this URL (is it protected or invalid?)';
        if (error.message.includes('not found')) errorMessage = 'This URL could not be found';

        return { success: false, error: errorMessage };
    }
}

export async function generateDesignInstructionsAction(config: DesignConfig) {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, data: "Use Slate-900 (primary) for headers and Indigo-600 (accent) for buttons. Ensure rounded-xl borders on all cards for a soft aesthetic." };
    }
    try {
        const ai = new AIService();
        const data = await ai.generateDesignInstructions(config);
        return { success: true, data };
    } catch (error: any) {
        console.error('AI Error (Design Instructions):', error);
        return { success: false, data: "Failed to generate instructions.", error: error.message };
    }
}


export async function generateImplementationPlanAction(
    spec: ComponentSpecification,
    stackConfig: StackConfig,
    userInstructions?: string,
    availableAssets?: Record<string, string>,
    designConfig?: DesignConfig,
    pageSpecs?: any[],
    migrationPlan?: any
) {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, data: MOCK_IMPLEMENTATION_PLAN, isMock: true };
    }
    try {
        const ai = new AIService();
        const data = await ai.generateImplementationPlan(spec, stackConfig, userInstructions, availableAssets, designConfig, pageSpecs, migrationPlan);
        return { success: true, data };
    } catch (error: any) {
        console.error('AI Error (Implementation Plan):', error);
        return { success: false, data: MOCK_IMPLEMENTATION_PLAN, error: error.message, isFallback: true };
    }
}

// Generate visual HTML mockup (returns raw HTML string)
export async function generateVisualMockupAction(
    designConfig: DesignConfig,
    userPrompt?: string,
    siteData?: any
) {
    console.log(`[MockupAction] Generating visual mockup. USE_MOCK=${USE_MOCK}`);
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Return a simple mock HTML mockup
        return {
            success: true,
            data: `<div class="min-h-screen bg-background text-text">
                <header class="bg-primary text-white p-6"><h1 class="text-2xl font-bold">Mock Website</h1></header>
                <main class="p-8"><p class="text-lg">This is a mock mockup preview.</p></main>
            </div>`,
            isMock: true
        };
    }

    try {
        const ai = new AIService();

        if (designConfig.mockupFeedback && designConfig.mockupHtml) {
            if (!siteData) siteData = {};
            siteData.previousHtml = designConfig.mockupHtml;
        }

        const htmlContent = await ai.generateMockup(designConfig, userPrompt, siteData);
        return { success: true, data: htmlContent };
    } catch (error: any) {
        console.error('AI Error (Visual Mockup):', error);
        return { success: false, error: error.message };
    }
}

/**
 * Premium 3-Stage Mockup Generation
 * Uses iterative refinement with self-critique for top-tier design quality
 */
export async function generatePremiumMockupAction(
    designConfig: DesignConfig,
    componentSpec: any,
    pageSpec: any,
    onProgress?: (stage: number, message: string) => void
) {
    console.log(`[PremiumMockup] Starting 3-stage generation with preset: ${designConfig.stylePreset}`);

    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return {
            success: true,
            data: {
                html: `<div class="min-h-screen bg-background text-text p-8">
                    <h1 class="text-4xl font-bold">Premium Mock Mockup</h1>
                    <p>This is a premium 3-stage mock mockup.</p>
                </div>`,
                critique: {
                    overall_score: 85,
                    strengths: ['Clean layout', 'Good typography', 'Strong hierarchy'],
                    weaknesses: ['Could use more whitespace'],
                    improvements: ['Increase section spacing by 20%'],
                },
            },
            isMock: true,
        };
    }

    try {
        const ai = new AIService();
        const { generateStage1Prompt, generateStage2Prompt, generateStage3Prompt } = await import(
            '@/modules/design/services/premium-mockup-generator'
        );

        // Stage 1: Layout & Structure
        console.log('[PremiumMockup] Stage 1: Layout & Structure');
        const stage1Prompt = generateStage1Prompt(designConfig, componentSpec, pageSpec);
        const stage1Html = await (ai as any).callAIRaw(
            [{ role: 'user', content: stage1Prompt }],
            undefined,
            'Premium Stage 1: Layout'
        );

        // Stage 2: Visual Refinement
        console.log('[PremiumMockup] Stage 2: Visual Refinement');
        const stage2Prompt = generateStage2Prompt(designConfig, stage1Html);
        const stage2Html = await (ai as any).callAIRaw(
            [{ role: 'user', content: stage2Prompt }],
            undefined,
            'Premium Stage 2: Refinement'
        );

        // Stage 3: Self-Critique & Polish
        console.log('[PremiumMockup] Stage 3: Self-Critique & Polish');
        const stage3Prompt = generateStage3Prompt(designConfig, stage2Html);
        const stage3Response = await (ai as any).callAIRaw(
            [{ role: 'user', content: stage3Prompt }],
            undefined,
            'Premium Stage 3: Critique'
        );

        // Parse critique and HTML from response
        let finalHtml = stage3Response;
        let critique: any = undefined;

        // Try to extract critique JSON if present
        const critiqueMatch = stage3Response.match(/```json\n([\s\S]*?)\n```/);
        if (critiqueMatch) {
            try {
                critique = JSON.parse(critiqueMatch[1]);
                // Remove critique from HTML
                finalHtml = stage3Response.replace(/```json[\s\S]*?```/, '').trim();
            } catch (e) {
                console.warn('[PremiumMockup] Failed to parse critique:', e);
            }
        }

        console.log(`[PremiumMockup] Complete! Score: ${critique?.overall_score || 'N/A'}/100`);

        return {
            success: true,
            data: {
                html: finalHtml,
                critique,
            },
        };
    } catch (error: any) {
        console.error('[PremiumMockup] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate Ultra-Extreme Mockup using 5-Stage Process
 *
 * Stage 1: Foundation (Mimo-v2-flash)
 * Stage 2: Archetype Application (Mimo-v2-flash)
 * Stage 3: Experimental Push (Sonnet 3.5, temp=0.9)
 * Stage 4: Self-Critique (Mimo-v2-flash)
 * Stage 5: Extreme Polish (Sonnet 3.5)
 *
 * Models are configurable via .env (MOCKUP_STAGE1_MODEL, etc.)
 */
export async function generateUltraExtremeMockupAction(
    designConfig: DesignConfig,
    componentSpec: any,
    pageSpec: any,
    siteData?: any,  // ADDED: Site data with homepage content
    variationSeed?: number,
    onProgress?: (stage: number, message: string) => void
) {
    const designLevel = designConfig.designLevel || 'standard';
    console.log(`[${designLevel.toUpperCase()}] Starting 5-stage generation with archetype: ${designConfig.selectedArchetype}, variation: ${variationSeed || 1}`);

    // Validate archetype selection
    if (!designConfig.selectedArchetype) {
        return {
            success: false,
            error: 'No archetype selected. Please select an ultra-extreme archetype first.',
        };
    }

    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        return {
            success: true,
            data: {
                html: `<div class="min-h-screen bg-black text-white p-8">
                    <h1 class="text-6xl font-bold transform -rotate-2">Ultra-Extreme Mock Mockup</h1>
                    <p class="text-2xl mt-8">This is a 5-stage ultra-extreme mock mockup with ${designConfig.selectedArchetype}.</p>
                </div>`,
                critique: {
                    overall_score: 75,
                    strengths: ['Extreme archetype expression', 'Bold experimental choices', 'Unique design'],
                    weaknesses: ['Could push boundaries further'],
                    improvements: ['Add more asymmetry', 'Break one more conventional rule'],
                },
            },
            isMock: true,
        };
    }

    try {
        const ai = new AIService();
        const {
            generateStage1Prompt,
            generateStage2Prompt,
            generateStage3Prompt,
            generateStage4Prompt,
            generateStage5Prompt,
            extractCritiqueFromResponse,
            extractHtmlFromResponse,
        } = await import('@/modules/design/services/ultra-extreme-generator');
        const { getArchetypesByLevel } = await import('@/modules/design/data/all-archetypes');

        // Get archetype data from the appropriate level
        const archetypes = getArchetypesByLevel(designLevel);
        const archetype = archetypes.find(a => a.id === designConfig.selectedArchetype);
        if (!archetype) {
            return {
                success: false,
                error: `Invalid archetype: ${designConfig.selectedArchetype} for level ${designLevel}`,
            };
        }

        // Load model configuration from .env (with fallbacks)
        const STAGE_MODELS = {
            stage1: process.env.MOCKUP_STAGE1_MODEL || 'xiaomi/mimo-v2-flash',
            stage2: process.env.MOCKUP_STAGE2_MODEL || 'xiaomi/mimo-v2-flash',
            stage3: process.env.MOCKUP_STAGE3_MODEL || 'anthropic/claude-3.5-sonnet',
            stage4: process.env.MOCKUP_STAGE4_MODEL || 'xiaomi/mimo-v2-flash',
            stage5: process.env.MOCKUP_STAGE5_MODEL || 'anthropic/claude-3.5-sonnet',
        };

        const STAGE3_TEMP = parseFloat(process.env.MOCKUP_STAGE3_TEMPERATURE || '0.9');

        console.log(`[${designLevel.toUpperCase()}] Model config:`, {
            level: designLevel,
            archetype: archetype.name,
            variation: variationSeed || 1,
            stage1: STAGE_MODELS.stage1,
            stage2: STAGE_MODELS.stage2,
            stage3: `${STAGE_MODELS.stage3} (temp=${STAGE3_TEMP})`,
            stage4: STAGE_MODELS.stage4,
            stage5: STAGE_MODELS.stage5,
        });

        // Stage 1: Foundation (Layout & Structure)
        console.log(`[${designLevel.toUpperCase()}] Stage 1/5: Foundation (Layout & Structure) - Variation ${variationSeed || 1}`);
        onProgress?.(1, 'Building foundation layout...');
        const stage1Prompt = generateStage1Prompt(designConfig, componentSpec, pageSpec, siteData, variationSeed);
        const stage1Html = await (ai as any).callAIRaw(
            [{ role: 'user', content: stage1Prompt }],
            { model: STAGE_MODELS.stage1 },
            `${designLevel} Stage 1: Foundation`
        );

        // Stage 2: Archetype Application
        console.log(`[${designLevel.toUpperCase()}] Stage 2/5: Archetype Application (${archetype.name})`);
        onProgress?.(2, `Applying ${archetype.name} archetype...`);
        const stage2Prompt = generateStage2Prompt(archetype, stage1Html, designConfig);
        const stage2Html = await (ai as any).callAIRaw(
            [{ role: 'user', content: stage2Prompt }],
            { model: STAGE_MODELS.stage2 },
            `${designLevel} Stage 2: Archetype`
        );

        // Stage 3: Experimental Push (Design Level Aware)
        const stage3Label = designLevel === 'standard' ? 'Refinement' : designLevel === 'semi-unleashed' ? 'Creative Push' : 'Experimental Push';
        console.log(`[${designLevel.toUpperCase()}] Stage 3/5: ${stage3Label}`);
        onProgress?.(3, designLevel === 'standard' ? 'Refining and polishing...' : designLevel === 'semi-unleashed' ? 'Adding creative flair...' : 'Pushing boundaries and breaking rules...');
        const stage3Prompt = generateStage3Prompt(stage2Html, archetype, designConfig);
        const stage3Html = await (ai as any).callAIRaw(
            [{ role: 'user', content: stage3Prompt }],
            { model: STAGE_MODELS.stage3, temperature: STAGE3_TEMP },
            `${designLevel} Stage 3: ${stage3Label}`
        );

        // Stage 4: Self-Critique
        console.log(`[${designLevel.toUpperCase()}] Stage 4/5: Self-Critique`);
        onProgress?.(4, 'Analyzing design quality...');
        const stage4Prompt = generateStage4Prompt(stage3Html, archetype);
        const stage4Response = await (ai as any).callAIRaw(
            [{ role: 'user', content: stage4Prompt }],
            { model: STAGE_MODELS.stage4 },
            `${designLevel} Stage 4: Critique`
        );

        // Extract critique and HTML from Stage 4 response
        const critique = extractCritiqueFromResponse(stage4Response);
        const stage4Html = extractHtmlFromResponse(stage4Response);

        console.log(`[${designLevel.toUpperCase()}] Critique Score: ${critique.overall_score}/100`);

        // Stage 5: Final Polish
        console.log(`[${designLevel.toUpperCase()}] Stage 5/5: Final Polish`);
        onProgress?.(5, 'Adding final polish and refinements...');
        const stage5Prompt = generateStage5Prompt(stage4Html, critique, archetype, designLevel);
        const finalHtml = await (ai as any).callAIRaw(
            [{ role: 'user', content: stage5Prompt }],
            { model: STAGE_MODELS.stage5 },
            `${designLevel} Stage 5: Polish`
        );

        console.log(`[${designLevel.toUpperCase()}] Complete! Final Score: ${critique.overall_score}/100 (Variation ${variationSeed || 1})`);

        return {
            success: true,
            data: {
                html: finalHtml,
                critique,
            },
        };
    } catch (error: any) {
        console.error('[UltraExtreme] Error:', error);
        return { success: false, error: error.message };
    }
}

// Generate specification and implementation plan (for Config step)
export async function generateSpecAndPlanAction(
    migrationPlan: any,
    componentSpec: any,
    stackConfig: StackConfig,
    userInstructions?: string,
    availableAssets?: Record<string, string>,
    designConfig?: DesignConfig
) {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return { success: true, data: { spec: MOCK_SPECIFICATION, implPlan: MOCK_IMPLEMENTATION_PLAN }, isMock: true };
    }

    try {
        const ai = new AIService();
        const analysisData = { migrationPlan, componentSpec };
        const spec = await ai.generateSpecification(analysisData, userInstructions);
        // Pass availableAssets and designConfig to generateImplementationPlan
        const implPlan = await ai.generateImplementationPlan(spec, stackConfig, userInstructions, availableAssets, designConfig);

        return { success: true, data: { spec, implPlan } };
    } catch (error: any) {
        console.error('AI Error (Spec & Plan):', error);
        return { success: false, data: { spec: MOCK_SPECIFICATION, implPlan: MOCK_IMPLEMENTATION_PLAN }, error: error.message, isFallback: true };
    }
}

export async function optimizePageContentAction(
    pageData: { path: string, rawText: string, suggestedComponents: string[] },
    userInstructions?: string
) {
    console.log(`[ContentOptimizer] Optimizing ${pageData.path}. USE_MOCK=${USE_MOCK}`);
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, data: { ...MOCK_OPTIMIZED_CONTENT, page_title: `Mock: ${pageData.path}` }, isMock: true };
    }

    try {
        const ai = new AIService();
        const data = await ai.optimizePageContent(pageData, userInstructions);
        return { success: true, data };
    } catch (error: any) {
        console.error('AI Error (Content Optimizer):', error);
        return { success: false, data: MOCK_OPTIMIZED_CONTENT, error: error.message, isFallback: true };
    }
}

export async function generateDesignPaletteAction(baseColors: string[], vibe?: string) {
    console.log(`[DesignPaletteAction] Triggered with:`, baseColors);
    if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 1000));
        return {
            success: true,
            data: {
                colors: { primary: baseColors[0] || '#3b82f6', secondary: '#64748b', accent: '#f59e0b', background: '#ffffff', text: '#0f172a' },
                typography: { headline: 'Inter', body: 'Roboto', style: 'modern' },
                rationale: 'Mock generated palette.'
            }
        };
    }
    try {
        const ai = new AIService();
        const data = await ai.generateDesignPalette(baseColors, vibe);
        return { success: true, data };
    } catch (error: any) {
        console.error('Design Palette Error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// AI IMAGE CLASSIFICATION ACTION
// ============================================================================

import {
    classifyUnknownImages,
    estimateTokens,
    applyAIClassifications,
    ImageForClassification,
    AIClassificationResult
} from '@/modules/design/services/ai-image-classifier';

/**
 * Classify unknown images using AI.
 * 
 * @param images - Images to classify
 * @param forceClassify - Skip token threshold check
 * @param autoApproveThreshold - Token limit for auto-approval (default: 15000)
 */
export async function classifyImagesAction(
    images: ImageForClassification[],
    options: { forceClassify?: boolean; autoApproveThreshold?: number } = {}
): Promise<{ success: boolean; data?: AIClassificationResult; error?: string }> {
    console.log(`[ClassifyImagesAction] Processing ${images.length} images, force=${options.forceClassify}`);

    try {
        const result = await classifyUnknownImages(images, {
            autoApproveThreshold: options.autoApproveThreshold ?? 15000,
            forceClassify: options.forceClassify ?? false
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error('[ClassifyImagesAction] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get token estimate for a batch of images without classifying.
 */
export async function estimateClassificationTokensAction(
    images: ImageForClassification[]
): Promise<{
    success: boolean;
    data?: {
        imageCount: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        estimatedCost: number;
        requiresApproval: boolean;
    };
    error?: string
}> {
    try {
        const estimate = estimateTokens(images);
        const requiresApproval = estimate.totalTokens > 15000;

        return {
            success: true,
            data: {
                imageCount: images.length,
                ...estimate,
                requiresApproval
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function generatePageSpecsAction(targets: any[], structure?: any, sessionId?: string, semanticMerges?: SemanticMergeMap) {
    console.log(`[PageSpecsAction] Triggered for ${targets.length} targets. Session: ${sessionId || 'none'}. USE_MOCK=${USE_MOCK}`);
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            success: true,
            data: targets.map(t => ({
                ...t,
                description: "Mock-Beschreibung: Diese Seite konsolidiert Inhalte aus den Quellen.",
                content_goals: ["Ziel 1", "Ziel 2", "Ziel 3"]
            }))
        };
    }
    try {
        // 1. Enrich targets with source content for copywriting (AND FORK LANGUAGES)
        // We expand "Concept Targets" back into "Language Variants" here.
        const enrichedTargets = targets.flatMap((t: any) => {
            const conceptUrl = (t.sourceUrls || [])[0];

            // Find all RAW nodes that map to this concept
            let matchingNodes: any[] = [];
            if (structure?.nodes && conceptUrl) {
                // Ensure we use Semantic Merges to match Concept URL (e.g. /services) to Source URL (e.g. /de/leistungen)
                const targetConceptPath = normalizeUrlToConcept(conceptUrl, semanticMerges).conceptPath;
                matchingNodes = structure.nodes.filter((n: any) =>
                    normalizeUrlToConcept(n.url, semanticMerges).conceptPath === targetConceptPath
                );
            }

            // Fallback: If no matching nodes found (or structure missing), create a dummy wrapper for the concept itself
            if (matchingNodes.length === 0) {
                // This preserves the original behavior if forking fails
                const dummyNode = structure?.nodes?.find((n: any) => n.url === conceptUrl) || {
                    url: conceptUrl,
                    content: { rawText: '', images: [] },
                    meta: { lang: 'default' }
                };
                matchingNodes.push(dummyNode);
            }

            // Generate ONE Spec per Language Variant
            return matchingNodes.map((node: any) => {
                const rawText = node?.content?.rawText ? `--- Source: ${node.url} ---\n${node.content.rawText}` : '';
                const images = (node?.content?.images || []).slice(0, 15).map((img: any) => `- SRC: ${img.src} | ALT: ${img.alt || 'None'} | ROLE: ${img.role || 'unknown'}`).join('\n');

                const lang = node.meta?.lang || normalizeUrlToConcept(node.url, semanticMerges).detectedLang || 'default';

                // Compute Hreflang Map from Concept Variants
                // This answers: "Where are the other language versions of this exact concept?"
                const hreflangs = matchingNodes.map((n: any) => ({
                    lang: n.meta?.lang || normalizeUrlToConcept(n.url, semanticMerges).detectedLang || 'default',
                    url: n.url // Original Source URL (to be replaced by target path in export if needed, but for now links to source)
                })).filter(h => h.lang !== 'default');

                // Determine Canonical
                // Logic: If there are multiple nodes for SAME language (e.g. params), pick the shortest one.
                // For cross-language, we don't set canonical to a different language usually (unless it's a direct duplicate).
                // Self-referencing canonical is standard.
                const canonical = hreflangs.find(h => h.lang === lang)?.url || node.url;

                return {
                    ...t,
                    // Unique ID per language variant (e.g., "spec-/blog/post-1-de")
                    id: `${t.id}-${lang}`,
                    language: lang,
                    hreflangs, // Pass to frontend for export
                    canonical, // Pass to frontend for export
                    sourceText: `${rawText}\n\n### SOURCE ASSET INVENTORY (IMAGES):\n${images}`.substring(0, 15000),
                    sourceDetails: [node] // Attach specific source node!
                };
            });
        });

        const ai = new AIService(sessionId);

        // 2. Initial Draft Generation (Now with Content!)
        const initialSpecs = await ai.generatePageSpecs(enrichedTargets);

        console.log(`[PageSpecsAction] Initial Draft Generated. IsArray: ${Array.isArray(initialSpecs)}`);

        if (!initialSpecs || !Array.isArray(initialSpecs)) {
            console.warn(`[PageSpecsAction] Skipping Smart Loop because initialSpecs is not an array:`, typeof initialSpecs);
            return { success: true, data: initialSpecs };
        }

        return { success: true, data: initialSpecs };
    } catch (error: any) {
        console.error('AI Error (Page Specs):', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// ITERATIVE WORKFLOW ACTIONS (V4)
// ============================================================================

// [Removed duplicate actions: detectDependenciesAction, regeneratePageSpecsAction] - See bottom of file for new implementation


// ============================================================================
// SESSION PERSISTENCE ACTIONS
// ============================================================================

import { PersistenceService, SessionData } from '@/modules/core/persistence';

export async function saveSessionAction(data: SessionData) {
    console.log(`[Persistence] Saving session ${data.id}...`);
    try {
        const result = await PersistenceService.saveSession(data);
        if (result) {
            return { success: true, data: result };
        }
        return { success: false, error: 'Save failed' };
    } catch (error: any) {
        console.error('Save Session Error:', error);
        return { success: false, error: error.message };
    }
}

export async function loadSessionAction(id: string) {
    console.log(`[Persistence] Loading session ${id}...`);
    try {
        const data = await PersistenceService.loadSession(id);
        if (!data) throw new Error('Session not found');
        return { success: true, data };
    } catch (error: any) {
        console.error('Load Session Error:', error);
        return { success: false, error: error.message };
    }
}

export async function listSessionsAction() {
    try {
        const sessions = await PersistenceService.listSessions();
        return { success: true, data: sessions };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteSessionAction(id: string) {
    try {
        const success = await PersistenceService.deleteSession(id);
        return { success };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ============================================================================
// GRANULAR SAVE ACTIONS - Phase 1 Optimization
// ============================================================================

export async function saveStateAction(id: string, state: { currentView?: string, blueprintTab?: string, mockupViewMode?: string }) {
    try {
        const success = await PersistenceService.saveState(id, state as any);
        return { success };
    } catch (error: any) {
        console.error('[Action] Save State Error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveStructureAction(id: string, structure: any) {
    try {
        const success = await PersistenceService.saveStructure(id, structure);
        return { success };
    } catch (error: any) {
        console.error('[Action] Save Structure Error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveMigrationAction(id: string, migrationPlan: any) {
    try {
        const success = await PersistenceService.saveMigration(id, migrationPlan);
        return { success };
    } catch (error: any) {
        console.error('[Action] Save Migration Error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveSpecsAction(id: string, specs: { pageSpecs?: any[], componentSpec?: any, finalOutput?: any }) {
    try {
        const success = await PersistenceService.saveSpecs(id, specs);
        return { success };
    } catch (error: any) {
        console.error('[Action] Save Specs Error:', error);
        return { success: false, error: error.message };
    }
}

export async function saveDesignAction(id: string, design: { designConfig?: any, stackConfig?: any }) {
    try {
        const success = await PersistenceService.saveDesign(id, design);
        return { success };
    } catch (error: any) {
        console.error('[Action] Save Design Error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// CLIENT-SIDE SMART LOOP ACTIONS
// ============================================================================

export async function detectDependenciesAction(targetPath: string, prompt: string, sitemapPaths: string[], sessionId?: string) {
    console.log(`🔍 [DependencyDetect] Starting analysis for '${targetPath}'...`);
    try {
        const ai = new AIService(sessionId);
        const result = await ai.detectDependencies(targetPath, prompt, sitemapPaths);
        console.log(`✅ [DependencyDetect] Finished for '${targetPath}'. Found: ${result?.dependencies?.length || 0} deps.`);
        return { success: true, data: result };
    } catch (error: any) {
        console.error(`❌ [DependencyDetect] Error for '${targetPath}':`, error);
        return { success: false, error: error.message };
    }
}

export async function regeneratePageSpecsAction(
    targetSpec: any,
    primarySource: string, // Kept for interface compatibility
    secondaryContext: any[],
    sitemapPaths: string[],
    userPrompt: string,
    sessionId?: string
) {
    console.log(`♻️ [RegenSpec] REGENERATING '${targetSpec.path}'...`);
    console.log(`   👉 Prompt: "${userPrompt}"`);
    console.log(`   👉 Context: ${secondaryContext?.length || 0} items (${secondaryContext?.map((s: any) => s.path).join(', ')})`);

    try {
        const ai = new AIService(sessionId);
        const result = await ai.regeneratePageSpecs(
            targetSpec,
            primarySource,
            secondaryContext,
            sitemapPaths,
            userPrompt
        );
        console.log(`✅ [RegenSpec] Success for '${targetSpec.path}'.`);
        return { success: true, data: result };
    } catch (error: any) {
        console.error(`❌ [RegenSpec] Failed for '${targetSpec.path}':`, error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// CLUSTER COMPONENT ARCHITECTURE ACTIONS
// ============================================================================

export async function generateClusterComponentsAction(samples: { url: string, html: string }[], clusterId: string) {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Flatten mock library groups to get components
        const mockComponents = MOCK_COMPONENT_LIBRARY.groups.flatMap(g => g.components);
        return { success: true, data: { clusterId, components: mockComponents } };
    }
    try {
        const ai = new AIService();
        const components = await ai.generateClusterComponents(samples);
        return { success: true, data: { clusterId, components } };
    } catch (error: any) {
        console.error('AI Error (Cluster Components):', error);
        return { success: false, error: error.message };
    }
}

export async function mapClusterInstancesAction(pageHtml: string, pageUrl: string, componentSpec: any) {
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Return dummy mapped data
        return { success: true, data: { components: [{ name: 'Hero', props: { title: 'Mock Mapped Page' } }] } };
    }
    try {
        const ai = new AIService();
        const data = await ai.mapPageToComponents(pageHtml, componentSpec);
        return { success: true, data };
    } catch (error: any) {
        console.error('AI Error (Cluster Mapping):', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// LANGUAGE VARIANT DETECTION ACTIONS
// ============================================================================

/**
 * Detects language variants using AI-powered 3-level detection system
 *
 * @param structure The site structure to analyze
 * @param config Optional configuration for detection thresholds
 * @returns Updated structure with variant links
 */
export async function detectLanguageVariantsAction(
    structure: SiteStructure,
    config?: Partial<import('@/types').VariantDetectionConfig>
) {
    console.log('🌍 [VariantDetect] Starting language variant detection...');

    try {
        const { detectAndLinkVariants } = await import('@/modules/core/utils/normalization');
        const updatedStructure = await detectAndLinkVariants(structure, config);

        // Count variants
        const variantCount = updatedStructure.nodes.filter(n => n.variants && n.variants.length > 0).length;

        console.log(`✅ [VariantDetect] Completed. ${variantCount} pages have variants.`);

        return {
            success: true,
            data: updatedStructure,
            stats: { variantCount }
        };
    } catch (error: any) {
        console.error('❌ [VariantDetect] Error:', error);
        return { success: false, error: error.message };
    }
}
