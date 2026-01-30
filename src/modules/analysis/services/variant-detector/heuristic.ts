import type { SiteNode, SemanticTranslationMap } from '@/types';

/**
 * Level 1: Heuristic Variant Detection
 *
 * Fast, rule-based checks for language variants.
 * Target: 80-85% accuracy, <10ms per pair
 */
export class HeuristicVariantDetector {
    /**
     * Default semantic translations dictionary
     * Expandable by user configuration
     */
    private static DEFAULT_TRANSLATIONS: SemanticTranslationMap = {
        // German ↔ English
        'leistungen': ['services', 'servizi', 'servicios'],
        'uber-uns': ['about-us', 'chi-siamo', 'sobre-nosotros', 'a-propos'],
        'kontakt': ['contact', 'contatto', 'contacto', 'contatti'],
        'referenzen': ['references', 'case-studies', 'progetti', 'proyectos'],
        'blog': ['blog', 'news', 'notizie', 'noticias'],
        'karriere': ['careers', 'jobs', 'carriere', 'carriera'],
        'impressum': ['imprint', 'legal', 'mentions-legales'],
        'datenschutz': ['privacy', 'privacy-policy', 'confidentialite'],
        'team': ['team', 'equipo', 'squadra', 'equipe'],
        'produkte': ['products', 'prodotti', 'productos', 'produits'],

        // Additional common patterns
        'preise': ['pricing', 'prezzi', 'precios', 'tarifs'],
        'angebot': ['offer', 'offerta', 'oferta', 'offre'],
        'portfolio': ['portfolio', 'lavori', 'trabajos', 'realisations'],
    };

    /**
     * Checks if two URLs are likely variants based on URL structure
     * Returns confidence score 0-100
     */
    static checkUrlStructure(
        url1: string,
        url2: string,
        customTranslations?: SemanticTranslationMap
    ): { score: number; reasons: string[] } {
        const reasons: string[] = [];
        let score = 0;

        try {
            // Extract paths and normalize
            const path1 = this.extractPath(url1);
            const path2 = this.extractPath(url2);

            // Strip language prefixes
            const stripped1 = this.stripLanguagePrefix(path1);
            const stripped2 = this.stripLanguagePrefix(path2);

            // Exact path match after stripping?
            if (stripped1.path === stripped2.path) {
                score += 90;
                reasons.push(`Identical paths after language prefix removal: ${stripped1.path}`);
                return { score, reasons };
            }

            // Known semantic translation?
            const translations = { ...this.DEFAULT_TRANSLATIONS, ...customTranslations };
            const segment1 = this.getFirstSegment(stripped1.path);
            const segment2 = this.getFirstSegment(stripped2.path);

            if (this.isKnownTranslation(segment1, segment2, translations)) {
                score += 85;
                reasons.push(`Known translation: "${segment1}" ↔ "${segment2}"`);
                return { score, reasons };
            }

            // Check if rest of path is identical (deep paths)
            const remainder1 = this.getPathRemainder(stripped1.path);
            const remainder2 = this.getPathRemainder(stripped2.path);

            if (remainder1 && remainder2 && remainder1 === remainder2 && remainder1.length > 3) {
                score += 30;
                reasons.push(`Identical path remainder: ${remainder1}`);
            }

        } catch (e) {
            // Invalid URLs
            return { score: 0, reasons: ['Invalid URL structure'] };
        }

        return { score, reasons };
    }

    /**
     * Checks metadata similarity (word count, images, forms, etc.)
     * Returns confidence score 0-100
     */
    static checkMetadata(
        node1: SiteNode,
        node2: SiteNode
    ): { score: number; reasons: string[] } {
        const reasons: string[] = [];
        let score = 0;

        // 1. Word Count Similarity (±15%)
        const wc1 = node1.content.wordCount || 0;
        const wc2 = node2.content.wordCount || 0;

        if (wc1 > 0 && wc2 > 0) {
            const wcDiff = Math.abs(wc1 - wc2) / Math.max(wc1, wc2);

            if (wcDiff < 0.15) {
                score += 30;
                reasons.push(`Similar word count: ${wc1} vs ${wc2} (${Math.round(wcDiff * 100)}% diff)`);
            } else if (wcDiff < 0.25) {
                score += 15;
                reasons.push(`Moderately similar word count: ${wc1} vs ${wc2}`);
            }
        }

        // 2. Exact Image Count Match
        const img1 = node1.content.images?.length || 0;
        const img2 = node2.content.images?.length || 0;

        if (img1 === img2 && img1 > 5) {
            score += 25;
            reasons.push(`Identical image count: ${img1} images`);
        } else if (img1 === img2 && img1 > 0) {
            score += 15;
            reasons.push(`Same image count: ${img1} images`);
        }

        // 3. Form Count Match
        const form1 = node1.content.forms?.length || 0;
        const form2 = node2.content.forms?.length || 0;

        if (form1 === form2 && form1 > 0) {
            score += 15;
            reasons.push(`Same form count: ${form1} forms`);
        }

        // 4. Different Language Codes (Required!)
        const lang1 = node1.meta.lang;
        const lang2 = node2.meta.lang;

        if (lang1 && lang2) {
            if (lang1 !== lang2) {
                score += 10;
                reasons.push(`Different languages detected: ${lang1} vs ${lang2}`);
            } else {
                // Same language = NOT a variant
                score = 0;
                reasons.push(`Same language (${lang1}) - cannot be variant`);
                return { score, reasons };
            }
        }

        // 5. Title Structure Similarity (same length ±20%)
        const title1 = node1.meta.title || '';
        const title2 = node2.meta.title || '';

        if (title1.length > 10 && title2.length > 10) {
            const titleLenDiff = Math.abs(title1.length - title2.length) / Math.max(title1.length, title2.length);

            if (titleLenDiff < 0.2) {
                score += 10;
                reasons.push(`Similar title length: ${title1.length} vs ${title2.length} chars`);
            }
        }

        return { score, reasons };
    }

    /**
     * Combined heuristic check
     */
    static detect(
        node1: SiteNode,
        node2: SiteNode,
        customTranslations?: SemanticTranslationMap
    ): { score: number; reasons: string[] } {
        const urlResult = this.checkUrlStructure(node1.url, node2.url, customTranslations);
        const metaResult = this.checkMetadata(node1, node2);

        return {
            score: urlResult.score + metaResult.score,
            reasons: [...urlResult.reasons, ...metaResult.reasons]
        };
    }

    // ========== Helper Methods ==========

    private static extractPath(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname;
        } catch {
            return url;
        }
    }

    private static stripLanguagePrefix(path: string): { path: string; lang: string | null } {
        const segments = path.split('/').filter(Boolean);
        const langRegex = /^(de|en|fr|it|es|nl|pl|ru|zh|ja|pt|ar|tr|sv|da|no|fi|cs|hu|ro|bg|hr|sk|sl)$/i;

        if (segments.length > 0 && langRegex.test(segments[0])) {
            const lang = segments[0].toLowerCase();
            const strippedPath = '/' + segments.slice(1).join('/');
            return { path: strippedPath, lang };
        }

        return { path, lang: null };
    }

    private static getFirstSegment(path: string): string {
        const segments = path.split('/').filter(Boolean);
        return segments[0] || '';
    }

    private static getPathRemainder(path: string): string {
        const segments = path.split('/').filter(Boolean);
        return segments.slice(1).join('/');
    }

    private static isKnownTranslation(
        segment1: string,
        segment2: string,
        translations: SemanticTranslationMap
    ): boolean {
        // Normalize segments (remove trailing slashes, convert to lowercase)
        const s1 = segment1.toLowerCase().replace(/\/$/, '');
        const s2 = segment2.toLowerCase().replace(/\/$/, '');

        // Check if s1 is a key and s2 is in its translations
        if (translations[s1]?.includes(s2)) return true;

        // Check if s2 is a key and s1 is in its translations
        if (translations[s2]?.includes(s1)) return true;

        // Check if both are in the same translation group
        for (const [key, values] of Object.entries(translations)) {
            if ((key === s1 || values.includes(s1)) && (key === s2 || values.includes(s2))) {
                return true;
            }
        }

        return false;
    }
}
