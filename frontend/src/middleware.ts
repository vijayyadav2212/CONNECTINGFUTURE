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
  const response = NextResponse.next();
  const tokenCookie = request.cookies.get('cf_token');
  const token = tokenCookie?.value;
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