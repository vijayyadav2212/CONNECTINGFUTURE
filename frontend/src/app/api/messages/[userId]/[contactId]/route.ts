import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; contactId: string }> }
) {
  try {
    const { userId, contactId } = await params;
    
    // Mock messages data - in production, this would come from your database
    const mockMessages = [
      {
        id: 1,
        senderId: contactId,
        receiverId: userId,
        content: "Hi! Thank you so much for the mentoring session today.",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'read',
        senderEmail: "sarah.johnson@example.com"
      },
      {
        id: 2,
        senderId: userId,
        receiverId: contactId,
        content: "You're very welcome! I'm glad I could help.",
        timestamp: new Date(Date.now() - 7000000).toISOString(),
        status: 'read',
        senderEmail: "you@example.com"
      }
    ];

    return NextResponse.json({ 
      success: true, 
      messages: mockMessages 
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
