import fs from 'fs/promises';
import path from 'path';
import { SiteStructure, StackConfig, DesignConfig } from '@/types';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions');

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
            const filename = `${prefix}_${index}_${Date.now()}.${ext}`;
            const filePath = path.join(assetsFolder, filename);

            await fs.writeFile(filePath, buffer);

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
    async saveSession(data: SessionData): Promise<SessionData | null> {
        await initDir();
        const sessionFolder = path.join(SESSIONS_DIR, data.id);
        const filePath = path.join(sessionFolder, 'session.json');

        try {
            await initDir(sessionFolder);

            // Extract base64 assets to files before final JSON save
            const cleanedData = await processAndSaveAssets(data);

            await fs.writeFile(filePath, JSON.stringify(cleanedData, null, 2), 'utf-8');
            return cleanedData;
        } catch (error) {
            console.error('Failed to save session:', error);
            return null;
        }
    },

    async loadSession(id: string): Promise<SessionData | null> {
        await initDir();

        // Try new folder structure first
        let filePath = path.join(SESSIONS_DIR, id, 'session.json');
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            // Fallback: Check for legacy flat file
            const legacyPath = path.join(SESSIONS_DIR, `${id}.json`);
            try {
                const content = await fs.readFile(legacyPath, 'utf-8');
                const data = JSON.parse(content);

                // Migrate to new structure immediately
                await this.saveSession(data);
                // Optionally delete legacy file after successful migration
                await fs.unlink(legacyPath).catch(e => console.warn(`Could not delete legacy file ${id}.json`, e));

                return data;
            } catch (e) {
                console.error(`Failed to load session ${id}:`, error);
                return null;
            }
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
    }
};
