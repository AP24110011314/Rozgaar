import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from cwd or server directory
dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    PORT: z.preprocess(
      (val) => (val === undefined || val === '' ? undefined : Number(val)),
      z
        .number({
          required_error: 'PORT is required in environment variables (e.g. PORT=4000)',
          invalid_type_error: 'PORT must be a valid number',
        })
        .refine((port) => port !== 5000, {
          message:
            'Port 5000 is prohibited on macOS due to AirPlay Receiver collisions. Please use PORT=4000 or another available port.',
        })
    ),

    CLIENT_ORIGIN: z
      .string({
        required_error: 'CLIENT_ORIGIN is required (e.g. CLIENT_ORIGIN=https://app.rozgaar.example)',
      })
      .url('CLIENT_ORIGIN must be a valid URL'),

    API_PUBLIC_URL: z
      .string({
        required_error: 'API_PUBLIC_URL is required (e.g. API_PUBLIC_URL=https://api.rozgaar.example)',
      })
      .url('API_PUBLIC_URL must be a valid URL'),

    MONGODB_URI: z
      .string({
        required_error: 'MONGODB_URI is required in environment variables',
      })
      .min(1, 'MONGODB_URI cannot be empty'),

    JWT_ACCESS_SECRET: z
      .string({
        required_error: 'JWT_ACCESS_SECRET is required (min 32 characters)',
      })
      .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),

    ACCESS_TOKEN_TTL: z.string().default('15m'),
    JWT_ACCESS_EXPIRY: z.string().optional(),

    JWT_REFRESH_SECRET: z
      .string({
        required_error: 'JWT_REFRESH_SECRET is required (min 32 characters)',
      })
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),

    REFRESH_TOKEN_TTL: z.string().default('7d'),
    JWT_REFRESH_EXPIRY_DAYS: z.coerce.number().optional().default(7),

    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    LOCAL_UPLOAD_DIR: z.string().default('./uploads'),

    AWS_REGION: z.string().optional().default('ap-south-1'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional().default('rozgaar-resumes'),
    AWS_S3_BUCKET: z.string().optional(),

    SMTP_HOST: z.string().optional().default('smtp.ethereal.email'),
    SMTP_PORT: z.coerce.number().optional().default(587),
    SMTP_SECURE: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().default('Rozgaar <noreply@rozgaar.local>'),

    SEED_ALLOW: z.string().optional().default('false'),
    SEED_DEMO_PASSWORD: z.string().optional().default('RozgaarDemo2026!'),
  })
  .superRefine((data, ctx) => {
    if (data.STORAGE_DRIVER === 's3') {
      if (!data.AWS_ACCESS_KEY_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AWS_ACCESS_KEY_ID'],
          message: 'AWS_ACCESS_KEY_ID is required when STORAGE_DRIVER is "s3"',
        });
      }
      if (!data.AWS_SECRET_ACCESS_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['AWS_SECRET_ACCESS_KEY'],
          message: 'AWS_SECRET_ACCESS_KEY is required when STORAGE_DRIVER is "s3"',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ ==========================================');
  console.error('❌ Server startup halted: Invalid or missing environment variables');
  console.error('❌ ==========================================');
  parsed.error.errors.forEach((err) => {
    console.error(`  • [${err.path.join('.') || 'CONFIG'}]: ${err.message}`);
  });
  console.error('❌ ==========================================\n');
  process.exit(1);
}

// Normalized environment configuration
export const env = {
  ...parsed.data,
  ACCESS_TOKEN_TTL: parsed.data.ACCESS_TOKEN_TTL || parsed.data.JWT_ACCESS_EXPIRY || '15m',
  JWT_ACCESS_EXPIRY: parsed.data.ACCESS_TOKEN_TTL || parsed.data.JWT_ACCESS_EXPIRY || '15m',
  REFRESH_TOKEN_TTL: parsed.data.REFRESH_TOKEN_TTL || `${parsed.data.JWT_REFRESH_EXPIRY_DAYS}d`,
  JWT_REFRESH_EXPIRY_DAYS: parsed.data.JWT_REFRESH_EXPIRY_DAYS || 7,
  S3_BUCKET: parsed.data.S3_BUCKET || parsed.data.AWS_S3_BUCKET || 'rozgaar-resumes',
  AWS_S3_BUCKET: parsed.data.S3_BUCKET || parsed.data.AWS_S3_BUCKET || 'rozgaar-resumes',
  APP_URL: parsed.data.CLIENT_ORIGIN,
};
