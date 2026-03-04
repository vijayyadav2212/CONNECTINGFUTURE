import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Store the current URL in a cookie
  const response = NextResponse.next();
  const session = await getSession(request, response);

  // If the user is trying to access the registration page
  if (request.nextUrl.pathname.startsWith('/registration')) {
    // If logged in and either admin/student OR registration completed, redirect to their dashboard
    if (session?.user) {
      const userType = session.user.user_type;
      const completed = !!session.user.registration_completed;
      if (userType === 'admin' || userType === 'student' || completed) {
        const dashboardUrl = userType === 'admin'
          ? '/admin/dashboard'
          : userType === 'student'
          ? '/student/dashboard'
          : '/alumni/dashboard';
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
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
    // Enforce registration only for alumni routes; skip for admin/student
    if (request.nextUrl.pathname.startsWith('/alumni')) {
      if (!session.user.registration_completed) {
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