import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getAccessTokenFromApi(request: NextRequest) {
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
    const accessToken = await getAccessTokenFromApi(request);
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const candidates = [
      process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '',
      'http://127.0.0.1:4000/api/v2',
      'http://localhost:4000/api/v2'
    ].filter(Boolean) as string[];

    const urlSearch = new URL(request.url).search;
    for (const c of candidates) {
      const raw = normalizeApiUrl(c);
      const url = `${raw}/users${urlSearch}`;
      try {
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
        if (!resp.ok) {
          const text = await resp.text();
          return NextResponse.json({ error: 'Upstream error', details: text }, { status: resp.status });
        }
        const data = await resp.json();
        return NextResponse.json(data);
      } catch (e) {
        console.warn('Admin users proxy: backend unreachable at', c, e);
      }
    }
    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessTokenFromApi(request);
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { id, approval_status, auth0_id, reason, status } = body || {};
    const resolvedStatus = (approval_status || status) ? String(approval_status || status).toLowerCase() : null;
    if ((!id && !auth0_id) || !resolvedStatus) return NextResponse.json({ error: 'id/auth0_id and approval_status/status required' }, { status: 400 });

    const candidates = [
      process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '',
      'http://127.0.0.1:4000/api/v2',
      'http://localhost:4000/api/v2'
    ].filter(Boolean) as string[];

    for (const c of candidates) {
      const raw = normalizeApiUrl(c);
      const url = auth0_id ? `${raw}/admin/alumni/${auth0_id}/approval` : `${raw}/admin/users/${id}/approval`;
      try {
        const bodyToSend = auth0_id ? JSON.stringify({ status: resolvedStatus, reason }) : JSON.stringify({ approval_status: resolvedStatus, reason });
        const resp = await fetch(url, {
          method: 'PUT',
          headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: bodyToSend,
          cache: 'no-store'
        });
        if (!resp.ok) {
          const text = await resp.text();
          return NextResponse.json({ error: 'Upstream error', upstreamUrl: url, details: text }, { status: resp.status });
        }
        const data = await resp.json();
        return NextResponse.json(data);
      } catch (e) {
        console.warn('Admin users approval proxy: backend unreachable at', c, e);
      }
    }

    return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
