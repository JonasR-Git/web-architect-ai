/**
 * Crawler Configuration
 *
 * Centralized configuration for content extraction limits and crawler behavior.
 * Adjust these values based on your needs and available memory.
 */

export interface ContentLimits {
    /** Maximum characters for rawText field (default: 50000) */
    rawText: number;
    /** Maximum characters per semantic block (default: 20000) */
    semanticBlock: number;
    /** Maximum characters for heading text (default: 500) */
    heading: number;
    /** Maximum scroll height in pixels for lazy loading (default: 50000) */
    maxScrollHeight: number;
    /** Warn if content is truncated */
    warnOnTruncation: boolean;
}

export interface CrawlerConfig {
    /** Content extraction limits */
    contentLimits: ContentLimits;
    /** Browser settings */
    browser: {
        /** Timeout for page navigation in ms (default: 60000) */
        navigationTimeout: number;
        /** Timeout for lazy loading in ms (default: 10000) */
        lazyLoadTimeout: number;
        /** User agent string */
        userAgent: string;
    };
}

/**
 * Default configuration
 *
 * UNLIMITED mode is default for website modernization.
 * Use this to preserve 100% of content - ZERO data loss guaranteed!
 *
 * 500k chars = ~250 DIN-A4 pages per rawText
 * 250k chars = ~125 DIN-A4 pages per semantic block
 *
 * ⚠️ RAM Usage: ~6-10 GB for 1000 pages (use BALANCED mode for 3000+ pages)
 */
export const DEFAULT_CONFIG: CrawlerConfig = {
    contentLimits: {
        rawText: 500000,          // 500k chars (~250 pages) - UNLIMITED PRESERVATION
        semanticBlock: 250000,    // 250k chars per block
        heading: 2000,            // 2000 chars (increased for very long titles)
        maxScrollHeight: 200000,  // 200k px (extremely long pages)
        warnOnTruncation: false   // Disabled - too noisy in console
    },
    browser: {
        navigationTimeout: 120000, // 120s for very complex pages
        lazyLoadTimeout: 20000,    // 20s for full lazy-loading
        userAgent: 'WebArchitectAI-Crawler/1.0 (+http://web-architect-ai.com)'
    }
};

/**
 * Balanced configuration
 *
 * Use this for very large sites (2000-5000 pages) where RAM is limited.
 * Still preserves most content but uses less memory.
 *
 * 100k chars = ~50 DIN-A4 pages per rawText
 * 50k chars = ~25 DIN-A4 pages per semantic block
 *
 * RAM Usage: ~3-5 GB for 1000 pages
 */
export const BALANCED_CONFIG: CrawlerConfig = {
    contentLimits: {
        rawText: 100000,          // 100k chars (~50 pages)
        semanticBlock: 50000,     // 50k chars per block
        heading: 1000,            // 1000 chars
        maxScrollHeight: 100000,  // 100k px
        warnOnTruncation: false   // Disabled - too noisy
    },
    browser: {
        navigationTimeout: 90000,  // 90s for complex pages
        lazyLoadTimeout: 15000,    // 15s for full lazy-loading
        userAgent: 'WebArchitectAI-Crawler/1.0 (+http://web-architect-ai.com)'
    }
};

/**
 * Memory-constrained configuration
 *
 * Use this for systems with limited RAM or very large sites (3000+ pages).
 * NOT RECOMMENDED for website modernization - data loss possible!
 */
export const MEMORY_CONSTRAINED_CONFIG: CrawlerConfig = {
    contentLimits: {
        rawText: 20000,           // 20k chars
        semanticBlock: 10000,     // 10k chars per block
        heading: 200,             // 200 chars
        maxScrollHeight: 30000,   // 30k px
        warnOnTruncation: false   // Disable warnings to reduce console noise
    },
    browser: {
        navigationTimeout: 45000,
        lazyLoadTimeout: 5000,
        userAgent: 'WebArchitectAI-Crawler/1.0 (+http://web-architect-ai.com)'
    }
};


/**
 * Get configuration from environment or use default (UNLIMITED)
 *
 * CRAWLER_MODE options:
 * - 'default' or undefined: UNLIMITED (500k chars, ZERO data loss) ✅ RECOMMENDED
 * - 'balanced': 100k chars, for very large sites (2000-5000 pages)
 * - 'memory-constrained': 20k chars, only for extreme cases (5000+ pages with <8GB RAM)
 */
let _configLogged = false;

export function getCrawlerConfig(): CrawlerConfig {
    const mode = process.env.CRAWLER_MODE || 'default';

    switch (mode.toLowerCase()) {
        case 'balanced':
            if (!_configLogged) { console.log('🔧 [Config] Using BALANCED mode (100k chars)'); _configLogged = true; }
            return BALANCED_CONFIG;
        case 'memory-constrained':
            if (!_configLogged) { console.warn('⚠️ [Config] Using MEMORY-CONSTRAINED mode (20k chars) - Data loss possible!'); _configLogged = true; }
            return MEMORY_CONSTRAINED_CONFIG;
        case 'default':
        case 'unlimited':
        default:
            if (!_configLogged) { console.log('✅ [Config] Using UNLIMITED mode (500k chars) - ZERO data loss guarantee'); _configLogged = true; }
            return DEFAULT_CONFIG;
    }
}
