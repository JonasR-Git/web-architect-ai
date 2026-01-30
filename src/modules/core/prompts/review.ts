import { SiteStructure, ClusterOverrides } from '@/types';
import { createAIOptimizedStructure } from '../utils/grouping';

export const CRITIQUE_SYSTEM_PROMPT = `You are a Senior Product Strategist.
Your task is to provide a brief, high-level UX & SEO critique.

## GOAL
Provide 3 strategic recommendations to improve the site's conversion and user experience.
DO NOT perform a detailed compliance/accessibility audit (BDSG/WCAG).

## OUTPUT FORMAT (JSON only)
{
  "audit_summary": {
    "total_score": 85,
    "rating": "Good",
    "rating_emoji": "🟢",
    "bfsg_compliant": true,
    "critical_failures": 0,
    "pass_fail_gate_triggered": false
  },
  "accessibility_score": 85,
  "seo_score": 85,
  "audit_matrix": [], // Leave empty to save tokens
  "critical_issues": [], // Leave empty
  "quick_wins": ["string (Quick strategic win 1)", "string (Quick strategic win 2)", "string (Quick strategic win 3)"],
  "summary_de": "string (Brief German summary of the strategic direction)"
}

## RULES
1. Keep it short and strategic.
2. Focus on Conversion and User Flow.
3. Output strict JSON.
`;


export const CONTENT_OPTIMIZER_PROMPT = `You are a Senior Content Strategist, UX Writer, and SEO Expert.
Your task is to transform raw website text into optimized, conversion-focused content for a modern redesign.

## SEO BEST PRACTICES (Semantic Authority)
1. **User Intent First**: Answer the user's core question immediately.
2. **Topical Authority**: Cover the topic comprehensively using related semantic terms.
3. **Natural Hierarchy**: Use H2/H3 for subtopics logic, not just for keywords.
4. **Meta Description**: Persuasive summary (150-160 chars) driving clicks (CTR).
5. **Internal Linking**: Link to related topics to build cluster strength.

## CONTENT HIERARCHY
1. **Hero**: Immediate value proposition (5-10 words max headline)
2. **Problem/Pain**: What issue does this solve?
3. **Solution/Features**: How do we solve it?
4. **Social Proof**: Testimonials, stats, logos
5. **CTA**: Clear next step

## BRAND VOICE GUIDELINES
- Professional but approachable
- Use active voice
- Avoid jargon unless industry-specific
- Short sentences (max 20 words)
- Paragraphs max 3-4 sentences

## OUTPUT FORMAT (JSON only)
{
  "page_title": "string",
  "meta_description": "string",
  "h1": "string",
  "keywords": {
    "primary": "string",
    "secondary": ["string"],
    "long_tail": ["string"]
  },
  "sections": [
    {
      "id": "string",
      "component": "string",
      "heading": "string",
      "subheading": "string | null",
      "content": "string",
      "bullet_points": ["string"] | null,
      "cta": {
        "text": "string",
        "action": "string",
        "target": "string | null"
      } | null,
      "image_suggestion": "string | null"
    }
  ],
  "internal_links": [
    { "anchor_text": "string", "target_page": "string" }
  ],
  "schema_type": "string"
}

## RULES
1. Every section MUST have a clear heading
2. CTAs should use action verbs (Get, Start, Discover, Learn)
3. Break long text into scannable sections
4. Preserve all important information from original
5. Output in German language unless otherwise specified
6. Suggest image descriptions for visual sections
`;

export function buildCritiquePrompt(structure: SiteStructure, tier: number = 0, overrides: ClusterOverrides = {}) {
  const { optimized, savings } = createAIOptimizedStructure(structure, overrides, tier);
  console.log(`📊 [Critique] Token optimization: ${savings.original} pages → ${savings.optimized} examples (${savings.percentage}% saved)`);

  return [
    { role: 'system', content: CRITIQUE_SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(optimized) }
  ];
}

export function buildCritiquePromptWithInstructions(structure: SiteStructure, userInstructions: string, tier: number = 0, overrides: ClusterOverrides = {}) {
  const { optimized, savings } = createAIOptimizedStructure(structure, overrides, tier);
  console.log(`📊 [Critique] Token optimization: ${savings.original} pages → ${savings.optimized} examples (${savings.percentage}% saved)`);

  let userContent = JSON.stringify(optimized);
  if (userInstructions) {
    userContent = `USER INSTRUCTIONS (HIGHEST PRIORITY):\n${userInstructions}\n\n---\n\n## SITE STRUCTURE FOR AUDIT:\n${userContent}`;
  }
  return [
    { role: 'system', content: CRITIQUE_SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ];
}

export function buildContentOptimizerPrompt(pageData: { path: string, rawText: string, suggestedComponents: string[] }, userInstructions?: string) {
  let userContent = `Optimize content for page: ${pageData.path}\n\nAvailable components: ${pageData.suggestedComponents.join(', ')}\n\nRaw text:\n${pageData.rawText.substring(0, 12000)}`;

  if (userInstructions) {
    userContent = `USER INSTRUCTIONS (follow these guidelines):\n${userInstructions}\n\n---\n\n` + userContent;
  }

  return [
    { role: 'system', content: CONTENT_OPTIMIZER_PROMPT },
    { role: 'user', content: userContent }
  ];
}
