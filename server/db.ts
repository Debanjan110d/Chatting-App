import { connectDB } from './config/mongodb';

// Initialize MongoDB connection
connectDB().catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});
