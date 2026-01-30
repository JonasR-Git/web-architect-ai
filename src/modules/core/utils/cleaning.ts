
import * as cheerio from 'cheerio';

/**
 * Cleaning options to tailor the output for specific AI tasks.
 */
interface CleaningOptions {
    removeScripts?: boolean;
    removeStyles?: boolean;
    removeComments?: boolean;
    removeEmptyContainers?: boolean;
    simplifyAttributes?: boolean; // Remove specific data-* attributes
    extractNextData?: boolean; // Attempt to extract and append critical metadata from __NEXT_DATA__
}

const DEFAULT_OPTIONS: CleaningOptions = {
    removeScripts: true,
    removeStyles: true,
    removeComments: true,
    removeEmptyContainers: true,
    simplifyAttributes: true,
    extractNextData: true
};

/**
 * Cleans raw HTML to be token-efficient for AI analysis while preserving 
 * critical structural signals (layout, navigation, semantic tags).
 */
export function cleanHtmlForAI(html: string, options: CleaningOptions = DEFAULT_OPTIONS): string {
    if (!html) return '';

    // Load with Cheerio
    const $ = cheerio.load(html);

    // 1. Extract Next.js Data (The "Chirurg" Strategy)
    let extractedMeta = '';
    if (options.extractNextData) {
        try {
            const nextDataScript = $('#__NEXT_DATA__').html();
            if (nextDataScript) {
                const json = JSON.parse(nextDataScript);
                // Extract useful parts (Page Props often contain the raw content)
                if (json.props?.pageProps) {
                    const props = json.props.pageProps;
                    // Try to find main entity data without dumping the whole state
                    const metaSummary = {
                        title: props.title || props.page?.title || props.meta?.title,
                        description: props.description || props.page?.description,
                        date: props.date || props.page?.date || props.publishedAt,
                        // Add more specific fields if known universal CMS shapes exist
                    };
                    extractedMeta = `<!-- \n[AI_META_HINT]: Extracted from Hydration State:\n${JSON.stringify({ metaSummary }, null, 2)}\n-->\n`;
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }

    // 1b. Extract Nuxt.js Data (The "Vue" Strategy)
    if (options.extractNextData) {
        try {
            // Nuxt 2/3 usually puts state in window.__NUXT__
            const nuxtScript = $('script').filter((_, el) => {
                const html = $(el).html() || '';
                return html.includes('window.__NUXT__') || html.includes('__NUXT__=');
            }).html();

            if (nuxtScript) {
                // It's often a JS assignment, not pure JSON. 
                // We can try to regex extract the data object if plain, or just signal it exists.
                // For safety/simplicity in this regex-free zone, we might just flag it.
                extractedMeta += `<!-- [AI_META_HINT]: Nuxt.js Hydration detected. Structure is Vue-based. -->\n`;
            }
        } catch (e) { }
    }

    // 1c. JSON-LD Extraction (Universal SEO)
    // Always good to have structured data
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || '{}');
            extractedMeta += `<!-- [AI_META_HINT]: JSON-LD Structured Data:\n${JSON.stringify(json, null, 2)}\n-->\n`;
        } catch (e) { }
    });

    // 2. The Purge (Remove Noise)
    const noiseSelectors = [
        'script',
        'noscript',
        'style',
        'iframe:not([src*="youtube"], [src*="vimeo"])', // Keep video embeds
        'svg', // SVGs are token heavy, usually we replace them or strip them. 
        // For Design AI, seeing "SVG" tag is enough, path data is waste.
        'link[rel="stylesheet"]',
        'link[rel="preload"]',
        'meta' // We extracted meta in ExtractPageData usually, but if this is raw HTML pass, maybe keep essential meta? 
        // Assuming this function is for visual/structure analysis, meta tags are noise in the body.
    ];

    if (options.removeScripts) {
        $(noiseSelectors.join(',')).remove();
    }

    // 3. SVG Replacement (Token Savings)
    // Instead of deleting, replace with a lightweight placeholder to indicate "Icon/Image Here"
    $('svg').each((_, el) => {
        const cls = $(el).attr('class') || '';
        $(el).replaceWith(`<svg class="${cls}" data-note="icon-placeholder" />`);
    });

    // 4. Attribute Diet
    if (options.simplifyAttributes) {
        $('*').each((_, el) => {
            const attribs = (el as any).attribs;
            for (const name in attribs) {
                // Remove data-n-*, data-react-*, on* handlers
                if (
                    name.startsWith('data-n-') ||
                    name.startsWith('data-react') ||
                    name.startsWith('on') ||
                    name.startsWith('aria-') // Optional: Accessibility tree is useful, but often verbose. 
                    // Ideally keep meaningful ARIAs like role/label.
                ) {
                    $(el).removeAttr(name);
                }

                // Allow specific data-attributes that might be useful (e.g. data-testid)
                // Remove base64 images from src to save tokens
                if (name === 'src' && attribs[name].startsWith('data:image')) {
                    $(el).attr('src', '[base64-image-removed]');
                }
            }
        });
    }

    // 5. Layout Flattening (Optional - Remove wrapper hell?)
    // This is risky for Design Analysis. Better to keep divs.

    // 6. Comments
    if (options.removeComments) {
        $('*').contents().each((_, node) => {
            if (node.type === 'comment') {
                $(node).remove();
            }
        });
    }

    // 7. Get Result
    // If we want body only:
    let result = $('body').html() || '';

    // Fallback if no body (partial fragment)
    if (!result && html.length > 0) {
        result = $.html();
    }

    // 8. Final whitespace cleanup
    result = result.replace(/^\s*[\r\n]/gm, ''); // Remove empty lines

    return extractedMeta + result;
}
