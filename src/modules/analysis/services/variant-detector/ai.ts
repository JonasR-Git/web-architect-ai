import type { SiteNode, VariantDetectionResult } from '@/types';
import { openRouter, AI_MODELS } from '@/lib/openai';

/**
 * Level 3: AI-Powered Variant Detection
 *
 * Uses LLM to detect semantic equivalence.
 * Target: 99% accuracy, ~200-500ms per batch
 */

interface BatchPair {
    pairId: number;
    node1: SiteNode;
    node2: SiteNode;
    heuristicScore: number;
}

interface AIResponse {
    pairId: number;
    isVariant: boolean;
    confidence: number; // 0-100
    reason: string;
}

export class AIVariantDetector {
    /**
     * Detects variants using AI in batches
     * @param candidates Array of candidate pairs with heuristic scores
     * @param batchSize Number of pairs to process per request (default: 10)
     */
    static async detectVariants(
        candidates: Array<{ node1: SiteNode; node2: SiteNode; heuristicScore: number }>,
        batchSize: number = 10
    ): Promise<VariantDetectionResult[]> {
        if (candidates.length === 0) {
            return [];
        }

        // Add IDs to pairs
        const indexedPairs: BatchPair[] = candidates.map((c, i) => ({
            pairId: i,
            ...c
        }));

        // Split into batches
        const batches = this.chunk(indexedPairs, batchSize);
        const results: VariantDetectionResult[] = [];

        console.log(`🤖 AI Variant Detection: Processing ${candidates.length} pairs in ${batches.length} batches...`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} pairs`);

            try {
                const batchResults = await this.processBatch(batch);
                results.push(...batchResults);
            } catch (error) {
                console.error(`  ❌ Batch ${i + 1} failed:`, error);
                // Continue with next batch
            }
        }

        console.log(`✅ AI Variant Detection: Completed. ${results.filter(r => r.isVariant).length} variants found.`);

        return results;
    }

    /**
     * Process a single batch of pairs
     */
    private static async processBatch(batch: BatchPair[]): Promise<VariantDetectionResult[]> {
        const prompt = this.buildBatchPrompt(batch);

        const messages = [
            {
                role: 'system',
                content: `You are an expert at detecting language variants of web pages.
Analyze pairs of pages and determine if they are translations/variants of each other.
Return structured JSON responses only.`
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        try {
            const completion = await openRouter.chat.send({
                model: AI_MODELS.default,
                messages: messages,
                stream: false,
                max_tokens: 4000,
            } as any);

            const rawContent = completion.choices?.[0]?.message?.content;

            if (!rawContent) {
                throw new Error('No content received from AI');
            }

            const content = typeof rawContent === 'string'
                ? rawContent
                : Array.isArray(rawContent)
                    ? rawContent.map((part: any) => part.type === 'text' ? part.text : '').join('')
                    : '';

            return this.parseResponse(content, batch);

        } catch (error) {
            console.error('AI variant detection error:', error);
            throw error;
        }
    }

    /**
     * Builds the batch prompt for AI analysis
     */
    private static buildBatchPrompt(batch: BatchPair[]): string {
        let prompt = `Analyze the following pairs of web pages and determine if they are language variants (same content in different languages).

For each pair, return a JSON object with:
- pairId: The pair number
- isVariant: true if they are variants, false otherwise
- confidence: 0-100 confidence score
- reason: Brief explanation (max 100 chars)

Consider these signals:
- Translated titles with same meaning
- Similar structure and content length
- Different language codes
- Semantic equivalence of URL paths (e.g., "leistungen" ↔ "services")

Return a valid JSON array: [{ "pairId": 0, "isVariant": true, "confidence": 95, "reason": "..." }, ...]

`;

        batch.forEach((pair, i) => {
            const n1 = pair.node1;
            const n2 = pair.node2;

            prompt += `
=== PAIR ${pair.pairId} ===
Page A:
- URL: ${n1.url}
- Lang: ${n1.meta.lang || 'unknown'}
- Title: ${n1.meta.title}
- Description: ${(n1.meta.description || '').substring(0, 150)}
- H1: ${n1.content.h1 || 'none'}
- Word Count: ${n1.content.wordCount || 0}
- Images: ${n1.content.images?.length || 0}

Page B:
- URL: ${n2.url}
- Lang: ${n2.meta.lang || 'unknown'}
- Title: ${n2.meta.title}
- Description: ${(n2.meta.description || '').substring(0, 150)}
- H1: ${n2.content.h1 || 'none'}
- Word Count: ${n2.content.wordCount || 0}
- Images: ${n2.content.images?.length || 0}

Heuristic Score: ${pair.heuristicScore}/100

`;
        });

        prompt += `\nReturn JSON array now:`;

        return prompt;
    }

    /**
     * Parses AI response and converts to VariantDetectionResult
     */
    private static parseResponse(content: string, batch: BatchPair[]): VariantDetectionResult[] {
        try {
            // Extract JSON from markdown code blocks if present
            let jsonStr = content.trim();

            // Remove markdown code blocks
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '');
            }

            const aiResponses: AIResponse[] = JSON.parse(jsonStr);

            const results: VariantDetectionResult[] = aiResponses
                .map(response => {
                    const pair = batch.find(p => p.pairId === response.pairId);

                    if (!pair) {
                        console.warn(`No pair found for pairId ${response.pairId}`);
                        return null;
                    }

                    return {
                        node1Url: pair.node1.url,
                        node2Url: pair.node2.url,
                        confidence: response.confidence,
                        level: 'ai' as const,
                        isVariant: response.isVariant,
                        reasons: [response.reason]
                    } as VariantDetectionResult;
                })
                .filter((r): r is VariantDetectionResult => r !== null);

            return results;

        } catch (error) {
            console.error('Failed to parse AI response:', error);
            console.error('Raw response:', content);

            // Fallback: Try to extract individual objects
            try {
                const objectMatches = content.matchAll(/\{\s*"pairId"\s*:\s*(\d+)[\s\S]*?\}/g);
                const results: VariantDetectionResult[] = [];

                for (const match of objectMatches) {
                    const obj = JSON.parse(match[0]) as AIResponse;
                    const pair = batch.find(p => p.pairId === obj.pairId);

                    if (pair) {
                        results.push({
                            node1Url: pair.node1.url,
                            node2Url: pair.node2.url,
                            confidence: obj.confidence,
                            level: 'ai',
                            isVariant: obj.isVariant,
                            reasons: [obj.reason]
                        });
                    }
                }

                if (results.length > 0) {
                    return results;
                }
            } catch (fallbackError) {
                console.error('Fallback parsing also failed:', fallbackError);
            }

            return [];
        }
    }

    /**
     * Utility: Split array into chunks
     */
    private static chunk<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}
