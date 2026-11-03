import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/appError.js';
import { env } from '../config/env.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 20, // 20 failed requests per 15 mins (lenient in test)
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
  handler: (req, res, next) => {
    next(AppError.rateLimited('Too many attempts from this IP. Please try again after 15 minutes'));
  },
});

