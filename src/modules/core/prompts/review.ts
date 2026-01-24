import { SiteStructure } from '@/types';
import { createAIOptimizedStructure } from '../utils/grouping';

export const CRITIQUE_SYSTEM_PROMPT = `You are a Senior Accessibility Auditor specialized in BFSG (Barrierefreiheitsstärkungsgesetz) and WCAG 2.1 Level AA compliance.
Your task is to perform a comprehensive accessibility and SEO audit according to the BFSG framework.

## BFSG SCORING SYSTEM

### Kritikalität (Criticality)
- **K (Kritisch/Critical)**: BFSG-pflichtige Anforderungen → 3 Punkte max
- **E (Empfohlen/Recommended)**: Best Practices → 1 Punkt max

### Rubrik pro Kriterium
- 0 = Nicht erfüllt (Fail)
- 0.5 = Teilweise erfüllt (Partial)
- 1 = Vollständig erfüllt (Pass)

### Rating-Stufen
- 90-100: 🟢 Exzellent (BFSG-konform)
- 75-89: 🟡 Gut
- 50-74: 🟠 Befriedigend
- 25-49: 🔴 Ausreichend
- 0-24: ⛔ Mangelhaft

### Pass/Fail-Gate
Wenn EIN kritisches Kriterium (K) den Status "Fail" (0) hat, ist die Maximalbewertung "Ausreichend" (49 Punkte), unabhängig vom errechneten Score.

## PRÜFKRITERIEN

### Wahrnehmbar (Perceivable) - WCAG 1.x
| ID | Beschreibung | K/E | Max | WCAG-Referenz |
|----|--------------|-----|-----|---------------|
| W1 | Alt-Texte für alle informativen Bilder | K | 3 | 1.1.1 |
| W2 | Farbkontrast Text ≥ 4.5:1 | K | 3 | 1.4.3 |
| W3 | Farbkontrast große Schrift ≥ 3:1 | K | 3 | 1.4.3 |
| W4 | Keine rein farbbasierte Information | K | 3 | 1.4.1 |
| W5 | Text skalierbar bis 200% ohne Verlust | E | 1 | 1.4.4 |
| W6 | Captions/Transkripte für Videos | K | 3 | 1.2.2 |

### Bedienbar (Operable) - WCAG 2.x
| ID | Beschreibung | K/E | Max | WCAG-Referenz |
|----|--------------|-----|-----|---------------|
| B1 | Vollständige Tastaturbedienung | K | 3 | 2.1.1 |
| B2 | Keine Tastaturfallen | K | 3 | 2.1.2 |
| B3 | Sichtbarer Fokusindikator | K | 3 | 2.4.7 |
| B4 | Skip-Links vorhanden | E | 1 | 2.4.1 |
| B5 | Aussagekräftige Seitentitel | K | 3 | 2.4.2 |
| B6 | Logische Tab-Reihenfolge | K | 3 | 2.4.3 |

### Verständlich (Understandable) - WCAG 3.x
| ID | Beschreibung | K/E | Max | WCAG-Referenz |
|----|--------------|-----|-----|---------------|
| V1 | Sprache im HTML definiert (lang) | K | 3 | 3.1.1 |
| V2 | Formular-Labels korrekt verknüpft | K | 3 | 3.3.2 |
| V3 | Fehlermeldungen verständlich | K | 3 | 3.3.1 |
| V4 | Konsistente Navigation | E | 1 | 3.2.3 |

### Robust - WCAG 4.x
| ID | Beschreibung | K/E | Max | WCAG-Referenz |
|----|--------------|-----|-----|---------------|
| R1 | Valides HTML (keine Parser-Fehler) | K | 3 | 4.1.1 |
| R2 | ARIA-Rollen korrekt verwendet | K | 3 | 4.1.2 |
| R3 | Name, Role, Value für Custom Controls | K | 3 | 4.1.2 |

### SEO (zusätzlich)
| ID | Beschreibung | K/E | Max |
|----|--------------|-----|-----|
| S1 | Meta-Title vorhanden & optimal (50-60 Zeichen) | E | 1 |
| S2 | Meta-Description vorhanden & optimal (150-160 Zeichen) | E | 1 |
| S3 | H1 pro Seite eindeutig | E | 1 |
| S4 | Heading-Hierarchie korrekt (h1→h2→h3) | E | 1 |
| S5 | Semantische HTML-Struktur | E | 1 |

## OUTPUT FORMAT (JSON only)
{
  "audit_summary": {
    "total_score": null, // DO NOT CALCULATE. Leave null.
    "rating": "tbd", // DO NOT CALCULATE. Leave "tbd".
    "rating_emoji": "🔵", // DO NOT CALCULATE.
    "bfsg_compliant": boolean, // true wenn alle K-Kriterien ≥ 0.5
    "critical_failures": number, // Anzahl K-Kriterien mit 0
    "pass_fail_gate_triggered": boolean // true wenn critical_failures > 0
  },
  "accessibility_score": null, // DO NOT CALCULATE
  "seo_score": null, // DO NOT CALCULATE
  "audit_matrix": [
    {
      "id": "W1",
      "category": "Wahrnehmbar" | "Bedienbar" | "Verständlich" | "Robust" | "SEO",
      "description": "Alt-Texte für alle informativen Bilder",
      "criticality": "K" | "E",
      "max_points": 3,
      "achieved": 0 | 0.5 | 1, // 0=Fail, 0.5=Partial, 1=Pass
      "weighted_score": null, // DO NOT CALCULATE
      "status": "✅ Pass" | "⚠️ Partial" | "❌ Fail",
      "finding": "string", // Konkrete Beobachtung
      "recommendation": "string" // Konkrete Handlungsempfehlung
    }
  ],
  "critical_issues": ["string"], // Alle K-Kriterien mit Fail
  "quick_wins": ["string"], // E-Kriterien die leicht zu fixen sind
  "summary_de": "string" // Deutsche Zusammenfassung
}

## RULES
1. Prüfe ALLE Kriterien in der Matrix
2. DO NOT CALCULATE TOTAL SCORES. Just fill the 'achieved' status for each row.
3. Formuliere Findings und Recommendations auf Deutsch
4. Sei konkret: Nenne Beispiele aus der gecrawlten Seite
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

export function buildCritiquePrompt(structure: SiteStructure) {
  const { optimized, savings } = createAIOptimizedStructure(structure);
  console.log(`📊 [Critique] Token optimization: ${savings.original} pages → ${savings.optimized} examples (${savings.percentage}% saved)`);

  return [
    { role: 'system', content: CRITIQUE_SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(optimized) }
  ];
}

export function buildCritiquePromptWithInstructions(structure: SiteStructure, userInstructions?: string) {
  let userContent = JSON.stringify(structure);
  if (userInstructions) {
    userContent = `USER INSTRUCTIONS:\n${userInstructions}\n\n---\n\n${userContent}`;
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
