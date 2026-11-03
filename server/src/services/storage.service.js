import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';

class StorageService {
  constructor() {
    this.driver = env.STORAGE_DRIVER;
    this.localDir = path.resolve(env.LOCAL_UPLOAD_DIR);

    if (this.driver === 's3') {
      this.s3Client = new S3Client({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });
      this.bucket = env.AWS_S3_BUCKET;
    } else {
      // Ensure local upload dir exists
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
    }
  }

  /**
   * Upload file to storage driver
   * @param {object} params
   * @param {Buffer} params.buffer
   * @param {string} params.originalFilename
   * @param {string} params.mimeType
   * @param {string} [params.ext='pdf']
   * @param {string} [params.customKey=null]
   * @param {string} [params.prefix='']
   * @returns {Promise<{ key: string, filename: string, mime: string, size: number }>}
   */
  async uploadFile({ buffer, originalFilename, mimeType, ext = 'pdf', customKey = null, prefix = '' }) {
    // Generate UUID object key (never use client filenames in storage paths)
    const rawKey = customKey || `${crypto.randomUUID()}.${ext}`;
    const key = this.driver === 's3' && prefix ? `${prefix}${rawKey}` : rawKey;

    if (this.driver === 's3') {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(command);
    } else {
      const filePath = path.join(this.localDir, key);
      await fs.promises.writeFile(filePath, buffer);
    }

    return {
      key,
      filename: originalFilename,
      mime: mimeType,
      size: buffer.length,
    };
  }

  /**
   * Delete file from storage driver
   * @param {string} key
   */
  async deleteFile(key) {
    if (!key) return;

    try {
      if (this.driver === 's3') {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });
        await this.s3Client.send(command);
      } else {
        const filePath = path.join(this.localDir, key);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch (err) {
      console.error(`⚠️ Failed to delete file ${key} from storage:`, err.message);
    }
  }

  /**
   * Get secure download URL valid for 300 seconds (5 minutes)
   * @param {string} key
   * @param {string} [originalFilename='resume.pdf']
   * @returns {Promise<string>}
   */
  async getDownloadUrl(key, originalFilename = 'resume.pdf') {
    if (this.driver === 's3') {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
      });
      return getSignedUrl(this.s3Client, command, { expiresIn: 300 });
    }

    // Local driver uses authenticated download endpoint
    return `${env.API_PUBLIC_URL}/api/v1/profile/resumes/raw/${key}`;
  }

  /**
   * Get local file stream for local driver download
   * @param {string} key
   * @returns {fs.ReadStream}
   */
  getLocalStream(key) {
    const filePath = path.join(this.localDir, key);
    if (!fs.existsSync(filePath)) {
      throw AppError.notFound('File not found on server');
    }
    return fs.createReadStream(filePath);
  }
}

export const storageService = new StorageService();

