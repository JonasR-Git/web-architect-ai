# Auto-Clustering Algorithmus - Intelligente Entscheidungsregeln

## 🎯 Ziel

**Automatisches Clustering** mit hoher Qualität, das zu 95% richtig liegt und in 5% der Fälle editierbar ist.

**Nicht:** User-Bestätigung bei jedem Cluster
**Sondern:** Intelligente Heuristiken + Nachträgliche Bearbeitung

---

## 🧮 Clustering-Entscheidungs-Matrix

### Regel 1: Minimum Cluster Size (Hard Rule)

**Schwellwert:** 3 Seiten minimum

```typescript
if (instanceCount < 3) {
    return 'unique';  // Zu wenig für ein Cluster
}
```

**Rationale:**
- 1-2 Seiten: Overhead eines Clusters lohnt sich nicht
- 3+ Seiten: Pattern wird erkennbar

**Beispiele:**
- ✅ `/blog/*` mit 75 Seiten → Cluster
- ✅ `/services/*` mit 5 Seiten → Cluster
- ❌ `/special/*` mit 2 Seiten → Unique Pages

---

### Regel 2: URL-Struktur-Konsistenz (Medium Rule)

**Schwellwert:** 80% der URLs müssen gleiches Pattern haben

```typescript
const consistencyScore = calculateUrlConsistency(urls);

if (consistencyScore < 0.8) {
    return 'unique';  // Zu inkonsistent
}

function calculateUrlConsistency(urls: string[]): number {
    const segmentCounts = urls.map(url => {
        const path = new URL(url).pathname;
        return path.split('/').filter(Boolean).length;
    });

    // Wie viele haben die gleiche Segment-Anzahl?
    const mode = getMostCommonValue(segmentCounts);
    const matchingCount = segmentCounts.filter(c => c === mode).length;

    return matchingCount / segmentCounts.length;
}
```

**Beispiele:**
```typescript
// ✅ Konsistent (100%)
[
    '/blog/post-1',      // 2 Segmente
    '/blog/post-2',      // 2 Segmente
    '/blog/post-3'       // 2 Segmente
]
// → Cluster

// ❌ Inkonsistent (33% nur 2 Segmente)
[
    '/content/blog',            // 2 Segmente
    '/content/news/update-1',   // 3 Segmente
    '/content/guides/seo/advanced'  // 4 Segmente
]
// → Unique Pages
```

---

### Regel 3: Content-Ähnlichkeit (Strong Rule)

**Schwellwert:** Word Count Variance < 50%

```typescript
const contentSimilarity = calculateContentSimilarity(pages);

if (contentSimilarity < 0.5) {
    return 'unique';  // Content zu unterschiedlich
}

function calculateContentSimilarity(pages: SiteNode[]): number {
    const wordCounts = pages.map(p => p.content.wordCount || 0);

    // Durchschnitt
    const avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;

    // Variance (Durchschnittliche Abweichung)
    const variance = wordCounts.reduce((sum, wc) => {
        return sum + Math.abs(wc - avg);
    }, 0) / wordCounts.length;

    // Similarity Score: 1 = identisch, 0 = komplett unterschiedlich
    return 1 - Math.min(variance / avg, 1);
}
```

**Beispiele:**
```typescript
// ✅ Ähnlicher Content (Variance: 10%)
[
    { url: '/blog/post-1', wordCount: 720 },
    { url: '/blog/post-2', wordCount: 680 },
    { url: '/blog/post-3', wordCount: 750 }
]
// Avg: 716, Variance: 70/716 = 10%
// → Cluster

// ❌ Unterschiedlicher Content (Variance: 150%)
[
    { url: '/content/short', wordCount: 100 },
    { url: '/content/medium', wordCount: 500 },
    { url: '/content/long', wordCount: 5000 }
]
// Avg: 1867, Variance: 2800/1867 = 150%
// → Unique Pages
```

---

### Regel 4: Pattern-Tiefe (Soft Rule)

**Schwellwert:** Bevorzuge flachere Patterns

```typescript
const patternDepth = pattern.split('/').filter(Boolean).length;

// Score-Multiplikator basierend auf Tiefe
const depthScore = {
    1: 1.2,   // /blog/[item]           → Bonus
    2: 1.0,   // /content/blog/[item]   → Neutral
    3: 0.8,   // /de/content/blog/[item]→ Malus
    4: 0.6    // Zu tief → Wahrscheinlich unique
};

finalScore *= depthScore[Math.min(patternDepth, 4)];
```

**Rationale:** Flachere Patterns sind meist semantisch sinnvoller

**Beispiele:**
- ✅ `/blog/[item]` (Tiefe 1) → Starkes Cluster
- ✅ `/content/blog/[item]` (Tiefe 2) → OK
- ⚠️ `/de/content/blog/[item]` (Tiefe 3) → Prüfen
- ❌ `/archive/2024/q1/blog/[item]` (Tiefe 4+) → Wahrscheinlich unique

---

### Regel 5: Gleichmäßige Verteilung (Anti-Outlier)

**Schwellwert:** Keine einzelnen Ausreißer-Seiten

```typescript
function hasOutliers(pages: SiteNode[]): boolean {
    const wordCounts = pages.map(p => p.content.wordCount || 0);
    const sorted = wordCounts.sort((a, b) => a - b);

    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;

    // IQR-Methode für Outlier-Detection
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = wordCounts.filter(wc => wc < lowerBound || wc > upperBound);

    // Wenn mehr als 20% Outliers → Kein gutes Cluster
    return outliers.length > wordCounts.length * 0.2;
}
```

**Beispiele:**
```typescript
// ✅ Keine Outliers
[700, 720, 680, 750, 710, 690]
// → Cluster

// ❌ 33% Outliers (2 von 6)
[700, 720, 680, 750, 710, 5000]  // 5000 = Outlier
[100, 720, 680, 750, 710, 690]   // 100 = Outlier
// → Nicht clustern (wahrscheinlich unterschiedliche Content-Typen)
```

---

## 🏆 Composite Clustering Score

**Kombiniere alle Regeln zu einem Gesamt-Score:**

```typescript
export interface ClusteringDecision {
    pattern: string;
    score: number;           // 0-100
    shouldCluster: boolean;  // true wenn >= 70
    breakdown: {
        minSize: number;      // 0-20
        consistency: number;  // 0-20
        contentSimilarity: number;  // 0-30
        depthBonus: number;   // 0-15
        noOutliers: number;   // 0-15
    };
    reason: string;
}

function evaluateCluster(
    pattern: string,
    urls: string[],
    structure: SiteStructure
): ClusteringDecision {
    const pages = urls.map(u => structure.nodes.find(n => n.url === u)).filter(Boolean) as SiteNode[];

    let score = 0;
    const breakdown = {
        minSize: 0,
        consistency: 0,
        contentSimilarity: 0,
        depthBonus: 0,
        noOutliers: 0
    };

    // 1. Minimum Size (0-20 points)
    if (urls.length >= 10) breakdown.minSize = 20;
    else if (urls.length >= 5) breakdown.minSize = 15;
    else if (urls.length >= 3) breakdown.minSize = 10;
    else return { pattern, score: 0, shouldCluster: false, breakdown, reason: 'Too few instances' };

    // 2. URL Consistency (0-20 points)
    const consistency = calculateUrlConsistency(urls);
    breakdown.consistency = Math.round(consistency * 20);

    // 3. Content Similarity (0-30 points)
    const contentSim = calculateContentSimilarity(pages);
    breakdown.contentSimilarity = Math.round(contentSim * 30);

    // 4. Depth Bonus (0-15 points)
    const depth = pattern.split('/').filter(Boolean).length;
    if (depth === 1) breakdown.depthBonus = 15;
    else if (depth === 2) breakdown.depthBonus = 10;
    else if (depth === 3) breakdown.depthBonus = 5;

    // 5. No Outliers (0-15 points)
    if (!hasOutliers(pages)) breakdown.noOutliers = 15;

    score = Object.values(breakdown).reduce((a, b) => a + b, 0);

    const shouldCluster = score >= 70;  // Threshold

    let reason = '';
    if (!shouldCluster) {
        if (breakdown.minSize < 10) reason = 'Too few instances';
        else if (breakdown.consistency < 15) reason = 'Inconsistent URL structure';
        else if (breakdown.contentSimilarity < 15) reason = 'Content too different';
        else if (breakdown.noOutliers === 0) reason = 'Contains outlier pages';
        else reason = 'Overall score too low';
    } else {
        reason = `Strong cluster: ${urls.length} pages, ${Math.round(consistency * 100)}% URL consistency, ${Math.round(contentSim * 100)}% content similarity`;
    }

    return { pattern, score, shouldCluster, breakdown, reason };
}
```

---

## 📊 Clustering-Entscheidungs-Beispiele

### Beispiel 1: Blog (✅ Starkes Cluster)

**Input:**
```typescript
Pattern: /blog/[item]
URLs: 75 Seiten
Word Counts: 680-750 (Avg: 720, Variance: 8%)
URL Consistency: 100% (alle 2 Segmente)
Depth: 1
Outliers: Keine
```

**Score-Breakdown:**
```
Min Size:          20/20 (75 Seiten)
Consistency:       20/20 (100%)
Content Sim:       30/30 (92% similarity)
Depth Bonus:       15/15 (Tiefe 1)
No Outliers:       15/15 ✓
─────────────────────────
TOTAL:             100/100 ✅ CLUSTER
```

---

### Beispiel 2: Services (✅ Gutes Cluster)

**Input:**
```typescript
Pattern: /services/[item]
URLs: 5 Seiten
Word Counts: 800-1200 (Avg: 980, Variance: 20%)
URL Consistency: 100%
Depth: 1
Outliers: Keine
```

**Score-Breakdown:**
```
Min Size:          10/20 (5 Seiten)
Consistency:       20/20 (100%)
Content Sim:       24/30 (80% similarity)
Depth Bonus:       15/15 (Tiefe 1)
No Outliers:       15/15 ✓
─────────────────────────
TOTAL:             84/100 ✅ CLUSTER
```

---

### Beispiel 3: Mixed Content (❌ Kein Cluster)

**Input:**
```typescript
Pattern: /content/[item]
URLs: 12 Seiten
Word Counts: 100, 200, 500, 5000, 600, 700, 4500, 300, 800, 200, 6000, 400
URL Consistency: 100%
Depth: 1
Outliers: 4 Seiten (33% > 20%)
```

**Score-Breakdown:**
```
Min Size:          20/20 (12 Seiten)
Consistency:       20/20 (100%)
Content Sim:        8/30 (27% similarity - hohe Variance)
Depth Bonus:       15/15 (Tiefe 1)
No Outliers:        0/15 ✗ (33% Outliers)
─────────────────────────
TOTAL:             63/100 ❌ NICHT CLUSTERN
Reason: "Contains outlier pages (33% outside normal range)"
```

---

### Beispiel 4: Tiefer Pattern (⚠️ Grenzfall)

**Input:**
```typescript
Pattern: /de/content/blog/[item]
URLs: 8 Seiten
Word Counts: 700-750
URL Consistency: 100%
Depth: 3
Outliers: Keine
```

**Score-Breakdown:**
```
Min Size:          15/20 (8 Seiten)
Consistency:       20/20 (100%)
Content Sim:       28/30 (93% similarity)
Depth Bonus:        5/15 (Tiefe 3 - Malus)
No Outliers:       15/15 ✓
─────────────────────────
TOTAL:             83/100 ✅ CLUSTER (aber Warnung)
Note: "Deep pattern - consider flatter structure in migration"
```

---

## 🔧 Implementation

### Phase 1: Detection Algorithm

**Datei:** `src/modules/core/utils/auto-clusterer.ts` (NEU)

```typescript
export class AutoClusterer {
    /**
     * Automatically detects and evaluates patterns
     */
    static detectAndEvaluate(
        structure: SiteStructure,
        config: ClusterConfig = DEFAULT_CONFIG
    ): ClusteringDecision[] {
        const candidatePatterns = this.extractCandidatePatterns(structure);

        return candidatePatterns
            .map(({ pattern, urls }) => evaluateCluster(pattern, urls, structure))
            .filter(decision => decision.shouldCluster)
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Extracts all possible patterns from URLs
     */
    private static extractCandidatePatterns(structure: SiteStructure): Array<{pattern: string, urls: string[]}> {
        const pathGroups = new Map<string, string[]>();

        structure.nodes.forEach(node => {
            const url = new URL(node.url);
            const segments = url.pathname.split('/').filter(Boolean);

            // Try different depths
            for (let depth = 1; depth <= Math.min(segments.length - 1, 3); depth++) {
                const baseSegments = segments.slice(0, depth);
                const pattern = '/' + baseSegments.join('/') + '/[item]';

                if (!pathGroups.has(pattern)) {
                    pathGroups.set(pattern, []);
                }
                pathGroups.get(pattern)!.push(node.url);
            }
        });

        return Array.from(pathGroups.entries()).map(([pattern, urls]) => ({ pattern, urls }));
    }
}
```

---

### Phase 2: Integration in Grouping

**Datei:** `src/modules/core/utils/grouping.ts`

**ERSETZE Zeilen 64-79:**

```typescript
// OLD: Return empty if no forced patterns
if (forcedPatterns.length === 0) {
    return { groups: [], uniquePages: structure.nodes, ... };
}

// NEW: Auto-detect if no forced patterns
let patternsToUse = forcedPatterns;

if (forcedPatterns.length === 0) {
    console.log('[AutoCluster] No manual patterns. Running auto-detection...');

    const decisions = AutoClusterer.detectAndEvaluate(structure, {
        minClusterSize,
        scoreThreshold: 70
    });

    patternsToUse = decisions.map(d => d.pattern);

    console.log(`[AutoCluster] Found ${patternsToUse.length} strong clusters:`);
    decisions.forEach(d => {
        console.log(`  ✅ ${d.pattern} (Score: ${d.score}, ${d.reason})`);
    });
}

// Continue with existing logic using patternsToUse
```

---

## 🎨 Editierbarkeit

### UI für Cluster-Anpassung

**Nach Auto-Clustering zeige:**

```
┌────────────────────────────────────────────────┐
│ 🤖 Auto-Clustering Ergebnis (3 Cluster)        │
│                                                 │
│ ✅ /blog/[item] - 75 Seiten (Score: 100)       │
│    [Details] [Split] [Auflösen]                │
│                                                 │
│ ✅ /services/[item] - 5 Seiten (Score: 84)     │
│    [Details] [Split] [Auflösen]                │
│                                                 │
│ ⚠️  /content/[item] - 12 Seiten (Score: 63)    │
│    ❌ Nicht geclustert (Outliers detected)     │
│    [Trotzdem clustern] [Untersuchen]           │
│                                                 │
│ 📄 12 Unique Pages                             │
└────────────────────────────────────────────────┘
```

**User Actions:**
1. **Split:** Cluster in Sub-Patterns aufteilen
2. **Auflösen:** Cluster in Unique Pages umwandeln
3. **Details:** Zeigt Score-Breakdown
4. **Trotzdem clustern:** Override für abgelehnte Patterns

---

## 🔬 Quality Metrics & Validation

### Post-Clustering Validation

```typescript
interface ClusterQuality {
    pattern: string;
    quality: 'excellent' | 'good' | 'acceptable' | 'poor';
    warnings: string[];
    metrics: {
        avgContentSimilarity: number;
        urlConsistency: number;
        outlierPercentage: number;
    };
}

function validateClusterQuality(cluster: PageGroup, structure: SiteStructure): ClusterQuality {
    const pages = cluster.allUrls.map(u => structure.nodes.find(n => n.url === u)).filter(Boolean) as SiteNode[];

    const metrics = {
        avgContentSimilarity: calculateContentSimilarity(pages),
        urlConsistency: calculateUrlConsistency(cluster.allUrls),
        outlierPercentage: countOutliers(pages) / pages.length
    };

    const warnings: string[] = [];

    if (metrics.avgContentSimilarity < 0.6) {
        warnings.push('Content varies significantly across cluster');
    }

    if (metrics.outlierPercentage > 0.1) {
        warnings.push(`${Math.round(metrics.outlierPercentage * 100)}% of pages are outliers`);
    }

    let quality: ClusterQuality['quality'];
    if (metrics.avgContentSimilarity > 0.8 && metrics.urlConsistency > 0.9) {
        quality = 'excellent';
    } else if (metrics.avgContentSimilarity > 0.6 && metrics.urlConsistency > 0.8) {
        quality = 'good';
    } else if (metrics.avgContentSimilarity > 0.5) {
        quality = 'acceptable';
    } else {
        quality = 'poor';
    }

    return { pattern: cluster.pattern, quality, warnings, metrics };
}
```

---

## 📈 Erwartete Ergebnisse

### ganztags.net Beispiel

**Auto-Clustering würde ergeben:**

```typescript
✅ /blog/[item]
   Score: 98/100
   - 75 Seiten
   - 100% URL Consistency
   - 92% Content Similarity (Word Count: 680-750)
   - Depth: 1
   - Quality: Excellent

✅ /leistungen/[item]
   Score: 91/100
   - 20 Seiten
   - 100% URL Consistency
   - 85% Content Similarity
   - Depth: 1
   - Quality: Excellent

✅ /casestudies/[item]
   Score: 88/100
   - 13 Seiten
   - 100% URL Consistency
   - 88% Content Similarity
   - Depth: 1
   - Quality: Good

⚠️  /news/[item]
   Score: 65/100 (Grenzfall)
   - 5 Seiten (Min threshold)
   - 100% URL Consistency
   - 72% Content Similarity
   - Decision: CLUSTER (knapp über Threshold)

❌ /infothek/[item]
   Score: 35/100
   - 2 Seiten (Unter Minimum)
   - Decision: UNIQUE PAGES

📊 Gesamt:
   - 4 Cluster (113 Seiten → 12 Beispiele für AI)
   - 15 Unique Pages
   - Token-Reduktion: 85%
```

---

## ✅ Zusammenfassung

**Clustering erfolgt wenn:**
1. ≥ 3 Instanzen
2. ≥ 80% URL-Konsistenz
3. ≥ 50% Content-Ähnlichkeit
4. Composite Score ≥ 70/100

**Nicht geclustert wird bei:**
- Zu wenig Instanzen (< 3)
- Inkonsistente URL-Struktur
- Hohe Content-Variance
- Viele Outliers (> 20%)

**Editierbar durch:**
- Cluster auflösen
- Cluster splitten
- Manuelle Patterns hinzufügen/entfernen
- Schwellwerte anpassen

---

**Erstellt:** 2026-01-30
**Bereit für:** Implementation
