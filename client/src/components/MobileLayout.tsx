import { useState } from "react";
import { Search, Plus, ChevronLeft, Phone, MoreVertical } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useChat } from "@/contexts/ChatContext";
import { Friend } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import MessageInput from "./MessageInput";
import ChatArea from "./ChatArea";

interface MobileLayoutProps {
  showChat: boolean;
  onSelectContact: (friend: Friend) => void;
  onBackToContacts: () => void;
  onAddFriend: () => void;
}

export default function MobileLayout({ 
  showChat, 
  onSelectContact, 
  onBackToContacts,
  onAddFriend
}: MobileLayoutProps) {
  const { user } = useUser();
  const { friends, selectedFriend, onlineUsers, isLoadingFriends } = useChat();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Contacts List View
  if (!showChat) {
    return (
      <>
        {/* Mobile Header for Contact List */}
        <div className="px-4 py-3 border-b border-divider flex items-center justify-between bg-background">
          <div className="flex items-center">
            <img 
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=2B5BE2&color=fff`}
              alt="Current user avatar" 
              className="h-8 w-8 rounded-full object-cover"
            />
            <h2 className="ml-3 font-semibold text-lg">{user?.name}</h2>
          </div>
          <div className="flex items-center">
            <ThemeToggle className="mr-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full" 
              onClick={onAddFriend}
            >
              <Plus className="h-5 w-5 text-primary" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="p-3 border-b border-divider bg-background">
          <div className="relative flex items-center">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 pointer-events-none" />
            <Input 
              type="text" 
              placeholder="Search conversations" 
              className="w-full pl-9 pr-4 bg-background border-input text-foreground rounded-full"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Mobile Contacts List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {isLoadingFriends ? (
            // Loading state
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-3 border-b border-divider">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-3 flex-1">
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredFriends.length === 0 ? (
            // Empty state
            <div className="text-center p-6 text-gray-500">
              <p>No contacts found</p>
              <Button 
                variant="link" 
                onClick={onAddFriend}
                className="mt-2 text-primary"
              >
                Add a friend
              </Button>
            </div>
          ) : (
            // Contact list
            filteredFriends.map((friend) => {
              const isOnline = onlineUsers.includes(friend.id);
              
              return (
                <div 
                  key={friend.id}
                  className="contact-item p-3 hover:bg-subtle transitions cursor-pointer border-b border-divider"
                  onClick={() => onSelectContact(friend)}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <img 
                        src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=2B5BE2&color=fff`}
                        alt={`${friend.name} avatar`} 
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className={`absolute bottom-0 right-0 h-3 w-3 ${isOnline ? 'bg-[#00D26A]' : 'bg-gray-300'} rounded-full border-2 border-white`}></div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-text">{friend.name}</h3>
                        <span className="text-xs text-gray-500">
                          {friend.lastMessage?.createdAt ? 
                            formatDistanceToNow(new Date(friend.lastMessage.createdAt), { addSuffix: false }) 
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                          {friend.lastMessage?.content || 'No messages yet'}
                        </p>
                        {/* Unread message count would go here */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </>
    );
  }

  // Chat View
  return (
    <div className="h-full flex flex-col">
      {/* Mobile Chat Header */}
      <div className="px-3 py-2 border-b border-divider flex items-center bg-white">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-light transitions mr-2" 
          onClick={onBackToContacts}
        >
          <ChevronLeft className="h-5 w-5 text-text" />
        </Button>
        <div className="flex items-center flex-1">
          <img 
            src={selectedFriend?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFriend?.name || "User")}&background=2B5BE2&color=fff`}
            alt={`${selectedFriend?.name} avatar`} 
            className="h-8 w-8 rounded-full object-cover"
          />
          <div className="ml-3">
            <h3 className="font-medium text-text">{selectedFriend?.name}</h3>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full ${selectedFriend?.status === 'online' ? 'bg-[#00D26A]' : 'bg-gray-300'} mr-2`}></div>
              <span className="text-xs text-gray-500">{selectedFriend?.status === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-light transitions">
            <Phone className="h-5 w-5 text-text" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-light transitions ml-1">
            <MoreVertical className="h-5 w-5 text-text" />
          </Button>
        </div>
      </div>
      
      {/* Chat Content */}
      <ChatArea />
    </div>
  );
}
