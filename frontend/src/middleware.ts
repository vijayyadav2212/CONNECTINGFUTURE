import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

function deriveRoleFromSessionUser(user: any): 'admin' | 'student' | 'alumni' {
  const claimedRole = String(user?.user_type || '').toLowerCase();
  if (claimedRole === 'admin' || claimedRole === 'student' || claimedRole === 'alumni') {
    return claimedRole as 'admin' | 'student' | 'alumni';
  }

  const email = String(user?.email || '').trim().toLowerCase();
  const admins = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const studentDomains = (process.env.STUDENT_EMAIL_DOMAINS || 'pvppcoe.ac.in').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const students = (process.env.STUDENT_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

  if (email && admins.includes(email)) return 'admin';
  const domain = email.includes('@') ? email.split('@')[1] : '';
  if (email && (students.includes(email) || studentDomains.includes(domain))) return 'student';
  return 'alumni';
}

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Store the current URL in a cookie
  const response = NextResponse.next();
  const session = await getSession(request, response);

  // If the user is trying to access the registration page
  if (request.nextUrl.pathname.startsWith('/registration')) {
    // Alumni registration page: admin/student should not stay here.
    if (session?.user) {
      const userType = deriveRoleFromSessionUser(session.user);
      const completed = !!session.user.registration_completed;

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
    if (session?.user) {
      const userType = deriveRoleFromSessionUser(session.user);
      const completed = !!session.user.registration_completed;

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
    // If the user is not logged in, redirect to the login page
    if (!session?.user) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }
    const userType = deriveRoleFromSessionUser(session.user);
    const completed = !!session.user.registration_completed;

    if (request.nextUrl.pathname.startsWith('/admin') && userType !== 'admin') {
      return NextResponse.redirect(new URL(userType === 'student' ? (completed ? '/student/dashboard' : '/student-registration') : (completed ? '/alumni/dashboard' : '/registration'), request.url));
    }

    // Enforce first-time registration before dashboard/feature routes.
    if (request.nextUrl.pathname.startsWith('/student') && request.nextUrl.pathname !== '/student-registration') {
      if (userType === 'student' && !completed) {
        return NextResponse.redirect(new URL('/student-registration', request.url));
      }
    }

    if (request.nextUrl.pathname.startsWith('/alumni')) {
      if (userType === 'alumni' && !completed) {
        return NextResponse.redirect(new URL('/registration', request.url));
      }

      // Allow alumni routes to proceed once registration is completed.
      // The `AlumniNavigation` component will display pending/approved/rejected states to the user.
    }
  }

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path, which is the landing page)
     * - /login (the login page itself)
     * - /public (public assets)
     */
  '/((?!api|_next/static|_next/image|favicon.ico|public|/$|^/login$).*)'
  ],
};