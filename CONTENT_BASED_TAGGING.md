# Content-Based Cluster Analysis & Tagging System

## 🎯 Problem gelöst

**Vorher (Slug-basiert):**
```typescript
if (url.includes('/blog/')) return '/insights/blog/[slug]';
if (url.includes('/news/')) return '/insights/news/[slug]';
```
❌ **Problem:** Entscheidung basiert auf URL-Struktur, nicht auf Inhalt!

**Nachher (Content-basiert):**
```typescript
// Analysiere Content-Eigenschaften:
- Durchschnittliche Wortanzahl
- Bild-zu-Text-Verhältnis
- Thematische Überschneidung (Keywords)
- Content-Typ (Article, Service, Product)

// Wenn ähnlich (Score ≥ 60):
→ Merge zu /insights/[slug] + Tags
// Wenn unterschiedlich:
→ Separate Hubs
```
✅ **Lösung:** Intelligente Merge-Entscheidung + Original-Kategorie als Tag!

---

## 🏗️ Architektur

### 1. Content Similarity Analyzer

[content-similarity-analyzer.ts](web-architect-ai/src/modules/analysis/services/content-similarity-analyzer.ts)

**Analysiert:**
1. **Content Signature** (quantitativ):
   - Durchschnittliche Wortanzahl
   - Durchschnittliche Bildanzahl
   - Durchschnittliche Formularanzahl
   - Schema.org Markup

2. **Topic Vector** (qualitativ):
   - Top 10 Keywords aus Titeln + H1-H3
   - Thematische Überschneidung (Jaccard Similarity)

3. **Metadata**:
   - Publikationsdichte (high/medium/low)
   - Content-Typ (article/service/product/landing)

### 2. Similarity Scoring

**Score-Komponenten (0-100):**

| Kriterium | Max Punkte | Berechnung |
|-----------|------------|------------|
| **Wortanzahl-Ähnlichkeit** | 25 | 1 - (diff / max) |
| **Bildanzahl-Ähnlichkeit** | 15 | 1 - (diff / max) |
| **Keyword-Überschneidung** | 40 | Jaccard Index |
| **Content-Typ Match** | 20 | Exakte Übereinstimmung |

**Schwellwerte:**
- **≥ 80:** Sehr ähnlich → Definitiv mergen
- **60-79:** Ähnlich → Empfehlung zum Mergen
- **<60:** Unterschiedlich → Separate Hubs

---

## 🏷️ Tag-System

### Automatic Tag Generation

**Aus Pattern extrahiert:**
```typescript
/blog/[item]     → Tag: "blog"
/news/[slug]     → Tag: "news"
/infothek/guide  → Tag: "infothek"
```

**In Migration Plan gespeichert:**
```json
{
  "old_url": "/blog/seo-guide",
  "new_path": "/insights/seo-guide",
  "action": "redirect",
  "originalCategory": "blog",  // ← NEW: Tag!
  "contentType": "article"     // ← NEW: Type!
}
```

**Frontend-Nutzung:**
```typescript
// Next.js Page
const article = {
  slug: "seo-guide",
  category: "blog",  // Original-Quelle
  tags: ["SEO", "Marketing"],
  type: "article"
};

// Schema.org
{
  "@type": "BlogPosting",
  "articleSection": "blog",  // Original-Kategorie
  "keywords": ["SEO", "Marketing"]
}
```

---

## 📊 Beispiel: ganztags.net

### Input-Cluster

**Cluster 1: /blog/[item]**
```
Avg Word Count: 720
Avg Images: 2.3
Keywords: [seo, content, marketing, strategie, google]
Content Type: article
Pages: 25
```

**Cluster 2: /news/[item]**
```
Avg Word Count: 680
Avg Images: 2.1
Keywords: [trends, news, updates, marketing, google]
Content Type: article
Pages: 12
```

**Cluster 3: /infothek/[item]**
```
Avg Word Count: 890
Avg Images: 1.8
Keywords: [guide, how-to, anleitung, tipps, seo]
Content Type: article
Pages: 8
```

### Similarity Analysis

**Blog ↔ News:**
```
Word Count: 720 vs 680 → 94% similar → 24 pts
Images: 2.3 vs 2.1 → 91% similar → 14 pts
Keywords: [google, marketing] overlap → 40% → 16 pts
Content Type: article = article → 20 pts
---
Total: 74/100 → MERGE RECOMMENDED ✅
```

**Blog ↔ Infothek:**
```
Word Count: 720 vs 890 → 81% similar → 20 pts
Images: 2.3 vs 1.8 → 78% similar → 12 pts
Keywords: [seo] overlap → 20% → 8 pts
Content Type: article = article → 20 pts
---
Total: 60/100 → BORDERLINE (User decides)
```

### Output

**Merged Structure:**
```
/insights/[slug]
  ├─ seo-guide (tag: blog)
  ├─ content-trends (tag: news)
  ├─ how-to-guide (tag: infothek)
```

**Migration Plan (enriched):**
```json
{
  "page_mapping": [
    {
      "old_url": "/blog/seo-guide",
      "new_path": "/insights/seo-guide",
      "originalCategory": "blog",
      "contentType": "article"
    },
    {
      "old_url": "/news/content-trends",
      "new_path": "/insights/content-trends",
      "originalCategory": "news",
      "contentType": "article"
    }
  ],
  "contentAnalysis": {
    "mergeRecommendations": [
      {
        "cluster1Id": "cluster_0",
        "cluster2Id": "cluster_1",
        "similarityScore": 74,
        "shouldMerge": true,
        "reason": "Ähnlicher Content (Score: 74/100): Ähnliche Textlänge: 720 vs 680 Wörter, Thematische Überschneidung: 40%",
        "suggestedTag1": "blog",
        "suggestedTag2": "news"
      }
    ],
    "mergeGroups": [
      {
        "targetHub": "group-0",
        "mergedCategories": ["blog", "news", "infothek"]
      }
    ]
  }
}
```

---

## 🎨 Frontend-Implementation

### Next.js Example

**1. Page Structure**
```typescript
// app/insights/[slug]/page.tsx
export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);

  return (
    <>
      {/* Category Badge */}
      <Badge variant={getCategoryColor(article.originalCategory)}>
        {article.originalCategory}
      </Badge>

      <h1>{article.title}</h1>

      {/* Schema.org */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@type": "BlogPosting",
          "articleSection": article.originalCategory,
          "keywords": article.tags
        })}
      </script>
    </>
  );
}
```

**2. Category Filtering**
```typescript
// app/insights/page.tsx
export default function InsightsPage({ searchParams }: { searchParams: { category?: string } }) {
  const articles = searchParams.category
    ? getArticles({ category: searchParams.category })
    : getAllArticles();

  return (
    <>
      {/* Category Filter */}
      <div className="filters">
        <Link href="/insights">All</Link>
        <Link href="/insights?category=blog">Blog</Link>
        <Link href="/insights?category=news">News</Link>
        <Link href="/insights?category=infothek">Guides</Link>
      </div>

      {/* Articles */}
      {articles.map(article => <ArticleCard {...article} />)}
    </>
  );
}
```

**3. RSS Feeds per Category**
```typescript
// app/insights/[category]/feed.xml/route.ts
export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  const articles = getArticles({ category: params.category });

  return new Response(generateRSS(articles), {
    headers: { 'Content-Type': 'application/xml' }
  });
}
```

---

## 🔧 Configuration

### Enable/Disable Content Analysis

[actions.ts:119-121](web-architect-ai/src/app/actions.ts#L119-L121)

```typescript
// Enable (default):
const enrichedData = ContentSimilarityAnalyzer.enrichMigrationPlanWithTags(
  data, clusters, normalizedStructure
);

// Disable (use URL-based only):
// Comment out enrichment step
```

### Adjust Similarity Threshold

[content-similarity-analyzer.ts:85](web-architect-ai/src/modules/analysis/services/content-similarity-analyzer.ts#L85)

```typescript
const shouldMerge = score >= 60; // Default: 60

// More aggressive merging:
const shouldMerge = score >= 50;

// More conservative:
const shouldMerge = score >= 75;
```

### Custom Tag Extraction

[content-similarity-analyzer.ts:321-330](web-architect-ai/src/modules/analysis/services/content-similarity-analyzer.ts#L321-L330)

```typescript
private static extractTagFromPattern(pattern: string): string {
  // Custom logic:
  if (pattern.includes('artikel')) return 'article';
  if (pattern.includes('produkt')) return 'product';

  // Default:
  const segments = pattern.split('/').filter(Boolean);
  return segments[0] || 'general';
}
```

---

## 📈 Benefits

### SEO
- ✅ **Category Preservation:** Original-Struktur bleibt als Metadata erhalten
- ✅ **Schema.org:** `articleSection` für bessere Topic-Zuordnung
- ✅ **Internal Linking:** "More from Blog" / "More from News" Sections

### UX
- ✅ **Filtering:** User kann nach Original-Kategorie filtern
- ✅ **Visual Cues:** Badges zeigen Quelle (Blog/News/Guides)
- ✅ **RSS Feeds:** Separate Feeds per Kategorie

### Development
- ✅ **Flexibilität:** Ein Template, verschiedene Kategorien
- ✅ **Einfacher Content-Import:** Tags bleiben erhalten
- ✅ **Analytics:** Track Performance per Original-Kategorie

---

## 🆚 Vergleich: Hierarchisch vs. Tags

### Option A: Hierarchische Struktur
```
/insights/blog/[slug]
/insights/news/[slug]
/insights/infothek/[slug]
```

**Pros:**
- URL zeigt Kategorie direkt
- Einfaches Routing

**Cons:**
- Längere URLs
- Weniger flexibel (was wenn Artikel zu 2 Kategorien passt?)
- Komplexere Migration (3 separate Patterns)

---

### Option B: Flat + Tags (Current)
```
/insights/[slug]
  metadata: { originalCategory: 'blog' | 'news' | 'infothek' }
```

**Pros:**
- ✅ Kürzere URLs
- ✅ Multi-Tagging möglich (`['blog', 'seo']`)
- ✅ Einfachere Struktur (1 Pattern)
- ✅ Flexibles Filtering
- ✅ Original-Quelle dokumentiert

**Cons:**
- Kategorie nicht in URL sichtbar (aber in Breadcrumbs/Badges)

**Empfehlung:** ✅ **Option B (Tags)** ist besser für moderne Websites!

---

## 🧪 Testing

### Console Output

```
📊 [ContentAnalysis] Analyzing cluster similarity...
📊 [ContentAnalysis] Found 2 merge recommendations
   ✅ cluster_0 + cluster_1: 74% - Ähnlicher Content (Score: 74/100): Ähnliche Textlänge: 720 vs 680 Wörter, Thematische Überschneidung: 40%
   ❌ cluster_0 + cluster_2: 58% - Unterschiedlicher Content (Score: 58/100)
```

### Migration Plan Inspection

```typescript
console.log(migrationPlan.contentAnalysis);
// Output:
{
  clusterProfiles: [
    { clusterId: 'cluster_0', pattern: '/blog/[item]', contentSignature: {...} },
    { clusterId: 'cluster_1', pattern: '/news/[item]', contentSignature: {...} }
  ],
  mergeRecommendations: [
    { cluster1Id: 'cluster_0', cluster2Id: 'cluster_1', similarityScore: 74, shouldMerge: true }
  ],
  mergeGroups: [
    { targetHub: 'group-0', mergedCategories: ['blog', 'news'] }
  ]
}
```

---

## 🚀 Future Enhancements

### 1. AI-Powered Keyword Extraction
```typescript
// Current: Simple tokenization
const keywords = extractTopKeywords(text);

// Future: Use OpenAI Embeddings
const embeddings = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: text
});
const similarity = cosineSimilarity(embedding1, embedding2);
```

### 2. Topic Modeling
```typescript
// Use LDA (Latent Dirichlet Allocation) for topic discovery
const topics = await identifyTopics(clusterTexts);
// Topics: ["SEO", "Content Marketing", "Analytics"]
```

### 3. User Feedback Loop
```typescript
// Let user override merge recommendations
{
  "mergeRecommendation": {
    "score": 74,
    "shouldMerge": true,
    "userOverride": false  // ← User says "keep separate"
  }
}
```

---

## 📝 Migration Guide

### Before (Old System)
```json
{
  "old_url": "/blog/seo-guide",
  "new_path": "/insights/blog/seo-guide"
}
```

### After (New System)
```json
{
  "old_url": "/blog/seo-guide",
  "new_path": "/insights/seo-guide",
  "originalCategory": "blog",
  "contentType": "article"
}
```

### Frontend Update
```diff
// pages/insights/[slug].tsx
- const breadcrumbs = ["Insights", article.title];
+ const breadcrumbs = ["Insights", article.originalCategory, article.title];

- <h1>{article.title}</h1>
+ <Badge>{article.originalCategory}</Badge>
+ <h1>{article.title}</h1>
```

---

**Last Updated:** 2026-01-30
**Status:** ✅ Implemented & Ready
