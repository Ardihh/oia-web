import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      version: 1,
      time: new Date().toISOString(),
    },
    { status: 200 }
  );
}
