import { handleAuth, handleCallback, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({}),
  logout: handleLogout({}),
  callback: handleCallback({})
});

export const POST = handleAuth({
  login: handleLogin({}),
  logout: handleLogout({}),
  callback: handleCallback({})
});
