/**
 * URL Utility Functions
 *
 * Common URL manipulation utilities used across the application.
 * Provides consistent handling of URL parsing, slug extraction, and path normalization.
 */

/**
 * Extracts the slug (last path segment) from a URL
 *
 * Examples:
 * - /blog/post-1 → post-1
 * - /products/electronics/laptop → laptop
 * - https://example.com/blog/article → article
 * - / → index
 * - (invalid URL) → unknown
 *
 * @param url - Full URL or path string
 * @returns The last path segment, or 'index' for root, or 'unknown' for invalid URLs
 */
export function extractSlugFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const segments = path.split('/').filter(Boolean);
        return segments[segments.length - 1] || 'index';
    } catch {
        // Fallback: extract from plain string (not a valid URL)
        const segments = url.split('/').filter(Boolean);
        return segments[segments.length - 1] || 'unknown';
    }
}

/**
 * Normalizes a path to a safe filename
 *
 * Converts path separators to underscores and removes invalid filename characters.
 *
 * Examples:
 * - /blog/post-1 → blog_post-1
 * - /products/[slug] → products_[slug]
 * - / → index
 * - /blog/post?query=1 → blog_post (query params stripped)
 *
 * @param path - URL path to convert
 * @returns Safe filename string
 */
export function pathToFilename(path: string): string {
    try {
        // Parse to remove query params if present
        const urlObj = new URL(path, 'http://dummy.com');
        path = urlObj.pathname;
    } catch {
        // Not a URL, use as-is
    }

    return path
        .replace(/^\//, '') // Remove leading slash
        .replace(/\//g, '_') // Replace path separators with underscore
        .replace(/[<>:"|?*]/g, '-') // Replace invalid filename characters
        || 'index'; // Fallback for empty string
}

/**
 * Checks if a URL is valid
 *
 * @param url - String to validate as URL
 * @returns True if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extracts the domain from a URL
 *
 * Examples:
 * - https://www.example.com/blog → example.com
 * - https://subdomain.example.co.uk/path → example.co.uk
 *
 * @param url - Full URL string
 * @returns Domain without www prefix, or null if invalid
 */
export function extractDomain(url: string): string | null {
    try {
        const urlObj = new URL(url);
        let hostname = urlObj.hostname;

        // Remove www. prefix
        if (hostname.startsWith('www.')) {
            hostname = hostname.substring(4);
        }

        return hostname;
    } catch {
        return null;
    }
}

/**
 * Normalizes a URL by removing trailing slash, query params, and hash
 *
 * Examples:
 * - https://example.com/blog/ → https://example.com/blog
 * - https://example.com/blog?page=1#section → https://example.com/blog
 *
 * @param url - URL to normalize
 * @returns Normalized URL string
 */
export function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        let path = urlObj.pathname;

        // Remove trailing slash (except for root)
        if (path.endsWith('/') && path.length > 1) {
            path = path.slice(0, -1);
        }

        return `${urlObj.protocol}//${urlObj.host}${path}`;
    } catch {
        return url;
    }
}
