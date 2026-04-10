import { redirect } from 'next/navigation';
import { getSession } from '@auth0/nextjs-auth0';

export const dynamic = 'force-dynamic';

export default async function PostLogin() {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      redirect('/');
    }

    const user: any = session.user;

    const role = user.user_type || 'alumni';
    const isRegistered = user.registration_completed;

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

    redirect('/');
    
  } catch (error) {
    redirect('/');
  }
}