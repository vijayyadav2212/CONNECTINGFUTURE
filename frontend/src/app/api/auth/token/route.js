
the // api/auth/token/route.js
import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const response = new NextResponse();
    const { accessToken } = await getAccessToken(request, response, {
      scopes: ['openid', 'profile', 'email']
    });

    return NextResponse.json({ 
      accessToken,
      expiresIn: 3600 // 1 hour default
    });
  } catch (error) {
    console.error('Token API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get access token' },
      { status: error.status || 500 }
    );
  }
}
