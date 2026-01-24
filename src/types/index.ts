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
            'award-badge' | 'location-photo' | 'cta-image' | 'decoration' | 'content' | 'unknown';
            roleConfidence?: number;
            componentHint?: string | null;
            groupId?: string | null;
            usage?: {
                isBackground: boolean;
                isCritical: boolean;
                suggestedSize: 'full' | 'medium' | 'thumbnail';
            };
        }[];
        links: { text: string; href: string; ariaLabel?: string }[];
        forms: { id?: string; label?: string; hasLabel: boolean; type?: string }[];
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
}

export interface SiteStructure {
    rootUrl: string;
    nodes: SiteNode[];
    crawledAt: string;
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
    forms?: { id?: string; label?: string; hasLabel?: boolean; type?: string }[];
    navigation?: { text: string; href: string }[];
    images?: any[];
    meta?: any;
    extractedColors?: any;
    componentSpec?: any;
    migrationPlan?: any;
    plannedContent?: any;
    rawText?: string;
}

export interface MockupVariant {
    id: string;
    html: string;
    iteration: number;
    timestamp: number;
    archetype?: string;
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
    // Creativity Settings
    creativity: 'standard' | 'balanced' | 'high' | 'experimental';
    creativeFocus: ('header' | 'footer' | 'navigation' | 'layout' | 'typography')[];
    unleashedMode: 'off' | 'on' | 'on-with-colors'; // 'on' = Total freedom, 'on-with-colors' = Freedom but strict colors
    unleashedArchetype?: 'chaos' | 'cinematic' | 'hightech' | 'luxury'; // Specific flavor of unleashed mode
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

export interface MigrationPlan {
    rationale: string;
    sitemap: { path: string; label: string; type: string }[];
    page_mapping: { old_url: string; new_path: string; action: string }[];
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
    meta?: AIResponseMetadata;
}
