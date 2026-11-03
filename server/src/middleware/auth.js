import { verifyAccessToken } from '../utils/crypto.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthenticated('Authentication required. Missing Bearer token');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw AppError.unauthenticated('Token expired');
      }
      throw AppError.unauthenticated('Invalid token');
    }

    const user = await User.findById(decoded.userId).populate('company');
    if (!user || !user.isActive) {
      throw AppError.unauthenticated('User not found or account is deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthenticated('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Requires one of the following roles: ${roles.join(', ')}`));
    }
    next();
  };
}

