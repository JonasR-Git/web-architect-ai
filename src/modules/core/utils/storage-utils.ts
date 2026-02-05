import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Storage Optimization Utilities
 * - GZIP compression (70% size reduction)
 * - SHA256 hashing for deduplication
 * - Atomic writes with temp files
 */

export interface CompressionMetrics {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    timeMs: number;
}

/**
 * Compresses JSON data with GZIP and saves to file
 *
 * @param filePath - Target file path (will append .gz)
 * @param data - Data to compress and save
 * @returns Compression metrics
 */
export async function saveCompressed(
    filePath: string,
    data: any
): Promise<CompressionMetrics> {
    const startTime = Date.now();

    // Serialize to JSON
    const json = JSON.stringify(data);
    const originalSize = Buffer.byteLength(json, 'utf-8');

    // Compress with GZIP (level 6 = balanced)
    const compressed = await gzipAsync(json, { level: 6 });
    const compressedSize = compressed.length;

    // Atomic write: write to temp file, then rename
    const dir = path.dirname(filePath);
    const tempPath = path.join(dir, `.tmp_${path.basename(filePath)}`);

    await fs.writeFile(tempPath, compressed);
    await fs.rename(tempPath, `${filePath}.gz`);

    const timeMs = Date.now() - startTime;

    return {
        originalSize,
        compressedSize,
        compressionRatio: compressedSize / originalSize,
        timeMs
    };
}

/**
 * Loads and decompresses GZIP file
 *
 * @param filePath - File path (with or without .gz extension)
 * @returns Parsed JSON data
 */
export async function loadCompressed<T = any>(filePath: string): Promise<T | null> {
    try {
        // Try with .gz extension first
        const gzPath = filePath.endsWith('.gz') ? filePath : `${filePath}.gz`;

        const compressed = await fs.readFile(gzPath);
        const decompressed = await gunzipAsync(compressed);
        return JSON.parse(decompressed.toString('utf-8'));
    } catch (error) {
        // Fallback: Try uncompressed file
        try {
            const plainPath = filePath.replace(/\.gz$/, '');
            const content = await fs.readFile(plainPath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }
}

/**
 * Computes SHA256 hash of data for deduplication
 *
 * @param data - Data to hash (Buffer or string)
 * @returns Hex hash string
 */
export function computeHash(data: Buffer | string): string {
    return createHash('sha256')
        .update(data)
        .digest('hex');
}

/**
 * Saves data with automatic deduplication via content hashing
 * If identical content exists, returns existing path instead
 *
 * @param baseDir - Base directory for deduplicated storage
 * @param data - Data to save
 * @param prefix - Optional filename prefix
 * @returns File path (relative to baseDir)
 */
export async function saveWithDeduplication(
    baseDir: string,
    data: Buffer,
    prefix: string = 'asset'
): Promise<string> {
    const hash = computeHash(data);
    const filename = `${prefix}_${hash.substring(0, 16)}`;
    const filePath = path.join(baseDir, filename);

    // Check if already exists
    try {
        await fs.access(filePath);
        return filename; // Already exists, reuse
    } catch {
        // Doesn't exist, save it
        await fs.writeFile(filePath, data);
        return filename;
    }
}

/**
 * Batch compression for multiple files in parallel
 *
 * @param files - Array of {path, data} objects
 * @param concurrency - Max parallel operations (default 5)
 * @returns Array of compression metrics
 */
export async function batchCompressFiles(
    files: Array<{ path: string; data: any }>,
    concurrency: number = 5
): Promise<CompressionMetrics[]> {
    const results: CompressionMetrics[] = [];

    // Process in batches to avoid overwhelming system
    for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(file => saveCompressed(file.path, file.data))
        );
        results.push(...batchResults);
    }

    return results;
}

/**
 * Checks if compressed version is stale (older than source)
 *
 * @param sourcePath - Original file path
 * @param compressedPath - Compressed file path (.gz)
 * @returns True if compressed needs refresh
 */
export async function isCompressedStale(
    sourcePath: string,
    compressedPath: string
): Promise<boolean> {
    try {
        const [sourceStats, compStats] = await Promise.all([
            fs.stat(sourcePath),
            fs.stat(compressedPath)
        ]);

        return sourceStats.mtimeMs > compStats.mtimeMs;
    } catch {
        return true; // If either missing, consider stale
    }
}

/**
 * Progressive loading: Only loads specified sections from compressed session
 *
 * @param sessionId - Session ID
 * @param sections - Array of sections to load ('structure', 'migration', 'specs', 'design', 'state')
 * @returns Partial session data
 */
export async function loadSessionSections(
    sessionId: string,
    sections: Array<'structure' | 'migration' | 'specs' | 'design' | 'state' | 'meta'>,
    baseDir: string
): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    // Load sections in parallel
    await Promise.all(
        sections.map(async (section) => {
            const filePath = path.join(baseDir, sessionId, `${section}.json`);
            const data = await loadCompressed(filePath);
            if (data) {
                result[section] = data;
            }
        })
    );

    return result;
}

/**
 * Estimates compression savings for a dataset
 *
 * @param data - Sample data
 * @returns Estimated compression ratio and size savings
 */
export function estimateCompressionBenefit(data: any): {
    originalSizeKB: number;
    estimatedCompressedKB: number;
    estimatedSavingsPercent: number;
} {
    const json = JSON.stringify(data);
    const originalSize = Buffer.byteLength(json, 'utf-8');

    // GZIP typically achieves 70-80% compression on JSON
    // Use conservative 70% estimate
    const estimatedCompressedSize = originalSize * 0.3;

    return {
        originalSizeKB: originalSize / 1024,
        estimatedCompressedKB: estimatedCompressedSize / 1024,
        estimatedSavingsPercent: 70
    };
}
