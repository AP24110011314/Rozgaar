#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
if (!process.env.STORAGE_DRIVER) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

import { storageService } from '../src/services/storage.service.js';

async function checkStorage() {
  console.log('\n======================================================');
  console.log('📦 Rozgaar Storage Verification Check');
  console.log('======================================================');
  console.log(`Driver: ${storageService.driver}`);

  const testKey = `test-verify-${Date.now()}.pdf`;
  const testBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');

  try {
    console.log('1. Uploading test file...');
    const uploadResult = await storageService.uploadFile({
      buffer: testBuffer,
      originalFilename: 'test-verify.pdf',
      mimeType: 'application/pdf',
      customKey: testKey,
      prefix: 'resumes/',
    });
    console.log(`   ✅ Uploaded key: ${uploadResult.key}`);

    console.log('2. Generating download / presigned URL...');
    const downloadUrl = await storageService.getDownloadUrl(uploadResult.key, 'test-verify.pdf');
    console.log(`   ✅ URL generated: ${downloadUrl.slice(0, 70)}...`);

    if (storageService.driver === 's3') {
      console.log('3. Fetching presigned S3 URL...');
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`S3 fetch returned HTTP ${res.status}: ${res.statusText}`);
      }
      console.log(`   ✅ Successfully retrieved from S3 (${res.status} ${res.statusText})`);
    } else {
      console.log('3. Verifying local storage stream...');
      const stream = storageService.getLocalStream(uploadResult.key);
      if (!stream) {
        throw new Error('Failed to open local file stream');
      }
      stream.destroy();
      console.log('   ✅ Successfully verified local file stream');
    }

    console.log('4. Deleting test file...');
    await storageService.deleteFile(uploadResult.key);
    console.log('   ✅ Cleaned up test file from storage');

    console.log('\n✨ Storage verification passed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Storage verification failed:', err.message);
    process.exit(1);
  }
}

checkStorage();
