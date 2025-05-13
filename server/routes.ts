import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage/mongoStorage";
import { z } from "zod";
import { SignalData, loginSchema, registerSchema, addFriendSchema } from "@shared/schema";
import { handleWebRTCSignaling } from "./webrtc";
import bcrypt from "bcryptjs";
import mongoose from 'mongoose';
import { Friend as FriendModel } from "./config/mongodb";
import { Message } from "./config/mongodb";

interface ConnectedClient {
  userId: string;
  socket: WebSocket;
  email: string;
}

// Store connected clients and their websocket connections (keyed by userId string)
const connectedClients: Map<string, ConnectedClient> = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) return res.status(400).json({ message: "User already exists" });
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const newUser = await storage.createUser({
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword
      });
      // Map _id to id and omit password
      const userObj = newUser.toObject();
      const { password, _id, ...rest } = userObj;
      res.status(201).json({ id: _id.toString(), ...rest });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Could not register user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const foundUser = await storage.getUserByEmail(validatedData.email);
      if (!foundUser) return res.status(400).json({ message: "Invalid credentials" });
      const passwordValid = await bcrypt.compare(validatedData.password, foundUser.password);
      if (!passwordValid) return res.status(400).json({ message: "Invalid credentials" });
      await storage.updateUserStatus(foundUser._id.toString(), "online");
      const userObj = (foundUser as any).toObject();
      const { password, _id, ...rest } = userObj;
      res.status(200).json({ id: _id.toString(), ...rest });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Could not login" });
    }
  });

  // User routes
  app.get('/api/users/me', async (req, res) => {
    const uid = req.headers["user-id"] as string;
    if (!uid) return res.status(401).json({ message: "Unauthorized" });
    try {
      const foundUser = await storage.getUser(uid);
      if (!foundUser) return res.status(404).json({ message: "User not found" });
      const userObj = (foundUser as any).toObject();
      const { password, _id, ...rest } = userObj;
      res.status(200).json({ id: _id.toString(), ...rest });
    } catch (error) {
      res.status(500).json({ message: "Could not fetch user" });
    }
  });
  
  // Admin routes
  // Middleware to check if user is admin
  const isAdmin = async (req: any, res: any, next: any) => {
    const userId = req.headers["user-id"];
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUser(Number(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // For example purposes, we're using ID 1 as admin
      // In a real app, you'd have a role or isAdmin field
      if (user.id !== 1) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking admin status" });
    }
  };
  
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Could not fetch users" });
    }
  });
  
  app.get('/api/admin/messages', isAdmin, async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Could not fetch messages" });
    }
  });

  // Friend routes
  app.post('/api/friends/request', async (req, res) => {
    const userId = req.headers["user-id"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const validatedData = addFriendSchema.parse(req.body);
      
      // Find friend by email
      const friend = await storage.getUserByEmail(validatedData.email);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if friend request already exists
      const existingRequest = await storage.getFriendRequest(userId, friend.id.toString());
      if (existingRequest) {
        return res.status(400).json({ message: "Friend request already exists" });
      }
      
      // Create friend request
      const request = await storage.createFriendRequest(userId, friend.id.toString());
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Could not send friend request" });
    }
  });

  app.get('/api/friends', async (req, res) => {
    const userId = req.headers["user-id"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Outgoing requests and accepted friends
      const outgoing = await storage.getFriends(userId);
      // Incoming pending requests
      const incoming = await FriendModel.find({ friendId: userId, status: 'pending' })
        .populate('userId', 'name email status lastSeen')
        .exec();
      // Combine and map to unified Friend shape
      const result = [
        ...outgoing.map(r => ({ doc: r, isIncoming: false })),
        ...incoming.map(r => ({ doc: r, isIncoming: true }))
      ].map(({ doc, isIncoming }) => {
        const u = isIncoming ? (doc as any).userId : (doc as any).friendId;
        return {
          id: u.id || u._id.toString(),
          email: u.email,
          name: u.name,
          status: u.status,
          lastSeen: u.lastSeen,
          createdAt: u.createdAt,
          lastMessage: undefined,
          pending: doc.status === 'pending',
        };
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Could not fetch friends" });
    }
  });

  app.post('/api/friends/accept', async (req, res) => {
    const userId = req.headers["user-id"];
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { requestId } = req.body;
      
      // Accept friend request
      const request = await storage.acceptFriendRequest(requestId as string, userId as string);
      res.status(200).json(request);
    } catch (error) {
      res.status(500).json({ message: "Could not accept friend request" });
    }
  });

  // Message routes
  // Fetch pending messages for current user
  app.get('/api/messages/pending', async (req, res) => {
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
      const oid = new mongoose.Types.ObjectId(userId);
      const pending = await Message.find({ receiverId: oid });
      const toSend = pending.map(p => p.toJSON());
      await Message.deleteMany({ receiverId: oid });
      res.status(200).json(toSend);
    } catch (err) {
      res.status(500).json({ message: 'Could not fetch pending messages' });
    }
  });

  app.post('/api/messages', async (req, res) => {
    const userId = req.headers["user-id"] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { receiverId, content, type = "text", mediaUrl } = req.body;
      // Create message with string IDs
      const message = await storage.createMessage({
        senderId: userId,
        receiverId: receiverId as string,
        content,
        type,
        mediaUrl,
        status: "sent"
      });
      // Broadcast to receiver if online
      const client = Array.from(connectedClients.values()).find(c => c.userId === receiverId);
      if (client && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({ type: 'new-message', message }));
      }
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ message: "Could not send message" });
    }
  });

  app.get('/api/messages/:friendId', async (req, res) => {
    const userId = req.headers["user-id"];
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { friendId } = req.params;
      
      // Get messages
      const messages = await storage.getMessages(userId as string, friendId as string);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Could not fetch messages" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server for WebRTC signaling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (socket: WebSocket) => {
    let clientId: string | null = null;
    let clientEmail: string | null = null;

    socket.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'auth') {
          // Authenticate user
          const user = await storage.getUser(data.userId as string);
          if (!user) {
            socket.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
            return;
          }

          clientId = user.id.toString();
          clientEmail = user.email;

          // Store client connection
          if (clientId) connectedClients.set(clientId, { userId: clientId, socket, email: clientEmail });

          // Update user status
          if (clientId) await storage.updateUserStatus(clientId, "online");

          // Broadcast online status update
          const clientList = Array.from(connectedClients.values()).map(client => ({ userId: client.userId, email: client.email }));
          wss.clients.forEach(c => {
            if (c.readyState === WebSocket.OPEN) {
              c.send(JSON.stringify({ type: 'clients', clients: clientList }));
            }
          });
          // Notify client to trigger pending fetch
          socket.send(JSON.stringify({ type: 'auth-success' }));

          // Deliver pending messages
          if (clientId) {
            const oid = new mongoose.Types.ObjectId(clientId);
            const pending = await Message.find({ receiverId: oid });
            pending.forEach(msg => socket.send(JSON.stringify({ type: 'new-message', message: msg })));
            await Message.deleteMany({ receiverId: oid });
          }

        } else if (data.type === 'signal') {
          // Handle WebRTC signaling
          if (!clientId) {
            socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }

          const signalData: SignalData = {
            type: data.signalType,
            from: clientId,
            to: data.to,
            payload: data.payload
          };

          handleWebRTCSignaling(signalData, connectedClients);
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    socket.on('close', async () => {
      if (clientId) {
        // Update user status when disconnected
        await storage.updateUserStatus(clientId, "offline");
        await storage.updateLastSeen(clientId);
        
        // Remove client from connected clients
        connectedClients.delete(clientId);
        
        // Broadcast offline status to all clients
        const clientList = Array.from(connectedClients.values()).map(client => ({
          userId: client.userId,
          email: client.email
        }));
        
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: 'clients', 
              clients: clientList
            }));
          }
        });
      }
    });
  });

  return httpServer;
}
