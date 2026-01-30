
import fs from 'fs';
import { groupSimilarPages } from './src/modules/core/utils/grouping';
import { SiteStructure } from '@/types';

async function run() {
    console.log("--- DEBUGGING FULL URL CLUSTERING ---");

    const rawData = fs.readFileSync('c:/Users/jonas/Crawler/web-architect-ai/site-structure-www.ganztags.net.json', 'utf-8');
    const structure = JSON.parse(rawData) as SiteStructure;

    // Simulate the BUG: Passing Full URLs instead of patterns
    console.log("\n--- SIMULATING CLUSTERING (Force: Full URLs) ---");
    const overrides = {
        forceArchetypes: [
            'https://www.ganztags.net/blog',
            'https://www.ganztags.net/casestudies'
        ]
    };

    const results = groupSimilarPages(structure, 3, 5, overrides);

    console.log(`Groups Found: ${results.groups.length}`);

    results.groups.forEach(g => {
        console.log(`\nGroup: ${g.pattern} (Count: ${g.totalCount})`);
        // Check if it's working
        if (g.totalCount > 1) {
            console.log("  ✅ SUCCESS: Grouped successfully despite Full URL input.");
        } else {
            console.log("  ❌ FAILURE: Group is empty or singleton.");
        }
    });

    if (results.groups.length === 0) {
        console.log("❌ FAILURE: No groups created.");
    }
}

run();
