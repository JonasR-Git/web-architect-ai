# Clustering vs. Migration Decision - Zwei getrennte Konzepte

## 🎯 Kern-Erkenntnis

**CLUSTERING** und **MIGRATION-ENTSCHEIDUNG** sind **zwei verschiedene Schritte**!

```
Step 1: CLUSTERING (Liberal)
→ Erkenne ALLE Patterns (ab 2 Seiten)

Step 2: MIGRATION DECISION (Smart)
→ Was machen wir mit jedem Cluster?
```

---

## 📊 Step 1: Pattern Detection (LIBERAL)

### Regel: Ab 2 Seiten mit gleichem Pattern = Cluster

```typescript
if (urls.length >= 2 && followsSamePattern(urls)) {
    return { isCluster: true };
}
```

**Beispiele:**

```typescript
// ✅ ALLE sind Cluster!
/infothek/slug1, /infothek/slug2           → Cluster (2 Seiten)
/blog/post1, /blog/post2, /blog/post3      → Cluster (3 Seiten)
/services/seo, /services/content           → Cluster (2 Seiten)
/news/update1                              → KEIN Cluster (1 Seite)
```

**Output von Step 1:**
```typescript
[
    { pattern: '/blog/[item]', instanceCount: 75 },
    { pattern: '/services/[item]', instanceCount: 5 },
    { pattern: '/casestudies/[item]', instanceCount: 13 },
    { pattern: '/news/[item]', instanceCount: 5 },
    { pattern: '/infothek/[item]', instanceCount: 2 },  // ✅ Auch ein Cluster!
]
```

**Keine Mindestgröße für Clustering!** Ein Pattern ist ein Pattern.

---

## 🎨 Step 2: Migration Decision (SMART)

**Jetzt fragen wir:** Was machen wir mit jedem Cluster?

### Option A: Keep as Pattern (Dynamic Route)

**Wann sinnvoll:**
- Cluster groß genug (≥3-5 Seiten)
- Content ähnlich genug
- Erwartete zukünftige Expansion

**Beispiel:**
```typescript
/blog/[slug] (75 Seiten)
→ Decision: KEEP
→ Target: /insights/[slug]
→ Reason: "Large cluster, worth dynamic route"
```

---

### Option B: Convert to Unique Pages

**Wann sinnvoll:**
- Cluster sehr klein (2-3 Seiten)
- Keine erwartete Expansion
- Content zu unterschiedlich

**Beispiel:**
```typescript
/infothek/[item] (2 Seiten)
→ Decision: CONVERT_TO_UNIQUE
→ Target:
  - /infothek/slug1 → /guides/content-plan
  - /infothek/slug2 → /guides/seo-checklist
→ Reason: "Only 2 pages, not worth dynamic route"
```

---

### Option C: Merge with Another Cluster

**Wann sinnvoll:**
- Content-ähnlich mit größerem Cluster
- Semantisch verwandt
- Gleicher Ziel-Hub sinnvoll

**Beispiel:**
```typescript
/news/[item] (5 Seiten) + /blog/[item] (75 Seiten)
→ Decision: MERGE
→ Target: /insights/[slug]  (beide zusammen)
→ Reason: "Similar content (74% similarity)"
```

---

## 🧮 Migration Decision Matrix

### Entscheidungs-Baum

```
Für jeden Cluster:

1. Wie groß ist er?
   ├─ ≥10 Seiten → Sehr wahrscheinlich KEEP
   ├─ 5-9 Seiten → Prüfe Content-Similarity
   │   ├─ Hoch (>70%) → KEEP oder MERGE
   │   └─ Niedrig → CONVERT_TO_UNIQUE
   └─ 2-4 Seiten → Prüfe zukünftige Expansion
       ├─ Erwartet → KEEP (mit Warnung)
       ├─ Ähnlich mit größerem Cluster → MERGE
       └─ Sonst → CONVERT_TO_UNIQUE

2. Gibt es ähnliche Cluster?
   ├─ Ja, >60% Similarity → MERGE möglich
   └─ Nein → KEEP oder CONVERT

3. Content-Qualität?
   ├─ Hohe Variance → CONVERT_TO_UNIQUE (jede Seite anders)
   └─ Ähnlich → KEEP
```

---

## 📋 Konkrete Regeln

### Rule 1: Large Clusters (≥10)
```typescript
if (instanceCount >= 10) {
    return {
        decision: 'KEEP',
        confidence: 95,
        reason: 'Large cluster worth dynamic route'
    };
}
```

---

### Rule 2: Medium Clusters (5-9)
```typescript
if (instanceCount >= 5 && instanceCount < 10) {
    // Check content similarity
    const contentSim = calculateContentSimilarity(pages);

    if (contentSim > 0.7) {
        return { decision: 'KEEP', confidence: 80 };
    }

    // Check if mergeable with larger cluster
    const similarCluster = findSimilarCluster(cluster, allClusters);
    if (similarCluster && similarCluster.instanceCount >= 10) {
        return {
            decision: 'MERGE',
            mergeWith: similarCluster.pattern,
            confidence: 75
        };
    }

    // Borderline - keep but warn
    return {
        decision: 'KEEP',
        confidence: 60,
        warning: 'Small cluster - consider merging or converting'
    };
}
```

---

### Rule 3: Small Clusters (2-4)
```typescript
if (instanceCount >= 2 && instanceCount < 5) {
    // Check for expansion potential
    const isActivePattern = hasRecentAdditions(pages);

    if (isActivePattern) {
        return {
            decision: 'KEEP',
            confidence: 50,
            warning: 'Very small cluster - monitor for growth'
        };
    }

    // Check if mergeable
    const similarCluster = findSimilarCluster(cluster, allClusters);
    if (similarCluster && contentSimilarity > 0.6) {
        return {
            decision: 'MERGE',
            mergeWith: similarCluster.pattern,
            confidence: 80
        };
    }

    // Default: Convert to unique pages
    return {
        decision: 'CONVERT_TO_UNIQUE',
        confidence: 70,
        reason: 'Too small for dynamic route, no similar cluster to merge with'
    };
}
```

---

## 🔄 Vollständiges Beispiel: ganztags.net

### Step 1: Clustering (Liberal Detection)

```typescript
DETECTED CLUSTERS:
─────────────────────────────────────────────────
/blog/[item]              75 Seiten
/leistungen/[item]        20 Seiten
/casestudies/[item]       13 Seiten
/news/[item]               5 Seiten
/infothek/[item]           2 Seiten  ← Auch erkannt!
/en/blog/[item]           25 Seiten  (EN Variante)
/en/services/[item]        8 Seiten  (EN Variante)
```

---

### Step 2: Migration Decision

#### Cluster 1: /blog/[item] (75 Seiten)

```typescript
Decision: KEEP
Target: /insights/[slug]
Confidence: 95%
Reason: "Large cluster (75 pages), high content similarity"

Pattern Mapping:
{
    pattern: "/blog/[item]",
    target_base: "/insights/[slug]",
    action: "redirect"
}
```

---

#### Cluster 2: /news/[item] (5 Seiten)

```typescript
Decision: MERGE with /blog/[item]
Target: /insights/[slug]
Confidence: 85%
Reason: "Similar content (74% similarity), same target hub"

Pattern Mapping:
{
    pattern: "/news/[item]",
    target_base: "/insights/[slug]",
    action: "merge",
    merged_with: "/blog/[item]"
}
```

---

#### Cluster 3: /infothek/[item] (2 Seiten) ← INTERESSANT!

```typescript
// Option A: Check for merge possibility
similarCluster = findSimilarCluster('/infothek/[item]', allClusters);
// → /blog/[item] (60% similarity - borderline)

Decision: CONVERT_TO_UNIQUE
Target: Individual paths
Confidence: 70%
Reason: "Only 2 pages, not worth dynamic route. Content similarity too low for merge (60%)"

Page Mappings:
[
    {
        old_url: "/infothek/content-plan-template",
        new_path: "/guides/content-plan",
        action: "redirect"
    },
    {
        old_url: "/infothek/seo-checklist",
        new_path: "/guides/seo-checklist",
        action: "redirect"
    }
]

Note: NO pattern_mapping (converted to unique pages)
```

---

#### Alternative für /infothek: Keep as Pattern

**Wenn User plant, mehr Guides hinzuzufügen:**

```typescript
Decision: KEEP (with warning)
Target: /guides/[slug]
Confidence: 50%
Warning: "Very small cluster (2 pages). Consider adding more content or converting to unique pages."

Pattern Mapping:
{
    pattern: "/infothek/[item]",
    target_base: "/guides/[slug]",
    action: "redirect",
    note: "Small cluster - monitor for growth"
}
```

---

## 🎯 Implementation: Zwei-Phasen-System

### Phase 1: Auto-Clusterer (Liberal)

**Datei:** `src/modules/core/utils/auto-clusterer.ts`

```typescript
export class AutoClusterer {
    /**
     * Detects ALL patterns (no minimum size)
     */
    static detectPatterns(structure: SiteStructure): ClusterCandidate[] {
        const pathGroups = new Map<string, string[]>();

        structure.nodes.forEach(node => {
            const pattern = extractPattern(node.url);
            if (pattern) {
                if (!pathGroups.has(pattern)) {
                    pathGroups.set(pattern, []);
                }
                pathGroups.get(pattern)!.push(node.url);
            }
        });

        // Return ALL patterns with 2+ instances
        return Array.from(pathGroups.entries())
            .filter(([_, urls]) => urls.length >= 2)  // Minimum: 2
            .map(([pattern, urls]) => ({
                pattern,
                urls,
                instanceCount: urls.length
            }));
    }
}
```

---

### Phase 2: Migration Strategist (Smart)

**Datei:** `src/modules/core/utils/migration-strategist.ts` (NEU)

```typescript
export interface MigrationDecision {
    pattern: string;
    decision: 'KEEP' | 'MERGE' | 'CONVERT_TO_UNIQUE';
    confidence: number;
    reason: string;
    targetBase?: string;        // Für KEEP/MERGE
    mergeWith?: string;         // Für MERGE
    individualMappings?: any[]; // Für CONVERT_TO_UNIQUE
    warning?: string;
}

export class MigrationStrategist {
    /**
     * Decides what to do with each cluster
     */
    static evaluateClusters(
        clusters: ClusterCandidate[],
        structure: SiteStructure
    ): MigrationDecision[] {
        return clusters.map(cluster => {
            const pages = this.getPagesForCluster(cluster, structure);

            // Large clusters → Keep
            if (cluster.instanceCount >= 10) {
                return {
                    pattern: cluster.pattern,
                    decision: 'KEEP',
                    confidence: 95,
                    reason: `Large cluster (${cluster.instanceCount} pages)`,
                    targetBase: this.suggestTargetBase(cluster.pattern)
                };
            }

            // Medium clusters → Check similarity
            if (cluster.instanceCount >= 5) {
                const contentSim = this.calculateContentSimilarity(pages);

                if (contentSim > 0.7) {
                    return {
                        pattern: cluster.pattern,
                        decision: 'KEEP',
                        confidence: 80,
                        reason: `Good content similarity (${Math.round(contentSim * 100)}%)`,
                        targetBase: this.suggestTargetBase(cluster.pattern)
                    };
                }

                // Try merge
                const mergeCandidate = this.findMergeCandidate(cluster, clusters, structure);
                if (mergeCandidate) {
                    return {
                        pattern: cluster.pattern,
                        decision: 'MERGE',
                        confidence: 75,
                        reason: `Similar to ${mergeCandidate.pattern}`,
                        mergeWith: mergeCandidate.pattern,
                        targetBase: this.suggestTargetBase(mergeCandidate.pattern)
                    };
                }

                // Keep but warn
                return {
                    pattern: cluster.pattern,
                    decision: 'KEEP',
                    confidence: 60,
                    reason: 'Medium cluster',
                    warning: 'Consider merging or monitoring for growth',
                    targetBase: this.suggestTargetBase(cluster.pattern)
                };
            }

            // Small clusters (2-4) → Try merge, else convert
            const mergeCandidate = this.findMergeCandidate(cluster, clusters, structure);
            if (mergeCandidate) {
                return {
                    pattern: cluster.pattern,
                    decision: 'MERGE',
                    confidence: 80,
                    reason: `Too small alone (${cluster.instanceCount} pages), merging with ${mergeCandidate.pattern}`,
                    mergeWith: mergeCandidate.pattern,
                    targetBase: this.suggestTargetBase(mergeCandidate.pattern)
                };
            }

            // Convert to unique
            return {
                pattern: cluster.pattern,
                decision: 'CONVERT_TO_UNIQUE',
                confidence: 70,
                reason: `Too small (${cluster.instanceCount} pages) and no merge candidate`,
                individualMappings: this.generateIndividualMappings(cluster, structure)
            };
        });
    }

    private static findMergeCandidate(
        cluster: ClusterCandidate,
        allClusters: ClusterCandidate[],
        structure: SiteStructure
    ): ClusterCandidate | null {
        const clusterPages = this.getPagesForCluster(cluster, structure);

        for (const candidate of allClusters) {
            if (candidate.pattern === cluster.pattern) continue;

            const candidatePages = this.getPagesForCluster(candidate, structure);
            const similarity = this.compareClusterContent(clusterPages, candidatePages);

            // Merge if >60% similar AND candidate is larger
            if (similarity > 0.6 && candidate.instanceCount > cluster.instanceCount) {
                return candidate;
            }
        }

        return null;
    }
}
```

---

## 📊 Finale Output-Struktur

### Für AI (Pattern Mapping)

```json
{
  "pattern_mapping": [
    {
      "pattern": "/blog/[item]",
      "target_base": "/insights/[slug]",
      "action": "redirect",
      "cluster_size": 75,
      "decision_confidence": 95
    },
    {
      "pattern": "/news/[item]",
      "target_base": "/insights/[slug]",
      "action": "merge",
      "merged_with": "/blog/[item]",
      "cluster_size": 5,
      "decision_confidence": 85
    },
    {
      "pattern": "/leistungen/[item]",
      "target_base": "/services/[slug]",
      "action": "keep",
      "cluster_size": 20,
      "decision_confidence": 90
    }
  ],
  "page_mapping": [
    // /infothek wurde NICHT als Pattern gemappt, sondern als einzelne Pages:
    {
      "old_url": "/infothek/content-plan-template",
      "new_path": "/guides/content-plan",
      "action": "redirect",
      "note": "Converted from small cluster /infothek/[item]"
    },
    {
      "old_url": "/infothek/seo-checklist",
      "new_path": "/guides/seo-checklist",
      "action": "redirect",
      "note": "Converted from small cluster /infothek/[item]"
    }
  ]
}
```

---

## ✅ Zusammenfassung

### Clustering (Step 1): LIBERAL
```
Ab 2 Seiten mit Pattern → Cluster
Keine Mindestgröße
Keine Content-Prüfung
Einfach: "Ist es ein Pattern?" → Ja/Nein
```

### Migration Decision (Step 2): SMART
```
Für jeden Cluster:
- ≥10 Seiten → KEEP (95% sicher)
- 5-9 Seiten → KEEP oder MERGE (je nach Content)
- 2-4 Seiten → MERGE oder CONVERT_TO_UNIQUE

Faktoren:
- Cluster-Größe
- Content-Similarity
- Merge-Kandidaten
- Zukünftiges Wachstum (optional)
```

---

## 💡 Deine Frage beantwortet

**"Aber machen cluster nicht theoretisch schon ab zwei Seiten sinn?"**

✅ **JA - für Clustering!**
- `/infothek/slug1` + `/infothek/slug2` = Cluster erkannt

❓ **ABER - für Migration?**
- Option A: Keep as `/guides/[slug]` (wenn Expansion erwartet)
- Option B: Convert to `/guides/content-plan` + `/guides/seo-checklist` (wenn nicht)

**Die Frage ist nicht "Ist es ein Cluster?" sondern "Was machen wir damit?"**

---

**Macht das mehr Sinn?** 🎯
