# Complete Data Flow Analysis - Crawl bis Export

## 🔍 Vollständiger Datenfluss

### 1️⃣ CRAWL-PHASE

**Datei:** `src/app/actions.ts` → `startCrawlAction()`

**Input:** URL (string)

**Output:** `SiteStructure`
```typescript
{
  rootUrl: string;
  crawledAt: string;
  nodes: SiteNode[];  // Alle gecrawlten Seiten
  semanticMerges?: {
    merges: Array<{ from: string, to: string }>
  }
}
```

**Jede Node enthält:**
- `url`, `depth`, `type`
- `meta` (title, description, lang, hreflangs, etc.)
- `content` (h1, headings, wordCount, images, links, forms, etc.)
- `tech` (detectedFrameworks, etc.)

---

### 2️⃣ NORMALISIERUNGS-PHASE

**Datei:** `src/modules/core/utils/normalization.ts`

**Funktion:** `normalizeStructureToConcepts(structure, semanticMerges)`

**Zweck:**
- Merged Sprachvarianten (z.B. `/leistungen` + `/en/services` → ein Konzept)
- Reduziert Nodes für Token-Optimierung

**Output:** Normalisiertes `SiteStructure` mit weniger Nodes

**⚠️ PROBLEM:** Die Funktion wird VOR dem Clustering aufgerufen, aber Sprachvarianten werden NICHT automatisch erkannt - `semanticMerges` muss manuell definiert sein!

---

### 3️⃣ CLUSTERING-PHASE

**Datei:** `src/modules/core/utils/grouping.ts` → `groupSimilarPages()`

**Input:**
- Normalisiertes `SiteStructure`
- `maxExamplesPerPattern` (default: 3)
- `minClusterSize` (default: 5, aber nicht mehr verwendet!)
- `overrides: ClusterOverrides`

**Output:** `GroupedStructure`
```typescript
{
  rootUrl: string;
  groups: PageGroup[];        // Cluster mit Pattern
  uniquePages: SiteNode[];    // Einzelne Seiten
  urlToPattern: Record<...>;  // Mapping URL → Pattern
  stats: {...}
}
```

**Jedes `PageGroup`:**
```typescript
{
  pattern: string;           // z.B. "/blog/[item]"
  examples: SiteNode[];      // 3 Beispielseiten (50/60/70-Perzentil)
  totalCount: number;        // Gesamtzahl der Seiten
  allUrls: string[];         // Alle URLs im Cluster
}
```

**⚠️ KRITISCHES PROBLEM:**
- **Zeile 64-79:** Wenn KEINE `forceArchetypes` definiert sind, wird ALLES als `uniquePages` zurückgegeben!
- **Auto-Clustering ist DEAKTIVIERT** (Zeile 144: "Auto-Clustering is disabled")
- Das bedeutet: **Ohne manuelle Cluster-Definition keine Patterns!**

---

### 4️⃣ AI MIGRATION PLAN PHASE

**Datei:** `src/modules/core/ai-service.ts` → `generateMigrationPlan()`

**Input:**
- Normalisiertes `SiteStructure` (concept-basiert)
- `userInstructions` (optional)
- `overrides: ClusterOverrides`
- `semanticMerges` (optional)

**AI Prompt:** `src/modules/core/prompts/analysis.ts` (Zeile 116-122)
```typescript
"pattern_mapping": [{
    "pattern": "string (EXACT pattern name from input structure)",
    "target_base": "string (e.g. /insights/blog/)",
    "action": "keep" | "redirect" | "merge",
    "type": "page" | "layout",
    "reason": "string (German)"
}]
```

**Output:** `MigrationPlan`
```typescript
{
  rationale: string;
  sitemap: Array<{path, label, type}>;
  page_mapping: Array<{old_url, new_path, action, reason}>;
  pattern_mapping?: Array<{pattern, target_base, action, reason}>;  // ← OPTIONAL!
  clusters?: ClusterSpec[];  // ← Wird später hinzugefügt
}
```

**⚠️ PROBLEM 1:** `pattern_mapping` ist OPTIONAL in TypeScript
- AI generiert es manchmal nicht
- Kein Validierungs-Check nach AI-Antwort

**⚠️ PROBLEM 2:** AI erhält die Patterns aus der `GroupedStructure`, aber:
- Wenn keine `forceArchetypes` definiert → keine Patterns in Input → AI generiert keine pattern_mapping
- Circular Dependency!

---

### 5️⃣ CLUSTER-SPEC-GENERIERUNG

**Datei:** `src/app/actions.ts` (Zeile 124-141)

**Input:** `grouped.groups` (aus groupSimilarPages)

**Code:**
```typescript
const clusters: ClusterSpec[] = grouped.groups.map((group, idx) => {
    const instances: PageInstance[] = group.allUrls.map(url => {
        const node = normalizedStructure.nodes.find(n => n.url === url);
        return {
            url,
            title: node?.meta?.title || 'Unknown Title',
            wordCount: node?.content?.wordCount || 0,
            assetsFound: node?.content?.images?.length || 0,
            status: 'pending'
        };
    });

    return {
        id: `cluster_${idx}`,
        pattern: group.pattern,
        instances
    };
});
```

**Output:** `ClusterSpec[]`
```typescript
{
  id: string;              // "cluster_0", "cluster_1", ...
  pattern: string;         // "/blog/[item]"
  instances: PageInstance[];  // Alle Seiten im Cluster
}
```

**Dann:** Clusters werden an `migrationPlan` angehängt:
```typescript
(data as any).clusters = clusters;
```

**⚠️ PROBLEM:** Clusters basieren auf `grouped.groups`, aber wenn keine forceArchetypes → groups ist leer → **keine Clusters!**

---

### 6️⃣ CONTENT-SIMILARITY-ANALYSE

**Datei:** `src/modules/analysis/services/content-similarity-analyzer.ts`

**Funktion:** `enrichMigrationPlanWithTags()`

**Input:**
- `migrationPlan` (von AI)
- `clusters: ClusterSpec[]`
- `normalizedStructure: SiteStructure`

**Prozess:**
1. Für jeden Cluster: `analyzeCluster()` → `ClusterProfile` erstellen
2. Paarweiser Vergleich: `compareClusterst()` → `MergeRecommendation[]`
3. Cohesion-Check: `buildMergeGroupsWithCohesion()` → `Map<string, string[]>`

**Output:** Enriched Migration Plan
```typescript
{
  ...migrationPlan,
  page_mapping: [...],  // Enriched mit originalCategory, contentType
  contentAnalysis: {
    clusterProfiles: ClusterProfile[];
    mergeRecommendations: MergeRecommendation[];
    mergeGroups: Array<{targetHub, mergedCategories}>;
  }
}
```

**⚠️ PROBLEM:** Wenn `clusters.length === 0` (weil keine forceArchetypes), wird diese Analyse ÜBERSPRUNGEN!

---

## 🐛 Identifizierte Probleme

### Problem 1: Auto-Clustering deaktiviert
**Datei:** `grouping.ts:144`
**Impact:** HOCH
**Beschreibung:** Ohne `forceArchetypes` werden ALLE Seiten als `uniquePages` klassifiziert.

**Beispiel:**
```typescript
// Input: 100 Seiten, davon 75 /blog/* Seiten
// Wenn forceArchetypes = []
// → groups = []
// → uniquePages = [alle 100 Seiten]
```

**Lösung:** Auto-Clustering reaktivieren mit verbesserter Heuristik.

---

### Problem 2: pattern_mapping ist optional
**Datei:** `types/index.ts:250`
**Impact:** HOCH
**Beschreibung:** AI generiert manchmal keine `pattern_mapping`, weil das Feld optional ist.

**Aktuelle Definition:**
```typescript
pattern_mapping?: { ... }[];  // ← Optional!
```

**Lösung:**
1. TypeScript: Pflichtfeld machen (Breaking Change)
2. **ODER:** Post-Processing-Validation hinzufügen

---

### Problem 3: Fehlende [slug] in Targets
**Datei:** Migration Plan Output
**Impact:** HOCH
**Beschreibung:** AI generiert Targets wie `/insights/` statt `/insights/[slug]`

**Beispiel aus migration-mapping (4).json:**
```json
{
  "old_url": "/blog/[item]",
  "new_path": "/insights/",  // ← Fehlt [slug]!
  "action": "merge"
}
```

**Lösung:** Post-Processing, um fehlende [slug] zu ergänzen.

---

### Problem 4: Sprachvarianten nicht automatisch erkannt
**Datei:** `normalization.ts`
**Impact:** MITTEL
**Beschreibung:** `semanticMerges` muss manuell definiert werden, sonst werden `/leistungen` und `/en/services` als separate Konzepte behandelt.

**Lösung:** Variant Detection VOR Normalisierung laufen lassen.

---

### Problem 5: Keine Coverage-Validierung
**Datei:** `actions.ts`
**Impact:** MITTEL
**Beschreibung:** Keine Überprüfung, ob alle Quell-URLs gemappt sind.

**Lösung:** Mapping-Validator implementieren (siehe Plan).

---

### Problem 6: Cluster-Divergenz
**Datei:** `actions.ts:124-141`
**Impact:** NIEDRIG
**Beschreibung:** `ClusterSpec` wird aus `grouped.groups` erstellt, aber AI kennt diese Struktur nicht → Divergenz möglich.

**Lösung:** AI sollte `clusters` auch im Output haben, nicht nur page_mapping.

---

## ✅ Empfohlene Fixes (Priorität)

### Fix 1: Auto-Clustering reaktivieren (HOCH)

**Datei:** `src/modules/core/utils/grouping.ts`

**Änderung:** Zeile 64-79 ersetzen

```typescript
// ALTE LOGIK (Line 64-79): Wenn keine forceArchetypes → alles unique
if (forcedPatterns.length === 0) {
    return {
        groups: [],
        uniquePages: structure.nodes.map(n => ({ ...n })),
        // ...
    };
}
```

**NEUE LOGIK:**
```typescript
// Auto-detect patterns if no forced archetypes
let patternsToUse = forcedPatterns;

if (forcedPatterns.length === 0) {
    console.log('[AutoCluster] No forced archetypes. Auto-detecting patterns...');
    patternsToUse = autoDetectPatterns(structure.nodes, minClusterSize);
    console.log(`[AutoCluster] Detected ${patternsToUse.length} patterns automatically.`);
}

// Helper function
function autoDetectPatterns(nodes: SiteNode[], minSize: number = 5): string[] {
    const pathCounts = new Map<string, number>();

    nodes.forEach(node => {
        const url = new URL(node.url);
        const path = url.pathname;
        const segments = path.split('/').filter(Boolean);

        // Try patterns like /blog/*, /services/*, etc.
        if (segments.length >= 2) {
            const potentialPattern = '/' + segments[0] + '/[item]';
            pathCounts.set(potentialPattern, (pathCounts.get(potentialPattern) || 0) + 1);
        }
    });

    // Only return patterns with >= minSize instances
    return Array.from(pathCounts.entries())
        .filter(([_, count]) => count >= minSize)
        .map(([pattern, _]) => pattern)
        .sort((a, b) => b.length - a.length);
}
```

---

### Fix 2: pattern_mapping Validierung (HOCH)

**Datei:** `src/modules/core/ai-service.ts` (nach Zeile 399)

**Änderung:**
```typescript
const plan = await this.callAI(messages, AI_MODELS.migration, `Migration Plan(Tier ${tier})`);

// VALIDATION: Ensure pattern_mapping exists
if (!plan.pattern_mapping || plan.pattern_mapping.length === 0) {
    console.warn('⚠️ AI did not generate pattern_mapping. Attempting auto-generation...');
    plan.pattern_mapping = this.generatePatternMappingFromPageMapping(plan.page_mapping);
}

// VALIDATION: Ensure all pattern targets have [slug]
plan.pattern_mapping = plan.pattern_mapping.map(pm => {
    if (pm.pattern.includes('[') && !pm.target_base.includes('[')) {
        console.warn(`⚠️ Fixing missing [slug] in ${pm.pattern} → ${pm.target_base}`);
        // Extract base path and add [slug]
        const basePath = pm.target_base.replace(/\/$/, '');
        pm.target_base = `${basePath}/[slug]`;
    }
    return pm;
});

return plan;
```

**Helper-Funktion:**
```typescript
private generatePatternMappingFromPageMapping(pageMapping: any[]): any[] {
    const patternMap = new Map<string, any>();

    pageMapping.forEach(pm => {
        // Detect if old_url is a pattern
        if (pm.old_url.includes('[')) {
            const key = pm.old_url;
            if (!patternMap.has(key)) {
                // Extract target base
                let targetBase = pm.new_path;
                if (!targetBase.includes('[')) {
                    targetBase = targetBase.replace(/\/$/, '') + '/[slug]';
                }

                patternMap.set(key, {
                    pattern: pm.old_url,
                    target_base: targetBase,
                    action: pm.action,
                    type: pm.type || 'page',
                    reason: pm.reason || 'Auto-generated from page_mapping'
                });
            }
        }
    });

    return Array.from(patternMap.values());
}
```

---

### Fix 3: Sprachvarianten VOR Normalisierung erkennen (MITTEL)

**Datei:** `src/app/actions.ts` (Zeile 101-112)

**AKTUELL:**
```typescript
const normalizedStructure = normalizeStructureToConcepts(structure, semanticMerges);
const grouped = groupSimilarPages(normalizedStructure, 3, 5, overrides);
```

**NEU:**
```typescript
// 1. Detect language variants FIRST
let structureWithVariants = structure;
if (!semanticMerges || semanticMerges.merges.length === 0) {
    console.log('🌍 [VariantDetection] Auto-detecting language variants...');
    const { detectAndLinkVariants } = await import('@/modules/core/utils/normalization');
    structureWithVariants = await detectAndLinkVariants(structure);

    // Build semantic merges from detected variants
    semanticMerges = buildSemanticMergesFromVariants(structureWithVariants);
}

// 2. Normalize with variants
const normalizedStructure = normalizeStructureToConcepts(structureWithVariants, semanticMerges);

// 3. Group
const grouped = groupSimilarPages(normalizedStructure, 3, 5, overrides);
```

---

### Fix 4: Coverage-Validierung (MITTEL)

**Datei:** `src/modules/analysis/services/mapping-validator.ts` (NEU)

**Code:** (Siehe Plan-Datei)

**Integration:** In `actions.ts` nach Migration Plan Generierung

---

### Fix 5: Typo Fix (NIEDRIG)

**Datei:** `content-similarity-analyzer.ts:98`

**Änderung:**
```typescript
// BEFORE
static compareClusterst(profile1, profile2) { ... }

// AFTER
static compareClusters(profile1, profile2) { ... }
```

**Dann:** Alle Referenzen aktualisieren (Zeile 183)

---

## 📊 Datenfluss-Diagramm

```
┌─────────────────────┐
│  1. CRAWL           │
│  startCrawlAction() │
└──────────┬──────────┘
           │
           ▼
    SiteStructure (raw)
           │
           ▼
┌─────────────────────────────┐
│  2. VARIANT DETECTION (NEW) │
│  detectAndLinkVariants()    │
└──────────┬──────────────────┘
           │
           ▼
    SiteStructure (mit variants)
           │
           ▼
┌─────────────────────────────┐
│  3. NORMALISIERUNG          │
│  normalizeStructureToConcepts│
└──────────┬──────────────────┘
           │
           ▼
    SiteStructure (concepts)
           │
           ├─────────────────────────┐
           │                         │
           ▼                         ▼
┌──────────────────────┐   ┌─────────────────────┐
│  4a. CLUSTERING      │   │  4b. AI MIGRATION   │
│  groupSimilarPages() │   │  generateMigration()│
└──────────┬───────────┘   └──────────┬──────────┘
           │                          │
           ▼                          ▼
    GroupedStructure          MigrationPlan (raw)
           │                          │
           └──────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  5. CLUSTER-SPEC GEN       │
         │  clusters = groups.map()   │
         └────────────┬───────────────┘
                      │
                      ▼
              ClusterSpec[]
                      │
                      ▼
         ┌────────────────────────────┐
         │  6. CONTENT SIMILARITY     │
         │  enrichMigrationPlanWith...│
         └────────────┬───────────────┘
                      │
                      ▼
         MigrationPlan (enriched)
              - page_mapping
              - pattern_mapping (validated)
              - contentAnalysis
              - clusters
                      │
                      ▼
         ┌────────────────────────────┐
         │  7. UI MAPPING             │
         │  DualPanelMapper           │
         └────────────┬───────────────┘
                      │
                      ▼
         User-approved Mapping
                      │
                      ▼
         ┌────────────────────────────┐
         │  8. PAGE SPECS GENERATION  │
         │  generatePageSpecsAction() │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  9. ZIP EXPORT             │
         │  generateProjectZip()      │
         └────────────────────────────┘
```

---

## 🎯 Zusammenfassung kritischer Issues

| Issue | Datei | Zeile | Impact | Fix Priority |
|-------|-------|-------|--------|--------------|
| **Auto-Clustering deaktiviert** | grouping.ts | 64-79 | HOCH | 1 |
| **pattern_mapping optional** | types/index.ts | 250 | HOCH | 2 |
| **Fehlende [slug] in Targets** | AI Output | - | HOCH | 2 |
| **compareClusterst Typo** | content-similarity-analyzer.ts | 98 | NIEDRIG | 5 |
| **Keine Variant Detection** | actions.ts | 111 | MITTEL | 3 |
| **Keine Coverage Validation** | actions.ts | - | MITTEL | 4 |

---

## 🚀 Nächste Schritte

1. **Fix 1 implementieren:** Auto-Clustering reaktivieren
2. **Fix 2 implementieren:** pattern_mapping Validierung + Auto-Fix
3. **Fix 3 implementieren:** Variant Detection Integration
4. **Testing:** Mit ganztags.net testen
5. **Fix 4 implementieren:** Coverage-Validierung (Plan-basiert)

---

**Erstellt:** 2026-01-30
**Status:** ✅ Analysiert, bereit zur Implementierung
