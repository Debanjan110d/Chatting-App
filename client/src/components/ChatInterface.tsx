import { useState, useEffect } from "react";
import { useMediaQuery } from "@/hooks/use-mobile";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import AddFriendModal from "./AddFriendModal";
import MobileLayout from "./MobileLayout";
import { useChat } from "@/contexts/ChatContext";
import { Friend } from "@/lib/types";

export default function ChatInterface() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const { selectFriend, selectedFriend, isLoading, error } = useChat();

  useEffect(() => {
    // If selected friend changes on mobile, show the chat view
    if (selectedFriend && isMobile) {
      setShowMobileChat(true);
    }
  }, [selectedFriend, isMobile]);

  const onSelectContact = (friend: Friend) => {
    selectFriend(friend);
    if (isMobile) {
      setShowMobileChat(true);
    }
  };

  const onBackToContacts = () => {
    setShowMobileChat(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" id="chat-interface">
      {isMobile ? (
        <MobileLayout
          showChat={showMobileChat}
          onSelectContact={onSelectContact}
          onBackToContacts={onBackToContacts}
          onAddFriend={() => setShowAddFriendModal(true)}
        />
      ) : (
        <div className="flex h-full">
          <Sidebar onAddFriend={() => setShowAddFriendModal(true)} onSelectContact={onSelectContact} />
          <ChatArea />
        </div>
      )}

      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />
    </div>
  );
}
