import mongoose from 'mongoose';
import { env } from '../config/env.js';

let isShuttingDown = false;

export async function connectDB() {
  try {
    mongoose.set('strictQuery', true);

    const connectionOptions = {
      serverSelectionTimeoutMS: 8000,
      retryWrites: true,
      maxPoolSize: 20,
      minPoolSize: 2,
    };

    const conn = await mongoose.connect(env.MONGODB_URI, connectionOptions);

    if (env.NODE_ENV !== 'test') {
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
    }

    mongoose.connection.on('error', (err) => {
      if (!isShuttingDown) {
        console.error('❌ MongoDB Atlas connection error:', err.message);
      }
    });

    mongoose.connection.on('disconnected', () => {
      if (!isShuttingDown && env.NODE_ENV !== 'test') {
        console.warn('⚠️ MongoDB Atlas disconnected. Attempting automatic reconnection...');
      }
    });

    return conn;
  } catch (error) {
    console.error('\n❌ ==========================================');
    console.error('❌ Failed to connect to MongoDB Atlas:');
    console.error(`❌ ${error.message}`);
    console.error('❌ ------------------------------------------');
    console.error('❌ Common causes for Atlas connection failures:');
    console.error('❌  1. IP Access: Your current public IP is not allow-listed in Atlas Network Access (Add IP or 0.0.0.0/0).');
    console.error('❌  2. Authentication: Incorrect username or password in MONGODB_URI.');
    console.error('❌  3. URL Encoding: Special characters in your password (e.g. @, #, $, %, :, /) must be URL-encoded (e.g. @ -> %40).');
    console.error('❌  4. Privileges: The Atlas database user lacks readWriteAnyDatabase or readWrite@rozgaar role.');
    console.error('❌  5. Network / DNS: Local router or corporate firewall blocking SRV records on port 27017.');
    console.error('❌ ==========================================\n');
    process.exit(1);
  }
}

export async function disconnectDB() {
  isShuttingDown = true;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

// Graceful process signal listener
const gracefulClose = async (signal) => {
  if (mongoose.connection.readyState !== 0) {
    isShuttingDown = true;
    try {
      await mongoose.disconnect();
      if (env.NODE_ENV !== 'test') {
        console.log(`🔒 MongoDB Atlas connection closed via ${signal}`);
      }
    } catch (err) {
      console.error('Error closing MongoDB connection:', err.message);
    }
  }
};

process.on('SIGINT', () => gracefulClose('SIGINT'));
process.on('SIGTERM', () => gracefulClose('SIGTERM'));
