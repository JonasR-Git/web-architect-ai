import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string, filename: string }> }
) {
    const { sessionId, filename } = await params;

    if (!sessionId || !filename) {
        return new NextResponse('Missing parameters', { status: 400 });
    }

    // Security: Prevent directory traversal
    if (filename.includes('..') || sessionId.includes('..')) {
        return new NextResponse('Invalid path', { status: 403 });
    }

    const filePath = path.join(process.cwd(), 'data', 'sessions', sessionId, 'assets', filename);

    try {
        await fs.access(filePath);
        const fileBuffer = await fs.readFile(filePath);

        // Determine content type based on extension
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';

        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        else if (ext === '.webp') contentType = 'image/webp';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        return new NextResponse('File not found', { status: 404 });
    }
}
