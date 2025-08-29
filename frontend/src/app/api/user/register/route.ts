import { NextRequest, NextResponse } from 'next/server';
// Avoid direct getAccessToken to prevent Next 15 cookies() warnings; fetch Pages API token instead.

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const origin = new URL(request.url).origin;
    const tokenResp = await fetch(`${origin}/api/auth/token`, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store'
    });
    if (!tokenResp.ok) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { accessToken } = await tokenResp.json();

  const formData = await request.json();
  const rawBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const base = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;
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
