import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

let MONGODB_URI = process.env.MONGODB_URI;
let mongoServer: MongoMemoryServer;

export const connectDB = async () => {
  try {
    if (!MONGODB_URI && process.env.NODE_ENV === 'development') {
      mongoServer = await MongoMemoryServer.create();
      MONGODB_URI = mongoServer.getUri();
      console.log('Using in-memory MongoDB for development');
    }
    await mongoose.connect(MONGODB_URI || 'mongodb://127.0.0.1:27017/peerconnect');
    console.log('MongoDB Connected Successfully!', MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Graceful shutdown for in-memory server
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  process.exit(0);
});

// Create schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  // avatar field removed to save storage
  status: { type: String, default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});
// Transform output: map _id to id, remove __v and password
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
  }
});

const friendSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'text' },
  mediaUrl: String,
  status: { type: String, default: 'sent' },
  createdAt: { type: Date, default: Date.now }
});
// Transform output: map _id to id, convert ObjectIds to strings
messageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    ret.senderId = ret.senderId.toString();
    ret.receiverId = ret.receiverId.toString();
    delete ret._id;
  }
});

// Create models
export const User = mongoose.model('User', userSchema);
export const Friend = mongoose.model('Friend', friendSchema);
export const Message = mongoose.model('Message', messageSchema);
