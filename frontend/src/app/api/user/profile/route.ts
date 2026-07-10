import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getCookieToken(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';').reduce((acc, c) => {
    const [name, ...val] = c.trim().split('=');
    if (name) acc[name] = val.join('=');
    return acc;
  }, {} as Record<string, string>);
  return cookies['cf_token'] || null;
}

function normalizeApiUrl(candidate: string): string {
  let raw = candidate.replace(/\/+$/, '');
  if (!raw.includes('/api/v2') && !raw.includes('/api')) {
    return `${raw}/api/v2`;
  }
  if (raw.endsWith('/api')) {
    return `${raw}/v2`;
  }
  return raw;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = getCookieToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const candidates = [
      process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '',
      'http://127.0.0.1:4000/api/v2',
      'http://localhost:4000/api/v2',
    ].filter(Boolean) as string[];

    let lastErr: unknown = null;
    for (const c of candidates) {
      const raw = normalizeApiUrl(c);
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
          return NextResponse.json({ error: 'Upstream error', details: text }, { status });
        }
        const data = await resp.json();
        const isNewUser = !data?.user || data?.user?.registration_completed === false;
        return NextResponse.json({ ...data, isNewUser });
      } catch (e) {
        lastErr = e;
        console.warn('Profile proxy: backend unreachable at', c, e);
      }
    }
    console.error('Profile proxy: all backends unreachable', lastErr);
    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  } catch (error) {
    console.error('Error checking user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const accessToken = getCookieToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await request.json();

    const candidates = [
      process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '',
      'http://127.0.0.1:4000/api/v2',
      'http://localhost:4000/api/v2',
    ].filter(Boolean) as string[];

    let lastErr: unknown = null;
    for (const c of candidates) {
      const raw = normalizeApiUrl(c);
      const url = `${raw}/users/profile`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const resp = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!resp.ok) {
          const status = resp.status;
          const text = await resp.text();
          return NextResponse.json({ error: 'Upstream error', details: text }, { status });
        }
        const data = await resp.json();
        return NextResponse.json(data);
      } catch (e) {
        lastErr = e;
        console.warn('Profile update proxy: backend unreachable at', c, e);
      }
    }

    console.error('Profile update proxy: all backends unreachable', lastErr);
    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
