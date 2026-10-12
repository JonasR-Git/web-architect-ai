import { openRouter, AI_MODELS } from '@/lib/openai';
import { DesignStyle } from '@/modules/design/data/design-presets';
import * as AnalysisPrompts from './prompts/analysis';
import * as DesignPrompts from './prompts/design';
import * as ReviewPrompts from './prompts/review';
import * as EngineeringPrompts from './prompts/engineering';
import { createAIOptimizedStructure } from './utils/grouping';
import { normalizeStructureToConcepts, SemanticMergeMap } from './utils/normalization';
import { BRANCH_ANALYSIS_SYSTEM_PROMPT } from './prompts/branch-analysis';
import { generateObject } from 'ai';
import { z } from 'zod';

const Prompts = {
    ...AnalysisPrompts,
    ...DesignPrompts,
    ...ReviewPrompts,
    ...EngineeringPrompts,
};
import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';
import { SiteStructure, StackConfig, DesignConfig, MockupSiteData, MigrationPlan, ClusterOverrides, ComponentSpecification } from '@/types';
import { normalizeMappingAction, normalizePatternMappingAction } from '@/modules/analysis/utils/mapping-actions';

// Simple token estimation (~4 chars per token for English)
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export class AIService {
    private sessionId?: string;
    private model: any;

    constructor(sessionId?: string, model?: any) {
        this.sessionId = sessionId;
        this.model = model; // Assuming 'model' here handles the 'generateObject' calls, likely passed from Vercel AI SDK or similar
    }

    // For JSON output (most prompts)
    private async callAI(messages: any[], model: string = AI_MODELS.default, stepName: string = 'Unknown') {
        const inputText = JSON.stringify(messages);
        const tokensIn = estimateTokens(inputText);
        const startTime = Date.now();
        const modelShortName = model.split('/').pop() || model;

        console.log(`🚀[${stepName}] STARTED(${modelShortName}, ${tokensIn} tokens)`);
        if (tokensIn > 150000) {
            // Silenced user warning:
            // console.warn(`⚠️[${ stepName }] HIGH TOKEN USAGE: ${ tokensIn } tokens. (User approved limit: 150k)`);
        }

        try {
            let completion;
            try {
                // Attempt 1: Try with requested model
                completion = await openRouter.chat.send({
                    model: model,
                    messages: messages,
                    stream: false,
                    max_tokens: 16000,
                } as any);
            } catch (firstError: any) {
                // Error Detection
                const errorMessage = firstError?.message || firstError?.error?.message || (typeof firstError?.body === 'string' ? firstError.body : '');
                const isRateLimit = firstError?.status === 429 || firstError?.statusCode === 429 || errorMessage.includes('429');
                const isFreeEnded = errorMessage.includes('free MiMo-V2-Flash period has ended') || errorMessage.includes('free period has ended') || firstError?.status === 404 || firstError?.statusCode === 404;
                const hasFreeSuffix = model.includes(':free');

                if ((isRateLimit || isFreeEnded || hasFreeSuffix) && hasFreeSuffix) {
                    const paidModel = model.replace(':free', '');
                    console.warn(`⚠️[${stepName}] Model Error(${firstError?.status}).Switching from ${model} to PAID model: ${paidModel} ...`);

                    // Attempt 2: Retry with paid model
                    completion = await openRouter.chat.send({
                        model: paidModel,
                        messages: messages,
                        stream: false,
                        max_tokens: 16000,
                    } as any);
                } else if (isFreeEnded && !hasFreeSuffix && model.includes('mimo')) {
                    // Specific case for MiMo if it fails even without :free (maybe OpenRouter renamed it)
                    console.warn(`⚠️[${stepName}] MiMo Error.Falling back to default model...`);
                    completion = await openRouter.chat.send({
                        model: AI_MODELS.default,
                        messages: messages,
                        stream: false,
                        max_tokens: 16000,
                    } as any);
                } else {
                    throw firstError;
                }
            }

            const rawContent = completion.choices?.[0]?.message?.content;

            if (!rawContent) throw new Error('No content received from AI');

            let content = '';
            if (typeof rawContent === 'string') {
                content = rawContent;
            } else if (Array.isArray(rawContent)) {
                content = rawContent.map((part: any) => part.type === 'text' ? part.text : '').join('');
            }

            const tokensOut = estimateTokens(content);
            const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅[${stepName}] COMPLETE in ${durationSec} s(In: ${tokensIn}, Out: ${tokensOut})`);

            // SESSION LOGGING
            if (this.sessionId) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const logDir = path.join(process.cwd(), 'data', 'sessions', this.sessionId, 'logs');
                    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const safeStep = stepName.replace(/[^a-z0-9]/gi, '_');
                    const logFile = path.join(logDir, `${timestamp}_${safeStep}.json`);

                    fs.writeFileSync(logFile, JSON.stringify({
                        step: stepName,
                        model: modelShortName,
                        tokensIn,
                        tokensOut,
                        duration: durationSec,
                        input: messages,
                        output: content
                    }, null, 2));
                } catch (logErr) { /* ignore log errors */ }
            }

            // 2. Extract and Parse JSON
            let cleanContent = content; // Declare outside try block for error logging
            try {
                // 1. Priority: Extract from Markdown code block
                // Fixed regex: Supports both objects and arrays, proper spacing
                const codeBlockMatch = content.match(/```(?:\s*json)?\s*([\s\S]*?)```/i);
                if (codeBlockMatch) {
                    cleanContent = codeBlockMatch[1].trim();
                } else {
                    // 2. Fallback: Content between first and last brace
                    const firstBrace = content.indexOf('{');
                    const lastBrace = content.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        cleanContent = content.substring(firstBrace, lastBrace + 1);
                    } else if (firstBrace !== -1) {
                        cleanContent = content.substring(firstBrace);
                    }
                }

                // 3. Try standard JSON5 parse
                try {
                    const parsed = JSON5.parse(cleanContent);
                    if (parsed && typeof parsed === 'object') {
                        parsed._meta = { model: modelShortName, tokensIn, tokensOut, duration: `${durationSec} s` };
                        return parsed;
                    }
                } catch (e) { /* ignore to try jsonrepair */ }

                // 4. Fallback: jsonrepair
                console.warn(`⚠️[${stepName}] Initial JSON parse failed, attempting robust repair with jsonrepair...`);
                const repaired = jsonrepair(cleanContent);
                const parsed = JSON5.parse(repaired);

                if (parsed && typeof parsed === 'object') {
                    parsed._meta = { model: modelShortName, tokensIn, tokensOut, duration: `${durationSec} s` };
                    return parsed;
                }

                throw new Error("Parsed content is not an object");

            } catch (pE: any) {
                console.error(`❌[${stepName}] JSON Parse Error(FATAL): `, pE.message);
                console.error(`Attempted clean content: ${cleanContent.substring(0, 500)}...`);
                console.error(`Raw content preview: ${content.substring(0, 500)}...`);
                throw new Error(`JSON Parse Error: ${pE.message}. Model output might be truncated or invalid.`);
            }
        } catch (error) {
            console.error(`❌[${stepName}] AI Call Failed: `, error);
            throw error;
        }
    }

    // For Markdown output (implementation plan, design system)
    private async callAIRaw(
        messages: any[],
        modelOrOptions: string | { model: string; temperature?: number } = AI_MODELS.default,
        stepName: string = 'Unknown'
    ): Promise<string> {
        // Handle both string and object input
        const model = typeof modelOrOptions === 'string' ? modelOrOptions : modelOrOptions.model;
        const temperature = typeof modelOrOptions === 'object' && modelOrOptions.temperature !== undefined
            ? modelOrOptions.temperature
            : undefined;

        const inputText = JSON.stringify(messages);
        const tokensIn = estimateTokens(inputText);
        const startTime = Date.now();
        const modelShortName = model.split('/').pop() || model;

        console.log(`🚀[${stepName}] STARTED(${modelShortName}, ${tokensIn} tokens)`);
        if (tokensIn > 150000) {
            console.warn(`⚠️[${stepName}] HIGH TOKEN USAGE: ${tokensIn} tokens. (User approved limit: 150k)`);
        }

        try {
            let completion;
            try {
                // Attempt 1: Requested model
                const requestOptions: any = {
                    model: model,
                    messages: messages,
                    stream: false,
                    max_tokens: 32000,
                };

                // Add temperature if specified
                if (temperature !== undefined) {
                    requestOptions.temperature = temperature;
                    console.log(`🎨[${stepName}] Using temperature: ${temperature}`);
                }

                completion = await openRouter.chat.send(requestOptions);
            } catch (firstError: any) {
                const errorMessage = firstError?.message || firstError?.error?.message || (typeof firstError?.body === 'string' ? firstError.body : '');
                const isRateLimit = firstError?.status === 429 || firstError?.statusCode === 429 || errorMessage.includes('429');
                const isFreeEnded = errorMessage.includes('free MiMo-V2-Flash period has ended') || errorMessage.includes('free period has ended') || firstError?.status === 404 || firstError?.statusCode === 404;
                const hasFreeSuffix = model.includes(':free');

                if ((isRateLimit || isFreeEnded || hasFreeSuffix) && hasFreeSuffix) {
                    const paidModel = model.replace(':free', '');
                    console.warn(`⚠️[${stepName}] Model Error.Switching from ${model} to PAID model: ${paidModel} ...`);
                    const fallbackOptions: any = {
                        model: paidModel,
                        messages: messages,
                        stream: false,
                        max_tokens: 32000,
                    };
                    if (temperature !== undefined) {
                        fallbackOptions.temperature = temperature;
                    }
                    completion = await openRouter.chat.send(fallbackOptions);
                } else if (isFreeEnded && !hasFreeSuffix && model.includes('mimo')) {
                    console.warn(`⚠️[${stepName}] MiMo Error.Falling back to default model...`);
                    const defaultFallbackOptions: any = {
                        model: AI_MODELS.default,
                        messages: messages,
                        stream: false,
                        max_tokens: 32000,
                    };
                    if (temperature !== undefined) {
                        defaultFallbackOptions.temperature = temperature;
                    }
                    completion = await openRouter.chat.send(defaultFallbackOptions);
                } else {
                    throw firstError;
                }
            }

            const rawContent = completion.choices?.[0]?.message?.content;
            if (!rawContent) throw new Error('No content received from AI');

            let content = '';
            if (typeof rawContent === 'string') {
                content = rawContent;
            } else if (Array.isArray(rawContent)) {
                content = rawContent.map((part: any) => part.type === 'text' ? part.text : '').join('');
            }

            const tokensOut = estimateTokens(content);
            const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅[${stepName}] COMPLETE in ${durationSec} s(In: ${tokensIn}, Out: ${tokensOut})`);

            // SESSION LOGGING
            if (this.sessionId) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const logDir = path.join(process.cwd(), 'data', 'sessions', this.sessionId, 'logs');
                    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const safeStep = stepName.replace(/[^a-z0-9]/gi, '_');
                    const logFile = path.join(logDir, `${timestamp}_${safeStep} _RAW.json`);

                    fs.writeFileSync(logFile, JSON.stringify({
                        step: stepName,
                        model: modelShortName,
                        tokensIn,
                        tokensOut,
                        duration: durationSec,
                        input: messages,
                        output: content
                    }, null, 2));
                } catch (logErr) { /* ignore log errors */ }
            }

            return content;
        } catch (error) {
            const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
            console.error(`❌[${stepName}] FAILED after ${durationSec} s`);
            console.error(`   🤖 Model: ${modelShortName} `);
            console.error(`   Error: `, error);
            throw error;
        }
    }


    async generateCritique(structure: SiteStructure, userInstructions?: string, overrides: ClusterOverrides = {}) {
        let tier = 0;
        let lastError: any = null;

        while (tier <= 4) {
            try {
                const messages = userInstructions
                    ? Prompts.buildCritiquePromptWithInstructions(structure, userInstructions, tier, overrides)
                    : Prompts.buildCritiquePrompt(structure, tier, overrides);

                if (tier > 0) {
                    console.log(`[SafetyValve] Retrying BFSG Audit with Tier ${tier} optimization...`);
                }

                const rawResult = await this.callAI(messages, AI_MODELS.critique, `BFSG Audit(Tier ${tier})`);

                // Post-Processing: Calculate Scores in TypeScript (AI is bad at math)
                try {
                    if (rawResult.audit_matrix) {
                        let totalMax = 0;
                        let totalAchieved = 0;
                        let a11yMax = 0;
                        let a11yAchieved = 0;
                        let seoMax = 0;
                        let seoAchieved = 0;
                        let criticalFailures = 0;

                        rawResult.audit_matrix = rawResult.audit_matrix.map((item: any) => {
                            const max = item.max_points || 0;
                            const achieved = item.achieved || 0;
                            const weighted = max * achieved;
                            item.weighted_score = weighted;
                            item.status = achieved === 1 ? '✅ Pass' : achieved === 0.5 ? '⚠️ Partial' : '❌ Fail';
                            totalMax += max;
                            totalAchieved += weighted;
                            if (item.category === 'SEO') {
                                seoMax += max;
                                seoAchieved += weighted;
                            } else {
                                a11yMax += max;
                                a11yAchieved += weighted;
                            }
                            if (item.criticality === 'K' && achieved === 0) {
                                criticalFailures++;
                            }
                            return item;
                        });

                        const totalScore = totalMax > 0 ? Math.round((totalAchieved / totalMax) * 100) : 0;
                        const a11yScore = a11yMax > 0 ? Math.round((a11yAchieved / a11yMax) * 100) : 0;
                        const seoScore = seoMax > 0 ? Math.round((seoAchieved / seoMax) * 100) : 0;

                        const isCompliant = criticalFailures === 0 && totalScore >= 50;
                        let rating = 'Mangelhaft';
                        let emoji = '⛔';
                        if (criticalFailures > 0) {
                            rating = 'Ausreichend (Fail Gate)';
                            emoji = '🔴';
                        } else {
                            if (totalScore >= 90) { rating = 'Exzellent'; emoji = '🟢'; }
                            else if (totalScore >= 75) { rating = 'Gut'; emoji = '🟡'; }
                            else if (totalScore >= 50) { rating = 'Befriedigend'; emoji = '🟠'; }
                            else if (totalScore >= 25) { rating = 'Ausreichend'; emoji = '🔴'; }
                        }

                        rawResult.audit_summary = {
                            total_score: totalScore,
                            rating,
                            rating_emoji: emoji,
                            bfsg_compliant: isCompliant,
                            critical_failures: criticalFailures,
                            pass_fail_gate_triggered: criticalFailures > 0
                        };
                        rawResult.accessibility_score = a11yScore;
                        rawResult.seo_score = seoScore;
                        console.log(`📊[Audit Calc] Score: ${totalScore}, Critical Fails: ${criticalFailures} `);
                    }
                } catch (calcError) {
                    console.error('Error calculating audit scores:', calcError);
                }

                return rawResult;

            } catch (error: any) {
                lastError = error;
                const isTokenError = error.status === 429 || error.status === 400 || error.error?.code === 'context_length_exceeded' || error.message.includes('token') || error.message.includes('too long');
                const isParsingError = error.message.includes('JSON Parse Error') || error.message.includes('Colon expected') || error.message.includes('Unexpected end of JSON');

                if (isTokenError || isParsingError) {
                    tier++;
                    console.log(`[SafetyValve] ${isParsingError ? 'Parsing Error (Truncation?)' : 'Token Limit'} detected.Upgrading to Tier ${tier} and retrying...`);
                    continue;
                }
                throw error;
            }
        }
        throw lastError || new Error('Failed to generate audit after all tiers');
    }

    async generateMigrationPlan(structure: SiteStructure, userInstructions?: string, overrides: ClusterOverrides = {}, mergeMap?: SemanticMergeMap): Promise<MigrationPlan> {
        // STEP 0: NORMALIZE STRUCTURE (Language Agnostic Concepts)
        const conceptStructure = normalizeStructureToConcepts(structure, mergeMap);
        console.log(`[Normalization] Reduced ${structure.nodes.length} nodes to ${conceptStructure.nodes.length} concepts.`);

        // STEP 0.5: RESOLVE CLUSTER CONFLICTS (if auto-clustering is active)
        // Only run if no forceArchetypes (meaning auto-clustering was used)
        let resolvedStructure = conceptStructure;
        if (!overrides.forceArchetypes || overrides.forceArchetypes.length === 0) {
            try {
                const { resolveClusterConflicts } = await import('./utils/grouping');
                console.log('🔍 [Migration Plan] Running AI-based cluster conflict resolution...');
                resolvedStructure = await resolveClusterConflicts(conceptStructure, this, overrides);
            } catch (error) {
                console.warn('⚠️ [Migration Plan] Cluster conflict resolution failed, continuing with original structure:', error);
                // Continue with original structure if resolution fails
            }
        }

        let tier = 0;
        let lastError: any = null;

        while (tier <= 4) {
            try {
                // Use the Normalized Concept Structure for AI
                const messages = userInstructions
                    ? Prompts.buildMigrationPromptWithInstructions(conceptStructure, userInstructions, tier, overrides)
                    : Prompts.buildMigrationPrompt(conceptStructure, tier, overrides);

                // Add SafetyValve context info to the "Wait" message if possible, or just log
                if (tier > 0) {
                    console.log(`[SafetyValve] Retrying Migration Plan with Tier ${tier} optimization...`);
                }

                const plan = await this.callAI(messages, AI_MODELS.migration, `Migration Plan(Tier ${tier})`);

                // VALIDATION & AUTO-FIX: Ensure pattern_mapping exists and is correct
                this.validateAndFixMigrationPlan(plan);

                return plan;
            } catch (error: any) {
                lastError = error;
                const isTokenError = error.status === 429 || error.status === 400 || error.error?.code === 'context_length_exceeded' || error.message.includes('token') || error.message.includes('too long');
                const isParsingError = error.message.includes('JSON Parse Error') || error.message.includes('Colon expected') || error.message.includes('Unexpected end of JSON');

                if (isTokenError || isParsingError) {
                    tier++;
                    console.log(`[SafetyValve] ${isParsingError ? 'Parsing Error (Truncation?)' : 'Token Limit'} detected.Upgrading to Tier ${tier} and retrying...`);
                    continue;
                }
                throw error;
            }
        }

        throw lastError || new Error('Failed to generate migration plan after all tiers');
    }
    async generateComponentLibrary(migrationPlan: any, crawledStructure: any, userInstructions?: string, stackConfig?: any, critique?: any, overrides: any = {}, mergeMap?: SemanticMergeMap) {
        // NORMALIZE first
        const conceptStructure = normalizeStructureToConcepts(crawledStructure, mergeMap);

        let tier = 0;
        let lastError: any = null;

        while (tier <= 4) {
            try {
                const { optimized } = createAIOptimizedStructure(conceptStructure, overrides, tier);
                const allRawPatterns: any[] = [];

                // 1. DISTRIBUTED SCOUTING (Archetypes) - PARALLELIZED
                const archetypePromises = optimized.groups
                    .filter((group: any) => group.examples?.length)
                    .map(async (group: any) => {
                        console.log(`🔍[Scout] Analyzing Archetype: ${group.pattern} (${group.examples.length} pages)...`);
                        const scoutCtx = Prompts.prepareScoutContext(group.examples, tier);
                        const messages = Prompts.buildScoutExtractionPrompt(scoutCtx);
                        try {
                            const result = await this.callAI(messages, AI_MODELS.migration, `Scout: ${group.pattern} `);
                            return result.patterns || [];
                        } catch (error) {
                            console.error(`❌ Scout failed for ${group.pattern}:`, error);
                            return [];
                        }
                    });

                // 2. DISTRIBUTED SCOUTING (Unique Pages - Chunked) - PARALLELIZED
                const UNIQUE_CHUNK_SIZE = 15;
                const uniquePages = optimized.uniquePages || [];
                const uniqueChunks = [];
                for (let i = 0; i < uniquePages.length; i += UNIQUE_CHUNK_SIZE) {
                    uniqueChunks.push({ chunk: uniquePages.slice(i, i + UNIQUE_CHUNK_SIZE), index: i });
                }

                const uniquePromises = uniqueChunks.map(async ({ chunk, index }) => {
                    console.log(`🔍[Scout] Analyzing Unique Pages Chunk ${Math.floor(index / UNIQUE_CHUNK_SIZE) + 1} /${Math.ceil(uniquePages.length / UNIQUE_CHUNK_SIZE)}...`);
                    const scoutCtx = Prompts.prepareScoutContext(chunk, tier);
                    const messages = Prompts.buildScoutExtractionPrompt(scoutCtx);
                    try {
                        const result = await this.callAI(messages, AI_MODELS.migration, `Scout: Unique Chunk ${index} `);
                        return result.patterns || [];
                    } catch (error) {
                        console.error(`❌ Scout failed for chunk ${index}:`, error);
                        return [];
                    }
                });

                // Execute all scouts in parallel
                console.log(`⚡ [Scout] Running ${archetypePromises.length + uniquePromises.length} scouts in parallel...`);
                const allResults = await Promise.all([...archetypePromises, ...uniquePromises]);
                allResults.forEach(patterns => allRawPatterns.push(...patterns));

                if (allRawPatterns.length === 0) {
                    throw new Error("No UI patterns discovered during scouting.");
                }

                // 3. GLOBAL CONSOLIDATION
                console.log(`📚[Consolidator] Merging ${allRawPatterns.length} raw patterns into canonical inventory...`);
                const consolidationMessages = Prompts.buildConsolidationPrompt(allRawPatterns);
                const inventory = await this.callAI(consolidationMessages, AI_MODELS.migration, 'Global Consolidation');

                // 4. ARCHITECTURAL MAPPING (The Architect)
                console.log(`📐[Architect] Mapping high - resolution inventory to ${stackConfig?.uiLibrary || 'shadcn'}...`);
                const mappingMessages = Prompts.buildComponentMappingPrompt(inventory, stackConfig);
                const finalLibrary = await this.callAI(mappingMessages, AI_MODELS.migration, 'Architectural Mapping');

                // 5. ATTACH META
                finalLibrary._scout_meta = {
                    total_scouts: optimized.groups.length + Math.ceil(uniquePages.length / UNIQUE_CHUNK_SIZE),
                    patterns_discovered: allRawPatterns.length,
                    tier
                };

                return finalLibrary;

            } catch (error: any) {
                lastError = error;
                const isTokenError = error.status === 429 || error.status === 400 || error.error?.code === 'context_length_exceeded' || error.message.includes('token') || error.message.includes('too long');
                const isParsingError = error.message.includes('JSON Parse Error') || error.message.includes('Colon expected') || error.message.includes('Unexpected end of JSON');

                if (isTokenError || isParsingError) {
                    tier++;
                    console.log(`[SafetyValve] ${isParsingError ? 'Parsing Error (Truncation?)' : 'Token Limit'} detected.Upgrading to Tier ${tier} and retrying...`);
                    continue;
                }
                throw error;
            }
        }
        throw lastError || new Error('Failed to generate component library after all tiers');
    }

    async generateClusterComponents(samples: { url: string, html: string }[]) {
        const messages = Prompts.buildClusterLibraryPrompt(samples);
        const result = await this.callAI(messages, AI_MODELS.migration, 'Cluster Component Discovery');
        return result.components || [];
    }

    async mapPageToComponents(pageHtml: string, componentSpec: any) {
        const messages = Prompts.buildClusterMappingPrompt(pageHtml, '', componentSpec);
        const result = await this.callAI(messages, AI_MODELS.migration, 'Cluster Page Mapping');
        return result;
    }



    async generateSpecification(analysisData: any, userInstructions?: string) {
        const messages = Prompts.buildSpecificationPrompt(analysisData, userInstructions);
        return this.callAI(messages, AI_MODELS.specification, 'Specification');
    }

    async generateDesignInstructions(config: DesignConfig) {
        // Default stack for design generation context
        const stack: StackConfig = {
            framework: 'nextjs',
            css: 'tailwind',
            uiLibrary: 'shadcn',
            cms: 'none',
            database: 'none',
            auth: 'none',
            deployment: 'vercel'
        };
        const messages = Prompts.buildDesignPromptGeneratorPrompt(stack, undefined, config.customInstructions, config.colors);
        return this.callAIRaw(messages, AI_MODELS.designSystem, 'Design Instructions');
    }

    // Returns raw markdown string (not JSON)
    async generateImplementationPlan(
        spec: ComponentSpecification,
        stackConfig: StackConfig,
        userInstructions?: string,
        availableAssets?: Record<string, string>,
        designConfig?: DesignConfig,
        pageSpecs?: any[],
        migrationPlan?: any
    ): Promise<string> {
        // Build the comprehensive prompt
        const messages = Prompts.buildImplementationPrompt(spec, stackConfig, userInstructions, availableAssets, designConfig, pageSpecs, migrationPlan);
        return this.callAIRaw(messages, AI_MODELS.implementation, 'Implementation Plan');
    }

    async optimizePageContent(pageData: { path: string, rawText: string, suggestedComponents: string[] }, userInstructions?: string) {
        const messages = Prompts.buildContentOptimizerPrompt(pageData, userInstructions);
        return this.callAI(messages, AI_MODELS.contentOptimizer, 'Content Optimizer');
    }

    async generatePageSpecs(targets: any[]) {
        // Parallelization Config
        const BATCH_SIZE = 4; // 4 pages per Request
        const MAX_CONCURRENCY = 5; // 5 Requests in parallel

        // Helper to chunk array
        const chunkArray = (arr: any[], size: number) =>
            Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
                arr.slice(i * size, i * size + size)
            );

        const batches = chunkArray(targets, BATCH_SIZE);
        const allSpecs: any[] = [];

        console.log(`🚀 [PageSpecs] Parallelizing: ${targets.length} targets -> ${batches.length} batches (Concurrency: ${MAX_CONCURRENCY})`);

        // Process batches with concurrency limit
        // Since we don't have p-limit install, we use a simple chunked-promise-all or just Promise.all for all if small enough.
        // For safety/simplicity given the likely scale (20-50 pages), we can just run all batches in parallel if < 20.
        // If huge, we should split the batches themselves.

        const batchPromises = batches.map(async (batch, idx) => {
            const batchId = `Batch-${idx + 1}`;
            const messages = [
                { role: 'system', content: Prompts.PAGE_SPECS_SYSTEM_PROMPT },
                { role: 'user', content: JSON.stringify(batch.map(t => ({ id: t.id, path: t.path, type: t.type, sourceText: t.sourceText }))) }
            ];

            try {
                const result = await this.callAI(messages, AI_MODELS.default, `PageSpecs-${batchId}`);
                if (Array.isArray(result)) return result;
                if (result && typeof result === 'object') {
                    return result.targets || result.pages || result.specs || (result.id ? [result] : []);
                }
                return [];
            } catch (err) {
                console.error(`❌ [PageSpecs] Batch ${batchId} failed:`, err);
                return []; // Return empty for failed batch to keep others alive
            }
        });

        // Run all
        const results = await Promise.all(batchPromises);
        results.forEach(res => allSpecs.push(...res));

        console.log(`✅ [PageSpecs] Combined Results: ${allSpecs.length} specs generated.`);

        return targets.map((t, idx) => {
            // Find spec by ID (Robust matching)
            const aiSpec = allSpecs.find((s: any) => s.id === t.id) ||
                allSpecs.find((s: any) => s.path === t.path) ||
                (allSpecs.length === targets.length ? allSpecs[idx] : null);

            if (aiSpec) {
                // Normalize sections and filter empty images
                if (aiSpec.sections && Array.isArray(aiSpec.sections)) {
                    aiSpec.sections = aiSpec.sections.map((s: any) => ({
                        ...s,
                        headline: s.headline || '',
                        content: s.content || '',
                        images: Array.isArray(s.images)
                            ? s.images.filter((img: any) => typeof img === 'string' ? img.trim() !== '' : (img?.src && img.src.trim() !== ''))
                            : []
                    }));
                }
                return { ...t, ...aiSpec };
            }
            return t; // Fallback to original if no spec found
        });
    }

    async generateDesignPalette(baseColors: string[], vibe?: string) {
        const messages = [
            { role: 'system', content: Prompts.DESIGN_GENERATOR_SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify({ baseColors, vibe }) }
        ];

        return this.callAI(messages, AI_MODELS.designSystem, 'Design Palette Generator');
    }

    /**
     * Compares two clusters to determine if they represent the same content type
     * Uses AI analysis of content profiles (word count, links, schema, etc.)
     *
     * @param clusterA - First cluster with pattern and content samples
     * @param clusterB - Second cluster with pattern and content samples
     * @returns ClusterComparisonResult with decision and reasoning
     */
    async compareClusterContentTypes(
        clusterA: { pattern: string; samples: any[] },
        clusterB: { pattern: string; samples: any[] }
    ): Promise<any> {
        const messages = Prompts.buildClusterComparisonPrompt(clusterA, clusterB);

        console.log(`🔍 Comparing clusters: ${clusterA.pattern} (${clusterA.samples.length} samples) vs ${clusterB.pattern} (${clusterB.samples.length} samples)`);

        const result = await this.callAI(messages, AI_MODELS.migration, 'Cluster Content-Type Comparison');

        console.log(`✅ Comparison Result: ${result.decision} (${result.confidence}% confident) → ${result.recommendation}`);

        return result;
    }

    // Generate visual HTML mockup based on design configuration
    async generateMockup(
        config: DesignConfig,
        userPrompt?: string,
        siteData?: MockupSiteData
    ): Promise<string> {
        console.log('🎨 [MOCKUP DEBUG] Site Data Payload:', JSON.stringify(siteData, null, 2));
        const messages = Prompts.buildMockupPrompt(siteData, config, userPrompt);
        const raw = await this.callAIRaw(messages, AI_MODELS.mockup, 'Mockup Generation');
        // Clean markdown code blocks
        // Robust extraction: Find content inside ```html ... ``` or ``` ... ```
        const codeBlockMatch = raw.match(/```(?: html) ?\s * ([\s\S] *?)```/);

        if (codeBlockMatch && codeBlockMatch[1]) {
            return codeBlockMatch[1].trim();
        }

        // Fallback: Look for standard HTML start/end if code blocks are missing
        const htmlMatch = raw.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i);
        if (htmlMatch && htmlMatch[1]) {
            return htmlMatch[1].trim();
        }

        // Last resort: Return raw string but try to strip purely markdown envelope words if possible (risky, so just return raw cleaned)
        return raw.replace(/```html/g, '').replace(/```/g, '').trim();
    }

    async analyzeBranchStructure(branches: any[]) {
        if (!branches || branches.length === 0) return { merges: [] };

        try {
            // Check if we have a valid model instance that supports 'generateObject'
            if (this.model && typeof this.model.generateObject === 'function') {
                // Vercel AI SDK style
                const { object } = await this.model.generateObject({
                    system: BRANCH_ANALYSIS_SYSTEM_PROMPT,
                    prompt: `Here are the Branch Roots to analyze:\n${JSON.stringify(branches, null, 2)}`,
                    schema: z.object({
                        merges: z.array(z.object({
                            concept: z.string(),
                            sources: z.array(z.string())
                        }))
                    })
                });
                return object;
            } else {
                // Fallback to internal callAI if not using Vercel AI SDK directly
                const messages = [
                    { role: 'system', content: BRANCH_ANALYSIS_SYSTEM_PROMPT },
                    { role: 'user', content: `Here are the Branch Roots to analyze:\n${JSON.stringify(branches, null, 2)}` }
                ];
                const result = await this.callAI(messages, AI_MODELS.default, 'Branch Analysis');
                return result;
            }
        } catch (error) {
            console.error('Error analyzing branch structure:', error);
            return { merges: [] };
        }
    }

    // Generic public analyzer for ad-hoc tasks
    public async analyze(messages: any[], options?: { jsonMode?: boolean }) {
        return this.callAI(messages, AI_MODELS.styleExtractor, 'Style Extractor');
    }

    // ============================================================================
    // ITERATIVE WORKFLOW ACTIONS (V4)
    // ============================================================================

    async detectDependenciesBulk(pages: { path: string, sections: string[] }[], sitemapPaths: string[]) {
        const messages = Prompts.buildBulkDependencyPrompt(pages, sitemapPaths);
        const model = process.env.LIGHTWEIGHT_MODEL || AI_MODELS.default;
        return this.callAI(messages, model, 'Bulk Dependency Detection');
    }

    async detectDependencies(targetPath: string, userPrompt: string, sitemapPaths: string[]) {
        const messages = Prompts.buildDependencyPrompt(targetPath, userPrompt, sitemapPaths);
        // Use lightweight model from ENV or fallback to standard
        const model = process.env.LIGHTWEIGHT_MODEL || AI_MODELS.default;
        return this.callAI(messages, model, 'Dependency Detection');
    }

    async regeneratePageSpecs(
        target: any,
        primarySourceText: string,
        secondarySourcesText: { path: string, content: string }[],
        sitemapSummary: string[],
        userPrompt: string
    ) {
        const messages = Prompts.buildRegenerationPrompt(
            target,
            primarySourceText,
            secondarySourcesText,
            sitemapSummary,
            userPrompt
        );
        const result = await this.callAI(messages, AI_MODELS.default, 'Regenerate Page Spec');

        // Sanitation: Ensure headline and content are strings, and filter empty images
        if (result && result.sections && Array.isArray(result.sections)) {
            result.sections = result.sections.map((s: any) => ({
                ...s,
                headline: typeof s.headline === 'object' ? JSON.stringify(s.headline) : (s.headline || ''),
                content: typeof s.content === 'object' ? JSON.stringify(s.content) : (s.content || ''),
                images: Array.isArray(s.images)
                    ? s.images.filter((img: any) => typeof img === 'string' ? img.trim() !== '' : (img?.src && img.src.trim() !== ''))
                    : []
            }));
        }

        return result;
    }

    /**
     * Validates and fixes migration plan issues
     * - Ensures pattern_mapping exists
     * - Adds missing [slug] to target_base paths
     */
    private validateAndFixMigrationPlan(plan: any): void {
        // VALIDATION 1: Ensure pattern_mapping exists
        if (!plan.pattern_mapping || plan.pattern_mapping.length === 0) {
            console.warn('⚠️ [MigrationPlan] AI did not generate pattern_mapping. Attempting auto-generation...');
            plan.pattern_mapping = this.generatePatternMappingFromPageMapping(plan.page_mapping || []);

            if (plan.pattern_mapping.length > 0) {
                console.log(`✅ [MigrationPlan] Auto-generated ${plan.pattern_mapping.length} pattern mappings`);
            }
        }

        // VALIDATION 2: Ensure all pattern targets have [slug] or [item]
        if (plan.pattern_mapping && Array.isArray(plan.pattern_mapping)) {
            plan.pattern_mapping = plan.pattern_mapping.map((pm: any) => {
                pm.action = normalizePatternMappingAction(pm.action);

                // If pattern contains dynamic segment but target doesn't
                if ((pm.pattern.includes('[item]') || pm.pattern.includes('[slug]')) &&
                    !pm.target_base.includes('[') &&
                    !pm.target_base.includes(']')) {

                    console.warn(`⚠️ [MigrationPlan] Fixing missing [slug] in ${pm.pattern} → ${pm.target_base}`);

                    // Remove trailing slash and add [slug]
                    const basePath = pm.target_base.replace(/\/$/, '');
                    pm.target_base = `${basePath}/[slug]`;
                }
                return pm;
            });
        }

        // VALIDATION 3: Remove trailing slashes from page_mapping (except root /)
        if (plan.page_mapping && Array.isArray(plan.page_mapping)) {
            plan.page_mapping = plan.page_mapping.map((pm: any) => {
                pm.action = normalizeMappingAction(pm.action);

                if (pm.new_path && pm.new_path !== '/' && pm.new_path.endsWith('/')) {
                    pm.new_path = pm.new_path.replace(/\/$/, '');
                }
                return pm;
            });
        }
    }

    /**
     * Auto-generates pattern_mapping from page_mapping
     * Detects patterns like /blog/[item] from individual page entries
     */
    private generatePatternMappingFromPageMapping(pageMapping: any[]): any[] {
        const patternMap = new Map<string, any>();

        pageMapping.forEach(pm => {
            // Detect if old_url is a pattern (contains brackets)
            if (pm.old_url && (pm.old_url.includes('[item]') || pm.old_url.includes('[slug]'))) {
                const key = pm.old_url;

                if (!patternMap.has(key)) {
                    // Extract target base
                    let targetBase = pm.new_path || pm.old_url;

                    // If target doesn't have dynamic segment, add it
                    if (!targetBase.includes('[')) {
                        targetBase = targetBase.replace(/\/$/, '') + '/[slug]';
                    }

                    patternMap.set(key, {
                        pattern: pm.old_url,
                        target_base: targetBase,
                        action: normalizePatternMappingAction(pm.action),
                        type: pm.type || 'page',
                        reason: pm.reason || 'Auto-generated from page_mapping'
                    });
                }
            }
        });

        return Array.from(patternMap.values());
    }
}
