import { type User, type Friend, type Message } from "./types";
import { type InsertUser, type InsertFriend, type InsertMessage } from "./schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  createUser(user: InsertUser): Promise<any>;
  updateUserStatus(id: string, status: string): Promise<any>;
  updateLastSeen(id: string): Promise<any>;
  getAllUsers(): Promise<any>;
  
  // Friend operations
  getFriends(userId: string): Promise<any>;
  getFriendRequest(userId: string, friendId: string): Promise<any>;
  createFriendRequest(userId: string, friendId: string): Promise<any>;
  acceptFriendRequest(requestId: string, userId: string): Promise<any>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<any>;
  getMessages(userId: string, friendId: string): Promise<any>;
  getAllMessages(): Promise<any>;
}
