import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getAccessTokenFromApi(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const tokenResp = await fetch(`${origin}/api/auth/token`, {
    headers: { cookie: request.headers.get('cookie') || '' },
    cache: 'no-store'
  });
  if (!tokenResp.ok) return null;
  const data = await tokenResp.json();
  return data.accessToken as string;
}

function getBackendCandidates() {
  return [
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '',
    'http://127.0.0.1:4000',
    'http://localhost:4000'
  ].filter(Boolean) as string[];
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessTokenFromApi(request);
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    for (const candidate of getBackendCandidates()) {
      const raw = candidate.endsWith('/api') ? candidate : `${candidate.replace(/\/$/, '')}/api`;
      const url = `${raw}/admin/settings/alumni-auto-approve`;
      try {
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store'
        });
        if (!resp.ok) {
          const text = await resp.text();
          return NextResponse.json({ error: 'Upstream error', details: text }, { status: resp.status });
        }
        const data = await resp.json();
        return NextResponse.json(data);
      } catch {
        // try next candidate
      }
    }

    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const accessToken = await getAccessTokenFromApi(request);
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const enabled = !!(body && body.enabled);

    for (const candidate of getBackendCandidates()) {
      const raw = candidate.endsWith('/api') ? candidate : `${candidate.replace(/\/$/, '')}/api`;
      const url = `${raw}/admin/settings/alumni-auto-approve`;
      try {
        const resp = await fetch(url, {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ enabled }),
          cache: 'no-store'
        });
        if (!resp.ok) {
          const text = await resp.text();
          return NextResponse.json({ error: 'Upstream error', details: text }, { status: resp.status });
        }
        const data = await resp.json();
        return NextResponse.json(data);
      } catch {
        // try next candidate
      }
    }

    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
