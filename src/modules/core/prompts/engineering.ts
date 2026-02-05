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

export const IMPLEMENTATION_SYSTEM_PROMPT = `You are creating a step-by-step implementation guide for a Junior Developer.

# OUTPUT FORMAT (Markdown - 2 Parts)

## PART 1: Design System
Must include Color Palette table, Typography specs, Component Tokens, Dark Mode.
End with: <<<DESIGN_SYSTEM_END>>>

## PART 2: Implementation Plan
Structured as Phases > Steps. Minimum 40 steps.

# STEP FORMAT (REQUIRED)
**Step X.X: [Title]**
- **File**: path or (terminal)
- **Action**: Create | Modify | Install
- **Instructions**: 3-5 sentences (WHAT, not HOW)
- **Validation**: How to verify completion

# CRITICAL CONSTRAINTS
1. NO CODE BLOCKS - Describe in prose only
2. ONE file per step, ONE action per step
3. Name EXACT Tailwind classes, prop names, import paths
4. EVERY PAGE from input must have implementation step
5. Templates/Clusters → ONE step for entire pattern (not per page)
6. MANDATORY assets from input MUST be incorporated
7. Reference mockup HTML (visual_reference) for exact structure
8. Minimum 500 words for Design System section

# PHASE STRUCTURE
1. Setup (project init, dependencies, config)
2. Foundation (global styles, Header/Footer)
3. Atoms/Molecules (shadcn components or custom)
4. Organisms (sections like Hero, Features)
5. Pages (compose organisms)
6. Polish (animations, responsive, SEO)

# DESIGN QUALITY (Non-Negotiable)
- Generous padding (py-16+), refined typography
- ALL interactive elements have hover/focus states
- Use shadows/blurs for depth
- Glassmorphism: backdrop-blur-md + bg-white/10
- Lucide React icons consistently

# INPUT HANDLING
- Stack Config → Use specified framework/UI lib
- Component Spec → Reference for props/variants
- Design Style + Mockup HTML → Extract exact colors/classes
- Available Assets → Map to components by filename
- User Instructions → Follow custom requirements

Output comprehensive Markdown guide.`;

export const PAGE_SPECS_SYSTEM_PROMPT = `You are a German Information Architect writing website content blueprints.

# CRITICAL TYPE CONSTRAINTS
1. headline → Plain string in German, NEVER object/array
2. content → Plain string in German (Markdown OK), NEVER object/array
3. images → Array of URL strings, NEVER empty "" strings
4. Max 12 sections per page, Max 10 images per section

# CORRECT vs WRONG

## ✅ CORRECT Page Spec:
{
  "id": "target-/about",
  "description": "Unternehmensvorstellung mit Team",
  "content_goals": ["Vertrauen aufbauen", "Team vorstellen", "Werte kommunizieren"],
  "sections": [{
    "type": "hero",
    "title": "Hero",
    "headline": "Über uns",  // String!
    "content": "Wir sind ein **innovatives Team**.",  // String with Markdown!
    "images": ["https://example.com/team.jpg"]  // Valid URLs!
  }]
}

## ❌ WRONG - headline as object:
{
  "headline": { "text": "Über uns", "level": 1 }  // FORBIDDEN!
}

## ❌ WRONG - empty image strings:
{
  "images": ["https://example.com/team.jpg", "", ""]  // FORBIDDEN!
}

# INPUT
- Targets with: ID, Path, Type (page/layout), Source Text
- Source Text includes: Raw content + SOURCE ASSET INVENTORY

# OUTPUT (JSON Array)
[{
  "id": "string (from input)",
  "description": "string (German, 1-2 sentences)",
  "content_goals": ["goal1", "goal2", "goal3"],
  "sections": [{
    "type": "hero | text | features | bento_grid | gallery | testimonials | cta | form | header_global | footer_global | navigation_global",
    "title": "string (internal name)",
    "headline": "STRING IN GERMAN",  // Never object!
    "content": "STRING IN GERMAN (Markdown)",  // Never array!
    "content_hint": "string (technical note)",
    "images": ["url1", "url2"]  // Max 10, NO empty strings!
  }]
}]

# TARGET-SPECIFIC RULES
## LAYOUT Targets (type: "layout"):
- ONLY use: header_global, footer_global, navigation_global
- Navigation MUST list actual menu items

## PAGE Targets (type: "page"):
- NEVER include header/footer (handled by layout)
- **Minimum 5 sections** (homepage/landing pages: minimum 6-8 sections)
- Max 12 sections
- Homepage MUST include: hero, features/services, about/story, testimonials/social-proof, cta
- If >10 images available, append "*(add more images from library if needed)*"

# ASSET RULES
1. ONLY use URLs from SOURCE ASSET INVENTORY
2. Use exact SRC fields, never hallucinate
3. Empty array [] if no images found
4. Match by context (hero images → hero section, team → about page)

# PATH LOCALIZATION
- Input path may be generic (e.g., /shop/red-shoe)
- If German name differs, localize SLUG only: /shop/roter-schuh
- Keep folder structure: /shop/ stays /shop/

# QUALITY RULES
- German language only
- Be specific (use real names, facts from source)
- No placeholders or generic text
- Professional, engaging tone
- **Rich content**: Create comprehensive pages (5-8 sections for important pages)
- **Don't be minimal**: Users expect full-featured landing pages, not sparse wireframes

# PRE-OUTPUT VALIDATION
- [ ] All headlines are plain strings
- [ ] All content is plain strings
- [ ] No empty "" in images
- [ ] Homepage has **minimum 6 sections** (hero, features, about, testimonials, etc.)
- [ ] Regular pages have **minimum 5 sections** (unless naturally shorter like contact/imprint)
- [ ] Max 12 sections per target
- [ ] JSON array (no markdown wrapper)

Output valid JSON array only.`;

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

export const REGENERATION_SYSTEM_PROMPT = `You are a German Copywriter creating website content.

# CRITICAL TYPE CONSTRAINTS (WILL BE VALIDATED)
1. headline → MUST be plain string, NEVER object/array
2. content → MUST be plain string (Markdown), NEVER object/array
3. images → Array of URL strings, NEVER include empty "" strings
4. ALL content MUST be in GERMAN

# CORRECT vs WRONG EXAMPLES

## ✅ CORRECT Section:
{
  "type": "hero",
  "title": "Hero",
  "headline": "Willkommen bei unserem Service",  // String!
  "content": "Wir bieten **innovative Lösungen** für moderne Unternehmen.",  // String with Markdown!
  "images": ["https://example.com/hero.jpg"]  // Valid URLs only!
}

## ❌ WRONG - Object in headline:
{
  "headline": { "de": "Willkommen" }  // FORBIDDEN! Must be string!
}

## ❌ WRONG - Empty image string:
{
  "images": ["https://example.com/hero.jpg", "", ""]  // FORBIDDEN! Filter empty!
}

## ❌ WRONG - Array in content:
{
  "content": ["Text 1", "Text 2"]  // FORBIDDEN! Must be single string!
}

# INPUT
1. target: Frame with id, path, sections (with type, title, content_hint)
2. primarySource: Main page content + SOURCE ASSET INVENTORY
3. secondarySources: Related pages for context
4. sitemapSummary: All pages for cross-linking

# OUTPUT SCHEMA
{
  "id": "string (preserve from input)",
  "path": "string (preserve from input)",
  "sections": [{
    "type": "string (preserve)",
    "title": "string (preserve)",
    "content_hint": "string (preserve)",
    "headline": "STRING IN GERMAN",  // Plain string only!
    "content": "STRING IN GERMAN (Markdown allowed)",  // Plain string only!
    "images": ["url1", "url2"]  // Max 10, NO empty strings
  }]
}

# ASSET SELECTION RULES
1. ONLY use URLs from SOURCE ASSET INVENTORY (never hallucinate)
2. Match by ROLE: hero → hero-background, team → team-avatar
3. Max 10 images per section (append "*(add more images from library if needed)*" if more available)
4. Never repeat same image across sections
5. Empty array [] if no suitable images
6. If input has existing images/logos, preserve or replace (never delete without replacement)

# QUALITY RULES
1. Be specific - use real names, facts from sources (NO placeholders!)
2. **Minimum 5-6 sections** (homepage: minimum 6-8 sections with hero, features, about, testimonials, cta)
3. Max 12 sections (consolidate if needed)
4. German language only
5. Max 12k chars total response
6. **Rich content**: Don't be minimal - create full-featured pages, not sparse wireframes

# PRE-OUTPUT VALIDATION
- [ ] Every headline is plain string type
- [ ] Every content is plain string type
- [ ] No empty "" in images arrays
- [ ] Homepage has **minimum 6 sections**, regular pages **minimum 5**
- [ ] All text in German
- [ ] JSON only (no markdown wrapper)

Output valid JSON only.`;


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

/**
 * Intelligently samples context to fit within token limits
 * Prioritizes: Homepage, recent content, high-quality content
 *
 * @param sources - All available context sources
 * @param maxItems - Maximum items to return (default 30)
 * @param targetPath - Path of target being regenerated (for layout-specific logic)
 */
function sampleContextIntelligently(
  sources: { path: string, content: string }[],
  maxItems: number = 30,
  targetPath?: string
): { path: string, content: string }[] {
  if (sources.length <= maxItems) {
    return sources; // No sampling needed
  }

  // SPECIAL CASE: Layout/Global targets need ultra-aggressive sampling
  const isLayoutTarget = targetPath?.includes('/layout') ||
                        targetPath?.includes('/_layout') ||
                        targetPath === '/';

  if (isLayoutTarget && sources.length > 50) {
    console.log(`[ContextSample] 🏗️ LAYOUT detected (${targetPath}) → Ultra-aggressive sampling (${sources.length} → 12)`);
    maxItems = 12; // Very aggressive for layouts (only essential pages)
  } else {
    console.log(`[ContextSample] Sampling ${sources.length} → ${maxItems} items (intelligent prioritization)`);
  }

  // Calculate priority score for each source
  const scored = sources.map(s => ({
    ...s,
    priority: calculatePriority(s.path, s.content, isLayoutTarget)
  }));

  // Sort by priority (highest first) and take top N
  scored.sort((a, b) => b.priority - a.priority);

  return scored.slice(0, maxItems).map(({ path, content }) => ({ path, content }));
}

function calculatePriority(path: string, content: string, isLayoutContext: boolean = false): number {
  let score = 0;

  // Priority 1: Homepage & important pages (+100)
  if (path === '/' || path === '/home' || path === '/about' || path === '/contact') {
    score += 100;
  }

  // Priority 2: For layouts, heavily prioritize structural pages
  if (isLayoutContext) {
    if (path.includes('/blog') || path.includes('/news') || path.includes('/article')) {
      score += 50; // Boost blog/article pages (for navigation structure)
    }
    if (path.includes('/services') || path.includes('/products')) {
      score += 40; // Boost service/product pages
    }
    // De-prioritize deep nested pages in layout context
    const depth = path.split('/').length - 1;
    if (depth > 2) {
      score -= 30; // Penalty for deep pages in layout
    }
  }

  // Priority 3: Content quality (word count) (+0-30)
  const wordCount = content.split(/\s+/).length;
  score += Math.min(wordCount / 100, 30);

  // Priority 4: Path depth (prefer top-level pages) (+0-20)
  const depth = path.split('/').length - 1;
  score += Math.max(0, 20 - depth * 5);

  // Priority 5: Has meaningful content (+10)
  if (content.length > 500) {
    score += 10;
  }

  return score;
}

export function buildRegenerationPrompt(
  target: any,
  primarySourceText: string,
  secondarySourcesText: { path: string, content: string }[],
  sitemapSummary: string[],
  userPrompt: string
) {
  const primaryTruncated = primarySourceText.slice(0, 15000);

  // INTELLIGENT SAMPLING: Limit to 30 items (12 for layouts) to prevent token overflow
  const MAX_CONTEXT_ITEMS = 30;
  const targetPath = target?.path || target?.id || '';
  const sampled = sampleContextIntelligently(secondarySourcesText, MAX_CONTEXT_ITEMS, targetPath);

  // Truncate content aggressively
  // Layout targets: 800 chars (ultra-minimal, just structure hints)
  // Regular targets: 1500 chars
  const isLayoutTarget = targetPath.includes('/layout') || targetPath.includes('/_layout');
  const truncateLength = isLayoutTarget ? 800 : 1500;

  const secondaryTruncated = sampled.map(s => ({
    path: s.path,
    content: s.content.slice(0, truncateLength)
  }));

  const inputPayload = {
    target,
    primarySource: primaryTruncated,
    secondarySources: secondaryTruncated,
    sitemapSummary,
    userPrompt,
    _meta: {
      totalAvailable: secondarySourcesText.length,
      sampled: secondaryTruncated.length,
      isLayoutTarget,
      truncateLength,
      samplingNote: secondarySourcesText.length > sampled.length
        ? `Context sampled: ${sampled.length} of ${secondarySourcesText.length} items (${isLayoutTarget ? 'layout-optimized' : 'prioritized by relevance'})`
        : undefined
    }
  };

  return [
    { role: 'system', content: REGENERATION_SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(inputPayload) }
  ];
}
