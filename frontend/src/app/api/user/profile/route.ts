import { NextRequest, NextResponse } from 'next/server';
// Avoid direct getAccessToken to prevent Next 15 cookies() warnings; fetch Pages API token instead.

export const dynamic = 'force-dynamic';
// Use Node.js runtime for reliable localhost networking
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Obtain token from Pages API using incoming cookies
    const origin = new URL(request.url).origin;
    const tokenResp = await fetch(`${origin}/api/auth/token`, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store'
    });
    // Treat 204 (no session) as unauthenticated
    if (tokenResp.status === 204) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!tokenResp.ok) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { accessToken } = await tokenResp.json();

    // Prefer frontend env; try multiple hosts to avoid loopback quirks
    const candidates = [
      process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '',
      'http://127.0.0.1:4000',
      'http://localhost:4000',
    ].filter(Boolean) as string[];

    let lastErr: unknown = null;
    for (const c of candidates) {
      const raw = c.endsWith('/api') ? c : `${c.replace(/\/$/, '')}/api`;
      const url = `${raw}/users/profile`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!resp.ok) {
          const status = resp.status;
          const text = await resp.text();
          // Upstream reachable but returned an error; bubble it
          return NextResponse.json({ error: 'Upstream error', details: text }, { status });
        }
        const data = await resp.json();
        const isNewUser = !data?.user || data?.user?.registration_completed === false;
        return NextResponse.json({ ...data, isNewUser });
      } catch (e) {
        lastErr = e;
        console.warn('Profile proxy: backend unreachable at', c, e);
        // try next candidate
      }
    }
    console.error('Profile proxy: all backends unreachable', lastErr);
    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  } catch (error) {
    console.error('Error checking user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
