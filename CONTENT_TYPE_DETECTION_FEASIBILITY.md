# Content-Type Detection - Feasibility-Analyse

## 🎯 Frage

Kann das Content-Type-Detection-System (siehe `CONTENT_TYPE_DETECTION.md`) mit dem aktuellen Code umgesetzt werden?

**Antwort: JA - zu 80% bereits unterstützt!**

Nur 1 neuer Prompt + 1 neue Service-Klasse nötig.

---

## ✅ Was IST bereits vorhanden

### 1. Daten-Sammlung (100% ✓)

**Crawler sammelt alle nötigen Daten:**

```typescript
// extractor.ts - Zeilen 667, 748, 808, 1100-1101
headings: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']  ✓

// extractor.ts - Zeile 251 (laut Grep)
links: [...]                                     ✓

// extractor.ts - Zeilen 704-711
schemaMarkup: ['Article', 'Product', ...]        ✓

// Bereits im Content-Objekt
wordCount, images, forms                         ✓
```

**➜ Alle Daten für Content-Profil-Extraktion vorhanden!**

---

### 2. Cluster-Analyse Pattern (80% ✓)

**Bestehender Prompt:** `CLUSTER_COMPONENT_LIBRARY_SYSTEM_PROMPT`

```typescript
// src/modules/core/prompts/analysis.ts - Zeilen 214-252
export const CLUSTER_COMPONENT_LIBRARY_SYSTEM_PROMPT = `...
Your task is to analyze a set of sample pages from a website cluster...
Examine the 5-10 HTML samples provided. Identify recurring UI patterns...
`;
```

**Dieser Prompt:**
- ✓ Analysiert bereits 5-10 Samples aus einem Cluster
- ✓ Extrahiert strukturelle Muster
- ✓ Identifiziert wiederkehrende Elemente

**➜ Gleiche Technik kann für Cluster-Vergleich genutzt werden!**

---

### 3. AI-Service Infrastructure (100% ✓)

**Bestehende Methoden:**

```typescript
// src/modules/core/ai-service.ts
static async callAI(messages, model, logLabel)   ✓
static async generateMigrationPlan(...)           ✓
static async generatePageSpecs(...)               ✓
```

**➜ AI-Call-Infrastruktur vorhanden, kann neue Methode `compareClusterContentTypes()` hinzufügen!**

---

## ⚠️ Was FEHLT noch

### 1. Cluster-Comparison Prompt (NEU)

**Aktuell:** Kein Prompt für "Sind Cluster A und B semantisch gleich?"

**Nötig:** Neuer Prompt `CLUSTER_CONTENT_TYPE_COMPARISON_PROMPT`

```typescript
// Neu in: src/modules/core/prompts/analysis.ts
export const CLUSTER_CONTENT_TYPE_COMPARISON_PROMPT = `You are a Content Type Analyst.

## TASK
Compare two clusters of pages to determine if they represent the SAME or DIFFERENT content types.

## INPUT
1. **Cluster A Samples**: 3-5 content profiles from Cluster A
2. **Cluster B Samples**: 3-5 content profiles from Cluster B

Each profile contains:
- URL, Title, Word Count
- Headings, Links, Schema Markup
- Images, Forms, Content Snippets

## OUTPUT
Return JSON only:
{
  "decision": "SAME_TYPE" | "DIFFERENT_TYPE",
  "confidence": 0-100,
  "cluster_a_type": "string (e.g. 'article', 'taxonomy', 'product')",
  "cluster_b_type": "string",
  "evidence": {
    "similarities": ["string"],
    "differences": ["string"]
  },
  "recommendation": "MERGE" | "KEEP_SEPARATE",
  "reasoning": "string (German)"
}

## GUIDELINES
- **Articles**: High word count, rich content, unique titles, Article schema
- **Taxonomy Pages**: Low word count, many links, generic titles, CollectionPage schema
- **Product Pages**: Structured data, forms, prices, Product schema
- **Landing Pages**: Mixed content, CTAs, unique structure

## EXAMPLES
### Example 1: SAME TYPE
Cluster A: /de/blog/tag/analytics (300 words, 20 links to articles, generic title)
Cluster B: /de/category/business (280 words, 18 links to articles, generic title)
→ decision: "SAME_TYPE", recommendation: "MERGE"

### Example 2: DIFFERENT TYPE
Cluster A: /de/blog/tag/analytics (300 words, 20 links)
Cluster B: /de/blog/advanced-analytics-guide (2500 words, 5 images, Article schema)
→ decision: "DIFFERENT_TYPE", recommendation: "KEEP_SEPARATE"
`;

export function buildClusterComparisonPrompt(
  clusterA: { pattern: string, samples: ContentProfile[] },
  clusterB: { pattern: string, samples: ContentProfile[] }
) {
  return [
    { role: 'system', content: CLUSTER_CONTENT_TYPE_COMPARISON_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        cluster_a: { pattern: clusterA.pattern, samples: clusterA.samples.slice(0, 5) },
        cluster_b: { pattern: clusterB.pattern, samples: clusterB.samples.slice(0, 5) }
      }, null, 2)
    }
  ];
}
```

---

### 2. ClusterComparator Service (NEU)

**Nötig:** Neue Datei `src/modules/analysis/services/cluster-comparator.ts`

```typescript
import { SiteStructure, SiteNode } from '@/types';
import { AIService } from '@/modules/core/ai-service';

export interface ContentProfile {
  url: string;
  title: string;
  wordCount: number;
  headings: string[];
  linkCount: number;
  schemaTypes: string[];
  imageCount: number;
  hasForm: boolean;
}

export interface ClusterComparisonResult {
  decision: 'SAME_TYPE' | 'DIFFERENT_TYPE';
  confidence: number;
  cluster_a_type: string;
  cluster_b_type: string;
  evidence: {
    similarities: string[];
    differences: string[];
  };
  recommendation: 'MERGE' | 'KEEP_SEPARATE';
  reasoning: string;
}

export class ClusterComparator {
  /**
   * Extrahiert Content-Profile aus Cluster-Instanzen
   */
  static extractContentProfiles(
    clusterInstances: SiteNode[],
    limit: number = 5
  ): ContentProfile[] {
    // Sortiere nach wordCount (60. Perzentil-Strategie)
    const sorted = [...clusterInstances].sort((a, b) =>
      (b.content.wordCount || 0) - (a.content.wordCount || 0)
    );

    // Nimm mittlere 5 Beispiele (repräsentativ)
    const startIndex = Math.floor(sorted.length * 0.3);
    const selected = sorted.slice(startIndex, startIndex + limit);

    return selected.map(node => ({
      url: node.url,
      title: node.meta.title || '',
      wordCount: node.content.wordCount || 0,
      headings: node.content.headings || [],
      linkCount: node.content.links?.length || 0,
      schemaTypes: node.meta.schemaMarkup || [],
      imageCount: node.content.images?.length || 0,
      hasForm: (node.content.forms?.length || 0) > 0
    }));
  }

  /**
   * Vergleicht zwei Cluster per AI
   */
  static async compareClusterContentTypes(
    clusterA: { pattern: string, instances: SiteNode[] },
    clusterB: { pattern: string, instances: SiteNode[] }
  ): Promise<ClusterComparisonResult> {
    const samplesA = this.extractContentProfiles(clusterA.instances, 5);
    const samplesB = this.extractContentProfiles(clusterB.instances, 5);

    const messages = [
      {
        role: 'system',
        content: `You are a Content Type Analyst...` // (Prompt von oben)
      },
      {
        role: 'user',
        content: JSON.stringify({
          cluster_a: { pattern: clusterA.pattern, samples: samplesA },
          cluster_b: { pattern: clusterB.pattern, samples: samplesB }
        }, null, 2)
      }
    ];

    const result = await AIService.callAI(messages, 'sonnet', 'Cluster Comparison');
    return result as ClusterComparisonResult;
  }

  /**
   * Findet konfliktäre Cluster (gleiche Basis-URL, verschiedene Sub-Patterns)
   */
  static findConflictingClusters(
    clusters: { pattern: string, instances: SiteNode[] }[]
  ): { clusterA: any, clusterB: any }[] {
    const conflicts: { clusterA: any, clusterB: any }[] = [];

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const patternA = clusters[i].pattern;
        const patternB = clusters[j].pattern;

        // Gleiche Basis-URL?
        // z.B. /de/blog/tag/[tag] vs /de/blog/[article]
        const baseA = patternA.split('/').slice(0, -1).join('/');
        const baseB = patternB.split('/').slice(0, -1).join('/');

        if (baseA === baseB && patternA !== patternB) {
          conflicts.push({
            clusterA: clusters[i],
            clusterB: clusters[j]
          });
        }
      }
    }

    return conflicts;
  }
}
```

---

### 3. Integration in Grouping (UPDATE)

**Datei:** `src/modules/core/utils/grouping.ts`

**Änderung:** Nach Clustering → Konflikt-Erkennung → AI-Vergleich → Merge/Split

```typescript
// Zeile ~200 (nach Clustering)
export async function createAIOptimizedStructure(
  structure: SiteStructure,
  overrides: any = {},
  tier: number = 0
) {
  // ... bestehende Logik ...

  // NEU: Konflikt-Erkennung & Content-Type-Vergleich
  const conflicts = ClusterComparator.findConflictingClusters(
    Object.values(archetypes).map(arch => ({
      pattern: arch.pattern,
      instances: arch.instances
    }))
  );

  console.log(`🔍 Found ${conflicts.length} conflicting cluster pairs`);

  // AI-gestützter Vergleich
  for (const conflict of conflicts) {
    const comparison = await ClusterComparator.compareClusterContentTypes(
      conflict.clusterA,
      conflict.clusterB
    );

    console.log(`📊 Cluster Comparison:
      ${conflict.clusterA.pattern} (${comparison.cluster_a_type})
      vs
      ${conflict.clusterB.pattern} (${comparison.cluster_b_type})
      → ${comparison.recommendation} (${comparison.confidence}% confident)
    `);

    if (comparison.recommendation === 'MERGE' && comparison.confidence > 70) {
      // Merge Cluster B in Cluster A
      // ... Merge-Logik ...
    }
  }

  // ... Rest der Funktion ...
}
```

---

## 📊 Implementierungs-Aufwand

| Task | Aufwand | Datei | Status |
|------|---------|-------|--------|
| Prompt hinzufügen | 30 Min | `prompts/analysis.ts` | ⏳ Neu |
| ClusterComparator Service | 2h | `services/cluster-comparator.ts` | ⏳ Neu |
| Integration in grouping.ts | 1h | `utils/grouping.ts` | 🔄 Update |
| Unit Tests | 1h | `__tests__/cluster-comparator.test.ts` | ⏳ Neu |
| **GESAMT** | **~4-5h** | | |

---

## ✅ Beispiel-Flow (cubeserv.com)

**Input:**
```typescript
Cluster A: /de/blog/tag/[tag] (40 Seiten)
Cluster B: /de/blog/[article] (69 Seiten)
```

**Step 1: Konflikt-Erkennung**
```typescript
ClusterComparator.findConflictingClusters(clusters)
→ [{ clusterA: '/de/blog/tag/[tag]', clusterB: '/de/blog/[article]' }]
```

**Step 2: Content-Profile extrahieren**
```typescript
Cluster A Samples (5 Beispiele):
[
  {
    url: '/de/blog/tag/business-analytics',
    title: 'Business Analytics',
    wordCount: 280,
    headings: ['Business Analytics', 'Verwandte Artikel'],
    linkCount: 22,
    schemaTypes: ['CollectionPage'],
    imageCount: 0,
    hasForm: false
  },
  ...
]

Cluster B Samples (5 Beispiele):
[
  {
    url: '/de/advanced-analytics-mit-r-und-sap',
    title: 'Advanced Analytics mit R und SAP',
    wordCount: 2500,
    headings: ['Einführung', 'Technische Details', 'Fazit'],
    linkCount: 5,
    schemaTypes: ['Article'],
    imageCount: 8,
    hasForm: true
  },
  ...
]
```

**Step 3: AI-Vergleich**
```json
{
  "decision": "DIFFERENT_TYPE",
  "confidence": 95,
  "cluster_a_type": "taxonomy",
  "cluster_b_type": "article",
  "evidence": {
    "similarities": [
      "Beide unter /de/blog/"
    ],
    "differences": [
      "Cluster A: Generische Titel, viele Links (Ø22), wenig Content (Ø280 Wörter), CollectionPage Schema",
      "Cluster B: Unique Titel, wenig Links (Ø5), viel Content (Ø2500 Wörter), Article Schema",
      "Cluster A hat keine Bilder, Cluster B Ø8 Bilder pro Seite"
    ]
  },
  "recommendation": "KEEP_SEPARATE",
  "reasoning": "Cluster A sind taxonomische Übersichtsseiten (Tag-Seiten), Cluster B sind eigenständige Artikel. Unterschiedliche Content-Typen, verschiedene Templates nötig."
}
```

**Step 4: Entscheidung**
```typescript
if (comparison.recommendation === 'KEEP_SEPARATE') {
  // NICHT mergen
  // Cluster A → /blog/tags/[slug]
  // Cluster B → /blog/[slug]
}
```

---

## 🎯 Ergebnis

**Aktuelle System-Unterstützung:**

| Feature | Status | Kommentar |
|---------|--------|-----------|
| Daten-Sammlung | ✅ 100% | Headings, Links, SchemaMarkup vorhanden |
| Cluster-Analyse-Pattern | ✅ 80% | Bestehender Prompt kann angepasst werden |
| AI-Infrastruktur | ✅ 100% | callAI(), Service-Pattern vorhanden |
| **Comparison Prompt** | ❌ 0% | **Muss neu erstellt werden** |
| **ClusterComparator Service** | ❌ 0% | **Muss neu erstellt werden** |
| **Grouping Integration** | 🔄 20% | **Update nötig** |

**➜ Gesamtunterstützung: ~60% bereits vorhanden!**

---

## 🚀 Empfehlung

**JA, umsetzen!**

Gründe:
1. ✅ **60% Code bereits da** - Nur 3 neue Dateien/Updates nötig
2. ✅ **Klarer Use-Case** - cubeserv.com `/de/blog/tag/` vs `/de/blog/` ist real
3. ✅ **Geringer Aufwand** - ~4-5h für vollständige Implementierung
4. ✅ **Wiederverwendbar** - System funktioniert für alle Sites mit ähnlichen Konflikten

**Alternative (Quick-Fix ohne AI):**
- Heuristik: "Wenn Pattern `/X/Y/` und `/X/` existieren → Y ist Sub-Kategorie"
- Weniger präzise, aber 0h Aufwand
- Beispiel: `/de/blog/tag/` → Tag-Seiten (automatisch als Taxonomy erkannt)

---

## 📋 Nächste Schritte

**Option A: Full Implementation (empfohlen)**
1. Prompt in `analysis.ts` hinzufügen (30 Min)
2. `cluster-comparator.ts` erstellen (2h)
3. Integration in `grouping.ts` (1h)
4. Testing mit cubeserv.com (1h)

**Option B: Heuristik-basiert (schnell)**
1. Pattern-Analyse in `grouping.ts` erweitern (1h)
2. Regel: "Sub-Pattern → Separate Cluster" (30 Min)
3. Testing (30 Min)

**Was bevorzugst du?** 🤔
