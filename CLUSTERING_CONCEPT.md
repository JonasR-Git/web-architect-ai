# Clustering Konzept - User-Controlled Auto-Detection

## 🤔 Problem-Analyse

### Ist Auto-Clustering wirklich nötig?

**Aktueller Zustand:**
- Auto-Clustering ist **absichtlich deaktiviert** (grouping.ts:144)
- Kommentar: "Auto-Clustering is disabled to follow strict manual archetypes"
- Nur `forceArchetypes` funktionieren

**Frage:** War das eine bewusste Design-Entscheidung?

**Analyse der User Journey:**

```
Szenario 1: User ohne Ahnung
┌─────────────────────────────────┐
│ 1. Crawl → 100 Seiten gefunden  │
│ 2. Keine Cluster definiert      │
│ 3. AI sieht 100 unique pages    │
│ 4. Generiert 100 page_mapping   │
│ 5. ❌ Unmöglich zu managen!      │
└─────────────────────────────────┘

Szenario 2: User mit Wissen
┌─────────────────────────────────┐
│ 1. Crawl → 100 Seiten gefunden  │
│ 2. User sieht Pattern-Vorschlag │
│ 3. Akzeptiert: /blog/[item]     │
│ 4. AI sieht: 1 Pattern, 25 Rest │
│ 5. ✅ Überschaubar!              │
└─────────────────────────────────┘
```

**Ergebnis:** Auto-DETECTION (Vorschläge) ist wichtig, Auto-CLUSTERING (Zwang) nicht!

---

## ✅ Empfohlenes Konzept: "Suggested Archetypes"

### Phase 1: Auto-Detection (Backend)

**Datei:** `src/modules/core/utils/pattern-detector.ts` (NEU)

**Zweck:** Erkennt potenzielle Patterns ohne sie zu erzwingen

```typescript
export interface PatternSuggestion {
    pattern: string;              // "/blog/[item]"
    confidence: number;           // 0-100
    instanceCount: number;        // Anzahl passender Seiten
    examples: string[];           // 3 Beispiel-URLs
    reason: string;               // "75 pages follow /blog/* pattern"
    suggestion: 'cluster' | 'keep-unique';
}

export class PatternDetector {
    /**
     * Analysiert SiteStructure und schlägt Patterns vor
     */
    static detectPatterns(
        structure: SiteStructure,
        minClusterSize: number = 5,
        maxDepth: number = 3
    ): PatternSuggestion[] {
        const pathGroups = new Map<string, string[]>();

        // Gruppiere nach Pfad-Mustern
        structure.nodes.forEach(node => {
            const url = new URL(node.url);
            const path = url.pathname;
            const segments = path.split('/').filter(Boolean);

            // Versuche verschiedene Pattern-Tiefen
            for (let depth = 1; depth <= Math.min(segments.length - 1, maxDepth); depth++) {
                const baseSegments = segments.slice(0, depth);
                const potentialPattern = '/' + baseSegments.join('/') + '/[item]';

                if (!pathGroups.has(potentialPattern)) {
                    pathGroups.set(potentialPattern, []);
                }
                pathGroups.get(potentialPattern)!.push(node.url);
            }
        });

        // Filtere und bewerte
        const suggestions: PatternSuggestion[] = [];

        pathGroups.forEach((urls, pattern) => {
            // Nur wenn genug Instanzen
            if (urls.length < minClusterSize) return;

            // Confidence-Score basierend auf:
            // - Anzahl der Instanzen (mehr = höher)
            // - Konsistenz der URL-Struktur
            // - Tiefe (flacher = höher)
            const confidence = this.calculateConfidence(pattern, urls, structure);

            // Nur hohe Confidence vorschlagen
            if (confidence >= 60) {
                suggestions.push({
                    pattern,
                    confidence,
                    instanceCount: urls.length,
                    examples: this.selectExamples(urls),
                    reason: `${urls.length} pages follow ${pattern} pattern`,
                    suggestion: urls.length >= 10 ? 'cluster' : 'keep-unique'
                });
            }
        });

        // Sortiere nach Confidence
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }

    private static calculateConfidence(
        pattern: string,
        urls: string[],
        structure: SiteStructure
    ): number {
        let score = 0;

        // Factor 1: Anzahl (mehr = besser)
        if (urls.length >= 20) score += 40;
        else if (urls.length >= 10) score += 30;
        else if (urls.length >= 5) score += 20;

        // Factor 2: Konsistenz (gleiche Segment-Anzahl)
        const segmentCounts = urls.map(u => new URL(u).pathname.split('/').length);
        const uniqueCounts = new Set(segmentCounts).size;
        if (uniqueCounts === 1) score += 30; // Perfekt konsistent
        else if (uniqueCounts <= 2) score += 20;

        // Factor 3: Content-Ähnlichkeit (Word Count Variance)
        const nodes = urls.map(u => structure.nodes.find(n => n.url === u)).filter(Boolean);
        const wordCounts = nodes.map(n => n!.content.wordCount || 0);
        const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
        const variance = wordCounts.reduce((sum, wc) => sum + Math.abs(wc - avgWordCount), 0) / wordCounts.length;

        // Niedrige Variance = ähnlicher Content = gutes Cluster
        if (variance < avgWordCount * 0.2) score += 30; // < 20% Variance
        else if (variance < avgWordCount * 0.5) score += 15;

        return Math.min(score, 100);
    }

    private static selectExamples(urls: string[]): string[] {
        // 3 Beispiele: Erstes, Mittleres, Letztes
        if (urls.length <= 3) return urls;
        return [
            urls[0],
            urls[Math.floor(urls.length / 2)],
            urls[urls.length - 1]
        ];
    }
}
```

---

### Phase 2: UI Integration (Frontend)

**Datei:** `src/app/page.tsx` oder neue Komponente

**UI Flow:**

```
┌────────────────────────────────────────────────────────┐
│ 🔍 Pattern-Vorschläge (3 gefunden)                     │
│                                                         │
│ ✅ /blog/[item]                                         │
│    📊 75 Seiten (Confidence: 95%)                      │
│    📝 Beispiele: /blog/post-1, /blog/post-40, ...      │
│    [✓ Akzeptieren] [✏️ Anpassen] [❌ Ignorieren]       │
│                                                         │
│ ⚠️  /news/[item]                                        │
│    📊 12 Seiten (Confidence: 72%)                      │
│    📝 Beispiele: /news/update-1, /news/update-12       │
│    [✓ Akzeptieren] [✏️ Anpassen] [❌ Ignorieren]       │
│                                                         │
│ ⚠️  /services/[item]                                    │
│    📊 5 Seiten (Confidence: 65%)                       │
│    💡 Zu wenig Instanzen - besser als Unique Pages?    │
│    [✓ Akzeptieren] [❌ Ignorieren]                     │
│                                                         │
│ [+ Manuelles Pattern hinzufügen]                       │
└────────────────────────────────────────────────────────┘
```

**User Actions:**

1. **Akzeptieren** → Pattern wird zu `forceArchetypes` hinzugefügt
2. **Anpassen** → Modal öffnet sich:
   ```
   Pattern bearbeiten:
   ┌─────────────────────────────────────┐
   │ Pattern: /blog/[item]               │
   │ Custom Name: Blog Posts             │
   │ Min Instances: 5                    │
   │ [Speichern] [Abbrechen]             │
   └─────────────────────────────────────┘
   ```
3. **Ignorieren** → Pattern wird zu `ignorePatterns` hinzugefügt

---

### Phase 3: Dynamisches Re-Clustering

**Problem:** User ändert Pattern → Muss neu clustern

**Lösung:** Reaktives System

```typescript
// In page.tsx
const [acceptedPatterns, setAcceptedPatterns] = useState<string[]>([]);
const [ignoredPatterns, setIgnoredPatterns] = useState<string[]>([]);

// Wenn User Pattern akzeptiert
const handleAcceptPattern = (pattern: string) => {
    setAcceptedPatterns(prev => [...prev, pattern]);

    // Re-cluster mit neuen Patterns
    const newOverrides: ClusterOverrides = {
        forceArchetypes: acceptedPatterns,
        ignorePatterns: ignoredPatterns
    };

    // Trigger re-grouping
    reclusterWithNewPatterns(newOverrides);
};

// Re-Clustering ohne neuen Crawl
const reclusterWithNewPatterns = (overrides: ClusterOverrides) => {
    // Verwende gecrawlte Struktur
    const grouped = groupSimilarPages(structure, 3, 5, overrides);

    // Update UI
    updateClusterView(grouped);
};
```

---

### Phase 4: Pattern Auflösen

**Szenario:** User merkt, dass ein Pattern zu breit ist

**Beispiel:**
```
/content/[item] clustert:
- /content/blog/*
- /content/news/*
- /content/guides/*
```

**Lösung 1: Pattern splitten**
```
UI Action: "Split Pattern"
→ Zeigt Sub-Patterns:
  - /content/blog/[item] (25 Seiten)
  - /content/news/[item] (12 Seiten)
  - /content/guides/[item] (8 Seiten)

User wählt: Alle 3 akzeptieren → Alte Pattern wird entfernt
```

**Lösung 2: Pattern als Unique markieren**
```
UI Action: "Uncluster"
→ Pattern wird entfernt
→ Alle Seiten werden zu Unique Pages
```

---

## 🎛️ Konfigurierbarkeit

### Level 1: Auto-Detection Aggressiveness

```typescript
interface DetectionConfig {
    minClusterSize: number;      // Default: 5
    minConfidence: number;        // Default: 60
    maxDepth: number;             // Default: 3
    autoAcceptThreshold: number;  // Default: 90 (auto-accept if >= 90%)
}
```

**Presets:**
```typescript
const PRESETS = {
    conservative: {
        minClusterSize: 10,
        minConfidence: 80,
        maxDepth: 2,
        autoAcceptThreshold: 95
    },
    balanced: {
        minClusterSize: 5,
        minConfidence: 60,
        maxDepth: 3,
        autoAcceptThreshold: 90
    },
    aggressive: {
        minClusterSize: 3,
        minConfidence: 50,
        maxDepth: 4,
        autoAcceptThreshold: 70
    }
};
```

---

### Level 2: Content-Based Clustering

**Zusätzlich zu URL-Patterns:**

```typescript
interface ContentClusterSuggestion {
    urls: string[];
    reason: string;  // "Similar word count (720±50), same content type (article)"
    confidence: number;
    suggestedPattern?: string;  // Optional: Vorgeschlagenes Pattern
}

// Beispiel
{
    urls: ["/about", "/team", "/mission"],
    reason: "All are short pages (200-300 words) with team photos",
    confidence: 75,
    suggestedPattern: "/company/[page]"  // Vorschlag für neue Struktur
}
```

---

## 📊 Vergleich: Alt vs. Neu

### ALT (Aktuell)
```
❌ Kein Auto-Clustering
❌ User muss alle Patterns manuell definieren
❌ Keine Vorschläge
✅ Volle Kontrolle
✅ Keine unerwarteten Cluster
```

### NEU (Vorgeschlagen)
```
✅ Auto-DETECTION (Vorschläge)
✅ User kann Vorschläge annehmen/ablehnen
✅ Intelligente Confidence-Scores
✅ Volle Kontrolle (wie vorher)
✅ Aber: Weniger manuelle Arbeit
❌ Zusätzliche UI-Komplexität
```

---

## 🔄 Workflow-Beispiel: ganztags.net

### Schritt 1: Crawl
```
✅ 68 Seiten gecrawlt
```

### Schritt 2: Auto-Detection
```
📊 Pattern-Analyse läuft...

Gefunden:
1. /blog/[item] - 75 Seiten (Confidence: 95%) ✅
2. /leistungen/[item] - 20 Seiten (Confidence: 88%) ✅
3. /casestudies/[item] - 13 Seiten (Confidence: 92%) ✅
4. /news/[item] - 5 Seiten (Confidence: 65%) ⚠️
5. /infothek/[item] - 2 Seiten (Confidence: 40%) ❌ (zu wenig)
```

### Schritt 3: User Review
```
User akzeptiert: 1, 2, 3
User ignoriert: 4 (will einzeln managen)
```

### Schritt 4: Re-Cluster
```
Cluster:
- /blog/[item]: 75 Seiten
- /leistungen/[item]: 20 Seiten
- /casestudies/[item]: 13 Seiten

Unique Pages: 15 Seiten (inkl. /news/*)
```

### Schritt 5: AI Migration
```
AI sieht:
- 3 Cluster (108 Seiten total → 9 Beispiele)
- 15 Unique Pages

Generiert:
- 3 pattern_mapping Einträge
- 15 page_mapping Einträge

✅ Statt 68 Einträgen nur 18!
```

---

## ⚖️ Ist das wirklich nötig?

### Szenario-Analyse

**Klein-Websites (< 20 Seiten):**
- ❌ Auto-Detection NICHT nötig
- Alle Seiten sind wahrscheinlich unique
- Manuelle Definition ist schnell

**Mittel-Websites (20-100 Seiten):**
- ✅ Auto-Detection HILFREICH
- Typischerweise 2-5 Patterns
- Spart 10-15 Minuten manuelle Arbeit

**Groß-Websites (> 100 Seiten):**
- ✅✅ Auto-Detection KRITISCH
- Ohne Vorschläge ist manuelle Arbeit unmöglich
- Beispiel: 500 Blog-Posts einzeln zu mappen ist unrealistisch

---

## 🎯 Empfehlung: Implementierung in Phasen

### Phase 1: Backend Pattern-Detection (HOCH)
**Aufwand:** 2 Stunden
**Wert:** Hoch - Fundament für alles andere

**Dateien:**
- `src/modules/core/utils/pattern-detector.ts` (NEU)
- `src/app/actions.ts` (Integration)

**Deliverable:** API-Endpoint, der Vorschläge zurückgibt

---

### Phase 2: Minimal-UI für Vorschläge (MITTEL)
**Aufwand:** 1 Stunde
**Wert:** Mittel - User kann Vorschläge sehen

**Dateien:**
- `src/app/page.tsx` (Anzeige der Vorschläge)

**Deliverable:** Liste mit "Accept/Ignore" Buttons

---

### Phase 3: Erweiterte Pattern-Bearbeitung (NIEDRIG)
**Aufwand:** 2 Stunden
**Wert:** Niedrig - Nice-to-have

**Features:**
- Pattern umbenennen
- Pattern splitten
- Custom Patterns hinzufügen

---

### Phase 4: Content-Based Clustering (OPTIONAL)
**Aufwand:** 4 Stunden
**Wert:** Niedrig - Experimentell

**Features:**
- Clustering basierend auf Content-Ähnlichkeit statt URL

---

## ✅ Finales Konzept-Statement

**Was implementieren:**
1. ✅ **Pattern-Detection** (Backend) - JA, kritisch für UX
2. ✅ **Minimal-UI für Akzeptieren/Ignorieren** - JA, einfach & wertvoll
3. ⚠️  **Erweiterte Bearbeitung** - SPÄTER, wenn Bedarf besteht
4. ❌ **Auto-Clustering ohne User-Input** - NEIN, zu aggressiv

**Was NICHT implementieren:**
- Automatisches Clustering ohne User-Zustimmung
- Komplexe Content-Analysen für Pattern-Vorschläge (erstmal)
- Drag-and-Drop Pattern-Editor (overkill)

---

**Erstellt:** 2026-01-30
**Status:** ✅ Konzept fertig, bereit für Review
