const serverless = require('serverless-http');
import express, { type Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from '../../../server/config/mongodb';
import { registerRoutes } from '../../../server/routes';

const app = express();

// Enable CORS for all origins
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,      // only allow requests from specified frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,                     // allow cookies/auth headers
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Reuse MongoDB connection across invocations
let isDbConnected = false;
const ensureDb = async () => {
  if (!isDbConnected) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('Missing MONGO_URI environment variable');
    await connectDB(); // connectDB uses process.env.MONGO_URI internally
    isDbConnected = true;
  }
};

// Attach DB connection before each request
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});

// Register API routes from server
registerRoutes(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Lambda error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

// Wrap Express app in serverless handler, disable waiting for empty event loop
const lambdaHandler = serverless(app);
export const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return lambdaHandler(event, context);
};