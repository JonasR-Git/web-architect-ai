/**
 * Ultra-Extreme Mockup Generator
 *
 * 5-Stage Generation Process:
 * Stage 1: Foundation (Layout & Structure) - ~1,400 words, Mimo-v2-flash
 * Stage 2: Archetype Application - ~1,200 words, Mimo-v2-flash
 * Stage 3: Experimental Push (Break Rules) - ~1,600 words, Sonnet 3.5, temp=0.9
 * Stage 4: Self-Critique - ~600 words, Mimo-v2-flash
 * Stage 5: Extreme Polish - ~1,400 words, Sonnet 3.5
 *
 * Total: ~60K tokens per variant, ~$0.42 per variant with longer prompts
 */

import { DesignConfig, ComponentSpecification, TargetSlot, MockupSiteData } from '@/types';
import { Archetype } from '@/modules/design/data/all-archetypes';

/**
 * Stage 1: Foundation (Layout & Structure)
 * ~1,400 words, ~8K tokens
 * Model: Mimo-v2-flash (fast, cheap)
 *
 * Focus: Grid system, spacing rhythm, semantic HTML
 * Includes: 12-column grid, asymmetric layouts, design level considerations
 */
export function generateStage1Prompt(
  designConfig: DesignConfig,
  componentSpec: ComponentSpecification | null,
  pageSpec: TargetSlot,
  siteData?: MockupSiteData,
  variationSeed?: number
): string {
  const designLevel = designConfig.designLevel || 'standard';
  const levelGuidelines = getDesignLevelGuidelines(designLevel);

  return `# STAGE 1: FOUNDATION - Layout & Structure

## Context
You are generating the foundational HTML structure for a ${levelGuidelines.label} design mockup. This is STAGE 1 of 5.
Your goal: Establish a rock-solid layout foundation with semantic HTML, responsive grids, and initial spacing that aligns with the ${designLevel} design philosophy.

${variationSeed ? `**Variation Seed**: ${variationSeed} - Use this to introduce subtle differences in layout approach while maintaining quality.` : ''}

## Design Level: ${levelGuidelines.label}
**Philosophy**: ${levelGuidelines.description}
**Quality Bar**: ${levelGuidelines.qualityBar}

## Page Information
- **Page**: ${pageSpec.label} (${pageSpec.path})
- **Description**: ${pageSpec.description || 'Homepage'}
- **Content Goals**: ${pageSpec.content_goals?.join(', ') || 'Engage visitors'}
- **Site Name**: ${siteData?.siteName || 'Website'}
${siteData?.h1 ? `- **H1**: ${siteData.h1}` : ''}
${siteData?.navigation ? `- **Navigation**: ${siteData.navigation.map(n => n.text).join(', ')}` : ''}
${siteData?.meta?.description ? `- **Site Description**: ${siteData.meta.description}` : ''}

${siteData?.plannedContent?.sections && siteData.plannedContent.sections.length > 0 ? `
## ⚠️ PLANNED CONTENT - MUST USE EXACTLY ⚠️
The following content has been AI-generated specifically for this site. **YOU MUST USE THESE EXACT TEXTS**.
DO NOT paraphrase, modify, or generate new content. Copy these exact headlines and content into your HTML:

${siteData.plannedContent.sections.slice(0, 5).map((s: any, i: number) => `
**Section ${i + 1}: ${s.type.toUpperCase()}**
- Headline: "${s.headline || s.content_hint}"
- Content: ${s.content || 'No content provided'}
- Images: ${s.images && s.images.length > 0 ? `${s.images.length} images assigned to this section` : 'No images'}
`).join('\n')}

**CRITICAL INSTRUCTION**: These are the final approved texts. Use them verbatim in your mockup.
` : ''}

${siteData?.rawText && (!siteData?.plannedContent?.sections || siteData.plannedContent.sections.length === 0) ? `
## Raw Content Sample (Fallback Only)
First 1000 characters from original homepage - use ONLY if no planned content above:
\`\`\`
${siteData.rawText}
\`\`\`

Use this to understand content tone and style if no planned content is available.
` : ''}

${siteData?.meta?.designSignals && siteData.meta.designSignals.length > 0 ? `
## Design Patterns Detected
The crawler detected these design patterns on the original site:
${siteData.meta.designSignals.map((signal: string) => `- ${signal}`).join('\n')}

Consider these patterns when designing, but adapt them to fit the selected archetype and design level.
` : ''}

${componentSpec && (componentSpec as any).groups && (componentSpec as any).groups.length > 0 ? `
## Component Specifications
The following component groups were identified for this site:
${(componentSpec as any).groups.slice(0, 5).map((group: any, idx: number) => `
**${group.name}**:
${group.components.slice(0, 3).map((comp: any) => `  - ${comp.name}: ${comp.description || 'No description'}${comp.usage && comp.usage.length > 0 ? ` (Used in: ${comp.usage.slice(0, 2).join(', ')})` : ''}`).join('\n')}
`).join('\n')}

Generate HTML/CSS that could accommodate these component types.
` : ''}

${siteData?.meta?.imageComponentSummary && siteData.meta.imageComponentSummary.length > 0 ? `
## Image Component Groups
${siteData.meta.imageComponentSummary.map((summary: string) => `- ${summary}`).join('\n')}
` : ''}

${siteData?.forms && siteData.forms.length > 0 ? `
## Forms Detected
${siteData.forms.slice(0, 3).map((form: any, idx: number) => `
**Form ${idx + 1}**:
- Action: ${form.action || 'Not specified'}
- Method: ${form.method || 'GET'}
- Fields: ${form.fields?.length || 0} inputs
${form.fields ? `  - Field types: ${form.fields.slice(0, 5).map((f: any) => f.type || f.name).join(', ')}` : ''}
`).join('\n')}

If the design requires forms, use these as reference for the structure.
` : ''}

${siteData?.images && siteData.images.length > 0 ? `
## Available Images
Use these images from the crawled site in your mockup:

${siteData.images.map((img: any, idx: number) => `
**Image ${idx + 1}**:
- URL: ${img.src}
- Alt: ${img.alt || 'N/A'}
${img.isLogo ? `- **LOGO** (confidence: ${Math.round((img.logoProb || 0) * 100)}%)` : ''}
${img.role ? `- Role: ${img.role} (confidence: ${Math.round((img.roleConfidence || 0) * 100)}%)` : ''}
${img.componentHint ? `- Component Hint: ${img.componentHint}` : ''}
${img.context ? `- Context: ${img.context.substring(0, 100)}${img.context.length > 100 ? '...' : ''}` : ''}
${img.colorAnalysis ? `- Dominant Colors: ${img.colorAnalysis.dominantColors?.slice(0, 3).join(', ') || 'N/A'}` : ''}
`).join('\n')}

**Image Usage Instructions**:
- Use logos (isLogo=true) in the header/navigation
- Use hero images (role="hero") in the hero section background or as large featured images
- Use product/feature images in content sections based on their role and componentHint
- Maintain aspect ratios with object-fit: cover for backgrounds, object-fit: contain for logos
- All images should have descriptive alt text for accessibility
` : ''}

## Design Level Foundation Guidelines
${levelGuidelines.foundationRules}

**Spacing Philosophy**: ${levelGuidelines.spacingPhilosophy}
**Color Approach**: ${levelGuidelines.colorApproach}
**Typography Strategy**: ${levelGuidelines.typographyStrategy}

${variationSeed ? getVariationHints(variationSeed) : ''}

## Your Task: Build the Foundation

### 1. Document Structure
Create semantic, accessible HTML5 structure:
\`\`\`html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteData?.siteName || 'Website'}</title>
    <style>
        /* Embedded styles - NO external files */
        /* Foundation CSS only - archetype styles come in Stage 2 */
    </style>
</head>
<body>
    <!-- Semantic structure with <header>, <nav>, <main>, <section>, <footer> -->
</body>
</html>
\`\`\`

### 2. Grid System Foundation
Implement a 12-column CSS Grid system as the backbone:

**CSS Grid Setup**:
\`\`\`css
.container {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
    max-width: 1440px;
    margin: 0 auto;
    padding: 24px;
}

.col-12 { grid-column: span 12; } /* Full width */
.col-6 { grid-column: span 6; }   /* Half width */
.col-8 { grid-column: span 8; }   /* 2/3 width */
.col-4 { grid-column: span 4; }   /* 1/3 width */

/* Asymmetric layouts encouraged */
.offset-2 { grid-column-start: 3; }
.offset-3 { grid-column-start: 4; }
\`\`\`

**Grid Principles**:
- Use asymmetric layouts where appropriate (e.g., 8+4 columns instead of 6+6)
- Leave intentional whitespace by skipping columns
- All content must fit within the 12-column system
- Responsive breakpoints: Collapse to single column on mobile (<768px)

### 3. Spacing Rhythm
Establish consistent spacing using the 8px grid system:

**Spacing Scale**:
\`\`\`css
/* Base scale - adjust based on design level needs */
--space-xs: 8px;
--space-sm: 16px;
--space-md: 24px;
--space-lg: 32px;
--space-xl: 48px;
--space-2xl: 64px;
--space-3xl: 96px;

${levelGuidelines.spacingScale || '/* Use standard scale for balanced spacing */'}
\`\`\`

**Usage**:
- Section padding: var(--space-2xl) or larger
- Component spacing: var(--space-md) to var(--space-xl)
- Element margins: var(--space-xs) to var(--space-md)

### 4. Typography Foundation
Set up a clear typographic hierarchy:

**Font Strategy**: ${levelGuidelines.typographyStrategy}

**Type Scale**:
\`\`\`css
h1 { font-size: 48px; line-height: 1.2; font-weight: 700; }
h2 { font-size: 36px; line-height: 1.3; font-weight: 600; }
h3 { font-size: 28px; line-height: 1.4; font-weight: 600; }
p, li { font-size: 16px; line-height: 1.6; font-weight: 400; }

/* Adjust based on design level and variation seed */
${levelGuidelines.typographyExample || ''}
\`\`\`

### 5. Color Foundation
${levelGuidelines.colorApproach}

\`\`\`css
:root {
    --color-primary: ${designConfig.colors.primary};
    --color-secondary: ${designConfig.colors.secondary};
    --color-accent: ${designConfig.colors.accent};
    --color-bg: ${designConfig.colors.background};
    --color-text: ${designConfig.colors.text};

    /* Ensure WCAG AA minimum (4.5:1 for body text, 3:1 for large text) */
}
\`\`\`

${siteData?.extractedColors && siteData.extractedColors.length > 0 ? `
**Colors Extracted from Site**:
Use these colors from the crawled homepage to maintain brand consistency:
${siteData.extractedColors.map((c: any) => `- ${c.usage ? c.usage.charAt(0).toUpperCase() + c.usage.slice(1) : 'Color'}: ${c.color}`).join('\n')}

You can use these extracted colors instead of the configured colors above if they better match the site's brand identity.
` : ''}

${siteData?.designSystemColors ? `
**Image-Based Color Palette**:
Colors derived from site images for harmonious designs:
${siteData.designSystemColors.brand ? `- Brand Colors (from logo): Primary ${siteData.designSystemColors.brand.primary}${siteData.designSystemColors.brand.secondary ? `, Secondary ${siteData.designSystemColors.brand.secondary}` : ''}${siteData.designSystemColors.brand.accent ? `, Accent ${siteData.designSystemColors.brand.accent}` : ''}` : ''}
${siteData.designSystemColors.hero && siteData.designSystemColors.hero.length > 0 ? `- Hero Colors: ${siteData.designSystemColors.hero.slice(0, 5).join(', ')}` : ''}
${siteData.designSystemColors.overall && siteData.designSystemColors.overall.length > 0 ? `- Overall Palette: ${siteData.designSystemColors.overall.slice(0, 5).join(', ')}` : ''}
` : ''}

${levelGuidelines.colorExample || ''}

### 6. Section Structure
Build these sections with semantic HTML:

**Header** (sticky navigation):
- Logo/brand (top-left)
- Navigation links (horizontal, top-right)
- Spacing: var(--space-lg) padding

**Hero Section** (full viewport height):
- Large headline (H1) with ${siteData?.h1 || 'compelling message'}
- Subheadline (H2 or p) with supporting text
- Primary CTA button
- Optional: Hero image or background
- Padding: var(--space-3xl) vertical

**Content Sections**:
${siteData?.plannedContent?.sections ?
  `⚠️ CRITICAL: Use the EXACT content from the "PLANNED CONTENT" section above.\nDO NOT generate new headlines or text. Copy the exact sections, headlines, and content provided.\n\n` + siteData.plannedContent.sections.slice(0, 5).map((s: any, i: number) =>
    `Section ${i + 1} - ${s.type.toUpperCase()} (${s.images && s.images.length > 0 ? `${s.images.length} images` : 'no images'})`
  ).join('\n')
  : pageSpec.sections?.slice(0, 5).map((s, i) => `- Section ${i + 1}: ${s.type} - "${s.headline || s.content_hint}"`).join('\n') || '- Features/benefits section\n- Social proof section\n- CTA section'
}

**Footer**:
- Site links (horizontal layout)
- Copyright text
- Spacing: var(--space-xl) padding

### 7. Responsive Design
Mobile-first approach with breakpoints:
\`\`\`css
/* Mobile: Single column, stacked */
@media (max-width: 767px) {
    .col-6, .col-8, .col-4 { grid-column: span 12; }
    .container { padding: var(--space-md); }
}

/* Tablet: 2-column layouts */
@media (min-width: 768px) and (max-width: 1023px) {
    .col-8 { grid-column: span 12; }
    .col-6 { grid-column: span 6; }
}

/* Desktop: Full 12-column grid */
@media (min-width: 1024px) {
    /* Use asymmetric layouts freely */
}
\`\`\`

## Critical Rules
1. ✅ **Semantic HTML**: Use <header>, <nav>, <main>, <section>, <article>, <footer>
2. ✅ **Accessibility**: Alt tags, ARIA labels, keyboard navigation
3. ✅ **NO external files**: All CSS embedded in <style> tag
4. ✅ **NO JavaScript**: Pure HTML+CSS only
5. ✅ **12-column grid**: All layouts must fit within grid system
6. ✅ **8px spacing grid**: All spacing must be multiples of 8px
7. ✅ **Design level consistency**: Follow ${designLevel} philosophy throughout
8. ✅ **Contrast**: WCAG AA minimum (4.5:1 contrast ratio for body text, 3:1 for large text)

## What NOT to Do (Stage 1)
❌ Do NOT add archetype-specific styles yet (Stage 2)
❌ Do NOT break conventions deliberately yet (Stage 3)
❌ Do NOT add experimental effects yet (Stage 3)
❌ Do NOT add animations or transitions yet (Stage 5)
❌ Do NOT add micro-interactions yet (Stage 5)

## Output Format
Return ONLY the complete HTML document with embedded CSS. No markdown fences, no explanations.
Start with <!DOCTYPE html> and end with </html>.

The HTML should be:
- Valid and well-formed
- Semantic and accessible
- Following ${designLevel} design philosophy
- Ready for Stage 2 archetype application
- **Visuell besonders und sauber** (visually special and clean)

Generate the HTML now.`;
}

/**
 * Stage 2: Archetype Application
 * ~1,200 words, ~12K tokens
 * Model: Mimo-v2-flash
 *
 * Focus: Inject archetype-specific CSS techniques and design principles
 */
export function generateStage2Prompt(
  archetype: Archetype,
  stage1Html: string,
  designConfig: DesignConfig
): string {
  const designLevel = designConfig.designLevel || 'standard';
  const levelGuidelines = getDesignLevelGuidelines(designLevel);

  return `# STAGE 2: ARCHETYPE APPLICATION - ${archetype.name}

## Context
You received the foundation HTML from Stage 1. Now inject the **${archetype.name}** archetype to create a ${levelGuidelines.label} design.

**Design Level**: ${levelGuidelines.label}
**Philosophy**: ${levelGuidelines.description}
**Quality Goal**: ${levelGuidelines.qualityBar}

**Your Task**: Take the Stage 1 HTML and ADD archetype-specific CSS and structural modifications.
Do NOT rebuild from scratch - enhance what exists.

## Archetype: ${archetype.name}
**Category**: ${archetype.category}
**Description**: ${archetype.description}
**Level**: ${archetype.level}

### Design Principles
${archetype.designPrinciples.map((principle, i) => `${i + 1}. ${principle}`).join('\n')}

### Detailed Implementation Instructions
${archetype.promptInstructions}

## Stage 1 HTML (Foundation)
\`\`\`html
${stage1Html}
\`\`\`

## Your Implementation Tasks

### 1. Analyze Stage 1 Structure
- Identify key sections: header, hero, content sections, footer
- Locate elements to transform: headlines, images, CTAs, containers
- Preserve semantic HTML structure (do not remove <header>, <main>, etc.)

### 2. Inject Archetype CSS
Add archetype-specific CSS rules to the existing <style> tag:

**DO**:
- Add new CSS classes for archetype effects (e.g., .reality-warp-container, .glitch-text)
- Apply CSS techniques from the list above extensively
- Use CSS custom properties for dynamic values where appropriate
- Transform multiple elements throughout the page (not just one section)

**DON'T**:
- Remove existing foundation CSS (spacing, grid, colors)
- Break responsive design (keep media queries functional)
- Use JavaScript (this is CSS-only)

### 3. Transform Key Elements

**Hero Section Transformation**:
- Apply archetype's signature effect to the hero
- Example: If Reality Warp, add 3D transforms and perspective
- Example: If Liquid Mercury, add blob shapes with extreme border-radius
- Example: If Void Architecture, remove 80% of content, maximize whitespace

**Typography Transformation**:
- Enhance headlines with archetype-specific styles
- Example: If Kinetic Typography, use massive font-size ranges (12px-240px)
- Example: If Typographic Brutalism, use monospace, ASCII art elements
- Example: If Synesthetic Grid, pair typography with unexpected colors

**Layout Modifications**:
- If archetype requires grid changes, modify the grid system
- Example: If Noise-Driven Layouts, add pseudo-random positioning with CSS calc()
- Example: If Gravity-Defying Stacks, invert visual weight (heavy floats, light sinks)
- Maintain 12-column grid as baseline, but push boundaries

**Color Adjustments**:
- Apply archetype-appropriate color palette
- Example: If Glitch Formalism, add RGB channel split with text-shadow
- Example: If Spatial Depth Field, add blur filters (filter: blur()) for depth
- Override Stage 1 colors if archetype demands it (e.g., Brutalist = black/white only)

### 4. Add Structural Elements (If Needed)
Some archetypes may require adding HTML elements:

**Allowed additions**:
- Wrapper divs for complex transforms
- Pseudo-elements via CSS (::before, ::after)
- SVG shapes inline for geometric patterns
- Decorative elements (lines, shapes, overlays)

**Example** (Reality Warp archetype):
\`\`\`html
<!-- Add perspective container -->
<div class="reality-warp-container" style="perspective: 800px;">
    <!-- Existing hero content -->
    <section class="hero" style="transform: rotateX(15deg) rotateY(-5deg);">
        ...
    </section>
</div>
\`\`\`

### 5. Apply Effects Consistently
Don't just transform ONE element - apply archetype throughout entire page:

**Minimum Requirements**:
- Transform hero section (primary focus)
- Enhance at least 3 content sections
- Modify header/navigation styling
- Update footer design
- Apply to typography across ALL headings

**Intensity**: ${levelGuidelines.stage2Intensity || 'MEDIUM-HIGH'} (${designLevel === 'standard' ? 'Professional and clean' : designLevel === 'semi-unleashed' ? 'Creative but controlled' : 'Extreme and experimental'})

## Examples by Archetype Category

### Reality Manipulation (Reality Warp, Quantum Superposition, Dimensional Collapse)
\`\`\`css
/* Add 3D transforms, impossible geometry */
.hero {
    transform-style: preserve-3d;
    perspective: 1000px;
}

.section-card {
    transform: rotateY(25deg) translateZ(50px);
    backface-visibility: hidden;
}

/* Recursive patterns */
.nested-element::before {
    content: '';
    /* Smaller copy of parent */
}
\`\`\`

### Algorithmic Chaos (Fractals, Glitch, Noise)
\`\`\`css
/* Fractal backgrounds */
.section {
    background: repeating-linear-gradient(
        45deg,
        var(--color-primary),
        var(--color-primary) 10px,
        var(--color-secondary) 10px,
        var(--color-secondary) 20px
    );
}

/* Glitch effect */
.glitch-text {
    position: relative;
    text-shadow: 2px 0 red, -2px 0 cyan;
    clip-path: polygon(/* random shape */);
}
\`\`\`

### Kinetic Expression (Typography, Liquid, Gravity)
\`\`\`css
/* Massive type scale */
h1 {
    font-size: clamp(120px, 15vw, 240px);
    font-weight: 900;
}

/* Liquid blob shapes */
.blob {
    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    filter: blur(5px);
}
\`\`\`

### Minimalism Extremes (Void, Mono-Element, Brutalist)
\`\`\`css
/* Extreme whitespace */
.section {
    padding: 20vh 10vw;
    min-height: 100vh;
}

/* Single element focus */
.mono-element {
    /* Everything is circles, or squares, or lines */
}

/* Brutalist typography */
body {
    font-family: 'Courier New', monospace;
    background: white;
    color: black;
}
\`\`\`

### Sensory Expansion (Synesthetic, Crystalline, Depth)
\`\`\`css
/* Unexpected color pairings */
.section-1 { background: lime; color: hotpink; }
.section-2 { background: cyan; color: orangered; }

/* Crystalline facets */
.crystal {
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    box-shadow: inset 0 0 20px rgba(255,255,255,0.5);
}

/* Depth blur */
.background {
    filter: blur(20px);
    opacity: 0.7;
}
\`\`\`

## Critical Rules
1. ✅ **Preserve Stage 1 foundation**: Don't remove grid system, spacing variables, or semantic structure
2. ✅ **Apply archetype extensively**: Transform 70%+ of the page, not just hero
3. ✅ **Use specified CSS techniques**: Reference archetype.cssTechniques list
4. ✅ **Follow design principles**: Reference archetype.designPrinciples list
5. ✅ **Maintain accessibility**: Keep contrast, semantic HTML, alt tags
6. ✅ **NO JavaScript**: CSS and HTML only
7. ✅ **Design level awareness**: ${designLevel} - ${levelGuidelines.stage2Guidance || 'Push boundaries appropriately for this level'}
8. ✅ **Visuell besonders und sauber**: Make it visually special and clean

## What NOT to Do
❌ Do NOT remove Stage 1 spacing/grid system
❌ Do NOT break responsive design completely (keep breakpoints)
❌ Do NOT add animations yet (Stage 5)
❌ Do NOT deliberately break rules yet (Stage 3)
❌ Do NOT add micro-interactions yet (Stage 5)

## Output Format
Return ONLY the complete modified HTML document. No markdown fences, no explanations.
Start with <!DOCTYPE html> and end with </html>.

The output should be Stage 1 HTML + Archetype enhancements.

Generate the enhanced HTML now.`;
}

/**
 * Stage 3: Experimental Push (Break Rules Deliberately)
 * ~1,600 words, ~18K tokens
 * Model: Sonnet 3.5, temp=0.9 (HIGH CREATIVITY)
 *
 * Focus: Push design beyond comfort zone - intensity varies by design level
 */
export function generateStage3Prompt(
  stage2Html: string,
  archetype: Archetype,
  designConfig: DesignConfig
): string {
  const designLevel = designConfig.designLevel || 'standard';
  const levelGuidelines = getDesignLevelGuidelines(designLevel);
  const pushIntensity = levelGuidelines.experimentalPush || '15%';

  return `# STAGE 3: EXPERIMENTAL PUSH - ${levelGuidelines.label}

## Context
You have the archetype-enhanced HTML from Stage 2. Now push it **${pushIntensity} beyond the comfort zone** while maintaining the ${designLevel} philosophy.

**Design Level**: ${levelGuidelines.label}
**Push Strategy**: ${levelGuidelines.pushStrategy}
**Goal**: ${designLevel === 'standard' ? 'Visuell besonders und sauber - visually special and clean, professional but memorable' : designLevel === 'semi-unleashed' ? 'Stimmig aber etwas crazy - coherent but somewhat crazy, creative but controlled' : 'Stimmig aber etwas crazy - coherent but very crazy, maximum experimentation'}

## Your Mission: ${levelGuidelines.stage3Mission || 'Push the design appropriately for this level'}

### Rule-Breaking/Enhancement Strategy

${designLevel === 'standard' ? `
**STANDARD LEVEL - Visual Refinement (NO rule-breaking)**:
Do NOT break conventional rules. Instead, ENHANCE visual appeal:
- Perfect alignment and symmetry
- Add subtle visual interest (gradients, shadows, micro-animations)
- Refine typography hierarchy for maximum clarity
- Ensure impeccable spacing and rhythm
- Add professional polish (hover states, smooth transitions)
- Make it **visuell besonders** (visually special) through refinement, NOT chaos
` : designLevel === 'semi-unleashed' ? `
**SEMI-UNLEASHED LEVEL - Controlled Creativity**:
Select 1-2 rules to bend (NOT break) from this list:
1. **Asymmetry** → Subtle asymmetry that adds interest
2. **Color Play** → Unexpected but harmonious color combinations
3. **Typography Scale** → Slightly unconventional but readable sizes
4. **Layout Variation** → Mixed layouts between sections
5. **Whitespace** → Generous or tight, but purposeful

**Goal**: Stimmig aber etwas crazy (coherent but somewhat crazy)
- Keep it professional and usable
- Add creative flair without breaking usability
- Everything should feel intentional and controlled
` : `
**UNLEASHED LEVEL - Bold Creativity**:
Select 1-2 creative elements to enhance (NOT break completely):
1. **Creative Asymmetry** → Intentional asymmetry that adds visual interest
2. **Bold Alignment** → Offset elements deliberately for dynamic layouts
3. **Unexpected Colors** → Bold color combinations that harmonize unexpectedly
4. **Expressive Typography** → Creative type scales that maintain readability
5. **Dynamic Spacing** → Varied spacing that creates rhythm and energy
6. **Layout Variety** → Mix different layout approaches between sections
7. **Visual Depth** → Strong depth hierarchy with creative layering
8. **Unique Elements** → Add signature creative elements (shapes, patterns)

**CRITICAL - Maintain These**:
- ✅ **Text must be readable** (contrast 4.5:1+ minimum)
- ✅ **Navigation must be clear** (users can find it easily)
- ✅ **CTAs must be obvious** (users know where to click)
- ✅ **Layout must make sense** (coherent flow)
- ✅ **Stimmig** (coherent) is MORE important than "crazy"

**Goal**: Stimmig aber etwas crazy (coherent but creative)
- Always coherent and professional
- Bold creative choices that enhance, not confuse
- Visuell besonders und sauber (visually special and clean)
- Make users say "This is bold and unique... and beautifully done"
`}

## Stage 2 HTML (Enhanced with Archetype)
\`\`\`html
${stage2Html}
\`\`\`

## Your Implementation Tasks

### 1. Analyze & Identify Targets
Which elements will you push to extremes?
- Hero section (primary target)
- At least 2 content sections
- Typography (headlines and body text)
- Layout structure (grid system)
- Color palette

### 2. Apply Experimental Techniques

#### A. Controlled Chaos
Add unexpected, "wrong" but intentional design choices:

**Examples**:
\`\`\`css
/* Break symmetry - different padding on left/right */
.hero {
    padding-left: 10vw;
    padding-right: 35vw; /* Extreme asymmetry */
}

/* Break alignment - offset grid */
.section:nth-child(odd) {
    transform: translateX(-5%);
}

.section:nth-child(even) {
    transform: translateX(8%);
}

/* Break color theory - clashing colors that somehow work */
.section-1 {
    background: #FF1493; /* Deep pink */
    color: #FF4500; /* Orange-red - clashing but bold */
}

/* Break typography hierarchy - make subtext HUGE */
.hero p {
    font-size: 72px; /* Bigger than H1! */
    font-weight: 900;
}

.hero h1 {
    font-size: 24px; /* Tiny headline */
    opacity: 0.6;
}

/* Break consistency - each section different style */
.section-1 { /* Brutalist */ }
.section-2 { /* Glassmorphism */ }
.section-3 { /* Neo-brutalist */ }
\`\`\`

#### B. Unexpected Interactions
Make the design **surprising** but still functional:

**Examples**:
\`\`\`css
/* Upside-down section (but readable) */
.section-experimental {
    transform: rotate(180deg);
}

.section-experimental * {
    transform: rotate(180deg); /* Flip text back */
}

/* Extreme overlaps */
.card {
    position: relative;
    z-index: 1;
}

.card:nth-child(2) {
    margin-top: -200px; /* Overlap previous card */
    z-index: 2;
}

/* Hidden navigation (find-it game) */
nav {
    position: fixed;
    bottom: 0;
    left: 0;
    writing-mode: vertical-rl;
    opacity: 0.3;
    font-size: 10px;
}

nav:hover {
    opacity: 1;
}
\`\`\`

#### C. Sensory Discomfort (Controlled)
Push users slightly outside their comfort zone:

**Examples**:
\`\`\`css
/* Extreme line-height */
p {
    line-height: 2.8; /* Too spacious */
}

h1 {
    line-height: 0.75; /* Too tight */
}

/* Uncomfortable color */
body {
    background: #FFFFE0; /* Light yellow (unexpected for backgrounds) */
}

/* Extreme contrast reduction (but still WCAG compliant) */
.section {
    background: #2a2a2a;
    color: #4a4a4a; /* Low contrast, but technically 4.5:1 */
}

/* Claustrophobic spacing */
.tight-section {
    padding: 8px; /* Minimal breathing room */
}

.tight-section > * {
    margin: 4px 0;
}
\`\`\`

#### D. Archetype Amplification
Take the archetype from Stage 2 and **multiply its intensity by 3x**:

**Reality Manipulation** → More impossible angles:
\`\`\`css
.hero {
    transform: perspective(500px) rotateX(45deg) rotateY(-30deg) rotateZ(15deg);
    transform-style: preserve-3d;
}

.hero-inner {
    transform: translateZ(200px);
}
\`\`\`

**Algorithmic Fractals** → More recursive patterns:
\`\`\`css
.fractal::before {
    content: '';
    position: absolute;
    width: 50%;
    height: 50%;
    background: inherit;
    transform: scale(0.5) rotate(45deg);
}

.fractal::before::before {
    /* Recursive! */
}
\`\`\`

**Liquid Mercury** → More extreme blob shapes:
\`\`\`css
.blob {
    border-radius: 73% 27% 83% 17% / 39% 87% 13% 61%;
    animation: morph 8s infinite;
}

@keyframes morph {
    0%, 100% { border-radius: 73% 27% 83% 17% / 39% 87% 13% 61%; }
    50% { border-radius: 28% 72% 44% 56% / 69% 31% 69% 31%; }
}
\`\`\`

**Void Architecture** → 98% whitespace:
\`\`\`css
.section {
    min-height: 200vh; /* Force extreme scrolling */
    display: flex;
    align-items: center;
    justify-content: center;
}

.section h2 {
    font-size: 18px; /* Tiny in vast space */
}
\`\`\`

**Crystalline Structures** → More sharp angles:
\`\`\`css
.crystal {
    clip-path: polygon(
        50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
        50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
    );
}
\`\`\`

### 3. Add Controlled Imperfections
Perfect designs are boring. Add intentional "mistakes":

**Examples**:
- Slightly misaligned elements (off by 3-7px)
- One element with different font family
- Inconsistent border-radius (some sharp, some round)
- Random rotation angles (1-3 degrees)
- Slightly different spacing between sections

\`\`\`css
/* Intentional misalignment */
.card:nth-child(1) { transform: translateY(-3px) rotate(0.5deg); }
.card:nth-child(2) { transform: translateY(5px) rotate(-1deg); }
.card:nth-child(3) { transform: translateY(-2px) rotate(0.8deg); }

/* Inconsistent shapes */
.button-1 { border-radius: 0; }
.button-2 { border-radius: 50px; }
.button-3 { border-radius: 4px 20px 4px 20px; }
\`\`\`

### 4. Preserve Core Usability
Maintain usability appropriate to design level:
- ✅ Text must be readable
- ✅ CTAs must be clickable
- ✅ Navigation must exist and be discoverable
- ✅ Content must be accessible (semantic HTML preserved)
- ✅ WCAG contrast minimums (4.5:1 for body text)

**Balance**: ${designLevel === 'standard' ? '100% professional, refined excellence' : designLevel === 'semi-unleashed' ? '40% creative flair, 60% professional usability' : '50% bold creativity, 50% professional usability (ALWAYS coherent and usable)'}

## Temperature = 0.9 Instructions
You're running at **high temperature** for creativity. This means:
${designLevel === 'unleashed' ? `- Be bold and creative, but ALWAYS maintain coherence
- Try interesting CSS combinations that enhance visual quality
- Take creative risks that serve the design
- If something reduces usability or clarity, DON'T do it
- Make bold choices that users will love, not struggle with
- "Stimmig" (coherent) is MANDATORY - "crazy" is optional flavor` : `- Be creative and expressive
- Try unexpected but harmonious combinations
- Push boundaries thoughtfully
- Maintain professional quality throughout`}

## Critical Rules for Stage 3
1. ✅ **Follow ${designLevel} strategy**: ${levelGuidelines.stage3Mission}
2. ✅ **${designLevel === 'standard' ? 'Refine and polish' : 'Amplify archetype'}**: ${designLevel === 'standard' ? 'Add visual refinement' : 'Push archetype further'}
3. ✅ **Maintain coherence**: Even experimental designs should feel intentional ("stimmig")
4. ✅ **${designLevel === 'standard' ? 'Maintain professionalism' : 'Push boundaries'}** while preserving usability
5. ✅ **Maintain accessibility** (semantic HTML, contrast minimums)
6. ✅ **NO animations yet** (Stage 5 adds polish)
7. ✅ **Visuell besonders und sauber**: Visually special and clean at all levels

## What NOT to Do
❌ Do NOT break the page completely (users must be able to read/navigate)
❌ Do NOT violate WCAG AA minimums (4.5:1 contrast)
❌ Do NOT use JavaScript
❌ Do NOT add animations/transitions yet (Stage 5)

## Output Format
Return ONLY the complete HTML document with experimental enhancements. No markdown fences, no explanations.
Start with <!DOCTYPE html> and end with </html>.

This should be Stage 2 HTML + ${designLevel === 'standard' ? 'Visual refinement (professional polish)' : designLevel === 'semi-unleashed' ? 'Controlled creativity (coherent but creative)' : 'Experimental push (coherent but crazy)'}.

**Remember**: ${designLevel === 'standard' ? 'Refine, polish, and perfect. Make it visuell besonders through excellence.' : designLevel === 'semi-unleashed' ? 'Be creative but controlled. Stimmig aber etwas crazy.' : 'Be bold and creative while maintaining coherence. Stimmig (coherent) is REQUIRED. Visuell besonders und sauber (visually special and clean) at all times.'}

Generate the ${designLevel === 'standard' ? 'refined' : 'experimental'} HTML now.`;
}

/**
 * Helper functions for design level guidelines
 */
interface DesignLevelGuidelines {
  label: string;
  description: string;
  qualityBar: string;
  foundationRules: string;
  spacingPhilosophy: string;
  colorApproach: string;
  typographyStrategy: string;
  spacingScale?: string;
  typographyExample?: string;
  colorExample?: string;
  stage2Intensity?: string;
  stage2Guidance?: string;
  experimentalPush?: string;
  pushStrategy?: string;
  stage3Mission?: string;
}

function getDesignLevelGuidelines(level: 'standard' | 'semi-unleashed' | 'unleashed'): DesignLevelGuidelines {
  const guidelines: Record<string, DesignLevelGuidelines> = {
    standard: {
      label: 'Standard (Professional)',
      description: 'Ordentlich & Strukturiert - Clean, professional, and visually special',
      qualityBar: 'Visuell besonders und sauber (visually special and clean) - professional quality with memorable design',
      foundationRules: `Professional designs with exceptional visual quality:
- Pixel-perfect spacing and alignment
- Refined typography with clear hierarchy
- Harmonious color palettes with purpose
- Clean, uncluttered layouts that breathe
- Subtle visual interest through refinement
- Every detail should be intentional and polished`,
      spacingPhilosophy: 'Generous, balanced spacing that enhances readability and visual comfort',
      colorApproach: 'Harmonious, purposeful color usage - professional but not boring',
      typographyStrategy: 'Clear hierarchy with refined type scale - readable and elegant',
      stage2Intensity: 'MEDIUM',
      stage2Guidance: 'Apply archetype professionally - clear expression without excess',
      experimentalPush: '15%',
      pushStrategy: 'Refine and polish - add visual interest through excellence, NOT chaos',
      stage3Mission: 'Add professional polish and refinement (NO rule-breaking)',
    },
    'semi-unleashed': {
      label: 'Semi-Unleashed (Creative)',
      description: 'Kreativ & Ausgewogen - Creative but controlled experimentation',
      qualityBar: 'Stimmig aber etwas crazy (coherent but somewhat crazy) - creative expression within bounds',
      foundationRules: `Creative designs that push boundaries while maintaining coherence:
- Intentional asymmetry and dynamic layouts
- Bold but harmonious color choices
- Expressive typography that remains readable
- Surprising elements that enhance rather than distract
- Controlled experimentation with purpose
- Everything should feel coherent despite creative flair`,
      spacingPhilosophy: 'Dynamic spacing that creates energy while maintaining rhythm',
      colorApproach: 'Bold, unexpected combinations that work together harmoniously',
      typographyStrategy: 'Expressive typography with creative scale variations',
      stage2Intensity: 'MEDIUM-HIGH',
      stage2Guidance: 'Push archetype creatively while maintaining usability and coherence',
      experimentalPush: '25%',
      pushStrategy: 'Creative controlled chaos - bend rules thoughtfully, maintain coherence',
      stage3Mission: 'Bend 1-2 rules creatively but keep design coherent and usable',
    },
    unleashed: {
      label: 'Unleashed (Experimental)',
      description: 'Kreativ & Einzigartig - Chaotic creativity with controlled boundaries',
      qualityBar: 'Chaotisch aber genial (chaotic but brilliant) - break rules deliberately, create unique designs',
      foundationRules: `Ultra-experimental designs that deliberately break conventions:
- Asymmetry and unconventional layouts encouraged
- Unexpected, bold color combinations that clash beautifully
- Experimental typography that challenges hierarchy
- Chaotic elements that create visual interest
- Break the rules to stand out - uniqueness over convention
- Should make users think "This is crazy... but I love it!"

**TECHNICAL SAFEGUARDS** (Prevent layout bugs):
- ALL containers MUST have overflow-x: hidden to prevent horizontal scroll
- ALL sections MUST have max-width: 100vw to stay in viewport
- Text MUST always be inside containers with defined bounds
- Use contain: paint on sections to prevent element bleeding
- Ensure minimum 4.5:1 contrast for readability (even with chaos)`,
      spacingPhilosophy: 'Chaotic, varied spacing - tight in some areas, generous in others for contrast',
      colorApproach: 'Bold, clashing colors that work unexpectedly well together',
      typographyStrategy: 'Break hierarchy deliberately - make subtext huge, headlines tiny if it serves the design',
      stage2Intensity: 'HIGH',
      stage2Guidance: 'Apply archetype with maximum intensity - push boundaries aggressively',
      experimentalPush: '40%',
      pushStrategy: 'Break 2-3 conventional rules deliberately - extreme experimentation encouraged',
      stage3Mission: 'Break rules deliberately to create chaotic but brilliant designs (with technical safeguards)',
    },
  };

  return guidelines[level] || guidelines['standard'];
}

/**
 * Generate variation hints based on seed number (1-5)
 */
function getVariationHints(seed: number): string {
  const hints = [
    'Variation 1: Focus on horizontal layouts with wide sections',
    'Variation 2: Emphasize vertical stacking with tall sections',
    'Variation 3: Use asymmetric grid layouts (8+4, 7+5 columns)',
    'Variation 4: Feature card-based layouts with clear separations',
    'Variation 5: Experiment with full-bleed sections and overlapping content',
  ];

  return `\n**Layout Variation Hint**: ${hints[seed - 1] || hints[0]}
This ensures each variant explores different layout approaches while maintaining quality.\n`;
}

/**
 * Stage 4: Self-Critique
 * ~600 words, ~7K tokens
 * Model: Mimo-v2-flash
 *
 * Focus: Evaluate design quality, generate JSON critique with scores
 */
export function generateStage4Prompt(
  stage3Html: string,
  archetype: Archetype
): string {
  return `# STAGE 4: SELF-CRITIQUE - Quality Analysis

## Context
You have the experimental design from Stage 3. Now analyze it critically and provide structured feedback.

## Your Task: Evaluate the Design

Analyze the HTML design across these dimensions:

### 1. Visual Hierarchy (0-100)
- Are focal points clear?
- Do heading sizes guide the eye effectively?
- Is the most important content visually prominent?

### 2. Spacing & Rhythm (0-100)
- Is spacing consistent (8px grid)?
- Does whitespace enhance readability?
- Is vertical rhythm maintained?

### 3. Color Harmony (0-100)
- Do colors work together (even if unconventional)?
- Is contrast sufficient (WCAG AA minimum)?
- Are colors used purposefully?

### 4. Typography (0-100)
- Are font sizes readable?
- Is line-height comfortable?
- Does type hierarchy make sense (even if unconventional)?

### 5. Archetype Fidelity (0-100)
- Does design clearly express the **${archetype.name}** archetype?
- Are CSS techniques applied extensively?
- Is the archetype pushed to extremes?

### 6. Uniqueness & Experimental Edge (0-100)
- Does this design feel unique/memorable?
- Are rules broken in interesting ways?
- Would this stand out in a portfolio?

## Stage 3 HTML to Critique
\`\`\`html
${stage3Html}
\`\`\`

## Output Format: JSON + HTML

Return a response in this EXACT format:

\`\`\`critique
{
  "overall_score": 75,
  "scores": {
    "visual_hierarchy": 80,
    "spacing_rhythm": 70,
    "color_harmony": 75,
    "typography": 80,
    "archetype_fidelity": 85,
    "uniqueness": 90
  },
  "strengths": [
    "Extreme archetype expression - clearly ${archetype.name}",
    "Bold experimental choices that pay off",
    "Strong visual impact and memorability"
  ],
  "weaknesses": [
    "Line-height too tight in hero section (readability issue)",
    "Color contrast in section 3 below WCAG AA (4.2:1, need 4.5:1)",
    "Navigation too hidden - usability concern"
  ],
  "improvements": [
    "Increase hero p line-height from 0.8 to 1.2",
    "Darken section 3 text color from #4a4a4a to #3a3a3a (boost contrast)",
    "Make nav slightly more visible - increase opacity from 0.3 to 0.5"
  ]
}
\`\`\`

**CRITICAL**: After the JSON block, return the COMPLETE HTML AGAIN (unchanged from Stage 3).

Example output structure:
\`\`\`critique
{ ... JSON critique ... }
\`\`\`

<!DOCTYPE html>
<html>
... complete HTML from Stage 3 ...
</html>

## Scoring Guidelines

**80-100**: Excellent - Ready to publish, minor tweaks only
**60-79**: Good - Solid design, some improvements needed
**40-59**: Needs Work - Significant issues to address
**0-39**: Poor - Major redesign required

**Note**:
- STANDARD designs should aim for 75-90 scores (professional quality)
- SEMI-UNLEASHED designs should score 70-85 (creative but polished)
- UNLEASHED designs should score 70-85 (bold and creative but still professional)
- All levels MUST maintain "visuell besonders und sauber" quality

## Critical Rules
1. ✅ Be honest and critical - find real issues
2. ✅ Provide specific, actionable improvements
3. ✅ Use exact CSS values in improvement suggestions
4. ✅ Identify accessibility issues (contrast, readability)
5. ✅ Return JSON in \`\`\`critique block
6. ✅ Return complete HTML after JSON
7. ✅ Do NOT modify HTML in this stage (just analyze it)

Generate the critique + HTML now.`;
}

/**
 * Stage 5: Extreme Polish
 * ~1,400 words, ~15K tokens
 * Model: Sonnet 3.5
 *
 * Focus: Refine based on critique while preserving uniqueness, add final flourishes
 */
export function generateStage5Prompt(
  stage4Html: string,
  critique: any,
  archetype: Archetype,
  designLevel: string = 'standard'
): string {
  return `# STAGE 5: EXTREME POLISH - Final Refinements

## Context
You have the critiqued HTML from Stage 4. Now apply final polish to create a production-ready ultra-extreme design.

## Critique Results
**Overall Score**: ${critique.overall_score}/100

**Strengths**:
${critique.strengths?.map((s: string) => `- ${s}`).join('\n') || '- (None provided)'}

**Weaknesses**:
${critique.weaknesses?.map((w: string) => `- ${w}`).join('\n') || '- (None provided)'}

**Improvements Needed**:
${critique.improvements?.map((i: string) => `- ${i}`).join('\n') || '- (None provided)'}

## Your Mission: Polish to Perfection

### 1. Address ALL Weaknesses
Go through each weakness and fix it:

**Example Fixes**:
- If critique says "Line-height too tight" → Adjust to comfortable range
- If critique says "Contrast too low" → Darken/lighten text colors
- If critique says "Navigation too hidden" → Increase visibility slightly
- If critique says "Section too cluttered" → Add spacing

**DO**:
- Fix every issue mentioned in critique.weaknesses
- Apply every suggestion from critique.improvements
- Use exact CSS values suggested when provided

**DON'T**:
- Remove experimental elements (keep the chaos)
- Tone down the archetype (preserve intensity)
- Make it "safe" or conventional

### 2. Add Final Flourishes

Now add the polish that makes good designs GREAT:

#### A. Smooth Animations & Transitions
Add subtle animations to enhance the experience:

\`\`\`css
/* Smooth property transitions */
* {
    transition: opacity 0.3s ease, transform 0.3s ease, color 0.2s ease;
}

/* Hover effects on interactive elements */
button, a {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

/* Scroll-triggered animations (CSS only) */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.section {
    animation: fadeInUp 0.8s ease-out;
}

/* Archetype-specific animations */
${archetype.category === 'reality-manipulation' ? `
.reality-warp-element {
    animation: warp 4s infinite alternate;
}

@keyframes warp {
    0% { transform: perspective(800px) rotateY(0deg); }
    100% { transform: perspective(800px) rotateY(10deg); }
}
` : ''}

${archetype.category === 'algorithmic-chaos' ? `
.glitch-text {
    animation: glitch 3s infinite;
}

@keyframes glitch {
    0%, 100% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(2px, -2px); }
    60% { transform: translate(-1px, -1px); }
    80% { transform: translate(1px, 1px); }
}
` : ''}

${archetype.category === 'kinetic-expression' ? `
.liquid-blob {
    animation: morph 8s infinite;
}

@keyframes morph {
    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
` : ''}
\`\`\`

#### B. Micro-Interactions
Add delightful details that reward user attention:

\`\`\`css
/* Focus states (accessibility + polish) */
a:focus, button:focus {
    outline: 3px solid var(--color-accent);
    outline-offset: 4px;
}

/* Active states */
button:active {
    transform: scale(0.98);
}

/* Link hover effects */
a {
    position: relative;
}

a::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: currentColor;
    transition: width 0.3s ease;
}

a:hover::after {
    width: 100%;
}

/* Card hover effects */
.card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}
\`\`\`

#### C. Visual Refinements
Add final touches to elevate quality:

**Shadows & Depth**:
\`\`\`css
/* Natural shadow system */
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.shadow-md { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.shadow-lg { box-shadow: 0 10px 15px rgba(0,0,0,0.15); }
.shadow-xl { box-shadow: 0 20px 25px rgba(0,0,0,0.2); }

/* Apply to elevated elements */
header { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.card { box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
\`\`\`

**Texture & Grain** (optional, for added depth):
\`\`\`css
/* Subtle noise texture */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.03;
    z-index: 10000;
    pointer-events: none;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><filter id="noise"><feTurbulence baseFrequency="0.65" /></filter><rect width="300" height="300" filter="url(%23noise)" opacity="0.5"/></svg>');
}
\`\`\`

**CSS Filters & Blend Modes**:
\`\`\`css
/* Subtle backdrop filters */
.glass-card {
    backdrop-filter: blur(10px) saturate(180%);
    background: rgba(255, 255, 255, 0.1);
}

/* Blend modes for overlays */
.overlay {
    mix-blend-mode: multiply; /* or overlay, screen, difference */
}
\`\`\`

#### D. Performance Optimizations
Ensure smooth rendering:

\`\`\`css
/* GPU acceleration for animations */
.animated-element {
    will-change: transform;
    transform: translateZ(0); /* Force GPU */
}

/* Smooth scrolling */
html {
    scroll-behavior: smooth;
}

/* Optimize font rendering */
body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
}
\`\`\`

### 3. Final Quality Checks

Before finalizing, verify:

**Accessibility**:
- ✅ All text has 4.5:1 contrast minimum (WCAG AA)
- ✅ Focus states visible on all interactive elements
- ✅ Semantic HTML preserved (<header>, <main>, <nav>, etc.)
- ✅ Alt text present on images (or decorative images have alt="")

**Responsive Design**:
- ✅ Mobile breakpoint (<768px) works
- ✅ Tablet breakpoint (768-1023px) works
- ✅ Desktop (1024px+) works
- ✅ No horizontal scrolling on mobile

**Cross-Browser Compatibility**:
- ✅ Use vendor prefixes where needed (-webkit-, -moz-)
- ✅ Fallbacks for advanced CSS (e.g., backdrop-filter with solid background)
- ✅ Avoid experimental CSS without fallbacks

**Polish Checklist**:
- ✅ All critique weaknesses addressed
- ✅ Smooth transitions on interactive elements
- ✅ Hover states on all clickable elements
- ✅ Focus states visible
- ✅ Consistent spacing throughout
- ✅ No typos or placeholder text
- ✅ Archetype intensity preserved
- ✅ Experimental elements intact

### 4. Preserve Creative Character While Ensuring Quality

**CRITICAL**: Maintain creative elements BUT prioritize usability and visual quality.

**DO** (Priority Order):
1. ✅ Fix ALL readability issues (contrast, font sizes)
2. ✅ Fix ALL navigation issues (must be findable and obvious)
3. ✅ Fix ALL usability issues (CTAs clear, layout sensible)
4. ✅ Add polish (animations, micro-interactions)
5. ✅ Improve accessibility
6. ✅ Refine spacing and rhythm
7. ✅ Keep creative elements that enhance the design

**DON'T**:
- Remove creative asymmetry (if it works well)
- Remove bold colors (if they harmonize)
- Remove expressive typography (if it's readable)
- Make it boring or generic
- BUT: Always prioritize "stimmig" (coherent) and usable

**Balance**: ${designLevel === 'unleashed' ? 'Coherence and usability FIRST, creativity second. "Stimmig aber etwas crazy" means 80% coherent, 20% creative flair.' : 'Fix issues while maintaining creative character.'}

## Stage 4 HTML to Polish
\`\`\`html
${stage4Html}
\`\`\`

## Critical Rules
1. ✅ **Address ALL weaknesses** from critique
2. ✅ **Apply ALL improvements** suggested
3. ✅ **Add animations & transitions** for polish
4. ✅ **Add micro-interactions** (hover, focus, active states)
5. ✅ **Verify accessibility** (contrast, focus states, semantic HTML)
6. ✅ **Preserve experimental elements** (don't tone down)
7. ✅ **Production-ready quality** (no placeholder text, no broken layouts)

## What NOT to Do
❌ Do NOT remove ${designLevel === 'standard' ? 'professional polish' : 'experimental/creative elements'}
❌ Do NOT make design ${designLevel === 'standard' ? 'boring or generic' : 'conventional or safe'}
❌ Do NOT reduce archetype ${designLevel === 'standard' ? 'character' : 'intensity'}
❌ Do NOT use JavaScript
❌ Do NOT compromise on "visuell besonders und sauber" quality

## Output Format
Return ONLY the complete polished HTML document. No markdown fences, no explanations.
Start with <!DOCTYPE html> and end with </html>.

This is the FINAL output - make it production-ready and spectacular.

Generate the polished HTML now.`;
}

/**
 * Extract critique JSON from Stage 4 response
 */
export function extractCritiqueFromResponse(response: string): any {
  try {
    // Find JSON between ```critique and ```
    const critiqueMatch = response.match(/```critique\s*([\s\S]*?)\s*```/);
    if (critiqueMatch && critiqueMatch[1]) {
      return JSON.parse(critiqueMatch[1]);
    }

    // Fallback: Try to find JSON object
    const jsonMatch = response.match(/\{[\s\S]*"overall_score"[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback critique if parsing fails
    return {
      overall_score: 70,
      strengths: ['Design generated successfully'],
      weaknesses: ['Critique parsing failed - manual review recommended'],
      improvements: ['Review design manually for quality assurance'],
    };
  } catch (error) {
    console.error('Failed to extract critique:', error);
    return {
      overall_score: 70,
      strengths: ['Design generated successfully'],
      weaknesses: ['Critique parsing failed'],
      improvements: ['Manual review recommended'],
    };
  }
}

/**
 * Extract HTML from Stage 4 response (after critique JSON)
 */
export function extractHtmlFromResponse(response: string): string {
  // Remove critique JSON block
  const withoutCritique = response.replace(/```critique\s*[\s\S]*?```\s*/g, '');

  // Find HTML document
  const htmlMatch = withoutCritique.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  if (htmlMatch) {
    return htmlMatch[0];
  }

  // If no HTML found, return response as-is (might be the HTML itself)
  return response.trim();
}
