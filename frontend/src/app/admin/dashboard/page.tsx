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
  const store = await cookies();
  const res = await fetch(`${getBaseUrl()}/api/user/profile`, { cache: 'no-store', headers: { Cookie: store.toString() } });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminDashboard() {
  const data = await getProfile();
  if (!data?.user) redirect('/api/auth/login');
  const user = data.user as any;
  // Skip registration for admin
  // if (user.registration_completed === false) redirect('/registration');
  if (user.user_type !== 'admin') redirect('/post-login');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end mb-4">
          <a
            href="/api/auth/logout"
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Logout
          </a>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
          <p className="text-gray-700">Manage users, content, and settings.</p>
        </div>
      </div>
    </div>
  );
}
