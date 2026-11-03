import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './connect.js';

async function pingDatabase() {
  console.log('📡 Pinging MongoDB Atlas...');
  const conn = await connectDB();

  try {
    const adminDb = conn.connection.db.admin();
    const result = await adminDb.ping();

    console.log('\n==========================================');
    console.log('🏓 Ping Successful!');
    console.log(`🏷️  Database Name:  "${conn.connection.name}"`);
    console.log(`🌐 Cluster Host:   "${conn.connection.host}"`);
    console.log(`⏱️  Ping Response:  ok=${result.ok}`);
    console.log('==========================================\n');
  } catch (err) {
    console.error('❌ Ping command failed:', err.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

pingDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Ping execution error:', err.message);
    process.exit(1);
  });

