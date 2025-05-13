import { User, Friend, Message } from '../config/mongodb';
import { IStorage } from '../storage';
import { type InsertUser, type InsertMessage } from '../../shared/types';

export class MongoDBStorage implements IStorage {
  async getUser(id: string) {
    return await User.findById(id);
  }

  async getUserByEmail(email: string) {
    return await User.findOne({ email });
  }

  async createUser(user: InsertUser) {
    const newUser = new User(user);
    return await newUser.save();
  }

  async getFriends(userId: string) {
    return await Friend.find({ userId })
      .populate('friendId', 'name email status lastSeen')
      .exec();
  }

  // Create a friend request between users
  async createFriendRequest(userId: string, friendId: string) {
    const newFriend = new Friend({ userId, friendId, status: 'pending' });
    return await newFriend.save();
  }

  // Get a specific friend request regardless of direction
  async getFriendRequest(userId: string, friendId: string) {
    return await Friend.findOne({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ]
    });
  }

  // Accept a friend request
  async acceptFriendRequest(requestId: string, userId: string) {
    const request = await Friend.findById(requestId);
    if (!request) throw new Error('Friend request not found');
    if (request.friendId.toString() !== userId) throw new Error('Not authorized');
    request.status = 'accepted';
    return await request.save();
  }

  async getMessages(userId: string, friendId: string) {
    return await Message.find({
      $or: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });
  }

  async createMessage(message: InsertMessage) {
    const newMessage = new Message(message);
    return await newMessage.save();
  }

  async updateUserStatus(userId: string, status: string) {
    return await User.findByIdAndUpdate(
      userId,
      { status, lastSeen: new Date() },
      { new: true }
    );
  }

  async searchUsers(query: string) {
    return await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    });
  }

  // Get all users (admin)
  async getAllUsers() {
    return await User.find();
  }

  // Get all messages (admin)
  async getAllMessages() {
    return await Message.find();
  }

  // Update user's last seen timestamp
  async updateLastSeen(userId: string) {
    return await User.findByIdAndUpdate(
      userId,
      { lastSeen: new Date() },
      { new: true }
    );
  }
}

// Export a singleton storage instance
export const storage = new MongoDBStorage();
