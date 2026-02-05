# ✅ Standalone Pages Feature - Implementierung Abgeschlossen

## 📋 Übersicht

Das **Standalone Pages Feature** ist vollständig implementiert und erlaubt es, Seiten aus dem automatischen Clustering auszuschließen. Die KI kann später entscheiden, ob sie diese Seiten trotzdem zusammenführt.

## 🎯 Funktionalität

### Was macht das Feature?

- ✅ **Seiten als "Standalone" markieren** → Werden NICHT automatisch geclustert
- ✅ **Flexibel**: KI kann später entscheiden, ob Zusammenführung sinnvoll ist
- ✅ **Programmatisch steuerbar**: Via TypeScript/JavaScript API
- ✅ **UI-Komponenten**: React-Komponenten für Benutzerinteraktion
- ✅ **Migration Mapping**: JSON-basierte Konfiguration
- ✅ **Bulk-Operationen**: Mehrere Seiten gleichzeitig markieren

## 📦 Erstellte Dateien

### 1. **Core Utilities** (`/src/lib/utils/page-clustering.ts`)
Haupt-Utility-Funktionen für Clustering-Kontrolle:
- `markPageAsStandalone()` - Einzelne Seite markieren
- `allowPageClustering()` - Standalone-Flag entfernen
- `markPagesAsStandalone()` - Bulk-Markierung
- `getStandalonePages()` - Alle standalone Seiten abrufen
- `filterClusterablePages()` - Filtern für Clustering
- `applyMigrationMappingRules()` - Migration Mapping laden
- `exportStandalonePagesToMappingFormat()` - Export zu JSON
- `getClusteringStats()` - Statistiken generieren

### 2. **Type Extensions** (`/src/types/index.ts`)
```typescript
interface SiteNode {
  // ... existing fields

  // NEW: Clustering Control
  excludeFromClustering?: boolean;
  clusterExclusionReason?: string;
  clusterExclusionTimestamp?: number;
}
```

### 3. **React Components** (`/src/modules/analysis/components/standalone-page-toggle.tsx`)
- `<StandalonePageToggle>` - Einzelne Seite toggle
- `<BulkStandaloneToggle>` - Bulk-Operationen
- `<StandaloneStats>` - Statistik-Anzeige

### 4. **JSON Schema** (`/migration-mapping.schema.json`)
JSON Schema für Migration Mapping mit vollständiger Validierung:
```json
{
  "old_url": "/page",
  "new_path": "/page",
  "action": "keep",
  "type": "page",
  "standalone": true,  // ← NEU
  "description": "..."
}
```

### 5. **Dokumentation** (`/docs/STANDALONE-PAGES.md`)
Vollständige Dokumentation mit:
- Anwendungsfälle & Best Practices
- API-Referenz
- Code-Beispiele
- Troubleshooting

### 6. **Beispiele** (`/examples/standalone-pages-example.ts`)
8 vollständige Beispiele für verschiedene Use-Cases

## 🚀 Schnellstart

### 1. Einzelne Seite markieren

```typescript
import { markPageAsStandalone } from '@/lib/utils/page-clustering';

const updated = markPageAsStandalone(
  nodes,
  'https://example.com/landing',
  'Unique marketing design'
);
```

### 2. Via Migration Mapping

```json
{
  "mapping": [
    {
      "old_url": "/impressum",
      "new_path": "/impressum",
      "action": "keep",
      "type": "page",
      "standalone": true,
      "description": "Legal page - must stay standalone"
    }
  ]
}
```

```typescript
import { applyMigrationMappingRules } from '@/lib/utils/page-clustering';
import mapping from './migration-mapping.json';

const nodes = applyMigrationMappingRules(siteNodes, mapping.mapping);
```

### 3. UI Component

```tsx
import { StandalonePageToggle } from '@/modules/analysis/components/standalone-page-toggle';

<StandalonePageToggle
  page={siteNode}
  onToggle={(url, isStandalone, reason) => {
    // Handle toggle
  }}
/>
```

### 4. Clustering mit Filter

```typescript
import { filterClusterablePages } from '@/lib/utils/page-clustering';

const { clusterable, excluded } = filterClusterablePages(nodes, {
  respectManualFlags: true
});

// Nur 'clusterable' an Clustering-Algorithmus übergeben
const clusters = performClustering(clusterable);
```

## 📊 Migration Mapping Erweiterungen

### Neue Felder

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `standalone` | `boolean` | Page aus Clustering ausschließen |
| `excludeFromClustering` | `boolean` | Alias für `standalone` |
| `status` | `number` | HTTP Status (301, 302, 410) |
| `priority` | `number` | Priorität bei mehreren Matches |
| `content_migrated` | `boolean` | Content migriert? |
| `migrated_at` | `string` | Migrations-Datum |
| `use_regex` | `boolean` | RegEx-Pattern verwenden |
| `tags` | `string[]` | Tags für Organisierung |

### Beispiel Migration Mapping

```json
{
  "version": "1.0",
  "migration_date": "2026-02-03",
  "domain": "musikkreis-donnersberg.de",
  "mapping": [
    {
      "old_url": "/",
      "new_path": "/",
      "action": "merge",
      "type": "layout",
      "standalone": false,
      "priority": 10,
      "description": "Homepage - can cluster"
    },
    {
      "old_url": "/kontakt",
      "new_path": "/contact",
      "action": "keep",
      "type": "page",
      "standalone": true,
      "priority": 5,
      "status": 200,
      "description": "Contact form - unique layout"
    },
    {
      "old_url_pattern": "^/blog/(\\d{4})/(\\d{2})/(.+)\\.htm$",
      "new_path_template": "/blog/{1}/{2}/{3}",
      "action": "redirect",
      "type": "page",
      "status": 301,
      "use_regex": true,
      "standalone": false,
      "description": "Blog posts - can cluster by year"
    }
  ]
}
```

## 🔍 Use Cases

### ✅ Sollte Standalone sein:
- **Landing Pages** - Einzigartiges Marketing-Design
- **Kontaktformulare** - Spezielle Interaktionsmuster
- **Impressum/Datenschutz** - Rechtliche Seiten mit fester Struktur
- **404/Error Pages** - Fehlerseiten mit speziellem Layout
- **E-Commerce Checkout** - Eindeutige Checkout-Flows

### ❌ Kann geclustert werden:
- **Blog Posts** - Ähnliche Artikel zusammenfassen
- **Produktseiten** - Produkte mit gleichem Layout
- **Team-Profile** - Mitarbeiter mit identischer Struktur
- **FAQ-Seiten** - FAQs mit wiederkehrendem Aufbau

## 📈 Statistiken & Monitoring

```typescript
import { getClusteringStats } from '@/lib/utils/page-clustering';

const stats = getClusteringStats(nodes);
console.log(stats);
// Output:
// {
//   total: 100,
//   clusterable: 85,
//   excluded: 15,
//   exclusionReasons: {
//     'Legal pages - fixed structure': 3,
//     'Unique marketing design': 8,
//     'Form pages - unique layouts': 4
//   }
// }
```

## 🛠️ Integration in bestehenden Code

### Vor dem Clustering:

```typescript
import { filterClusterablePages } from '@/lib/utils/page-clustering';

// OLD (ohne Standalone-Filter)
const clusters = performClustering(allNodes);

// NEW (mit Standalone-Filter)
const { clusterable, excluded } = filterClusterablePages(allNodes, {
  respectManualFlags: true
});
const clusters = performClustering(clusterable);

// Standalone-Seiten als einzelne "Cluster" behandeln
const standaloneAsClusters = excluded.map(page => ({
  id: `standalone-${page.url}`,
  pages: [page],
  isStandalone: true
}));

const allClusters = [...clusters, ...standaloneAsClusters];
```

## ✅ Build Status

**Status**: ✅ Build erfolgreich (0 Fehler, 0 Warnungen)

```bash
npm run build
# ✓ Compiled successfully
```

## 📚 Dokumentation

- **Vollständige Docs**: [`/docs/STANDALONE-PAGES.md`](./docs/STANDALONE-PAGES.md)
- **Beispiele**: [`/examples/standalone-pages-example.ts`](./examples/standalone-pages-example.ts)
- **JSON Schema**: [`/migration-mapping.schema.json`](./migration-mapping.schema.json)

## 🎨 UI Components Preview

### Standalone Toggle (Full)
```tsx
<StandalonePageToggle page={node} onToggle={handleToggle} />
```
- Shows lock/unlock icon
- Displays reason when standalone
- Allows adding/removing standalone flag
- Shows timestamp

### Standalone Toggle (Compact)
```tsx
<StandalonePageToggle page={node} onToggle={handleToggle} compact />
```
- Only icon (Lock/Unlock)
- Tooltip with reason
- Minimal space usage

### Bulk Toggle
```tsx
<BulkStandaloneToggle selectedPages={nodes} onToggle={handleBulk} />
```
- Mark multiple pages at once
- Shows count of selected pages
- Unified reason input

## 🔄 Workflow

1. **Crawl Website** → `SiteNode[]` erstellen
2. **Migration Mapping laden** → Standalone-Flags anwenden
3. **Dynamische Regeln** → Weitere Seiten programmatisch markieren
4. **Filter anwenden** → Clusterable vs Excluded trennen
5. **Clustering** → Nur clusterable Seiten verarbeiten
6. **Merge Results** → Standalone als einzelne Cluster behandeln

## 🚧 Nächste Schritte (Optional)

Das Feature ist vollständig einsatzbereit. Optionale Erweiterungen:

- [ ] **UI Integration** in bestehende Page-List-View
- [ ] **Server Action** für persistente Speicherung
- [ ] **Export-Feature** für Migration Mapping aus UI
- [ ] **Preset-Regeln** (z.B. "Alle Landing Pages → Standalone")
- [ ] **Undo/Redo** für Standalone-Änderungen

## 💡 Hinweis

Die KI kann **trotzdem** später entscheiden, markierte Seiten zusammenzuführen, wenn es sinnvoll ist. Das Standalone-Flag ist ein **Hinweis**, keine absolute Regel.

## 📞 Support

Bei Fragen oder Problemen:
1. Siehe [`/docs/STANDALONE-PAGES.md`](./docs/STANDALONE-PAGES.md) - Troubleshooting Sektion
2. Prüfe Beispiele in [`/examples/standalone-pages-example.ts`](./examples/standalone-pages-example.ts)
3. Validiere Migration Mapping mit Schema: [`/migration-mapping.schema.json`](./migration-mapping.schema.json)
