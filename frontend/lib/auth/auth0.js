// lib/auth0.js
import { Auth0Client } from '@auth0/nextjs-auth0/server';

const SESSION_TTL_SECONDS = 3 * 60 * 60;

export const auth0 = new Auth0Client({
  session: {
    rolling: true,
    rollingDuration: SESSION_TTL_SECONDS,
    absoluteDuration: SESSION_TTL_SECONDS,
  },
  authorizationParams: {
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  }
});