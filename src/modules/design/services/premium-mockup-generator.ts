/**
 * Premium Multi-Stage Mockup Generator
 *
 * 3-Stage Generation Process:
 * Stage 1: Layout & Structure (Foundation)
 * Stage 2: Visual Refinement (Polish)
 * Stage 3: Iterative Improvement (Excellence)
 */

import type { DesignConfig, ComponentSpecification, TargetSlot } from '@/types';

export interface MockupGenerationStages {
  stage1_structure: string;
  stage2_refined: string;
  stage3_polished: string;
  critique: DesignCritique;
}

export interface DesignCritique {
  overall_score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
}

/**
 * Style Preset Definitions
 */
export const STYLE_PRESETS = {
  minimal: {
    name: 'Minimal',
    description: 'Clean, lots of whitespace, subtle accents',
    principles: [
      'Generous whitespace (min 120px between sections)',
      'Monochromatic or limited color palette',
      'Subtle shadows (max 0.1 opacity)',
      'Sans-serif typography only',
      'Simple geometric shapes',
      'Hidden complexity - simple on surface',
    ],
    references: ['Apple.com', 'Stripe.com', 'Linear.app'],
    spacing_multiplier: 1.8,
    color_usage: 'minimal',
    typography_scale: 'tight',
  },

  bold: {
    name: 'Bold',
    description: 'Large typography, vibrant colors, high contrast',
    principles: [
      'Extra-large headlines (min 72px)',
      'Vibrant gradients and bold colors',
      'High contrast ratios (min 7:1)',
      'Strong visual hierarchy',
      'Large CTAs with prominent placement',
      'Confident, assertive design language',
    ],
    references: ['Spotify.com', 'Discord.com', 'Vercel.com'],
    spacing_multiplier: 1.4,
    color_usage: 'vibrant',
    typography_scale: 'expanded',
  },

  playful: {
    name: 'Playful',
    description: 'Rounded corners, bright colors, friendly vibe',
    principles: [
      'Rounded corners everywhere (min 16px)',
      'Bright, cheerful color palette',
      'Illustrations and icons',
      'Friendly, approachable tone',
      'Soft shadows and gentle gradients',
      'Fun micro-interactions hints',
    ],
    references: ['Mailchimp.com', 'Slack.com', 'Notion.so'],
    spacing_multiplier: 1.5,
    color_usage: 'cheerful',
    typography_scale: 'friendly',
  },

  elegant: {
    name: 'Elegant',
    description: 'Serif fonts, luxury feel, sophisticated',
    principles: [
      'Serif typography for headings',
      'Gold/black or muted color palettes',
      'Generous negative space',
      'Subtle, refined animations',
      'High-quality imagery',
      'Premium, luxurious aesthetic',
    ],
    references: ['Luxury brand websites', 'High-end portfolios'],
    spacing_multiplier: 2.0,
    color_usage: 'sophisticated',
    typography_scale: 'classic',
  },

  brutalist: {
    name: 'Brutalist',
    description: 'Raw, grid-based, unconventional',
    principles: [
      'Visible grid system',
      'Monospace or grotesque fonts',
      'Raw, unpolished aesthetic',
      'Unconventional layouts',
      'Black/white with accent color',
      'Anti-design, form follows function',
    ],
    references: ['Bloomberg.com', 'Gumroad.com'],
    spacing_multiplier: 1.0,
    color_usage: 'stark',
    typography_scale: 'monospace',
  },
} as const;

/**
 * Stage 1: Layout & Structure Generation
 * Focus: Grid system, spacing, hierarchy, content flow
 */
export function generateStage1Prompt(
  config: DesignConfig,
  componentSpec: ComponentSpecification,
  pageSpec: TargetSlot
): string {
  // Fallback to 'minimal' if preset is 'custom' or undefined
  const preset = config.stylePreset && config.stylePreset !== 'custom'
    ? config.stylePreset
    : 'minimal';
  const presetConfig = STYLE_PRESETS[preset as keyof typeof STYLE_PRESETS];

  return `You are an EXPERT UI/UX Designer creating a PREMIUM website mockup.

=== DESIGN BRIEF ===
Page: ${pageSpec.label || pageSpec.path}
Type: ${pageSpec.type || 'page'}
Style: ${presetConfig.name} (${presetConfig.description})

=== STAGE 1 OBJECTIVE: LAYOUT & STRUCTURE ===
Create the FOUNDATIONAL HTML structure with perfect spacing, hierarchy, and grid system.

=== CRITICAL DESIGN PRINCIPLES ===

1. **SPACING & RHYTHM** (Most Important!)
   ${generateSpacingRules(preset)}

2. **GRID SYSTEM**
   - Use CSS Grid for main layout (NOT just flexbox)
   - Implement 12-column grid with clear gutters
   - Vary column spans for visual interest
   - Use subgrid for nested elements
   - Create asymmetric layouts where appropriate

3. **VISUAL HIERARCHY**
   - 3 levels maximum: Primary (Hero/Main CTA), Secondary (Features), Tertiary (Footer)
   - Clear focal point per section
   - F-pattern or Z-pattern for content flow
   - Size differences: min 2:1 ratio between levels

4. **CONTENT STRUCTURE**
   Required Sections (in order):
   ${generateSectionStructure(pageSpec, preset)}

5. **LAYOUT RULES**
   - Full-width sections with contained content (max-width: 1440px)
   - Vary section backgrounds (white, subtle gray, brand color)
   - Use padding, NEVER margin collapse
   - Implement proper aspect ratios for images (16:9, 4:3, 1:1)

=== HTML REQUIREMENTS ===
- Semantic HTML5 (header, nav, main, section, article, footer)
- BEM-like class naming (block__element--modifier)
- Data attributes for interactive elements (data-animation="fade-in")
- Accessibility: proper heading levels (h1 → h2 → h3)
- No inline styles (use utility classes)

=== STYLE PRESET: ${presetConfig.name} ===
Core Principles:
${presetConfig.principles.map(p => `- ${p}`).join('\n')}

References: ${presetConfig.references.join(', ')}

=== OUTPUT FORMAT ===
Return ONLY valid HTML (no markdown, no explanations).
Focus on STRUCTURE, not visual styling (that's Stage 2).
Use Tailwind CSS utility classes for spacing and layout.

Begin with <!DOCTYPE html> and create the complete page structure now.`;
}

/**
 * Stage 2: Visual Refinement
 * Focus: Colors, typography, shadows, gradients, visual polish
 */
export function generateStage2Prompt(
  config: DesignConfig,
  stage1Html: string
): string {
  // Fallback to 'minimal' if preset is 'custom' or undefined
  const preset = config.stylePreset && config.stylePreset !== 'custom'
    ? config.stylePreset
    : 'minimal';
  const presetConfig = STYLE_PRESETS[preset as keyof typeof STYLE_PRESETS];

  return `You are refining a website mockup to PROFESSIONAL QUALITY.

=== STAGE 2 OBJECTIVE: VISUAL REFINEMENT ===
Take the structural HTML and add PREMIUM visual polish.

=== INPUT ===
${stage1Html}

=== VISUAL REFINEMENT TASKS ===

1. **COLOR SYSTEM**
   ${generateColorGuidelines(config, preset)}

2. **TYPOGRAPHY**
   ${generateTypographyGuidelines(config, preset)}

3. **SHADOWS & DEPTH**
   ${generateShadowGuidelines(preset)}

4. **GRADIENTS & EFFECTS**
   ${generateEffectsGuidelines(preset)}

5. **IMAGES & MEDIA**
   - Add proper aspect ratios
   - Implement lazy loading hints (data-loading="lazy")
   - Use object-fit for images
   - Add blur placeholders for performance
   - Overlay gradients on hero images

6. **MICRO-INTERACTIONS** (Hints via classes)
   - Hover states: scale, brightness, shadow changes
   - Focus states: ring, outline
   - Active states: pressed effect
   - Transition timings: 150ms (fast), 300ms (normal), 500ms (slow)

=== QUALITY CHECKLIST ===
✓ WCAG AAA contrast ratios (min 7:1 for normal text)
✓ Consistent spacing rhythm (8px grid)
✓ Clear visual hierarchy (size, color, weight)
✓ Proper z-index layering (content: 1, floating: 10, modal: 100)
✓ Responsive considerations (show mobile-friendly structure)

=== STYLE PRESET: ${presetConfig.name} ===
Apply these visual principles:
${presetConfig.principles.map(p => `- ${p}`).join('\n')}

=== OUTPUT ===
Return the COMPLETE refined HTML.
Make it look PROFESSIONAL and POLISHED.
This should look like a $10,000 design.`;
}

/**
 * Stage 3: Self-Critique & Polish
 * Focus: Final improvements, consistency, excellence
 */
export function generateStage3Prompt(
  config: DesignConfig,
  stage2Html: string
): string {
  return `You are performing a FINAL QUALITY REVIEW and polish pass.

=== STAGE 3 OBJECTIVE: CRITIQUE & EXCELLENCE ===

=== INPUT HTML ===
${stage2Html}

=== SELF-CRITIQUE ANALYSIS ===
Analyze the current design for:

1. **Visual Hierarchy**
   - Is there a clear focal point?
   - Are headings properly sized (h1 > h2 > h3)?
   - Do CTAs stand out prominently?

2. **Spacing & Rhythm**
   - Is whitespace used generously?
   - Is spacing consistent (8px grid)?
   - Are sections well-separated?

3. **Color Harmony**
   - Are colors balanced (not overwhelming)?
   - Is contrast ratio acceptable (WCAG AA minimum)?
   - Do accent colors guide attention effectively?

4. **Typography**
   - Are font sizes appropriate?
   - Is line height comfortable (1.5-1.8)?
   - Is text readable at all sizes?

5. **Component Variety**
   - Are there diverse component types?
   - Do sections feel unique but cohesive?
   - Is there visual interest throughout?

6. **Polish Level**
   - Do shadows feel natural?
   - Are borders/corners consistent?
   - Are interactive elements obvious?

=== IMPROVEMENT PASS ===
Based on your critique, make FINAL improvements:
- Fix any spacing inconsistencies
- Enhance weak visual hierarchy
- Add missing interactive hints
- Improve component variety
- Polish rough edges

=== OUTPUT ===
Return TWO things:

1. **CRITIQUE** (JSON object):
{
  "overall_score": 85,
  "strengths": ["Clear hierarchy", "Good whitespace"],
  "weaknesses": ["CTAs could be larger"],
  "improvements": ["Increase CTA size by 20%"]
}

2. **POLISHED HTML**:
The final, production-ready HTML.

Format:
===CRITIQUE===
{json here}
===HTML===
{html here}`;
}

/**
 * Helper: Generate spacing rules based on preset
 */
function generateSpacingRules(preset: string): string {
  const multiplier = STYLE_PRESETS[preset as keyof typeof STYLE_PRESETS].spacing_multiplier;
  const baseUnit = 8;
  const sectionSpacing = Math.round(baseUnit * 15 * multiplier); // 120px default
  const containerPadding = Math.round(baseUnit * 8 * multiplier); // 64px default

  return `- Base unit: ${baseUnit}px (use multiples only)
   - Section spacing: ${sectionSpacing}px minimum between sections
   - Container padding: ${containerPadding}px horizontal padding
   - Card padding: ${Math.round(baseUnit * 6 * multiplier)}px
   - Button padding: ${Math.round(baseUnit * 3 * multiplier)}px vertical, ${Math.round(baseUnit * 6 * multiplier)}px horizontal
   - Line height: 1.5 for body, 1.2 for headings
   - Letter spacing: -0.02em for headings, 0 for body`;
}

/**
 * Helper: Generate section structure based on page type
 */
function generateSectionStructure(pageSpec: TargetSlot, preset: string): string {
  const sections = pageSpec.sections || [];

  if (sections.length === 0) {
    return `- Hero (full viewport height)
   - Features (3-column grid)
   - Content/Benefits (2-column split)
   - CTA (centered, prominent)
   - Footer (3-column links)`;
  }

  return sections.map((s, i) => `${i + 1}. ${s.type}: ${s.title || 'Section'}`).join('\n   ');
}

/**
 * Helper: Generate color guidelines
 */
function generateColorGuidelines(config: DesignConfig, preset: string): string {
  const { primary, secondary, background, text, accent } = config.colors;
  const usage = STYLE_PRESETS[preset as keyof typeof STYLE_PRESETS].color_usage;

  const guidelines = {
    minimal: `- Use colors SPARINGLY (90% neutral, 10% color)
   - Primary: ${primary} (CTAs and key accents only)
   - Background: ${background} (main background)
   - Text: ${text} (all body text)
   - Subtle grays: #F9FAFB, #F3F4F6, #E5E7EB`,

    vibrant: `- Use colors BOLDLY (60% color, 40% neutral)
   - Primary: ${primary} (headers, CTAs, backgrounds)
   - Secondary: ${secondary} (accents, borders)
   - Gradients: ${primary} to ${secondary}
   - Accent: ${accent} (highlights)
   - High contrast text on colored backgrounds`,

    cheerful: `- Use colors GENEROUSLY (bright, friendly palette)
   - Primary: ${primary} (main brand color)
   - Secondary: ${secondary} (complementary accents)
   - Accent: ${accent} (highlights and fun details)
   - Soft pastels for backgrounds
   - Rainbow gradients for decorative elements`,

    sophisticated: `- Use colors ELEGANTLY (muted, refined)
   - Primary: ${primary} (used sparingly, for emphasis)
   - Background: Warm neutrals (#FAFAF9, #F5F5F4)
   - Text: Deep charcoal (#171717)
   - Gold accents (#D4AF37) for luxury feel
   - Soft shadows, no harsh contrasts`,

    stark: `- Use colors MINIMALLY (black/white dominant)
   - Background: ${background} (likely black or white)
   - Text: ${text} (high contrast)
   - Accent: ${accent || primary} (single accent color only)
   - No gradients, hard edges only
   - Raw, unpolished feel`,
  };

  return guidelines[usage as keyof typeof guidelines] || guidelines.minimal;
}

/**
 * Helper: Generate typography guidelines
 */
function generateTypographyGuidelines(config: DesignConfig, preset: string): string {
  const scale = STYLE_PRESETS[preset as keyof typeof STYLE_PRESETS].typography_scale;

  const typeMapping = {
    modern: 'Inter, system-ui, sans-serif',
    classic: 'Merriweather, Georgia, serif',
    tech: 'JetBrains Mono, monospace',
    humanist: 'Outfit, system-ui, sans-serif',
  };

  const fontFamily = typeMapping[config.typography] || typeMapping.modern;

  const scales = {
    tight: { h1: '48px', h2: '36px', h3: '24px', body: '16px' },
    expanded: { h1: '72px', h2: '48px', h3: '32px', body: '18px' },
    friendly: { h1: '56px', h2: '40px', h3: '28px', body: '17px' },
    classic: { h1: '64px', h2: '42px', h3: '28px', body: '18px' },
    monospace: { h1: '42px', h2: '32px', h3: '24px', body: '14px' },
  };

  const sizes = scales[scale as keyof typeof scales] || scales.tight;

  return `- Font family: ${fontFamily}
   - H1: ${sizes.h1}, font-weight: 700, line-height: 1.1
   - H2: ${sizes.h2}, font-weight: 600, line-height: 1.2
   - H3: ${sizes.h3}, font-weight: 600, line-height: 1.3
   - Body: ${sizes.body}, font-weight: 400, line-height: 1.6
   - Letter spacing: -0.02em for headings
   - Text rendering: optimizeLegibility`;
}

/**
 * Helper: Generate shadow guidelines
 */
function generateShadowGuidelines(preset: string): string {
  const shadows = {
    minimal: `- Use shadows SPARINGLY
   - sm: 0 1px 2px rgba(0,0,0,0.05)
   - md: 0 4px 6px rgba(0,0,0,0.07)
   - Never use xl shadows`,

    vibrant: `- Use shadows BOLDLY
   - md: 0 4px 12px rgba(0,0,0,0.15)
   - lg: 0 10px 30px rgba(0,0,0,0.2)
   - colored shadows: 0 8px 16px rgba(primary, 0.3)`,

    cheerful: `- Use shadows SOFTLY
   - sm: 0 2px 8px rgba(0,0,0,0.08)
   - md: 0 4px 16px rgba(0,0,0,0.12)
   - Soft, diffused shadows`,

    sophisticated: `- Use shadows ELEGANTLY
   - Subtle, barely visible
   - sm: 0 1px 3px rgba(0,0,0,0.08)
   - Multi-layer shadows for depth`,

    stark: `- NO SHADOWS
   - Hard edges only
   - Use borders instead (1px solid)`,
  };

  return shadows[STYLE_PRESETS[preset as keyof typeof STYLE_PRESETS].color_usage as keyof typeof shadows] || shadows.minimal;
}

/**
 * Helper: Generate effects guidelines
 */
function generateEffectsGuidelines(preset: string): string {
  const effects = {
    minimal: `- Gradients: Subtle, if any (background only)
   - Backdrop blur: None
   - Animations: Subtle fades only`,

    bold: `- Gradients: Bold, vibrant (45deg, primary to secondary)
   - Backdrop blur: 20px for glass effects
   - Animations: Scale, slide, emphasis effects`,

    playful: `- Gradients: Soft, multi-color (rainbow, pastels)
   - Backdrop blur: 10px for cards
   - Animations: Bounce, wiggle, fun effects`,

    elegant: `- Gradients: Metallic (gold shimmer)
   - Backdrop blur: Minimal, if used
   - Animations: Slow, smooth transitions (500ms+)`,

    stark: `- Gradients: NONE
   - Backdrop blur: NONE
   - Animations: NONE or instant`,
  };

  return effects[STYLE_PRESETS[preset as keyof typeof STYLE_PRESETS].color_usage as keyof typeof effects] || effects.minimal;
}

/**
 * Parse Stage 3 response (critique + HTML)
 */
export function parseStage3Response(response: string): {
  critique: DesignCritique;
  html: string;
} {
  const critiqueMatch = response.match(/===CRITIQUE===\s*(\{[\s\S]*?\})/);
  const htmlMatch = response.match(/===HTML===\s*([\s\S]*)/);

  let critique: DesignCritique = {
    overall_score: 80,
    strengths: [],
    weaknesses: [],
    improvements: [],
  };

  if (critiqueMatch) {
    try {
      critique = JSON.parse(critiqueMatch[1]);
    } catch (e) {
      console.error('Failed to parse critique JSON:', e);
    }
  }

  const html = htmlMatch ? htmlMatch[1].trim() : response;

  return { critique, html };
}
