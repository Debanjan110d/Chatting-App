export interface User {
  _id: string;
  email: string;
  name: string;
  password: string;
  avatar?: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  createdAt: Date;
}

export interface Friend {
  _id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  createdAt: Date;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'media';
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
}

export interface WebRTCSignal {
  type: string;
  senderId: string;
  receiverId: string;
  data: any;
}
