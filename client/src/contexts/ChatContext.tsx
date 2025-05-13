import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Friend, Message, User } from "@/lib/types";
import { useUser } from "./UserContext";
import { useChatConnection } from "@/hooks/useChatConnection";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/config";

interface ChatContextType {
  friends: Friend[];
  messages: Record<string, Message[]>;
  selectedFriend: Friend | null;
  onlineUsers: string[];
  isLoading: boolean;
  error: string | null;
  isLoadingFriends: boolean;
  isLoadingMessages: boolean;
  selectFriend: (friend: Friend) => void;
  sendMessage: (content: string, type?: string, mediaUrl?: string) => Promise<void>;
  addFriend: (email: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const storageKey = user ? `chat-messages-${user.id}` : null;
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  
  // Load persisted messages on user change
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) setMessages(JSON.parse(saved));
    }
  }, [storageKey]);

  // Persist messages to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Set up WebSocket connection
  const { connectionStatus, connectedClients, socketRef } = useChatConnection(user);

  // Listen for real-time incoming messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new-message') {
          const msg: Message = data.message;
          // determine conversation id (other user)
          const convId = msg.senderId === user?.id ? msg.receiverId : msg.senderId;
          setMessages(prev => ({
            ...prev,
            [convId]: [...(prev[convId] || []), msg]
          }));
        }
      } catch {}
    };
    socket.addEventListener('message', handler);
    return () => { socket.removeEventListener('message', handler); };
  }, [socketRef.current, user]);

  // On WS connect, fetch pending offline messages
  useEffect(() => {
    if (connectionStatus !== 'connected' || !user) return;
    (async () => {
      try {
        const res = await fetch(API_BASE + '/api/messages/pending', {
          headers: { 'user-id': user.id }
        });
        if (res.ok) {
          const pending: Message[] = await res.json();
          pending.forEach(msg => {
            const convId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
            setMessages(prev => ({
              ...prev,
              [convId]: [...(prev[convId]||[]), msg]
            }));
          });
        }
      } catch (err) {
        console.error('Error fetching pending messages', err);
      }
    })();
  }, [connectionStatus, user]);

  // Fetch friends when user is authenticated
  const fetchFriends = async () => {
    if (!user) return;
    setIsLoadingFriends(true);
    try {
      const res = await fetch(API_BASE + '/api/friends', {
        headers: { 'user-id': user.id.toString() }
      });
      if (res.ok) {
        const friendsData = await res.json();
        setFriends(friendsData);
      }
    } catch {
      console.error('Error fetching friends');
    } finally {
      setIsLoadingFriends(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  // Update online user list when connectedClients changes
  useEffect(() => {
    if (connectedClients.length > 0) {
      // Convert numeric userId to string for consistent indexing
      const onlineUserIds = connectedClients.map(client => client.userId.toString());
      setOnlineUsers(onlineUserIds);
    } else {
      setOnlineUsers([]);
    }
  }, [connectedClients]);

  // Load messages when selecting a friend
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !selectedFriend) return;
      
      setIsLoadingMessages(true);
      try {
        const res = await fetch(`${API_BASE}/api/messages/${selectedFriend.id}`, {
          headers: {
            'user-id': user.id.toString()
          }
        });
        
        if (res.ok) {
          const messagesData = await res.json();
          setMessages(prev => ({
            ...prev,
            [selectedFriend.id]: messagesData
          }));
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (selectedFriend && !messages[selectedFriend.id]) {
      loadMessages();
    }
  }, [selectedFriend, user]);

  const selectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
  };

  const sendMessage = async (content: string, type = "text", mediaUrl?: string) => {
    if (!user || !selectedFriend) return;
    
    try {
      const res = await fetch(API_BASE + '/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id.toString()
        },
        body: JSON.stringify({
          receiverId: selectedFriend.id,
          content,
          type,
          mediaUrl
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Could not send message');
      }
      const messageData = await res.json();
      
      // Update local messages
      setMessages(prev => {
        const friendMessages = prev[selectedFriend.id] || [];
        return {
          ...prev,
          [selectedFriend.id]: [...friendMessages, messageData]
        };
      });
      
      // Update friend's last message
      setFriends(prev => 
        prev.map(f => 
          f.id === selectedFriend.id 
            ? { 
                ...f, 
                lastMessage: { 
                  content, 
                  createdAt: new Date(), 
                  status: "sent" 
                } 
              } 
            : f
        )
      );
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive"
      });
    }
  };

  const addFriend = async (email: string) => {
    if (!user) return;
    
    try {
      // Use a direct fetch with headers instead of apiRequest
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id.toString()
        },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        toast({ title: "Friend request sent", description: `Request sent to ${email}` });
        // Refresh contact list
        await fetchFriends();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Could not send friend request");
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not send friend request",
        variant: "destructive"
      });
    }
  };

  const value = {
    friends,
    messages,
    selectedFriend,
    onlineUsers,
    isLoading,
    error,
    isLoadingFriends,
    isLoadingMessages,
    selectFriend,
    sendMessage,
    addFriend,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
