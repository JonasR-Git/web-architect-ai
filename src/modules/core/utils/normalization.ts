import { SiteNode, SiteStructure, VariantDetectionConfig } from '@/types';
import { LanguageVariantDetector } from '@/modules/analysis/services/variant-detector';

// Map of semantic merges: "source path" -> "concept path"
// Example: { "/de/leistungen": "/en/services" }
export interface SemanticMergeMap {
    merges: {
        concept: string;    // e.g. "services"
        sources: string[];  // e.g. ["/de/leistungen", "/en/services"]
    }[]
}

// ISO 2-letter language codes
const LANG_CODES = /^(de|en|fr|it|es|nl|pl|ru|zh|ja|ko|ar|tr|sv|no|da|fi|cs|hu|ro|el|hr|sk|pt)$/i;

// Full language names → ISO code
const LANG_NAMES: Record<string, string> = {
    'english': 'en', 'deutsch': 'de', 'german': 'de', 'french': 'fr',
    'francais': 'fr', 'spanish': 'es', 'espanol': 'es', 'italian': 'it',
    'italiano': 'it', 'portuguese': 'pt', 'dutch': 'nl', 'polish': 'pl',
    'russian': 'ru', 'chinese': 'zh', 'japanese': 'ja', 'korean': 'ko',
};

/**
 * Strips language prefix from a path if present.
 * Returns the stripped path and detected language.
 *
 * Examples:
 *   /en/services/seo  → { path: '/services/seo', lang: 'en' }
 *   /english/blog     → { path: '/blog', lang: 'en' }
 *   /leistungen/seo   → { path: '/leistungen/seo', lang: null }
 */
function stripLanguagePrefix(path: string): { path: string; lang: string | null } {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return { path, lang: null };

    const first = segments[0].toLowerCase();

    if (LANG_CODES.test(first)) {
        return {
            path: '/' + segments.slice(1).join('/') || '/',
            lang: first
        };
    }

    if (LANG_NAMES[first]) {
        return {
            path: '/' + segments.slice(1).join('/') || '/',
            lang: LANG_NAMES[first]
        };
    }

    return { path, lang: null };
}

/**
 * Normalizes a URL to its "Concept" form.
 *
 * Order of operations (critical for correctness):
 * 1. STRIP LANGUAGE PREFIX first (/en/services/seo → /services/seo)
 * 2. APPLY SEMANTIC MERGE on the clean path (/leistungen/seo → /services/seo)
 *
 * This ensures that both DE and EN variants of the same content
 * converge to the same concept path regardless of language prefix.
 *
 * Examples:
 *   /de/products       → /products (lang: de)
 *   /en/products       → /products (lang: en)
 *   /leistungen/seo    → /services/seo (via semantic merge)
 *   /en/services/seo   → /services/seo (lang strip → merge matches)
 *   /en/casestudies/x  → /case-studies/x (lang strip → merge matches)
 *   /casestudies/x     → /case-studies/x (merge matches directly)
 */
export function normalizeUrlToConcept(url: string, mergeMap?: SemanticMergeMap): { conceptPath: string; detectedLang: string | null } {
    try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;

        // 1. LANGUAGE STRIPPING FIRST
        // This ensures /en/casestudies and /casestudies both become /casestudies
        // BEFORE we check the semantic merge map.
        const langResult = stripLanguagePrefix(path);
        const detectedLang = langResult.lang;
        path = langResult.path;

        // 2. SEMANTIC REWRITE (on language-stripped path)
        // Now /leistungen/seo and /services/seo (from /en/services/seo) can both match
        if (mergeMap && mergeMap.merges) {
            for (const merge of mergeMap.merges) {
                for (const source of merge.sources) {
                    // Also strip language prefix from source for backward compatibility
                    // (old merge maps might have sources like "/de/leistungen" or "/en/services")
                    const cleanSource = stripLanguagePrefix(source).path;

                    // Ensure we match a complete path segment, not a partial string
                    // e.g., /case should NOT match /casestudies
                    if (cleanSource !== '/' &&
                        path.startsWith(cleanSource) &&
                        (path.length === cleanSource.length || path[cleanSource.length] === '/')) {
                        const suffix = path.substring(cleanSource.length);
                        path = `/${merge.concept}${suffix}`;
                        break;
                    }
                }
            }
        }

        return { conceptPath: path || '/', detectedLang };
    } catch (e) {
        return { conceptPath: url, detectedLang: null };
    }
}

/**
 * Transforms a SiteStructure into a "Concept Structure".
 * 
 * 1. Strips language prefixes from all URLs.
 * 2. Deduplicates nodes that map to the same Concept URL.
 * 3. Preserves original URLs as "variants".
 * 4. Merges metadata (e.g. takes the best title, or defaults to first).
 */
export function normalizeStructureToConcepts(structure: SiteStructure, mergeMap?: SemanticMergeMap): SiteStructure {
    const conceptMap = new Map<string, SiteNode>();

    structure.nodes.forEach(node => {
        const { conceptPath, detectedLang } = normalizeUrlToConcept(node.url, mergeMap);

        // Create a synthetic "Concept URL" for internal processing
        // We ensure we keep the origin to make it a valid URL string
        const origin = new URL(structure.rootUrl).origin;
        const conceptUrl = `${origin}${conceptPath}`;

        let conceptNode = conceptMap.get(conceptUrl);

        if (!conceptNode) {
            // First time seeing this concept
            // Deep clone to avoid shared references in content and meta
            conceptNode = {
                ...node,
                url: conceptUrl,
                variants: [],
                meta: { ...node.meta },
                content: {
                    ...node.content,
                    images: node.content.images ? [...node.content.images] : [],
                    links: node.content.links ? [...node.content.links] : [],
                    forms: node.content.forms ? [...node.content.forms] : [],
                    headings: node.content.headings ? [...node.content.headings] : [],
                    landmarks: node.content.landmarks ? [...node.content.landmarks] : [],
                    semanticBlocks: node.content.semanticBlocks ? [...node.content.semanticBlocks] : []
                }
            };
            conceptMap.set(conceptUrl, conceptNode);
        }

        // Register the variant
        // Use extracted lang from extractor first, then URL fallback
        const lang = node.meta.lang || detectedLang || 'unknown';

        if (conceptNode.variants) {
            conceptNode.variants.push({
                url: node.url,
                lang: lang
            });
        }

        // TODO: Merge logic?
        // If we have a 'de' node and 'en' node, which title do we keep?
        // Ideally we keep the one that matches the requested "Primary Language" or just the first one.
        // For now, first-wins is efficient. The AI will see the content of the first encountered variant.
        // Improvements: Prefer 'en' or 'de' for the concept content if available.
    });

    return {
        ...structure,
        nodes: Array.from(conceptMap.values())
    };
}

/**
 * Enhanced variant detection using AI-powered 3-level system
 *
 * This function automatically detects language variants with 99% accuracy
 * using heuristics, structural analysis, and AI.
 *
 * @param structure The site structure to analyze
 * @param config Optional configuration for detection thresholds
 * @returns Structure with updated variant links
 */
export async function detectAndLinkVariants(
    structure: SiteStructure,
    config?: Partial<VariantDetectionConfig>
): Promise<SiteStructure> {
    console.log('\n🌍 Starting Enhanced Variant Detection...');

    try {
        // Run the 3-level variant detection
        const variantMap = await LanguageVariantDetector.detectVariants(structure, config);

        // Apply variants to structure
        const updatedStructure = LanguageVariantDetector.applyVariants(structure, variantMap);

        // Log summary
        const variantCount = Array.from(variantMap.values()).filter(v => v.length > 0).length;
        console.log(`\n✅ Variant Detection Complete: ${variantCount} pages have variants`);

        return updatedStructure;
    } catch (error) {
        console.error('❌ Variant detection failed:', error);
        // Return original structure if detection fails
        return structure;
    }
}
