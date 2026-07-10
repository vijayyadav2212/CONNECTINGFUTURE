import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

function getCookieToken(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';').reduce((acc, c) => {
    const [name, ...val] = c.trim().split('=');
    if (name) acc[name] = val.join('=');
    return acc;
  }, {} as Record<string, string>);
  return cookies['cf_token'] || null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    const target = `${API_BASE}/api/mentors/profile${email ? `?email=${encodeURIComponent(email)}` : ''}`;
    const res = await fetch(target);
    const data = await res.text();
    return new NextResponse(data, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = getCookieToken(req);
    if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/mentors/profile`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${accessToken}` },
      body: JSON.stringify(body)
    });
    const data = await res.text();
    return new NextResponse(data, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
