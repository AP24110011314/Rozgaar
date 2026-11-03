# 07 – Backend Implementation Guide

## Folder structure
```
server/src/
├── server.js              # connect DB, start listening
├── app.js                 # express app, middleware, routes
├── config/env.js          # validated env (zod)
├── db/connect.js
├── models/                # User, ApplicantProfile, Company, Job, Application
├── routes/                # auth, profile, companies, jobs, applications
├── controllers/
├── services/              # applicationService, storageService, mailService, tokenService
├── middleware/            # auth, requireRole, validate, upload, errorHandler, rateLimit
├── validators/            # zod schemas
├── utils/                 # AppError, asyncHandler, serializers
└── tests/
```

## env.js
```js
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  CLIENT_ORIGIN: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  AWS_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional()
});
export const env = schema.parse(process.env);
```

## app.js
```js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
export default app;
```
Express 5 note: async handler errors propagate to the error middleware automatically. On Express 4 wrap handlers with `asyncHandler`.

## server.js
```js
import mongoose from 'mongoose';
import app from './app.js';
import { env } from './config/env.js';

await mongoose.connect(env.MONGODB_URI);
const server = app.listen(env.PORT, () => console.log(`API listening on port ${env.PORT}`));
process.on('SIGTERM', () => server.close(() => mongoose.disconnect()));
```

## Auth middleware
```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function requireAuth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Missing token');
  try {
    const p = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: p.sub, role: p.role, company: p.company };
    next();
  } catch {
    throw new AppError(401, 'UNAUTHENTICATED', 'Invalid or expired token');
  }
}

export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError(403, 'FORBIDDEN', 'Not allowed');
  next();
};
```

## Validation middleware
```js
export const validate = (schema) => (req, _res, next) => {
  const r = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!r.success) throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input', r.error.issues);
  Object.assign(req, r.data);
  next();
};
```

## Upload (Multer, memory storage)
```js
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { AppError } from '../utils/AppError.js';

const ALLOWED = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
}).single('resume');

// run AFTER multer: verify real file type from bytes, not the client header
export async function verifyResume(req, _res, next) {
  if (!req.file) throw new AppError(400, 'VALIDATION_ERROR', 'resume file required');
  const type = await fileTypeFromBuffer(req.file.buffer);
  if (!type || !ALLOWED.has(type.mime)) throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'PDF or DOCX only');
  req.file.detectedMime = type.mime;
  req.file.detectedExt = type.ext;
  next();
}
```
Legacy `.doc` is intentionally excluded (hard to verify, higher risk). Add later if needed.

## Storage service (S3 + local)
```js
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

const s3 = env.STORAGE_DRIVER === 's3' ? new S3Client({ region: env.AWS_REGION }) : null;

export async function saveResume(userId, file) {
  const key = `resumes/${userId}/${randomUUID()}.${file.detectedExt}`;
  if (s3) {
    await s3.send(new PutObjectCommand({
      Bucket: env.S3_BUCKET, Key: key, Body: file.buffer,
      ContentType: file.detectedMime, ServerSideEncryption: 'AES256'
    }));
  } else {
    const full = path.join('uploads', key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, file.buffer);
  }
  return key;
}

export async function getDownloadUrl(key, filename) {
  if (s3) {
    return getSignedUrl(s3, new GetObjectCommand({
      Bucket: env.S3_BUCKET, Key: key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(filename)}"`
    }), { expiresIn: 300 });
  }
  return `${env.API_PUBLIC_URL}/api/v1/dev-files/${encodeURIComponent(key)}`; // dev only, auth-checked route
}

export async function deleteFile(key) {
  if (s3) return s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  return fs.rm(path.join('uploads', key), { force: true });
}
```

## Application service: stage transitions
```js
import { Application } from '../models/Application.js';
import { AppError } from '../utils/AppError.js';
import { notifyStageChange } from './mailService.js';

const STAGES = ['applied', 'reviewing', 'interviewing', 'offered', 'hired', 'rejected'];

export async function changeStage({ appId, user, stage, message, beforeId, afterId }) {
  if (!STAGES.includes(stage)) throw new AppError(400, 'VALIDATION_ERROR', 'Invalid stage');

  const app = await Application.findById(appId).populate('job', 'title');
  if (!app) throw new AppError(404, 'NOT_FOUND', 'Application not found');
  if (String(app.company) !== String(user.company)) throw new AppError(403, 'FORBIDDEN', 'Not your company');
  if (app.stage === 'withdrawn') throw new AppError(409, 'CONFLICT', 'Application was withdrawn');

  // compute fractional position
  const [before, after] = await Promise.all([
    beforeId ? Application.findById(beforeId).select('position') : null,
    afterId ? Application.findById(afterId).select('position') : null
  ]);
  if (before && after) app.position = (before.position + after.position) / 2;
  else if (after) app.position = after.position + 1024;
  else if (before) app.position = before.position - 1024;
  else {
    const last = await Application.findOne({ job: app.job._id, stage }).sort({ position: -1 }).select('position');
    app.position = (last?.position ?? 0) + 1024;
  }

  const changed = app.stage !== stage;
  if (changed) {
    app.stage = stage;
    app.stageHistory.push({ stage, changedBy: user.id, message });
  }
  await app.save();

  if (changed) notifyStageChange(app).catch((e) => console.error('mail failed', e)); // fire and forget
  return app;
}
```

## Applicant-facing serializer
```js
export function publicApplication(a) {
  return {
    id: a.id, job: a.job, stage: a.stage, createdAt: a.createdAt, updatedAt: a.updatedAt,
    timeline: a.stageHistory.map(({ stage, message, at }) => ({ stage, message, at }))
    // notes, rating, changedBy intentionally omitted
  };
}
```

## Duplicate application guard
```js
try {
  await Application.create({ job, applicant, company, resume, coverNote, stageHistory: [{ stage: 'applied' }] });
} catch (e) {
  if (e.code === 11000) throw new AppError(409, 'CONFLICT', 'You already applied to this job');
  throw e;
}
```

## Geo search query
```js
const filter = { status: 'open' };
if (q) filter.$text = { $search: q };
if (lat && lng) {
  filter['location.geo'] = {
    $nearSphere: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: radiusKm * 1000 }
  };
}
```
Note: `$text` combined with `$nearSphere` in one query is not allowed. When both are present, use an aggregation with `$geoNear` then match text with regex, or run text search and filter distance in code (fine for the MVP).

## Error handler
```js
export function notFound(_req, _res, next) { next(new AppError(404, 'NOT_FOUND', 'Route not found')); }
export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: {
    code: err.code || 'INTERNAL', message: status === 500 ? 'Something went wrong' : err.message, details: err.details
  }});
}
```
