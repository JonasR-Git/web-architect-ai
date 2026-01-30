
import fs from 'fs';
import { groupSimilarPages } from './src/modules/core/utils/grouping';
import { SiteStructure } from '@/types';

async function run() {
    console.log("--- DEBUGGING CLUSTERING ---");

    // 1. Load Real Data
    const rawData = fs.readFileSync('c:/Users/jonas/Crawler/web-architect-ai/site-structure-www.ganztags.net.json', 'utf-8');
    const structure = JSON.parse(rawData) as SiteStructure;

    console.log(`Loaded structure with ${structure.nodes.length} nodes.`);
    console.log("sample URLs:");
    structure.nodes.slice(0, 50).forEach(n => console.log(n.url));

    // 2. Check for "polluted" nodes (Linked In)
    const linkedinNodes = structure.nodes.filter(n => n.url.includes('linkedin.com'));
    console.log(`Found ${linkedinNodes.length} nodes with 'linkedin.com' in URL:`);
    linkedinNodes.forEach(n => console.log(` - ${n.url} (Type: ${n.type}, Depth: ${n.depth})`));

    // 3. Simulate Clustering with MULTIPLE Force Archetypes
    console.log("\n--- SIMULATING CLUSTERING (Force: '/blog' AND '/casestudies') ---");
    const overrides = {
        forceArchetypes: ['/blog', '/casestudies']
    };

    const results = groupSimilarPages(structure, 3, 5, overrides);

    console.log(`Unique Pages: ${results.uniquePages.length}`);
    console.log(`Groups Found: ${results.groups.length}`);

    results.groups.forEach(g => {
        console.log(`\nGroup: ${g.pattern} (Count: ${g.totalCount})`);
        // Check if this group contains linkedin links
        const badLinks = g.allUrls.filter(u => u.includes('linkedin'));
        if (badLinks.length > 0) {
            console.log(`⚠️  DANGER: This group contains ${badLinks.length} external links!`);
            badLinks.slice(0, 5).forEach(u => console.log(`    - ${u}`));
        } else {
            console.log("    (Clean - no linkedin links)");
        }
    });

    // 4. Check Root Cause of "Pre-selection"
    // (This part is theoretical, but we can check if the structure has any weird meta tags that might affect UI)
    // The UI uses 'clusterOverrides' state. If it persists, it's local storage or a bug in initialization.
}

run();
