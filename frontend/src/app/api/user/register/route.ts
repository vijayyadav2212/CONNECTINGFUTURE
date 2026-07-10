import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

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

export async function POST(request: NextRequest) {
  try {
    const accessToken = getCookieToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.json();
    const rawBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v2';
    const base = normalizeApiUrl(rawBase);
    
    const resp = await fetch(`${base}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(formData),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: 'Failed to save profile', details: text }, { status: resp.status });
    }

    const data = await resp.json();
    return NextResponse.json({ message: 'Registration completed successfully', profile: data.user });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
