import { Page } from 'puppeteer';
import { SiteNode, DesignSystemColors, ColorAnalysis } from '@/types';
import * as cheerio from 'cheerio';
import { cleanHtmlForAI } from '@/modules/core/utils/cleaning';
import { getCrawlerConfig } from './config';
import { ImageColorAnalyzer } from '../services/image-color-analyzer';
import { FormAnalyzer } from '../services/form-analyzer';
import { LinkAnalyzer } from '../services/link-analyzer';
import { DesignSystemExtractor } from '../services/design-system-extractor';
import { ContentTypeDetector } from '../services/content-type-detector';
import { MediaAnalyzer } from '../services/media-analyzer';

// --- ADVANCED IMAGE INTELLIGENCE: Role Types ---
type ImageRole =
    | 'logo'
    | 'hero-background'
    | 'hero-foreground'
    | 'gallery'
    | 'team-avatar'
    | 'testimonial'
    | 'product'
    | 'icon'
    | 'sponsor-logo'
    | 'section-feature'   // NEW: Instrument sections, department showcases
    | 'event-photo'       // NEW: Concert/event imagery
    | 'award-badge'       // NEW: Awards, certifications, badges
    | 'location-photo'    // NEW: Venue, location imagery
    | 'cta-image'         // NEW: Call-to-action backgrounds
    | 'blog-thumbnail'    // NEW: Blog/article preview images
    | 'decoration'
    | 'content'
    | 'unknown';

interface ClassifiedImage {
    src: string;
    alt: string;
    context?: string;
    isLogo?: boolean;
    logoProb?: number;
    // NEW: Semantic classification
    role: ImageRole;
    roleConfidence: number;
    componentHint: string | null;
    groupId: string | null;
    usage: {
        isBackground: boolean;
        isCritical: boolean;
        suggestedSize: 'full' | 'medium' | 'thumbnail';
    };
    // NEW: Source page context
    sourcePageUrl?: string;
    // NEW: Color analysis for design system extraction
    colorAnalysis?: ColorAnalysis;
    // NEW: Dimensions for size-based heuristics & duplicate detection
    width?: number;
    height?: number;
    // NEW: Duplicate management (if this is a smaller version of another image)
    masterImage?: string; // src of the larger version
    variants?: string[];  // srcs of smaller versions (if this is the master)
}

// --- PATH-BASED ROLE DETECTION (Highest Priority) ---
const PATH_ROLE_PATTERNS: Array<{ pattern: RegExp; role: ImageRole; confidence: number; hint: string }> = [
    // Sponsor/Partner paths
    { pattern: /\/sponsors?\//i, role: 'sponsor-logo', confidence: 95, hint: 'SponsorSection' },
    { pattern: /\/partners?\//i, role: 'sponsor-logo', confidence: 95, hint: 'PartnerSection' },
    { pattern: /\/clients?\//i, role: 'sponsor-logo', confidence: 90, hint: 'ClientLogos' },
    { pattern: /\/foerder/i, role: 'sponsor-logo', confidence: 90, hint: 'SponsorSection' },
    { pattern: /\/unterstuetz/i, role: 'sponsor-logo', confidence: 85, hint: 'SponsorSection' },

    // Section/Instrument/Department paths
    { pattern: /\/register\//i, role: 'section-feature', confidence: 95, hint: 'SectionShowcase' },
    { pattern: /\/instruments?\//i, role: 'section-feature', confidence: 95, hint: 'InstrumentSection' },
    { pattern: /\/sections?\//i, role: 'section-feature', confidence: 90, hint: 'SectionShowcase' },
    { pattern: /\/abteilung/i, role: 'section-feature', confidence: 90, hint: 'DepartmentSection' },
    { pattern: /\/departments?\//i, role: 'section-feature', confidence: 90, hint: 'DepartmentSection' },
    { pattern: /\/bereiche?\//i, role: 'section-feature', confidence: 85, hint: 'SectionShowcase' },

    // Gallery/Portfolio paths
    { pattern: /\/gallery\//i, role: 'gallery', confidence: 95, hint: 'GalleryGrid' },
    { pattern: /\/galerie\//i, role: 'gallery', confidence: 95, hint: 'GalleryGrid' },
    { pattern: /\/portfolio\//i, role: 'gallery', confidence: 95, hint: 'PortfolioGrid' },
    { pattern: /\/thumbnails?\//i, role: 'gallery', confidence: 90, hint: 'GalleryGrid' },
    { pattern: /\/fotos?\//i, role: 'gallery', confidence: 85, hint: 'PhotoGallery' },
    { pattern: /\/bilder\//i, role: 'gallery', confidence: 85, hint: 'ImageGallery' },
    { pattern: /\/impressionen\//i, role: 'gallery', confidence: 90, hint: 'GalleryGrid' },

    // Team/Staff paths
    { pattern: /\/team\//i, role: 'team-avatar', confidence: 95, hint: 'TeamSection' },
    { pattern: /\/staff\//i, role: 'team-avatar', confidence: 95, hint: 'TeamSection' },
    { pattern: /\/members?\//i, role: 'team-avatar', confidence: 90, hint: 'TeamSection' },
    { pattern: /\/mitglieder\//i, role: 'team-avatar', confidence: 95, hint: 'TeamSection' },
    { pattern: /\/personen?\//i, role: 'team-avatar', confidence: 85, hint: 'TeamSection' },
    { pattern: /\/leitung\//i, role: 'team-avatar', confidence: 90, hint: 'LeadershipSection' },
    { pattern: /\/vorstand\//i, role: 'team-avatar', confidence: 90, hint: 'BoardSection' },
    { pattern: /\/authors?\//i, role: 'team-avatar', confidence: 85, hint: 'AuthorSection' },

    // Event/Concert paths
    { pattern: /\/events?\//i, role: 'event-photo', confidence: 90, hint: 'EventGallery' },
    { pattern: /\/concerts?\//i, role: 'event-photo', confidence: 95, hint: 'ConcertGallery' },
    { pattern: /\/konzerte?\//i, role: 'event-photo', confidence: 95, hint: 'ConcertGallery' },
    { pattern: /\/veranstaltung/i, role: 'event-photo', confidence: 90, hint: 'EventSection' },
    { pattern: /\/termine?\//i, role: 'event-photo', confidence: 85, hint: 'EventSection' },

    // Product/Shop paths
    { pattern: /\/products?\//i, role: 'product', confidence: 95, hint: 'ProductGrid' },
    { pattern: /\/produkte?\//i, role: 'product', confidence: 95, hint: 'ProductGrid' },
    { pattern: /\/shop\//i, role: 'product', confidence: 90, hint: 'ShopGrid' },

    // Blog/Article paths (NEW)
    { pattern: /\/blog[\/\-_]/i, role: 'blog-thumbnail', confidence: 90, hint: 'BlogGrid' },
    { pattern: /\/posts?[\/\-_]/i, role: 'blog-thumbnail', confidence: 85, hint: 'BlogGrid' },
    { pattern: /\/artikel[\/\-_]/i, role: 'blog-thumbnail', confidence: 85, hint: 'ArticleGrid' },
    { pattern: /\/news[\/\-_]/i, role: 'blog-thumbnail', confidence: 85, hint: 'NewsGrid' },
    { pattern: /\/aktuelles[\/\-_]/i, role: 'blog-thumbnail', confidence: 85, hint: 'NewsGrid' },
    { pattern: /\/beitr[aä]ge?\//i, role: 'blog-thumbnail', confidence: 85, hint: 'BlogGrid' },

    // Award/Badge paths
    { pattern: /\/awards?\//i, role: 'award-badge', confidence: 95, hint: 'AwardsSection' },
    { pattern: /\/badges?\//i, role: 'award-badge', confidence: 90, hint: 'BadgesSection' },
    { pattern: /\/certif/i, role: 'award-badge', confidence: 90, hint: 'CertificationSection' },
    { pattern: /\/auszeichnung/i, role: 'award-badge', confidence: 95, hint: 'AwardsSection' },

    // Location paths
    { pattern: /\/locations?\//i, role: 'location-photo', confidence: 90, hint: 'LocationSection' },
    { pattern: /\/venues?\//i, role: 'location-photo', confidence: 90, hint: 'VenueSection' },
    { pattern: /\/standorte?\//i, role: 'location-photo', confidence: 90, hint: 'LocationSection' },

    // Hero/Banner paths
    { pattern: /\/hero/i, role: 'hero-background', confidence: 95, hint: 'HeroSection' },
    { pattern: /\/banner/i, role: 'hero-background', confidence: 90, hint: 'HeroSection' },
    { pattern: /\/slider/i, role: 'hero-background', confidence: 85, hint: 'HeroSlider' },

    // Icon paths
    { pattern: /\/icons?\//i, role: 'icon', confidence: 95, hint: 'FeatureSection' },
];

// --- CSS CONTEXT PATTERNS ---
const CSS_CONTEXT_PATTERNS: Array<{ pattern: RegExp; role: ImageRole; confidence: number; hint: string }> = [
    // Sponsor contexts
    { pattern: /sponsor|partner|client|förder|unterstütz/i, role: 'sponsor-logo', confidence: 85, hint: 'SponsorSection' },

    // Section/Instrument contexts
    { pattern: /instrument|register|section-|abteilung|bereich/i, role: 'section-feature', confidence: 80, hint: 'SectionShowcase' },

    // Gallery contexts
    { pattern: /gallery|galerie|lightbox|fancybox|photoswipe|masonry|portfolio/i, role: 'gallery', confidence: 85, hint: 'GalleryGrid' },

    // Team contexts
    { pattern: /team|staff|member|mitglied|person|author|avatar|profile|leitung/i, role: 'team-avatar', confidence: 80, hint: 'TeamSection' },

    // Testimonial contexts
    { pattern: /testimonial|quote|review|feedback|bewertung|referenz/i, role: 'testimonial', confidence: 80, hint: 'TestimonialSection' },

    // Product contexts
    { pattern: /product|produkt|shop|item|artikel|woocommerce|shopify/i, role: 'product', confidence: 80, hint: 'ProductGrid' },

    // Hero contexts
    { pattern: /hero|banner|jumbotron|masthead|splash|header-bg|fullscreen/i, role: 'hero-background', confidence: 85, hint: 'HeroSection' },

    // Event contexts
    { pattern: /event|concert|konzert|veranstaltung|termin|aufführung/i, role: 'event-photo', confidence: 75, hint: 'EventSection' },

    // CTA contexts
    { pattern: /cta|call-to-action|action-box|promo/i, role: 'cta-image', confidence: 80, hint: 'CTASection' },

    // Award contexts
    { pattern: /award|badge|certif|auszeichnung|siegel|zertifikat/i, role: 'award-badge', confidence: 80, hint: 'AwardsSection' },

    // Blog/Article contexts (NEW)
    { pattern: /blog|article|post|news|aktuelles|beitrag|entry/i, role: 'blog-thumbnail', confidence: 75, hint: 'BlogSection' },
];

// --- COMPREHENSIVE ROLE CLASSIFICATION ---
function classifyImageRole(
    src: string,
    alt: string,
    context: string,
    logoProb: number,
    isBackground: boolean,
    pageUrl?: string
): { role: ImageRole; confidence: number; componentHint: string | null } {
    const srcLower = src.toLowerCase();
    const altLower = alt.toLowerCase();
    const ctxLower = context.toLowerCase();
    const pageUrlLower = (pageUrl || '').toLowerCase();

    // --- PRIORITY 1: Logo Detection (highest priority) ---
    if (logoProb > 50) {
        return { role: 'logo', confidence: logoProb, componentHint: 'Navigation' };
    }

    // --- PRIORITY 1.5: SVG Exclusion for Photo Roles ---
    // SVGs are almost never hero backgrounds, gallery images, or team photos
    // They're typically logos, icons, or illustrations
    const isSvg = srcLower.endsWith('.svg');
    if (isSvg) {
        // Check if it's an icon or decoration
        if (srcLower.includes('icon') || srcLower.includes('ico/')) {
            return { role: 'icon', confidence: 85, componentHint: 'FeatureSection' };
        }
        // Default SVG to decoration (low priority) unless it's clearly a logo
        if (logoProb > 20) {
            return { role: 'logo', confidence: logoProb + 20, componentHint: 'Navigation' };
        }
        return { role: 'decoration', confidence: 60, componentHint: null };
    }

    // --- PRIORITY 2: Path-Based Detection (very reliable) ---
    for (const { pattern, role, confidence, hint } of PATH_ROLE_PATTERNS) {
        if (pattern.test(srcLower)) {
            return { role, confidence, componentHint: hint };
        }
    }

    // --- PRIORITY 3: Page URL Context Boost ---
    // If the image is from a specific page type, boost that role
    let urlContextRole: ImageRole | null = null;
    let urlContextConfidence = 0;

    if (pageUrlLower.includes('/sponsor') || pageUrlLower.includes('/partner')) {
        urlContextRole = 'sponsor-logo';
        urlContextConfidence = 70;
    } else if (pageUrlLower.includes('/blog') || pageUrlLower.includes('/post') || pageUrlLower.includes('/artikel') || pageUrlLower.includes('/news')) {
        urlContextRole = 'blog-thumbnail';
        urlContextConfidence = 75;
    } else if (pageUrlLower.includes('/gallery') || pageUrlLower.includes('/galerie')) {
        urlContextRole = 'gallery';
        urlContextConfidence = 70;
    } else if (pageUrlLower.includes('/team') || pageUrlLower.includes('/about') || pageUrlLower.includes('/ueber')) {
        urlContextRole = 'team-avatar';
        urlContextConfidence = 65;
    } else if (pageUrlLower.includes('/section') || pageUrlLower.includes('/register')) {
        urlContextRole = 'section-feature';
        urlContextConfidence = 70;
    } else if (pageUrlLower.includes('/event') || pageUrlLower.includes('/concert') || pageUrlLower.includes('/konzert')) {
        urlContextRole = 'event-photo';
        urlContextConfidence = 70;
    }

    // --- PRIORITY 4: CSS Context Analysis ---
    for (const { pattern, role, confidence, hint } of CSS_CONTEXT_PATTERNS) {
        if (pattern.test(ctxLower)) {
            // If URL context matches, boost confidence
            const finalConfidence = (urlContextRole === role) ? Math.min(confidence + 15, 95) : confidence;
            return { role, confidence: finalConfidence, componentHint: hint };
        }
    }

    // --- PRIORITY 5: Alt Text & Filename Analysis ---
    if (altLower.match(/logo|brand|marke/)) {
        return { role: 'logo', confidence: 60, componentHint: 'Navigation' };
    }
    if (altLower.match(/sponsor|partner|förder|unterstütz/)) {
        return { role: 'sponsor-logo', confidence: 70, componentHint: 'SponsorSection' };
    }
    if (altLower.match(/team|mitglied|staff|leiter|person/)) {
        return { role: 'team-avatar', confidence: 65, componentHint: 'TeamSection' };
    }
    if (altLower.match(/gallery|galerie|foto|bild|impression/)) {
        return { role: 'gallery', confidence: 60, componentHint: 'GalleryGrid' };
    }

    // NEW: Blog thumbnail detection via filename
    if (srcLower.match(/^(thumb|thumbnail|preview|featured)[-_]/i) ||
        srcLower.match(/[-_](thumb|thumbnail|preview|featured)\./i)) {
        return { role: 'blog-thumbnail', confidence: 75, componentHint: 'BlogGrid' };
    }

    // --- PRIORITY 6: URL Context Fallback ---
    if (urlContextRole) {
        return { role: urlContextRole, confidence: urlContextConfidence, componentHint: null };
    }

    // --- PRIORITY 7: Background Image Special Case ---
    if (isBackground) {
        if (ctxLower.includes('hero') || ctxLower.includes('header') || ctxLower.includes('banner')) {
            return { role: 'hero-background', confidence: 75, componentHint: 'HeroSection' };
        }
        if (ctxLower.includes('cta') || ctxLower.includes('action')) {
            return { role: 'cta-image', confidence: 70, componentHint: 'CTASection' };
        }
    }

    // --- PRIORITY 8: Icon Detection ---
    if (srcLower.endsWith('.svg') || srcLower.includes('icon') || srcLower.includes('/ico/')) {
        // But not if it's clearly a logo
        if (logoProb < 30) {
            return { role: 'icon', confidence: 65, componentHint: 'FeatureSection' };
        }
    }

    // --- PRIORITY 9: Content Image Fallback ---
    if (ctxLower.match(/article|blog|post|content|entry|main|body/)) {
        return { role: 'content', confidence: 50, componentHint: 'ContentSection' };
    }

    // --- PRIORITY 10: Footer Logo Variant ---
    if (ctxLower.includes('footer') && logoProb > 10) {
        return { role: 'sponsor-logo', confidence: 45, componentHint: 'Footer' };
    }

    return { role: 'unknown', confidence: 0, componentHint: null };
}

// ============================================================================
// LANGUAGE-AGNOSTIC PATH-BASED GROUPING
// ============================================================================

interface PathGroup {
    prefix: string;
    count: number;
    suggestedRole: ImageRole;
    confidence: number;
    images: string[];
}

/**
 * Groups images by common path prefix and infers roles based on quantity patterns.
 * This is language-agnostic - it works by analyzing structure, not keywords.
 */
function groupImagesByPath(images: ClassifiedImage[]): Map<string, PathGroup> {
    const pathCounts = new Map<string, string[]>();

    // Extract folder paths and group images
    for (const img of images) {
        try {
            const url = new URL(img.src);
            const pathParts = url.pathname.split('/').filter(p => p);

            // Get folder path (everything except filename)
            if (pathParts.length > 1) {
                const folderPath = '/' + pathParts.slice(0, -1).join('/') + '/';
                const existing = pathCounts.get(folderPath) || [];
                existing.push(img.src);
                pathCounts.set(folderPath, existing);
            }
        } catch (e) {
            // Invalid URL, skip
        }
    }

    // Analyze groups and suggest roles based on count patterns
    const groups = new Map<string, PathGroup>();

    for (const [prefix, srcs] of pathCounts.entries()) {
        const count = srcs.length;
        let suggestedRole: ImageRole = 'unknown';
        let confidence = 0;

        // Quantity-based role inference (language-agnostic!)
        if (count >= 10) {
            // Large collection → likely gallery
            suggestedRole = 'gallery';
            confidence = 75 + Math.min(count - 10, 15); // Max 90
        } else if (count >= 4 && count <= 8) {
            // Medium collection → could be team, sponsors, or sections
            // Check if we can narrow it down
            suggestedRole = 'content'; // Default for medium groups
            confidence = 50;
        } else if (count === 1) {
            // Single image in folder → likely hero or special
            suggestedRole = 'hero-background';
            confidence = 40;
        }

        groups.set(prefix, {
            prefix,
            count,
            suggestedRole,
            confidence,
            images: srcs
        });
    }

    return groups;
}

/**
 * Apply path-based grouping to upgrade "unknown" images
 */
function applyPathGrouping(images: ClassifiedImage[]): void {
    const groups = groupImagesByPath(images);

    // Only upgrade images that are still "unknown"
    for (const img of images) {
        if (img.role !== 'unknown') continue;

        try {
            const url = new URL(img.src);
            const pathParts = url.pathname.split('/').filter(p => p);

            if (pathParts.length > 1) {
                const folderPath = '/' + pathParts.slice(0, -1).join('/') + '/';
                const group = groups.get(folderPath);

                // Only upgrade if group confidence is higher than current
                if (group && group.confidence > img.roleConfidence && group.suggestedRole !== 'unknown') {
                    img.role = group.suggestedRole;
                    img.roleConfidence = group.confidence;
                    img.groupId = folderPath;
                }
            }
        } catch (e) {
            // Invalid URL, skip
        }
    }

    // Logging moved to crawler level for aggregated summary
}


export async function extractPageData(page: Page, url: string): Promise<SiteNode> {
    // Aggregation containers
    let fullWordCount = 0;
    const allImages: ClassifiedImage[] = [];
    const allLinks: any[] = []; // Will be replaced with LinkAnalysis[] after analysis
    const allForms: any[] = []; // Will be replaced with FormAnalysis[] after analysis
    let aggregatedText = '';

    // Process ALL frames (including main frame)
    const frames = page.frames();
    const isFrameset = frames.length > 1;

    // We'll use the main frame for metadata
    const mainContent = await page.content();

    // Metadata (Keep from main frame - RAW)
    const $raw = cheerio.load(mainContent);
    const title = $raw('title').text() || '';
    const description = $raw('meta[name="description"]').attr('content') || '';
    const ogImage = $raw('meta[property="og:image"]').attr('content');
    const canonical = $raw('link[rel="canonical"]').attr('href');
    const robots = $raw('meta[name="robots"]').attr('content');
    const viewport = $raw('meta[name="viewport"]').attr('content');
    let lang = $raw('html').attr('lang');

    // Extract Hreflang Tags (Critical for Concept Mapping)
    const hreflangs: { lang: string; href: string }[] = [];
    $raw('link[rel="alternate"][hreflang]').each((_, el) => {
        const hLang = $raw(el).attr('hreflang');
        const hHref = $raw(el).attr('href');
        if (hLang && hHref) {
            hreflangs.push({ lang: hLang, href: hHref });
        }
    });

    // Fallback: URL-based language detection (e.g. /de/, /en/)
    if (!lang) {
        const urlObj = new URL(url);
        const firstSegment = urlObj.pathname.split('/')[1]; // ['', 'de', '...']
        if (firstSegment && /^[a-z]{2}$/i.test(firstSegment)) {
            lang = firstSegment.toLowerCase();
        }
    }
    const charset = $raw('meta[charset]').attr('charset') || $raw('meta[http-equiv="Content-Type"]').attr('content');

    const social = {
        ogTitle: $raw('meta[property="og:title"]').attr('content'),
        ogDescription: $raw('meta[property="og:description"]').attr('content'),
        twitterCard: $raw('meta[name="twitter:card"]').attr('content'),
        twitterSite: $raw('meta[name="twitter:site"]').attr('content'),
    };

    // --- EXTRACT FRAME/IFRAME SOURCES (Before Cleaning) ---
    // For framesets and iframes, extract source URLs from RAW HTML before cleaning removes them
    // This ensures we crawl frame content pages as separate pages
    const frameSourceUrls: { text: string; href: string }[] = [];
    $raw('frame[src], iframe[src]').each((_, el) => {
        const src = $raw(el).attr('src');
        const name = $raw(el).attr('name') || 'frame';
        if (src) {
            try {
                // Resolve relative frame sources against page URL
                const absolute = new URL(src, url).toString();
                frameSourceUrls.push({ text: `[Frame: ${name}]`, href: absolute });
            } catch (e) {
                // Invalid URL, skip
            }
        }
    });

    // --- CLEANING PHASE ---
    // For structural analysis, we want a clean DOM without hydration bloat
    const cleanContent = cleanHtmlForAI(mainContent, {
        removeScripts: true,
        removeStyles: true,
        removeComments: true,
        removeEmptyContainers: true,
        simplifyAttributes: true,
        extractNextData: true
    });

    // Use CLEANED content for main analysis
    const $main = cheerio.load(cleanContent);


    // Iterate Frames
    for (const frame of frames) {
        try {
            // Clean frame content too
            const rawFrameContent = await frame.content();
            const cleanFrameContent = cleanHtmlForAI(rawFrameContent, {
                removeScripts: true,
                removeStyles: true, // Keep styles off for frames too
                extractNextData: false // No need for next data in frames
            });

            const $ = cheerio.load(cleanFrameContent);
            const frameUrl = frame.url();

            // Images
            // Images & Logo Detection
            $('img').each((_, el) => {
                let src = $(el).attr('src');
                const dataSrc = $(el).attr('data-src') || $(el).attr('data-original');
                // Prefer data-src if src is a placeholder (data: or empty)
                if (dataSrc && (!src || src.startsWith('data:'))) {
                    src = dataSrc;
                }

                const alt = $(el).attr('alt') || '';
                const width = $(el).attr('width');
                const height = $(el).attr('height');

                // Check for Lightbox variants (High-Res)
                // Look at parent 'onclick' or 'href'
                const parentOnClick = $(el).closest('[onclick]').attr('onclick');
                if (parentOnClick) {
                    // Extract single quoted strings ending in image extensions
                    const match = parentOnClick.match(/['"]([^'"]+\.(jpg|jpeg|png|webp))['"]/i);
                    if (match && match[1]) {
                        // We found a high-res candidate!
                        // We can either replace src, or add it as a separate asset.
                        // For this use case (building a gallery), replacing src with high-res is often better.
                        src = match[1];
                    }
                }

                if (src && !src.startsWith('data:')) {
                    try {
                        src = new URL(src, frameUrl).toString(); // Resolve against FRAME url

                        // 1. Context Analysis (Where is it?)
                        // Get last 3 parents to define "habitat"
                        const parents = $(el).parents()
                            .map((i, p) => {
                                const tag = $(p).prop('tagName')?.toLowerCase() || 'div';
                                const id = $(p).attr('id') ? '#' + $(p).attr('id') : '';
                                const clArg = $(p).attr('class');
                                const cls = clArg ? '.' + clArg.split(' ')[0] : '';
                                return tag + id + cls;
                            })
                            .get()
                            .slice(0, 3)
                            .reverse()
                            .join(' > ');

                        // 2. Logo Heuristics (Is it the boss?)
                        let score = 0;
                        const lowerSrc = src.toLowerCase();
                        const lowerAlt = alt.toLowerCase();
                        const lowerContext = parents.toLowerCase();

                        // A. Filename/Alt signals
                        if (lowerSrc.includes('logo')) score += 40;
                        if (lowerAlt.includes('logo') || lowerAlt.includes('brand')) score += 30;
                        if (lowerSrc.endsWith('.svg')) score += 10; // SVGs are often logos

                        // B. Context signals
                        if (lowerContext.includes('nav') || lowerContext.includes('header')) score += 25;
                        if (lowerContext.includes('footer')) score += 10; // Footer logo

                        // C. Link signals (Wrapped in Home Link?)
                        const parentLink = $(el).closest('a').attr('href');
                        if (parentLink === '/' || parentLink === frameUrl) score += 20;

                        // Classify the image role
                        const classification = classifyImageRole(src, alt, parents, score, false);

                        // 3. Dimension-based hints (ENHANCED - stronger influence)
                        let dimensionHint: { roleHint?: string; confidenceBoost: number } = { confidenceBoost: 0 };
                        const w = parseInt(width || '0', 10);
                        const h = parseInt(height || '0', 10);

                        if (w > 0 && h > 0) {
                            const aspectRatio = w / h;
                            const minDim = Math.min(w, h);
                            const maxDim = Math.max(w, h);
                            const area = w * h;

                            // Very small images → likely icon (STRONG signal)
                            if (maxDim <= 64) {
                                dimensionHint = { roleHint: 'icon', confidenceBoost: 20 };
                            }
                            // Tiny images → definitely icon
                            else if (maxDim <= 32) {
                                dimensionHint = { roleHint: 'icon', confidenceBoost: 30 };
                            }
                            // Very large images → likely hero (STRONG signal)
                            else if (area > 1000000 && classification.role === 'content') { // > 1000x1000
                                dimensionHint = { roleHint: 'hero-foreground', confidenceBoost: 25 };
                            }
                            // Wide & large → hero background
                            else if (aspectRatio > 1.6 && maxDim >= 1200) {
                                dimensionHint = { roleHint: 'hero-background', confidenceBoost: 20 };
                            }
                            // Wide but medium → gallery or blog-thumbnail
                            else if (aspectRatio > 1.4 && maxDim >= 600 && maxDim < 1200) {
                                if (classification.role === 'content' || classification.role === 'unknown') {
                                    dimensionHint = { roleHint: 'blog-thumbnail', confidenceBoost: 15 };
                                }
                            }
                            // Square (0.9-1.1) → avatar/logo candidate
                            else if (aspectRatio >= 0.9 && aspectRatio <= 1.1 && minDim >= 80 && minDim <= 400) {
                                dimensionHint = { roleHint: 'team-avatar', confidenceBoost: 15 };
                            }
                            // Portrait (0.6-0.8) → team/person
                            else if (aspectRatio >= 0.6 && aspectRatio <= 0.85 && minDim >= 200) {
                                dimensionHint = { roleHint: 'team-avatar', confidenceBoost: 12 };
                            }
                        }

                        // Apply dimension boost to confidence
                        let finalConfidence = classification.confidence;
                        if (dimensionHint.roleHint) {
                            if (dimensionHint.roleHint === classification.role) {
                                // Boost existing classification
                                finalConfidence += dimensionHint.confidenceBoost;
                            } else if (classification.role === 'content' || classification.role === 'unknown') {
                                // Override weak classifications with strong dimension signals
                                classification.role = dimensionHint.roleHint as ImageRole;
                                finalConfidence = classification.confidence + dimensionHint.confidenceBoost;
                            }
                        }

                        allImages.push({
                            src,
                            alt,
                            context: parents,
                            isLogo: score > 50,
                            logoProb: score,
                            role: classification.role,
                            roleConfidence: Math.min(finalConfidence, 100), // Cap at 100
                            componentHint: classification.componentHint,
                            groupId: null, // Will be assigned in grouping phase
                            usage: {
                                isBackground: false,
                                isCritical: parents.includes('hero') || parents.includes('header'),
                                suggestedSize: classification.role === 'icon' ? 'thumbnail' : 'full'
                            },
                            width: w || undefined,
                            height: h || undefined
                        });
                    } catch (e) { }
                }
            });

            // Links
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                const text = $(el).text().trim();
                if (href) {
                    try {
                        // Resolve relative links against FRAME url
                        const absolute = new URL(href, frameUrl).toString();
                        allLinks.push({ text, href: absolute });
                    } catch (e) { }
                }
            });

            // Forms
            $('input, select, textarea').each((_, el) => {
                allForms.push({ hasLabel: !!$(el).attr('aria-label'), type: $(el).attr('type') });
            });

            // Text
            const bodyText = $('body').text();
            fullWordCount += bodyText.split(/\s+/).filter(w => w.length > 0).length;
            aggregatedText += bodyText + '\n\n';

            // --- OPTIMIZATION (Context-Aware Blocks) ---
            const semanticSelectors = [
                { type: 'header', selector: 'header, .header, #header' },
                { type: 'nav', selector: 'nav, .nav, .menu' },
                { type: 'hero', selector: '.hero, section.hero, #hero' },
                { type: 'main', selector: 'main, #main, .main-content' },
                { type: 'article', selector: 'article, .post, .entry' },
                { type: 'sidebar', selector: 'aside, .sidebar, #sidebar' },
                { type: 'footer', selector: 'footer, .footer, #footer' }
            ];

            // Extract blocks with selector reference
            semanticSelectors.forEach(({ type, selector }) => {
                $(selector).each((_, el) => {
                    const text = $(el).text().replace(/\s+/g, ' ').trim();
                    if (text.length > 20) { // Ignore empty/tiny blocks
                        // @ts-ignore - semanticBlocks will be aggregated later, currently local to frame
                        // We will attach to the SiteNode at the end.
                        // Actually, we need a container. 
                        // Let's create a frame-local semantic blocks array.
                    }
                });
            });

        } catch (e) {
            // Frame might be cross-origin or restricted
        }
    }

    // Add frame source URLs to links (for framesets)
    // These were extracted from raw HTML before cleaning to ensure frameset tags weren't removed
    allLinks.push(...frameSourceUrls);

    // Since semanticBlocks is a new feature, we need to implement it cleanly.
    // We'll traverse the MAIN frame ($main) specifically for structure, as cross-frame semantics are rare.

    const semanticBlocks: { type: any, content: string, selector: string }[] = [];
    const semanticSelectors = [
        { type: 'header', selector: 'header, .header, #header' },
        { type: 'nav', selector: 'nav, .nav, .menu' },
        { type: 'hero', selector: '.hero, section.hero, #hero' },
        { type: 'main', selector: 'main, #main, .main-content' },
        { type: 'article', selector: 'article, .post, .entry' },
        { type: 'sidebar', selector: 'aside, .sidebar, #sidebar' },
        { type: 'footer', selector: 'footer, .footer, #footer' },
        { type: 'section', selector: 'section:not(.hero)' } // Catch-all for sections
    ];

    semanticSelectors.forEach(({ type, selector }) => {
        $main(selector).each((i, el) => {
            // NEW: Build a "Structural Skeleton" of the block (Tags + Classes)
            // This allows the AI to see the actual design patterns (e.g. Tailwind grid)
            let skeleton = '';

            const traverse = (node: any, depth: number) => {
                if (depth > 3) return; // Prevent too deep nesting
                const $node = $main(node);
                const tag = node.tagName?.toLowerCase();
                if (!tag || ['script', 'style', 'noscript', 'svg'].includes(tag)) return;

                const id = $node.attr('id') ? ` id="${$node.attr('id')}"` : '';
                const cls = $node.attr('class') ? ` class="${$node.attr('class')}"` : '';

                skeleton += `<${tag}${id}${cls}>`;

                // Add text if it's a heading or button (crucial for context)
                if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a'].includes(tag)) {
                    const text = $node.text().trim().substring(0, 100);
                    if (text) skeleton += text;
                }

                // Recurse children
                $node.children().each((_, child) => traverse(child, depth + 1));

                skeleton += `</${tag}>`;
            };

            traverse(el, 0);

            // Basic deduplication check
            const isDuplicate = semanticBlocks.some(b => b.content.includes(skeleton.substring(0, 100)) && b.content.length > skeleton.length);

            if (skeleton.length > 50 && !isDuplicate) {
                const config = getCrawlerConfig();
                const limit = config.contentLimits.semanticBlock;
                const wasTruncated = skeleton.length > limit;

                if (wasTruncated && config.contentLimits.warnOnTruncation) {
                    console.warn(
                        `⚠️ [Content Truncation] Semantic block truncated: ${skeleton.length} → ${limit} chars (${selector})`
                    );
                }

                semanticBlocks.push({
                    type: type as any,
                    content: skeleton.substring(0, limit),
                    selector: `${selector} (eq:${i})`
                });
            }
        });
    });

    // Clean aggregated text
    const cleanedText = aggregatedText
        .replace(/[\t ]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // .... (Rest of logic: Schema, Tech detection, etc. - simplified for this update)
    // We reuse the existing logic for Schema/Colors but applied to Main Frame for now 
    // or we could traverse but that's expensive.

    // Re-implement existing logic for Schema (Main frame only is usually fine for SEO data)
    const schemaMarkup: string[] = [];
    $main('script[type="application/ld+json"]').each((_, el) => {
        try {
            const data = JSON.parse($main(el).html() || '{}');
            const type = data['@type'];
            if (type) schemaMarkup.push(Array.isArray(type) ? type.join(', ') : type);
        } catch (e) { }
    });

    // Color extraction (Run on main page, or if frameset, maybe run on largest frame? 
    // For now, let's keep the page.evaluate approach but ensure it runs on the main document. 
    // Note: Puppeteer evaluate runs in main context. Frame content might not be accessible via DOM if cross-origin, 
    // but same-origin frames (typical for old sites) are fine.)

    // ... (Keep existing extractedColors logic via page.evaluate)
    const { bgImages, extractedColors, designSignals } = await page.evaluate(() => {
        const bgData: { src: string; context: string }[] = [];
        const colorCounts = new Map<string, number>();
        const bgCounts = new Map<string, number>();
        const textCounts = new Map<string, number>();

        // Design Signal Containers
        let glassCount = 0;
        let hardShadowCount = 0;
        let gradientCount = 0;
        let animationPresence = 0;

        const radii: number[] = [];
        const fontFamilies: string[] = [];
        const spacings: number[] = [];

        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const area = rect.width * rect.height;
            if (area === 0) return; // Skip invisible elements

            const style = window.getComputedStyle(el);
            const tag = el.tagName.toUpperCase();

            // Semantic Weighting
            let boost = 1;
            const clList = el.classList;
            if (['BUTTON', 'A'].includes(tag) || clList.contains('btn') || clList.contains('cta')) boost = 5;
            if (['H1', 'H2', 'H3'].includes(tag)) boost = 3;

            const weight = area * boost;

            // Color Logic
            const process = (c: string, map: Map<string, number>) => {
                if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
                    map.set(c, (map.get(c) || 0) + weight);
                }
            };
            process(style.backgroundColor, bgCounts);
            process(style.color, textCounts);

            // Background Image Logic
            const bg = style.backgroundImage;
            if (bg && bg !== 'none' && bg.startsWith('url(')) {
                // Extract URL (handle quotes)
                const match = bg.match(/url\(["']?(.*?)["']?\)/);
                if (match && match[1]) {
                    // Avoid data URIs and tiny icons
                    if (!match[1].startsWith('data:') && match[1].length > 4) {
                        const tag = el.tagName.toLowerCase();
                        const id = el.id ? '#' + el.id : '';
                        // Safe className extraction for context
                        let rawCls = '';
                        if (typeof el.className === 'string') {
                            rawCls = el.className;
                        } else if (typeof el.className === 'object' && 'baseVal' in el.className) {
                            rawCls = (el.className as any).baseVal || '';
                        }
                        const cls = rawCls ? '.' + rawCls.split(' ')[0] : '';
                        bgData.push({
                            src: match[1],
                            context: `css-background (${tag}${id}${cls})`
                        });
                    }
                }
            }
            // --- DESIGN GENE SEQUENCER (Deep Scan) ---
            // 1. Glassmorphism Gene
            if (style.backdropFilter !== 'none' && style.backdropFilter.includes('blur')) {
                glassCount++;
            }

            // 2. Brutalism/Hard Shadow Gene
            if (style.boxShadow !== 'none' && style.boxShadow.includes('0px 0px 0px')) {
                if (!style.boxShadow.includes('rgba(0, 0, 0, 0)')) hardShadowCount++;
            }

            // 3. Gradients
            if (bg && bg.includes('linear-gradient')) {
                gradientCount++;
            }

            // 4. Animation
            if (style.transitionDuration !== '0s' || style.animationName !== 'none') {
                animationPresence++;
            }

            // 5. Typography (Headings)
            if (['H1', 'H2', 'H3'].includes(el.tagName)) {
                fontFamilies.push(style.fontFamily);
            }

            // 6. Spacing & Rounding (Sections/Cards)
            if (['BUTTON', 'DIV', 'SECTION', 'ARTICLE', 'NAV'].includes(el.tagName) && el.clientWidth > 50) {
                const r = parseInt(style.borderRadius);
                if (!isNaN(r)) radii.push(r);

                if (el.tagName === 'SECTION' || el.tagName === 'ARTICLE') {
                    const py = parseInt(style.paddingTop) + parseInt(style.paddingBottom);
                    if (!isNaN(py)) spacings.push(py);
                }
            }
        });

        // Analyze Rounding Mode
        let roundingMode: 'mixed' | 'sharp' | 'soft' | 'full' = 'mixed';
        if (radii.length > 0) {
            const avg = radii.reduce((a, b) => a + b, 0) / radii.length;
            const max = Math.max(...radii);
            if (max === 0) roundingMode = 'sharp';
            else if (avg > 16 || max > 90) roundingMode = 'full';
            else if (avg > 2) roundingMode = 'soft';
            else roundingMode = 'sharp';
        }

        // Analyze Spacing
        let spacing: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
        if (spacings.length > 0) {
            const avgSpace = spacings.reduce((a, b) => a + b, 0) / spacings.length;
            if (avgSpace > 100) spacing = 'spacious';
            else if (avgSpace < 40) spacing = 'compact';
        }

        // Analyze Typography
        let typography: 'serif' | 'sans' | 'mono' | 'mixed' = 'sans'; // Default
        const fontStr = fontFamilies.join(' ').toLowerCase();
        if (fontStr.includes('serif') && !fontStr.includes('sans-serif')) typography = 'serif';
        else if (fontStr.includes('mono')) typography = 'mono';

        // Analyze Animation
        let animationLevel: 'none' | 'subtle' | 'high' = 'none';
        if (animationPresence > 20) animationLevel = 'high';
        else if (animationPresence > 2) animationLevel = 'subtle';

        const sortColors = (map: Map<string, number>) => Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);

        // Enhanced Color Role Detection
        const parseColor = (c: string): { r: number; g: number; b: number; a: number } | null => {
            if (!c) return null;
            const rgbMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbMatch) {
                return {
                    r: parseInt(rgbMatch[1]),
                    g: parseInt(rgbMatch[2]),
                    b: parseInt(rgbMatch[3]),
                    a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
                };
            }
            return null;
        };

        const getLuminance = (c: { r: number; g: number; b: number }): number => {
            return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
        };

        const isColorful = (c: { r: number; g: number; b: number }): boolean => {
            const max = Math.max(c.r, c.g, c.b);
            const min = Math.min(c.r, c.g, c.b);
            const saturation = max === 0 ? 0 : (max - min) / max;
            return saturation > 0.2 && max > 50;
        };

        // Classify colors by role
        const backgrounds = sortColors(bgCounts);
        const texts = sortColors(textCounts);

        // Find primary (most used colorful bg), background (lightest), accent (button/link colors)
        let primaryColor = '';
        let backgroundColor = '';
        let accentColor = '';
        let textColor = '';

        // Background: lightest background color
        for (const c of backgrounds) {
            const parsed = parseColor(c);
            if (parsed && getLuminance(parsed) > 0.85 && parsed.a > 0.9) {
                backgroundColor = c;
                break;
            }
        }
        if (!backgroundColor && backgrounds[0]) backgroundColor = backgrounds[0];

        // Text: darkest text color
        for (const c of texts) {
            const parsed = parseColor(c);
            if (parsed && getLuminance(parsed) < 0.3 && parsed.a > 0.9) {
                textColor = c;
                break;
            }
        }
        if (!textColor && texts[0]) textColor = texts[0];

        // Primary: most used colorful background
        for (const c of backgrounds) {
            const parsed = parseColor(c);
            if (parsed && isColorful(parsed) && parsed.a > 0.9) {
                primaryColor = c;
                break;
            }
        }

        // Accent: look for button/link colors (colorful text or bg)
        for (const c of [...texts, ...backgrounds]) {
            const parsed = parseColor(c);
            if (parsed && isColorful(parsed) && c !== primaryColor && parsed.a > 0.9) {
                accentColor = c;
                break;
            }
        }

        // Build semantic color object
        const semanticColors = {
            primary: primaryColor || (backgrounds.find(c => { const p = parseColor(c); return p && isColorful(p); }) || ''),
            secondary: backgrounds[1] || '',
            accent: accentColor || texts.find(c => { const p = parseColor(c); return p && isColorful(p); }) || '',
            background: backgroundColor,
            text: textColor,
            // Keep raw data for reference
            _raw: { backgrounds: backgrounds.slice(0, 3), texts: texts.slice(0, 3) }
        };

        return {
            bgImages: bgData,
            extractedColors: semanticColors,
            designSignals: {
                hasGlass: glassCount > 0,
                hasHardShadows: hardShadowCount > 2,
                hasGradients: gradientCount > 2,
                roundingMode,
                spacing,
                typography,
                animationLevel,
                buttonStyle: (roundingMode === 'full' ? 'pill' : (roundingMode === 'sharp' ? 'sharp' : 'rounded')) as 'pill' | 'sharp' | 'rounded' | 'mixed'
            }
        };
    });

    // Merge CSS Background Images
    if (bgImages && bgImages.length > 0) {
        bgImages.forEach(img => {
            try {
                // Resolve relative URLs
                const absoluteSrc = new URL(img.src, url).toString();
                // Avoid duplicates
                if (!allImages.some(existing => existing.src === absoluteSrc)) {
                    // Classify background images (often hero backgrounds)
                    const bgClassification = classifyImageRole(absoluteSrc, 'Background Image', img.context, 0, true);

                    allImages.push({
                        src: absoluteSrc,
                        alt: 'Background Image',
                        context: img.context,
                        isLogo: false,
                        logoProb: 0,
                        role: bgClassification.role,
                        roleConfidence: bgClassification.confidence,
                        componentHint: bgClassification.componentHint,
                        groupId: null,
                        usage: {
                            isBackground: true,
                            isCritical: img.context.toLowerCase().includes('hero'),
                            suggestedSize: 'full'
                        }
                    });
                }
            } catch (e) { }
        });
    }

    // --- SMART DEDUPLICATION: Prefer High-Res, Remove Thumbnails ---
    const deduplicatedImages = (() => {
        const seen = new Map<string, typeof allImages[0]>();

        for (const img of allImages) {
            // Extract base filename (e.g., "_JSW0285" from "/img/gallery/_JSW0285.jpg")
            const urlPath = img.src.toLowerCase();
            const filename = urlPath.split('/').pop() || '';
            // Remove common suffixes like "_thumb", "_400x300", etc.
            const baseKey = filename
                .replace(/_thumb[^.]*/, '')     // Remove _thumb_400x300 etc
                .replace(/_\d+x\d+/, '')        // Remove _800x600 etc
                .replace(/\.(jpg|jpeg|png|webp|gif)$/i, ''); // Remove extension

            const existing = seen.get(baseKey);
            if (!existing) {
                seen.set(baseKey, img);
            } else {
                // Prefer non-thumbnail paths
                const isCurrentThumbnail = urlPath.includes('/thumbnail') || urlPath.includes('_thumb');
                const isExistingThumbnail = existing.src.toLowerCase().includes('/thumbnail') || existing.src.toLowerCase().includes('_thumb');

                if (isExistingThumbnail && !isCurrentThumbnail) {
                    // Replace thumbnail with full version
                    seen.set(baseKey, img);
                }
                // If both are full or both are thumbs, keep first (already in map)
            }
        }

        return Array.from(seen.values());
    })();

    // --- PHASE 1.5: PATH-BASED GROUPING (Language-Agnostic) ---
    // Apply path-based role inference to upgrade 'unknown' images
    applyPathGrouping(deduplicatedImages);

    // --- PHASE 1.6: DUPLICATE SIZE DETECTION ---
    // Link images that are the same but in different sizes
    // Master = largest version, variants = smaller versions
    (() => {
        const groups = new Map<string, typeof deduplicatedImages>();

        // Group images by normalized basename
        deduplicatedImages.forEach(img => {
            // Extract basename: remove size suffixes and common variations
            const urlPath = img.src.toLowerCase();
            const filename = urlPath.split('/').pop() || '';

            // More aggressive normalization to catch variants like:
            // - image-small.jpg, image-large.jpg, image.jpg
            // - image_400x300.jpg, image_1200x800.jpg
            // - image-thumb.jpg, image-full.jpg
            const basename = filename
                .replace(/[_-](thumb|thumbnail|small|medium|large|full|original)/gi, '')
                .replace(/[_-]\d+x\d+/g, '')           // Remove _400x300
                .replace(/[_-]\d+w/g, '')              // Remove _400w
                .replace(/[_-]@\dx/g, '')              // Remove _@2x, _@3x
                .replace(/\.(jpg|jpeg|png|webp|gif)$/i, ''); // Remove extension for matching

            if (!groups.has(basename)) {
                groups.set(basename, []);
            }
            groups.get(basename)!.push(img);
        });

        // Process groups with multiple sizes
        groups.forEach(group => {
            if (group.length <= 1) return; // No size variants

            // Find images with dimensions
            const withDimensions = group.filter(img =>
                img.width && img.height && img.width > 0 && img.height > 0
            );

            if (withDimensions.length === 0) return; // Can't determine master without dimensions

            // Find largest by area (width × height)
            const master = withDimensions.reduce((max, img) => {
                const maxArea = (max.width || 0) * (max.height || 0);
                const imgArea = (img.width || 0) * (img.height || 0);
                return imgArea > maxArea ? img : max;
            });

            // Set master's variants array (all smaller versions)
            master.variants = group
                .filter(img => img !== master)
                .map(img => img.src);

            // Set masterImage on all smaller versions
            group.forEach(img => {
                if (img !== master) {
                    img.masterImage = master.src;
                }
            });
        });
    })();

    // --- PHASE 2: COMPONENT GROUPING ---
    // Assign groupIds to images that belong to the same component
    const groupedImages = (() => {
        const componentCounts = new Map<string, number>();

        return deduplicatedImages.map(img => {
            if (img.componentHint) {
                // Count occurrences of each component type
                const count = (componentCounts.get(img.componentHint) || 0) + 1;
                componentCounts.set(img.componentHint, count);

                // Only group if there are multiple images for this component
                // (Logos don't need grouping, galleries do)
                if (img.role === 'gallery' || img.role === 'team-avatar' ||
                    img.role === 'testimonial' || img.role === 'sponsor-logo') {
                    return {
                        ...img,
                        groupId: `${img.componentHint}-group`
                    };
                }
            }
            return img;
        });
    })();

    // Generate component summary for AI
    const componentSummary = (() => {
        const groups = new Map<string, { count: number; role: ImageRole; sample: string }>();

        for (const img of groupedImages) {
            if (img.groupId) {
                const existing = groups.get(img.groupId);
                if (existing) {
                    existing.count++;
                } else {
                    groups.set(img.groupId, {
                        count: 1,
                        role: img.role,
                        sample: img.src
                    });
                }
            }
        }

        return Array.from(groups.entries()).map(([groupId, data]) => ({
            groupId,
            role: data.role,
            imageCount: data.count,
            sampleImage: data.sample
        }));
    })();

    // --- NEW: Color Analysis for Design System Extraction (WITH CACHE) ---
    // Import cache service
    const { analyzeImageColorsWithCache } = await import('../services/color-cache');

    // Analyze colors from ALL unique images (no duplicates already filtered above)
    // Prioritize important images but analyze as many as feasible
    const importantImages = groupedImages.filter(img =>
        img.role === 'logo' ||
        img.role === 'hero-background' ||
        img.role === 'hero-foreground'
    ).slice(0, 10); // Keep for designSystemColors extraction

    // Analyze ALL grouped images (duplicates already filtered via seenSrcs)
    // Limit to 150 images for performance (most sites have fewer)
    const imagesToAnalyze = groupedImages.slice(0, 150);

    console.log(`[Extractor] Analyzing colors for ${imagesToAnalyze.length} images (with cache)...`);

    // Process in batches to avoid overwhelming the network/memory
    const BATCH_SIZE = 15; // Process 15 images at a time
    const colorAnalysisResults: PromiseSettledResult<{ src: string; analysis: any } | null>[] = [];

    for (let i = 0; i < imagesToAnalyze.length; i += BATCH_SIZE) {
        const batch = imagesToAnalyze.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
            batch.map(async (img) => {
                try {
                    // Positional analysis for images that benefit from region-based colors
                    const shouldExtractPositional =
                        img.role === 'hero-background' ||
                        img.role === 'hero-foreground' ||
                        img.role === 'section-feature' ||
                        img.role === 'gallery' ||
                        img.role === 'product' ||
                        img.role === 'event-photo' ||
                        img.role === 'location-photo' ||
                        img.role === 'cta-image';

                    // Use cached version (90% faster on repeated analyses)
                    const analysis = await analyzeImageColorsWithCache(
                        img.src,
                        shouldExtractPositional
                    );
                    return { src: img.src, analysis };
                } catch {
                    return null;
                }
            })
        );
        colorAnalysisResults.push(...batchResults);
        console.log(`[Extractor] Color analysis batch ${Math.ceil((i + BATCH_SIZE) / BATCH_SIZE)}/${Math.ceil(imagesToAnalyze.length / BATCH_SIZE)} complete`);
    }

    // Attach color analysis to corresponding images
    for (const result of colorAnalysisResults) {
        if (result.status === 'fulfilled' && result.value) {
            const { src, analysis } = result.value;
            const img = groupedImages.find(i => i.src === src);
            if (img) {
                img.colorAnalysis = analysis;
            }
        }
    }

    // Extract design system colors if we have important images
    let designSystemColors: DesignSystemColors | undefined = undefined;
    if (importantImages.length > 0) {
        try {
            const colorData = await ImageColorAnalyzer.extractDesignSystemColors(
                importantImages.map(img => ({ src: img.src, role: img.role }))
            );

            designSystemColors = {
                brand: colorData.brandColors,
                hero: colorData.heroColors.map(p => p.primary).filter(Boolean),
                overall: colorData.overallPalette.slice(0, 10)
            };

        } catch {
            // Color extraction is non-critical
        }
    }

    // --- ADVANCED ANALYSIS: Forms, Links, Design System, Content Type, Media ---
    const $final = cheerio.load(mainContent);

    const analyzedForms = FormAnalyzer.analyzeForms($final);
    const analyzedLinks = LinkAnalyzer.analyzeLinks($final, url);
    const contentTypeDetection = ContentTypeDetector.detect($final, schemaMarkup);
    const mediaAnalysis = MediaAnalyzer.analyze($final);

    // 5. Design System Extraction (from collected data in page.evaluate)
    let designSystemExtraction: any = undefined;
    try {
        // Extract design data from page.evaluate
        const typography = designSignals?.typography || 'sans';
        const fontFamilies = typography === 'serif' ? ['serif'] :
                            typography === 'mono' ? ['monospace'] :
                            ['sans-serif'];
        const headingSizes: any = {}; // Simplified - would need actual extraction
        const fontWeights = [400, 600, 700]; // Default weights
        const lineHeights = [1.5, 1.6]; // Default
        const spacingScale = designSignals?.spacing === 'compact' ? [4, 8, 12, 16] : designSignals?.spacing === 'spacious' ? [8, 16, 24, 32, 48] : [8, 16, 24, 32];
        const borderRadii = designSignals?.roundingMode === 'sharp' ? [0] : designSignals?.roundingMode === 'soft' ? [4, 8] : designSignals?.roundingMode === 'full' ? [9999] : [8, 12, 16];
        const shadows: string[] = designSignals?.hasHardShadows ? ['0 4px 6px rgba(0,0,0,0.1)'] : designSignals?.hasGlass ? ['0 8px 32px rgba(0,0,0,0.1)'] : [];

        // Extract colors from extractedColors
        const colors = {
            primary: extractedColors?.primary ? [extractedColors.primary] : [],
            secondary: extractedColors?.secondary ? [extractedColors.secondary] : [],
            text: typeof extractedColors?.text === 'string' ? [extractedColors.text] : (extractedColors?.text || []),
            background: typeof extractedColors?.background === 'string' ? [extractedColors.background] : (extractedColors?.background || [])
        };

        designSystemExtraction = DesignSystemExtractor.extract({
            fontFamilies,
            headingSizes,
            fontWeights,
            lineHeights,
            spacingScale,
            borderRadii,
            shadows,
            colors
        });

    } catch {
        // Design system extraction is non-critical
    }

    // Replace allLinks and allForms with analyzed versions
    const finalLinks = analyzedLinks;
    const finalForms = analyzedForms;

    return {
        url,
        depth: 0,
        type: 'other',
        variants: [], // Initialize empty - will be populated by normalization
        meta: {
            title,
            description,
            ogImage,
            canonical,
            robots,
            lang,
            charset,
            viewport,
            hreflangs, // Critical for multi-language linking
            social,
            schemaMarkup,
            geoSignals: { hasCitations: false, hasEvidence: false, hasAuthorInfo: false },
            designSignals, // Inject detected signals
            imageComponentSummary: componentSummary // NEW: Component grouping summary for AI
        },
        content: {
            h1: '', // derived from aggregation if needed
            headings: [],
            wordCount: fullWordCount,
            images: groupedImages,
            links: finalLinks,
            forms: finalForms,
            landmarks: [],
            hasSkipLink: false,
            hasLegalAccessibilityLink: false,
            // NEW: Advanced analysis results
            designSystem: designSystemExtraction,
            contentType: contentTypeDetection,
            media: mediaAnalysis,
            rawText: (() => {
                const config = getCrawlerConfig();
                const limit = config.contentLimits.rawText;
                const wasTruncated = cleanedText.length > limit;

                if (wasTruncated && config.contentLimits.warnOnTruncation) {
                    console.warn(
                        `⚠️ [Content Truncation] rawText truncated: ${cleanedText.length} → ${limit} chars`
                    );
                }

                return cleanedText.slice(0, limit);
            })(),
            semanticBlocks,
            extractedColors: extractedColors as any,
            designSystemColors: designSystemColors // NEW: Image-based color palette
        },
        tech: {
            detectedFrameworks: isFrameset ? ['Frameset'] : [],
            duplicateIds: [],
        },
    };
}
