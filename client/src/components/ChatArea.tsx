import { useRef, useEffect } from "react";
import { Phone, Video, MoreVertical, Check } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useUser } from "@/contexts/UserContext";
import MessageInput from "./MessageInput";
import { Message } from "@/lib/types";
import { format, isToday, isYesterday } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function ChatArea() {
  const { user } = useUser();
  const { selectedFriend, messages, isLoadingMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedFriend]);

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach(message => {
      const date = new Date(message.createdAt);
      let dateStr = '';

      if (isToday(date)) {
        dateStr = 'Today';
      } else if (isYesterday(date)) {
        dateStr = 'Yesterday';
      } else {
        dateStr = format(date, 'MMM d, yyyy');
      }

      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(message);
    });

    return groups;
  };

  if (!selectedFriend) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-subtle">
        <div className="text-center p-6">
          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
          <p className="text-gray-500">Choose a contact to start chatting</p>
        </div>
      </div>
    );
  }

  const currentMessages = selectedFriend && messages[selectedFriend.id] ? messages[selectedFriend.id] : [];
  const groupedMessages = groupMessagesByDate(currentMessages);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="border-b border-divider p-3 flex items-center justify-between bg-white">
        <div className="flex items-center">
          <img 
            src={selectedFriend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFriend.name)}&background=2B5BE2&color=fff`}
            alt={`${selectedFriend.name} avatar`} 
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="ml-3">
            <h3 className="font-medium text-text">{selectedFriend.name}</h3>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full ${selectedFriend.status === 'online' ? 'bg-[#00D26A]' : 'bg-gray-300'} mr-2`}></div>
              <span className="text-xs text-gray-500">{selectedFriend.status === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-light transitions">
            <Phone className="h-5 w-5 text-text" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-light transitions ml-1">
            <Video className="h-5 w-5 text-text" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-light transitions ml-1">
            <MoreVertical className="h-5 w-5 text-text" />
          </Button>
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-subtle hide-scrollbar">
        {isLoadingMessages ? (
          // Loading state
          Array(5).fill(0).map((_, i) => (
            <div key={i} className={`flex mb-4 ${i % 2 === 0 ? '' : 'justify-end'}`}>
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-3" />}
              <div className="max-w-[75%]">
                <Skeleton className={`h-24 w-64 ${i % 2 === 0 ? 'rounded-[18px] rounded-bl-[4px]' : 'rounded-[18px] rounded-br-[4px]'}`} />
                <Skeleton className="h-3 w-16 mt-1 ml-1" />
              </div>
            </div>
          ))
        ) : Object.entries(groupedMessages).length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">Send a message to start the conversation</p>
          </div>
        ) : (
          // Messages
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Marker */}
              <div className="flex justify-center mb-6">
                <div className="bg-light rounded-full px-4 py-1 text-xs text-gray-500">{date}</div>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((message) => {
                const isSentByMe = message.senderId === user?.id;
                return (
                  <div key={message.id} className={`flex mb-4 ${isSentByMe ? 'justify-end' : ''}`}>
                    {!isSentByMe && (
                      <div className="flex-shrink-0 mr-3">
                        <img 
                          src={selectedFriend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedFriend.name)}&background=2B5BE2&color=fff`}
                          alt={`${selectedFriend.name} avatar`} 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      </div>
                    )}
                    <div className="max-w-[75%]">
                      <div className={`${isSentByMe ? 'bg-primary text-primary-foreground message-bubble-sent' : 'bg-white text-foreground dark:bg-card dark:text-card-foreground message-bubble-received'} p-3 rounded-lg shadow-sm`}>
                        {message.type === 'image' && message.mediaUrl && (
                          <img 
                            src={message.mediaUrl} 
                            alt="Image message" 
                            className="w-full h-auto rounded mb-2 object-cover"
                          />
                        )}
                        <p>{message.content}</p>
                      </div>
                      <div className={`flex items-center ${isSentByMe ? 'justify-end mt-1 mr-1' : 'mt-1 ml-1'}`}>
                        <div className="text-xs text-gray-500 mr-1">
                          {format(new Date(message.createdAt), 'h:mm a')}
                        </div>
                        {isSentByMe && (
                          <Check className={`h-3 w-3 ${message.status === 'read' ? 'text-[#00D26A]' : 'text-gray-400'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <MessageInput />
    </div>
  );
}
