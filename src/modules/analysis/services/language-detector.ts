import { SiteNode } from '@/types';

/**
 * LanguageDetector - Automatic Language Variant Detection
 *
 * Detects language variants across URLs and groups them intelligently.
 * User works language-agnostically, system handles languages in the background.
 */

export interface LanguageVariant {
    lang: string;
    url: string;
    node: SiteNode;
}

export interface LanguageGroup {
    conceptId: string; // Language-agnostic concept ID
    variants: LanguageVariant[];
    primaryLang: string; // Main language (usually first detected)
}

export class LanguageDetector {
    // Common language codes in URL paths
    private static readonly LANG_CODES = [
        'de', 'en', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko',
        'ar', 'tr', 'sv', 'no', 'da', 'fi', 'cs', 'hu', 'ro', 'el', 'hr', 'sk'
    ];

    // Region-specific language codes mapping (e.g., en-US → en)
    private static readonly REGION_CODES: Record<string, string> = {
        'en-us': 'en',
        'en-gb': 'en',
        'en-au': 'en',
        'en-ca': 'en',
        'de-at': 'de',
        'de-ch': 'de',
        'pt-br': 'pt',
        'pt-pt': 'pt',
        'fr-ca': 'fr',
        'fr-ch': 'fr',
        'es-mx': 'es',
        'es-es': 'es',
        'zh-cn': 'zh',
        'zh-tw': 'zh',
        'zh-hk': 'zh',
    };

    // Full language names mapping (e.g., /english/ → en, /deutsch/ → de)
    private static readonly LANG_NAMES: Record<string, string> = {
        'english': 'en',
        'deutsch': 'de',
        'german': 'de',
        'french': 'fr',
        'francais': 'fr',
        'spanish': 'es',
        'espanol': 'es',
        'italian': 'it',
        'italiano': 'it',
        'portuguese': 'pt',
        'dutch': 'nl',
        'polish': 'pl',
        'russian': 'ru',
        'chinese': 'zh',
        'japanese': 'ja',
        'korean': 'ko',
        'arabic': 'ar',
        'turkish': 'tr',
        'swedish': 'sv',
        'norwegian': 'no',
        'danish': 'da',
        'finnish': 'fi',
        'czech': 'cs',
        'hungarian': 'hu',
        'romanian': 'ro',
        'greek': 'el',
        'croatian': 'hr',
        'slovak': 'sk',
    };

    /**
     * Detects language from URL path or query parameters
     *
     * NEW: Supports query parameters (?lang=de)
     * NEW: Supports region codes (en-US → en)
     * NEW: Handles trailing slashes correctly
     *
     * Examples:
     * - /de/blog/article -> 'de'
     * - /en-us/products/item -> 'en'
     * - /blog/article?lang=de -> 'de'
     * - /de/ -> 'de'
     * - /blog/article -> null (no language)
     */
    static detectLanguageFromUrl(url: string): string | null {
        try {
            const urlObj = new URL(url);

            // 1. Check query parameters first (higher priority)
            const langParam = urlObj.searchParams.get('lang') ||
                            urlObj.searchParams.get('language') ||
                            urlObj.searchParams.get('locale');

            if (langParam) {
                const normalized = langParam.toLowerCase();

                // Check direct language code match
                if (this.LANG_CODES.includes(normalized)) {
                    return normalized;
                }

                // Check region code mapping
                if (this.REGION_CODES[normalized]) {
                    return this.REGION_CODES[normalized];
                }
            }

            // 2. Check path segments
            const segments = urlObj.pathname.split('/').filter(Boolean);

            if (segments.length > 0) {
                const firstSegment = segments[0].toLowerCase();

                // Check direct language code match
                if (this.LANG_CODES.includes(firstSegment)) {
                    return firstSegment;
                }

                // Check region code mapping
                if (this.REGION_CODES[firstSegment]) {
                    return this.REGION_CODES[firstSegment];
                }

                // Check full language name mapping (e.g., /english/ → en)
                if (this.LANG_NAMES[firstSegment]) {
                    return this.LANG_NAMES[firstSegment];
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Extracts language-agnostic path from URL
     *
     * NEW: Handles trailing slashes correctly
     * NEW: Handles region codes (en-US → removes)
     * NEW: Preserves query parameters (excluding lang params)
     *
     * Examples:
     * - /de/blog/article -> /blog/article
     * - /en-us/products/item -> /products/item
     * - /de/ -> /
     * - /blog/article?lang=de -> /blog/article
     * - /blog/article -> /blog/article
     */
    static extractConceptPath(url: string): string {
        try {
            const urlObj = new URL(url);
            let segments = urlObj.pathname.split('/').filter(Boolean);

            // Remove language prefix if present
            if (segments.length > 0) {
                const firstSegment = segments[0].toLowerCase();

                // Check if first segment is language code, region code, or full language name
                if (this.LANG_CODES.includes(firstSegment) || this.REGION_CODES[firstSegment] || this.LANG_NAMES[firstSegment]) {
                    segments.shift();
                }
            }

            const path = '/' + segments.join('/');

            // Preserve trailing slash from original URL if present
            // (but not if we're at root)
            if (urlObj.pathname.endsWith('/') && path !== '/') {
                return path + '/';
            }

            return path;
        } catch {
            return url;
        }
    }

    /**
     * Groups URLs by language-agnostic concept
     *
     * Example:
     * Input:
     *   /de/blog/article-1
     *   /en/blog/article-1
     *   /fr/blog/article-1
     *
     * Output:
     *   Concept: /blog/article-1
     *   Variants: [de, en, fr]
     */
    static groupByLanguage(nodes: SiteNode[]): LanguageGroup[] {
        const conceptMap = new Map<string, LanguageVariant[]>();

        // Group by concept path
        nodes.forEach(node => {
            const lang = this.detectLanguageFromUrl(node.url);
            const conceptPath = this.extractConceptPath(node.url);

            if (!conceptMap.has(conceptPath)) {
                conceptMap.set(conceptPath, []);
            }

            conceptMap.get(conceptPath)!.push({
                lang: lang || 'default',
                url: node.url,
                node
            });
        });

        // Convert to LanguageGroup[]
        const groups: LanguageGroup[] = [];

        conceptMap.forEach((variants, conceptPath) => {
            // Determine primary language (first detected, or 'default')
            const primaryLang = variants[0].lang;

            groups.push({
                conceptId: conceptPath,
                variants,
                primaryLang
            });
        });

        return groups;
    }

    /**
     * Checks if two URLs are language variants of each other
     *
     * Returns true if they have the same concept path but different languages
     */
    static areLanguageVariants(urlA: string, urlB: string): boolean {
        const langA = this.detectLanguageFromUrl(urlA);
        const langB = this.detectLanguageFromUrl(urlB);
        const conceptA = this.extractConceptPath(urlA);
        const conceptB = this.extractConceptPath(urlB);

        // Same concept, different languages
        return conceptA === conceptB && langA !== langB;
    }

    /**
     * Filters nodes to show only one language variant
     * (for user-facing display - user sees only one "concept" version)
     *
     * @param nodes - All nodes
     * @param preferredLang - Preferred language to show (default: 'de')
     * @returns Filtered nodes (one per concept)
     */
    static filterToSingleLanguage(nodes: SiteNode[], preferredLang: string = 'de'): SiteNode[] {
        const groups = this.groupByLanguage(nodes);
        const filtered: SiteNode[] = [];

        groups.forEach(group => {
            // Find preferred language variant
            let chosen = group.variants.find(v => v.lang === preferredLang);

            // Fallback: primary language
            if (!chosen) {
                chosen = group.variants.find(v => v.lang === group.primaryLang);
            }

            // Fallback: first variant
            if (!chosen) {
                chosen = group.variants[0];
            }

            if (chosen) {
                filtered.push(chosen.node);
            }
        });

        return filtered;
    }

    /**
     * Enriches nodes with language metadata
     * Adds variant info to each node
     */
    static enrichWithLanguageMetadata(nodes: SiteNode[]): SiteNode[] {
        const groups = this.groupByLanguage(nodes);

        // Create lookup map
        const lookup = new Map<string, LanguageGroup>();
        groups.forEach(group => {
            group.variants.forEach(v => {
                lookup.set(v.url, group);
            });
        });

        // Enrich nodes
        return nodes.map(node => {
            const group = lookup.get(node.url);

            if (!group || group.variants.length === 1) {
                // No variants, return as-is
                return node;
            }

            // Add variant info
            const enriched = { ...node };
            enriched.variants = group.variants.map(v => ({
                url: v.url,
                lang: v.lang
            }));

            return enriched;
        });
    }

    /**
     * Gets all detected languages in the site
     */
    static getDetectedLanguages(nodes: SiteNode[]): string[] {
        const languages = new Set<string>();

        nodes.forEach(node => {
            const lang = this.detectLanguageFromUrl(node.url);
            if (lang) {
                languages.add(lang);
            }
        });

        return Array.from(languages).sort();
    }

    /**
     * Generates language-specific content structure for ZIP export
     *
     * Returns map of language -> nodes for that language
     */
    static organizeByLanguage(nodes: SiteNode[]): Map<string, SiteNode[]> {
        const langMap = new Map<string, SiteNode[]>();

        nodes.forEach(node => {
            const lang = this.detectLanguageFromUrl(node.url) || 'default';

            if (!langMap.has(lang)) {
                langMap.set(lang, []);
            }

            langMap.get(lang)!.push(node);
        });

        return langMap;
    }
}
