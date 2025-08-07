"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface UseMessagesProps {
  contactId?: string;
}

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

export const useMessages = ({ contactId }: UseMessagesProps = {}) => {
  const {
    socket,
    sendMessage: socketSendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    loadMessages,
    isConnected
  } = useWebSocket();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Load messages for a specific contact
  const loadContactMessages = useCallback(async (targetContactId: string) => {
    setIsLoading(true);
    try {
      const loadedMessages = await loadMessages(targetContactId);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages]);

  // Send a message
  const sendMessage = useCallback((content: string) => {
    if (contactId && content.trim()) {
      socketSendMessage(contactId, content.trim());
    }
  }, [contactId, socketSendMessage]);

  // Handle typing indicators
  const handleStartTyping = useCallback(() => {
    if (contactId && !isTyping) {
      setIsTyping(true);
      startTyping(contactId);
    }
  }, [contactId, isTyping, startTyping]);

  const handleStopTyping = useCallback(() => {
    if (contactId && isTyping) {
      setIsTyping(false);
      stopTyping(contactId);
    }
  }, [contactId, isTyping, stopTyping]);

  // Auto-stop typing after inactivity
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        handleStopTyping();
      }, 3000); // Stop typing after 3 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [isTyping, handleStopTyping]);

  // Listen for new messages
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: Message) => {
        // Only add message if it's for current conversation
        if (contactId && (message.senderId === contactId || message.receiverId === contactId)) {
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.some(m => m.id === message.id);
            if (exists) return prev;
            return [...prev, message];
          });

          // Mark as read if we're the receiver
          if (message.receiverId === contactId) {
            markAsRead(message.id);
          }
        }
      };

      const handleMessageConfirmed = (message: Message) => {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      };

      const handleUserTyping = ({ userId, isTyping: userIsTyping }: { userId: string; isTyping: boolean }) => {
        if (userId === contactId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (userIsTyping) {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            return newSet;
          });
        }
      };

      socket.on('newMessage', handleNewMessage);
      socket.on('messageConfirmed', handleMessageConfirmed);
      socket.on('userTyping', handleUserTyping);

      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('messageConfirmed', handleMessageConfirmed);
        socket.off('userTyping', handleUserTyping);
      };
    }
  }, [socket, contactId, markAsRead]);

  // Load messages when contact changes
  useEffect(() => {
    if (contactId) {
      loadContactMessages(contactId);
    }
  }, [contactId, loadContactMessages]);

  return {
    messages,
    isLoading,
    isConnected,
    isTyping: typingUsers.size > 0,
    typingUsers,
    sendMessage,
    handleStartTyping,
    handleStopTyping,
    loadContactMessages
  };
};
