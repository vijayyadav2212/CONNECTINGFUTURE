import { redirect } from 'next/navigation';
import { getSession } from '@auth0/nextjs-auth0';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function PostLogin() {
  const session = await getSession();

  // Avoid login<->post-login loops in production when session is temporarily unavailable.
  if (!session || !session.user) {
    redirect('/');
  }

  const sessionUser: any = session.user;

  // Session claims can be stale/missing right after login, so prefer profile API.
  const reqHeaders = await headers();
  const forwardedHostRaw = reqHeaders.get('x-forwarded-host') || reqHeaders.get('host') || '';
  const forwardedProtoRaw = reqHeaders.get('x-forwarded-proto') || '';
  const host = forwardedHostRaw.split(',')[0].trim();
  const proto = (forwardedProtoRaw.split(',')[0].trim() || (host.includes('localhost') ? 'http' : 'https'));
  const origin = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let role: string | null = typeof sessionUser.user_type === 'string' ? sessionUser.user_type : null;
  let isRegistered: boolean | null = typeof sessionUser.registration_completed === 'boolean'
    ? sessionUser.registration_completed
    : null;

  try {
    const cookie = reqHeaders.get('cookie') || '';
    const profileResp = await fetch(`${origin}/api/user/profile`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (profileResp.ok) {
      const profileData = await profileResp.json();
      const profileUser = profileData?.user || {};
      role = profileUser.user_type || profileUser.userType || role;
      if (typeof profileUser.registration_completed === 'boolean') {
        isRegistered = profileUser.registration_completed;
      }
    }
  } catch {
    // Keep session-based fallback.
  }

  if (!role && typeof sessionUser.email === 'string') {
    const email = sessionUser.email.toLowerCase();
    role = email.endsWith('@pvppcoe.ac.in') ? 'student' : 'alumni';
  }

  if (!role) role = 'alumni';
  if (typeof isRegistered !== 'boolean') isRegistered = false;

  if (role === 'admin') {
    redirect('/admin/dashboard');
  }

  if (role === 'student') {
    if (!isRegistered) {
      redirect('/student-registration');
    }
    redirect('/student/dashboard');
  }

  if (role === 'alumni') {
    if (!isRegistered) {
      redirect('/registration');
    }
    redirect('/alumni/dashboard');
  }

  redirect('/alumni/dashboard');
}