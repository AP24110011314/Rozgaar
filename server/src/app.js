import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/appError.js';
import { authRouter } from './routes/auth.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { jobRouter } from './routes/job.routes.js';
import { companyRouter } from './routes/company.routes.js';
import { applicationRouter } from './routes/application.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { adminRouter } from './routes/admin.routes.js';

export const app = express();

// Trust reverse proxy (Vercel, Render, Cloudflare, loopback)
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

// Security HTTP headers with cross-origin asset allowance
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Compression for text/JSON responses
app.use(compression());

// CORS configuration (supports single origin or comma-separated list)
const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (env.NODE_ENV !== 'production') return callback(null, true);
      return callback(new AppError(`Origin ${origin} not permitted by CORS policy`, 403));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 100kb JSON body limit & urlencoded limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Cookie parsing for refresh tokens
app.use(cookieParser());

// Health check endpoints
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    data: {
      status: 'ok',
      service: 'rozgaar-api',
      name: 'Rozgaar (रोज़गार)',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: dbStatus,
      readyState: mongoose.connection.readyState,
    },
  });
});

app.get('/api/v1/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const dbStatus = isConnected ? 'connected' : 'disconnected';
  const isHealthy = env.NODE_ENV === 'test' || isConnected;
  res.status(isHealthy ? 200 : 503).json({
    data: {
      status: isConnected ? 'ok' : (env.NODE_ENV === 'test' ? 'ok' : 'degraded'),
      service: 'rozgaar-api',
      name: 'Rozgaar (रोज़गार)',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      database: dbStatus,
      readyState: mongoose.connection.readyState,
    },
  });
});

// Root ping
app.get('/', (req, res) => {
  res.status(200).json({
    data: {
      message: 'Rozgaar API is active. Check /health for status.',
      docs: '/api/v1',
    },
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/profile', profileRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/companies', companyRouter);
app.use('/api/v1/applications', applicationRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/admin', adminRouter);

// 404 handler for undefined routes
app.use((req, res, next) => {
  next(AppError.notFound(`Cannot find ${req.method} ${req.originalUrl} on this server`));
});

// Global central error handler
app.use(errorHandler);
