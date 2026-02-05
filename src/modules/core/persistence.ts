import fs from 'fs/promises';
import path from 'path';
import { SiteStructure, StackConfig, DesignConfig } from '@/types';
import {
    saveCompressed,
    loadCompressed,
    saveWithDeduplication,
    computeHash,
    loadSessionSections
} from './utils/storage-utils';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');
const USE_COMPRESSION = process.env.DISABLE_COMPRESSION !== 'true'; // Can be disabled via env var

export type SessionData = {
    id: string;
    name: string;
    lastModified: number;
    url: string;
    currentView: string;
    blueprintTab?: string;
    mockupViewMode?: string;

    // 1. Analysis Data
    structure: SiteStructure | null;
    critique: any | null;
    crawlStats: any | null;
    logs: any[];

    // 2. Planning Data
    migrationPlan: any | null;
    userInstructions: string;
    stackConfig: StackConfig;

    // 3. Design Data
    designConfig: DesignConfig;
    downloadedAssets: { images: Record<string, string>, map: Record<string, string> } | null;

    // 4. Engineering Data
    pageSpecs: any[] | null;
    componentSpec: any | null;
    finalOutput: { spec: any, implPlan: any } | null;
    optimizedContent: Array<[string, any]>; // Serialized Map

    // 5. AI Context
    tokenStats: { totalIn: number, totalOut: number };

    // 6. User Assets
    customAssets?: any[];
    excludedUrls?: string[];
    clusterOverrides?: any; // ClusterOverrides type
};

export type SessionSummary = {
    id: string;
    name: string;
    url: string;
    lastModified: number;
    preview: string;
};

const initDir = async (dir: string = SESSIONS_DIR) => {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

/**
 * Extracts base64 images from session data and saves them as files.
 * Returns the updated session data with file URLs.
 */
async function processAndSaveAssets(data: SessionData): Promise<SessionData> {
    const sessionFolder = path.join(SESSIONS_DIR, data.id);
    const assetsFolder = path.join(sessionFolder, 'assets');
    await initDir(assetsFolder);

    const processAsset = async (asset: any, index: number, prefix: string) => {
        if (!asset.src || !asset.src.startsWith('data:image/')) return asset;

        try {
            const matches = asset.src.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
            if (!matches) return asset;

            const ext = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');

            // Use content-based deduplication (SHA256)
            const hash = computeHash(buffer);
            const filename = `${prefix}_${hash.substring(0, 16)}.${ext}`;
            const filePath = path.join(assetsFolder, filename);

            // Check if already exists (deduplication)
            try {
                await fs.access(filePath);
                console.log(`[Persistence] Asset deduped: ${filename} (already exists)`);
            } catch {
                // Doesn't exist, save it
                await fs.writeFile(filePath, buffer);
                console.log(`[Persistence] Asset saved: ${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);
            }

            // Return asset with NEW local URL
            return {
                ...asset,
                src: `/api/assets/${data.id}/${filename}`
            };
        } catch (e) {
            console.error(`Failed to save asset ${prefix}_${index}:`, e);
            return asset;
        }
    };

    // Process Custom Assets
    if (data.customAssets?.length) {
        data.customAssets = await Promise.all(
            data.customAssets.map((asset, i) => processAsset(asset, i, 'custom'))
        );
    }

    // Process Downloaded Assets (Images)
    if (data.downloadedAssets?.images) {
        const updatedImages: Record<string, string> = {};
        for (const [filename, base64] of Object.entries(data.downloadedAssets.images)) {
            if (base64.startsWith('data:image/')) {
                const matches = base64.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1];
                    const buffer = Buffer.from(matches[2], 'base64');
                    // Keep original filename if possible, otherwise use new one
                    const saveName = filename.includes('.') ? filename : `${filename}.${ext}`;
                    const filePath = path.join(assetsFolder, saveName);
                    await fs.writeFile(filePath, buffer);

                    // Replace base64 with local URL in images map
                    updatedImages[filename] = `/api/assets/${data.id}/${saveName}`;
                } else {
                    updatedImages[filename] = base64;
                }
            } else {
                updatedImages[filename] = base64;
            }
        }
        data.downloadedAssets.images = updatedImages;
    }

    return data;
}

export const PersistenceService = {
    /**
     * GRANULAR SAVE METHODS - Phase 1 Optimization
     * Allows saving individual parts of the session without rewriting everything
     */

    async saveState(id: string, state: Pick<SessionData, 'currentView' | 'blueprintTab' | 'mockupViewMode'>): Promise<boolean> {
        const sessionFolder = path.join(SESSIONS_DIR, id);
        const filePath = path.join(sessionFolder, 'state.json');

        try {
            await initDir(sessionFolder);

            if (USE_COMPRESSION) {
                const metrics = await saveCompressed(filePath, state);
                console.log(`[Persistence] State saved (${(metrics.compressedSize / 1024).toFixed(1)}KB, ${(metrics.compressionRatio * 100).toFixed(0)}% of original)`);
            } else {
                await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
            }
            return true;
        } catch (error) {
            console.error('[Persistence] Failed to save state:', error);
            return false;
        }
    },

    async saveStructure(id: string, structure: SiteStructure): Promise<boolean> {
        const sessionFolder = path.join(SESSIONS_DIR, id);
        const filePath = path.join(sessionFolder, 'structure.json');

        try {
            await initDir(sessionFolder);

            if (USE_COMPRESSION) {
                const metrics = await saveCompressed(filePath, structure);
                console.log(`[Persistence] Structure saved (${(metrics.compressedSize / 1024).toFixed(1)}KB, ${(metrics.compressionRatio * 100).toFixed(0)}% of original)`);
            } else {
                await fs.writeFile(filePath, JSON.stringify(structure, null, 2), 'utf-8');
            }
            return true;
        } catch (error) {
            console.error('[Persistence] Failed to save structure:', error);
            return false;
        }
    },

    async saveMigration(id: string, migrationPlan: any): Promise<boolean> {
        const sessionFolder = path.join(SESSIONS_DIR, id);
        const filePath = path.join(sessionFolder, 'migration.json');

        try {
            await initDir(sessionFolder);

            if (USE_COMPRESSION) {
                const metrics = await saveCompressed(filePath, migrationPlan);
                console.log(`[Persistence] Migration saved (${(metrics.compressedSize / 1024).toFixed(1)}KB, ${(metrics.compressionRatio * 100).toFixed(0)}% of original)`);
            } else {
                await fs.writeFile(filePath, JSON.stringify(migrationPlan, null, 2), 'utf-8');
            }
            return true;
        } catch (error) {
            console.error('[Persistence] Failed to save migration:', error);
            return false;
        }
    },

    async saveSpecs(id: string, specs: { pageSpecs?: any[], componentSpec?: any, finalOutput?: any }): Promise<boolean> {
        const sessionFolder = path.join(SESSIONS_DIR, id);
        const filePath = path.join(sessionFolder, 'specs.json');

        try {
            await initDir(sessionFolder);

            if (USE_COMPRESSION) {
                const metrics = await saveCompressed(filePath, specs);
                console.log(`[Persistence] Specs saved (${(metrics.compressedSize / 1024).toFixed(1)}KB, ${(metrics.compressionRatio * 100).toFixed(0)}% of original)`);
            } else {
                await fs.writeFile(filePath, JSON.stringify(specs, null, 2), 'utf-8');
            }
            return true;
        } catch (error) {
            console.error('[Persistence] Failed to save specs:', error);
            return false;
        }
    },

    async saveDesign(id: string, design: { designConfig?: any, stackConfig?: any }): Promise<boolean> {
        const sessionFolder = path.join(SESSIONS_DIR, id);
        const filePath = path.join(sessionFolder, 'design.json');

        try {
            await initDir(sessionFolder);

            if (USE_COMPRESSION) {
                const metrics = await saveCompressed(filePath, design);
                console.log(`[Persistence] Design saved (${(metrics.compressedSize / 1024).toFixed(1)}KB, ${(metrics.compressionRatio * 100).toFixed(0)}% of original)`);
            } else {
                await fs.writeFile(filePath, JSON.stringify(design, null, 2), 'utf-8');
            }
            return true;
        } catch (error) {
            console.error('[Persistence] Failed to save design:', error);
            return false;
        }
    },

    /**
     * LEGACY: Full session save - kept for backwards compatibility
     * Prefer using granular saves for better performance
     */
    async saveSession(data: SessionData): Promise<SessionData | null> {
        await initDir();
        const sessionFolder = path.join(SESSIONS_DIR, data.id);

        try {
            await initDir(sessionFolder);

            // Extract base64 assets to files before final JSON save
            const cleanedData = await processAndSaveAssets(data);

            // Save to granular files for new structure
            await this.saveState(data.id, {
                currentView: data.currentView,
                blueprintTab: data.blueprintTab,
                mockupViewMode: data.mockupViewMode
            });

            if (data.structure) {
                await this.saveStructure(data.id, data.structure);
            }

            if (data.migrationPlan) {
                await this.saveMigration(data.id, data.migrationPlan);
            }

            await this.saveSpecs(data.id, {
                pageSpecs: data.pageSpecs || undefined,
                componentSpec: data.componentSpec || undefined,
                finalOutput: data.finalOutput || undefined
            });

            await this.saveDesign(data.id, {
                designConfig: data.designConfig,
                stackConfig: data.stackConfig
            });

            // Save meta.json with essential info
            const meta = {
                id: data.id,
                name: data.name,
                url: data.url,
                lastModified: data.lastModified,
                userInstructions: data.userInstructions,
                critique: data.critique,
                logs: data.logs,
                tokenStats: data.tokenStats,
                customAssets: cleanedData.customAssets,
                downloadedAssets: cleanedData.downloadedAssets,
                excludedUrls: data.excludedUrls,
                clusterOverrides: data.clusterOverrides,
                optimizedContent: data.optimizedContent
            };

            const metaPath = path.join(sessionFolder, 'meta.json');
            if (USE_COMPRESSION) {
                await saveCompressed(metaPath, meta);
            } else {
                await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
            }

            return cleanedData;
        } catch (error) {
            console.error('Failed to save session:', error);
            return null;
        }
    },

    async loadSession(id: string): Promise<SessionData | null> {
        await initDir();
        const sessionFolder = path.join(SESSIONS_DIR, id);

        try {
            // Try loading from granular files first (new structure)
            const metaPath = path.join(sessionFolder, 'meta.json');
            const statePath = path.join(sessionFolder, 'state.json');
            const structurePath = path.join(sessionFolder, 'structure.json');
            const migrationPath = path.join(sessionFolder, 'migration.json');
            const specsPath = path.join(sessionFolder, 'specs.json');
            const designPath = path.join(sessionFolder, 'design.json');

            try {
                // Load all files in parallel for speed - try compressed first
                const [meta, state, structure, migration, specs, design] = await Promise.all([
                    loadCompressed(metaPath),
                    loadCompressed(statePath),
                    loadCompressed(structurePath),
                    loadCompressed(migrationPath),
                    loadCompressed(specsPath),
                    loadCompressed(designPath)
                ]);

                // If we have at least meta, we're using the new structure
                if (meta) {
                    console.log(`[Persistence] Loading session ${id} from granular structure (compressed: ${USE_COMPRESSION})`);

                    return {
                        ...meta,
                        ...(state || {}),
                        structure: structure || null,
                        migrationPlan: migration || null,
                        pageSpecs: specs?.pageSpecs || null,
                        componentSpec: specs?.componentSpec || null,
                        finalOutput: specs?.finalOutput || null,
                        designConfig: design?.designConfig,
                        stackConfig: design?.stackConfig
                    } as SessionData;
                }
            } catch (granularError) {
                console.log(`[Persistence] Granular load failed, trying legacy formats`);
            }

            // Fallback 1: Try monolithic session.json (newer legacy)
            const sessionJsonPath = path.join(sessionFolder, 'session.json');
            try {
                const content = await fs.readFile(sessionJsonPath, 'utf-8');
                const data = JSON.parse(content);

                console.log(`[Persistence] Migrating session ${id} from monolithic to granular`);
                // Migrate to new structure
                await this.saveSession(data);

                return data;
            } catch (e) {
                // Not found, try next fallback
            }

            // Fallback 2: Try legacy flat file structure
            const legacyPath = path.join(SESSIONS_DIR, `${id}.json`);
            try {
                const content = await fs.readFile(legacyPath, 'utf-8');
                const data = JSON.parse(content);

                console.log(`[Persistence] Migrating session ${id} from legacy flat file to granular`);
                // Migrate to new structure immediately
                await this.saveSession(data);
                // Delete legacy file after successful migration
                await fs.unlink(legacyPath).catch(e => console.warn(`Could not delete legacy file ${id}.json`, e));

                return data;
            } catch (e) {
                console.error(`Failed to load session ${id} from any format:`, e);
                return null;
            }
        } catch (error) {
            console.error(`Failed to load session ${id}:`, error);
            return null;
        }
    },

    async listSessions(): Promise<SessionSummary[]> {
        await initDir();
        try {
            const entries = await fs.readdir(SESSIONS_DIR, { withFileTypes: true });
            const sessions: SessionSummary[] = [];

            for (const entry of entries) {
                let sessionData: SessionData | null = null;
                let filePath = '';

                if (entry.isDirectory()) {
                    filePath = path.join(SESSIONS_DIR, entry.name, 'session.json');
                } else if (entry.isFile() && entry.name.endsWith('.json')) {
                    // Legacy file found during listing
                    filePath = path.join(SESSIONS_DIR, entry.name);
                } else {
                    continue;
                }

                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    sessionData = JSON.parse(content) as SessionData;

                    sessions.push({
                        id: sessionData.id,
                        name: sessionData.name || 'Untitled Project',
                        url: sessionData.url || 'No URL',
                        lastModified: sessionData.lastModified,
                        preview: `${(sessionData.structure?.nodes || []).length} pages scanned`
                    });

                    // If it was a legacy file, we could migrate it here, but loadSession is safer for full migration
                } catch (e) {
                    console.warn(`Skipping corrupt or missing session file at: ${filePath}`);
                }
            }

            // Sort by newest first
            return sessions.sort((a, b) => b.lastModified - a.lastModified);
        } catch (error) {
            console.error('Failed to list sessions:', error);
            return [];
        }
    },

    async deleteSession(id: string): Promise<boolean> {
        await initDir();
        const sessionFolder = path.join(SESSIONS_DIR, id);
        const legacyPath = path.join(SESSIONS_DIR, `${id}.json`);
        try {
            // Delete new folder structure
            try {
                await fs.rm(sessionFolder, { recursive: true, force: true });
            } catch (e) {
                // Secondary check for legacy flat file
                await fs.unlink(legacyPath).catch(() => { });
            }
            return true;
        } catch (error) {
            console.error(`Failed to delete session ${id}`, error);
            return false;
        }
    },

    /**
     * PROGRESSIVE LOADING - Load only specific sections of a session
     * Useful for faster initial loads - only fetch what's needed for current view
     *
     * @param id - Session ID
     * @param sections - Array of sections to load
     * @returns Partial session data
     */
    async loadSessionPartial(
        id: string,
        sections: Array<'meta' | 'state' | 'structure' | 'migration' | 'specs' | 'design'>
    ): Promise<Partial<SessionData> | null> {
        try {
            console.log(`[Persistence] Progressive load: ${sections.join(', ')}`);

            const data = await loadSessionSections(id, sections, SESSIONS_DIR);

            if (data.meta) {
                return {
                    ...data.meta,
                    ...(data.state || {}),
                    structure: data.structure || null,
                    migrationPlan: data.migration || null,
                    pageSpecs: data.specs?.pageSpecs || null,
                    componentSpec: data.specs?.componentSpec || null,
                    finalOutput: data.specs?.finalOutput || null,
                    designConfig: data.design?.designConfig,
                    stackConfig: data.design?.stackConfig
                } as Partial<SessionData>;
            }

            return null;
        } catch (error) {
            console.error(`[Persistence] Progressive load failed for ${id}:`, error);
            return null;
        }
    },

    /**
     * Gets compression statistics for all sessions
     */
    async getCompressionStats(): Promise<{
        totalSessions: number;
        totalOriginalSizeKB: number;
        totalCompressedSizeKB: number;
        compressionRatio: number;
        savingsPercent: number;
    }> {
        try {
            await initDir();
            const entries = await fs.readdir(SESSIONS_DIR, { withFileTypes: true });

            let totalOriginal = 0;
            let totalCompressed = 0;

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const sessionFolder = path.join(SESSIONS_DIR, entry.name);
                    const files = await fs.readdir(sessionFolder);

                    for (const file of files) {
                        const filePath = path.join(sessionFolder, file);
                        const stats = await fs.stat(filePath);

                        if (file.endsWith('.gz')) {
                            totalCompressed += stats.size;
                            // Estimate original size as 3.3x compressed (typical for JSON)
                            totalOriginal += stats.size * 3.3;
                        } else if (file.endsWith('.json')) {
                            // Uncompressed file
                            totalOriginal += stats.size;
                            totalCompressed += stats.size;
                        }
                    }
                }
            }

            const compressionRatio = totalOriginal > 0 ? totalCompressed / totalOriginal : 1;
            const savingsPercent = totalOriginal > 0 ? (1 - compressionRatio) * 100 : 0;

            return {
                totalSessions: entries.filter(e => e.isDirectory()).length,
                totalOriginalSizeKB: totalOriginal / 1024,
                totalCompressedSizeKB: totalCompressed / 1024,
                compressionRatio,
                savingsPercent
            };
        } catch (error) {
            console.error('[Persistence] Failed to get compression stats:', error);
            return {
                totalSessions: 0,
                totalOriginalSizeKB: 0,
                totalCompressedSizeKB: 0,
                compressionRatio: 1,
                savingsPercent: 0
            };
        }
    }
};
