# WebSocket Messaging Integration Guide

## 📋 Complete Step-by-Step Integration

### **Step 1: Backend Setup**

#### 1.1 Install Dependencies
```bash
cd backend
npm install socket.io nodemon
```

#### 1.2 Database Setup
1. Create MySQL database named `connecting_future`
2. Run the schema file:
```bash
mysql -u root -p connecting_future < database/schema.sql
```

#### 1.3 Environment Configuration
1. Copy `.env.example` to `.env`
2. Update with your actual values:
```bash
cp .env.example .env
```

### **Step 2: Frontend Setup**

#### 2.1 Install Dependencies
```bash
cd frontend
npm install socket.io-client
```

#### 2.2 Environment Configuration
1. Copy `.env.example` to `.env.local`
2. Update with your actual values

### **Step 3: Integration with Your Messages Page**

#### 3.1 Wrap Your App with WebSocket Provider

Update your `app/layout.tsx`:
```tsx
import { WebSocketProvider } from '@/contexts/WebSocketContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </UserProvider>
      </body>
    </html>
  );
}
```

#### 3.2 Update Your Messages Page

Replace your current messages page implementation with:

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useMessages } from '@/hooks/useMessages';
import AlumniNavigation from '../AluminaNavigation';
// ... other imports

export default function MessagesPage() {
  const { 
    conversations, 
    onlineUsers, 
    isConnected, 
    loadConversations, 
    searchUsers 
  } = useWebSocket();
  
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  
  const { 
    messages, 
    isLoading, 
    isTyping, 
    sendMessage, 
    handleStartTyping, 
    handleStopTyping 
  } = useMessages({ contactId: selectedContactId || undefined });

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleTyping = () => {
    handleStartTyping();
  };

  // Rest of your component logic...
}
```

### **Step 4: Auth0 API Integration**

#### 4.1 Add API Routes

Create `app/api/conversations/[userId]/route.ts`:
```tsx
import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';

export const GET = withApiAuthRequired(async function handler(req, { params }) {
  try {
    const { accessToken } = await getAccessToken(req);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conversations/${params.userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
});
```

### **Step 5: Testing the Integration**

#### 5.1 Start Both Servers
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

#### 5.2 Test Features
1. **Connection**: Check browser console for WebSocket connection
2. **Send Messages**: Try sending messages between users
3. **Real-time Updates**: Open multiple browser tabs/windows
4. **Typing Indicators**: Start typing and see indicators
5. **Online Status**: Check user online/offline status

### **Step 6: Advanced Features (Optional)**

#### 6.1 File Upload Support
Add file upload endpoint in backend:
```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/api/upload', checkJwt, upload.single('file'), (req, res) => {
  res.json({ fileUrl: `/uploads/${req.file.filename}` });
});
```

#### 6.2 Push Notifications
Add service worker for browser notifications:
```javascript
// In your WebSocket context
useEffect(() => {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}, []);

// On new message
const showNotification = (message) => {
  if (Notification.permission === 'granted') {
    new Notification(`New message from ${message.senderEmail}`, {
      body: message.content,
      icon: '/icon-192x192.png'
    });
  }
};
```

### **Step 7: Production Deployment**

#### 7.1 Backend Deployment (Railway/Heroku)
```bash
# Add to package.json
"scripts": {
  "start": "node server.js"
}
```

#### 7.2 Frontend Deployment (Vercel)
Update environment variables in your deployment platform.

### **Step 8: API Endpoints Reference**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations/:userId` | GET | Get all conversations for user |
| `/api/messages/:userId/:contactId` | GET | Get message history |
| `/api/users/search` | GET | Search users for new conversations |
| `/api/users` | POST | Store/update user info |

### **Step 9: WebSocket Events Reference**

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client → Server | User joins with credentials |
| `sendMessage` | Client → Server | Send a message |
| `newMessage` | Server → Client | Receive new message |
| `typing` | Client → Server | Send typing status |
| `userTyping` | Server → Client | Receive typing indicator |
| `markAsRead` | Client → Server | Mark message as read |
| `userStatusChange` | Server → Client | User online/offline status |

### **Troubleshooting**

#### Common Issues:
1. **CORS Errors**: Check FRONTEND_URL in backend .env
2. **Auth Errors**: Verify Auth0 configuration
3. **Database Errors**: Ensure MySQL is running and schema is created
4. **WebSocket Connection**: Check firewall and port availability

#### Debug Commands:
```bash
# Check WebSocket connection in browser console
socket.connected

# Monitor backend logs
npm run dev

# Test API endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/conversations/user1
```

This completes your WebSocket messaging integration! 🚀
