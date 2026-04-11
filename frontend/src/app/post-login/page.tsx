import { redirect } from 'next/navigation';
import { getSession } from '@auth0/nextjs-auth0';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  const admins = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  return admins.includes(normalized);
}

function deriveRole(user: any): 'admin' | 'student' | 'alumni' {
  const email = String(user?.email || '').trim().toLowerCase();
  if (isAdminEmail(email)) return 'admin';

  const claimed = String(user?.user_type || '').toLowerCase();
  if (claimed === 'student' || claimed === 'alumni') {
    return claimed as 'admin' | 'student' | 'alumni';
  }

  const studentDomains = (process.env.STUDENT_EMAIL_DOMAINS || 'pvppcoe.ac.in').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const students = (process.env.STUDENT_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

  const domain = email.includes('@') ? email.split('@')[1] : '';
  if (email && (students.includes(email) || studentDomains.includes(domain))) return 'student';
  return 'alumni';
}

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
  const adminEmail = isAdminEmail(sessionUser?.email);

  let role: string | null = null;
  const claimedRole = typeof sessionUser.user_type === 'string' ? String(sessionUser.user_type).toLowerCase() : null;
  if (claimedRole === 'admin' && adminEmail) role = 'admin';
  else if (claimedRole === 'student' || claimedRole === 'alumni') role = claimedRole;

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
      const profRole = String(profileUser.user_type || profileUser.userType || '').toLowerCase();
      if (profRole === 'admin' && adminEmail) role = 'admin';
      else if (profRole === 'student' || profRole === 'alumni') role = profRole;
      if (typeof profileUser.registration_completed === 'boolean') {
        isRegistered = profileUser.registration_completed;
      }
    }
  } catch {
    // Keep session-based fallback.
  }

  if (!role || (role !== 'admin' && role !== 'student' && role !== 'alumni')) {
    role = deriveRole(sessionUser);
  }

  if (adminEmail) {
    role = 'admin';
  }

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
