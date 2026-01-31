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

        // We still need 'grouped' for the UI clusters metadata (Using Normalized Structure!)
        const grouped = groupSimilarPages(normalizedStructure, 3, 5, overrides);

        const data = await ai.generateMigrationPlan(normalizedStructure, userInstructions, overrides, semanticMerges);

        // ENHANCED: Content-based Cluster Analysis
        console.log('📊 [ContentAnalysis] Analyzing cluster similarity...');
        const { ContentSimilarityAnalyzer } = await import('@/modules/analysis/services/content-similarity-analyzer');

        // --- Cluster Data Population for Cluster Component Architecture ---
        const clusters: ClusterSpec[] = grouped.groups.map((group, idx) => {
            const instances: PageInstance[] = group.allUrls.map(url => {
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

        // Attach clusters to result
        if (data) {
            (data as any).clusters = clusters;

            // Enrich migration plan with content-based tags
            if (clusters.length > 0) {
                const enrichedData = ContentSimilarityAnalyzer.enrichMigrationPlanWithTags(
                    data,
                    clusters,
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
