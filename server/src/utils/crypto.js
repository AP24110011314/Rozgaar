import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Hash a plain string or token using SHA-256
 * @param {string} token
 * @returns {string} hex hash
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a random cryptographically secure hex token
 * @param {number} [bytes=32]
 * @returns {string}
 */
export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Sign an Access JWT (valid for 15 minutes by default)
 * @param {object} payload
 * @returns {string}
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });
}

/**
 * Verify an Access JWT
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Sign a Refresh JWT with unique jti nonce to ensure uniqueness on rapid rotation
 * @param {object} payload
 * @returns {string}
 */
export function signRefreshToken(payload) {
  return jwt.sign(
    { ...payload, jti: generateRandomToken(16) },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: `${env.JWT_REFRESH_EXPIRY_DAYS}d`,
    }
  );
}

/**
 * Verify a Refresh JWT
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
