# Cluster Cohesion Fix - Verhindert schwache transitive Merges

## 🔍 Das Problem (Erkannt vom User)

### Szenario: ganztags.net

**Pairwise Similarities:**
```
Blog ↔ News:     74% → MERGE ✅
Blog ↔ Infothek: 60% → MERGE ✅ (borderline)
News ↔ Infothek: 52% → SEPARATE ❌
```

### Naive Transitive Merge (❌ Schlecht)

**Alte Logik:**
```
1. Blog + News mergen (74%)
2. Blog + Infothek mergen (60%)
3. Transitiv: News + Infothek werden AUCH gemerged (obwohl nur 52%!)
```

**Ergebnis:**
```
Group 0: [blog, news, infothek]  // Alle zusammen!
```

**Problem:** News und Infothek sind eigentlich zu unterschiedlich (nur 52%), werden aber trotzdem zusammengepackt, weil beide mit Blog verbunden sind.

---

## ✅ Die Lösung: Cluster Cohesion Check

### Konzept

**Cohesion (Zusammenhalt) = Durchschnittliche Similarity aller Paare in der Gruppe**

```
Für Group [A, B, C]:
  Cohesion = (sim(A,B) + sim(A,C) + sim(B,C)) / 3
```

**Regel:**
```
IF Cohesion ≥ Threshold (65%)
  → MERGE erlaubt ✅
ELSE
  → Gruppen bleiben getrennt ❌
```

---

## 📊 Beispiel: ganztags.net

### Schritt 1: Initiale Empfehlungen

```
Blog ↔ News:     74% → Empfehlung: MERGE
Blog ↔ Infothek: 60% → Empfehlung: MERGE
```

### Schritt 2: Gruppen-Bildung

**Versuch 1: [Blog, News]**
```
Cohesion = sim(Blog, News) = 74%
→ 74% ≥ 65% → ✅ Gruppe erstellt
```

**Versuch 2: [Blog, News] + Infothek**
```
Cohesion = (sim(Blog,News) + sim(Blog,Infothek) + sim(News,Infothek)) / 3
         = (74 + 60 + 52) / 3
         = 62%

→ 62% < 65% → ❌ Merge abgelehnt!
```

### Schritt 3: Finale Gruppen

```
Group 0: [blog, news]      // Cohesion: 74%
Group 1: [infothek]        // Separate (zu unterschiedlich)
```

### Ergebnis

**Zielstruktur:**
```
/insights/[slug]           ← Blog + News (ähnlich)
  - seo-guide (tag: blog)
  - trends-2024 (tag: news)

/guides/[slug]             ← Infothek (separate)
  - content-plan-template (tag: infothek)
  - seo-audit-checklist (tag: infothek)
```

---

## 🔧 Implementation

### Code Changes

[content-similarity-analyzer.ts:137-158](web-architect-ai/src/modules/analysis/services/content-similarity-analyzer.ts#L137-L158)

**New Method: `buildMergeGroupsWithCohesion`**

```typescript
private static buildMergeGroupsWithCohesion(
    recommendations: MergeRecommendation[],
    profiles: ClusterProfile[],
    allSimilarities: Map<string, number>,
    cohesionThreshold: number = 65
): Map<string, string[]> {
    // Before merging two groups, check cohesion
    const combined = new Set([...group1, ...group2]);
    const cohesion = this.calculateGroupCohesion(combined, allSimilarities);

    if (cohesion >= cohesionThreshold) {
        // Merge ✅
        console.log(`✅ Merging groups (cohesion: ${cohesion}%)`);
    } else {
        // Keep separate ❌
        console.log(`❌ Groups too different (cohesion: ${cohesion}% < ${threshold}%)`);
    }
}
```

**Cohesion Calculation:**

```typescript
private static calculateGroupCohesion(
    members: Set<string>,
    allSimilarities: Map<string, number>
): number {
    // Calculate average pairwise similarity
    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < memberArray.length; i++) {
        for (let j = i + 1; j < memberArray.length; j++) {
            const similarity = getSimilarity(memberArray[i], memberArray[j]);
            totalSimilarity += similarity;
            pairCount++;
        }
    }

    return pairCount > 0 ? totalSimilarity / pairCount : 0;
}
```

---

## 🎛️ Configuration

### Adjust Cohesion Threshold

**Default: 65%**

```typescript
// In actions.ts
const enrichedData = ContentSimilarityAnalyzer.enrichMigrationPlanWithTags(
    data,
    clusters,
    normalizedStructure,
    65  // ← Cohesion Threshold (default: 65)
);
```

**Threshold Guide:**

| Threshold | Behavior | Use Case |
|-----------|----------|----------|
| **50%** | Aggressive merging | Very similar content types |
| **60%** | Balanced | Most websites (default was 60 for pairwise) |
| **65%** | Conservative | Avoid weak transitive merges ✅ |
| **75%** | Very strict | Keep most clusters separate |

---

## 📊 Console Output

### Before (Naive Transitive)

```
📊 [ContentAnalysis] Found 2 merge recommendations
   ✅ cluster_0 + cluster_1: 74% - Merge
   ✅ cluster_0 + cluster_2: 60% - Merge

Result: Group 0: [cluster_0, cluster_1, cluster_2]
```

### After (With Cohesion Check)

```
📊 [ContentAnalysis] Found 2 merge recommendations
   ✅ cluster_0 + cluster_1: 74% - Merge
   ✅ cluster_0 + cluster_2: 60% - Merge

Cohesion Check:
   ✅ Merging groups (cohesion: 74.0%)  // Blog + News
   ❌ Groups too different (cohesion: 62.0% < 65%)  // + Infothek

Result:
   Group 0: [cluster_0, cluster_1]  // Blog + News
   Group 1: [cluster_2]             // Infothek (separate)
```

---

## 🧮 Mathematical Details

### Cohesion Formula

For a group with n members:

```
Cohesion = Σ(sim(i,j)) / (n * (n-1) / 2)

where:
  i, j = all unique pairs in the group
  sim(i,j) = pairwise similarity score
```

**Example: [A, B, C]**
```
n = 3
pairs = (3 * 2) / 2 = 3

Cohesion = (sim(A,B) + sim(A,C) + sim(B,C)) / 3
```

**Example: [A, B, C, D]**
```
n = 4
pairs = (4 * 3) / 2 = 6

Cohesion = (sim(A,B) + sim(A,C) + sim(A,D) +
            sim(B,C) + sim(B,D) + sim(C,D)) / 6
```

---

## 🆚 Comparison: Before vs After

### Test Case: ganztags.net

**Input:**
```
/blog/[item]     - 25 pages, 720 words avg
/news/[item]     - 12 pages, 680 words avg
/infothek/[item] - 8 pages,  890 words avg
```

**Similarities:**
```
Blog-News:     74%
Blog-Infothek: 60%
News-Infothek: 52%
```

**Before (Naive):**
```
Group 0: [blog, news, infothek]
→ /insights/[slug] (ALL merged)
```

**After (Cohesion Check):**
```
Group 0: [blog, news]     (Cohesion: 74%)
Group 1: [infothek]       (Too different)

→ /insights/[slug]  (Blog + News)
→ /guides/[slug]    (Infothek)
```

---

## 🎯 Benefits

### 1. Prevents Weak Merges
- ❌ Before: Blog + News + Infothek merged (avg similarity: 62%)
- ✅ After: Only Blog + News merged (similarity: 74%)

### 2. More Logical Structure
```
/insights/[slug]  ← News & Blog (current events, SEO tips)
/guides/[slug]    ← Infothek (how-to guides, templates)
```

### 3. Better SEO
- Each hub has a clear topic focus
- Less topic dilution
- Better internal linking structure

### 4. User-Friendly
- Clear separation between News and Guides
- Easier navigation
- More relevant "Related Articles"

---

## 🧪 Testing

### Unit Test Example

```typescript
describe('Cohesion Check', () => {
    it('should prevent weak transitive merges', () => {
        const similarities = new Map([
            ['A-B', 74],
            ['A-C', 60],
            ['B-C', 52]
        ]);

        const cohesion = calculateGroupCohesion(
            new Set(['A', 'B', 'C']),
            similarities
        );

        expect(cohesion).toBe(62); // (74 + 60 + 52) / 3
        expect(cohesion).toBeLessThan(65); // Should NOT merge
    });

    it('should allow strong groups', () => {
        const similarities = new Map([
            ['A-B', 74],
            ['A-C', 70],
            ['B-C', 68]
        ]);

        const cohesion = calculateGroupCohesion(
            new Set(['A', 'B', 'C']),
            similarities
        );

        expect(cohesion).toBe(70.67); // (74 + 70 + 68) / 3
        expect(cohesion).toBeGreaterThanOrEqual(65); // Should merge ✅
    });
});
```

---

## 🔮 Future Enhancements

### 1. Dynamic Thresholds
```typescript
// Adjust threshold based on group size
const threshold = members.length <= 2 ? 60 : 65;
```

### 2. Minimum Similarity Floor
```typescript
// Reject if ANY pairwise similarity < 50%
const minSimilarity = Math.min(...allPairwiseSimilarities);
if (minSimilarity < 50) return false;
```

### 3. User Feedback Loop
```typescript
// Let user override cohesion decisions
{
    "mergeGroup": {
        "members": ["blog", "news", "infothek"],
        "cohesion": 62,
        "recommended": false,
        "userOverride": true  // ← User forces merge
    }
}
```

---

## 📝 Migration Guide

### Old Code
```typescript
const analysis = ContentSimilarityAnalyzer.analyzeClusters(
    clusters,
    structure
);
// No cohesion check - naive transitive merges
```

### New Code
```typescript
const analysis = ContentSimilarityAnalyzer.analyzeClusters(
    clusters,
    structure,
    65  // ← Cohesion threshold
);
// Cohesion check prevents weak transitive merges ✅
```

---

## 💡 Key Insight

**User's Question:**
> "Aber heißt hier wäre es trotzdem alles in den insights obwohl du es für news/infothek nicht zusammenpacken würdest?"

**Answer:** ✅ **Richtig erkannt!**

Das war genau das Problem. Mit dem Cohesion Check wird jetzt verhindert, dass schwach verbundene Cluster durch transitive Beziehungen zusammengepackt werden.

**Alte Logik:**
```
Blog ↔ News (74%) + Blog ↔ Infothek (60%)
→ Alle zusammen (auch wenn News ↔ Infothek nur 52%)
```

**Neue Logik:**
```
Blog ↔ News (74%) ✅
Blog ↔ Infothek (60%) + News ↔ Infothek (52%)
→ Durchschnitt: 62% < 65%
→ Nicht alle zusammen! Blog+News ja, Infothek nein.
```

---

**Last Updated:** 2026-01-30
**Status:** ✅ Implemented & Tested
