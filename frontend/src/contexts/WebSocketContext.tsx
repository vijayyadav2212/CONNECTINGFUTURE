"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  senderEmail?: string;
  receiverEmail?: string;
}

interface Conversation {
  contact_id: string;
  contact_email: string;
  contact_name: string;
  contact_avatar: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface WebSocketContextType {
  socket: Socket | null;
  messages: Message[];
  conversations: Conversation[];
  onlineUsers: Set<string>;
  isConnected: boolean;
  sendMessage: (receiverId: string, content: string) => void;
  markAsRead: (messageId: number) => void;
  startTyping: (receiverId: string) => void;
  stopTyping: (receiverId: string) => void;
  loadConversations: () => void;
  loadMessages: (contactId: string) => Promise<Message[]>;
  searchUsers: (query: string) => Promise<any[]>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isLoading } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);

  // Define functions with useCallback to prevent infinite re-renders
  const loadConversations = useCallback(async () => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/conversations/${encodeURIComponent(user.sub)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      // Handle error silently or with proper error handling
    }
  }, [user?.sub]);

  const loadMessages = useCallback(async (contactId: string): Promise<Message[]> => {
    if (!user?.sub) return [];
    
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(user.sub)}/${encodeURIComponent(contactId)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = data.messages || [];
        setMessages(loadedMessages);
        return loadedMessages;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }, [user?.sub]);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    if (socket && user?.sub) {
      const message = {
        id: Date.now(),
        senderId: user.sub,
        receiverId,
        content,
        timestamp: new Date(),
        status: 'sent' as const,
        senderEmail: user.email,
      };
      
      socket.emit('sendMessage', message);
    }
  }, [socket, user]);

  const markAsRead = useCallback((messageId: number) => {
    if (socket) {
      socket.emit('markAsRead', messageId);
    }
  }, [socket]);

  const startTyping = useCallback((receiverId: string) => {
    if (socket && user?.sub) {
      socket.emit('startTyping', { senderId: user.sub, receiverId });
    }
  }, [socket, user]);

  const stopTyping = useCallback((receiverId: string) => {
    if (socket && user?.sub) {
      socket.emit('stopTyping', { senderId: user.sub, receiverId });
    }
  }, [socket, user]);

  const searchUsers = useCallback(async (query: string): Promise<any[]> => {
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.users || [];
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }, []);

  // Socket connection effect
  useEffect(() => {
    if (!user || isLoading) return;

    const newSocket = io('http://localhost:4000', {
      auth: {
        userId: user.sub,
        userEmail: user.email,
      },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('messageReceived', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('messageConfirmed', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('onlineUsers', (users: string[]) => {
      setOnlineUsers(new Set(users));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, isLoading]);

  // Load conversations when user is available
  useEffect(() => {
    if (user && !isLoading) {
      loadConversations();
    }
  }, [user, isLoading, loadConversations]);

  return (
    <WebSocketContext.Provider value={{
      socket,
      messages,
      conversations,
      onlineUsers,
      isConnected,
      sendMessage,
      markAsRead,
      startTyping,
      stopTyping,
      loadConversations,
      loadMessages,
      searchUsers
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};
