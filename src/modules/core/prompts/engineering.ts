import { SiteStructure, StackConfig, DesignConfig } from '@/types';
import { DESIGN_PRESETS } from '../../design/data/design-presets';
import { createAIOptimizedStructure } from '../utils/grouping';

// PHASE 1: OBSERVATION
export const COMPONENT_EXTRACTION_PROMPT = `You are an expert UI Engineer performing a "Pattern Mining" analysis.
Your task is to analyze the provided website content and extract ABSTRACT UI PATTERNS.

## GOAL
List every distinct UI element, section, or interactive pattern you see in the data.
DO NOT assign specific library names yet. Describe them functionally.

## INPUT DATA
You will receive:
1. **Crawled Content**: Titles, headings, images, forms, links.
2. **Page Context**: The URL and detected sections.
3. **Semantic Structure**: Pre-segmented blocks (Header, Main, Footer) - use this to categorize components by region.

## OUTPUT FORMAT (JSON only)
{
  "patterns": [
    {
      "id": "pattern-1",
      "name": "string (e.g. 'Hero with Split Layout')",
      "description": "string (visual description)",
      "frequency": "single-page" | "multi-page",
      "detected_on": ["/home", "/about"]
    }
  ]
}

## RULES
1. **Be Granular**: "Primary Button", "Secondary Button", "Newsletter Card", "Feature Grid".
2. **No Hallucinations**: Only list what is evidenced in the text/images/forms.
3. **Ignore Layout**: Do not list "Header" or "Footer" unless they have unique internal components (like a mega-menu). Focus on page content.
`;

// PHASE 2: MAPPING (The "Menu" Step)
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
1. **Reuse First**: Always map to a shadcn component if possible (e.g. "Newsletter Input" -> "Input" + "Button").
2. **Custom Fallback**: If NO shadcn component fits (e.g. "Interactive Map"), mark 'shadcn_base' as 'Custom'.
3. **Atoms vs Molecules**:
   - Atoms = Single shadcn primitives (Button, Badge).
   - Molecules = Combinations (Card + Text + Button).
`;

export function buildComponentExtractionPrompt(pagesContext: string) {
  return [
    { role: 'system', content: COMPONENT_EXTRACTION_PROMPT },
    { role: 'user', content: `Analyze these pages:\n${pagesContext}` }
  ];
}

export function buildComponentMappingPrompt(extractedPatterns: any, stackConfig?: any) {
  return [
    { role: 'system', content: COMPONENT_MAPPING_PROMPT },
    { role: 'user', content: `Map these patterns to the library:\n${JSON.stringify(extractedPatterns)}` }
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
- Refer to the detected sections for each page to determine which components go where.

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
Your task is to design a high-fidelity Content Strategy and Blueprint for a new webpage.

## GOAL
Define the structural flow (sections) AND write high-quality, final German copy for every section based on the provided source content.

## INPUT
You will receive "Targets" with New Path and raw Source Text from the original site.

## OUTPUT FORMAT (JSON Array)
Return an array of objects. Each object must have:
- id: The target ID provided in input
- description: Strategic summary (1-2 sentences).
- content_goals: List of 3 key objectives.
- sections: Array of blocks. Each block has:
    - type: one of "hero", "text", "features", "bento_grid", "gallery", "testimonials", "cta", "form", "lead_magnet", "footer_minimal"
    - title: A short internal name (e.g. "Values & Mission")
    - headline: STRING - WRITE THE ACTUAL FINAL HEADLINE IN GERMAN.
    - content: STRING - WRITE THE ACTUAL FINAL BODY TEXT IN GERMAN (Markdown). Use facts from the source!
    - content_hint: technical instructions for the developer (e.g. "Use Background Image from Source X").

## COPYWRITING GUIDELINES
1. **German Language**: Write all headlines and content in professional, engaging German.
2. **Be Specific**: No placeholders. Mention facts, names, numbers, and unique selling points found in the source text.
3. **Conversion Focus**: Use active voice and clear calls-to-action (CTAs).
4. **Scannability**: Break long text into bullet points or short paragraphs.
5. **Strategic Architecture**: Start with a Hero. End with a CTA.

## JSON ONLY. No preamble.
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
- images: ARRAY OF STRINGS - Select up to 3 most relevant image source URLs (src) from the "SOURCE ASSET INVENTORY" provided in "primarySource" that fit this section's context.

## ASSET RULES
- Only use image URLs found in the "SOURCE ASSET INVENTORY".
- Match images to sections based on their "ROLE" (e.g., Use 'hero' for Hero section, 'team' for About us).
- Do not repeat the same image in every section.
- If no relevant image is found for a section, return an empty array [].

## CRITICAL RULES
1. **NO OBJECTS IN CONTENT**: The "content" and "headline" fields MUST be strings. Never return an object inside these fields.
2. **BE SPECIFIC**: Do not return generic text or placeholders. Use names, facts, and info from the "primarySource" and "secondarySources".
3. **LANGUAGE**: Always write the final "headline" and "content" in GERMAN.
4. **JSON ONLY**: No preamble, no markdown code blocks around the JSON.
`;


// Helper to prepare the massive context string
export function prepareComponentContext(migrationPlan: any, crawledStructure?: any, userInstructions?: string, stackConfig?: any, critique?: any): string {
  let pagesContext = '';

  if (critique) {
    pagesContext += `

## AUDIT FINDINGS(CRITICAL):
`;
    pagesContext += `The existing site has an Accessibility Score of ${critique.accessibility_score} /100 and SEO Score of ${critique.seo_score}/100.
`;
    pagesContext += `** Critical Issues to Fix in Design **:
`;
    if (critique.critical_issues?.length) {
      critique.critical_issues.forEach((issue: string) => pagesContext += `- ${issue} \n`);
    } else if (critique.audit_matrix) {
      critique.audit_matrix.filter((i: any) => i.status === '❌ Fail' && i.criticality === 'K')
        .forEach((i: any) => pagesContext += `- ${i.category}: ${i.description} (${i.finding}) \n`);
    }
    pagesContext += `
Ensure the new component library specifically resolves these issues(e.g., proper contrast colors, semantic HTML tags, accessible form controls).

`;
  }
  if (crawledStructure?.nodes) {
    const { optimized, savings } = createAIOptimizedStructure(crawledStructure);

    console.log(`📊[Component] Token optimization: ${savings.original} pages → ${savings.optimized} examples(${savings.percentage} % saved)`);

    const nodesToProcess = [
      ...optimized.uniquePages,
      ...optimized.pagePatterns.flatMap((p: any) => p.examples)
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
        node.content.headings.slice(0, 15).forEach((h: any) => {
          const indent = '  '.repeat((h.level || 1) - 1);
          pagesContext += `${indent} - H${h.level || '?'}: ${h.text?.substring(0, 60) || h} \\n`;
        });
      }

      if (node.content?.headings?.length > 2) {
        const h2s = node.content.headings.filter((h: any) => h.level === 2).map((h: any) => h.text);
        if (h2s.length > 0) {
          pagesContext += `\\n ** Detected Sections **: ${h2s.slice(0, 8).join(' | ')} \\n`;
        }
      }

      if (node.content?.extractedColors) {
        const c = node.content.extractedColors;
        pagesContext += `\\n ** Detected Colors **: \\n`;
        pagesContext += `- Dominant: ${c.dominant?.join(', ') || 'N/A'} \\n`;
        pagesContext += `- Background: ${c.background?.join(', ') || 'N/A'} \\n`;
        pagesContext += `- Text: ${c.text?.join(', ') || 'N/A'} \\n`;
      }

      if (node.content?.images?.length) {
        pagesContext += `\\n ** Images & Context ** (${node.content.images.length} total): \\n`;
        node.content.images.slice(0, 12).forEach((img: any) => {
          const alt = img.alt || 'No alt text';
          const src = img.src?.split('/').pop()?.substring(0, 40) || 'unknown';
          let line = `- [${alt.substring(0, 30)}] → ${src} `;
          if (img.context) line += ` (Context: "${img.context}")`;
          pagesContext += line + '\\n';
        });
      }

      if (node.content?.forms?.length) {
        pagesContext += `\\n ** Forms **: ${node.content.forms.length} form(s) detected\\n`;
        node.content.forms.slice(0, 5).forEach((form: any) => {
          pagesContext += `- ${form.type || 'input'}: ${form.label || form.id || 'unlabeled'} \\n`;
        });
      }

      if (node.content?.links?.length) {
        const navLinks = node.content.links.filter((l: any) =>
          l.href?.startsWith('/') || l.href?.startsWith('#')
        ).slice(0, 10);
        if (navLinks.length > 0) {
          pagesContext += `\\n ** Internal Links **: ${navLinks.map((l: any) => l.text || l.href).join(', ')} \\n`;
        }
      }

      if (node.content?.semanticBlocks?.length) {
        pagesContext += `\\n ** Semantic Structure(Blocks) **: \\n`;
        node.content.semanticBlocks.forEach((b: any) => {
          // Condensed block output
          const preview = b.content.substring(0, 600).replace(/\\n/g, ' ');
          pagesContext += `- [${b.type.toUpperCase()}](${b.selector}): ${preview}... \\n`;
        });
      }
      else if (node.content?.rawText) {
        const cleanText = node.content.rawText
          .replace(/\\s+/g, ' ')
          .replace(/\\n{3,}/g, '\\n\\n')
          .trim()
          // Limit text significantly less (User approved up to 150k tokens)
          .substring(0, 50000);
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
  pageSpecs?: any[]
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
