import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    // Mock users data - in production, this would search your users database
    const mockUsers = [
      {
        id: "user_3",
        email: "alex.thompson@example.com",
        name: "Alex Thompson",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face",
        role: "Software Engineer"
      },
      {
        id: "user_4",
        email: "jessica.rodriguez@example.com",
        name: "Jessica Rodriguez",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616c6bfb10e?w=150&h=150&fit=crop&crop=face",
        role: "Product Manager"
      }
    ];

    // Filter users based on query
    const filteredUsers = mockUsers.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({ 
      success: true, 
      users: filteredUsers 
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
