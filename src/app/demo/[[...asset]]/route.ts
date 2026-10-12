import { readFile } from 'node:fs/promises';
import path from 'node:path';

const files: Record<string, string> = {
  'index.html': 'text/html; charset=utf-8',
  'styles.css': 'text/css; charset=utf-8',
  'tour.js': 'text/javascript; charset=utf-8',
  'workbench.png': 'image/png',
  'blueprint.png': 'image/png',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ asset?: string[] }> }
) {
  const { asset } = await params;
  if (!asset?.length) return Response.redirect(new URL('/demo/index.html', _request.url), 307);
  const filename = asset?.join('/') || 'index.html';
  if (!Object.hasOwn(files, filename)) return new Response('Not found', { status: 404 });
  try {
    const content = await readFile(path.join(process.cwd(), 'docs', filename));
    return new Response(new Uint8Array(content), {
      headers: {
        'Content-Type': files[filename],
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
