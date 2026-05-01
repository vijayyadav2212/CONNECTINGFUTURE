'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  const admins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  return admins.includes(normalized);
}

function deriveRole(user: any): 'admin' | 'student' | 'alumni' {
  const email = String(user?.email || '').trim().toLowerCase();
  if (isAdminEmail(email)) return 'admin';

  const claimed = String(user?.user_type || '').toLowerCase();
  if (claimed === 'student' || claimed === 'alumni') {
    return claimed as 'admin' | 'student' | 'alumni';
  }

  const studentDomains = (process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAINS || 'pvppcoe.ac.in').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const students = (process.env.NEXT_PUBLIC_STUDENT_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

  const domain = email.includes('@') ? email.split('@')[1] : '';
  if (email && (students.includes(email) || studentDomains.includes(domain))) return 'student';
  return 'alumni';
}

export default function PostLogin() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;

    const resolveAndRoute = async () => {
      if (!user) {
        router.replace('/');
        return;
      }

      let role: 'admin' | 'student' | 'alumni' | null = null;
      const adminEmail = isAdminEmail(user?.email);
      const claimedRole = typeof user?.user_type === 'string' ? String(user.user_type).toLowerCase() : null;

      if (adminEmail) {
        role = 'admin';
      } else if (claimedRole === 'student') {
        role = 'student';
      } else if (claimedRole === 'alumni') {
        role = 'alumni';
      } else {
        role = deriveRole(user);
      }

      let isRegistered: boolean | null = typeof user?.registration_completed === 'boolean'
        ? user.registration_completed
        : null;

      try {
        const profileResp = await fetch('/api/user/profile', {
          cache: 'no-store',
          credentials: 'include',
        });

        if (profileResp.ok) {
          const profileData = await profileResp.json();
          const profileUser = profileData?.user || {};
          const profileRole = String(profileUser.user_type || profileUser.userType || '').toLowerCase();

          if (!adminEmail && (profileRole === 'student' || profileRole === 'alumni')) {
            role = profileRole;
          }

          if (typeof profileUser.registration_completed === 'boolean') {
            isRegistered = profileUser.registration_completed;
          }
        }
      } catch {
        // Keep claim-based fallback if profile API is temporarily unavailable.
      }

      if (cancelled) return;
      if (typeof isRegistered !== 'boolean') isRegistered = false;

      if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (role === 'student') {
        router.replace(isRegistered ? '/student/dashboard' : '/student-registration');
      } else if (role === 'alumni') {
        router.replace(isRegistered ? '/alumni/dashboard' : '/registration');
      } else {
        router.replace('/alumni/dashboard');
      }
    };

    resolveAndRoute();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, router]);

  // Show loading state while determining route
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(99,102,241,0.2),_transparent_45%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-blue-400/20 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl shadow-blue-900/30">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full border-2 border-blue-400/40 border-t-blue-400 animate-spin" />
        <h1 className="text-center text-2xl font-bold tracking-tight">Preparing your dashboard</h1>
        <p className="mt-2 text-center text-sm text-slate-300">
          Verifying your profile and routing you to the right space.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.2s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.1s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
