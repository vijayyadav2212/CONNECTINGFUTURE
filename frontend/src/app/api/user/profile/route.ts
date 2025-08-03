import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { user } = session;
    
    // For now, we'll check if the user has completed registration
    // You can replace this with your actual database check
    const userProfile = {
      email: user.email,
      isNewUser: !user.app_metadata?.registration_completed,
      profile: user.app_metadata?.profile || null
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error checking user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
