import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { sampleMode: process.env.USE_MOCK === 'true' || !process.env.OPENROUTER_API_KEY },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
