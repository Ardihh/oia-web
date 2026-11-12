import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// In-memory rate limiting: max 60 requests per 60 seconds per IP
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;

  const timestamps = rateLimitMap.get(identifier) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);

  // Periodic cleanup if map grows
  if (rateLimitMap.size > 1000) {
    for (const [key, list] of rateLimitMap.entries()) {
      const active = list.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, active);
      }
    }
  }

  return false;
}

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  // 2. Authentication check: Bearer token must pass Supabase is_admin() RPC
  const authHeader = req.headers.get('authorization') || '';
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = tokenMatch ? tokenMatch[1].trim() : null;

  if (!token) {
    return NextResponse.json({ error: 'Missing bearer authorization token' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase configuration missing on server' }, { status: 500 });
  }

  try {
    const rpcUrl = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/is_admin`;
    const rpcRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    if (!rpcRes.ok) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    const isAdmin = await rpcRes.json();
    if (isAdmin !== true) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Auth verification error' }, { status: 401 });
  }

  // 3. Parse & validate request body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const requestedTags: string[] = Array.isArray(body?.tags) ? body.tags : [];
  const requestedPaths: string[] = Array.isArray(body?.paths) ? body.paths : [];

  // Allowed tags allowlist
  const allowedTagPattern = /^(site-content|news|news:[a-zA-Z0-9_-]+)$/;
  const validTags = requestedTags.filter(
    (t) => typeof t === 'string' && allowedTagPattern.test(t.trim())
  );

  // Allowed paths allowlist (must be localized app routes)
  const allowedPathPattern = /^\/(en|id)(\/[a-zA-Z0-9_-]+)*\/?$/;
  const validPaths = requestedPaths.filter(
    (p) => typeof p === 'string' && allowedPathPattern.test(p.trim())
  );

  if (validTags.length === 0 && validPaths.length === 0) {
    return NextResponse.json(
      { error: 'No valid tags or paths provided for revalidation' },
      { status: 400 }
    );
  }

  // 4. Perform revalidation
  const revalidatedTags: string[] = [];
  const revalidatedPaths: string[] = [];

  for (const tag of validTags) {
    try {
      revalidateTag(tag);
      revalidatedTags.push(tag);
    } catch (err: any) {
      console.warn(`[revalidate] Failed to revalidate tag '${tag}':`, err?.message || err);
    }
  }

  for (const path of validPaths) {
    try {
      revalidatePath(path);
      revalidatedPaths.push(path);
    } catch (err: any) {
      console.warn(`[revalidate] Failed to revalidate path '${path}':`, err?.message || err);
    }
  }

  return NextResponse.json({
    revalidated: true,
    tags: revalidatedTags,
    paths: revalidatedPaths,
    timestamp: Date.now(),
  });
}
