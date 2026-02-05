/**
 * Standalone Pages - Usage Examples
 *
 * Zeigt verschiedene Anwendungsfälle für das Standalone-Pages Feature
 */

import {
  markPageAsStandalone,
  allowPageClustering,
  markPagesAsStandalone,
  getStandalonePages,
  filterClusterablePages,
  getClusteringStats,
  applyMigrationMappingRules,
  exportStandalonePagesToMappingFormat
} from '@/lib/utils/page-clustering';
import { SiteNode } from '@/types';

// ============================================================================
// BEISPIEL 1: Einzelne Seite als Standalone markieren
// ============================================================================

function example1_markSinglePage(nodes: SiteNode[]) {
  console.log('=== Beispiel 1: Einzelne Seite als Standalone ===');

  // Landing Page soll nicht geclustert werden
  const updated = markPageAsStandalone(
    nodes,
    'https://example.com/landing',
    'Unique marketing design with custom hero animation'
  );

  // Prüfen
  const landing = updated.find(n => n.url.includes('/landing'));
  console.log('Landing Page standalone?', landing?.excludeFromClustering); // true
  console.log('Reason:', landing?.clusterExclusionReason);

  return updated;
}

// ============================================================================
// BEISPIEL 2: Mehrere Seiten gleichzeitig markieren
// ============================================================================

function example2_markMultiplePages(nodes: SiteNode[]) {
  console.log('=== Beispiel 2: Bulk-Markierung ===');

  // Alle rechtlichen Seiten als standalone markieren
  const legalPages = [
    'https://example.com/impressum',
    'https://example.com/datenschutz',
    'https://example.com/agb'
  ];

  const updated = markPagesAsStandalone(
    nodes,
    legalPages,
    'Legal pages with fixed structure - must remain standalone'
  );

  // Statistiken anzeigen
  const stats = getClusteringStats(updated);
  console.log('Total pages:', stats.total);
  console.log('Standalone pages:', stats.excluded);
  console.log('Clusterable pages:', stats.clusterable);
  console.log('Exclusion reasons:', stats.exclusionReasons);

  return updated;
}

// ============================================================================
// BEISPIEL 3: Migration Mapping laden und anwenden
// ============================================================================

function example3_applyMigrationMapping(nodes: SiteNode[]) {
  console.log('=== Beispiel 3: Migration Mapping ===');

  // Migration Mapping (würde normalerweise aus JSON geladen)
  const mapping = [
    {
      old_url: 'https://old-site.com/',
      new_path: '/',
      action: 'merge' as const,
      type: 'layout' as const,
      standalone: false,
      description: 'Homepage - can be clustered with similar landing pages'
    },
    {
      old_url: 'https://old-site.com/kontakt',
      new_path: '/contact',
      action: 'keep' as const,
      type: 'page' as const,
      standalone: true,
      description: 'Contact form - unique layout'
    },
    {
      old_url: 'https://old-site.com/impressum',
      new_path: '/impressum',
      action: 'keep' as const,
      type: 'page' as const,
      standalone: true,
      description: 'Legal page - fixed structure'
    }
  ];

  // Anwenden
  const updated = applyMigrationMappingRules(nodes, mapping);

  // Prüfen welche Seiten standalone sind
  const standalone = getStandalonePages(updated);
  console.log(`${standalone.length} pages marked as standalone from migration mapping`);
  standalone.forEach(page => {
    console.log(`- ${page.url}: ${page.clusterExclusionReason}`);
  });

  return updated;
}

// ============================================================================
// BEISPIEL 4: Clustering mit Standalone-Filter
// ============================================================================

function example4_clusteringWithFilter(nodes: SiteNode[]) {
  console.log('=== Beispiel 4: Clustering mit Filter ===');

  // Seiten in clusterbar und ausgeschlossen aufteilen
  const { clusterable, excluded } = filterClusterablePages(nodes, {
    respectManualFlags: true, // Standalone-Flags beachten
    minSimilarityThreshold: 70 // Optional: Ähnlichkeitsschwelle
  });

  console.log('Clusterable pages:', clusterable.length);
  console.log('Excluded (standalone) pages:', excluded.length);

  // Nur clusterbare Seiten clustern
  console.log('\nPages that will be clustered:');
  clusterable.forEach((page, i) => {
    if (i < 5) { // Nur erste 5 anzeigen
      console.log(`- ${page.url} (${page.meta.title})`);
    }
  });

  console.log('\nStandalone pages (excluded from clustering):');
  excluded.forEach(page => {
    console.log(`- ${page.url}: ${page.clusterExclusionReason}`);
  });

  // Hier würde dann der tatsächliche Clustering-Algorithmus laufen
  // const clusters = performClustering(clusterable);

  return { clusterable, excluded };
}

// ============================================================================
// BEISPIEL 5: Dynamisch basierend auf Page-Eigenschaften markieren
// ============================================================================

function example5_dynamicMarking(nodes: SiteNode[]) {
  console.log('=== Beispiel 5: Dynamische Markierung ===');

  let updated = [...nodes];

  // 1. Alle Landing Pages (erkennbar am type)
  const landingPages = nodes
    .filter(n => n.type === 'landing')
    .map(n => n.url);

  if (landingPages.length > 0) {
    updated = markPagesAsStandalone(
      updated,
      landingPages,
      'Landing pages have unique designs'
    );
    console.log(`Marked ${landingPages.length} landing pages as standalone`);
  }

  // 2. Seiten mit wenig Content (< 100 Wörter) - oft spezielle Seiten
  const lowContentPages = nodes
    .filter(n => n.content.wordCount < 100)
    .map(n => n.url);

  if (lowContentPages.length > 0) {
    updated = markPagesAsStandalone(
      updated,
      lowContentPages,
      'Low content pages - likely special pages (contact, 404, etc.)'
    );
    console.log(`Marked ${lowContentPages.length} low-content pages as standalone`);
  }

  // 3. Seiten mit Formularen - oft einzigartig
  const formPages = nodes
    .filter(n => n.content.forms.length > 0)
    .map(n => n.url);

  if (formPages.length > 0) {
    updated = markPagesAsStandalone(
      updated,
      formPages,
      'Pages with forms - unique interaction patterns'
    );
    console.log(`Marked ${formPages.length} form pages as standalone`);
  }

  return updated;
}

// ============================================================================
// BEISPIEL 6: Standalone-Flag wieder entfernen
// ============================================================================

function example6_removeStandaloneFlag(nodes: SiteNode[]) {
  console.log('=== Beispiel 6: Standalone-Flag entfernen ===');

  // Angenommen, eine Seite wurde fälschlicherweise als standalone markiert
  const pageUrl = 'https://example.com/blog/article-1';

  // Standalone-Flag entfernen
  const updated = allowPageClustering(nodes, pageUrl);

  const page = updated.find(n => n.url === pageUrl);
  console.log('Page is now clusterable:', page?.excludeFromClustering !== true);

  return updated;
}

// ============================================================================
// BEISPIEL 7: Export zu Migration Mapping
// ============================================================================

function example7_exportToMigrationMapping(nodes: SiteNode[]) {
  console.log('=== Beispiel 7: Export zu Migration Mapping ===');

  // Standalone-Seiten zu Migration Mapping Format exportieren
  const mappingEntries = exportStandalonePagesToMappingFormat(nodes);

  console.log(`Exported ${mappingEntries.length} standalone pages to migration mapping format`);

  // Könnte dann in JSON gespeichert werden
  const migrationMapping = {
    version: '1.0',
    migration_date: new Date().toISOString().split('T')[0],
    domain: 'example.com',
    mapping: mappingEntries
  };

  console.log('Sample mapping entry:', JSON.stringify(mappingEntries[0], null, 2));

  return migrationMapping;
}

// ============================================================================
// BEISPIEL 8: Vollständiger Workflow
// ============================================================================

function example8_completeWorkflow(nodes: SiteNode[]) {
  console.log('=== Beispiel 8: Vollständiger Workflow ===');

  // 1. Migration Mapping laden und anwenden
  console.log('\n1. Loading migration mapping...');
  const mapping = [
    {
      old_url: '/landing',
      new_path: '/landing',
      action: 'keep' as const,
      type: 'page' as const,
      standalone: true,
      description: 'Marketing landing page'
    }
  ];
  let processed = applyMigrationMappingRules(nodes, mapping);

  // 2. Zusätzliche dynamische Regeln anwenden
  console.log('\n2. Applying dynamic rules...');
  const formPages = processed.filter(n => n.content.forms.length > 0).map(n => n.url);
  processed = markPagesAsStandalone(
    processed,
    formPages,
    'Form pages - unique layouts'
  );

  // 3. Statistiken anzeigen
  console.log('\n3. Clustering statistics:');
  const stats = getClusteringStats(processed);
  console.log(`- Total: ${stats.total} pages`);
  console.log(`- Clusterable: ${stats.clusterable} pages`);
  console.log(`- Standalone: ${stats.excluded} pages`);
  console.log('- Exclusion reasons:', stats.exclusionReasons);

  // 4. Für Clustering filtern
  console.log('\n4. Filtering for clustering...');
  const { clusterable, excluded } = filterClusterablePages(processed, {
    respectManualFlags: true
  });

  // 5. Clustering durchführen (Pseudo-Code)
  console.log('\n5. Performing clustering...');
  console.log(`Clustering ${clusterable.length} pages...`);
  // const clusters = performClustering(clusterable);

  // 6. Standalone-Seiten als einzelne "Cluster" behandeln
  console.log('\n6. Treating standalone pages as individual clusters...');
  const standaloneClusters = excluded.map((page, i) => ({
    id: `standalone-${i}`,
    pages: [page],
    isStandalone: true,
    reason: page.clusterExclusionReason
  }));

  console.log(`Created ${standaloneClusters.length} standalone clusters`);

  return {
    processed,
    clusterable,
    standaloneClusters,
    stats
  };
}

// ============================================================================
// MAIN: Alle Beispiele ausführen
// ============================================================================

export function runAllExamples(nodes: SiteNode[]) {
  console.log('\n' + '='.repeat(80));
  console.log('STANDALONE PAGES - USAGE EXAMPLES');
  console.log('='.repeat(80) + '\n');

  try {
    example1_markSinglePage(nodes);
    console.log('\n');

    example2_markMultiplePages(nodes);
    console.log('\n');

    example3_applyMigrationMapping(nodes);
    console.log('\n');

    example4_clusteringWithFilter(nodes);
    console.log('\n');

    example5_dynamicMarking(nodes);
    console.log('\n');

    example6_removeStandaloneFlag(nodes);
    console.log('\n');

    example7_exportToMigrationMapping(nodes);
    console.log('\n');

    const result = example8_completeWorkflow(nodes);
    console.log('\n');

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETED SUCCESSFULLY');
    console.log('='.repeat(80));

    return result;
  } catch (error) {
    console.error('Error running examples:', error);
    throw error;
  }
}
