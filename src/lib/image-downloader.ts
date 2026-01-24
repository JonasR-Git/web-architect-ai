
import { createHash } from 'crypto';
import sharp from 'sharp';

export interface ImageAsset {
    originalUrl: string;
    filename: string;
    base64: string;
    mime: string;
}

export async function downloadImageAsBase64(url: string): Promise<ImageAsset | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        });

        clearTimeout(timeout);

        if (!res.ok) return null;
        const contentType = res.headers.get('content-type');
        if (!contentType?.startsWith('image/')) return null;

        const arrayBuffer = await res.arrayBuffer();
        let buffer: Buffer = Buffer.from(arrayBuffer);
        let mime = contentType;
        let ext = 'jpg';

        // OPTIMIZATION: Convert to WebP using Sharp
        try {
            // Only convert typical raster images
            if (contentType.includes('jpeg') || contentType.includes('png') || contentType.includes('webp')) {
                // Cast buffer to any to avoid strict ArrayBufferLike mismatch in recent node types
                buffer = await sharp(buffer as any)
                    .webp({ quality: 90 }) // High quality WebP
                    .toBuffer();
                mime = 'image/webp';
                ext = 'webp';
            } else if (contentType.includes('svg')) {
                ext = 'svg'; // Keep SVG as is
            } else if (contentType.includes('gif')) {
                ext = 'gif'; // Keep GIF as is (sharp can fail on animated gifs if not careful)
            }
        } catch (sharpError) {
            console.warn('Sharp conversion failed, using original format:', sharpError);
            // Fallback to original extension mapping
            if (contentType.includes('png')) ext = 'png';
            if (contentType.includes('gif')) ext = 'gif';
            if (contentType.includes('webp')) ext = 'webp';
        }

        const base64 = buffer.toString('base64');

        // Semantic Naming: Try to get a meaningful name from the URL
        let semanticName = 'img';
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const lastPart = pathParts[pathParts.length - 1];
            if (lastPart) {
                // Remove extension and special chars
                const name = lastPart.split('.')[0].replace(/[^a-zA-Z0-9-_]/g, '-');
                if (name.length > 2) semanticName = name.substring(0, 30); // Cap length
            }
        } catch (e) { }

        const hash = createHash('md5').update(url).digest('hex').substring(0, 8);
        const filename = `${semanticName}_${hash}.${ext}`;

        return {
            originalUrl: url,
            filename,
            base64,
            mime
        };
    } catch (e) {
        console.warn(`Failed to download image ${url}:`, e);
        return null; // Fail silently for individual images
    }
}
