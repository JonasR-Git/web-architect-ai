import { openRouter, AI_MODELS } from '@/lib/openai';
import { DesignStyle } from '@/modules/design/data/design-presets';
import * as AnalysisPrompts from './prompts/analysis';
import * as DesignPrompts from './prompts/design';
import * as ReviewPrompts from './prompts/review';
import * as EngineeringPrompts from './prompts/engineering';

const Prompts = {
    ...AnalysisPrompts,
    ...DesignPrompts,
    ...ReviewPrompts,
    ...EngineeringPrompts,
};
import JSON5 from 'json5';
import { jsonrepair } from 'jsonrepair';
import { SiteStructure, StackConfig, DesignConfig, MockupSiteData } from '@/types';

// Simple token estimation (~4 chars per token for English)
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

export class AIService {
    private sessionId?: string;

    constructor(sessionId?: string) {
        this.sessionId = sessionId;
    }

    // For JSON output (most prompts)
    private async callAI(messages: any[], model: string = AI_MODELS.default, stepName: string = 'Unknown') {
        const inputText = JSON.stringify(messages);
        const tokensIn = estimateTokens(inputText);
        const startTime = Date.now();
        const modelShortName = model.split('/').pop() || model;

        console.log(`🚀 [${stepName}] STARTED (${modelShortName}, ${tokensIn} tokens)`);
        if (tokensIn > 150000) {
            console.warn(`⚠️ [${stepName}] HIGH TOKEN USAGE: ${tokensIn} tokens. (User approved limit: 150k)`);
        }

        try {
            let completion;
            try {
                // Attempt 1: Try with requested model (likely :free)
                completion = await openRouter.chat.send({
                    model: model,
                    messages: messages,
                    stream: false,
                    max_tokens: 16000,
                } as any);
            } catch (firstError: any) {
                // Check if it's a rate limit (429) or just a free tier failure
                const isRateLimit = firstError?.message?.includes('429') || firstError?.status === 429;

                if ((isRateLimit || model.endsWith(':free')) && model.includes(':free')) {
                    const paidModel = model.replace(':free', '');
                    console.warn(`⚠️ [${stepName}] Free Tier Limit / Error (429). Switching to PAID model: ${paidModel} ...`);

                    // Attempt 2: Retry with paid model
                    completion = await openRouter.chat.send({
                        model: paidModel,
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
            console.log(`✅ [${stepName}] COMPLETE in ${durationSec}s (In: ${tokensIn}, Out: ${tokensOut})`);

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
            try {
                let cleanContent = content;

                // 1. Priority: Extract from Markdown code block
                const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                if (codeBlockMatch) {
                    cleanContent = codeBlockMatch[1];
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
                        parsed._meta = { model: modelShortName, tokensIn, tokensOut, duration: `${durationSec}s` };
                        return parsed;
                    }
                } catch (e) { /* ignore to try jsonrepair */ }

                // 4. Fallback: jsonrepair
                console.warn(`⚠️ [${stepName}] Initial JSON parse failed, attempting robust repair with jsonrepair...`);
                const repaired = jsonrepair(cleanContent);
                const parsed = JSON5.parse(repaired);

                if (parsed && typeof parsed === 'object') {
                    parsed._meta = { model: modelShortName, tokensIn, tokensOut, duration: `${durationSec}s` };
                    return parsed;
                }

                throw new Error("Parsed content is not an object");

            } catch (pE: any) {
                console.error(`❌ [${stepName}] JSON Parse Error (FATAL):`, pE.message);
                console.error(`Raw content preview: ${content.substring(0, 500)}...`);
                throw new Error(`JSON Parse Error: ${pE.message}. Model output might be truncated or invalid.`);
            }
        } catch (error) {
            console.error(`❌ [${stepName}] AI Call Failed:`, error);
            throw error;
        }
    }

    // For Markdown output (implementation plan, design system)
    private async callAIRaw(messages: any[], model: string = AI_MODELS.default, stepName: string = 'Unknown'): Promise<string> {
        const inputText = JSON.stringify(messages);
        const tokensIn = estimateTokens(inputText);
        const startTime = Date.now();
        const modelShortName = model.split('/').pop() || model;

        console.log(`🚀 [${stepName}] STARTED (${modelShortName}, ${tokensIn} tokens)`);
        if (tokensIn > 150000) {
            console.warn(`⚠️ [${stepName}] HIGH TOKEN USAGE: ${tokensIn} tokens. (User approved limit: 150k)`);
        }

        try {
            const completion = await openRouter.chat.send({
                model: model,
                messages: messages,
                stream: false,
                max_tokens: 32000,
            } as any);

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
            console.log(`✅ [${stepName}] COMPLETE in ${durationSec}s (In: ${tokensIn}, Out: ${tokensOut})`);

            // SESSION LOGGING
            if (this.sessionId) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const logDir = path.join(process.cwd(), 'data', 'sessions', this.sessionId, 'logs');
                    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const safeStep = stepName.replace(/[^a-z0-9]/gi, '_');
                    const logFile = path.join(logDir, `${timestamp}_${safeStep}_RAW.json`);

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
            console.error(`❌ [${stepName}] FAILED after ${durationSec}s`);
            console.error(`   🤖 Model: ${modelShortName}`);
            console.error(`   Error:`, error);
            throw error;
        }
    }


    async generateCritique(structure: SiteStructure, userInstructions?: string) {
        const messages = userInstructions
            ? Prompts.buildCritiquePromptWithInstructions(structure, userInstructions)
            : Prompts.buildCritiquePrompt(structure);

        const rawResult = await this.callAI(messages, AI_MODELS.critique, 'BFSG Audit (Raw)');

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

                    // Update Item
                    item.weighted_score = weighted;
                    item.status = achieved === 1 ? '✅ Pass' : achieved === 0.5 ? '⚠️ Partial' : '❌ Fail';

                    // Update Totals
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

                // Calculate Percentages
                const totalScore = totalMax > 0 ? Math.round((totalAchieved / totalMax) * 100) : 0;
                const a11yScore = a11yMax > 0 ? Math.round((a11yAchieved / a11yMax) * 100) : 0;
                const seoScore = seoMax > 0 ? Math.round((seoAchieved / seoMax) * 100) : 0;

                // Determine Rating (BFSG Logic)
                const isCompliant = criticalFailures === 0 && totalScore >= 50; // Simplified BFSG rule
                let rating = 'Mangelhaft';
                let emoji = '⛔';

                // Pass/Fail Gate
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
    }

    async generateMigrationPlan(structure: SiteStructure, userInstructions?: string) {
        const messages = userInstructions
            ? Prompts.buildMigrationPromptWithInstructions(structure, userInstructions)
            : Prompts.buildMigrationPrompt(structure);

        const plan = await this.callAI(messages, AI_MODELS.migration, 'Migration Plan');

        // Post-processing sanity check
        if (plan && plan.page_mapping) {
            console.log("Raw AI Mapping (First 3):", JSON.stringify(plan.page_mapping.slice(0, 3)));

            plan.page_mapping = plan.page_mapping.map((p: any) => {
                // Normalize paths for comparison (strip trailing slashes, ignoring root)
                const normalize = (path: string) => {
                    if (!path) return '';
                    let clean = path;
                    // Strip protocol and domain if present
                    try {
                        if (clean.startsWith('http')) {
                            const url = new URL(clean);
                            clean = url.pathname;
                        }
                    } catch (e) {
                        // Invalid URL, treat as relative path
                    }
                    // Strip trailing slash if not root
                    return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean;
                };

                const normOld = normalize(p.old_url);
                const normNew = normalize(p.new_path);

                // 1. Check for self-redirects
                if (p.action === 'redirect' && normOld === normNew) {
                    console.log(`🧹 Fixed self - redirect for ${p.old_url}: Changing to 'keep'`);
                    return { ...p, action: 'keep' };
                }

                // 2. Explicitly protect the homepage
                if (p.old_url === '/' || p.old_url.match(/^https?:\/\/[^\/]+\/?$/)) {
                    if (p.action === 'redirect' && (p.new_path === '/' || p.new_path === '')) {
                        return { ...p, new_path: '/', action: 'keep' };
                    }
                }

                return p;
            });
        }
        return plan;
    }

    async generateComponentLibrary(migrationPlan: any, crawledStructure?: any, userInstructions?: string, stackConfig?: any, critique?: any) {
        // Step 0: Prepare massive context string
        const contextString = Prompts.prepareComponentContext(migrationPlan, crawledStructure, userInstructions, stackConfig, critique);

        // Step 1: Extraction (Pattern Mining) - "What do you see?"
        const extractionMessages = Prompts.buildComponentExtractionPrompt(contextString);
        const extractionResult = await this.callAI(extractionMessages, AI_MODELS.default, 'Component Extraction (Phase 1)');

        console.log(`🔍[Extraction] Found ${(extractionResult.patterns || []).length} patterns`);

        // Step 2: Mapping (Library Assignment) - "Map to shadcn"
        const mappingMessages = Prompts.buildComponentMappingPrompt(extractionResult.patterns, stackConfig);
        const libraryResult = await this.callAI(mappingMessages, AI_MODELS.componentArchitect, 'Component Mapping (Phase 2)');

        // Merge results so frontend gets full picture (Library + Original Patterns)
        return {
            ...libraryResult,
            patterns: extractionResult.patterns,
            _meta: { ...libraryResult._meta, phase1_patterns: extractionResult.patterns?.length }
        };
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
    async generateImplementationPlan(spec: any, stack: StackConfig, userInstructions?: string, availableAssets?: Record<string, string>, designConfig?: DesignConfig, pageSpecs?: any[]): Promise<string> {
        const messages = Prompts.buildImplementationPrompt(spec, stack, userInstructions, availableAssets, designConfig, pageSpecs);
        return this.callAIRaw(messages, AI_MODELS.implementation, 'Implementation Plan');
    }

    async optimizePageContent(pageData: { path: string, rawText: string, suggestedComponents: string[] }, userInstructions?: string) {
        const messages = Prompts.buildContentOptimizerPrompt(pageData, userInstructions);
        return this.callAI(messages, AI_MODELS.contentOptimizer, 'Content Optimizer');
    }



    async generatePageSpecs(targets: any[]) {
        const messages = [
            { role: 'system', content: Prompts.PAGE_SPECS_SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(targets.map(t => ({ id: t.id, path: t.path, sourceText: t.sourceText }))) }
        ];
        const specList = await this.callAI(messages, AI_MODELS.default, 'PageSpecs');

        // Robust array extraction
        let specs: any[] = [];
        if (Array.isArray(specList)) {
            specs = specList;
        } else if (specList && typeof specList === 'object') {
            specs = specList.targets || specList.pages || specList.specs || (specList.id ? [specList] : []);
        }

        return targets.map((t, idx) => {
            const aiSpec = specs.find((s: any) => s.id === t.id || s.path === t.path) || specs[idx];
            if (aiSpec) {
                return { ...t, ...aiSpec };
            }
            return t;
        });
    }

    async generateDesignPalette(baseColors: string[], vibe?: string) {
        const messages = [
            { role: 'system', content: Prompts.DESIGN_GENERATOR_SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify({ baseColors, vibe }) }
        ];

        return this.callAI(messages, AI_MODELS.designSystem, 'Design Palette Generator');
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
        return raw.replace(/```html /g, '').replace(/```/g, '').trim();
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

        // Sanitation: Ensure headline and content are strings
        if (result && result.sections && Array.isArray(result.sections)) {
            result.sections = result.sections.map((s: any) => ({
                ...s,
                headline: typeof s.headline === 'object' ? JSON.stringify(s.headline) : (s.headline || ''),
                content: typeof s.content === 'object' ? JSON.stringify(s.content) : (s.content || '')
            }));
        }

        return result;
    }
}
