import { SiteStructure } from '@/types';
import { createAIOptimizedStructure } from '../utils/grouping';

export const STYLE_EXTRACTOR_SYSTEM_PROMPT = `You are a Senior UI/UX Designer specializing in "Design DNA" extraction.
Analyze the provided website content (HTML/Text/CSS Classes) and reverse-engineer its Design System.

Output JSON only:
{
  "colors": {
    "primary": "string (hex)",
    "secondary": "string (hex)",
    "background": "string (hex)",
    "text": "string (hex)",
    "accent": "string (hex)"
  },
  "roundness": "default" | "sharp" | "soft" | "full",
  "typography": "modern" | "classic" | "tech" | "playful" | "minimal",
  "theme": "light" | "dark",
   "vibe_description": "string (e.g. 'Like Airbnb but more colorful')",
   "style_tags": ["minimalist", "modern", "luxury"],
   "dna": {
     "spacing": "compact" | "comfortable" | "spacious",
     "shadows": "none" | "subtle" | "soft" | "hard" | "neo-brutalist",
     "borderRadius": "string (e.g. 0px, 4px, 12px, 9999px)",
     "typographyScale": "string (e.g. 1.25, 1.33, 1.5)",
     "glassmorphism": boolean,
     "microInteractions": ["string (e.g. 'hover:scale-105', 'hover:bg-blue-600', 'active:scale-95')"]
   },
   "replication_strategy": "string (Technical notes for recreating this EXACT layout and visual feeling)"
 }
 
 VISUAL ANALYSIS GUIDELINES:
 1. **Colors**: Infer from CSS (bg-*, text-*) or visual context. 'primary' is the CALL TO ACTION color.
 2. **Roundness/Radius**: 
    - 'sharp' (0px) = Brutalist/Strict
    - 'default' (4-8px) = Corporate/Clean
    - 'soft' (12-24px) = Friendly/Modern
    - 'full' (999px) = Playful/App-like
 3. **Spacing**: Look at padding/margin classes (p-4 vs p-8).
    - 'compact': Dense data dashboards
    - 'comfortable': Standard marketing sites
    - 'spacious': Luxury/Minimalist portfolios
 4. **Shadows**:
    - 'subtle': Standard material design
    - 'soft': Large diffuse colored shadows (modern SaaS)
    - 'hard': Strict borders + offset shadows (neo-brutalist)
 5. **Micro-Interactions**: Look for :hover, transition-all, transform properties.
 6. **Layout Flow**: Analyze the "VERTICAL PAGE ANATOMY" to identify section order and transitions.
 7. **Asset Placement**: Use the "VISUAL ASSET INVENTORY" to determine how and where the reference site uses imagery (e.g. background heroes vs small icons).
 
 REPLICATION STRATEGY INSTRUCTIONS:
 Your "replication_strategy" must be a technical roadmap. 
 - Describe the vertical rhythm (e.g. "Alternating light/dark sections with 100px vertical padding").
 - Define the layout model (e.g. "Strict Bootstrap container with a 4-column feature grid in section 3").
 - Note specific image styles (e.g. "Use grayscale filters with hover color reveal" or "Section backgrounds should be skewed or have wavy SVG separators").
 `;


export const MIGRATION_SYSTEM_PROMPT = `You are a Senior System Architect.
 Modernize an existing website structure into a best-in-class V3 architecture.
 
 RULES:
 1. Document EVERY source URL in page_mapping - no exceptions
 2. For each URL: explain your decision in the "reason" field (German language)
 3. If merging pages: specify which target combines them in "merged_with"
 4. Use lowercase kebab-case for new paths
 5. CONTENT CONSOLIDATION STRATEGY (CRITICAL):
    The goal is to Create a LEAN, HIGH-IMPACT architecture.
    
    A) MERGE (Priority High):
       - Combine "Thin Content" pages (< 300 words) into parent category pages as sections, UNLESS they are distinct functional pages (Contact, Login).
       - Combine overlapping topics (e.g. "Services" + "Service A" + "Service B" -> Single "Services" page if A/B are short).
       - Merge "Team", "Vision", "Values" -> Single "About Us" page.
    
    B) PRUNE / DELETE (Use Extreme Caution):
       - ONLY delete if the page is truly redundant AND has no SEO/functional value.
       - Remove outdated functional pages (Guestbooks, old Archives).
       - Remove duplicate content variations.
       - 🚨 SAFETY RULE: If unsure, use "KEEP" and note the reason "Potential thin content but kept for safety".
    
    C) SPLIT:
       - Only split if a page is MASSIVE (> 3000 words) and covers distinct, unrelated topics.
       
    D) KEEP (Protected Definitions):
       - FUNCTIONAL PAGES: Contact, Imprint, Privacy, Terms, Login, Checkout, Cart, Search. (KEEP even if empty text).
       - High-Value SEO Landing Pages.
       - Core Business Pages that drive conversion.
       
    E) SANITY CHECKS (CRITICAL):
       - NO SELF-REDIRECTS: A page (\`old_url\`) MUST NOT redirect to itself (\`new_path\`). If they are functionally the same path (ignoring trailing slashes), force action: "keep". Example: \`old_url: "/"\` -> \`new_path: "/"\` MUST be "keep".
       - HOMEPAGE UNIQUENESS: The root path "/" should appear exactly ONCE in \`page_mapping\`. Do not create a separate redirect for it unless it's from \`/index.html\`.
       - GLOBAL LAYOUT ELEMENTS: Do NOT list "Header", "Navigation", or "Footer" as sections in the page structure. Assume they count as global layout. Only list UNIQUE content sections.
 
 Output JSON only:
 {
   "strategic_reasoning": "Brief explanation of structural changes (Chain-of-Thought - Analyze FIRST, then decide)",
   "sitemap": [{
     "path": "string",
     "label": "string",
     "type": "page" | "layout",
     "sources": ["string"] // List of ORIGINAL URLs that are consolidated into this page
   }],
   "page_mapping": [{
     "old_url": "string",
     "new_path": "string",
     "action": "keep" | "merge" | "redirect" | "delete",
     "reason": "string",
     "merged_with": "string | null"
   }]
 }`;

export function buildStyleExtractorPrompt(htmlPreview: string) {
   return [
      { role: 'system', content: STYLE_EXTRACTOR_SYSTEM_PROMPT },
      { role: 'user', content: htmlPreview.substring(0, 15000) }
   ];
}

export function buildMigrationPrompt(structure: SiteStructure) {
   const { optimized, savings } = createAIOptimizedStructure(structure);

   console.log(`📊 [Migration] Token optimization: ${savings.original} pages → ${savings.optimized} examples (${savings.percentage}% saved)`);

   return [
      { role: 'system', content: MIGRATION_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(optimized) }
   ];
}

export function buildMigrationPromptWithInstructions(structure: SiteStructure, userInstructions?: string) {
   let userContent = JSON.stringify(structure);
   if (userInstructions) {
      userContent = `USER INSTRUCTIONS:\n${userInstructions}\n\n---\n\n${userContent}`;
   }
   return [
      { role: 'system', content: MIGRATION_SYSTEM_PROMPT },
      { role: 'user', content: userContent }
   ];
}
export const DEPENDENCY_DETECTION_SYSTEM_PROMPT = `You are an intelligent Dependency Analyzer.
Your task is to determine which OTHER pages in the sitemap provide necessary context for the current page being built.

## INPUT
You will receive:
1. "targetPath": The page we are working on (e.g. /home)
2. "userPrompt": The user's request (e.g. "Add a Gallery Preview")
3. "sitemapPaths": A list of all available pages in the system

## GOAL
Identify if the user's request OR the page logic implies a need for content from another page.

## EXAMPLES
- User says "Add Gallery Preview" -> Dependency: "/gallery" or "/fotos"
- User says "Add Team Section" -> Dependency: "/team" or "/ueber-uns"
- User says "Show latest news" -> Dependency: "/news" or "/aktuelles"
- User says "Make it punchier" -> No dependency (Visual/Text only)

## RULES
1. Return JSON: { "dependencies": ["/path1", "/path2"], "reason": "string" }
2. Only return dependencies that exist in "sitemapPaths".
3. If no dependency is needed, return empty array.
4. BE SMART: If the prompt implies summarizing other content, find the source of that content.
`;

export function buildDependencyPrompt(targetPath: string, userPrompt: string, sitemapPaths: string[]) {
   return [
      { role: 'system', content: DEPENDENCY_DETECTION_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ targetPath, userPrompt, sitemapPaths }) }
   ];
}

export const BULK_DEPENDENCY_DETECTION_SYSTEM_PROMPT = `You are an intelligent Dependency Analyzer.
 Your task is to analyze a LIST of pages and determine if any of them need content from OTHER pages in the sitemap.
 
 ## INPUT
 1. "pages": Array of { path, sections }
 2. "sitemapPaths": List of all available pages
 
 ## GOAL
 For EACH page, identify strict content dependencies. Use the section titles and types to infer needs (e.g. "Featured Projects" needs "/projects").
 
 ## RULES
 1. Return JSON map: { "results": [{ "path": "/foo", "dependencies": ["/bar"] }] }
 2. Only return dependencies that exist in "sitemapPaths".
 3. Eliminate self-references.
 `;

export function buildBulkDependencyPrompt(pages: { path: string, sections: string[] }[], sitemapPaths: string[]) {
   return [
      { role: 'system', content: BULK_DEPENDENCY_DETECTION_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify({ pages, sitemapPaths }) }
   ];
}

// buildRegenerationPrompt moved to engineering.ts to prevent shadowing issues
