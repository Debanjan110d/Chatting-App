import { pgTable, text, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(), // This would be hashed
  avatar: text("avatar"),
  status: text("status").default("offline"),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    email: true,
    name: true,
    password: true,
    avatar: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull().references(() => users.id),
  friendId: serial("friend_id").notNull().references(() => users.id),
  status: text("status").default("pending").notNull(), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFriendSchema = createInsertSchema(friends)
  .pick({
    userId: true,
    friendId: true,
    status: true,
  });

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: serial("sender_id").notNull().references(() => users.id),
  receiverId: serial("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").default("text").notNull(), // text, image, video, file
  mediaUrl: text("media_url"),
  status: text("status").default("sent").notNull(), // sent, delivered, read
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages)
  .pick({
    senderId: true,
    receiverId: true,
    content: true,
    type: true,
    mediaUrl: true,
    status: true,
  });

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// WebRTC signaling schema
export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: number;
  to: number;
  payload: any;
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const addFriendSchema = z.object({
  email: z.string().email(),
});
