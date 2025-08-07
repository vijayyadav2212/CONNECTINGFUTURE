// "use client";

// import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import { useUser } from '@auth0/nextjs-auth0/client';
// import { io, Socket } from 'socket.io-client';

// interface Message {
//   id: number;
//   senderId: string;
//   receiverId: string;
//   content: string;
//   timestamp: Date;
//   status: 'sent' | 'delivered' | 'read';
//   senderEmail?: string;
//   receiverEmail?: string;
// }

// interface Conversation {
//   contact_id: string;
//   contact_email: string;
//   contact_name: string;
//   contact_avatar: string;
//   last_message: string;
//   last_message_time: string;
//   unread_count: number;
// }

// interface WebSocketContextType {
//   socket: Socket | null;
//   messages: Message[];
//   conversations: Conversation[];
//   onlineUsers: Set<string>;
//   isConnected: boolean;
//   sendMessage: (receiverId: string, content: string) => void;
//   markAsRead: (messageId: number) => void;
//   startTyping: (receiverId: string) => void;
//   stopTyping: (receiverId: string) => void;
//   loadConversations: () => void;
//   loadMessages: (contactId: string) => Promise<Message[]>;
//   searchUsers: (query: string) => Promise<any[]>;
// }

// const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// export const useWebSocket = () => {
//   const context = useContext(WebSocketContext);
//   if (!context) {
//     throw new Error('useWebSocket must be used within a WebSocketProvider');
//   }
//   return context;
// };

// interface WebSocketProviderProps {
//   children: React.ReactNode;
// }

// export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
//   const { user, isLoading } = useUser();
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
//   const [isConnected, setIsConnected] = useState(false);

//   // Define functions with useCallback to prevent infinite re-renders
//   const loadConversations = useCallback(async () => {
//     if (!user?.sub) return;
    
//     try {
//       console.log(`🚀 Loading conversations for user: ${user.sub}`);
      
//       const response = await fetch(`/api/conversations/${encodeURIComponent(user.sub)}`, {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         console.log('✅ Conversations loaded:', data);
//         setConversations(data.conversations);
//       } else {
//         console.error('❌ Failed to load conversations:', response.status, response.statusText);
//       }
//     } catch (error) {
//       console.error('❌ Error loading conversations:', error);
//     }
//   }, [user?.sub]);

//   const loadMessages = useCallback(async (contactId: string): Promise<Message[]> => {
//     if (!user?.sub) return [];
    
//     try {
//       console.log(`📨 Loading messages between ${user.sub} and ${contactId}`);
      
//       const response = await fetch(`/api/messages/${encodeURIComponent(user.sub)}/${encodeURIComponent(contactId)}`, {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         console.log('✅ Messages loaded:', data);
//         return data.messages;
//       } else {
//         console.error('❌ Failed to load messages:', response.status, response.statusText);
//       }
//     } catch (error) {
//       console.error('❌ Error loading messages:', error);
//     }
    
//     return [];
//   }, [user?.sub]);

//   const sendMessage = useCallback((receiverId: string, content: string) => {
//     if (socket && user) {
//       socket.emit('sendMessage', {
//         senderId: user.sub,
//         receiverId,
//         content
//       });
//     }
//   }, [socket, user]);

//   const markAsRead = useCallback((messageId: number) => {
//     if (socket) {
//       socket.emit('markAsRead', messageId);
//     }
//   }, [socket]);

//   const startTyping = useCallback((receiverId: string) => {
//     if (socket) {
//       socket.emit('typing', { receiverId, isTyping: true });
//     }
//   }, [socket]);

//   const stopTyping = useCallback((receiverId: string) => {
//     if (socket) {
//       socket.emit('typing', { receiverId, isTyping: false });
//     }
//   }, [socket]);

//   const searchUsers = useCallback(async (query: string): Promise<any[]> => {
//     try {
//       console.log(`🔍 Searching users with query: "${query}"`);
      
//       const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       });
      
//       if (response.ok) {
//         const data = await response.json();
//         console.log('✅ Users found:', data);
//         return data.users;
//       } else {
//         console.error('❌ Failed to search users:', response.status, response.statusText);
//       }
//     } catch (error) {
//       console.error('❌ Error searching users:', error);
//     }
    
//     return [];
//   }, []);

//   // Socket connection useEffect
//   useEffect(() => {
//     if (!isLoading && user) {
//       console.log('🔌 Setting up WebSocket connection...');
      
//       // Initialize socket connection
//       const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
//         auth: {
//           token: user.sub
//         }
//       });

//       // Connection event handlers
//       newSocket.on('connect', () => {
//         console.log('✅ Connected to WebSocket server');
//         setIsConnected(true);
        
//         // Join with user data
//         newSocket.emit('join', {
//           userId: user.sub,
//           email: user.email
//         });
//       });

//       newSocket.on('disconnect', () => {
//         console.log('❌ Disconnected from WebSocket server');
//         setIsConnected(false);
//       });

//       // Message event handlers
//       newSocket.on('newMessage', (message: Message) => {
//         console.log('📥 New message received:', message);
//         setMessages(prev => [...prev, message]);
//         // Update conversations with new message - this won't cause infinite loop now
//         loadConversations();
//       });

//       newSocket.on('messageConfirmed', (message: Message) => {
//         console.log('✅ Message confirmed:', message);
//         setMessages(prev => [...prev, message]);
//       });

//       newSocket.on('messageError', (error: any) => {
//         console.error('❌ Message error:', error);
//         if (typeof window !== 'undefined') {
//           window.dispatchEvent(new CustomEvent('messageError', { 
//             detail: { 
//               message: error.error || 'Failed to send message', 
//               timestamp: new Date().toISOString() 
//             } 
//           }));
//         }
//       });

//       newSocket.on('messageRead', ({ messageId, status }) => {
//         console.log(`📖 Message ${messageId} marked as ${status}`);
//         setMessages(prev => 
//           prev.map(msg => 
//             msg.id === messageId ? { ...msg, status } : msg
//           )
//         );
//       });

//       // User status handlers
//       newSocket.on('userStatusChange', ({ userId, status }) => {
//         console.log(`👤 User ${userId} is now ${status}`);
//         setOnlineUsers(prev => {
//           const newSet = new Set(prev);
//           if (status === 'online') {
//             newSet.add(userId);
//           } else {
//             newSet.delete(userId);
//           }
//           return newSet;
//         });
//       });

//       newSocket.on('userTyping', ({ userId, isTyping }) => {
//         console.log(`⌨️ User ${userId} is ${isTyping ? 'typing' : 'stopped typing'}`);
//       });

//       setSocket(newSocket);

//       return () => {
//         console.log('🔌 Cleaning up WebSocket connection...');
//         newSocket.close();
//       };
//     }
//   }, [isLoading, user, loadConversations]);

//   // Load conversations when user is available (separate useEffect to avoid dependency issues)
//   useEffect(() => {
//     if (user && !isLoading) {
//       loadConversations();
//     }
//   }, [user, isLoading, loadConversations]);

//   return (
//     <WebSocketContext.Provider value={{
//       socket,
//       messages,
//       conversations,
//       onlineUsers,
//       isConnected,
//       sendMessage,
//       markAsRead,
//       startTyping,
//       stopTyping,
//       loadConversations,
//       loadMessages,
//       searchUsers
//     }}>
//       {children}
//     </WebSocketContext.Provider>
//   );
// };
