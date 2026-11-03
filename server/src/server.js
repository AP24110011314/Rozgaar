import fs from 'node:fs';
import path from 'node:path';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './db/connect.js';

// Pre-startup check: Explicit rejection of port 5000
if (Number(env.PORT) === 5000) {
  console.error('\n❌ ==========================================');
  console.error('❌ Prohibited Port 5000: macOS AirPlay Receiver reserves port 5000.');
  console.error('❌ Please set PORT=4000 (or another available port) in your server/.env file.');
  console.error('❌ ==========================================\n');
  process.exit(1);
}

// Ensure local upload directory exists if local storage driver is used
if (env.STORAGE_DRIVER === 'local') {
  const uploadDir = path.resolve(env.LOCAL_UPLOAD_DIR);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Created local upload directory: ${uploadDir}`);
  }
}

// Connect to MongoDB
await connectDB();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Rozgaar API running in ${env.NODE_ENV} mode on ${env.API_PUBLIC_URL}`);
  console.log(`🔗 Allowed CORS origin: ${env.CLIENT_ORIGIN}`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('🔒 HTTP server closed');
    await disconnectDB();
    console.log('🔒 MongoDB connection closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
