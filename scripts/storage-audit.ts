#!/usr/bin/env tsx

/**
 * Storage Audit Script
 *
 * Analyzes current storage usage and compression benefits.
 * Run with: npx tsx scripts/storage-audit.ts
 */

import { PersistenceService } from '../src/modules/core/persistence';
import { ColorCacheService } from '../src/modules/analysis/services/color-cache';
import fs from 'fs/promises';
import path from 'path';

async function auditStorage() {
    console.log('🔍 Web Architect AI - Storage Audit\n');

    // 1. Sessions Analysis
    console.log('📊 Sessions:');
    const sessions = await PersistenceService.listSessions();
    console.log(`   Total Sessions: ${sessions.length}`);

    let compressionStats = {
        totalOriginalSizeKB: 0,
        totalCompressedSizeKB: 0,
        savingsPercent: 0,
        compressionRatio: 1
    };

    if (sessions.length > 0) {
        compressionStats = await PersistenceService.getCompressionStats();
        console.log(`   Original Size: ${compressionStats.totalOriginalSizeKB.toFixed(1)} KB`);
        console.log(`   Compressed Size: ${compressionStats.totalCompressedSizeKB.toFixed(1)} KB`);
        console.log(`   Savings: ${compressionStats.savingsPercent.toFixed(1)}%`);
        console.log(`   Compression Ratio: ${(compressionStats.compressionRatio * 100).toFixed(0)}%`);
    }

    // 2. Color Cache Analysis
    console.log('\n🎨 Color Cache:');
    const cacheStats = await ColorCacheService.getStats();
    console.log(`   Cached Entries: ${cacheStats.entryCount}`);
    console.log(`   Cache Size: ${cacheStats.totalSizeKB.toFixed(1)} KB`);

    // 3. Assets Analysis
    console.log('\n🖼️  Assets:');
    const sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    try {
        const sessionFolders = await fs.readdir(sessionsDir, { withFileTypes: true });

        let totalAssets = 0;
        let totalAssetsSize = 0;
        const assetHashes = new Set<string>();

        for (const folder of sessionFolders) {
            if (folder.isDirectory()) {
                const assetsFolder = path.join(sessionsDir, folder.name, 'assets');
                try {
                    const assets = await fs.readdir(assetsFolder);
                    totalAssets += assets.length;

                    for (const asset of assets) {
                        const assetPath = path.join(assetsFolder, asset);
                        const stats = await fs.stat(assetPath);
                        totalAssetsSize += stats.size;

                        // Extract hash from filename (format: prefix_HASH.ext)
                        const hashMatch = asset.match(/_([a-f0-9]{16})\./);
                        if (hashMatch) {
                            assetHashes.add(hashMatch[1]);
                        }
                    }
                } catch {
                    // No assets folder
                }
            }
        }

        console.log(`   Total Assets: ${totalAssets}`);
        console.log(`   Unique Assets (by hash): ${assetHashes.size}`);
        console.log(`   Deduplication Rate: ${totalAssets > 0 ? (((totalAssets - assetHashes.size) / totalAssets) * 100).toFixed(1) : 0}%`);
        console.log(`   Total Size: ${(totalAssetsSize / (1024 * 1024)).toFixed(2)} MB`);
    } catch (error) {
        console.log('   No assets found');
    }

    // 4. Overall Stats
    console.log('\n📈 Overall Storage:');
    const dataDir = path.join(process.cwd(), 'data');
    try {
        const totalSize = await getDirectorySize(dataDir);
        console.log(`   Total Data Directory Size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    } catch (error) {
        console.log('   Could not calculate total size');
    }

    // 5. Recommendations
    console.log('\n💡 Recommendations:');

    if (cacheStats.entryCount > 500) {
        console.log('   ⚠️  Color cache has >500 entries. Consider running: ColorCacheService.prune()');
    }

    const avgSessionSizeKB = sessions.length > 0
        ? compressionStats.totalCompressedSizeKB / sessions.length
        : 0;

    if (avgSessionSizeKB > 1000) {
        console.log('   ⚠️  Average session size >1MB. Check for large logs or structure data.');
    }

    if (sessions.length > 50) {
        console.log('   ℹ️  You have many sessions. Consider archiving old ones.');
    }

    console.log('\n✅ Audit complete!\n');
}

async function getDirectorySize(dir: string): Promise<number> {
    let totalSize = 0;

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                totalSize += await getDirectorySize(fullPath);
            } else {
                const stats = await fs.stat(fullPath);
                totalSize += stats.size;
            }
        }
    } catch (error) {
        // Ignore permission errors
    }

    return totalSize;
}

// Run audit
auditStorage().catch(console.error);
