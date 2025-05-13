import { useState, ChangeEvent, FormEvent } from "react";
import { Paperclip, Smile, Send } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";

export default function MessageInput() {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { sendMessage, selectedFriend } = useChat();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !selectedFriend) return;
    
    await sendMessage(message);
    setMessage("");
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFriend) return;
    
    // Check file type
    const fileType = file.type.split('/')[0];
    if (!['image', 'video'].includes(fileType)) {
      alert('Only image and video files are supported');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // In a real app, upload the file to a storage service and get a URL
      // For this example, we'll create a data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const mediaUrl = event.target?.result as string;
        await sendMessage(
          `Sent ${fileType === 'image' ? 'an image' : 'a video'}`, 
          fileType, 
          mediaUrl
        );
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      setIsUploading(false);
    }
    
    // Clear the input
    e.target.value = '';
  };

  return (
    <div className="p-3 border-t border-divider bg-white">
      <form onSubmit={handleSubmit} className="flex items-center">
        <input 
          type="file" 
          id="file-upload" 
          className="hidden" 
          accept="image/*,video/*" 
          onChange={handleFileUpload}
          disabled={isUploading || !selectedFriend}
        />
        <label 
          htmlFor="file-upload" 
          className="p-2 rounded-full hover:bg-light transitions text-gray-500 cursor-pointer"
        >
          <Paperclip className="h-5 w-5" />
        </label>
        
        <div className="relative flex-1 mx-3">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="w-full pl-4 pr-10 py-2 bg-light text-black placeholder-gray-500 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={!selectedFriend}
          />
          <button 
            type="button" 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={!selectedFriend}
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>
        
        <Button 
          type="submit" 
          size="icon"
          className="p-2 rounded-full hover:bg-primary/90 transitions" 
          disabled={!message.trim() || !selectedFriend || isUploading}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
