import { connectDB, disconnectDB } from './connect.js';
import {
  User,
  ApplicantProfile,
  Company,
  Job,
  Application,
  Notification,
  Report,
} from '../models/index.js';

async function syncAllIndexes() {
  console.log('🔄 Connecting to MongoDB Atlas for index synchronization...');
  const conn = await connectDB();

  const models = [
    { name: 'User', model: User },
    { name: 'ApplicantProfile', model: ApplicantProfile },
    { name: 'Company', model: Company },
    { name: 'Job', model: Job },
    { name: 'Application', model: Application },
    { name: 'Notification', model: Notification },
    { name: 'Report', model: Report },
  ];

  console.log('\n==========================================');
  console.log(`📑 Synchronizing Indexes on Atlas Database: "${conn.connection.name}"`);
  console.log('==========================================');

  let successCount = 0;

  for (const { name, model } of models) {
    try {
      console.log(`\n⏳ Synchronizing indexes for model: ${name}...`);
      await model.syncIndexes();

      const indexes = await model.collection.indexes();
      console.log(`✅ ${name}: ${indexes.length} index(es) active:`);
      indexes.forEach((idx) => {
        const keys = Object.entries(idx.key)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        const details = [];
        if (idx.unique) details.push('unique');
        if (idx.sparse) details.push('sparse');
        if (idx.weights) details.push('text-weighted');
        const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';
        console.log(`   • ${idx.name} [${keys}]${detailStr}`);
      });

      successCount++;
    } catch (err) {
      console.error(`❌ Failed to sync indexes for ${name}:`, err.message);
    }
  }

  console.log('\n==========================================');
  console.log(`✅ Index synchronization completed: ${successCount}/${models.length} models synced.`);
  console.log('==========================================\n');

  await disconnectDB();
}

syncAllIndexes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Index synchronization failed:', err.message);
    process.exit(1);
  });

