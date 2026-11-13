import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri || config.mongoUri;
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] Connected to MongoDB Atlas at ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
