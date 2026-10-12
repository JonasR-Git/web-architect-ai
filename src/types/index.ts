export interface SiteNode {
    url: string;
    depth: number;
    type: 'landing' | 'blog_post' | 'product' | 'service' | 'other';
    meta: {
        title: string;
        description: string;
        ogImage?: string;
        canonical?: string;
        robots?: string;
        lang?: string;
        charset?: string;
        viewport?: string; // New: Crucial for mobile-first SEO
        hreflangs?: { lang: string; href: string }[]; // New: For Concept-Based Mapping
        social: {
            ogTitle?: string;
            ogDescription?: string;
            twitterCard?: string;
            twitterSite?: string;
        };
        schemaMarkup: string[];
        geoSignals: {
            hasCitations: boolean; // Links to authority sites
            hasEvidence: boolean;  // Numbers, stats, or specific data points
            hasAuthorInfo: boolean; // Detected 'Author' or 'Person' schema
        };
        designSignals?: {
            hasGlass: boolean;
            hasHardShadows: boolean;
            hasGradients: boolean;
            roundingMode: 'mixed' | 'sharp' | 'soft' | 'full';
            typography: 'serif' | 'sans' | 'mono' | 'mixed';
            spacing: 'compact' | 'comfortable' | 'spacious';
            animationLevel: 'none' | 'subtle' | 'high';
            buttonStyle: 'pill' | 'rounded' | 'sharp' | 'mixed'; // Redundant with roundingMode but specific to buttons? keep simple
            // NEW: Color information from image analysis
            colors?: DesignSystemColors;
        };
        // NEW: Smart Image Intelligence - Component Grouping Summary
        imageComponentSummary?: {
            groupId: string;
            role: string;
            imageCount: number;
            sampleImage: string;
        }[];
    };
    content: {
        h1: string;
        headings: { level: number; text: string }[];
        wordCount: number;
        images: {
            alt: string;
            src: string;
            hasAriaHidden?: boolean;
            context?: string; // Nearby text (h1/h2) or parent selector (nav/footer)
            isLogo?: boolean; // Heuristic detection
            logoProb?: number; // 0-100 confidence
            // NEW: Smart Image Intelligence fields (expanded roles)
            role?: 'logo' | 'hero-background' | 'hero-foreground' | 'gallery' | 'team-avatar' |
            'testimonial' | 'product' | 'icon' | 'sponsor-logo' | 'section-feature' | 'event-photo' |
            'award-badge' | 'location-photo' | 'cta-image' | 'blog-thumbnail' | 'decoration' | 'content' | 'unknown';
            roleConfidence?: number;
            componentHint?: string | null;
            groupId?: string | null;
            usage?: {
                isBackground: boolean;
                isCritical: boolean;
                suggestedSize: 'full' | 'medium' | 'thumbnail';
            };
            // NEW: Color analysis for design system extraction
            colorAnalysis?: ColorAnalysis;
            // NEW: Dimensions for size-based heuristics & duplicate detection
            width?: number;
            height?: number;
            // NEW: Duplicate management (if this is a smaller version of another image)
            masterImage?: string; // src of the larger version
            variants?: string[];  // srcs of smaller versions (if this is the master)
        }[];
        links: LinkAnalysis[];
        forms: FormAnalysis[];
        landmarks: { tag: string; role?: string }[];
        hasSkipLink: boolean;
        hasLegalAccessibilityLink: boolean;
        rawText?: string;
        // Optimization: Context-Aware Blocks
        semanticBlocks?: {
            type: 'header' | 'footer' | 'nav' | 'sidebar' | 'main' | 'article' | 'hero' | 'section' | 'unknown';
            content: string;
            selector: string;
        }[];
        extractedColors?: {
            // Legacy format (Arrays)
            dominant?: string[];

            // Shared properties (Can be string or string[])
            background?: string | string[];
            text?: string | string[];

            // New Semantic format (Strings)
            primary?: string;
            secondary?: string;
            accent?: string;
            _raw?: { backgrounds: string[], texts: string[] };
        };
        // NEW: Advanced analysis results
        designSystem?: DesignSystemExtraction;
        designSystemColors?: DesignSystemColors; // Image-based color palette (brand, hero, overall)
        contentType?: ContentTypeDetection;
        media?: MediaAnalysis;
    };
    tech: {
        detectedFrameworks: string[];
        lighthouseScoreApprox?: number;
        duplicateIds: string[];
    };
    score?: {
        seo: number;
        accessibility: number;
        breakdown: {
            seo: { label: string; score: number; max: number; details?: string }[];
            accessibility: { label: string; score: number; max: number; details?: string }[];
        };
        issues: { category: 'SEO' | 'ACC' | 'TECH'; severity: 'CRITICAL' | 'WARNING' | 'NOTICE'; message: string }[];
    };
    // NEW: For Concept-Based Mapping (Language Agnostic)
    variants?: { url: string; lang: string }[];

    // NEW: Clustering Control - Mark pages as standalone (exclude from automatic clustering)
    excludeFromClustering?: boolean; // If true, this page won't be clustered with similar pages
    clusterExclusionReason?: string; // Why was this page excluded? (e.g., "Landing page", "Manually marked")
    clusterExclusionTimestamp?: number; // When was this page marked as standalone?
}

export interface SiteStructure {
    rootUrl: string;
    nodes: SiteNode[];
    crawledAt: string;
    imageStats?: {
        total: number;          // Total image references across all pages
        unique: number;         // Unique images (by URL)
        deduplicationRate: number; // Percentage of duplicates (0-100)
    };
}

export interface StackConfig {
    framework: 'nextjs' | 'vue';
    css: 'scss-modules' | 'tailwind' | 'css-in-js';
    uiLibrary: 'none' | 'shadcn' | 'radix' | 'headless-ui';
    cms: 'none' | 'strapi' | 'contentful' | 'json';
    database: 'none' | 'postgresql' | 'mongodb';
    auth: 'none' | 'next-auth' | 'clerk';
    deployment: 'vercel' | 'docker' | 'static';
}

import { DesignStyle } from '@/modules/design/data/design-presets';

export interface MockupSiteData {
    siteName?: string;
    h1?: string;
    headings?: { level: number; text: string }[];
    forms?: FormAnalysis[];  // Updated to use new FormAnalysis type
    navigation?: { text: string; href: string }[];
    images?: any[];
    meta?: any;
    extractedColors?: any;
    designSystemColors?: DesignSystemColors; // Image-based color palette
    componentSpec?: any;
    migrationPlan?: any;
    plannedContent?: any;
    rawText?: string;
    assignedLogos?: any[];
}

// --- Cluster Component Architecture Types ---

export interface ComponentDefinition {
    name: string; // e.g. "BlogHero"
    description: string; // e.g. "Primary header with background image"
    props: {
        name: string;
        type: 'string' | 'number' | 'boolean' | 'image' | 'rich-text' | 'date';
        description?: string;
    }[];
}

export interface ClusterComponentSpec {
    clusterId: string;
    components: ComponentDefinition[];
}

export interface PageInstance {
    url: string;
    title: string;
    wordCount: number;
    assetsFound: number;
    // The mapped content data (JSON structure)
    contentData?: any;
    status: 'pending' | 'mapped' | 'approved';
}

export interface ClusterSpec {
    id: string; // e.g. "cluster_blog"
    pattern: string; // e.g. "/blog/*"
    instances: PageInstance[];
    componentSpec?: ClusterComponentSpec; // The library
}

export interface MockupVariant {
    id: string;
    html: string;
    iteration: number;
    timestamp: number;
    archetype?: string;
    isPremium?: boolean;
    generationStages?: 5; // Always 5 for ultra-extreme generation
    critique?: {
        overall_score: number;
        strengths: string[];
        weaknesses: string[];
        improvements: string[];
    };
}

export interface DesignConfig {
    styleIds: DesignStyle[];
    colors: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        accent: string;
    };
    theme: 'light' | 'dark' | 'system';
    roundness: 'sharp' | 'default' | 'soft' | 'full';
    typography: 'modern' | 'classic' | 'tech' | 'humanist';
    // Style Preset (Optional foundation layer)
    stylePreset?: 'minimal' | 'bold' | 'playful' | 'elegant' | 'brutalist' | 'custom';
    // Design Level: Standard (ordentlich) → Semi-Unleashed (mittel) → Unleashed (chaotisch)
    designLevel?: 'standard' | 'semi-unleashed' | 'unleashed';
    // Ultra-Extreme Archetype Selection (only for Unleashed level)
    selectedArchetype?: string; // e.g., 'reality-warp', 'liquid-mercury', 'void-architecture'
    archetypeCategory?: string; // e.g., 'reality-manipulation', 'kinetic-expression', 'minimalism-extremes'
    // Creativity Settings
    creativity: 'standard' | 'balanced' | 'high' | 'experimental';
    creativeFocus: ('header' | 'footer' | 'navigation' | 'layout' | 'typography')[];
    customInstructions: string;
    aiGeneratedInstructions: string;

    // Legacy mapping (kept for stability, mapped to variants[0])
    mockupHtml?: string;
    mockupIteration?: number;

    // New Multi-Mockup State
    mockupVariants?: MockupVariant[];
    activeVariantId?: string;
    mockupHistory?: MockupVariant[];

    mockupFeedback?: {
        likes: string;
        dislikes: string;
    };
    feedbackHistory?: {
        iteration: number;
        feedback: string;
        timestamp?: number;
    }[];
    dna?: {
        spacing: 'compact' | 'comfortable' | 'spacious';
        shadows: 'none' | 'subtle' | 'soft' | 'hard' | 'neo-brutalist';
        borderRadius: string; // e.g. "0.5rem"
        typographyScale: string; // e.g. "ratio-1.25"
        glassmorphism: boolean;
        microInteractions: string[];
    };
}


export interface AIResponseMetadata {
    model: string;
    tokensIn: number;
    tokensOut: number;
    duration: string;
}

export type MappingAction = 'keep' | 'redirect' | 'merge' | 'split' | 'delete';
export type PatternMappingAction = Exclude<MappingAction, 'split'>;

export interface PageMapping {
    old_url: string;
    new_path: string;
    action: MappingAction;
    reason?: string;
    description?: string;
    type?: 'page' | 'layout';
    content_goals?: string[];
    sections?: any[];
    merged_with?: string | null;
}

export interface PatternMapping {
    pattern: string;
    target_base: string;
    action: PatternMappingAction;
    reason?: string;
    description?: string;
    type?: 'page' | 'layout';
    content_goals?: string[];
}

export interface SitemapEntry {
    path: string;
    label: string;
    type: 'page' | 'layout';
}

export interface MigrationPlan {
    rationale: string;
    sitemap: SitemapEntry[];
    page_mapping: PageMapping[];
    pattern_mapping?: PatternMapping[];
    clusters?: ClusterSpec[];
    meta?: AIResponseMetadata;
}

export interface ComponentSpecification {
    groups: {
        name: string;
        components: {
            name: string;
            description: string;
            usage: string[];
            props: string[];
        }[];
    }[];
    design_system?: {
        detected_style_preset?: string;
        roundness?: string;
        typography?: {
            fontFamily?: string;
        };
        colors?: {
            primary?: string;
            secondary?: string;
        };
    };
    meta?: AIResponseMetadata;
}

export interface ClusterOverrides {
    forceArchetypes?: string[]; // Patterns to force as clusters
    ignorePatterns?: string[];  // Patterns to never cluster
    mergeRules?: Record<string, string>; // Pattern merging: { 'sourcePattern': 'targetPattern' }
    exceptions?: string[]; // URLs that should NEVER be clustered (Force Unique)
    renames?: Record<string, string>; // Pattern -> Custom Name
}

// --- Mapping Validation Types ---

export interface SourcePage {
    id: string;
    url: string;
    title?: string;
    description?: string;
    type?: 'page' | 'cluster';
    count?: number;
}

export interface SectionImage {
    src: string;
    status: 'mandatory' | 'optional';
    alt?: string;
}

export interface TargetSlot {
    id: string;
    path: string;
    label: string;
    type?: 'page' | 'layout';
    action: MappingAction;
    sourceIds: string[];
    description?: string;
    content_goals?: string[];
    sections?: {
        type: string;
        title: string;
        content_hint: string;
        headline?: string;
        content?: string;
        images?: SectionImage[];
    }[];
    logos?: SectionImage[];
    language?: string;
    canonical?: string;
    hreflangs?: { lang: string; url: string }[];
    user_prompt?: string;
    dependencies?: string[];
    dependencies_detected?: boolean;
    sourceDetails?: any[];
    previousState?: TargetSlot;
    lastGeneratedAt?: number;
    lastModifiedAt?: number;
}

export interface UnmappedSource {
    id: string;
    url: string;
    title?: string;
    type: 'page' | 'cluster';
    count?: number;
    suggestedTarget?: string; // AI-suggested path
}

export interface DuplicateTarget {
    targetId: string;
    targetPath: string;
    sourceIds: string[];
    duplicateCount: number;
}

export interface PatternCoverageIssue {
    pattern: string;
    expectedCount: number;
    mappedCount: number;
    unmappedUrls: string[];
}

export interface MappingValidationResult {
    isComplete: boolean;
    coveragePercentage: number;
    totalSources: number;
    mappedSources: number;
    unmappedSources: UnmappedSource[];
    emptyTargets: TargetSlot[];
    duplicateTargets: DuplicateTarget[];
    patternCoverageIssues: PatternCoverageIssue[];
}

export interface AutoMappingSuggestion {
    sourceId: string;
    suggestedPath: string;
    action: Exclude<MappingAction, 'delete'>;
    reason: string;
    existingTargetId?: string; // If set, add source to this existing target instead of creating new one
}

// --- Cluster Template Types ---

export interface ClusterTemplate {
    clusterId: string;
    pattern: string;
    representativeExample: PageInstance;
    templateSpec: TargetSlot;
    instanceCount: number;
    generationInstructions: string;
}

// --- Image Validation Types ---

export interface InvalidImage {
    src: string;
    section: string;
    reason: 'not_in_inventory' | 'broken_link' | 'low_quality';
}

export interface ImageValidationResult {
    isValid: boolean;
    invalidImages: InvalidImage[];
    warnings: string[];
}

export interface QualityScore {
    url: string;
    score: number;
    reasons: string[];
    recommendation: 'keep' | 'merge' | 'delete';
}

// --- Language Variant Detection Types ---

export interface VariantDetectionResult {
    node1Url: string;
    node2Url: string;
    confidence: number; // 0-100
    level: 'heuristic' | 'structural' | 'ai';
    isVariant: boolean;
    reasons: string[];
}

export interface SemanticTranslationMap {
    [key: string]: string[]; // e.g., { 'leistungen': ['services', 'servizi'] }
}

// --- Content-Type Detection Types ---

/**
 * Simplified content profile for cluster comparison
 */
export interface ContentProfile {
    url: string;
    title: string;
    wordCount: number;
    headings: string[]; // Extracted text from headings
    linkCount: number;
    schemaTypes: string[]; // e.g., ['Article', 'BlogPosting']
    imageCount: number;
    hasForm: boolean;
    // Optional: Content samples for AI analysis
    contentSample?: string; // First 500 chars of rawText
}

/**
 * Result of comparing two clusters' content types
 */
export interface ClusterComparisonResult {
    decision: 'SAME_TYPE' | 'DIFFERENT_TYPE';
    confidence: number; // 0-100
    cluster_a_type: string; // e.g., 'article', 'taxonomy', 'product'
    cluster_b_type: string;
    evidence: {
        similarities: string[];
        differences: string[];
    };
    recommendation: 'MERGE' | 'KEEP_SEPARATE';
    reasoning: string; // German explanation
}

/**
 * Cluster data for comparison
 */
export interface ClusterForComparison {
    pattern: string;
    instances: SiteNode[];
    sampleProfiles?: ContentProfile[]; // Cached profiles
}

/**
 * Result of conflict detection between clusters
 */
export interface ClusterConflict {
    clusterA: ClusterForComparison;
    clusterB: ClusterForComparison;
    conflictType: 'same_base_path' | 'similar_pattern' | 'overlapping_urls';
    severity: 'high' | 'medium' | 'low';
}

export interface VariantDetectionConfig {
    enableHeuristic: boolean;
    enableStructural: boolean;
    enableAI: boolean;
    heuristicThreshold: number; // 0-100
    structuralThreshold: number; // 0-100
    aiThreshold: number; // 0-100
    customTranslations?: SemanticTranslationMap;
    batchSize?: number; // For AI processing
}

/**
 * Color palette extracted from an image
 */
export interface ColorPalette {
    primary: string;        // Hex color
    secondary?: string;
    accent?: string;
    vibrant?: string;
    muted?: string;
    lightVibrant?: string;
    darkVibrant?: string;
}

/**
 * Color analysis result for an image
 */
export interface ColorAnalysis {
    palette: ColorPalette;
    dominantColor: string;
    brightness: 'light' | 'medium' | 'dark';
    saturation: 'vibrant' | 'muted' | 'grayscale';
}

/**
 * Positional color data extracted from specific regions of an image
 * Enables harmonious transitions and contextual color matching
 */
export interface PositionalColors {
    main: ColorPalette;           // Overall image palette (same as ColorAnalysis.palette)
    top: string[];                // Top 20% - useful for sky, headers, fade-ins
    bottom: string[];             // Bottom 20% - useful for ground, footers, fade-outs
    left: string[];               // Left 20% - useful for sidebar transitions
    right: string[];              // Right 20% - useful for content flow
    center: string[];             // Center 40x40% - main subject colors
    corners: {                    // Corner accent colors
        topLeft: string;
        topRight: string;
        bottomLeft: string;
        bottomRight: string;
    };
}

/**
 * Enhanced image color analysis with positional data
 */
export interface ImageColorAnalysis extends ColorAnalysis {
    positional?: PositionalColors; // Optional positional breakdown for advanced use cases
}

/**
 * Design system colors extracted from site-wide image analysis
 */
export interface DesignSystemColors {
    brand?: ColorPalette;      // From logo images
    hero?: string[];           // Dominant colors from hero images
    overall?: string[];        // All unique colors from important images
}

// ==================== NEW: ADVANCED ANALYSIS TYPES ====================

/**
 * Form Analysis - Intelligent form detection and classification
 */
export type FormPurpose = 'contact' | 'newsletter' | 'search' | 'booking' | 'login' | 'comment' | 'filter' | 'payment' | 'unknown';
export type ButtonStyle = 'primary' | 'secondary' | 'ghost' | 'link' | 'unknown';

export interface FormField {
    name?: string;
    type: string;              // email, tel, text, textarea, select, etc.
    label?: string;
    placeholder?: string;
    required: boolean;
    validation?: string;       // pattern attribute
    options?: string[];        // for select/radio
}

export interface FormAnalysis {
    formId?: string;
    action?: string;              // Submit URL
    method?: string;              // POST/GET
    purpose: FormPurpose;
    purposeConfidence: number;    // 0-100
    fields: FormField[];
    submitButton?: {
        text: string;
        classes: string[];
        style: ButtonStyle;
    };
    hasHoneypot: boolean;         // Spam protection detected
    hasRecaptcha: boolean;        // reCAPTCHA detected
    integrations: string[];       // Mailchimp, Hubspot, ActiveCampaign, etc.
    context?: string;             // Surrounding text for better understanding
}

/**
 * Link Analysis - Intelligent link classification (CTAs, Navigation, Social)
 */
export type LinkType = 'internal' | 'external' | 'anchor' | 'tel' | 'mailto';
export type LinkRole = 'navigation' | 'cta' | 'social' | 'footer' | 'content' | 'breadcrumb' | 'pagination';
export type SocialPlatform = 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'github' | 'tiktok' | 'whatsapp' | 'email';

export interface LinkAnalysis {
    href: string;
    text: string;
    type: LinkType;
    role: LinkRole;
    roleConfidence: number;       // 0-100
    context?: string;             // Parent section (header, footer, main)
    isButton: boolean;            // <button> or .btn class
    buttonStyle?: ButtonStyle;    // primary, secondary, ghost, link
    social?: {
        platform: SocialPlatform;
        handle?: string;
    };
    ariaLabel?: string;
    opensInNewTab: boolean;
    isDownload: boolean;
}

/**
 * Design System Extraction - Typography, Spacing, Border Radius
 */
export interface DesignSystemExtraction {
    typography: {
        fontFamilies: string[];           // ['Inter', 'Roboto']
        headingSizes: {                   // Font sizes for headings
            h1?: string;
            h2?: string;
            h3?: string;
            h4?: string;
            h5?: string;
            h6?: string;
        };
        bodySize?: string;                // Base font size
        fontWeights: number[];            // [400, 600, 700]
        lineHeights: number[];            // [1.5, 1.6, 1.8]
    };
    spacing: {
        scale: number[];                  // [4, 8, 16, 24, 32, 48, 64]
        containerMaxWidth?: string;       // 1200px, 1440px
        commonPaddings: string[];
        commonMargins: string[];
    };
    borderRadius: {
        values: number[];                 // [4px, 8px, 16px]
        mostCommon?: string;
        mode: 'sharp' | 'soft' | 'rounded' | 'pill';
    };
    shadows: {
        hasShadows: boolean;
        types: ('soft' | 'hard' | 'none')[];
        commonValues: string[];
    };
    colorPalette: {
        primary: string[];
        secondary: string[];
        text: string[];
        background: string[];
    };
}

/**
 * Content Type Detection - Blog, Product, Event, etc.
 */
export type ContentType = 'blog-post' | 'product' | 'event' | 'team-member' | 'case-study' | 'service' | 'landing-page' | 'documentation' | 'faq' | 'page';

export interface ContentTypeDetection {
    type: ContentType;
    confidence: number;           // 0-100
    structuredData?: {
        // For blog posts
        author?: string;
        publishDate?: string;
        modifiedDate?: string;
        categories?: string[];
        tags?: string[];
        readingTime?: number;

        // For products
        price?: string;
        currency?: string;
        sku?: string;
        rating?: number;
        reviewCount?: number;
        inStock?: boolean;
        brand?: string;

        // For events
        eventDate?: string;
        eventEndDate?: string;
        location?: string;
        ticketLink?: string;
        organizer?: string;

        // For team members
        role?: string;
        email?: string;
        phone?: string;
        socialLinks?: string[];

        // For case studies
        client?: string;
        industry?: string;
        results?: string[];
    };
    schemaMarkup?: any;          // JSON-LD data
}

/**
 * Media Analysis - Videos, Embeds, Interactive Elements
 */
export type VideoType = 'youtube' | 'vimeo' | 'native' | 'other';
export type EmbedType = 'map' | 'calendar' | 'form' | 'social-feed' | 'chart' | 'widget' | 'other';
export type InteractiveType = 'slider' | 'carousel' | 'accordion' | 'tabs' | 'modal' | 'dropdown' | 'tooltip' | 'lightbox';

export interface VideoAnalysis {
    src: string;
    type: VideoType;
    videoId?: string;            // YouTube/Vimeo ID
    thumbnail?: string;
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
    context?: string;            // Section where video appears
    title?: string;
}

export interface EmbedAnalysis {
    type: EmbedType;
    provider?: string;           // Google Maps, Calendly, Typeform, etc.
    embedUrl?: string;
    iframeSrc?: string;
    context?: string;
}

export interface InteractiveElement {
    type: InteractiveType;
    count: number;
    items?: {
        title?: string;
        content?: string;
    }[];
    hasAutoplay?: boolean;       // For sliders/carousels
    isAccessible?: boolean;      // Keyboard navigation, ARIA labels
}

export interface MediaAnalysis {
    videos: VideoAnalysis[];
    embeds: EmbedAnalysis[];
    interactiveElements: InteractiveElement[];
    hasAudio: boolean;
    hasSvgAnimations: boolean;
}

// ==================== REFACTORING: NEW TYPE SAFETY TYPES ====================

/**
 * Critique/Audit result from AI analysis
 */
export interface CritiqueResult {
    summary: string;
    issues: {
        category: string;
        severity: 'critical' | 'warning' | 'notice';
        message: string;
    }[];
    recommendations: string[];
    _meta?: AIResponseMetadata;
}

/**
 * Final output combining spec and implementation plan
 */
export interface FinalOutput {
    spec: any; // TODO: Define proper spec type structure
    implPlan: ImplementationPlan;
}

/**
 * Implementation plan structure
 */
export interface ImplementationPlan {
    phases: {
        name: string;
        description: string;
        tasks: string[];
    }[];
    content_files?: {
        path: string;
        content: string;
    }[];
    dependencies: string[];
    structure?: any;
    _meta?: AIResponseMetadata;
}

/**
 * Custom asset uploaded by user
 */
export interface CustomAsset {
    id: string;
    src: string;
    alt?: string;
    type: 'logo' | 'icon' | 'custom';
}

/**
 * Log entry for process logging
 */
export interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    meta?: AIResponseMetadata;
}

/**
 * Real-time crawl statistics
 */
export interface CrawlStats {
    processed: number;
    found: number;
    currentUrl: string;
    queueLength: number;
    activeWorkers?: number;
}

/**
 * Downloaded assets with base64 and mapping
 */
export interface DownloadedAssets {
    images: Record<string, string>;  // filename -> base64
    map: Record<string, string>;     // originalUrl -> filename
}

/**
 * Token usage statistics
 */
export interface TokenStats {
    totalIn: number;
    totalOut: number;
}

/**
 * Generic progress tracking
 */
export interface Progress {
    current: number;
    total: number;
}
