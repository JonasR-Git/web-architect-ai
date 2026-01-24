/**
 * Advanced Context-Aware Image Selection
 * 
 * Intelligently selects images based on AI-recommended components (componentSpec).
 * Features:
 * - 100+ keyword patterns across 15+ categories
 * - German/English bilingual support
 * - Fuzzy matching for component names
 * - Smart per-category limits
 */

// ============================================================================
// COMPREHENSIVE KEYWORD DATABASE
// ============================================================================

interface CategoryConfig {
    patterns: RegExp;  // Combined regex for all keywords
    roles: string[];   // Image roles that match this category
    limit: number;     // Max images to select
    priority: number;  // Lower = higher priority
}

const CATEGORY_DATABASE: Record<string, CategoryConfig> = {
    // --- HERO/BANNER SECTION ---
    hero: {
        patterns: /hero|banner|masthead|jumbotron|splash|fullscreen|header-bg|hauptbild|titelbild|slider/i,
        roles: ['hero-background', 'hero-foreground', 'cta-image'],
        limit: 2,
        priority: 1
    },

    // --- SPONSORSHIP/PARTNERSHIP ---
    sponsorship: {
        patterns: /sponsor|partner|förder|unterstuetz|unterstütz|client|kunde|kunden|supporter|backer|förderer|gönner|mäzen|patron|logo-bar|brand-wall/i,
        roles: ['sponsor-logo', 'award-badge'],
        limit: 12,
        priority: 3
    },

    // --- SECTIONS/INSTRUMENTS/DEPARTMENTS ---
    sections: {
        patterns: /section|register|instrument|abteilung|bereich|department|fachbereich|sparte|gruppe|ensemble|orchester-section|woodwind|brass|percussion|strings|bläser|streicher|schlagwerk/i,
        roles: ['section-feature', 'content'],
        limit: 10,
        priority: 4
    },

    // --- GALLERY/PORTFOLIO ---
    gallery: {
        patterns: /gallery|galerie|portfolio|showcase|impressionen|fotos|photos|bilder|images|slideshow|carousel|lightbox|fancybox|photoswipe|masonry|grid-gallery|foto-galerie/i,
        roles: ['gallery', 'event-photo'],
        limit: 10,
        priority: 5
    },

    // --- TEAM/ABOUT ---
    team: {
        patterns: /team|mitglied|member|staff|personal|mitarbeiter|leitung|leadership|vorstand|board|author|autor|person|menschen|about|über|ueber|wir|profil|portrait|dirigent|conductor|musician|musiker/i,
        roles: ['team-avatar', 'testimonial'],
        limit: 8,
        priority: 6
    },

    // --- EVENTS/CONCERTS ---
    events: {
        patterns: /event|veranstaltung|konzert|concert|aufführung|performance|show|gig|termin|termine|schedule|calendar|kalender|festival|tour|live/i,
        roles: ['event-photo', 'gallery'],
        limit: 8,
        priority: 7
    },

    // --- TESTIMONIALS/REVIEWS ---
    testimonials: {
        patterns: /testimonial|review|bewertung|feedback|referenz|zitat|quote|kundenstimme|meinung|recommendation|empfehlung/i,
        roles: ['testimonial', 'team-avatar'],
        limit: 6,
        priority: 8
    },

    // --- PRODUCTS/SERVICES ---
    products: {
        patterns: /product|produkt|service|leistung|angebot|offering|shop|store|artikel|item|merchandise|merch|pricing|preis/i,
        roles: ['product', 'content'],
        limit: 10,
        priority: 9
    },

    // --- FEATURES/BENEFITS ---
    features: {
        patterns: /feature|vorteil|benefit|eigenschaft|merkmal|highlight|usp|unique|besonderheit|icon-box|feature-box|advantage/i,
        roles: ['icon', 'content'],
        limit: 6,
        priority: 10
    },

    // --- AWARDS/CERTIFICATIONS ---
    awards: {
        patterns: /award|auszeichnung|preis|prize|certif|zertifikat|siegel|badge|trophy|honor|ehrung|akkreditierung|accreditation/i,
        roles: ['award-badge', 'icon'],
        limit: 6,
        priority: 11
    },

    // --- LOCATION/VENUE ---
    location: {
        patterns: /location|standort|venue|ort|adresse|address|map|karte|anfahrt|directions|gebäude|building|räumlichkeit|facility|halle|hall|saal/i,
        roles: ['location-photo', 'content'],
        limit: 4,
        priority: 12
    },

    // --- BLOG/NEWS/ARTICLES ---
    blog: {
        patterns: /blog|news|artikel|article|post|beitrag|aktuelles|neuigkeiten|presse|press|media|magazin|journal/i,
        roles: ['content', 'gallery'],
        limit: 6,
        priority: 13
    },

    // --- CALL-TO-ACTION ---
    cta: {
        patterns: /cta|call-to-action|action|aufforderung|kontakt|contact|anmelden|register|signup|join|mitmachen|newsletter|subscribe/i,
        roles: ['cta-image', 'content'],
        limit: 2,
        priority: 14
    },

    // --- FOOTER ---
    footer: {
        patterns: /footer|fußzeile|fusszeile|bottom|legal|impressum|datenschutz/i,
        roles: ['sponsor-logo', 'icon'],
        limit: 4,
        priority: 15
    }
};

// Always include these roles regardless of componentSpec
const ALWAYS_INCLUDE: Record<string, number> = {
    'logo': 1,
    'hero-background': 1
};

// ============================================================================
// EXPORT INTERFACES
// ============================================================================

export interface ImageForSelection {
    src: string;
    alt?: string;
    role?: string;
    roleConfidence?: number;
    context?: string;
    isLogo?: boolean;
    sourcePage?: string;
    [key: string]: any;
}

export interface ComponentSpec {
    components?: Array<{
        name?: string;
        type?: string;
        purpose?: string;
        description?: string;
    }>;
    layout?: any;
}

export interface ImageSelectionResult {
    selectedImages: ImageForSelection[];
    summary: string[];
    totalAvailable: number;
    categoryMatches: Record<string, { matched: boolean; imageCount: number }>;
    // AI Fallback Info
    unknownImages: ImageForSelection[];
    unknownCount: number;
    unknownPercentage: number;
    aiClassification?: {
        recommended: boolean;
        tokenEstimate: number;
        estimatedCost: number;
        requiresApproval: boolean;
    };
}

// ============================================================================
// MAIN SELECTION FUNCTION
// ============================================================================

/**
 * Analyzes componentSpec to determine which image roles are needed,
 * then selects appropriate images from the pool.
 */
export function selectImagesForMockup(
    allImages: ImageForSelection[],
    componentSpec?: ComponentSpec,
    prioritizedPaths?: string[]
): ImageSelectionResult {
    const categoryMatches: Record<string, { matched: boolean; imageCount: number }> = {};
    const selectedByRole: Map<string, ImageForSelection[]> = new Map();
    const neededRoles: Map<string, number> = new Map();
    const summary: string[] = [];

    // STRICT ASSIGNMENT LOGIC:
    // Sort images so that those from prioritized paths come FIRST.
    // This ensures they fill the available slots for their roles.
    const sortedImages = [...allImages].sort((a, b) => {
        const aPrio = a.sourcePage && prioritizedPaths?.some(p => a.sourcePage?.includes(p)) ? 1 : 0;
        const bPrio = b.sourcePage && prioritizedPaths?.some(p => b.sourcePage?.includes(p)) ? 1 : 0;
        return bPrio - aPrio;
    });

    // Initialize always-include roles
    for (const [role, limit] of Object.entries(ALWAYS_INCLUDE)) {
        neededRoles.set(role, limit);
        selectedByRole.set(role, []);
    }

    // Build search text from all components
    let componentSearchText = '';
    if (componentSpec?.components && componentSpec.components.length > 0) {
        componentSearchText = componentSpec.components
            .map(c => `${c.name || ''} ${c.type || ''} ${c.purpose || ''} ${c.description || ''}`)
            .join(' ')
            .toLowerCase();
    }

    // Match components against category database
    for (const [categoryName, config] of Object.entries(CATEGORY_DATABASE)) {
        const hasMatch = componentSearchText ? config.patterns.test(componentSearchText) : false;

        categoryMatches[categoryName] = { matched: hasMatch, imageCount: 0 };

        if (hasMatch) {
            for (const role of config.roles) {
                const currentLimit = neededRoles.get(role) || 0;
                neededRoles.set(role, Math.max(currentLimit, config.limit));
                if (!selectedByRole.has(role)) {
                    selectedByRole.set(role, []);
                }
            }
        }
    }

    // If no components matched, use sensible defaults for a homepage
    const matchedCategories = Object.values(categoryMatches).filter(m => m.matched).length;
    if (matchedCategories === 0) {
        console.log('[ImageSelection] No component matches found, using homepage defaults');
        // Default homepage roles
        neededRoles.set('hero-background', 1);
        neededRoles.set('logo', 1);
        neededRoles.set('gallery', 6);
        neededRoles.set('team-avatar', 4);
        neededRoles.set('sponsor-logo', 6);
        neededRoles.set('section-feature', 4);
        neededRoles.set('content', 4);

        for (const role of ['gallery', 'team-avatar', 'sponsor-logo', 'section-feature', 'content']) {
            if (!selectedByRole.has(role)) {
                selectedByRole.set(role, []);
            }
        }
    }

    // Select images based on needed roles (using sorted list)
    for (const image of sortedImages) {
        const imageRole = image.role || 'unknown';

        // Check if this role is needed
        if (neededRoles.has(imageRole)) {
            const limit = neededRoles.get(imageRole)!;
            const currentSelection = selectedByRole.get(imageRole) || [];

            if (currentSelection.length < limit) {
                currentSelection.push(image);
                selectedByRole.set(imageRole, currentSelection);
            }
        }

        // Special case: logo detection by isLogo flag
        if (image.isLogo && (selectedByRole.get('logo')?.length || 0) < (neededRoles.get('logo') || 1)) {
            const logoSelection = selectedByRole.get('logo') || [];
            if (!logoSelection.some(img => img.src === image.src)) {
                logoSelection.push(image);
                selectedByRole.set('logo', logoSelection);
            }
        }
    }

    // Update category image counts
    for (const [categoryName, config] of Object.entries(CATEGORY_DATABASE)) {
        let count = 0;
        for (const role of config.roles) {
            count += selectedByRole.get(role)?.length || 0;
        }
        categoryMatches[categoryName].imageCount = count;
    }

    // Flatten results ordered by priority
    const selectedImages: ImageForSelection[] = [];
    const roleOrder = [
        'logo', 'hero-background', 'hero-foreground',
        'section-feature', 'sponsor-logo', 'gallery',
        'team-avatar', 'event-photo', 'testimonial',
        'product', 'award-badge', 'location-photo',
        'cta-image', 'icon', 'content', 'unknown'
    ];

    for (const role of roleOrder) {
        const images = selectedByRole.get(role);
        if (images && images.length > 0) {
            selectedImages.push(...images);
            summary.push(`${images.length}x ${role}`);
        }
    }

    // Add any remaining roles not in our explicit order
    for (const [role, images] of selectedByRole.entries()) {
        if (!roleOrder.includes(role) && images.length > 0) {
            selectedImages.push(...images);
            summary.push(`${images.length}x ${role}`);
        }
    }

    // Track unknown images for potential AI classification
    const unknownImages = allImages.filter(img => img.role === 'unknown' || !img.role);
    const unknownCount = unknownImages.length;
    const unknownPercentage = allImages.length > 0 ? (unknownCount / allImages.length) * 100 : 0;

    // Estimate tokens for AI classification (if needed)
    const AI_THRESHOLD = 30; // Recommend AI if >30% unknown
    const TOKENS_PER_IMAGE = 50; // Approximate tokens per image
    const AUTO_APPROVE_LIMIT = 15000;

    let aiClassification: ImageSelectionResult['aiClassification'] = undefined;

    if (unknownPercentage > AI_THRESHOLD && unknownCount > 5) {
        const tokenEstimate = unknownCount * TOKENS_PER_IMAGE + 500; // +500 for system prompt
        const estimatedCost = tokenEstimate * 0.0000004; // Approximate Gemini Flash cost

        aiClassification = {
            recommended: true,
            tokenEstimate,
            estimatedCost,
            requiresApproval: tokenEstimate > AUTO_APPROVE_LIMIT
        };

        console.log(`[ImageSelection] AI classification recommended: ${unknownCount} unknowns (${unknownPercentage.toFixed(1)}%), ~${tokenEstimate} tokens`);
    }

    // Log results
    console.log(`[ImageSelection] Selected ${selectedImages.length}/${allImages.length} images: ${summary.join(', ')}`);
    console.log(`[ImageSelection] Unknown images: ${unknownCount}/${allImages.length} (${unknownPercentage.toFixed(1)}%)`);
    console.log(`[ImageSelection] Category matches:`, Object.entries(categoryMatches)
        .filter(([_, v]) => v.matched)
        .map(([k, v]) => `${k}(${v.imageCount})`)
        .join(', ') || 'none (using defaults)');

    return {
        selectedImages,
        summary,
        totalAvailable: allImages.length,
        categoryMatches,
        unknownImages,
        unknownCount,
        unknownPercentage,
        aiClassification
    };
}
