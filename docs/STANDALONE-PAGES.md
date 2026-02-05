# Standalone Pages - Clustering Control

## Übersicht

Das **Standalone Pages Feature** ermöglicht es, bestimmte Seiten aus dem automatischen Clustering auszuschließen. Seiten, die als "standalone" markiert sind, werden NICHT mit ähnlichen Seiten zusammengeführt, sondern bleiben eigenständig.

## Wann sollte man Seiten als Standalone markieren?

### ✅ **JA** - Diese Seiten sollten standalone sein:
- **Landing Pages**: Einzigartige Marketing-Seiten mit speziellem Design
- **Kontaktformulare**: Eigenständige Kontaktseiten
- **Impressum/Datenschutz**: Rechtliche Seiten mit fester Struktur
- **404/Error Pages**: Fehlerseiten mit speziellem Layout
- **Spezielle Events**: Zeitlich begrenzte Event-Seiten mit individuellem Design
- **E-Commerce Checkout**: Checkout-Flows mit eindeutiger Struktur

### ❌ **NEIN** - Diese Seiten können geclustert werden:
- **Blog Posts**: Ähnliche Artikel können zusammengefasst werden
- **Produktseiten**: Produkte mit gleichem Layout gruppieren
- **Team-Profile**: Mitarbeiterprofile mit identischer Struktur
- **FAQs**: FAQ-Seiten mit wiederkehrendem Aufbau

## Verwendung

### 1. **Programmatisch** (TypeScript/JavaScript)

```typescript
import { markPageAsStandalone, allowPageClustering } from '@/lib/utils/page-clustering';
import { SiteNode } from '@/types';

// Seite als standalone markieren
const updatedNodes = markPageAsStandalone(
  nodes,
  'https://example.com/landing',
  'Spezielle Marketing Landing Page'
);

// Standalone-Flag entfernen (Clustering wieder erlauben)
const clusterable = allowPageClustering(
  nodes,
  'https://example.com/landing'
);

// Mehrere Seiten auf einmal markieren
const bulkUpdated = markPagesAsStandalone(
  nodes,
  [
    'https://example.com/landing',
    'https://example.com/contact',
    'https://example.com/impressum'
  ],
  'Rechtliche und Marketing-Seiten'
);
```

### 2. **UI Component** (React)

```tsx
import { StandalonePageToggle, BulkStandaloneToggle } from '@/modules/analysis/components/standalone-page-toggle';

// Einzelne Seite
<StandalonePageToggle
  page={siteNode}
  onToggle={(url, isStandalone, reason) => {
    // Handle toggle
    console.log(`${url} is now ${isStandalone ? 'standalone' : 'clusterable'}`);
  }}
/>

// Kompakte Ansicht (nur Icon)
<StandalonePageToggle
  page={siteNode}
  onToggle={handleToggle}
  compact={true}
/>

// Bulk-Aktion für mehrere Seiten
<BulkStandaloneToggle
  selectedPages={selectedSiteNodes}
  onToggle={(urls, isStandalone, reason) => {
    // Handle bulk toggle
  }}
/>
```

### 3. **Migration Mapping** (JSON)

Füge `standalone: true` zu deiner `migration-mapping.json` hinzu:

```json
{
  "version": "1.0",
  "migration_date": "2026-02-03",
  "domain": "example.com",
  "mapping": [
    {
      "old_url": "/landing-page",
      "new_path": "/landing",
      "action": "keep",
      "type": "page",
      "standalone": true,
      "description": "Marketing Landing Page - einzigartiges Design"
    },
    {
      "old_url": "/impressum",
      "new_path": "/impressum",
      "action": "keep",
      "type": "page",
      "standalone": true,
      "description": "Rechtliche Seite - muss eigenständig bleiben"
    },
    {
      "old_url": "/blog/[slug]",
      "new_path": "/blog/[slug]",
      "action": "keep",
      "type": "page",
      "standalone": false,
      "description": "Blog Posts können geclustert werden"
    }
  ]
}
```

Dann im Code laden:

```typescript
import { applyMigrationMappingRules } from '@/lib/utils/page-clustering';
import mappingData from './migration-mapping.json';

const nodesWithStandaloneFlags = applyMigrationMappingRules(
  nodes,
  mappingData.mapping
);
```

## API Referenz

### Funktionen

#### `markPageAsStandalone(nodes, pageUrl, reason?)`
Markiert eine einzelne Seite als standalone.

**Parameter:**
- `nodes: SiteNode[]` - Array von Site-Nodes
- `pageUrl: string` - URL der zu markierenden Seite
- `reason?: string` - Optional: Grund für die Markierung

**Returns:** `SiteNode[]` - Aktualisierte Nodes

#### `allowPageClustering(nodes, pageUrl)`
Entfernt das Standalone-Flag von einer Seite.

**Parameter:**
- `nodes: SiteNode[]` - Array von Site-Nodes
- `pageUrl: string` - URL der Seite

**Returns:** `SiteNode[]` - Aktualisierte Nodes

#### `markPagesAsStandalone(nodes, pageUrls, reason?)`
Markiert mehrere Seiten gleichzeitig als standalone.

**Parameter:**
- `nodes: SiteNode[]` - Array von Site-Nodes
- `pageUrls: string[]` - Array von URLs
- `reason?: string` - Optional: Grund

**Returns:** `SiteNode[]` - Aktualisierte Nodes

#### `getStandalonePages(nodes)`
Gibt alle als standalone markierten Seiten zurück.

**Returns:** `SiteNode[]` - Nur standalone Seiten

#### `filterClusterablePages(nodes, options?)`
Filtert Seiten in clusterbar und ausgeschlossen.

**Parameter:**
- `nodes: SiteNode[]` - Array von Site-Nodes
- `options?: ClusteringOptions` - Optionale Konfiguration

**Returns:** `{ clusterable: SiteNode[], excluded: SiteNode[] }`

#### `getClusteringStats(nodes)`
Gibt Statistiken über Clustering zurück.

**Returns:**
```typescript
{
  total: number;
  clusterable: number;
  excluded: number;
  exclusionReasons: Record<string, number>;
}
```

## Type Definitions

### SiteNode Extensions

```typescript
interface SiteNode {
  // ... existing fields

  // NEW: Clustering Control
  excludeFromClustering?: boolean;
  clusterExclusionReason?: string;
  clusterExclusionTimestamp?: number;
}
```

### ClusteringOptions

```typescript
interface ClusteringOptions {
  excludedUrls?: string[];
  respectManualFlags?: boolean;
  minSimilarityThreshold?: number; // 0-100
}
```

## Beispiel-Workflow

### Szenario: Migration einer alten Website

```typescript
// 1. Website crawlen
const structure = await crawlWebsite('https://old-site.com');

// 2. Migration Mapping laden
const mapping = loadMigrationMapping();
const nodesWithFlags = applyMigrationMappingRules(
  structure.nodes,
  mapping.mapping
);

// 3. Zusätzliche Seiten manuell markieren
const finalNodes = markPagesAsStandalone(
  nodesWithFlags,
  ['/special-promo', '/limited-offer'],
  'Temporäre Marketing-Seiten'
);

// 4. Clustering durchführen (nur clusterbare Seiten)
const { clusterable, excluded } = filterClusterablePages(finalNodes, {
  respectManualFlags: true
});

console.log(`Clustering ${clusterable.length} pages`);
console.log(`Excluding ${excluded.length} standalone pages`);

const clusters = performClustering(clusterable);

// 5. Statistiken anzeigen
const stats = getClusteringStats(finalNodes);
console.log('Clustering Stats:', stats);
// Output: { total: 100, clusterable: 85, excluded: 15, exclusionReasons: {...} }
```

## Best Practices

### 1. **Dokumentiere den Grund**
Immer einen `reason` angeben, warum eine Seite standalone ist:

```typescript
// ✅ GUT
markPageAsStandalone(nodes, '/landing', 'Unique hero design with video background');

// ❌ SCHLECHT
markPageAsStandalone(nodes, '/landing'); // Reason fehlt
```

### 2. **Verwende Migration Mapping für permanente Regeln**
Für wiederkehrende Migrationen: Standalone-Flags in `migration-mapping.json` definieren statt im Code.

### 3. **Prüfe Statistiken vor dem Clustering**
```typescript
const stats = getClusteringStats(nodes);
if (stats.excluded > stats.clusterable * 0.5) {
  console.warn('Over 50% of pages are standalone - review your clustering strategy');
}
```

### 4. **Bulk-Operationen für ähnliche Seiten**
```typescript
// Alle rechtlichen Seiten auf einmal markieren
const legalPages = nodes
  .filter(n => n.url.match(/\/(impressum|datenschutz|agb|legal)/))
  .map(n => n.url);

markPagesAsStandalone(nodes, legalPages, 'Legal pages - fixed structure');
```

## Integration mit Clustering-Algorithmus

Beispiel: Clustering-Funktion, die Standalone-Seiten respektiert:

```typescript
function performClustering(nodes: SiteNode[], options?: ClusteringOptions) {
  // 1. Filter out standalone pages
  const { clusterable, excluded } = filterClusterablePages(nodes, {
    respectManualFlags: true,
    ...options
  });

  console.log(`Clustering ${clusterable.length} pages (${excluded.length} excluded)`);

  // 2. Perform clustering only on clusterable pages
  const clusters = clusterSimilarPages(clusterable);

  // 3. Add excluded pages as individual clusters (if needed)
  const standaloneAsIndividualClusters = excluded.map(node => ({
    id: `standalone-${node.url}`,
    pages: [node],
    isStandalone: true
  }));

  return [...clusters, ...standaloneAsIndividualClusters];
}
```

## Export/Import

### Export zu Migration Mapping

```typescript
import { exportStandalonePagesToMappingFormat } from '@/lib/utils/page-clustering';

const mappingEntries = exportStandalonePagesToMappingFormat(nodes);

const migrationMapping = {
  version: '1.0',
  migration_date: new Date().toISOString().split('T')[0],
  domain: 'example.com',
  mapping: mappingEntries
};

fs.writeFileSync('migration-mapping.json', JSON.stringify(migrationMapping, null, 2));
```

## Troubleshooting

### Problem: Seite wird trotzdem geclustert

**Lösung 1:** Prüfe, ob Flag korrekt gesetzt ist:
```typescript
const page = nodes.find(n => n.url === targetUrl);
console.log('excludeFromClustering:', page?.excludeFromClustering);
```

**Lösung 2:** Stelle sicher, dass `respectManualFlags: true` gesetzt ist:
```typescript
filterClusterablePages(nodes, { respectManualFlags: true });
```

### Problem: URL-Matching funktioniert nicht

**Lösung:** URLs werden normalisiert (lowercase, trailing slash entfernt). Prüfe mit:
```typescript
import { normalizeUrl } from '@/lib/utils/page-clustering';
console.log(normalizeUrl('https://Example.com/Path/'));
// Output: https://example.com/path
```

## Siehe auch

- [Migration Mapping Schema](../migration-mapping.schema.json)
- [Page Clustering Documentation](./PAGE-CLUSTERING.md)
- [Site Structure Analysis](./SITE-STRUCTURE.md)
