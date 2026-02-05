"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        if (pathname === '/registration') {
          setChecked(true);
          return;
        }
        // Only enforce registration when user explicitly started a signup flow
        const hasSignupIntent = typeof document !== 'undefined' && document.cookie.includes('signup_intent=1');
        const res = await fetch('/api/user/profile', { cache: 'no-store' });
        if (res.status === 401) {
          setChecked(true);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          const isNew = data?.isNewUser === true || data?.user?.registration_completed === false;
          if (isNew && hasSignupIntent) {
            router.replace(`/registration?redirect=${encodeURIComponent(pathname || '/')}`);
            return;
          }
        }
      } catch (e) {
        // fail open
      } finally {
        if (active) setChecked(true);
      }
    };
    check();
    return () => { active = false; };
  }, [pathname, router]);

  if (!checked) return null;
  return <>{children}</>;
}
