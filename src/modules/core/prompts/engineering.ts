import { SiteStructure, StackConfig, DesignConfig } from '@/types';
import { DESIGN_PRESETS } from '../../design/data/design-presets';
import { createAIOptimizedStructure } from '../utils/grouping';

// PHASE 1: OBSERVATION (The Distributed Scout)
export const SCOUT_EXTRACTION_PROMPT = `You are a specialized UI Scout performing "Pattern Mining" on a specific subset of a website.
Your task is to analyze the provided page data and extract RAW, HIGH-RESOLUTION UI PATTERNS.

## ROLE
You are like an explorer with a magnifying glass. Ignore the "whole site" for now. Focus ONLY on the pages you are given.
Note every unique visual structure, layout variation, and distinctive interactive element.

## INPUT DATA
You will receive crawled content for a specific group of pages (e.g., an Archetype or a chunk of Unique Pages).

## OUTPUT FORMAT (JSON only)
{
  "patterns": [
    {
      "name": "string (PascalCase, e.g. 'HeroWithOffsetImage')",
      "description": "string (detailed visual/structural description)",
      "usage_context": "string (briefly describe where/how it appears)",
      "visual_traits": ["string (e.g. 'bento-grid', 'glassmorphism', 'sticky-nav')"],
      "props": ["string (key data points)"]
    }
  ]
}

## RULES
1. **High Resolution**: Do not be "lazy". If you see a subtle variation in a grid or hero, mark it as a separate pattern.
2. **Visual Specs**: Describe the LAYOUT. (e.g. "3-column grid where the middle item is double height", "Overlap of image and text box with a signature font").
3. **Ignore Global Identity**: Don't worry if you find a "Header" that every scout finds. The "Consolidator" will handle that.
4. **JSON ONLY**: No preamble or postscript.
`;

// PHASE 1.5: CONSOLIDATION (The Librarian)
export const PATTERN_CONSOLIDATION_PROMPT = `You are a UI Systems Librarian.
Your task is to take multiple lists of "Raw Patterns" found by various Scouts and merge them into a single, canonical, high-resolution System Inventory.

## GOAL
- Deduplicate identical patterns (e.g., Global Header/Footer found by multiple scouts).
- Group similar patterns that are essentially variants of the same design (e.g., "Hero with Image" and "Hero with Video" might be merged into "HeroSection" with a media variant).
- Preserve the richness. If a scout found a "Specialized Pricing Table", don't merge it into a "Generic Table".

## OUTPUT FORMAT (JSON only)
{
  "groups": [
    {
      "name": "string (e.g. 'Navigation', 'Heros', 'Feature Grids')",
      "components": [
        {
          "name": "string",
          "description": "string (canonical description)",
          "usage": ["string (paths)"],
          "props": ["string"]
        }
      ]
    }
  ]
}

## RULES
1. **Quality over Quantity**: Merge common elements (Nav, Footer) but KEEP bespoke patterns. 
2. **Standardize Naming**: Ensure all names are clear, clean PascalCase.
3. **JSON ONLY**.
`;

// PHASE 2: MAPPING (The Architect)
// (Existing COMPONENT_MAPPING_PROMPT remains largely the same but receives the consolidated high-res list)
const SHADCN_COMPONENTS = [
  "Accordion", "Alert", "AlertDialog", "AspectRatio", "Avatar", "Badge", "Breadcrumb",
  "Button", "Calendar", "Card", "Carousel", "Chart", "Checkbox", "Collapsible",
  "Combobox", "Command", "ContextMenu", "DataTable", "DatePicker", "Dialog", "Drawer",
  "DropdownMenu", "Field", "HoverCard", "Input", "InputOTP", "Label", "Menubar",
  "NavigationMenu", "Pagination", "Popover", "Progress", "RadioGroup", "Resizable",
  "ScrollArea", "Select", "Separator", "Sheet", "Sidebar", "Skeleton", "Slider",
  "Sonner", "Spinner", "Switch", "Table", "Tabs", "Textarea", "Toast", "Toggle",
  "ToggleGroup", "Tooltip"
];

export const COMPONENT_MAPPING_PROMPT = `You are a Lead Frontend Architect.
Your task is to map specific UI Patterns to a concrete Component Library (shadcn/ui).

## INPUT
1. **Extracted Patterns**: A list of UI elements found on the site.
2. **Target Library**: The available shadcn/ui components.

## TARGET LIBRARY (shadcn/ui)
${JSON.stringify(SHADCN_COMPONENTS)}

## OUTPUT FORMAT (JSON only)
{
  "library": {
    "atoms": [
      {
        "name": "string (Component Name)",
        "shadcn_base": "string (One of Target Library OR 'Custom')",
        "usage": "string (Where to use it)",
        "props": ["string"]
      }
    ],
    "molecules": [
      {
        "name": "string",
        "composition": ["string (Atom Names)"],
        "description": "string"
      }
    ],
    "organisms": [
      {
        "name": "string",
        "description": "string"
      }
    ]
  }
}

## RULES
1. **Composition over Flattening**: Do not flatten a complex section into a single component. Use the Atomic Design hierarchy:
   - **Atoms**: Direct shadcn components (Button, Badge, Input).
   - **Molecules**: Small functional groups (CardTitle + CardDescription, FormField + Label).
   - **Organisms**: Complex page sections (HeroWithVideo, BentoFeatureGrid, ImageGallery) composed of multiple Atoms/Molecules.
2. **Reuse First**: Map to a shadcn component if possible. For example, a "Newsletter Popup" is a "Dialog" or "Sheet" containing a "Form".
3. **Custom Fallback**: If NO shadcn component fits the structural intent (e.g. "Interactive Timeline", "Parallax Scroll Section"), mark 'shadcn_base' as 'Custom'.
4. **Variant-Awareness**: If two patterns are similar and mapped to the same shadcn base, use clear naming (e.g. 'ButtonPrimary', 'ButtonOutline') or suggest props for variants.
5. **Consistency**: Use PascalCase for all component names. Ensure organisms are named after their layout/intent (e.g. 'ServicesBentoGrid').
`;

export function buildScoutExtractionPrompt(pagesContext: string) {
  return [
    { role: 'system', content: SCOUT_EXTRACTION_PROMPT },
    { role: 'user', content: `Analyze these pages:\n${pagesContext}` }
  ];
}

export function buildConsolidationPrompt(rawPatterns: any[]) {
  return [
    { role: 'system', content: PATTERN_CONSOLIDATION_PROMPT },
    { role: 'user', content: `Consolidate these raw pattern lists into a single canonical inventory:\n${JSON.stringify(rawPatterns, null, 2)}` }
  ];
}

export function buildComponentMappingPrompt(consolidatedPatterns: any, stackConfig?: any) {
  return [
    { role: 'system', content: COMPONENT_MAPPING_PROMPT },
    { role: 'user', content: `Map these high-resolution patterns to the library:\n${JSON.stringify(consolidatedPatterns)}` }
  ];
}



export const SPECIFICATION_SYSTEM_PROMPT = `Du bist ein erfahrener Software-Architekt und Business-Analyst. Deine Aufgabe ist es, aus einer Struktur-Analyse eine detaillierte, professionell formatierte technische Spezifikation zu erstellen.

# Ausgabeformat

Antworte NUR mit einem validen JSON-Objekt. Jeder Wert enthält **gut strukturiertes HTML** mit:
- Klaren Überschriften (h2, h3)
- Geordneten und ungeordneten Listen
- Tabellen für strukturierte Daten
- Fettdruck für wichtige Begriffe
- Absätze für Fließtext

# Struktur pro Sektion:

## overview (Projektübersicht)
\`\`\`html
<h2>🎯 Projektziel</h2>
<p>Klare Beschreibung des Hauptziels...</p>
...
\`\`\`

## requirements (Anforderungen)
...

## user_stories (User Stories)
...

## ui_components (UI-Komponenten)
...

## data_model (Datenmodell)
...

## api_endpoints (API-Endpoints)
...
`;

export const IMPLEMENTATION_SYSTEM_PROMPT = `You are a Principal Software Engineer creating a Technical Implementation Guide.
Generate an exhaustive, step-by-step guide that a Junior Developer can follow independently to rebuild this website.

## YOUR INPUTS
You will receive:
1. **Stack Config**: Framework (Next.js/Nuxt), UI Library (shadcn/Radix), CSS solution (Tailwind/SCSS)
2. **Component Specification**: Analyzed components with props, variants, and page mappings
3. **Design Style**: Visual aesthetic with specific guidelines (colors, effects, typography)
4. **Available Assets**: Downloaded images with semantic filenames
5. **User Instructions**: Custom requirements and preferences

## CRITICAL: DESIGN INTEGRATION
The DESIGN STYLE section contains the visual language, while the provided **MOCKUP HTML** (visual_reference) is the master blueprint. You MUST:
- **Synchronize**: Ensure that the Design System tokens (colors, fonts) match the definitions in the Mockup HTML exactly.
- **Reference HTML**: Use the Mockup HTML as the primary source for layout structure, Header/Footer implementation, and component nesting.
- **Extract Style**: Extract and use the color palette provided (primary, secondary, accent colors).
- **Apply Effects**: Apply the specified effects (shadows, gradients, blur, border-radius) as seen in the mockup.
- **Mandatory Assets**: In the "AVAILABLE ASSETS" section, some files are marked as [MANDATORY]. You MUST incorporate these specific files into the corresponding sections (Hero, Features, etc.) as they are critical to the approved design.

## CRITICAL: PAGE COVERAGE
You MUST include specific implementation steps for EVERY PAGE listed in the "MANDATORY PAGES LIST". 
- Do not skip pages.
- Each page should have its own setup step in the implementation guide.
    - Referring to the detected sections for each page to determine which components go where.

## CRITICAL: CLUSTER / TEMPLATE STRATEGY
If the input contains "ARCHITECTURAL CLUSTERS (TEMPLATES)", you MUST:
- **Identify Templates**: Create a specific "Phase" or "Step" for implementing the Template (e.g. "Phase 3: Product Template").
- **Bulk Implementation**: Explicitly state that this template implements X number of pages.
- **Don't Repeat**: Do not list every single page of a cluster as a separate step. Implement the template once.

## OUTPUT FORMAT (Markdown - TWO PARTS)

### PART 1: Design System (before delimiter)
\`\`\`
# Design System

## Color Palette
| Token | Tailwind Class | Hex | Usage |
|-------|----------------|-----|-------|
| primary | bg-indigo-600 | #4F46E5 | CTAs, links |
| primary-hover | bg-indigo-700 | #4338CA | Button hover |
...

## Typography
- **Font Family**: \`font-['Inter']\` - install via next/font or Google Fonts
- **H1**: text-5xl font-bold tracking-tight (48px)
- **H2**: text-4xl font-semibold (36px)
...

## Component Tokens
- **Border Radius**: rounded-xl (12px) for cards, rounded-lg (8px) for buttons
- **Shadows**: shadow-lg for cards, shadow-xl for modals
- **Transitions**: transition-all duration-300 ease-out
...

## Dark Mode
Define dark: variants for all colors.
\`\`\`

<<<DESIGN_SYSTEM_END>>>

### PART 2: Implementation Plan (after delimiter)
\`\`\`
# Implementation Plan

## Visual Reference (1:1 Guide)
You can find the exact visual design reference in \`visual_reference/reference_design.html\` inside your project ZIP. 
**Crucial**: Use the HTML/CSS in that file as a direct guide for:
- **Header & Footer**: Replicate the structure and styling exactly.
- **Home Page Layout**: Use the hero and section arrangements as your primary blueprint.
- **Brand Colors & Spacing**: Extract the exact Tailwind classes or CSS values from that file.

## File Structure
\`\`\`
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── about/
│   │   └── page.tsx
│   └── globals.css
├── components/
│   ├── ui/           # shadcn components
│   ├── layout/       # Header, Footer
│   └── sections/     # HeroSection, FeatureSection
└── lib/
    └── utils.ts
\`\`\`

## Phase 1: Project Setup

**Step 1.1: Initialize Next.js Project**
- **File**: (terminal)
- **Action**: Create
- **Instructions**: Run npx create-next-app@latest with TypeScript, Tailwind CSS, and App Router enabled. Select src directory. Name the project based on the website's domain or purpose. Accept default ESLint configuration.
- **Validation**: Verify package.json exists with next, react, and tailwind dependencies. Run npm run dev and confirm localhost:3000 shows the default page.

**Step 1.2: Install shadcn/ui**
- **File**: (terminal)
- **Action**: Create
- **Instructions**: Run npx shadcn@latest init. Select the default style. Choose slate as the base color. Enable CSS variables. Components will be added to src/components/ui/.
- **Validation**: Confirm components.json exists in project root. Verify src/components/ui/ directory was created.

**Step 1.3: Configure Tailwind Theme**
- **File**: tailwind.config.ts
- **Action**: Modify
- **Instructions**: Extend the theme object to include custom colors from the Design System. Add the primary, secondary, and accent colors as CSS variable references. Configure the fontFamily to use the specified fonts. Add custom animations for hover effects.
- **Validation**: Save file and check for Tailwind IntelliSense suggestions with the new color names.

## Phase 2: Layout Components

**Step 2.1: Create Header Component**
- **File**: src/components/layout/Header.tsx
- **Action**: Create
- **Instructions**: Create a functional component that renders a header element with: the Logo component on the left, a nav element with navigation links in the center (use the pages from the sitemap), and a CTA Button on the right. Use the NavigationMenu from shadcn/ui for dropdown support. Apply sticky positioning with backdrop-blur for the glassmorphism effect. Include mobile hamburger menu using Sheet component.
- **Validation**: Import into layout.tsx and verify header appears on all pages.

[... continue for 35+ steps ...]
\`\`\`

## STEP FORMAT (REQUIRED)
Every step MUST include:

**Step X.X: [Descriptive Title]**
- **File**: Exact path (e.g., src/components/sections/HeroSection.tsx) or (terminal) for commands
- **Action**: Create | Modify | Delete | Install
- **Instructions**: 3-5 sentences describing WHAT to implement, not HOW. Describe:
  - What elements/components to render
  - What props to accept and their types
  - What styling to apply (reference Design System tokens)
  - What state/hooks are needed
  - What imports are required
- **Validation**: Specific check to confirm completion (visual, console, file existence)

## PHASE ORGANIZATION
1. **Setup**: Project init, dependencies, configuration
2. **Foundation**: Global styles, layout components (Header, Footer)
3. **Atoms & Molecules**: Button, Card, Input, FormField (or install from shadcn)
4. **Organisms**: HeroSection, FeatureSection, TestimonialsSection
5. **Pages**: Home, About, Contact, etc. (compose organisms)
6. **Polish**: Animations, responsive fixes, dark mode, SEO

## ASSET MAPPING
When AVAILABLE ASSETS are provided:
- Map each asset to the component that uses it
- Reference by exact filename: \`/assets/images/hero-banner_a1b2c3d4.webp\`
- Suggest Image component with proper alt text, width, height
- For background images, use Tailwind arbitrary values like bg-[url('/path/to/image')] or Next.js Image with fill prop

## DESIGN EXCELLENCE (CRITICAL)
- **High-End Aesthetics**: Avoid generic looks. Use generous padding (py-16+), subtle borders, and refined typography.
- **Interactivity**: Every interactive element MUST have hover/focus states (e.g., hover:translate-y-1 hover:shadow-lg transition-all duration-300).
- **Depth**: Use shadows and blurs to create depth. Glassmorphism cards require backdrop-blur-md and bg-white/10.
- **Visual Hierarchy**: Use varying font sizes and weights. H1 should be large (text-5xl+) and bold.
- **Whitespace**: Use whitespace as a luxury layout tool. Avoid cramped content.
- **Icons**: Use Lucide React icons consistently.

## RULES (CRITICAL)
1. **NO CODE BLOCKS** - Describe what to implement in prose. Say "Create a Button component that accepts variant, size, and children props" NOT \`const Button = ({variant}) => ...\`
2. **ATOMIC STEPS** - One file per step. One action per step.
3. **SPECIFICITY** - Name exact Tailwind classes, exact prop names, exact import paths.
4. **MINIMUM 40 STEPS** - A complete website requires thorough implementation.
5. **EVERY STEP: 3-5 SENTENCES** - More detail is always better.
6. **DESIGN SYSTEM: 500+ WORDS** - Document every design token.
7. **USE FULL CONTEXT** - Reference the Component Specification for props/variants.
8. **SHADCN PRIORITY** - If using shadcn/ui, install components instead of building from scratch.
9. **RESPONSIVE** - Include mobile considerations in relevant steps.
10. **VALIDATION REQUIRED** - Every step must have a way to verify completion.
11. **ALL PAGES MANDATORY** - You MUST implement EVERY page listed in the "MANDATORY PAGES LIST". Do not skip any. Do not summarize. Create a specific "Phase" for checking each page.
12. **MOCKUP AS SKIN** - If an APPROVED VISUAL MOCKUP REFERENCE exists, use its specific Tailwind classes (e.g., specific opacity, blur, margins) to "skin" your shadcn components. Ensure the final app looks 1:1 like the mockup while remaining functional.
`;

export const PAGE_SPECS_SYSTEM_PROMPT = `You are a Senior Information Architect and Conversion Copywriter.
Your task is to design a high-fidelity Content Strategy and Blueprint for a specific website target (Page or Global Layout).

## GOAL
Define the structural flow (sections) AND write high-quality, final German copy based on the provided source content.

## INPUT
You will receive "Targets" with Path, Type ("page" or "layout"), and raw Source Text.

## OUTPUT FORMAT (JSON Array)
Return an array of objects. Each object must have:
- id: The target ID provided in input
- description: Strategic summary (1-2 sentences).
- content_goals: List of 3 key objectives.
- sections: Array of blocks. Each block has:
    - type: one of "hero", "text", "features", "bento_grid", "gallery", "testimonials", "cta", "form", "lead_magnet", "header_global", "footer_global", "navigation_global"
    - title: A short internal name (e.g. "Values & Mission")
    - headline: STRING - WRITE THE ACTUAL FINAL HEADLINE IN GERMAN.
    - content: STRING - WRITE THE ACTUAL FINAL BODY TEXT IN GERMAN (Markdown).
    - content_hint: technical instructions (e.g. "Use Background Image from Source X").
    - images: ARRAY OF STRINGS - Select relevant image source URLs (src) from the "SOURCE ASSET INVENTORY" provided in the Source Text. USE EXACT CORRESPONDING URLs.

## RULES & CONTEXT
1. **LAYOUT TARGETS (type: "layout")**:
   - Focus EXCLUSIVELY on global elements: Header, Footer, and Main Navigation.
   - Use types like "header_global", "footer_global", "navigation_global".
   - Navigation MUST include the actual menu items for the new sitemap.
2. **PAGE TARGETS (type: "page")**:
   - Focus EXCLUSIVELY on the unique content of the page.
   - **PROHIBITED**: Do NOT include Header or Footer sections in page targets. These are handled by the global layout.
   - **BUDGET**: Max 12 sections per target.
   - **ASSETS**: Max 10 images per section. If more images are available but omitted, append "*(add more images from library if needed)*" to the section content.
3. **German Language**: Write all headlines and content in professional, engaging German.
4. **Be Specific**: No placeholders. Mention facts, names, USPs, and **Navigation Item Labels** found in the source text.
5. **ASSET RULES**:
   - Only use image URLs found in the "SOURCE ASSET INVENTORY".
   - Do not hallucinate or guess URLs. Use the exact "SRC" fields.
   - If no relevant image is found, return an empty array [].
6. **JSON ONLY. No preamble.**
7. **PATH LOCALIZATION**:
   - The input 'path' is a generic Concept Path (e.g. '/shop/red-shoe').
   - If you are writing German content and the specific product/page name is different (e.g. "Roter Schuh"), you MUST return a modified 'path' property (e.g. '/shop/roter-schuh').
   - **CRITICAL**: Keep the folder structure (e.g. '/shop/') EXACTLY the same. Only localize the SLUG (the last part).
`;

export const DEPENDENCY_DETECTION_SYSTEM_PROMPT = `You are a Website Context Analyzer.
Your task is to identify which pages from a SITEMAP are relevant to a specific user request for a target page.

## INPUT
You will receive:
1. "targetPath": The page we are working on(e.g. / home)
2. "userPrompt": The user's change request (e.g. "Add a teaser for the gallery")
3. "sitemapPaths": A list of all available page paths in the new structure

## OUTPUT(JSON)
Return a JSON object with:
- "dependencies": Array of strings(paths from sitemapPaths that are relevant)
  - "reason": Brief explanation why these pages are relevant

## RULES
  - ONLY return paths that exist in "sitemapPaths".
- If the user mentions a specific section(e.g. "Gallery", "Contact", "About"), include the corresponding path.
- If no other page is relevant, return an empty array.
- Be precise.Do not hallucinates paths.
`;

export const REGENERATION_SYSTEM_PROMPT = `You are an expert Copywriter and Content Strategist.
Your task is to take a webpage structure (Frame) and write the actual content drafts (Headlines and Copy) in German.

## INPUT DATA
You will receive:
1. "target": The Frame (Goal, Description, Sections). Sections currently only have type, title, and content_hint.
2. "primarySource": The main text content available for this page.
3. "secondarySources": Context from other pages (dependencies).
4. "sitemapSummary": List of all pages for cross-linking.

## REQUIRED OUTPUT SCHEMA (JSON)
Return the UPDATED "target" object. You MUST preserve the existing "id" and "path" of the target.
In the "sections" array, every block MUST have these exact fields:
- type: (Keep the original type)
- title: (Keep the original internal title)
- content_hint: (Keep the original hint)
- headline: STRING - WRITE THE ACTUAL DRAFT HEADLINE FOR THE WEBSITE USER.
- content: STRING - WRITE THE ACTUAL DRAFT BODY TEXT IN MARKDOWN. Use the provided sources to be specific!
- images: ARRAY OF STRINGS - Select relevant image source URLs (src) from the "SOURCE ASSET INVENTORY" provided in "primarySource". For standard sections, select up to 3 images. For "gallery" type sections, select up to 20 images.

## ASSET RULES
- Only use image URLs found in the "SOURCE ASSET INVENTORY".
- Match images to sections based on their "ROLE" (e.g., Use 'hero' for Hero section, 'team' for About us).
- **LIMIT**: Max 10 images per section.
- **HINT**: If many relevant images are available in the inventory but you hit the 10-image limit for a section, append exactly "*(add more images from library if needed)*" at the very end of that section's "content" field.
- Do not repeat the same image in every section.
- If no relevant image is found for a section, return an empty array [].

## CRITICAL RULES
1. **NO OBJECTS IN CONTENT**: The "content" and "headline" fields MUST be strings. Never return an object inside these fields.
2. **BE SPECIFIC**: Do not return generic text or placeholders. Use names, facts, and info from the "primarySource" and "secondarySources".
3. **BUDGET**: Max 12 sections per page. If the source has more content, consolidate into high-value hubs.
4. **PRESERVE ASSETS**: If the input "target" already has "images" or "logos", DO NOT lose them. If they are still valid, include them. If you select better ones from the inventory, swap them. NEVER return empty strings "" for src.
5. **LAYOUT SPECIAL RULE**: If the target contains sections like "header_global" or "footer_global", treat the "primarySource" as a "Global Branding DNA" feed. 
   - **LOGO PRIORITIZATION**: If the "target" object contains a "logos" array, these are the EXPLICITLY ASSIGNED BRAND LOGOS. Use the ones marked as "mandatory" with highest priority for the header.
6. **LANGUAGE**: Always write the final "headline" and "content" in GERMAN.
7. **JSON ONLY**: No preamble, no markdown code blocks around the JSON.
8. **MAX LENGTH**: Keep the total JSON response under 12k characters. If content is too long, be concise.
`;


// Helper to prepare the massive context string
/**
 * PREPARE CONTEXT FOR A DISTRIBUTED SCOUT PASS
 * Focuses on a specific subset of nodes (e.g. one archetype or one chunk of unique pages)
 */
export function prepareScoutContext(nodes: any[], tier: number = 0) {
  let context = `## SCOUTING FOCUS: ANALYZING ${nodes.length} PAGES\n`;

  nodes.forEach((node, idx) => {
    context += prepareSinglePageContext(node, idx, tier);
  });

  return context;
}

/**
 * HELPER: Formats a single page's metadata and semantic blocks for AI analysis
 */
export function prepareSinglePageContext(node: any, idx: number, tier: number = 0): string {
  const path = new URL(node.url).pathname;
  let pageCtx = `\n### Page ${idx + 1}: ${path}\n`;
  pageCtx += `**URL**: ${node.url}\n`;
  pageCtx += `**Title**: ${node.meta?.title || node.title || 'Untitled'}\n`;

  if (node.meta?.description) {
    pageCtx += `**Meta Description**: ${node.meta.description}\n`;
  }

  // 1. Headings (High Resolution)
  if (node.content?.headings?.length) {
    pageCtx += `\n**Heading Structure**:\n`;
    node.content.headings.slice(0, 30).forEach((h: any) => {
      const indent = '  '.repeat((h.level || 1) - 1);
      pageCtx += `${indent} - H${h.level || '?'}: ${h.text?.substring(0, 60) || h}\n`;
    });
  }

  // 2. Images (for visual context)
  if (node.content?.images?.length) {
    pageCtx += `\n**Images** (${node.content.images.length} total):\n`;
    node.content.images.slice(0, 15).forEach((img: any) => {
      const alt = img.alt || 'No alt text';
      const src = img.src?.split('/').pop()?.substring(0, 40) || 'unknown';
      pageCtx += `- [${alt.substring(0, 30)}] → ${src}\n`;
    });
  }

  // 3. Forms
  if (node.content?.forms?.length) {
    pageCtx += `\n**Forms**: ${node.content.forms.length} detected\n`;
    node.content.forms.slice(0, 5).forEach((form: any) => {
      pageCtx += `- ${form.type || 'input'}: ${form.label || form.id || 'unlabeled'}\n`;
    });
  }

  // 4. Semantic Blocks (CRITICAL)
  if (node.content?.semanticBlocks?.length) {
    pageCtx += `\n**Semantic UI Blocks**:\n`;
    node.content.semanticBlocks.forEach((b: any) => {
      const previewLimit = tier === 0 ? 1500 : (tier === 1 ? 800 : 300);
      const preview = b.content.substring(0, previewLimit).replace(/\n+/g, ' ').trim();
      pageCtx += `- [${b.type.toUpperCase()}](${b.selector}): ${preview}... \n`;
    });
  } else if (node.content?.rawText) {
    const textLimit = tier === 0 ? 10000 : 5000;
    const cleanText = node.content.rawText.replace(/\s+/g, ' ').trim().substring(0, textLimit);
    pageCtx += `\n**Content Preview**:\n> ${cleanText}...\n`;
  }

  pageCtx += '\n---\n';
  return pageCtx;
}

export function prepareComponentContext(migrationPlan: any, crawledStructure: any, userInstructions?: string, stackConfig?: any, critique?: any, tier: number = 0, overrides: any = {}): string {
  let pagesContext = '';

  if (critique) {
    pagesContext += `\n## SITE AUDIT & DESIGN CRITIQUE:\n`;
    pagesContext += `- Overall Score: ${critique.audit_summary?.total_score || 'N/A'}\n`;
    pagesContext += `- BFSG Compliant: ${critique.audit_summary?.bfsg_compliant ? 'YES' : 'NO'}\n`;
    pagesContext += `- Summary: ${critique.summary_de || critique.summary || 'N/A'}\n`;

    if (critique.critical_issues?.length) {
      pagesContext += `\n### Top Critical Issues:\n`;
      critique.critical_issues.slice(0, 5).forEach((issue: string) => {
        pagesContext += `- ${issue}\n`;
      });
    }
  }
  if (crawledStructure?.nodes) {
    const { optimized, savings } = createAIOptimizedStructure(crawledStructure, overrides, tier);

    console.log(`📊[Component] Token optimization: ${savings.original} pages → ${savings.optimized} examples(${savings.percentage} % saved)`);

    const nodesToProcess = [
      ...optimized.uniquePages,
      ...optimized.groups.flatMap((p: any) => p.examples)
    ];

    pagesContext = `\n\n## CRAWLED PAGES ANALYSIS(Optimized: ${nodesToProcess.length} representative pages): \n`;

    nodesToProcess.forEach((node: any, idx: number) => {
      const path = new URL(node.url).pathname;
      pagesContext += `\\n### Page ${idx + 1}: ${path} \\n`;
      pagesContext += `** URL **: ${node.url} \\n`;
      pagesContext += `** Title **: ${node.meta?.title || node.title || 'Untitled'} \\n`;

      if (node.meta?.description) {
        pagesContext += `** Meta Description **: ${node.meta.description} \\n`;
      }

      if (node.content?.headings?.length) {
        pagesContext += `\\n ** Heading Structure **: \\n`;
        node.content.headings.slice(0, 30).forEach((h: any) => {
          const indent = '  '.repeat((h.level || 1) - 1);
          pagesContext += `${indent} - H${h.level || '?'}: ${h.text?.substring(0, 60) || h} \\n`;
        });
      }

      if (node.content?.headings?.length > 2) {
        const h2s = node.content.headings.filter((h: any) => h.level === 2).map((h: any) => h.text);
        if (h2s.length > 0) {
          pagesContext += `\\n ** Detected Sections **: ${h2s.slice(0, 15).join(' | ')} \\n`;
        }
      }

      if (node.content?.extractedColors) {
        const c = node.content.extractedColors;
        pagesContext += `\\n ** Detected Colors **: \\n`;
        pagesContext += `- Dominant: ${Array.isArray(c.dominant) ? c.dominant.join(', ') : (c.dominant || 'N/A')} \\n`;
        pagesContext += `- Background: ${Array.isArray(c.background) ? c.background.join(', ') : (c.background || 'N/A')} \\n`;
        pagesContext += `- Text: ${Array.isArray(c.text) ? c.text.join(', ') : (c.text || 'N/A')} \\n`;
      }

      if (node.content?.images?.length) {
        pagesContext += `\\n ** Images & Context ** (${node.content.images.length} total): \\n`;

        // Group images by role for better context
        const imagesByRole: Record<string, any[]> = {};
        node.content.images.forEach((img: any) => {
          const role = img.role || 'unknown';
          if (!imagesByRole[role]) imagesByRole[role] = [];
          imagesByRole[role].push(img);
        });

        // Show role-based summary first
        Object.entries(imagesByRole).forEach(([role, images]) => {
          pagesContext += `  ${role}: ${images.length} image(s)\\n`;
        });

        // Show detailed images (prioritize important roles)
        const priorityRoles = ['logo', 'hero-background', 'hero-foreground', 'blog-thumbnail'];
        const detailedImages = [
          ...node.content.images.filter((img: any) => priorityRoles.includes(img.role || '')),
          ...node.content.images.filter((img: any) => !priorityRoles.includes(img.role || ''))
        ].slice(0, 20);

        detailedImages.forEach((img: any) => {
          const alt = img.alt || 'No alt text';
          const src = img.src?.split('/').pop()?.substring(0, 40) || 'unknown';
          const role = img.role || 'unknown';
          const confidence = img.roleConfidence || 0;
          let line = `- [${role}${confidence > 70 ? '✓' : ''}] ${alt.substring(0, 30)} → ${src}`;
          if (img.context) line += ` (Context: "${img.context.substring(0, 30)}")`;
          pagesContext += line + '\\n';
        });
      }

      // NEW: Enhanced Form Analysis
      if (node.content?.forms?.length) {
        pagesContext += `\\n ** Forms ** (${node.content.forms.length} total): \\n`;
        node.content.forms.slice(0, 5).forEach((form: any) => {
          let formLine = `- ${form.purpose || 'unknown'}`;
          if (form.purposeConfidence) formLine += ` (${form.purposeConfidence}% confidence)`;
          formLine += `: ${form.fields?.length || 0} fields`;
          if (form.submitButton) formLine += `, "${form.submitButton.text}"`;
          if (form.integrations?.length) formLine += ` [${form.integrations.join(', ')}]`;
          pagesContext += formLine + '\\n';
        });
      }

      // NEW: Enhanced Link Analysis
      if (node.content?.links?.length) {
        const ctaLinks = node.content.links.filter((l: any) => l.role === 'cta');
        const socialLinks = node.content.links.filter((l: any) => l.social);
        const navLinks = node.content.links.filter((l: any) => l.role === 'navigation');

        if (ctaLinks.length > 0) {
          pagesContext += `\\n ** CTAs ** (${ctaLinks.length}): `;
          pagesContext += ctaLinks.slice(0, 5).map((l: any) => `"${l.text}" (${l.buttonStyle || 'link'})`).join(', ') + '\\n';
        }

        if (socialLinks.length > 0) {
          pagesContext += `\\n ** Social Links **: `;
          pagesContext += socialLinks.map((l: any) => l.social.platform).join(', ') + '\\n';
        }

        if (navLinks.length > 0) {
          pagesContext += `\\n ** Navigation **: `;
          pagesContext += navLinks.slice(0, 10).map((l: any) => l.text).join(', ') + '\\n';
        }
      }

      // NEW: Content Type Detection
      if (node.content?.contentType) {
        pagesContext += `\\n ** Content Type **: ${node.content.contentType.type} (${node.content.contentType.confidence}% confidence)\\n`;
        if (node.content.contentType.structuredData) {
          const data = node.content.contentType.structuredData;
          if (data.author) pagesContext += `  Author: ${data.author}\\n`;
          if (data.publishDate) pagesContext += `  Published: ${data.publishDate}\\n`;
          if (data.price) pagesContext += `  Price: ${data.price}\\n`;
          if (data.eventDate) pagesContext += `  Event Date: ${data.eventDate}\\n`;
        }
      }

      // NEW: Media Analysis
      if (node.content?.media) {
        const media = node.content.media;
        if (media.videos?.length > 0) {
          pagesContext += `\\n ** Videos ** (${media.videos.length}): `;
          pagesContext += media.videos.map((v: any) => `${v.type}${v.videoId ? ` (${v.videoId})` : ''}`).join(', ') + '\\n';
        }
        if (media.embeds?.length > 0) {
          pagesContext += `\\n ** Embeds ** (${media.embeds.length}): `;
          pagesContext += media.embeds.map((e: any) => `${e.type}${e.provider ? ` (${e.provider})` : ''}`).join(', ') + '\\n';
        }
        if (media.interactiveElements?.length > 0) {
          pagesContext += `\\n ** Interactive **: `;
          pagesContext += media.interactiveElements.map((ie: any) => `${ie.type} (${ie.count})`).join(', ') + '\\n';
        }
      }

      // NEW: Design System
      if (node.content?.designSystem) {
        const ds = node.content.designSystem;
        pagesContext += `\\n ** Design System **:\\n`;
        if (ds.typography?.fontFamilies?.length) {
          pagesContext += `  Fonts: ${ds.typography.fontFamilies.join(', ')}\\n`;
        }
        if (ds.spacing?.scale?.length) {
          pagesContext += `  Spacing Scale: ${ds.spacing.scale.join(', ')}px\\n`;
        }
        if (ds.borderRadius?.mode) {
          pagesContext += `  Border Radius: ${ds.borderRadius.mode}\\n`;
        }
      }

      if (node.content?.semanticBlocks?.length) {
        pagesContext += `\\n ** Semantic Structure(Blocks) **: \\n`;
        node.content.semanticBlocks.forEach((b: any) => {
          // Tier-aware truncation for blocks
          const previewLimit = tier === 0 ? 1000 : (tier === 1 ? 500 : 200);
          const preview = b.content.substring(0, previewLimit).replace(/\\n+/g, ' ').trim();
          pagesContext += `- [${b.type.toUpperCase()}](${b.selector}): ${preview}... \\n`;
        });
      }
      else if (node.content?.rawText) {
        // Tier-aware truncation for raw text
        const textLimit = tier === 0 ? 10000 : (tier === 1 ? 5000 : 2000);
        const cleanText = node.content.rawText
          .replace(/\\s+/g, ' ')
          .replace(/\\n{3,}/g, '\\n\\n')
          .trim()
          .substring(0, textLimit);
        pagesContext += `\\n ** Content Preview **: \\n > ${cleanText}...\\n`;
      }

      pagesContext += '\\n---\\n';
    });
  }

  let stackContext = '';
  if (stackConfig) {
    stackContext = '\\n\\n## SELECTED TECH STACK:\\n';
    stackContext += `- ** Framework **: ${stackConfig.framework === 'nextjs' ? 'Next.js 15 (App Router, TypeScript)' : 'Nuxt 3'} \\n`;
    stackContext += `- ** UI Library **: ${stackConfig.uiLibrary === 'shadcn' ? 'shadcn/ui (Radix + Tailwind)' :
      stackConfig.uiLibrary === 'radix' ? 'Radix UI (unstyled primitives)' :
        stackConfig.uiLibrary === 'headless-ui' ? 'Headless UI (Tailwind Labs)' :
          'Custom (build from scratch)'
      } \\n`;
    stackContext += `- ** Styling **: ${stackConfig.css === 'tailwind' ? 'Tailwind CSS' :
      stackConfig.css === 'scss-modules' ? 'SCSS Modules' : 'CSS-in-JS'
      } \\n`;

    if (stackConfig.uiLibrary === 'shadcn') {
      stackContext += `\\n ** IMPORTANT **: Prefer shadcn / ui components for atoms / molecules.Reference from @/components/ui /.\\n`;
    }
  }

  let migrationContext = '## MIGRATION PLAN (New Site Structure):\\n';
  if (migrationPlan?.sitemap) {
    migrationContext += '\\n**New Sitemap**:\\n';
    migrationPlan.sitemap.forEach((page: any) => {
      migrationContext += `- ${page.path}: ${page.label} (${page.type}) \\n`;
    });
  }
  if (migrationPlan?.page_mapping) {
    migrationContext += '\\n**Page Mapping**:\\n';
    migrationPlan.page_mapping.slice(0, 15).forEach((mapping: any) => {
      migrationContext += `- ${mapping.old_url} → ${mapping.new_path} (${mapping.action}) \\n`;
    });
  }

  let userContent = migrationContext;
  userContent += pagesContext;
  userContent += stackContext;

  if (userInstructions) {
    userContent = `## USER INSTRUCTIONS(HIGHEST PRIORITY): \n${userInstructions} \n\n-- -\n\n${userContent} `;
  }

  return userContent;
}

export function buildSpecificationPrompt(analysisData: any, userInstructions?: string) {
  let userContent = `Erstelle die Spezifikation basierend auf dieser Analyse: ${JSON.stringify(analysisData)} `;
  if (userInstructions) {
    userContent = `USER INSTRUCTIONS(follow these guidelines): \\n${userInstructions} \\n\\n-- -\\n\\n${userContent} `;
  }
  return [
    { role: 'system', content: SPECIFICATION_SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ];
}

export function buildImplementationPrompt(
  spec: any,
  stack: StackConfig,
  userInstructions?: string,
  availableAssets?: Record<string, string>,
  designConfig?: DesignConfig,
  pageSpecs?: any[],
  migrationPlan?: any
) {
  const ids = designConfig?.styleIds?.length ? designConfig.styleIds : ['modern-minimal'];
  const selectedPresets = Array.from(new Set(ids))
    .map(id => DESIGN_PRESETS.find(s => s.id === id))
    .filter(Boolean) as typeof DESIGN_PRESETS;

  if (selectedPresets.length === 0) selectedPresets[0] = DESIGN_PRESETS[0];

  const designName = selectedPresets.map(s => s.name).join(' + ');
  const designGuidelines = selectedPresets.map(s => `### ${s.name} \\n${s.promptInjection} `).join('\\n\\n');

  let customDesignContext = '';
  if (designConfig) {
    customDesignContext = `\\n## 3. CUSTOM DESIGN TOKENS(OVERRIDE DEFAULTS)
  - ** Theme **: ${designConfig.theme} Mode
    - ** Corner Roundness **: ${designConfig.roundness} (sharp = 0px, default=8px, soft = 16px, full = 9999px)
- ** Typography Style **: ${designConfig.typography}
- ** Color Palette **:
- Primary: ${designConfig.colors.primary}
- Secondary: ${designConfig.colors.secondary}
- Background: ${designConfig.colors.background}
- Text: ${designConfig.colors.text}
- Accent: ${designConfig.colors.accent}

** Specific Design Instructions **:
${designConfig.customInstructions || 'None'}
${designConfig.aiGeneratedInstructions || ''}

${designConfig.mockupHtml ? `## APPROVED VISUAL MOCKUP REFERENCE
The user has generated and approved the following HTML mockup as a visual reference.
Use this as the PRIMARY guide for implementing all UI components - match the colors, spacing, typography, and overall aesthetic.

\`\`\`html
${designConfig.mockupHtml}
\`\`\`
` : ''
      }
`;
  }

  let userContent = `# Implementation Request

## 1. TECH STACK
  - ** Framework **: ${stack.framework === 'nextjs' ? 'Next.js 15 (App Router, TypeScript)' : 'Nuxt 3'}
- ** UI Library **: ${stack.uiLibrary === 'shadcn' ? 'shadcn/ui (install via npx shadcn@latest add)' :
      stack.uiLibrary === 'radix' ? 'Radix UI Primitives' :
        stack.uiLibrary === 'headless-ui' ? 'Headless UI' : 'Custom components'
    }
- ** Styling **: ${stack.css === 'tailwind' ? 'Tailwind CSS' : stack.css === 'scss-modules' ? 'SCSS Modules' : 'CSS-in-JS'}

## 2. DESIGN STYLE: ${designName}
Combine elements from the following styles to create a unique aesthetic:

${designGuidelines}

${customDesignContext}
`;

  if (migrationPlan?.clusters && migrationPlan.clusters.length > 0) {
    userContent += `## 4. ARCHITECTURE & CLUSTERS (TEMPLATES)
The following page groups share the same layout structure. Implement these as REUSABLE TEMPLATES (Dynamic Routes).

`;
    migrationPlan.clusters.forEach((c: any) => {
      userContent += `- **Template Name**: ${c.id} (Pattern: \`${c.pattern}\`)\n`;
      userContent += `  - **Page Count**: ${c.instances.length} pages\n`;
      userContent += `  - **Context**: ${c.instances.slice(0, 3).map((i: any) => i.url).join(', ')}...\n\n`;
    });
  }

  if (spec) {
    userContent += `## 3. COMPONENT SPECIFICATION

### MANDATORY PAGES LIST(MUST IMPLEMENT ALL):
`;
    const pagesToInclude = (pageSpecs && pageSpecs.length > 0) ? pageSpecs : (spec.page_analysis || []);
    if (pagesToInclude.length > 0) {
      pagesToInclude.forEach((page: any) => {
        const path = page.path || '/';
        const name = page.label || page.page_name || 'Page';
        const sections = (page.sections || page.detected_sections || []).map((s: any) => typeof s === 'string' ? s : s.type).slice(0, 5).join(', ');
        userContent += `- **${path}** (${name}): ${sections} \n`;
      });
    }

    userContent += `\\n### Design System from Analysis:
`;
    if (spec.design_system) {
      if (spec.design_system.colors) {
        userContent += `- ** Colors **: Primary: ${spec.design_system.colors.primary || 'TBD'}, Secondary: ${spec.design_system.colors.secondary || 'TBD'} \\n`;
      }
      if (spec.design_system.typography) {
        userContent += `- ** Typography **: ${spec.design_system.typography.fontFamily || 'System fonts'} \\n`;
      }
    }

    userContent += `\\n### Components to Implement:
`;
    if (spec.groups) {
      spec.groups.forEach((group: any) => {
        userContent += `\\n ** ${group.name}**: \\n`;
        (group.components || []).slice(0, 10).forEach((comp: any) => {
          userContent += `- ${comp.name}: ${comp.description?.substring(0, 100) || 'No description'} \\n`;
        });
      });
    }
  }

  if (availableAssets && Object.keys(availableAssets).length > 0) {
    userContent += `\\n## 4. AVAILABLE ASSETS(Downloaded Images)
Use these exact filenames in your implementation steps:

| Original URL | Local Filename |
| --------------| ----------------|
  `;
    Object.entries(availableAssets).forEach(([originalUrl, filename]) => {
      userContent += `| ${originalUrl.substring(0, 40)}... | ${filename} |\\n`;
    });
  }

  if (userInstructions) {
    userContent += `\\n## 5. USER INSTRUCTIONS(Must Follow) \\n${userInstructions} \\n`;
  }

  return [
    { role: 'system', content: IMPLEMENTATION_SYSTEM_PROMPT },
    { role: 'user', content: userContent }
  ];
}

export function buildDependencyPrompt(targetPath: string, userPrompt: string, sitemapPaths: string[]) {
  return [
    { role: 'system', content: DEPENDENCY_DETECTION_SYSTEM_PROMPT },
    {
      role: 'user', content: JSON.stringify({
        targetPath,
        userPrompt,
        sitemapPaths
      })
    }
  ];
}

export function buildRegenerationPrompt(
  target: any,
  primarySourceText: string,
  secondarySourcesText: { path: string, content: string }[],
  sitemapSummary: string[],
  userPrompt: string
) {
  const primaryTruncated = primarySourceText.slice(0, 15000);

  const secondaryTruncated = secondarySourcesText.map(s => ({
    path: s.path,
    content: s.content.slice(0, 10000)
  }));

  const inputPayload = {
    target,
    primarySource: primaryTruncated,
    secondarySources: secondaryTruncated,
    sitemapSummary,
    userPrompt
  };

  return [
    { role: 'system', content: REGENERATION_SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(inputPayload) }
  ];
}
