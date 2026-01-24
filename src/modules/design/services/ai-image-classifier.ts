/**
 * AI Image Classifier Service
 * 
 * Fallback classification for images that couldn't be identified by heuristics.
 * Uses OpenRouter API (same as the rest of the codebase).
 * Features:
 * - Token estimation before API call
 * - Auto-approve for batches under threshold
 * - Returns classification request for frontend confirmation when over threshold
 */

import { openRouter, AI_MODELS } from '@/lib/openai';
import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';

// ============================================================================
// TYPES
// ============================================================================

export interface ImageForClassification {
    src: string;
    alt?: string;
    context?: string;
}

export interface ClassificationResult {
    src: string;
    role: string;
    confidence: number;
}

export interface AIClassificationResponse {
    success: true;
    classifications: ClassificationResult[];
    tokensUsed: number;
    estimatedCost: number;
}

export interface AIClassificationPending {
    success: false;
    requiresApproval: true;
    imageCount: number;
    tokenEstimate: number;
    estimatedCost: number;
    images: ImageForClassification[];
}

export type AIClassificationResult = AIClassificationResponse | AIClassificationPending;

// ============================================================================
// TOKEN ESTIMATION
// ============================================================================

const TOKENS_PER_CHAR = 0.25; // ~4 chars per token
const OVERHEAD_PER_IMAGE = 25; // JSON structure overhead
const SYSTEM_PROMPT_TOKENS = 500; // Approximate system prompt size
const RESPONSE_TOKENS_PER_IMAGE = 35; // Estimated response per image

/**
 * Estimate token usage for a batch of images
 */
export function estimateTokens(images: ImageForClassification[]): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
} {
    let inputTokens = SYSTEM_PROMPT_TOKENS;

    for (const img of images) {
        const srcTokens = Math.ceil((img.src?.length || 0) * TOKENS_PER_CHAR);
        const altTokens = Math.ceil((img.alt?.length || 0) * TOKENS_PER_CHAR);
        const ctxTokens = Math.ceil((img.context?.length || 0) * TOKENS_PER_CHAR);
        inputTokens += srcTokens + altTokens + ctxTokens + OVERHEAD_PER_IMAGE;
    }

    const outputTokens = images.length * RESPONSE_TOKENS_PER_IMAGE;
    const totalTokens = inputTokens + outputTokens;

    // OpenRouter typical pricing: ~$0.0001 per 1K tokens for cheap models
    const estimatedCost = (totalTokens / 1000) * 0.0001;

    return { inputTokens, outputTokens, totalTokens, estimatedCost };
}

// ============================================================================
// VALID ROLES
// ============================================================================

const VALID_ROLES = [
    'logo', 'hero-background', 'hero-foreground', 'gallery', 'team-avatar',
    'testimonial', 'product', 'icon', 'sponsor-logo', 'section-feature',
    'event-photo', 'award-badge', 'location-photo', 'cta-image',
    'decoration', 'content', 'unknown'
];

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

/**
 * Classify unknown images using AI via OpenRouter.
 * 
 * @param images - Array of images to classify
 * @param autoApproveThreshold - Token threshold for auto-approval (default: 15000)
 * @param forceClassify - Skip approval check and classify immediately
 */
export async function classifyUnknownImages(
    images: ImageForClassification[],
    options: {
        autoApproveThreshold?: number;
        forceClassify?: boolean;
    } = {}
): Promise<AIClassificationResult> {
    const { autoApproveThreshold = 15000, forceClassify = false } = options;

    if (images.length === 0) {
        return {
            success: true,
            classifications: [],
            tokensUsed: 0,
            estimatedCost: 0
        };
    }

    // Estimate tokens
    const estimate = estimateTokens(images);

    console.log(`[AIClassifier] Estimating ${estimate.totalTokens} tokens for ${images.length} images (cost: $${estimate.estimatedCost.toFixed(4)})`);

    // Check if we need approval
    if (!forceClassify && estimate.totalTokens > autoApproveThreshold) {
        console.log(`[AIClassifier] Token estimate ${estimate.totalTokens} exceeds threshold ${autoApproveThreshold}, requesting approval`);
        return {
            success: false,
            requiresApproval: true,
            imageCount: images.length,
            tokenEstimate: estimate.totalTokens,
            estimatedCost: estimate.estimatedCost,
            images
        };
    }

    // Proceed with classification
    console.log(`[AIClassifier] Classifying ${images.length} images via OpenRouter...`);

    try {
        const systemPrompt = `You are an image classifier for website mockups. Classify each image into a semantic role.

Available roles:
- logo: Brand/company logos
- hero-background: Large banner/header background images
- gallery: Photo galleries, portfolios, image collections
- team-avatar: Team member photos, staff portraits
- sponsor-logo: Sponsor/partner/client logos
- section-feature: Section-specific feature images (instruments, departments, etc.)
- event-photo: Event/concert/performance photos
- product: Product images for e-commerce
- testimonial: Customer review avatars
- icon: Icons, small graphics
- cta-image: Call-to-action section backgrounds
- content: General content images
- unknown: Cannot determine

Respond with a JSON object: { "classifications": [{ "src": "...", "role": "...", "confidence": 0-100 }] }`;

        const userPrompt = `Classify these ${images.length} images:

${images.map((img, i) => `${i + 1}. URL: ${img.src}
   Alt: ${img.alt || '(none)'}
   Context: ${img.context || '(none)'}`).join('\n\n')}

Return JSON only.`;

        const completion = await openRouter.chat.send({
            model: AI_MODELS.default,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: false,
            max_tokens: 4000,
        } as any);

        const rawContent = completion.choices?.[0]?.message?.content;

        if (!rawContent) {
            throw new Error('No content received from AI');
        }

        // Parse the response
        let content = typeof rawContent === 'string' ? rawContent :
            Array.isArray(rawContent) ? rawContent.map((p: any) => p.type === 'text' ? p.text : '').join('') : '';

        // Extract JSON
        let parsed: any;
        try {
            // Try to find JSON in code block
            const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
            if (codeBlockMatch) {
                content = codeBlockMatch[1];
            } else {
                // Find first { to last }
                const firstBrace = content.indexOf('{');
                const lastBrace = content.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace > firstBrace) {
                    content = content.substring(firstBrace, lastBrace + 1);
                }
            }

            parsed = JSON5.parse(content);
        } catch (e) {
            // Try jsonrepair
            try {
                const repaired = jsonrepair(content);
                parsed = JSON5.parse(repaired);
            } catch (e2) {
                throw new Error('Failed to parse AI response as JSON');
            }
        }

        // Validate and normalize classifications
        const classifications: ClassificationResult[] = [];

        if (parsed.classifications && Array.isArray(parsed.classifications)) {
            for (const c of parsed.classifications) {
                if (c.src && c.role) {
                    classifications.push({
                        src: c.src,
                        role: VALID_ROLES.includes(c.role) ? c.role : 'unknown',
                        confidence: typeof c.confidence === 'number' ? Math.min(100, Math.max(0, c.confidence)) : 50
                    });
                }
            }
        }

        console.log(`[AIClassifier] Successfully classified ${classifications.length} images`);

        return {
            success: true,
            classifications,
            tokensUsed: estimate.totalTokens,
            estimatedCost: estimate.estimatedCost
        };
    } catch (error) {
        console.error('[AIClassifier] Classification failed:', error);
        throw error;
    }
}

// ============================================================================
// HELPER FUNCTION: Apply classifications to image array
// ============================================================================

export function applyAIClassifications(
    images: any[],
    classifications: ClassificationResult[]
): void {
    const classMap = new Map(classifications.map(c => [c.src, c]));

    for (const img of images) {
        const classification = classMap.get(img.src);
        if (classification && img.role === 'unknown') {
            img.role = classification.role;
            img.roleConfidence = classification.confidence;
            img.componentHint = `AI-${classification.role}`;
        }
    }

    console.log(`[AIClassifier] Applied ${classifications.length} AI classifications`);
}
