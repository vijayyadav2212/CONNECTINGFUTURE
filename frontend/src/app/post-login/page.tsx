import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function getBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return 'http://localhost:3000';
}

async function getProfile() {
  const url = `${getBaseUrl()}/api/user/profile`;
  const store = await cookies();
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      Cookie: store.toString(),
    },
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export default async function PostLogin() {
  const data = await getProfile();
  // If not logged in, go to login
  if (!data?.user) {
    redirect('/api/auth/login');
  }
  const user = data.user as any;
  // Skip registration for admin and student; require only for alumni
  const role = (user.user_type || 'alumni') as string;
  if (role === 'alumni' && user.registration_completed === false) {
    redirect('/registration');
  }
  if (role === 'admin') redirect('/admin/dashboard');
  if (role === 'student') redirect('/student/dashboard');
  redirect('/alumni/dashboard');
}
