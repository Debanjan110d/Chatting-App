import { connectDB, User } from '../server/config/mongodb';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create test users
    const testUsers = [
      {
        email: 'test1@example.com',
        name: 'Test User 1',
        password: await bcrypt.hash('password123', 10),
        status: 'offline'
      },
      {
        email: 'test2@example.com',
        name: 'Test User 2',
        password: await bcrypt.hash('password123', 10),
        status: 'offline'
      }
    ];

    await User.insertMany(testUsers);
    console.log('Created test users');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
