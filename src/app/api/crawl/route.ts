import { NextRequest, NextResponse } from 'next/server';
import { WebCrawler } from '@/modules/analysis/crawler/crawler';
import { MOCK_SITE_STRUCTURE } from '@/data/mocks';
import { AIService } from '@/modules/core/ai-service';

// Helper for encoding SSE data
const encoder = new TextEncoder();
function createSSEMessage(event: string, data: any) {
    return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const USE_MOCK = process.env.USE_MOCK === 'true' || !process.env.OPENROUTER_API_KEY;

    const stream = new ReadableStream({
        async start(controller) {
            // Helper to send events
            const send = (event: string, data: any) => {
                try {
                    controller.enqueue(createSSEMessage(event, data));
                } catch (e) {
                    // Ignore if controller is closed
                }
            };

            if (USE_MOCK) {
                send('log', { message: `INIT: Mock mode enabled. Connecting to ${url}...`, type: 'info' });
                await new Promise(r => setTimeout(r, 800));

                send('log', { message: 'CRAWLER: Starting BFS traversal...', type: 'info' });
                await new Promise(r => setTimeout(r, 800));

                // Simulate progress
                const totalPages = MOCK_SITE_STRUCTURE.nodes.length;
                for (let i = 0; i < totalPages; i++) {
                    const node = MOCK_SITE_STRUCTURE.nodes[i];
                    send('progress', {
                        url: node.url,
                        processed: i + 1,
                        queueLength: totalPages - (i + 1),
                        found: totalPages
                    });
                    send('log', { message: `CRAWLER: Indexed ${node.url} (${node.meta.title})`, type: 'info' });
                    await new Promise(r => setTimeout(r, 600));
                }

                send('complete', MOCK_SITE_STRUCTURE);
                controller.close();
                return;
            }

            // Real Crawler Logic
            try {
                // Full site crawl - up to 25000 pages, unlimited depth, 20 parallel workers
                const crawler = new WebCrawler({ maxPages: 25000, maxDepth: 20, concurrency: 20 });

                send('log', { message: `INIT: Starting FULL site crawl for ${url} (20 workers, no limit)...`, type: 'info' });

                // Forward crawler events to SSE
                crawler.on('start', (data) => {
                    send('log', { message: `CRAWLER: Initialized at ${data.url}`, type: 'info' });
                });

                crawler.on('progress', (data) => {
                    // data: { url, processed, queueLength, activeWorkers }
                    send('progress', {
                        url: data.url,
                        processed: data.processed,
                        queueLength: data.queueLength,
                        found: data.processed + data.queueLength,
                        activeWorkers: data.activeWorkers || 1
                    });
                });

                crawler.on('page-error', (data) => {
                    send('log', { message: `CRAWLER: Error on ${data.url} - ${data.error.message || data.error}`, type: 'warning' });
                });

                crawler.on('error', (error) => {
                    // This is a fatal error during crawl
                    console.error('Crawler Fatal Error:', error);
                    send('error', { message: error.message || 'Unknown crawler error' });
                });

                // Start the crawl
                const structure = await crawler.start(url);

                // Log summary instead of full JSON
                const totalImages = structure.nodes.reduce((sum, n) => sum + (n.content?.images?.length || 0), 0);
                console.log(`[Crawl Complete] ${structure.nodes.length} pages, ${totalImages} images from ${structure.rootUrl}`);

                // Send completion event
                // --- SEMANTIC BRANCH ANALYSIS ---
                // 1. Extract Branch Candidates
                const branches: any[] = [];
                const seenPaths = new Set();

                // Language prefixes to skip (handled by language normalization, not branch merging)
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

                        // For paths under language prefixes (e.g., /en/services),
                        // strip the prefix to get the actual branch (e.g., /services)
                        let branchParts = parts;
                        if (parts.length >= 1 && langPrefixes.has(parts[0].toLowerCase())) {
                            branchParts = parts.slice(1);
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
                    send('log', { message: `AI: Analyzing ${branches.length} branch roots for semantic merging...`, type: 'info' });
                    const ai = new AIService();
                    const rawMerges = await ai.analyzeBranchStructure(branches) as any;

                    // Safety: Filter out single-source "renames" (AI should not rename a branch with no equivalent)
                    semanticMerges = {
                        merges: (rawMerges?.merges || []).filter((m: any) => {
                            if (!m.sources || m.sources.length < 2) {
                                console.log(`[BranchAnalysis] Skipping single-source merge: ${m.concept} <- ${m.sources}`);
                                return false;
                            }
                            return true;
                        })
                    };
                    send('log', { message: `AI: Found ${semanticMerges.merges.length} semantic clusters.`, type: 'success' });
                }

                // Send completion event with Merges
                send('complete', { ...structure, semanticMerges });

            } catch (error: any) {
                console.error('Stream Error:', error);
                send('error', { message: error.message || 'Internal server error' });
            } finally {
                try { controller.close(); } catch (e) { }
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
