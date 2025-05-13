export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: "online" | "offline";
  lastSeen?: Date;
  createdAt?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: "text" | "image" | "video" | "file";
  mediaUrl?: string;
  status: "sent" | "delivered" | "read";
  createdAt: Date;
}

export interface Friend extends User {
  lastMessage?: {
    content: string;
    createdAt: Date;
    status: string;
  };
}

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  payload: any;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AddFriendFormValues {
  email: string;
}
