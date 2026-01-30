# Content-Type Detection - Automatische Cluster-Differenzierung

## 🎯 Problem

**Frage:** Sind `/de/blog/tag/[tag]` und `/de/blog/[article]` dasselbe?

**URL sagt:** JA (beide unter `/blog/`)
**Content sagt:** NEIN (verschiedene Zwecke)

```
/de/blog/tag/business-analytics     → Tag-Übersichtsseite (Liste von Artikeln)
/de/advanced-analytics-mit-r-und-sap → Artikel (Content)
```

**Lösung:** KI soll durch **Content-Vergleich** entscheiden, ob Merge sinnvoll ist!

---

## 🧮 Content-Type Detection Algorithmus

### Phase 1: Sample Selection

**Für jedes Cluster:** Nimm 3-5 Beispielseiten

```typescript
Cluster A: /de/blog/tag/[tag] (40 Seiten)
  Samples:
  - /de/blog/tag/business-analytics
  - /de/blog/tag/sapscript
  - /de/blog/tag/sap-hana

Cluster B: /de/blog/[article] (69 Seiten)
  Samples:
  - /de/advanced-analytics-mit-r-und-sap
  - /de/business-analytics-vs-business-intelligence
  - /de/data-plattform-ein-wichtiger-pfeiler-der-digitalen-transformation
```

---

### Phase 2: Content Profile Extraction

**Für jede Sample-Seite:** Extrahiere Content-Signatur

```typescript
interface ContentProfile {
    url: string;
    wordCount: number;
    imageCount: number;
    hasLinks: boolean;
    linkCount: number;
    headingStructure: { h1: number, h2: number, h3: number };
    hasAuthor: boolean;
    hasDate: boolean;
    hasPagination: boolean;
    hasFilters: boolean;
    textToLinkRatio: number;
}

// Beispiel: Tag-Seite
{
    url: "/de/blog/tag/business-analytics",
    wordCount: 150,           // Kurz (nur Intro)
    imageCount: 0,            // Keine Bilder
    linkCount: 25,            // Viele Links zu Artikeln
    headingStructure: { h1: 1, h2: 0, h3: 0 },  // Flach
    hasAuthor: false,         // Kein Autor
    hasDate: false,           // Kein Datum
    hasPagination: true,      // Hat "Seite 1, 2, 3..."
    hasFilters: true,         // Hat Filter (Jahr, Kategorie)
    textToLinkRatio: 0.15     // Sehr niedrig (viele Links, wenig Text)
}

// Beispiel: Artikel
{
    url: "/de/advanced-analytics-mit-r-und-sap",
    wordCount: 1200,          // Lang (echter Content)
    imageCount: 3,            // Bilder im Artikel
    linkCount: 8,             // Wenige Links (nur References)
    headingStructure: { h1: 1, h2: 5, h3: 8 },  // Tief strukturiert
    hasAuthor: true,          // Hat Autor
    hasDate: true,            // Publikationsdatum
    hasPagination: false,     // Keine Pagination
    hasFilters: false,        // Keine Filter
    textToLinkRatio: 3.5      // Hoch (viel Text, wenig Links)
}
```

---

### Phase 3: AI Content-Type Classification

**AI Prompt:**

```
Du bekommst 2 Cluster mit jeweils 3 Beispiel-Seiten.
Analysiere den Content und entscheide:

1. Sind die Cluster GLEICH oder UNTERSCHIEDLICH vom Content-Typ?
2. Sollten sie GEMERGED oder SEPARATE bleiben?

=== CLUSTER A ===
Pattern: /de/blog/tag/[tag]
Instances: 40

Sample 1: /de/blog/tag/business-analytics
- Word Count: 150
- Images: 0
- Links: 25
- Heading Structure: Flat (H1 only)
- Has Author: No
- Has Date: No
- Has Pagination: Yes
- Has Filters: Yes
- Text/Link Ratio: 0.15

Sample 2: /de/blog/tag/sapscript
- Word Count: 180
- Images: 0
- Links: 18
- Heading Structure: Flat
- Has Author: No
- Has Date: No
- Has Pagination: Yes
- Has Filters: Yes
- Text/Link Ratio: 0.22

Sample 3: /de/blog/tag/sap-hana
- Word Count: 140
- Images: 0
- Links: 30
- Heading Structure: Flat
- Has Author: No
- Has Date: No
- Has Pagination: Yes
- Has Filters: Yes
- Text/Link Ratio: 0.12

=== CLUSTER B ===
Pattern: /de/blog/[article]
Instances: 69

Sample 1: /de/advanced-analytics-mit-r-und-sap
- Word Count: 1200
- Images: 3
- Links: 8
- Heading Structure: Deep (H1/H2/H3)
- Has Author: Yes (Max Mustermann)
- Has Date: Yes (2023-05-15)
- Has Pagination: No
- Has Filters: No
- Text/Link Ratio: 3.5

Sample 2: /de/business-analytics-vs-business-intelligence
- Word Count: 980
- Images: 2
- Links: 12
- Heading Structure: Deep
- Has Author: Yes (Jane Doe)
- Has Date: Yes (2023-04-20)
- Has Pagination: No
- Has Filters: No
- Text/Link Ratio: 2.8

Sample 3: /de/data-plattform-ein-wichtiger-pfeiler
- Word Count: 1500
- Images: 4
- Links: 10
- Heading Structure: Deep
- Has Author: Yes (John Smith)
- Has Date: Yes (2023-06-01)
- Has Pagination: No
- Has Filters: No
- Text/Link Ratio: 4.2

=== FRAGE ===
Sind Cluster A und B vom selben Content-Typ?
Sollten sie gemerged werden?

Antworte im JSON-Format:
{
    "contentTypesIdentical": boolean,
    "clusterA_type": "string (taxonomy|article|landing|archive|etc)",
    "clusterB_type": "string",
    "shouldMerge": boolean,
    "confidence": number (0-100),
    "reasoning": "string",
    "differences": ["string array"],
    "recommendation": {
        "action": "merge" | "keep_separate" | "rename_cluster_a" | "rename_cluster_b",
        "targetA": "string (new pattern for A if renamed)",
        "targetB": "string (new pattern for B if renamed)"
    }
}
```

---

### Phase 4: AI Response (Beispiel)

```json
{
    "contentTypesIdentical": false,
    "clusterA_type": "taxonomy",
    "clusterB_type": "article",
    "shouldMerge": false,
    "confidence": 95,
    "reasoning": "Cluster A consists of tag overview pages (taxonomy/archive pages) with minimal content and many links to articles. Cluster B consists of full blog articles with substantial content, authors, and dates. These serve completely different purposes and should remain separate.",
    "differences": [
        "Word count: A=150 avg, B=1200 avg (8x difference)",
        "Text/Link ratio: A=0.16 avg, B=3.5 avg (20x difference)",
        "Has author/date: A=no, B=yes",
        "Has pagination/filters: A=yes, B=no",
        "Purpose: A=navigation/discovery, B=content consumption"
    ],
    "recommendation": {
        "action": "rename_cluster_a",
        "targetA": "/blog/tags/[slug]",
        "targetB": "/blog/[slug]",
        "rationale": "Keep articles at /blog/[slug] and move tag pages to /blog/tags/[slug] for clarity"
    }
}
```

---

## 🔧 Implementation

### Step 1: Sample Extraction

**Datei:** `src/modules/core/utils/cluster-comparator.ts` (NEU)

```typescript
export class ClusterComparator {
    /**
     * Extract content profiles from cluster samples
     */
    static extractProfiles(
        cluster: ClusterCandidate,
        structure: SiteStructure,
        sampleSize: number = 3
    ): ContentProfile[] {
        // Select representative samples (first, middle, last)
        const samples = this.selectSamples(cluster.urls, sampleSize);

        return samples.map(url => {
            const node = structure.nodes.find(n => n.url === url);
            if (!node) return null;

            return {
                url,
                wordCount: node.content.wordCount || 0,
                imageCount: node.content.images?.length || 0,
                linkCount: node.content.links?.length || 0,
                headingStructure: this.analyzeHeadings(node.content.headings),
                hasAuthor: this.detectAuthor(node),
                hasDate: this.detectDate(node),
                hasPagination: this.detectPagination(node),
                hasFilters: this.detectFilters(node),
                textToLinkRatio: this.calculateTextToLinkRatio(node)
            };
        }).filter(Boolean) as ContentProfile[];
    }

    private static selectSamples(urls: string[], count: number): string[] {
        if (urls.length <= count) return urls;

        const indices = [
            0,                                    // First
            Math.floor(urls.length / 2),         // Middle
            urls.length - 1                      // Last
        ];

        // If need more, add evenly distributed samples
        while (indices.length < count && indices.length < urls.length) {
            const gap = urls.length / (count + 1);
            indices.push(Math.floor(gap * indices.length));
        }

        return indices.slice(0, count).map(i => urls[i]);
    }

    private static analyzeHeadings(headings: any[] = []): HeadingStructure {
        return {
            h1: headings.filter(h => h.level === 1).length,
            h2: headings.filter(h => h.level === 2).length,
            h3: headings.filter(h => h.level === 3).length
        };
    }

    private static detectAuthor(node: SiteNode): boolean {
        // Check for author in schema markup
        if (node.meta.schemaMarkup?.some(schema =>
            schema.includes('author') || schema.includes('Person')
        )) {
            return true;
        }

        // Check for author in links
        if (node.content.links?.some(link =>
            link.href.includes('/author/') || link.text.toLowerCase().includes('autor')
        )) {
            return true;
        }

        return false;
    }

    private static detectDate(node: SiteNode): boolean {
        // Check for date in schema markup
        if (node.meta.schemaMarkup?.some(schema =>
            schema.includes('datePublished') || schema.includes('dateModified')
        )) {
            return true;
        }

        return false;
    }

    private static detectPagination(node: SiteNode): boolean {
        // Check for pagination links
        return node.content.links?.some(link =>
            link.href.includes('page=') ||
            link.text.match(/^\d+$/) || // Numbers only
            link.text.toLowerCase().includes('nächste') ||
            link.text.toLowerCase().includes('previous')
        ) || false;
    }

    private static detectFilters(node: SiteNode): boolean {
        // Check for filter elements (forms with select/checkboxes)
        return (node.content.forms?.length || 0) > 0;
    }

    private static calculateTextToLinkRatio(node: SiteNode): number {
        const wordCount = node.content.wordCount || 0;
        const linkCount = node.content.links?.length || 0;

        if (linkCount === 0) return wordCount > 0 ? 999 : 0;
        return wordCount / linkCount;
    }
}
```

---

### Step 2: AI Comparison Prompt

**Datei:** `src/modules/core/prompts/cluster-analysis.ts` (NEU)

```typescript
export function buildClusterComparisonPrompt(
    clusterA: ClusterCandidate,
    clusterB: ClusterCandidate,
    profilesA: ContentProfile[],
    profilesB: ContentProfile[]
): any[] {
    const prompt = `You are analyzing two URL clusters to determine if they represent the same content type.

=== CLUSTER A ===
Pattern: ${clusterA.pattern}
Total Pages: ${clusterA.instanceCount}

Sample Profiles:
${profilesA.map((p, i) => `
Sample ${i + 1}: ${p.url}
- Word Count: ${p.wordCount}
- Images: ${p.imageCount}
- Links: ${p.linkCount}
- Heading Structure: H1=${p.headingStructure.h1}, H2=${p.headingStructure.h2}, H3=${p.headingStructure.h3}
- Has Author: ${p.hasAuthor ? 'Yes' : 'No'}
- Has Date: ${p.hasDate ? 'Yes' : 'No'}
- Has Pagination: ${p.hasPagination ? 'Yes' : 'No'}
- Has Filters: ${p.hasFilters ? 'Yes' : 'No'}
- Text/Link Ratio: ${p.textToLinkRatio.toFixed(2)}
`).join('\n')}

=== CLUSTER B ===
Pattern: ${clusterB.pattern}
Total Pages: ${clusterB.instanceCount}

Sample Profiles:
${profilesB.map((p, i) => `
Sample ${i + 1}: ${p.url}
- Word Count: ${p.wordCount}
- Images: ${p.imageCount}
- Links: ${p.linkCount}
- Heading Structure: H1=${p.headingStructure.h1}, H2=${p.headingStructure.h2}, H3=${p.headingStructure.h3}
- Has Author: ${p.hasAuthor ? 'Yes' : 'No'}
- Has Date: ${p.hasDate ? 'Yes' : 'No'}
- Has Pagination: ${p.hasPagination ? 'Yes' : 'No'}
- Has Filters: ${p.hasFilters ? 'Yes' : 'No'}
- Text/Link Ratio: ${p.textToLinkRatio.toFixed(2)}
`).join('\n')}

=== TASK ===
Analyze the content profiles and determine:
1. Are these the same content type?
2. Should they be merged or kept separate?
3. What is the purpose of each cluster?

Return JSON:
{
    "contentTypesIdentical": boolean,
    "clusterA_type": "taxonomy" | "article" | "landing" | "archive" | "product" | "service" | "other",
    "clusterB_type": "taxonomy" | "article" | "landing" | "archive" | "product" | "service" | "other",
    "shouldMerge": boolean,
    "confidence": number,
    "reasoning": "detailed explanation",
    "differences": ["array of key differences"],
    "recommendation": {
        "action": "merge" | "keep_separate" | "rename_cluster_a" | "rename_cluster_b",
        "targetA": "suggested pattern for A (if rename needed)",
        "targetB": "suggested pattern for B (if rename needed)",
        "rationale": "why this recommendation"
    }
}`;

    return [
        { role: 'system', content: 'You are a content type analysis expert. Analyze clusters based on content characteristics, not just URL patterns.' },
        { role: 'user', content: prompt }
    ];
}
```

---

### Step 3: Integration in Clustering Flow

**Datei:** `src/modules/core/utils/grouping.ts` (UPDATE)

```typescript
export function groupSimilarPages(
    structure: SiteStructure,
    maxExamplesPerPattern: number = 3,
    minClusterSize: number = 5,
    overrides: ClusterOverrides = {}
): GroupedStructure {
    // ... existing clustering logic ...

    // NEW: Post-clustering content-type analysis
    const clusters = Array.from(patternMap.entries()).map(([pattern, pages]) => ({
        pattern,
        urls: pages.map(p => p.url),
        instanceCount: pages.length
    }));

    // Find potential conflicts (similar URL patterns but different content?)
    const conflictingClusters = detectConflictingClusters(clusters);

    if (conflictingClusters.length > 0) {
        console.log(`🔍 [ContentTypeDetection] Analyzing ${conflictingClusters.length} potential conflicts...`);

        // For each conflict pair, run AI comparison
        for (const { clusterA, clusterB } of conflictingClusters) {
            const profilesA = ClusterComparator.extractProfiles(clusterA, structure);
            const profilesB = ClusterComparator.extractProfiles(clusterB, structure);

            // Ask AI
            const comparison = await analyzeClusterSimilarity(
                clusterA, clusterB, profilesA, profilesB
            );

            if (!comparison.shouldMerge && comparison.recommendation.action.includes('rename')) {
                // Rename cluster patterns based on AI recommendation
                console.log(`  📝 Renaming ${clusterA.pattern} → ${comparison.recommendation.targetA}`);
                console.log(`  📝 Renaming ${clusterB.pattern} → ${comparison.recommendation.targetB}`);

                // Update pattern map
                updatePatternNames(patternMap, comparison);
            }
        }
    }

    // ... continue with existing logic ...
}

function detectConflictingClusters(clusters: ClusterCandidate[]): Array<{clusterA: ClusterCandidate, clusterB: ClusterCandidate}> {
    const conflicts: Array<{clusterA: ClusterCandidate, clusterB: ClusterCandidate}> = [];

    for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
            const a = clusters[i];
            const b = clusters[j];

            // Check if patterns share common prefix
            const prefixA = a.pattern.split('/').slice(0, -1).join('/');
            const prefixB = b.pattern.split('/').slice(0, -1).join('/');

            if (prefixA === prefixB) {
                // Potential conflict: /blog/tag/[x] vs /blog/[x]
                conflicts.push({ clusterA: a, clusterB: b });
            }
        }
    }

    return conflicts;
}
```

---

## 📊 Beispiel-Output

### Input: cubeserv.com Blog

```
Detected Conflicts:
  /de/blog/tag/[tag] (40) vs /de/blog/[article] (69)
```

### AI Analysis:

```json
{
    "contentTypesIdentical": false,
    "clusterA_type": "taxonomy",
    "clusterB_type": "article",
    "shouldMerge": false,
    "confidence": 95,
    "reasoning": "Cluster A are tag archive pages with minimal content (150 words avg) and high link density (25 links avg). Cluster B are full blog articles with substantial content (1200 words avg) and low link density (8 links avg). Different purposes: navigation vs content.",
    "differences": [
        "Word count: 150 vs 1200 (8x)",
        "Text/link ratio: 0.16 vs 3.5 (21x)",
        "Has author/date: no vs yes",
        "Has pagination: yes vs no"
    ],
    "recommendation": {
        "action": "rename_cluster_a",
        "targetA": "/blog/tags/[slug]",
        "targetB": "/blog/[slug]",
        "rationale": "Separate tag pages to /blog/tags/ for clarity and SEO"
    }
}
```

### Output: Updated Clusters

```
✅ /de/blog/[article]     → /blog/[slug]       (69 articles)
✅ /de/blog/tag/[tag]     → /blog/tags/[slug]  (40 tag pages)
```

---

## ✅ Integration Checklist

### 1. Stelle sicher: Content Profile Extraction funktioniert

**Check in Crawler:**
```typescript
// Prüfe ob genug Daten gecrawlt werden
node.content.links        // Brauchen wir für Link Count
node.content.headings     // Brauchen wir für Struktur-Analyse
node.meta.schemaMarkup    // Brauchen wir für Author/Date-Detection
```

**Falls fehlend:** Crawler-Update nötig!

---

### 2. Füge AI-Endpoint hinzu

**Datei:** `src/modules/core/ai-service.ts`

```typescript
async compareClusterContentTypes(
    clusterA: ClusterCandidate,
    clusterB: ClusterCandidate,
    structure: SiteStructure
): Promise<ClusterComparisonResult> {
    const profilesA = ClusterComparator.extractProfiles(clusterA, structure, 3);
    const profilesB = ClusterComparator.extractProfiles(clusterB, structure, 3);

    const messages = buildClusterComparisonPrompt(
        clusterA, clusterB, profilesA, profilesB
    );

    return this.callAI(messages, AI_MODELS.default, 'Cluster Content-Type Comparison');
}
```

---

### 3. Test mit cubeserv.com

```typescript
const clusters = detectClusters(cubeservStructure);

// Should detect:
const blogArticles = clusters.find(c => c.pattern === '/de/blog/[article]');
const blogTags = clusters.find(c => c.pattern === '/de/blog/tag/[tag]');

const comparison = await ai.compareClusterContentTypes(
    blogArticles, blogTags, cubeservStructure
);

expect(comparison.shouldMerge).toBe(false);
expect(comparison.recommendation.action).toBe('rename_cluster_a');
```

---

## 🎯 Zusammenfassung

### Problem gelöst:

**Vorher:** URL-basiertes Clustering
```
/de/blog/tag/[tag] + /de/blog/[article] → EIN Cluster (weil beide /blog/)
```

**Nachher:** Content-basierte Differenzierung
```
AI analysiert Content-Profile
→ Erkennt: Taxonomy vs Article
→ Empfiehlt: Separate Cluster
→ /blog/tags/[slug] vs /blog/[slug]
```

### Funktioniert bei dir?

**JA, wenn:**
1. ✅ Crawler sammelt `links`, `headings`, `schemaMarkup`
2. ✅ AI-Service hat `compareClusterContentTypes` Methode
3. ✅ Grouping nutzt Conflict-Detection

**Nächste Schritte:**
1. Prüfe Crawler-Output (hat er alle Daten?)
2. Implementiere ClusterComparator
3. Test mit cubeserv.com

**Soll ich jetzt prüfen, ob dein aktueller Code das unterstützt?**
