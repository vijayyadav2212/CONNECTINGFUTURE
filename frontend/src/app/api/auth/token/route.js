// api/auth/token.js
import { getAccessToken } from '@auth0/nextjs-auth0';

export default async function handler(req, res) {
  try {
    const { accessToken } = await getAccessToken(req, res, {
      scopes: ['openid', 'profile', 'email']
    });

    res.status(200).json({ 
      accessToken,
      expiresIn: 3600 // 1 hour default
    });
  } catch (error) {
    console.error('Token API error:', error);
    res.status(error.status || 500).json({ 
      error: error.message || 'Failed to get access token' 
    });
  }
}
