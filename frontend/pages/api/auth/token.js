// Pages API route for /api/auth/token using @auth0/nextjs-auth0 v3
import { getAccessToken } from '@auth0/nextjs-auth0';

const SESSION_TTL_SECONDS = 3 * 60 * 60;

export default async function handler(req, res) {
  try {
    const { accessToken } = await getAccessToken(req, res);
    if (!accessToken) {
      // No token available (not logged in or no audience configured)
      res.status(204).end();
      return;
    }
    res.status(200).json({ accessToken, expiresIn: SESSION_TTL_SECONDS });
    return;
  } catch (error) {
    const status = (error && (error.status || error.statusCode)) || 500;
    // Handle common no-session cases gracefully
    if (
      status === 401 ||
      status === 403 ||
      error?.code === 'ERR_MISSING_SESSION' ||
      error?.name === 'AccessTokenError'
    ) {
      // Treat unauthenticated as no-content to keep clients simple
      res.status(204).end();
      return;
    }
    console.error('Token API error:', error);
    res.status(status).json({ error: error?.message || 'Failed to get access token' });
    return;
  }
}
