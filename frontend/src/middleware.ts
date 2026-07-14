import { NextRequest, NextResponse } from 'next/server';

function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  const admins = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  return admins.includes(normalized);
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function deriveRoleFromUser(user: any): 'admin' | 'student' | 'alumni' {
  const email = String(user?.email || '').trim().toLowerCase();
  if (isAdminEmail(email)) return 'admin';

  const claimedRole = String(user?.user_type || '').toLowerCase();
  if (claimedRole === 'student' || claimedRole === 'alumni' || claimedRole === 'admin') {
    return claimedRole as 'admin' | 'student' | 'alumni';
  }

  const studentDomains = (process.env.STUDENT_EMAIL_DOMAINS || 'pvppcoe.ac.in').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const students = (process.env.STUDENT_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

  const domain = email.includes('@') ? email.split('@')[1] : '';
  if (email && (students.includes(email) || studentDomains.includes(domain))) return 'student';
  return 'alumni';
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();
  const tokenCookie = request.cookies.get('cf_token');
  let token = tokenCookie?.value;

  if (!token) {
    const refreshCookie = request.cookies.get('cf_refresh_token');
    if (refreshCookie?.value) {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v2';
        const baseUrl = apiBase.endsWith('/api/v2') ? apiBase.slice(0, -7) : apiBase;
        
        const refreshResp = await fetch(`${baseUrl}/api/v2/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refreshCookie.value })
        });
        
        if (refreshResp.ok) {
          const data = await refreshResp.json();
          if (data.token) {
            token = data.token;
            const redirectResponse = NextResponse.redirect(request.url);
            redirectResponse.cookies.set('cf_token', token, { path: '/', maxAge: 900, sameSite: 'lax' });
            if (data.refreshToken) {
              redirectResponse.cookies.set('cf_refresh_token', data.refreshToken, { path: '/', maxAge: 604800, sameSite: 'lax' });
            }
            return redirectResponse;
          }
        }
      } catch (err) {
        console.error('Middleware token refresh error:', err);
      }
    }
  }

  const user = token ? parseJwt(token) : null;

  // If the user is trying to access the registration page
  if (request.nextUrl.pathname.startsWith('/registration')) {
    if (user) {
      const userType = deriveRoleFromUser(user);
      const completed = !!user.registration_completed;

      if (userType === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (userType === 'student') {
        return NextResponse.redirect(new URL(completed ? '/student/dashboard' : '/student-registration', request.url));
      }
      if (completed) {
        return NextResponse.redirect(new URL('/alumni/dashboard', request.url));
      }
    }
    return response;
  }

  // Student registration page: completed students/admin/alumni should not stay here.
  if (request.nextUrl.pathname.startsWith('/student-registration')) {
    if (user) {
      const userType = deriveRoleFromUser(user);
      const completed = !!user.registration_completed;

      if (userType === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (userType === 'alumni') {
        return NextResponse.redirect(new URL(completed ? '/alumni/dashboard' : '/registration', request.url));
      }
      if (completed) {
        return NextResponse.redirect(new URL('/student/dashboard', request.url));
      }
    }
    return response;
  }

  // For any other protected route
  if (request.nextUrl.pathname.startsWith('/alumni') || request.nextUrl.pathname.startsWith('/student') || request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const userType = deriveRoleFromUser(user);
    const completed = !!user.registration_completed;
    const adminAllowed = isAdminEmail(user?.email);

    if (request.nextUrl.pathname.startsWith('/admin') && (!adminAllowed || userType !== 'admin')) {
      return NextResponse.redirect(new URL(userType === 'student' ? (completed ? '/student/dashboard' : '/student-registration') : (completed ? '/alumni/dashboard' : '/registration'), request.url));
    }

    if (request.nextUrl.pathname.startsWith('/student') && request.nextUrl.pathname !== '/student-registration') {
      if (userType === 'student' && !completed) {
        return NextResponse.redirect(new URL('/student-registration', request.url));
      }
    }

    if (request.nextUrl.pathname.startsWith('/alumni')) {
      if (userType === 'alumni' && !completed) {
        return NextResponse.redirect(new URL('/registration', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|/$|^/login$).*)'
  ],
};