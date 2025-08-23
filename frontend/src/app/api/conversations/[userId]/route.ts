import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Mock conversations data - in production, this would come from your database
    const mockConversations = [
      {
        contact_id: "user_1",
        contact_email: "sarah.johnson@example.com",
        contact_name: "Sarah Johnson",
        contact_avatar: "https://images.unsplash.com/photo-1494790108755-2616c6bfb10e?w=150&h=150&fit=crop&crop=face",
        last_message: "Thank you for the mentoring session today!",
        last_message_time: new Date().toISOString(),
        unread_count: 2
      },
      {
        contact_id: "user_2",
        contact_email: "mike.chen@example.com",
        contact_name: "Mike Chen",
        contact_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        last_message: "Could we schedule another meeting next week?",
        last_message_time: new Date(Date.now() - 3600000).toISOString(),
        unread_count: 1
      }
    ];

    return NextResponse.json({ 
      success: true, 
      conversations: mockConversations 
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
