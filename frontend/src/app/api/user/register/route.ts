import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.json();
    const { user } = session;

    // Here you would typically save the registration data to your database
    // For now, we'll just log it and return success
    console.log('Registration data for user:', user.email, formData);

    // In a real app, you would:
    // 1. Save user profile to your database
    // 2. Update Auth0 user metadata to mark registration as complete
    // 3. Return user profile data

    // Simulate saving to database
    const userProfile = {
      id: user.sub,
      email: user.email,
      name: formData.fullName,
      graduationYear: formData.graduationYear,
      course: formData.course,
      currentCompany: formData.currentCompany,
      jobTitle: formData.jobTitle,
      location: formData.location,
      linkedIn: formData.linkedIn,
      bio: formData.bio,
      skills: formData.skills?.split(',').map((skill: string) => skill.trim()) || [],
      isOpenToMentoring: formData.isOpenToMentoring,
      registrationCompleted: true,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      message: 'Registration completed successfully',
      profile: userProfile
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
