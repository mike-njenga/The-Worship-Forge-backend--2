import mongoose from 'mongoose';
import { config } from './index';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      // These options are no longer needed in newer versions of Mongoose
      // but kept for compatibility
    });
    console.log('✅ Database connected successfully.'); 
 
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('');
    console.log('🔧 To fix this issue:');
    console.log('1. Check your MongoDB Atlas connection string in backend/.env');
    console.log('2. Ensure your Atlas cluster is running and accessible');
   
    // Don't exit the process, just log the error and continue
    // This allows the app to run without database for development
  }
};

// Helper function to check if database is connected
export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

export default connectDB;
