import puppeteer, { Browser, Page } from 'puppeteer';
import { EventEmitter } from 'events';
import { SiteNode, SiteStructure } from '@/types';
import { extractPageData } from './extractor';
import { URL } from 'url';

interface CrawlerOptions {
    maxDepth?: number;
    maxPages?: number;
    concurrency?: number; // Not heavily used in this simple BFS but structured for it
}

export class WebCrawler extends EventEmitter {
    private visited: Set<string> = new Set();
    private queue: { url: string; depth: number }[] = [];
    private nodes: SiteNode[] = [];
    private browser: Browser | null = null;
    private rootUrl: string = '';
    private options: CrawlerOptions;
    private isRunning: boolean = false;

    constructor(options: CrawlerOptions = {}) {
        super();
        this.options = {
            maxDepth: 3,
            maxPages: 100,
            concurrency: 3, // Parallel workers for faster crawling
            ...options,
        };
    }

    /**
     * Normalize URL to avoid duplicates (strip trailing slash, hash, and query params)
     * Handles relative URLs if baseUrl is provided
     */
    private normalizeUrl(urlStr: string, baseUrl?: string): string {
        try {
            // Resolve relative URLs against base
            const u = baseUrl ? new URL(urlStr, baseUrl) : new URL(urlStr);

            u.hash = '';
            u.search = ''; // STRIP ALL QUERY PARAMS to avoid infinite traps
            if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
                u.pathname = u.pathname.slice(0, -1);
            }
            // Enforce lowercase to avoid duplicates (e.g. /Contact vs /contact)
            return u.toString().toLowerCase();
        } catch (e) {
            return '';
        }
    }

    private isValidInternalUrl(urlStr: string): boolean {
        try {
            const u = new URL(urlStr);
            const root = new URL(this.rootUrl);

            // 1. Hostname check
            if (u.hostname !== root.hostname && !u.hostname.endsWith('.' + root.hostname)) {
                return false;
            }

            // 2. Extension check (Skip non-html assets)
            const lowerPath = u.pathname.toLowerCase();
            const IGNORED_EXTENSIONS = [
                '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
                '.pdf', '.zip', '.rar', '.tar', '.gz', '.7z',
                '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                '.mp3', '.mp4', '.avi', '.mov', '.wmv',
                '.css', '.js', '.xml', '.json', '.txt', '.woff', '.woff2'
            ];
            if (IGNORED_EXTENSIONS.some(ext => lowerPath.endsWith(ext))) {
                return false;
            }

            // 3. Smart Archive Filter: Skip year-based archive paths (e.g. /2020/07/ or /2022/)
            // This prevents crawling thousands of old blog/news pages.
            // Matches /20XX/ anywhere in the path.
            if (/\/20\d{2}\//.test(lowerPath)) {
                return false;
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    async start(startUrl: string): Promise<SiteStructure> {
        if (this.isRunning) throw new Error('Crawler is already running');

        this.isRunning = true;
        // Normalize startUrl without base (it must be absolute)
        this.rootUrl = this.normalizeUrl(startUrl);
        if (!this.rootUrl) throw new Error('Invalid start URL');

        this.visited.clear();
        this.queue = [{ url: this.rootUrl, depth: 0 }];
        this.nodes = [];

        this.emit('start', { url: this.rootUrl });

        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            await this.crawlLoop();

        } catch (error) {
            console.error('Crawler failed:', error);
            this.emit('error', error);
        } finally {
            if (this.browser) await this.browser.close();
            this.isRunning = false;
            this.emit('complete', { nodes: this.nodes });
        }

        return {
            rootUrl: this.rootUrl,
            nodes: this.nodes,
            crawledAt: new Date().toISOString(),
        };
    }

    private async crawlLoop() {
        let pagesProcessed = 0;
        const concurrency = this.options.concurrency || 5;
        const activeWorkers: Promise<void>[] = [];

        // Pending URLs being processed (to avoid race conditions)
        const inProgress = new Set<string>();

        // Aggregated role tracking for periodic logging
        const roleCounts: Record<string, number> = {};
        const seenImages = new Set<string>(); // Deduplication
        let mainLogo: { src: string; score: number } | null = null; // Track highest-confidence logo
        let lastLoggedRoles = '';
        const LOG_INTERVAL = 20; // Log every N pages

        const processNextUrl = async (): Promise<void> => {
            // Check if we've hit the page limit
            if (this.options.maxPages && pagesProcessed >= this.options.maxPages) {
                return;
            }

            // Find next unprocessed URL from queue
            let current: { url: string; depth: number } | undefined;

            while (this.queue.length > 0) {
                const candidate = this.queue.shift();
                if (!candidate) continue;

                // Skip if already visited or currently being processed
                if (this.visited.has(candidate.url) || inProgress.has(candidate.url)) {
                    continue;
                }

                // Skip if too deep
                if (this.options.maxDepth && candidate.depth > this.options.maxDepth) {
                    continue;
                }

                current = candidate;
                break;
            }

            if (!current) {
                // No more URLs to process right now
                return;
            }

            // Mark as in-progress to prevent duplicate processing
            inProgress.add(current.url);
            this.visited.add(current.url);
            pagesProcessed++;

            this.emit('progress', {
                url: current.url,
                processed: pagesProcessed,
                queueLength: this.queue.length,
                activeWorkers: inProgress.size
            });

            try {
                const pageData = await this.processPage(current.url, current.depth);

                if (pageData) {
                    this.nodes.push(pageData);

                    // Aggregate image roles for periodic summary (deduplicated)
                    for (const img of pageData.content.images || []) {
                        const src = (img as any).src;
                        if (!src || seenImages.has(src)) continue; // Skip duplicates
                        seenImages.add(src);

                        const role = (img as any).role || 'unknown';
                        roleCounts[role] = (roleCounts[role] || 0) + 1;

                        // Track main logo (highest logoProb)
                        if (role === 'logo') {
                            const logoScore = (img as any).logoProb || 0;
                            if (!mainLogo || logoScore > mainLogo.score) {
                                mainLogo = { src, score: logoScore };
                            }
                        }
                    }

                    // Log role summary every N pages (if changed)
                    if (pagesProcessed % LOG_INTERVAL === 0) {
                        const summary = Object.entries(roleCounts)
                            .filter(([role]) => role !== 'unknown' && role !== 'decoration')
                            .sort((a, b) => b[1] - a[1])
                            .map(([role, count]) => `${role}: ${count}`)
                            .join(', ');

                        if (summary && summary !== lastLoggedRoles) {
                            console.log(`[ImageRoles] ${summary}`);
                            lastLoggedRoles = summary;
                        }
                    }

                    // Add internal links to queue
                    for (const linkObj of pageData.content.links) {
                        const normalized = this.normalizeUrl(linkObj.href, current.url);
                        if (
                            normalized &&
                            this.isValidInternalUrl(normalized) &&
                            !this.visited.has(normalized) &&
                            !inProgress.has(normalized)
                        ) {
                            const inQueue = this.queue.some(q => q.url === normalized);
                            if (!inQueue) {
                                this.queue.push({ url: normalized, depth: current.depth + 1 });
                            }
                        }
                    }
                }
            } finally {
                inProgress.delete(current.url);
            }

            // Small delay between requests to be polite to the server
            await new Promise(r => setTimeout(r, 100));
        };

        // Start initial workers
        const startWorkers = () => {
            while (activeWorkers.length < concurrency && this.queue.length > 0) {
                const worker = processNextUrl().then(() => {
                    // Remove this worker from active list when done
                    const idx = activeWorkers.indexOf(worker);
                    if (idx > -1) activeWorkers.splice(idx, 1);
                });
                activeWorkers.push(worker);
            }
        };

        // Main loop: keep starting workers until queue is empty and all workers done
        while (this.queue.length > 0 || activeWorkers.length > 0 || inProgress.size > 0) {
            if (this.options.maxPages && pagesProcessed >= this.options.maxPages) break;

            startWorkers();

            // Wait for at least one worker to complete before checking again
            if (activeWorkers.length > 0) {
                await Promise.race(activeWorkers);
            } else {
                // No workers and no queue - we're done
                break;
            }
        }

        // Final role summary at end of crawl
        const finalSummary = Object.entries(roleCounts)
            .filter(([role]) => role !== 'unknown' && role !== 'decoration')
            .sort((a, b) => b[1] - a[1])
            .map(([role, count]) => `${role}: ${count}`)
            .join(', ');

        if (finalSummary) {
            console.log(`[ImageRoles] Final: ${finalSummary}`);
        }
        if (mainLogo) {
            console.log(`[MainLogo] ${(mainLogo as any).src} (score: ${(mainLogo as any).score})`);
        }
    }

    private async processPage(url: string, depth: number): Promise<SiteNode | null> {
        if (!this.browser) return null;
        let page: Page | null = null;
        try {
            page = await this.browser.newPage();
            await page.setUserAgent('WebArchitectAI-Crawler/1.0 (+http://web-architect-ai.com)');

            // Increased timeout for "deep crawl"
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // --- LAZY LOAD HACK: Dynamic Infinite Scroll (Advanced) ---
            await page.evaluate(async () => {
                const distance = 200; // Chunk size
                const delay = 150; // Wait time
                let scrollY = 0;
                let noChangeCount = 0;

                // Keep scrolling until height stops growing or limit reached
                while (noChangeCount < 3) {
                    const currentHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    scrollY += distance;

                    // Check if we hit bottom (approx)
                    if ((window.innerHeight + window.scrollY) >= currentHeight - 50) {
                        // Wait longer at bottom for network
                        await new Promise(resolve => setTimeout(resolve, 800));
                        const newHeight = document.body.scrollHeight;
                        if (newHeight > currentHeight) {
                            noChangeCount = 0; // Content grew, reset retry count
                        } else {
                            noChangeCount++; // No change, increment retry count
                        }
                    } else {
                        noChangeCount = 0; // Still scrolling
                    }

                    await new Promise(resolve => setTimeout(resolve, delay));

                    // Safety break (approx 30,000px height limit)
                    if (scrollY > 30000) break;
                }

                // Scroll back up to ensure we capture top elements in viewport-relative checks
                window.scrollTo(0, 0);
            });
            // Final settlement wait for images to paint
            await new Promise(r => setTimeout(r, 2000));
            // --------------------------------------------------------

            const data = await extractPageData(page, url);
            // Deduplication Fix: Enforce normalized URL (lowercase)
            data.url = this.normalizeUrl(url);
            data.depth = depth;

            // NEW: Run heuristic audit (Non-AI)
            const { auditPage } = await import('./auditor');
            data.score = auditPage(data);

            return data;

        } catch (error: any) {
            const msg = error.message || '';
            if (msg.includes('ERR_TOO_MANY_REDIRECTS')) {
                console.warn(`Skipped ${url}: Redirect Loop`);
            } else if (msg.includes('Timeout') || msg.includes('timed out')) {
                console.warn(`Skipped ${url}: Timeout (45s)`);
            } else {
                console.warn(`Failed to process ${url}:`, msg);
            }
            // Emit as 'page-error' but maybe with cleaner type for UI?
            this.emit('page-error', { url, error: msg });
            return null;
        } finally {
            if (page) await page.close();
        }
    }
}
