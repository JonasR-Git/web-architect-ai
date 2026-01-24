import { NextRequest, NextResponse } from 'next/server';
import { WebCrawler } from '@/modules/analysis/crawler/crawler';
import { MOCK_SITE_STRUCTURE } from '@/data/mocks';

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
                // Full site crawl - up to 1000 pages, unlimited depth, 5 parallel workers
                const crawler = new WebCrawler({ maxPages: 1000, maxDepth: 10, concurrency: 5 });

                send('log', { message: `INIT: Starting FULL site crawl for ${url} (5 workers, no limit)...`, type: 'info' });

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
                send('complete', structure);

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
