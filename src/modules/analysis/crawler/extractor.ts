import { Page } from 'puppeteer';
import { SiteNode } from '@/types';
import * as cheerio from 'cheerio';

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
    { pattern: /\/artikel\//i, role: 'product', confidence: 85, hint: 'ProductGrid' },

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

    // --- PRIORITY 5: Alt Text Analysis ---
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
    const allLinks: { text: string; href: string; ariaLabel?: string }[] = [];
    const allForms: { id?: string; label?: string; hasLabel: boolean; type?: string }[] = [];
    let aggregatedText = '';

    // Process ALL frames (including main frame)
    const frames = page.frames();
    const isFrameset = frames.length > 1;

    // We'll use the main frame for metadata
    const mainContent = await page.content();
    const $main = cheerio.load(mainContent);

    // Metadata (Keep from main frame)
    const title = $main('title').text() || '';
    const description = $main('meta[name="description"]').attr('content') || '';
    const ogImage = $main('meta[property="og:image"]').attr('content');
    const canonical = $main('link[rel="canonical"]').attr('href');
    const robots = $main('meta[name="robots"]').attr('content');
    const viewport = $main('meta[name="viewport"]').attr('content');
    const lang = $main('html').attr('lang');
    const charset = $main('meta[charset]').attr('charset') || $main('meta[http-equiv="Content-Type"]').attr('content');

    const social = {
        ogTitle: $main('meta[property="og:title"]').attr('content'),
        ogDescription: $main('meta[property="og:description"]').attr('content'),
        twitterCard: $main('meta[name="twitter:card"]').attr('content'),
        twitterSite: $main('meta[name="twitter:site"]').attr('content'),
    };

    // Iterate Frames
    for (const frame of frames) {
        try {
            const content = await frame.content();
            const $ = cheerio.load(content);
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

                        // 3. Dimension-based hints (small influence only, +5-10 confidence)
                        let dimensionHint: { roleHint?: string; confidenceBoost: number } = { confidenceBoost: 0 };
                        const w = parseInt(width || '0', 10);
                        const h = parseInt(height || '0', 10);

                        if (w > 0 && h > 0) {
                            const aspectRatio = w / h;
                            const minDim = Math.min(w, h);
                            const maxDim = Math.max(w, h);

                            // Very small images → likely icon
                            if (maxDim <= 64) {
                                dimensionHint = { roleHint: 'icon', confidenceBoost: 5 };
                            }
                            // Square (0.9-1.1) → avatar/logo candidate
                            else if (aspectRatio >= 0.9 && aspectRatio <= 1.1 && minDim >= 80 && minDim <= 400) {
                                dimensionHint = { roleHint: 'team-avatar', confidenceBoost: 5 };
                            }
                            // Wide (>1.6) → hero/gallery candidate
                            else if (aspectRatio > 1.6 && maxDim >= 800) {
                                dimensionHint = { roleHint: 'hero-background', confidenceBoost: 5 };
                            }
                            // Portrait (0.6-0.8) → team/person
                            else if (aspectRatio >= 0.6 && aspectRatio <= 0.85 && minDim >= 200) {
                                dimensionHint = { roleHint: 'team-avatar', confidenceBoost: 3 };
                            }
                        }

                        // Apply dimension boost to confidence (only if role matches hint)
                        let finalConfidence = classification.confidence;
                        if (dimensionHint.roleHint === classification.role) {
                            finalConfidence += dimensionHint.confidenceBoost;
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
                            }
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
                semanticBlocks.push({
                    type: type as any,
                    content: skeleton.substring(0, 6000), // Cap block size
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
            if (['BUTTON', 'A'].includes(tag) || el.className.includes('btn') || el.className.includes('cta')) boost = 5;
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
                        const cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '';
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

    return {
        url,
        depth: 0,
        type: 'other',
        meta: {
            title,
            description,
            ogImage,
            canonical,
            robots,
            lang,
            charset,
            viewport,
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
            links: allLinks,
            forms: allForms,
            landmarks: [],
            hasSkipLink: false,
            hasLegalAccessibilityLink: false,
            rawText: cleanedText.slice(0, 10000), // Increased limit for aggregated content
            semanticBlocks,
            extractedColors: extractedColors as any
        },
        tech: {
            detectedFrameworks: isFrameset ? ['Frameset'] : [],
            duplicateIds: [],
        },
    };
}
